-- VVS Uppdrag -- materiallära-quiz (åk 1-3)
--
-- Återanvänder HELA den befintliga uppdrags-/QR-/klassinfrastrukturen
-- (assignments, student_sessions, assignment_assignments,
-- assignment_participants, redeem_student_code, join_session,
-- open_assignment_as_student, list_my_assignments) genom att lägga till
-- en `kind`-kolumn på assignments, istället för att bygga en parallell
-- uppsättning QR-koder/klasstilldelning/elevidentitet. Bara själva
-- frågorna/svaren är nya tabeller -- ett quiz ÄR ett uppdrag med
-- kind='quiz', och delar QR-session, klasstilldelning, "Mina uppdrag"
-- och elevidentitet rakt av med det vanliga materialplansflödet.
--
-- Rätt svar (quiz_questions.correct_answer) exponeras ALDRIG direkt för
-- elevrollen -- RLS ger ingen SELECT-policy till anon/elev på
-- quiz_questions alls (samma default-deny-princip som
-- material_requirements/assessment_*, se 0001_init.sql punkt 3). Eleven
-- når frågorna enbart via get_quiz_view (blandade alternativ, aldrig
-- vilket som är rätt) och svarar via submit_quiz_answer, som rättar
-- server-side.

alter table public.assignments
  add column kind text not null default 'uppdrag' check (kind in ('uppdrag', 'quiz'));

create index assignments_kind_idx on public.assignments (kind);

-- ---------------------------------------------------------------------
-- Quiz-frågor: en bild (i Storage-bucketen "quiz-images", se längst ner)
-- + rätt svar + minst ett felaktigt alternativ, per uppdrag (kind='quiz').
-- ---------------------------------------------------------------------
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  image_path text not null,
  prompt text not null default 'Vad heter den här rördelen?',
  correct_answer text not null,
  wrong_answers text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (coalesce(array_length(wrong_answers, 1), 0) >= 1)
);

create index quiz_questions_assignment_id_idx on public.quiz_questions (assignment_id);

-- ---------------------------------------------------------------------
-- Elevens svar per fråga -- en rad per (participant, question), samma
-- participant_id som materialplansflödet oavsett QR-session eller
-- klasskod, så en elev bara kan svara en gång per fråga.
-- ---------------------------------------------------------------------
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.assignment_participants (id) on delete cascade,
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  selected_answer text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (participant_id, question_id)
);

create index quiz_answers_participant_id_idx on public.quiz_answers (participant_id);
create index quiz_answers_question_id_idx on public.quiz_answers (question_id);

alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;

-- ---- quiz_questions (endast lärare -- se kommentaren högst upp) ----
create policy "quiz_questions: lärare i org hanterar frågor"
on public.quiz_questions for all
to authenticated
using (assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher())))
with check (assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher())));

-- ---- quiz_answers (läraren läser resultat; eleven skriver ALDRIG hit
-- direkt -- bara via submit_quiz_answer, som kör som SECURITY DEFINER) ----
create policy "quiz_answers: lärare i org läser resultat"
on public.quiz_answers for select
to authenticated
using (
  question_id in (
    select qq.id from public.quiz_questions qq join public.assignments a on a.id = qq.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);

-- =======================================================================
-- RPC-funktioner
-- =======================================================================

-- Elevens quizvy: frågorna med blandade svarsalternativ (rätt + fel
-- ihopslaget och omblandat), men ALDRIG vilket som är rätt -- samma
-- auth-koll (QR-session ELLER klasskod) som get_requirements_view.
create or replace function public.get_quiz_view(p_participant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  part public.assignment_participants;
  assign public.assignments;
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

  select * into assign from public.assignments where id = part.assignment_id;
  if assign.kind <> 'quiz' then
    raise exception 'Det här uppdraget är inte ett quiz.';
  end if;

  return jsonb_build_object(
    'assignment_title', assign.title,
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', qq.id,
        'image_path', qq.image_path,
        'prompt', qq.prompt,
        'options', (
          select jsonb_agg(opt order by random())
          from unnest(array_append(qq.wrong_answers, qq.correct_answer)) as opt
        ),
        'answered_correct', (
          select qa.is_correct from public.quiz_answers qa
          where qa.participant_id = p_participant_id and qa.question_id = qq.id
        )
      ) order by qq.sort_order), '[]'::jsonb)
      from public.quiz_questions qq
      where qq.assignment_id = assign.id
    )
  );
end;
$$;

