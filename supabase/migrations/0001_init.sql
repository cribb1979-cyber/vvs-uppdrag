-- VVS Uppdrag -- grundschema
--
-- Designprinciper (se docs/architecture.md):
-- 1. Multi-tenant: allt scopas på org_id (skola), isolerat via RLS.
-- 2. Två elev-identitetsvägar in i samma uppdrag, representerade av EN
--    gemensam tabell (assignment_participants) så att materialplan,
--    facit-vy och lärarens granskning fungerar likadant oavsett väg:
--      a) Tidsbegränsad, anonym QR-session (student_sessions) -- för
--         engångsprov/gäster. "Temporary workspace first": Supabase
--         Anonymous Sign-ins, ingen e-post/personnummer krävs.
--      b) Klassregister (classes/students) -- en elev får en EGEN kod som
--         gäller hela läsåret, knuten till klassen. Går via student_links
--         som kopplar elevens kod till en eller flera enheter (auth_uid),
--         så att byte av enhet/ominstallation inte tappar identiteten.
--         Detta är vad som krävs för att kunna bedöma samma elev över tid.
-- 3. Lärarens facit (material_requirements) och bedömning
--    (assessment_criteria/assessment_results) har INGEN policy för
--    anon/elev-rollen alls -- default-deny i Postgres RLS betyder att en
--    elevklient inte kan SELECT:a dem oavsett reveal_mode. Den styrda,
--    delvisa visningen av facit exponeras enbart via RPC:en
--    get_requirements_view. Bedömning är helt dold för eleven i den här
--    versionen (assignments.assessment_visible finns förberedd för när
--    en elev-vy för bedömning byggs).
-- 4. RPC:er (SECURITY DEFINER) äger alla livscykel-övergångar som kräver
--    kontroll klienten inte kan lita på: server-genererade koder,
--    utgångskontroll, låsning. Enkel CRUD inom egen org görs annars
--    direkt av klienten under RLS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Organisationer (skolor)
-- ---------------------------------------------------------------------
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Lärarprofiler (1-1 med auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'teacher' check (role in ('admin', 'teacher')),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create index profiles_org_id_idx on public.profiles (org_id);

-- ---------------------------------------------------------------------
-- Klasser/årskurser
-- ---------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  year_level text not null default '',
  school_year text not null default '',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index classes_org_id_idx on public.classes (org_id);

-- ---------------------------------------------------------------------
-- Elevregister per klass. Ingen personuppgift utöver namn -- ingen
-- e-post, inget personnummer. `code` är elevens återanvändbara nyckel
-- för hela läsåret (se student_links), inte en engångskod.
-- ---------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null,
  code text not null unique,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index students_class_id_idx on public.students (class_id);

-- ---------------------------------------------------------------------
-- Kopplar en elevs kod till en eller flera enheter (Supabase Anonymous
-- Sign-in auth_uid). En elev kan lösa in sin kod på flera enheter --
-- varje redeem_student_code-anrop lägger till en rad, tar aldrig bort.
-- ---------------------------------------------------------------------
create table public.student_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  auth_uid uuid not null references auth.users (id) on delete cascade,
  linked_at timestamptz not null default now(),
  unique (student_id, auth_uid)
);

create index student_links_auth_uid_idx on public.student_links (auth_uid);
create index student_links_student_id_idx on public.student_links (student_id);

