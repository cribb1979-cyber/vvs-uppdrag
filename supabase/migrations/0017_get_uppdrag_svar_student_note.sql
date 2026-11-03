-- Lärarens insamlade svar får även elevens egen anteckning.

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
        'maintenance_plan_at', ap.maintenance_plan_saved_at,
        'student_note', ap.student_note
      ) order by ap.joined_at), '[]'::jsonb)
      from public.assignment_participants ap
      left join public.students s on s.id = ap.student_id
      where ap.assignment_id = p_assignment_id
    )
  );
end;
$fn$;
