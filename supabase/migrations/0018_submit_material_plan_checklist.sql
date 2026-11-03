-- Inlämning av materialplan kräver att checklistan är komplett.
--
-- QR-flödet (session_id) kräver även egenkontroll och reflektion när
-- uppdraget har sådana punkter. Klassflödet har ännu inga inmatningar för
-- dem och kräver därför bara materialplan + drift- och underhållsplan.
-- Kontrollen ligger även här på servern så att den inte kan kringgås.

create or replace function public.submit_material_plan(p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  part public.assignment_participants;
  assign public.assignments;
  saknas text[] := '{}';
begin
  select * into part
  from public.assignment_participants
  where id = p_participant_id
    and (
      auth_uid = auth.uid()
      or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
    );

  if part.id is null then
    raise exception 'Kunde inte skicka in materialplanen (okänd session).';
  end if;
  if part.plan_locked then
    raise exception 'Materialplanen är redan inskickad.';
  end if;

  select * into assign from public.assignments where id = part.assignment_id;

  if not exists (select 1 from public.material_plan_items where participant_id = part.id) then
    saknas := array_append(saknas, 'minst en materialrad');
  end if;

  if part.session_id is not null
     and jsonb_typeof(coalesce(assign.self_check_items, '[]'::jsonb)) = 'array'
     and jsonb_array_length(coalesce(assign.self_check_items, '[]'::jsonb)) > 0
     and part.self_check_submitted_at is null then
    saknas := array_append(saknas, 'egenkontroll');
  end if;

  if part.session_id is not null
     and jsonb_typeof(coalesce(assign.reflection_questions, '[]'::jsonb)) = 'array'
     and jsonb_array_length(coalesce(assign.reflection_questions, '[]'::jsonb)) > 0
     and part.reflection_submitted_at is null then
    saknas := array_append(saknas, 'reflektion');
  end if;

  if assign.kind = 'uppdrag' and part.maintenance_plan_saved_at is null then
    saknas := array_append(saknas, 'drift- och underhållsplan');
  end if;

  if array_length(saknas, 1) > 0 then
    raise exception 'Materialplanen kan inte lämnas in. Saknas: %.', array_to_string(saknas, ', ');
  end if;

  update public.assignment_participants
  set plan_submitted_at = now(), plan_locked = true
  where id = part.id;
end;
$fn$;

grant execute on function public.submit_material_plan(uuid) to authenticated;
