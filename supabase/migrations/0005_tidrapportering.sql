-- Tidsrapportering: eleven loggar hur lång tid de lagt ner på ett uppdrag,
-- en rad per arbetspass (datum + minuter + valfri kommentar om vad de
-- gjorde). Helt frikopplat från materialplanen -- olåst av plan_locked,
-- eftersom det praktiska verkstadsarbetet (och därmed tidsloggningen)
-- normalt fortsätter efter att materialplanen skickats in. Eleven äger
-- sina egna rader fullt ut (lägga till/ändra/ta bort); läraren ser allt
-- inom sin org men skriver aldrig i elevens logg -- samma
-- ägarskapsmönster som material_plan_items i 0001_init.sql.

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.assignment_participants (id) on delete cascade,
  work_date date not null default current_date,
  minutes integer not null check (minutes > 0),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index time_entries_participant_id_idx on public.time_entries (participant_id);

alter table public.time_entries enable row level security;

create policy "time_entries: eleven läser sina egna rader"
on public.time_entries for select
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where auth_uid = auth.uid()
       or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
  )
);

create policy "time_entries: eleven skriver egna rader"
on public.time_entries for insert
to authenticated
with check (
  participant_id in (
    select id from public.assignment_participants
    where auth_uid = auth.uid()
       or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
  )
);

create policy "time_entries: eleven ändrar egna rader"
on public.time_entries for update
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where auth_uid = auth.uid()
       or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
  )
)
with check (
  participant_id in (
    select id from public.assignment_participants
    where auth_uid = auth.uid()
       or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
  )
);

create policy "time_entries: eleven tar bort egna rader"
on public.time_entries for delete
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where auth_uid = auth.uid()
       or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
  )
);

create policy "time_entries: lärare i org läser alla"
on public.time_entries for select
to authenticated
using (
  participant_id in (
    select ap.id from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);