-- ---------------------------------------------------------------------
-- Uppdrag
-- ---------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  title text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  -- Facit-synlighet för eleven (punkt 4/6 i spec): dold, endast antal saknade, eller allt.
  reveal_mode text not null default 'hidden' check (reveal_mode in ('hidden', 'count', 'full')),
  -- AI-nivå under detta uppdrag (Provläge, punkt 8).
  ai_mode text not null default 'off' check (ai_mode in ('off', 'app_help_only', 'general', 'full')),
  -- Steg/styrning (punkt 7): array av {key, label, open}. Enkel jsonb för MVP.
  steps jsonb not null default '[]'::jsonb,
  -- Koppling mot Skolverkets kursplaner, för att bygga ett återanvändbart
  -- uppdragsbibliotek per årskurs/kurs istället för att skriva om samma
  -- examinationsuppgift varje läsår.
  year_level text not null default '',
  course_code text not null default '',
  skolverket_ref text not null default '',
  is_template boolean not null default false,
  -- Bedömning är helt dold för eleven om inte detta aktivt sätts till true.
  assessment_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create index assignments_org_id_idx on public.assignments (org_id);
create index assignments_year_level_idx on public.assignments (year_level);

-- ---------------------------------------------------------------------
-- Lärarens facit / materialkrav per uppdrag
-- ---------------------------------------------------------------------
create table public.material_requirements (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  component text not null,
  dimension text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index material_requirements_assignment_id_idx on public.material_requirements (assignment_id);

-- ---------------------------------------------------------------------
-- Elevsessioner (QR-konfiguration): en session = en tidsbegränsad länk/kod
-- knuten till ett uppdrag, för engångs-/gästscenariot. Flera elever kan
-- gå med på samma session-kod -- var och en får sin egen rad i
-- assignment_participants.
-- ---------------------------------------------------------------------
create table public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles (id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index student_sessions_assignment_id_idx on public.student_sessions (assignment_id);

-- ---------------------------------------------------------------------
-- Tilldelning: kopplar ett uppdrag till en klass eller en enskild elev
-- (klassflödet). Exakt en av class_id/student_id ska vara satt.
-- ---------------------------------------------------------------------
create table public.assignment_assignments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  student_id uuid references public.students (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id),
  assigned_at timestamptz not null default now(),
  check (
    (class_id is not null and student_id is null)
    or (class_id is null and student_id is not null)
  ),
  unique (assignment_id, class_id),
  unique (assignment_id, student_id)
);

create index assignment_assignments_assignment_id_idx on public.assignment_assignments (assignment_id);
create index assignment_assignments_class_id_idx on public.assignment_assignments (class_id);
create index assignment_assignments_student_id_idx on public.assignment_assignments (student_id);

-- ---------------------------------------------------------------------
-- EN elevidentitets engagemang i ETT uppdrag -- oavsett om identiteten
-- kom via en anonym QR-session (session_id+auth_uid) eller via ett
-- klassregister (student_id). Exakt en av de två identitetskällorna ska
-- vara satt. material_plan_items, get_requirements_view,
-- submit_material_plan och lärarens granskningsvy använder alla
-- participant_id från den här tabellen rakt av, oavsett ursprung.
-- ---------------------------------------------------------------------
create table public.assignment_participants (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  session_id uuid references public.student_sessions (id) on delete cascade,
  auth_uid uuid references auth.users (id) on delete cascade,
  student_id uuid references public.students (id) on delete cascade,
  joined_at timestamptz not null default now(),
  plan_submitted_at timestamptz,
  plan_locked boolean not null default false,
  check (
    (session_id is not null and auth_uid is not null and student_id is null)
    or (session_id is null and student_id is not null)
  )
);

create unique index assignment_participants_session_auth_uidx
  on public.assignment_participants (session_id, auth_uid) where session_id is not null;
create unique index assignment_participants_assignment_student_uidx
  on public.assignment_participants (assignment_id, student_id) where student_id is not null;
create index assignment_participants_assignment_id_idx on public.assignment_participants (assignment_id);
create index assignment_participants_auth_uid_idx on public.assignment_participants (auth_uid);
create index assignment_participants_student_id_idx on public.assignment_participants (student_id);

-- ---------------------------------------------------------------------
-- Elevens egen materialplan (punkt 5)
-- ---------------------------------------------------------------------
create table public.material_plan_items (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.assignment_participants (id) on delete cascade,
  component text not null,
  dimension text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index material_plan_items_participant_id_idx on public.material_plan_items (participant_id);

-- ---------------------------------------------------------------------
-- Bedömning (punkt 19): lärarens egna kriterier per uppdrag, med resultat
-- per elev. Helt frikopplad från material_plan_items/participants --
-- bedömningen gäller det praktiska arbetet i verkstaden, inte bara den
-- digitala materialplanen.
-- ---------------------------------------------------------------------
create table public.assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index assessment_criteria_assignment_id_idx on public.assessment_criteria (assignment_id);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  criteria_id uuid not null references public.assessment_criteria (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'ej_bedomd' check (status in ('ej_bedomd', 'uppfyller', 'behover_kompletteras')),
  comment text not null default '',
  assessed_by uuid references public.profiles (id),
  assessed_at timestamptz not null default now(),
  unique (criteria_id, student_id)
);

create index assessment_results_student_id_idx on public.assessment_results (student_id);

-- ---------------------------------------------------------------------
-- Material- och artikelregister på skolnivå (punkt 12). Källa för
-- massimport (CSV/Excel eller AI-tolkad bild av grossistkatalog) och för
-- QR-koder per artikel. Lager-fält förberedda för Förråds-modulen.
-- ---------------------------------------------------------------------
create table public.material_catalog (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  article_number text not null default '',
  rsk_number text not null default '',
  dimension text not null default '',
  category text not null default '',
  supplier text not null default '',
  shelf_location text not null default '',
  stock_quantity integer not null default 0,
  min_quantity integer,
  reorder_quantity integer,
  image_url text,
  note text not null default '',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index material_catalog_org_id_idx on public.material_catalog (org_id);
create index material_catalog_rsk_number_idx on public.material_catalog (rsk_number);

-- =======================================================================
-- Row Level Security
-- =======================================================================
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_links enable row level security;
alter table public.assignments enable row level security;
alter table public.material_requirements enable row level security;
alter table public.student_sessions enable row level security;
alter table public.assignment_assignments enable row level security;
alter table public.assignment_participants enable row level security;
alter table public.material_plan_items enable row level security;
alter table public.assessment_criteria enable row level security;
alter table public.assessment_results enable row level security;
alter table public.material_catalog enable row level security;

-- Helper: den inloggade lärarens egna, godkända profil.
create or replace function public.current_teacher()
returns public.profiles
language sql
stable
security definer
set search_path = public, extensions
as $$
  select * from public.profiles
  where id = auth.uid() and status = 'approved'
  limit 1;
$$;

-- ---- orgs ----
-- Ingen direkt insert/update från klienten -- allt går via RPC:erna nedan
-- så att org + admin-profil skapas atomiskt.
create policy "orgs: medlemmar kan läsa sin egen org"
on public.orgs for select
to authenticated
using (id = (select org_id from public.profiles where id = auth.uid()));

-- ---- profiles ----
create policy "profiles: läsa egen rad"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles: org-admin läser alla i sin org"
on public.profiles for select
to authenticated
using (org_id = (select org_id from public.current_teacher() where role = 'admin'));

create policy "profiles: org-admin godkänner/uppdaterar medlemmar"
on public.profiles for update
to authenticated
using (org_id = (select org_id from public.current_teacher() where role = 'admin'))
with check (org_id = (select org_id from public.current_teacher() where role = 'admin'));

-- ---- classes (enkel CRUD, inget server-genererat fält behövs) ----
create policy "classes: läsa inom org"
on public.classes for select
to authenticated
using (org_id = (select org_id from public.current_teacher()));

create policy "classes: skapa inom org"
on public.classes for insert
to authenticated
with check (org_id = (select org_id from public.current_teacher()) and created_by = auth.uid());

create policy "classes: uppdatera inom org"
on public.classes for update
to authenticated
using (org_id = (select org_id from public.current_teacher()))
with check (org_id = (select org_id from public.current_teacher()));

create policy "classes: ta bort inom org"
on public.classes for delete
to authenticated
using (org_id = (select org_id from public.current_teacher()));

-- ---- students (läsning direkt, skrivning bara via RPC pga server-kod) ----
create policy "students: lärare i org läser elever"
on public.students for select
to authenticated
using (class_id in (select id from public.classes where org_id = (select org_id from public.current_teacher())));

-- ---- student_links (bara läsning för support/felsökning, aldrig skrivning från klient) ----
create policy "student_links: lärare i org läser länkar"
on public.student_links for select
to authenticated
using (
  student_id in (
    select s.id from public.students s join public.classes c on c.id = s.class_id
    where c.org_id = (select org_id from public.current_teacher())
  )
);

-- Eleven måste kunna läsa sin EGEN länk -- annars misslyckas alla RLS-
-- kontroller på andra tabeller (t.ex. material_plan_items) som slår upp
-- "student_id in (select student_id from student_links where auth_uid =
-- auth.uid())", eftersom den subquery-n körs under elevens egen RLS-
-- kontext, inte SECURITY DEFINER.
create policy "student_links: eleven läser sin egen rad"
on public.student_links for select
to authenticated
using (auth_uid = auth.uid());

-- ---- assignments (endast godkända lärare i samma org) ----
create policy "assignments: läsa inom org"
on public.assignments for select
to authenticated
using (org_id = (select org_id from public.current_teacher()));

create policy "assignments: skapa inom org"
on public.assignments for insert
to authenticated
with check (org_id = (select org_id from public.current_teacher()) and created_by = auth.uid());

create policy "assignments: uppdatera inom org"
on public.assignments for update
to authenticated
using (org_id = (select org_id from public.current_teacher()))
with check (org_id = (select org_id from public.current_teacher()));

create policy "assignments: ta bort inom org"
on public.assignments for delete
to authenticated
using (org_id = (select org_id from public.current_teacher()));

-- ---- material_requirements (endast lärare -- ingen policy för anon/elev) ----
create policy "material_requirements: lärare i org hanterar facit"
on public.material_requirements for all
to authenticated
using (
  assignment_id in (
    select id from public.assignments
    where org_id = (select org_id from public.current_teacher())
  )
)
with check (
  assignment_id in (
    select id from public.assignments
    where org_id = (select org_id from public.current_teacher())
  )
);

-- ---- student_sessions (endast lärare -- elever går via RPC join_session) ----
create policy "student_sessions: lärare i org hanterar sessioner"
on public.student_sessions for all
to authenticated
using (
  assignment_id in (
    select id from public.assignments
    where org_id = (select org_id from public.current_teacher())
  )
)
with check (
  assignment_id in (
    select id from public.assignments
    where org_id = (select org_id from public.current_teacher())
  )
);

-- ---- assignment_assignments (tilldelning, endast lärare) ----
create policy "assignment_assignments: lärare i org hanterar tilldelningar"
on public.assignment_assignments for all
to authenticated
using (
  assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher()))
)
with check (
  assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher()))
  and (
    class_id is null
    or class_id in (select id from public.classes where org_id = (select org_id from public.current_teacher()))
  )
  and (
    student_id is null
    or student_id in (
      select s.id from public.students s join public.classes c on c.id = s.class_id
      where c.org_id = (select org_id from public.current_teacher())
    )
  )
);

