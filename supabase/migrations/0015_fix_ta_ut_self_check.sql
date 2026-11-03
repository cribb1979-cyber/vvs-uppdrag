-- Rättar ta_ut_uppdragsbank_mall: assignments.self_check_items och
-- reflection_questions är jsonb, inte text[]. Den gamla funktionen kastade
-- "column ... is of type jsonb but expression is of type text[]" vid uttag.

create or replace function public.ta_ut_uppdragsbank_mall(p_mall_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.profiles;
  m public.uppdragsbank_mallar;
  a jsonb;
  nytt_uppdrag uuid;
begin
  select * into t from public.current_teacher();
  if t.id is null then
    raise exception 'Endast godkänd lärare kan ta ut mallar.';
  end if;

  select * into m from public.uppdragsbank_mallar where id = p_mall_id;
  if m.id is null then
    raise exception 'Mallen hittades inte.';
  end if;
  if not (m.status = 'godkand' or m.agare_org_id = t.org_id) then
    raise exception 'Mallen är inte godkänd för uttag.';
  end if;

  a := coalesce(m.payload->'assignment', '{}'::jsonb);

  insert into public.assignments (
    org_id, created_by, title, description, status, kind,
    reveal_mode, ai_mode, steps, year_level, course_code, skolverket_ref,
    is_template, assessment_visible, reference_image_path, goal,
    self_check_items, reflection_questions, rule_refs,
    source_mall_id, source_version
  )
  values (
    t.org_id,
    auth.uid(),
    coalesce(nullif(a->>'title', ''), m.titel),
    coalesce(a->>'description', m.beskrivning, ''),
    'draft',
    coalesce(nullif(a->>'kind', ''), m.kind, 'uppdrag'),
    coalesce(nullif(a->>'reveal_mode', ''), 'hidden'),
    coalesce(nullif(a->>'ai_mode', ''), 'off'),
    coalesce(a->'steps', '[]'::jsonb),
    coalesce(a->>'year_level', m.year_level, ''),
    coalesce(a->>'course_code', m.course_code, ''),
    coalesce(a->>'skolverket_ref', ''),
    false,
    coalesce((a->>'assessment_visible')::boolean, false),
    nullif(a->>'reference_image_path', ''),
    coalesce(a->>'goal', ''),
    coalesce(a->'self_check_items', '[]'::jsonb),
    coalesce(a->'reflection_questions', '[]'::jsonb),
    coalesce(m.regel_refs, '{}'),
    m.id,
    m.version
  )
  returning id into nytt_uppdrag;

  insert into public.material_requirements (
    assignment_id, component, dimension, quantity, note, sort_order
  )
  select
    nytt_uppdrag,
    x->>'component',
    coalesce(x->>'dimension', ''),
    greatest(1, coalesce((x->>'quantity')::int, 1)),
    coalesce(x->>'note', ''),
    coalesce((x->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(m.payload->'material_requirements', '[]'::jsonb)) x
  where coalesce(x->>'component', '') <> '';

  insert into public.quiz_questions (
    assignment_id, image_path, prompt, correct_answer, wrong_answers, sort_order
  )
  select
    nytt_uppdrag,
    x->>'image_path',
    coalesce(x->>'prompt', 'Vad heter den här rördelen?'),
    x->>'correct_answer',
    coalesce(
      array(select jsonb_array_elements_text(coalesce(x->'wrong_answers', '[]'::jsonb))),
      '{}'
    ),
    coalesce((x->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(m.payload->'quiz_questions', '[]'::jsonb)) x
  where coalesce(x->>'image_path', '') <> ''
    and coalesce(x->>'correct_answer', '') <> '';

  insert into public.assessment_criteria (assignment_id, label, sort_order)
  select
    nytt_uppdrag,
    x->>'label',
    coalesce((x->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(m.payload->'assessment_criteria', '[]'::jsonb)) x
  where coalesce(x->>'label', '') <> '';

  return nytt_uppdrag;
end;
$$;
