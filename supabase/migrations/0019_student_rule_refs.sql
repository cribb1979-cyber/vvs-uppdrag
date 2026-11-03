-- Skicka med uppdragets Säkervatten-regler till elevvyn.
--
-- Reglerna sparas redan i assignments.rule_refs av lärarvyn. Nu följer de
-- även med i join_session och open_assignment_as_student så att eleven ser
-- vilka regler uppdraget tränar.

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
      'reference_image_path', case when assign.reveal_mode = 'full' then assign.reference_image_path else null end,
      'rule_refs', assign.rule_refs
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
      'reference_image_path', case when assign.reveal_mode = 'full' then assign.reference_image_path else null end,
      'rule_refs', assign.rule_refs
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
