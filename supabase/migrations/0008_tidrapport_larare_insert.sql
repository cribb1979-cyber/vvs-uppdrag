-- Bugfix: 0006 gav läraren UPDATE/DELETE på time_entries men glömde INSERT,
-- så "+ Lägg till rad" i lärarens redigeringsläge (plan/[participantId].tsx)
-- floppade tyst mot RLS -- den enda INSERT-policyn krävde att raden ägdes
-- av eleven själv (auth_uid/student_links), aldrig sant för läraren.

create policy "time_entries: lärare i org lägger till rader"
on public.time_entries for insert
to authenticated
with check (
  participant_id in (
    select ap.id from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);
