-- 0012_uppdragsbank.sql
-- Lärarbank för uppdragsmallar.
--
-- En lärare kan "sätta in" ett av sina uppdrag i banken. Uppdraget fryses
-- då som en JSON-snapshot (uppdrag + materialrader + quizfrågor +
-- bedömningskriterier), så att banken inte ändras när originaluppdraget
-- ändras. En annan lärare kan granska mallen; först när den är godkänd kan
-- någon "ta ut" den. Ett uttag är en djup kopia till lärarens egen org, med
-- status 'draft' – aldrig en länk till mallen.
--
-- Säkervatten-reglerna ligger som koder i assignments.rule_refs (t.ex.
-- 'tappvatten-fogar'). Själva regeltexten är statisk och versioneras i
-- lib/sakervatten.ts, inte i databasen. Det gör att en ny upplaga av
-- branschreglerna kan läggas in utan migrering.

-- ---------------------------------------------------------------------
-- Banken
-- ---------------------------------------------------------------------
create table if not exists public.uppdragsbank_mallar (
  id uuid primary key default gen_random_uuid(),
  agare_org_id uuid not null references public.orgs (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  titel text not null,
  beskrivning text not null default '',
  year_level text not null default '',
  course_code text not null default '',
  kind text not null default 'uppdrag' check (kind in ('uppdrag', 'quiz')),
  payload jsonb not null,
  regel_refs text[] not null default '{}',
  version integer not null default 1,
  status text not null default 'utkast'
    check (status in ('utkast', 'granskning', 'godkand', 'avslagen')),
  granskad_av uuid references public.profiles (id),
  granskad_at timestamptz,
  granskningskommentar text not null default '',
  source_mall_id uuid references public.uppdragsbank_mallar (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_uppdragsbank_status on public.uppdragsbank_mallar (status);
create index if not exists ix_uppdragsbank_org on public.uppdragsbank_mallar (agare_org_id);
create index if not exists ix_uppdragsbank_kind on public.uppdragsbank_mallar (kind);

-- En granskning är en separat rad, så att historiken finns kvar även när
-- mallen senare ändras. En mall kan granskas flera gånger.
create table if not exists public.uppdragsbank_granskningar (
  id uuid primary key default gen_random_uuid(),
  mall_id uuid not null references public.uppdragsbank_mallar (id) on delete cascade,
  granskare uuid not null references public.profiles (id),
  godkand boolean not null,
  kommentar text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ix_uppdragsbank_granskningar_mall
  on public.uppdragsbank_granskningar (mall_id);

-- ---------------------------------------------------------------------
-- Uppdraget får en koppling till banken + Säkervatten-regler
-- ---------------------------------------------------------------------
alter table public.assignments
  add column if not exists rule_refs text[] not null default '{}',
  add column if not exists source_mall_id uuid references public.uppdragsbank_mallar (id) on delete set null,
  add column if not exists source_version integer;

create index if not exists ix_assignments_source_mall
  on public.assignments (source_mall_id);

-- ---------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_uppdragsbank_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists uppdragsbank_updated_at on public.uppdragsbank_mallar;
create trigger uppdragsbank_updated_at
before update on public.uppdragsbank_mallar
for each row execute function public.set_uppdragsbank_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.uppdragsbank_mallar enable row level security;
alter table public.uppdragsbank_granskningar enable row level security;

-- Godkända mallar är läsbara för alla lärare. Egna skolans mallar är
-- läsbara även medan de granskas, så att kollegorna kan se dem.
drop policy if exists "uppdragsbank: läsa godkända eller egen org" on public.uppdragsbank_mallar;
create policy "uppdragsbank: läsa godkända eller egen org" for select
to authenticated
using (
  status = 'godkand'
  or agare_org_id = (select org_id from public.current_teacher())
);

drop policy if exists "uppdragsbank: lärare skapar i egen org" on public.uppdragsbank_mallar;
create policy "uppdragsbank: lärare skapar i egen org" for insert
to authenticated
with check (
  agare_org_id = (select org_id from public.current_teacher())
  and created_by = auth.uid()
  -- Man får lägga in ett utkast eller skicka till granskning, men aldrig
  -- skriva in en färdiggodkänd mall direkt.
  and status in ('utkast', 'granskning')
  and granskad_av is null
);

-- En godkänd mall är fryst. Vill man ändra den får man skapa en ny version
-- (eller göra den till utkast igen via RPC). Author/admin får uppdatera
-- utkast, granskning och avslagen.
drop policy if exists "uppdragsbank: ägare/admin uppdaterar ej godkänd" on public.uppdragsbank_mallar;
create policy "uppdragsbank: ägare/admin uppdaterar ej godkänd" for update
to authenticated
using (
  status <> 'godkand'
  and agare_org_id = (select org_id from public.current_teacher())
  and (
    created_by = auth.uid()
    or (select role from public.current_teacher()) = 'admin'
  )
)
with check (
  status <> 'godkand'
  and agare_org_id = (select org_id from public.current_teacher())
);

drop policy if exists "uppdragsbank: ägare/admin tar bort" on public.uppdragsbank_mallar;
create policy "uppdragsbank: ägare/admin tar bort" for delete
to authenticated
using (
  agare_org_id = (select org_id from public.current_teacher())
  and (
    created_by = auth.uid()
    or (select role from public.current_teacher()) = 'admin'
  )
);

-- Granskningar får läsas av den som får se mallen. Ingen insert-policy –
-- granskning skapas bara via RPC:n nedan, så att man inte kan godkänna sin
-- egen mall eller skriva en granskning på en osynlig mall.
drop policy if exists "uppdragsbank: granskningar läses med mallen" on public.uppdragsbank_granskningar;
create policy "uppdragsbank: granskningar läses med mallen" for select
to authenticated
using (mall_id in (select id from public.uppdragsbank_mallar));

-- ---------------------------------------------------------------------
-- Sätta in ett uppdrag i banken
-- ---------------------------------------------------------------------
create or replace function public.skapa_uppdragsbank_mall(
  p_assignment_id uuid,
  p_titel text default null,
  p_beskrivning text default null,
  p_regel_refs text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.profiles;
  a public.assignments;
  valda_regler text[];
  mall_payload jsonb;
  ny_mall uuid;
begin
  select * into t from public.current_teacher();
  if t.id is null then
    raise exception 'Endast godkänd lärare kan lägga upp i banken.';
  end if;

  select * into a
  from public.assignments
  where id = p_assignment_id and org_id = t.org_id;
  if a.id is null then
    raise exception 'Uppdraget hittades inte i din skola.';
  end if;

  valda_regler := coalesce(p_regel_refs, a.rule_refs, '{}');

  mall_payload := jsonb_build_object(
    'assignment', jsonb_build_object(
      'title', a.title,
      'description', a.description,
      'kind', a.kind,
      'reveal_mode', a.reveal_mode,
      'ai_mode', a.ai_mode,
      'steps', a.steps,
      'year_level', a.year_level,
      'course_code', a.course_code,
      'skolverket_ref', a.skolverket_ref,
      'assessment_visible', a.assessment_visible,
      'reference_image_path', a.reference_image_path,
      'goal', a.goal,
      'self_check_items', to_jsonb(a.self_check_items),
      'reflection_questions', to_jsonb(a.reflection_questions),
      'rule_refs', to_jsonb(valda_regler)
    ),
    'material_requirements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'component', r.component,
        'dimension', r.dimension,
        'quantity', r.quantity,
        'note', r.note,
        'sort_order', r.sort_order
      ) order by r.sort_order)
      from public.material_requirements r
      where r.assignment_id = a.id
    ), '[]'::jsonb),
    'quiz_questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'image_path', q.image_path,
        'prompt', q.prompt,
        'correct_answer', q.correct_answer,
        'wrong_answers', to_jsonb(q.wrong_answers),
        'sort_order', q.sort_order
      ) order by q.sort_order)
      from public.quiz_questions q
      where q.assignment_id = a.id
    ), '[]'::jsonb),
    'assessment_criteria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', c.label,
        'sort_order', c.sort_order
      ) order by c.sort_order)
      from public.assessment_criteria c
      where c.assignment_id = a.id
    ), '[]'::jsonb)
  );

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, source_mall_id
  )
  values (
    t.org_id,
    auth.uid(),
    coalesce(nullif(trim(p_titel), ''), a.title),
    coalesce(p_beskrivning, a.description, ''),
    a.year_level,
    a.course_code,
    a.kind,
    mall_payload,
    valda_regler,
    1,
    'granskning',
    a.source_mall_id
  )
  returning id into ny_mall;

  return ny_mall;