-- ---- assignment_participants ----
create policy "assignment_participants: eleven läser egen rad, QR"
on public.assignment_participants for select
to authenticated
using (auth_uid = auth.uid());

create policy "assignment_participants: eleven läser egen rad, klass"
on public.assignment_participants for select
to authenticated
using (student_id in (select student_id from public.student_links where auth_uid = auth.uid()));

create policy "assignment_participants: lärare i org läser alla"
on public.assignment_participants for select
to authenticated
using (assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher())));

-- Ingen direkt insert/update-policy för klienten -- join_session,
-- open_assignment_as_student och submit_material_plan/reopen_material_plan
-- (SECURITY DEFINER) hanterar livscykeln så att utgångskontroll,
-- tilldelning och låsning inte kan kringgås.

-- ---- material_plan_items ----
create policy "material_plan_items: eleven läser sina egna rader"
on public.material_plan_items for select
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where auth_uid = auth.uid()
       or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
  )
);

create policy "material_plan_items: eleven skriver egna rader innan lås"
on public.material_plan_items for insert
to authenticated
with check (
  participant_id in (
    select id from public.assignment_participants
    where plan_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
);

create policy "material_plan_items: eleven ändrar egna rader innan lås"
on public.material_plan_items for update
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where plan_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
)
with check (
  participant_id in (
    select id from public.assignment_participants
    where plan_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
);

create policy "material_plan_items: eleven tar bort egna rader innan lås"
on public.material_plan_items for delete
to authenticated
using (
  participant_id in (
    select id from public.assignment_participants
    where plan_locked = false
      and (
        auth_uid = auth.uid()
        or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
      )
  )
);

create policy "material_plan_items: lärare i org läser alla"
on public.material_plan_items for select
to authenticated
using (
  participant_id in (
    select ap.id from public.assignment_participants ap
    join public.assignments a on a.id = ap.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);

-- ---- assessment_criteria (endast lärare) ----
create policy "assessment_criteria: lärare i org hanterar kriterier"
on public.assessment_criteria for all
to authenticated
using (assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher())))
with check (assignment_id in (select id from public.assignments where org_id = (select org_id from public.current_teacher())));

