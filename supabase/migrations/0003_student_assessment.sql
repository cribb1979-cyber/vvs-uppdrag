-- Elevvy för bedömning (punkt 19-uppföljning): assignments.assessment_visible
-- fanns redan förberett i 0001_init.sql men var aldrig kopplat till någon
-- klientvy -- bedömningen var helt dold för eleven. Den här migrationen
-- lägger till den kontrollerade, read-only vyn: eleven ser sin egen
-- bedömning EXAKT när läraren aktivt satt assessment_visible = true på
-- uppdraget, aldrig innan, och aldrig andra elevers bedömningar.
--
-- Samma mönster som get_requirements_view/get_quiz_view: en SECURITY
-- DEFINER-funktion är den enda läsvägen -- raden i assessment_results har
-- fortfarande INGEN RLS-policy för elev/anon-rollen (se 0001_init.sql rad
-- 578-597), så en elevklient kan aldrig SELECT:a tabellen direkt.
--
-- Gäller bara klassregistrerade elever (student_id satt på participant) --
-- precis som lärarens betygsgrid i bedomning/[id].tsx kan QR-engångssessioner
-- aldrig bedömas, eftersom de saknar en stabil elevidentitet över tid.

create or replace function public.get_my_assessment_view(p_participant_id uuid)
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

  if part.student_id is null then
    return jsonb_build_object('visible', false, 'results', '[]'::jsonb);
  end if;

  select * into assign from public.assignments where id = part.assignment_id;

  if assign.id is null or not assign.assessment_visible then
    return jsonb_build_object('visible', false, 'results', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'visible', true,
    'results', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'criteria_label', ac.label,
        'status', coalesce(ar.status, 'ej_bedomd'),
        'comment', coalesce(ar.comment, '')
      ) order by ac.sort_order), '[]'::jsonb)
      from public.assessment_criteria ac
      left join public.assessment_results ar
        on ar.criteria_id = ac.id and ar.student_id = part.student_id
      where ac.assignment_id = assign.id
    )
  );
end;
$$;
