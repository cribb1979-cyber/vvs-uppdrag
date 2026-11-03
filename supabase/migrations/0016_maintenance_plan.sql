-- Drift- och underhållsplan: elevens skriftliga dokumentation per uppdrag.
--
-- Planen hör till deltagaren (inte till uppdraget), så varje elev skriver sin
-- egen. Läraren läser den via get_uppdrag_svar.

alter table public.assignment_participants
  add column if not exists maintenance_plan text not null default '',
  add column if not exists maintenance_plan_saved_at timestamptz;

create or replace function public.save_maintenance_plan(p_participant_id uuid, p_text text)
returns void language plpgsql security definer set search_path = public, extensions
as $fn$
begin
  update public.assignment_participants
  set maintenance_plan = coalesce(p_text, ''),
      maintenance_plan_saved_at = now()
  where id = p_participant_id
    and (
      auth_uid = auth.uid()
      or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
    );
  if not found then
    raise exception 'Kunde inte spara planen (okänd session).';
  end if;
end;
$fn$;

grant execute on function public.save_maintenance_plan(uuid, text) to authenticated;

create or replace function public.join_session(session_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions
as $fn$
declare
  sess public.student_sessions;
  assign public.assignments;
  participant public.assignment_participants;
begin
  if auth.uid() is null then raise exception 'Ingen elevsession -- logga in anonymt först.'; end if;
  select * into sess from public.student_sessions where code = upper(trim(session_code));
  if sess.id is null then raise exception 'Okänd uppdragskod.'; end if;
  if sess.revoked_at is not null then raise exception 'Uppdraget har avslutats.'; end if;
  if sess.expires_at <= now() then raise exception 'Uppdraget har avslutats.'; end if;

  select * into assign from public.assignments where id = sess.assignment_id;

  insert into public.assignment_participants (assignment_id, session_id, auth_uid)
  values (sess.assignment_id, sess.id, auth.uid())
  on conflict (session_id, auth_uid) where session_id is not null
  do update set session_id = excluded.session_id
  returning * into participant;

  return jsonb_build_object(
    'participant_id', participant.id,
    'session_expires_at', sess.expires_at,
    'assignment', jsonb_build_object(
      'id', assign.id, 'title', assign.title, 'description', assign.description,
      'kind', assign.kind, 'reveal_mode', assign.reveal_mode, 'ai_mode', assign.ai_mode,
      'steps', assign.steps, 'goal', assign.goal, 'self_check_items', assign.self_check_items,
      'reflection_questions', assign.reflection_questions,
      'reference_image_path', case when assign.reveal_mode = 'full' then assign.reference_image_path else null end
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at,
    'self_check', participant.self_check,
    'self_check_submitted_at', participant.self_check_submitted_at,
    'reflection', participant.reflection,
    'reflection_submitted_at', participant.reflection_submitted_at,
    'maintenance_plan', participant.maintenance_plan,
    'maintenance_plan_saved_at', participant.maintenance_plan_saved_at
  );
end;
$fn$;

create or replace function public.open_assignment_as_student(p_assignment_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions
as $fn$
declare
  my_student_id uuid;
  my_class_id uuid;
  assign public.assignments;
  participant public.assignment_participants;
  has_access boolean;
begin
  if auth.uid() is null then raise exception 'Ingen session -- logga in anonymt först.'; end if;
  select s.id, s.class_id into my_student_id, my_class_id
  from public.student_links sl join public.students s on s.id = sl.student_id
  where sl.auth_uid = auth.uid() and s.revoked_at is null limit 1;
  if my_student_id is null then raise exception 'Ingen elevkod kopplad till den här enheten.'; end if;

  select * into assign from public.assignments where id = p_assignment_id;
  if assign.id is null or assign.status <> 'active' then raise exception 'Uppdraget är inte tillgängligt.'; end if;

  select exists (
    select 1 from public.assignment_assignments aa
    where aa.assignment_id = p_assignment_id
      and (aa.student_id = my_student_id or aa.class_id = my_class_id)
  ) into has_access;
  if not has_access then raise exception 'Det här uppdraget är inte tilldelat dig.'; end if;

  insert into public.assignment_participants (assignment_id, student_id)
  values (p_assignment_id, my_student_id)
  on conflict (assignment_id, student_id) where student_id is not null
  do update set assignment_id = excluded.assignment_id
  returning * into participant;

  return jsonb_build_object(
    'participant_id', participant.id,
    'session_expires_at', null,
    'assignment', jsonb_build_object(
      'id', assign.id, 'title', assign.title, 'description', assign.description,
      'kind', assign.kind, 'reveal_mode', assign.reveal_mode, 'ai_mode', assign.ai_mode,
      'steps', assign.steps, 'goal', assign.goal, 'self_check_items', assign.self_check_items,
      'reflection_questions', assign.reflection_questions,
      'reference_image_path', case when assign.reveal_mode = 'full' then assign.reference_image_path else null end
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at,
    'self_check', participant.self_check,
    'self_check_submitted_at', participant.self_check_submitted_at,
    'reflection', participant.reflection,
    'reflection_submitted_at', participant.reflection_submitted_at,
    'maintenance_plan', participant.maintenance_plan,
    'maintenance_plan_saved_at', participant.maintenance_plan_saved_at
  );
end;
$fn$;

create or replace function public.get_uppdrag_svar(p_assignment_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions
as $fn$
declare
  assign public.assignments;
begin
  select * into assign from public.assignments
  where id = p_assignment_id
    and org_id = (select org_id from public.current_teacher());
  if assign.id is null then raise exception 'Uppdraget finns inte i din org.'; end if;

  return jsonb_build_object(
    'self_check_items', assign.self_check_items,
    'reflection_questions', assign.reflection_questions,
    'deltagare', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'namn', coalesce(ap.display_name, s.name, '(namnlös)'),
        'self_check', ap.self_check,
        'self_check_at', ap.self_check_submitted_at,
        'reflection', ap.reflection,
        'reflection_at', ap.reflection_submitted_at,
        'maintenance_plan', ap.maintenance_plan,
        'maintenance_plan_at', ap.maintenance_plan_saved_at
      ) order by ap.joined_at), '[]'::jsonb)
      from public.assignment_participants ap
      left join public.students s on s.id = ap.student_id
      where ap.assignment_id = p_assignment_id
    )
  );
end;
$fn$;
