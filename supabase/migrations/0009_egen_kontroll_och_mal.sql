-- Dagens mål + egen kontroll.
--
-- D) assignments.goal – en kort mening som eleven ser högst upp ("idag: ...").
-- A) assignments.self_check_items – lärarens checklista för uppdraget (jsonb-array
--    av texter). assignment_participants.self_check – elevens avbockning (jsonb:
--    { "<index>": true }), plus self_check_submitted_at.
--
-- Samma ägarskapsmönster som time_entries/material_plan_items: eleven äger sina
-- egna svar, läraren läser allt inom sin org. Eleven rör aldrig tabellen direkt,
-- utan går via en SECURITY DEFINER-RPC (submit_self_check), precis som
-- set_participant_display_name och submit_time_report.

alter table public.assignments add column if not exists goal text not null default '';

alter table public.assignments
  add column if not exists self_check_items jsonb not null default
  '["Rätt dimension på rör och kopplingar", "Alla kopplingar täta (tryckprov)", "Rätt fall mot avloppet", "Isolering och upphängning klar", "Märkning och dokumentation gjord", "Städat och sorterat"]'::jsonb;

alter table public.assignment_participants add column if not exists self_check jsonb not null default '{}'::jsonb;
alter table public.assignment_participants add column if not exists self_check_submitted_at timestamptz;

-- Eleven skickar in sin egen kontroll (avbockning per checklistpunkt).
create or replace function public.submit_self_check(p_participant_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  part public.assignment_participants;
  nu timestamptz := now();
begin
  select * into part from public.assignment_participants
  where id = p_participant_id
    and (
      auth_uid = auth.uid()
      or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
    );
  if part.id is null then
    raise exception 'Okänd session.';
  end if;
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Fel format på egenkontrollen.';
  end if;

  update public.assignment_participants
  set self_check = p_answers,
      self_check_submitted_at = nu
  where id = part.id;

  return jsonb_build_object('ok', true, 'self_check_submitted_at', nu);
end;
$$;

-- Läraren nollställer elevens egenkontroll (om den behöver göras om).
create or replace function public.reopen_self_check(p_participant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.assignment_participants ap
  set self_check = '{}'::jsonb, self_check_submitted_at = null
  where ap.id = p_participant_id
    and ap.assignment_id in (
      select a.id from public.assignments a
      where a.org_id = (select org_id from public.current_teacher())
    );
  return jsonb_build_object('ok', true);
end;
$$;

-- join_session och open_assignment_as_student: lämna också ut mål + egenkontroll.
-- (Samma kroppar som i 0004_ovning_provlage.sql, bara utökade.)

create or replace function public.join_session(session_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  sess public.student_sessions;
  assign public.assignments;
  participant public.assignment_participants;
begin
  if auth.uid() is null then
    raise exception 'Ingen elevsession -- logga in anonymt först.';
  end if;

  select * into sess from public.student_sessions where code = upper(trim(session_code));
  if sess.id is null then
    raise exception 'Okänd uppdragskod.';
  end if;
  if sess.revoked_at is not null then
    raise exception 'Uppdraget har avslutats.';
  end if;
  if sess.expires_at <= now() then
    raise exception 'Uppdraget har avslutats.';
  end if;

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
      'id', assign.id,
      'title', assign.title,
      'description', assign.description,
      'kind', assign.kind,
      'reveal_mode', assign.reveal_mode,
      'ai_mode', assign.ai_mode,
      'steps', assign.steps,
      'goal', assign.goal,
      'self_check_items', assign.self_check_items,
      'reference_image_path', case when assign.reveal_mode = 'full' then assign.reference_image_path else null end
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at,
    'self_check', participant.self_check,
    'self_check_submitted_at', participant.self_check_submitted_at
  );
end;
$$;

create or replace function public.open_assignment_as_student(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  my_student_id uuid;
  my_class_id uuid;
  assign public.assignments;
  participant public.assignment_participants;
  has_access boolean;
begin
  if auth.uid() is null then
    raise exception 'Ingen session -- logga in anonymt först.';
  end if;

  select s.id, s.class_id into my_student_id, my_class_id
  from public.student_links sl join public.students s on s.id = sl.student_id
  where sl.auth_uid = auth.uid() and s.revoked_at is null
  limit 1;

  if my_student_id is null then
    raise exception 'Ingen elevkod kopplad till den här enheten.';
  end if;

  select * into assign from public.assignments where id = p_assignment_id;
  if assign.id is null or assign.status <> 'active' then
    raise exception 'Uppdraget är inte tillgängligt.';
  end if;

  select exists (
    select 1 from public.assignment_assignments aa
    where aa.assignment_id = p_assignment_id
      and (aa.student_id = my_student_id or aa.class_id = my_class_id)
  ) into has_access;

  if not has_access then
    raise exception 'Det här uppdraget är inte tilldelat dig.';
  end if;

  insert into public.assignment_participants (assignment_id, student_id)
  values (p_assignment_id, my_student_id)
  on conflict (assignment_id, student_id) where student_id is not null
  do update set assignment_id = excluded.assignment_id
  returning * into participant;

  return jsonb_build_object(
    'participant_id', participant.id,
    'session_expires_at', null,
    'assignment', jsonb_build_object(
      'id', assign.id,
      'title', assign.title,
      'description', assign.description,
      'kind', assign.kind,
      'reveal_mode', assign.reveal_mode,
      'ai_mode', assign.ai_mode,
      'steps', assign.steps,
      'goal', assign.goal,
      'self_check_items', assign.self_check_items,
      'reference_image_path', case when assign.reveal_mode = 'full' then assign.reference_image_path else null end
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at,
    'self_check', participant.self_check,
    'self_check_submitted_at', participant.self_check_submitted_at
  );
end;
$$;