-- ---- assessment_results (endast lärare -- ALDRIG synligt för eleven här) ----
create policy "assessment_results: lärare i org hanterar bedömningar"
on public.assessment_results for all
to authenticated
using (
  criteria_id in (
    select ac.id from public.assessment_criteria ac join public.assignments a on a.id = ac.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
)
with check (
  criteria_id in (
    select ac.id from public.assessment_criteria ac join public.assignments a on a.id = ac.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
  and student_id in (
    select s.id from public.students s join public.classes c on c.id = s.class_id
    where c.org_id = (select org_id from public.current_teacher())
  )
);

-- ---- material_catalog (endast lärare) ----
create policy "material_catalog: läsa inom org"
on public.material_catalog for select
to authenticated
using (org_id = (select org_id from public.current_teacher()));

create policy "material_catalog: skapa inom org"
on public.material_catalog for insert
to authenticated
with check (org_id = (select org_id from public.current_teacher()));

create policy "material_catalog: uppdatera inom org"
on public.material_catalog for update
to authenticated
using (org_id = (select org_id from public.current_teacher()))
with check (org_id = (select org_id from public.current_teacher()));

create policy "material_catalog: ta bort inom org"
on public.material_catalog for delete
to authenticated
using (org_id = (select org_id from public.current_teacher()));

-- =======================================================================
-- RPC-funktioner
-- =======================================================================

-- Skapa en ny organisation (skola) och gör den inloggade användaren till
-- godkänd admin direkt. Kräver att användaren inte redan har en profil.
create or replace function public.create_org_and_admin(org_name text, teacher_name text)
returns public.orgs
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_org public.orgs;
  code text;
begin
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Du har redan en lärarprofil.';
  end if;
  if org_name is null or length(trim(org_name)) = 0 then
    raise exception 'Skolans namn krävs.';
  end if;

  loop
    code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.orgs where join_code = code);
  end loop;

  insert into public.orgs (name, join_code) values (trim(org_name), code)
  returning * into new_org;

  insert into public.profiles (id, org_id, full_name, role, status)
  values (auth.uid(), new_org.id, coalesce(trim(teacher_name), ''), 'admin', 'approved');

  return new_org;
end;
$$;

-- Gå med i en befintlig organisation via dess join_code. Skapar en
-- profil med status 'pending' -- en org-admin måste godkänna innan
-- läraren ser något org-data (se RLS ovan: pending-profiler matchar
-- inte current_teacher()).
create or replace function public.join_org(code text, teacher_name text)
returns public.orgs
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target public.orgs;
begin
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Du har redan en lärarprofil.';
  end if;

  select * into target from public.orgs where join_code = upper(trim(code));
  if target.id is null then
    raise exception 'Ingen skola hittades med den koden.';
  end if;

  insert into public.profiles (id, org_id, full_name, role, status)
  values (auth.uid(), target.id, coalesce(trim(teacher_name), ''), 'teacher', 'pending');

  return target;
end;
$$;

-- Elevens QR-scan: kräver att klienten redan anropat
-- supabase.auth.signInAnonymously() så att auth.uid() finns. Validerar
-- utgång/återkallning server-side och returnerar bara publik
-- uppdragsinformation -- aldrig facit.
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
      'reveal_mode', assign.reveal_mode,
      'ai_mode', assign.ai_mode,
      'steps', assign.steps
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at
  );