end;
$$;

-- ---------------------------------------------------------------------
-- Granska en mall
-- ---------------------------------------------------------------------
create or replace function public.granska_uppdragsbank_mall(
  p_mall_id uuid,
  p_godkann boolean,
  p_kommentar text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.profiles;
  m public.uppdragsbank_mallar;
begin
  select * into t from public.current_teacher();
  if t.id is null then
    raise exception 'Endast godkänd lärare kan granska.';
  end if;

  select * into m from public.uppdragsbank_mallar where id = p_mall_id;
  if m.id is null then
    raise exception 'Mallen hittades inte.';
  end if;
  if m.status <> 'granskning' then
    raise exception 'Mallen är inte öppen för granskning.';
  end if;
  if m.created_by = auth.uid() then
    raise exception 'Du kan inte granska din egen mall.';
  end if;

  insert into public.uppdragsbank_granskningar (mall_id, granskare, godkand, kommentar)
  values (p_mall_id, auth.uid(), p_godkann, coalesce(p_kommentar, ''));

  update public.uppdragsbank_mallar
  set status = case when p_godkann then 'godkand' else 'avslagen' end,
      granskad_av = auth.uid(),
      granskad_at = now(),
      granskningskommentar = coalesce(p_kommentar, ''),
      updated_at = now()
  where id = p_mall_id;

  return case when p_godkann then 'godkand' else 'avslagen' end;
end;
$$;

-- Efter avslag kan ägaren skicka in mallen igen.
create or replace function public.ateroppna_uppdragsbank_mall(p_mall_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.profiles;
  m public.uppdragsbank_mallar;
begin
  select * into t from public.current_teacher();
  if t.id is null then raise exception 'Endast godkänd lärare.'; end if;

  select * into m from public.uppdragsbank_mallar where id = p_mall_id;
  if m.id is null then raise exception 'Mallen hittades inte.'; end if;
  if m.created_by <> auth.uid() and t.role <> 'admin' then
    raise exception 'Bara ägaren eller admin kan öppna mallen igen.';
  end if;
  if m.status not in ('utkast', 'avslagen') then
    raise exception 'Mallen kan inte öppnas igen från status %.', m.status;
  end if;

  update public.uppdragsbank_mallar
  set status = 'granskning', version = version + 1, updated_at = now()
  where id = p_mall_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Ta ut en mall till sin skola
-- ---------------------------------------------------------------------
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
    coalesce(
      array(select jsonb_array_elements_text(coalesce(a->'self_check_items', '[]'::jsonb))),
      '{}'
    ),
    coalesce(
      array(select jsonb_array_elements_text(coalesce(a->'reflection_questions', '[]'::jsonb))),
      '{}'
    ),
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

-- ---------------------------------------------------------------------
-- Rättigheter: bara inloggade lärare, aldrig anon.
-- ---------------------------------------------------------------------
revoke all on function public.skapa_uppdragsbank_mall(uuid, text, text, text[]) from public;
revoke all on function public.granska_uppdragsbank_mall(uuid, boolean, text) from public;
revoke all on function public.ateroppna_uppdragsbank_mall(uuid) from public;
revoke all on function public.ta_ut_uppdragsbank_mall(uuid) from public;

grant execute on function public.skapa_uppdragsbank_mall(uuid, text, text, text[]) to authenticated;
grant execute on function public.granska_uppdragsbank_mall(uuid, boolean, text) to authenticated;
grant execute on function public.ateroppna_uppdragsbank_mall(uuid) to authenticated;
grant execute on function public.ta_ut_uppdragsbank_mall(uuid) to authenticated;
