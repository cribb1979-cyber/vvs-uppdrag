-- Fem fristående tillägg:
--   1. Anonym QR-elev kan ange ett eget visningsnamn (annars "Elev <id> (QR)").
--   2. Läraren kan skriva en kommentar till eleven på materialplanen.
--   3. Eleven har en fri textruta för egna anteckningar/reflektion per uppdrag,
--      skild från materialplanen och tidrapporten.
--   4. Läraren kan lämna kommentar/manuell rättning per quiz-svar.
--   5. En riktig "Beställningar"-tabell bakom Beställningar-fliken (var en stub).
--
-- Bedömningens kommentarfält (assessment_results.comment) finns redan sedan
-- tidigare och behöver ingen ändring här.

-- ---- 1. Visningsnamn för QR-elever ----
-- Endast relevant för den anonyma QR-sessionen (student_id null) -- elever
-- som går via klasskod har redan students.name. Sätts av eleven själv, en
-- gång eller flera; ingen låsning, det är bara en etikett för lärarens vy.
alter table public.assignment_participants add column if not exists display_name text;

create or replace function public.set_participant_display_name(p_participant_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.assignment_participants
  set display_name = nullif(trim(p_name), '')
  where id = p_participant_id
    and auth_uid = auth.uid();

  if not found then
    raise exception 'Kunde inte spara namnet (okänd session).';
  end if;
end;
$$;

-- get_quiz_results ska falla tillbaka på QR-elevens eget visningsnamn precis
-- som materialplanens lista redan gör i klienten -- annars byggs samma logik
-- på plats i UI:t. Oförändrad i övrigt jämfört med 0002_quiz.sql.
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
      'student_name', coalesce(s.name, ap.display_name),
      'answered_count', (
        select count(*) from public.quiz_answers qa join public.quiz_questions qq on qq.id = qa.question_id
        where qq.assignment_id = p_assignment_id and qa.participant_id = ap.id
      ),
      'correct_count', (
        select count(*) from public.quiz_answers qa join public.quiz_questions qq on qq.id = qa.question_id
        where qq.assignment_id = p_assignment_id and qa.participant_id = ap.id and qa.is_correct
      ),
      'total_questions', (select count(*) from public.quiz_questions where assignment_id = p_assignment_id)
    ) order by coalesce(s.name, ap.display_name) nulls last, ap.joined_at), '[]'::jsonb)
    from public.assignment_participants ap
    left join public.students s on s.id = ap.student_id
    where ap.assignment_id = p_assignment_id
  );
end;
$$;

-- ---- 2. Lärarens kommentar till eleven (materialplan) ----
-- assignment_participants har ingen klient-skrivbar policy alls sedan
-- tidigare (allt går via SECURITY DEFINER-RPC:er) -- följer samma mönster
-- här istället för att öppna en direkt UPDATE-policy på hela raden.
alter table public.assignment_participants add column if not exists teacher_comment text not null default '';

create or replace function public.set_teacher_comment(p_participant_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  allowed boolean;
begin
  select exists (
    select 1 from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where ap.id = p_participant_id
      and a.org_id = (select org_id from public.current_teacher())
  ) into allowed;

  if not allowed then
    raise exception 'Ingen behörighet.';
  end if;

  update public.assignment_participants
  set teacher_comment = coalesce(p_comment, '')
  where id = p_participant_id;
end;
$$;

-- ---- 3. Elevens fria textruta (egna anteckningar per uppdrag) ----
-- Fristående från materialplanens och tidrapportens egna kommentarfält --
-- ingen låsning, eleven kan alltid ändra den.
alter table public.assignment_participants add column if not exists student_note text not null default '';

create or replace function public.set_student_note(p_participant_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.assignment_participants
  set student_note = coalesce(p_note, '')
  where id = p_participant_id
    and (
      auth_uid = auth.uid()
      or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
    );

  if not found then
    raise exception 'Kunde inte spara anteckningen (okänd session).';
  end if;
end;
$$;

-- ---- 4. Lärarens kommentar/rättning per quiz-svar ----
alter table public.quiz_answers add column if not exists teacher_comment text not null default '';
-- null = ingen manuell rättning, true/false = lärarens manuella rättning
-- (visas till eleven istället för det automatiska facitet när satt).
alter table public.quiz_answers add column if not exists teacher_override boolean;

create or replace function public.set_quiz_answer_feedback(p_answer_id uuid, p_comment text, p_override boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  allowed boolean;
begin
  select exists (
    select 1 from public.quiz_answers qa
    join public.assignment_participants ap on ap.id = qa.participant_id
    join public.assignments a on a.id = ap.assignment_id
    where qa.id = p_answer_id
      and a.org_id = (select org_id from public.current_teacher())
  ) into allowed;

  if not allowed then
    raise exception 'Ingen behörighet.';
  end if;

  update public.quiz_answers
  set teacher_comment = coalesce(p_comment, ''), teacher_override = p_override
  where id = p_answer_id;
end;
$$;

-- ---- 5. Beställningar ----
-- Rent lärarägd data (som material_catalog) -- direkta RLS-policyer räcker,
-- ingen elev rör den här tabellen.
create table if not exists public.material_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  material_id uuid references public.material_catalog (id) on delete set null,
  material_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'att_bestalla' check (status in ('att_bestalla', 'bestalld', 'mottagen')),
  note text not null default '',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.material_orders enable row level security;

create policy "material_orders: läsa inom org"
on public.material_orders for select
to authenticated
using (org_id = (select org_id from public.current_teacher()));

create policy "material_orders: skapa inom org"
on public.material_orders for insert
to authenticated
with check (org_id = (select org_id from public.current_teacher()));

create policy "material_orders: uppdatera inom org"
on public.material_orders for update
to authenticated
using (org_id = (select org_id from public.current_teacher()))
with check (org_id = (select org_id from public.current_teacher()));

create policy "material_orders: ta bort inom org"
on public.material_orders for delete
to authenticated
using (org_id = (select org_id from public.current_teacher()));