end;
$$;

-- Löser in en elevs personliga, läsårslånga kod och kopplar den till den
-- aktuella enhetens anonyma auth-session. Kan köras flera gånger (nytt
-- byte av enhet, ominstallation) utan att tappa elevens identitet.
create or replace function public.redeem_student_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target public.students;
  cls public.classes;
begin
  if auth.uid() is null then
    raise exception 'Ingen session -- logga in anonymt först.';
  end if;

  select * into target from public.students where code = upper(trim(p_code));
  if target.id is null then
    raise exception 'Okänd elevkod.';
  end if;
  if target.revoked_at is not null then
    raise exception 'Den här koden är inte längre giltig -- be din lärare om en ny.';
  end if;

  insert into public.student_links (student_id, auth_uid)
  values (target.id, auth.uid())
  on conflict (student_id, auth_uid) do nothing;

  select * into cls from public.classes where id = target.class_id;

  return jsonb_build_object(
    'student_id', target.id,
    'name', target.name,
    'class_id', target.class_id,
    'class_name', cls.name
  );
end;
$$;

-- Lärarens registrering av en ny elev i en klass -- genererar en unik,
-- läsårslång kod servern äger (klienten kan inte styra/gissa den).
create or replace function public.add_student(p_class_id uuid, p_name text)
returns public.students
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  teacher public.profiles;
  cls public.classes;
  new_code text;
  new_student public.students;
