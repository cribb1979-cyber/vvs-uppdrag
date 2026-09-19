-- VVS Uppdrag -- grundschema
--
-- Designprinciper (se docs/architecture.md):
-- 1. Multi-tenant: allt scopas på org_id (skola), isolerat via RLS.
-- 2. "Temporary workspace first": elever autentiseras med Supabase
--    Anonymous Sign-ins (ingen e-post/personnummer krävs). En elevsession
--    är en rad i session_participants bunden till en tidsbegränsad
--    student_sessions-rad. RLS + RPC:er enforcerar utgång server-side --
--    klienten kan aldrig läsa ett uppdrag via en utgången/återkallad session.
-- 3. Lärarens facit (material_requirements) har INGEN policy för anon-rollen
--    alls -- default-deny i Postgres RLS betyder att en elevklient inte kan
--    SELECT:a tabellen oavsett reveal_mode. Den styrda, delvisa visningen
--    (dolt/antal/allt) exponeras enbart via RPC:en get_requirements_view.

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
  created_at timestamptz not null default now()
);

create index assignments_org_id_idx on public.assignments (org_id);

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
-- knuten till ett uppdrag. Flera elever kan gå med på samma session-kod --
-- var och en får sin egen rad i session_participants.
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
-- Enskild elevs anslutning till en session (anonym auth.uid, ingen
-- personuppgift). unik per (session, auth_uid) -- en elev som scannar
-- flera olika uppdrags-QR med samma app/enhet får en rad per session.
-- ---------------------------------------------------------------------
create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.student_sessions (id) on delete cascade,
  auth_uid uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  plan_submitted_at timestamptz,
  plan_locked boolean not null default false,
  unique (session_id, auth_uid)
);

create index session_participants_session_id_idx on public.session_participants (session_id);
create index session_participants_auth_uid_idx on public.session_participants (auth_uid);

-- ---------------------------------------------------------------------
-- Elevens egen materialplan (punkt 5)
-- ---------------------------------------------------------------------
create table public.material_plan_items (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.session_participants (id) on delete cascade,
  component text not null,
  dimension text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index material_plan_items_participant_id_idx on public.material_plan_items (participant_id);

-- =======================================================================
-- Row Level Security
-- =======================================================================
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.material_requirements enable row level security;
alter table public.student_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.material_plan_items enable row level security;

-- Helper: den inloggade lärarens egna, godkända profil.
create or replace function public.current_teacher()
returns public.profiles
language sql
stable
security definer
set search_path = public
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

-- ---- session_participants ----
create policy "session_participants: eleven läser sin egen rad"
on public.session_participants for select
to authenticated
using (auth_uid = auth.uid());

create policy "session_participants: lärare i org läser alla"
on public.session_participants for select
to authenticated
using (
  session_id in (
    select ss.id from public.student_sessions ss
    join public.assignments a on a.id = ss.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);

-- Ingen direkt insert/update-policy för klienten -- join_session och
-- submit_material_plan/reopen_material_plan (SECURITY DEFINER) hanterar
-- livscykeln så att utgångskontroll och låsning inte kan kringgås.

-- ---- material_plan_items ----
create policy "material_plan_items: eleven läser sina egna rader"
on public.material_plan_items for select
to authenticated
using (
  participant_id in (
    select id from public.session_participants where auth_uid = auth.uid()
  )
);

create policy "material_plan_items: eleven skriver egna rader innan lås"
on public.material_plan_items for insert
to authenticated
with check (
  participant_id in (
    select id from public.session_participants
    where auth_uid = auth.uid() and plan_locked = false
  )
);

create policy "material_plan_items: eleven ändrar egna rader innan lås"
on public.material_plan_items for update
to authenticated
using (
  participant_id in (
    select id from public.session_participants
    where auth_uid = auth.uid() and plan_locked = false
  )
)
with check (
  participant_id in (
    select id from public.session_participants
    where auth_uid = auth.uid() and plan_locked = false
  )
);

create policy "material_plan_items: eleven tar bort egna rader innan lås"
on public.material_plan_items for delete
to authenticated
using (
  participant_id in (
    select id from public.session_participants
    where auth_uid = auth.uid() and plan_locked = false
  )
);

create policy "material_plan_items: lärare i org läser alla"
on public.material_plan_items for select
to authenticated
using (
  participant_id in (
    select sp.id from public.session_participants sp
    join public.student_sessions ss on ss.id = sp.session_id
    join public.assignments a on a.id = ss.assignment_id
    where a.org_id = (select org_id from public.current_teacher())
  )
);

-- =======================================================================
-- RPC-funktioner
-- =======================================================================

-- Skapa en ny organisation (skola) och gör den inloggade användaren till
-- godkänd admin direkt. Kräver att användaren inte redan har en profil.
create or replace function public.create_org_and_admin(org_name text, teacher_name text)
returns public.orgs
language plpgsql
security definer
set search_path = public
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
set search_path = public
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
set search_path = public
as $$
declare
  sess public.student_sessions;
  assign public.assignments;
  participant public.session_participants;
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

  insert into public.session_participants (session_id, auth_uid)
  values (sess.id, auth.uid())
  on conflict (session_id, auth_uid) do update set session_id = excluded.session_id
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

-- Styrd vy av lärarens facit åt eleven, enligt uppdragets reveal_mode.
-- 'hidden' -> tom lista, 'count' -> bara antal rader, 'full' -> allt.
create or replace function public.get_requirements_view(p_participant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  part public.session_participants;
  assign public.assignments;
  mode text;
  n integer;
begin
  select * into part from public.session_participants
  where id = p_participant_id and auth_uid = auth.uid();
  if part.id is null then
    raise exception 'Okänd session.';
  end if;

  select a.* into assign from public.assignments a
  join public.student_sessions ss on ss.assignment_id = a.id
  where ss.id = part.session_id;

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
set search_path = public
as $$
begin
  update public.session_participants
  set plan_submitted_at = now(), plan_locked = true
  where id = p_participant_id and auth_uid = auth.uid() and plan_locked = false;

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
set search_path = public
as $$
declare
  allowed boolean;
begin
  select exists (
    select 1 from public.session_participants sp
    join public.student_sessions ss on ss.id = sp.session_id
    join public.assignments a on a.id = ss.assignment_id
    where sp.id = p_participant_id
      and a.org_id = (select org_id from public.current_teacher())
  ) into allowed;

  if not allowed then
    raise exception 'Ingen behörighet.';
  end if;

  update public.session_participants
  set plan_locked = false, plan_submitted_at = null
  where id = p_participant_id;
end;
$$;

grant execute on function public.create_org_and_admin(text, text) to authenticated;
grant execute on function public.join_org(text, text) to authenticated;
grant execute on function public.join_session(text) to authenticated, anon;
grant execute on function public.get_requirements_view(uuid) to authenticated;
grant execute on function public.submit_material_plan(uuid) to authenticated;
grant execute on function public.reopen_material_plan(uuid) to authenticated;
