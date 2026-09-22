-- Tidrapportens inskick/klarmarkering + lärarens redigeringsläge.
--
-- Speglar exakt samma mönster som materialplanen (plan_locked/plan_submitted_at
-- + submit_material_plan/reopen_material_plan): eleven kan lägga till/ändra/ta
-- bort egna arbetspass fritt tills de trycker "Skicka in", då låses raderna
-- och läraren ser tydligt att tidrapporten är klar. Läraren kan alltid
-- redigera/ta bort rader (t.ex. rätta ett fel eller lägga till glömd tid) --
-- till skillnad från materialplanen, som läraren aldrig skriver i, är
-- tidrapporten en gemensam handling mellan lärare och elev.

alter table public.assignment_participants add column if not exists time_submitted_at timestamptz;
alter table public.assignment_participants add column if not exists time_locked boolean not null default false;

-- ---- Skärp elevens skriv-policyer på time_entries till "innan lås" ----

drop policy if exists "time_entries: eleven skriver egna rader" on public.time_entries;
create policy "time_entries: eleven skriver egna rader innan lås"
on public.time_entries for insert
to authenticated
with check (
  participant_id in (
    select id from public.assignment_participants
    where time_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
);

drop policy if exists "time_entries: eleven ändrar egna rader" on public.time_entries;
create policy "time_entries: eleven ändrar egna rader innan lås"
on public.time_entries for update
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where time_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
)
with check (
  participant_id in (
    select id from public.assignment_participants
    where time_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
);

drop policy if exists "time_entries: eleven tar bort egna rader" on public.time_entries;
create policy "time_entries: eleven tar bort egna rader innan lås"
on public.time_entries for delete
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where time_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
);

-- ---- Lärarens redigeringsläge: kan alltid rätta/ta bort, oavsett lås ----

create policy "time_entries: lärare i org redigerar alla"
on public.time_entries for update
to authenticated
using (
  participant_id in (
    select ap.id from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
)
with check (
  participant_id in (
    select ap.id from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);

create policy "time_entries: lärare i org tar bort alla"
on public.time_entries for delete
to authenticated
using (
  participant_id in (
    select ap.id from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);

-- ---- RPC:er för inskick/återöppning (samma mönster som materialplanen) ----

create or replace function public.submit_time_report(p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.assignment_participants
  set time_submitted_at = now(), time_locked = true
  where id = p_participant_id
    and time_locked = false
    and (
      auth_uid = auth.uid()
      or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
    );

  if not found then
    raise exception 'Kunde inte skicka in tidrapporten (redan inskickad eller okänd session).';
  end if;
end;
$$;

-- Läraren öppnar upp en inskickad tidrapport igen för komplettering.
create or replace function public.reopen_time_report(p_participant_id uuid)
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
  set time_locked = false, time_submitted_at = null
  where id = p_participant_id;
end;
$$;