begin
  teacher := public.current_teacher();
  if teacher.id is null then
    raise exception 'Ingen behörighet.';
  end if;

  select * into cls from public.classes where id = p_class_id and org_id = teacher.org_id;
  if cls.id is null then
    raise exception 'Okänd klass.';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Elevens namn krävs.';
  end if;

  loop
    new_code := 'ELEV-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.students where code = new_code);
  end loop;

  insert into public.students (class_id, name, code)
  values (p_class_id, trim(p_name), new_code)
  returning * into new_student;

  return new_student;
end;
$$;

-- Ny kod åt en elev som tappat sitt kort. Den gamla koden slutar
-- fungera för nya inlösen, men enheter som redan är länkade
-- (student_links) fortsätter fungera -- se remove_student för att helt
-- stänga av en elev.
create or replace function public.regenerate_student_code(p_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  teacher public.profiles;
  new_code text;
  updated public.students;
begin
  teacher := public.current_teacher();
  if teacher.id is null then
    raise exception 'Ingen behörighet.';
  end if;
  if not exists (
    select 1 from public.students s join public.classes c on c.id = s.class_id
    where s.id = p_student_id and c.org_id = teacher.org_id
  ) then
    raise exception 'Okänd elev.';
  end if;

  loop
    new_code := 'ELEV-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.students where code = new_code);
  end loop;

  update public.students set code = new_code where id = p_student_id
  returning * into updated;

  return updated;
end;
$$;

-- Stänger av en elevs kod helt (t.ex. eleven har slutat). Behåller
-- historiken (bedömning, inskickade planer) -- raderar inget.
create or replace function public.remove_student(p_student_id uuid)
returns void
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

  update public.students s set revoked_at = now()
  from public.classes c
  where s.id = p_student_id and s.class_id = c.id and c.org_id = teacher.org_id;

  if not found then
    raise exception 'Okänd elev.';
  end if;
end;
$$;

-- Elevens (klassregister-vägen) öppning av ett uppdrag som tilldelats
-- hens klass eller hen själv. Kräver att koden redan lösts in
-- (redeem_student_code) på den här enheten. Motsvarar join_session för
-- QR-vägen, men utan tidsbegränsning -- synlighet styrs av
-- assignments.status + assignment_assignments istället.
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
      'reveal_mode', assign.reveal_mode,
      'ai_mode', assign.ai_mode,
      'steps', assign.steps
    ),
    'plan_locked', participant.plan_locked,
    'plan_submitted_at', participant.plan_submitted_at
  );