-- Eleven svarar på en fråga -- rättningen sker HÄR, server-side.
-- Klienten skickar bara vilket textalternativ som valdes och kan aldrig
-- läsa correct_answer i förväg (ingen SELECT-policy på quiz_questions
-- för elevrollen). En elev kan bara svara en gång per fråga.
create or replace function public.submit_quiz_answer(p_participant_id uuid, p_question_id uuid, p_selected_answer text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  part public.assignment_participants;
  question public.quiz_questions;
  correct boolean;
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

  select * into question from public.quiz_questions where id = p_question_id and assignment_id = part.assignment_id;
  if question.id is null then
    raise exception 'Okänd fråga.';
  end if;

  if exists (select 1 from public.quiz_answers where participant_id = p_participant_id and question_id = p_question_id) then
    raise exception 'Den här frågan är redan besvarad.';
  end if;

  correct := p_selected_answer = question.correct_answer;

  insert into public.quiz_answers (participant_id, question_id, selected_answer, is_correct)
  values (p_participant_id, p_question_id, p_selected_answer, correct);

  return jsonb_build_object('correct', correct, 'correct_answer', question.correct_answer);
end;
$$;

-- Lärarens resultatöversikt: poäng per deltagare för ett quiz.
create or replace function public.get_quiz_results(p_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  teacher public.profiles;
begin
  teacher := public.current_teacher();
  if teacher.id is null then
    raise exception 'Ingen behörighet.';
  end if;
  if not exists (select 1 from public.assignments where id = p_assignment_id and org_id = teacher.org_id) then
    raise exception 'Okänt uppdrag.';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'participant_id', ap.id,
      'student_name', s.name,
      'answered_count', (
        select count(*) from public.quiz_answers qa join public.quiz_questions qq on qq.id = qa.question_id
        where qq.assignment_id = p_assignment_id and qa.participant_id = ap.id
      ),
      'correct_count', (
        select count(*) from public.quiz_answers qa join public.quiz_questions qq on qq.id = qa.question_id
        where qq.assignment_id = p_assignment_id and qa.participant_id = ap.id and qa.is_correct
      ),
      'total_questions', (select count(*) from public.quiz_questions where assignment_id = p_assignment_id)
    ) order by s.name nulls last, ap.joined_at), '[]'::jsonb)
    from public.assignment_participants ap
    left join public.students s on s.id = ap.student_id
    where ap.assignment_id = p_assignment_id
  );
end;
$$;

grant execute on function public.get_quiz_view(uuid) to authenticated, anon;
grant execute on function public.submit_quiz_answer(uuid, uuid, text) to authenticated, anon;
grant execute on function public.get_quiz_results(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Uppdatera de tre befintliga elev-RPC:erna så assignment.kind följer
-- med -- klienten behöver veta om ett uppdrag ska öppnas som materialplan
-- eller som quiz.
-- ---------------------------------------------------------------------
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
      'steps', assign.steps
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at
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
      'steps', assign.steps
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at
  );
end;
$$;

create or replace function public.list_my_assignments()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  my_student_id uuid;
  my_class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Ingen session.';
  end if;

  select s.id, s.class_id into my_student_id, my_class_id
  from public.student_links sl join public.students s on s.id = sl.student_id
  where sl.auth_uid = auth.uid() and s.revoked_at is null
  limit 1;

  if my_student_id is null then
    raise exception 'Ingen elevkod kopplad till den här enheten.';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'title', a.title, 'description', a.description, 'kind', a.kind
    ) order by a.created_at desc), '[]'::jsonb)
    from public.assignments a
    where a.status = 'active'
      and exists (
        select 1 from public.assignment_assignments aa
        where aa.assignment_id = a.id
          and (aa.student_id = my_student_id or aa.class_id = my_class_id)
      )
  );
end;
$$;

-- =======================================================================
-- Storage: bilder till quizfrågor
-- =======================================================================
insert into storage.buckets (id, name, public)
values ('quiz-images', 'quiz-images', true)
on conflict (id) do nothing;

-- Sökvägskonvention: quiz-images/<org_id>/<uuid>.<ext> -- så policyn kan
-- kontrollera att läraren bara laddar upp/tar bort i sin egen orgs mapp.
-- Bilderna är produktfoton av rördelar utan personuppgifter, så publik
-- läsning (SELECT) är avsiktligt öppen -- annars skulle anonyma
-- QR-elever inte kunna visa quizbilderna utan en extra signerad-URL-runda.
create policy "quiz-images: lärare i org laddar upp"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'quiz-images'
  and (storage.foldername(name))[1] = (select org_id::text from public.current_teacher())
);

create policy "quiz-images: lärare i org tar bort egna"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'quiz-images'
  and (storage.foldername(name))[1] = (select org_id::text from public.current_teacher())
);

create policy "quiz-images: publik läsning"
on storage.objects for select
to public
using (bucket_id = 'quiz-images');