end;
$$;

-- Listar uppdrag som är aktiva OCH tilldelade den inloggade elevens
-- klass eller elev-id -- den elev-vy motsvarigheten till lärarens
-- "Uppdrag"-lista.
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
      'id', a.id, 'title', a.title, 'description', a.description
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

-- Styrd vy av lärarens facit åt eleven, enligt uppdragets reveal_mode.
-- 'hidden' -> tom lista, 'count' -> bara antal rader, 'full' -> allt.
create or replace function public.get_requirements_view(p_participant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  part public.assignment_participants;
  assign public.assignments;
  mode text;
  n integer;
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

  mode := assign.reveal_mode;

  if mode = 'full' then
    return (
      select coalesce(jsonb_agg(jsonb_build_object(
        'component', component, 'dimension', dimension,
        'quantity', quantity, 'note', note
      ) order by sort_order), '[]'::jsonb)
      from public.material_requirements where assignment_id = assign.id
    );
  elsif mode = 'count' then
    select count(*) into n from public.material_requirements where assignment_id = assign.id;
    return jsonb_build_object('hidden', true, 'count', n);
  else
    return jsonb_build_object('hidden', true, 'count', null);
  end if;
end;
$$;

-- Eleven skickar in sin materialplan -- låser vidare redigering.
create or replace function public.submit_material_plan(p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.assignment_participants
  set plan_submitted_at = now(), plan_locked = true
  where id = p_participant_id
    and plan_locked = false
    and (
      auth_uid = auth.uid()
      or student_id in (select student_id from public.student_links where auth_uid = auth.uid())
    );

  if not found then
    raise exception 'Kunde inte skicka in materialplanen (redan inskickad eller okänd session).';
  end if;
end;
$$;

-- Läraren öppnar upp en inskickad plan igen för komplettering.
create or replace function public.reopen_material_plan(p_participant_id uuid)
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
  set plan_locked = false, plan_submitted_at = null
  where id = p_participant_id;
end;
$$;

grant execute on function public.create_org_and_admin(text, text) to authenticated;
grant execute on function public.join_org(text, text) to authenticated;
grant execute on function public.join_session(text) to authenticated, anon;
grant execute on function public.redeem_student_code(text) to authenticated, anon;
grant execute on function public.add_student(uuid, text) to authenticated;
grant execute on function public.regenerate_student_code(uuid) to authenticated;
grant execute on function public.remove_student(uuid) to authenticated;
grant execute on function public.open_assignment_as_student(uuid) to authenticated, anon;
grant execute on function public.list_my_assignments() to authenticated, anon;
grant execute on function public.get_requirements_view(uuid) to authenticated;
grant execute on function public.submit_material_plan(uuid) to authenticated;
grant execute on function public.reopen_material_plan(uuid) to authenticated;
