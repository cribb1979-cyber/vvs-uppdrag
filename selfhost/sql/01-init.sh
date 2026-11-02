#!/bin/sh
# Körs EN gång, när databasen skapas första gången (docker-entrypoint-initdb.d).
# Skapar de roller och scheman som PostgREST, GoTrue och Realtime förväntar sig,
# plus de shim-tabeller som gör att repots befintliga schema.sql kan köras orörd.
set -eu

psql -v ON_ERROR_STOP=1 -v pw="$POSTGRES_PASSWORD" \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
-- ---------------------------------------------------------------
-- Roller (samma modell som Supabase använder)
-- ---------------------------------------------------------------
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login password :'pw' noinherit;
create role supabase_auth_admin login password :'pw' createrole;
create role supabase_admin login password :'pw' superuser;

grant anon, authenticated, service_role to authenticator;

-- GoTrue skapar sina tabeller med oqualificerade namn; låt dem hamna i auth.
alter role supabase_auth_admin set search_path to auth, public;

-- ---------------------------------------------------------------
-- Scheman
-- ---------------------------------------------------------------
create schema if not exists auth authorization supabase_auth_admin;
create schema if not exists storage;
create schema if not exists _realtime;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant usage on schema storage to anon, authenticated, service_role;
grant usage on schema _realtime to anon, authenticated, service_role, supabase_admin, postgres;

-- Realtime skapar sina egna tabeller i _realtime när det startar.
alter default privileges in schema _realtime grant all on tables to anon, authenticated, service_role;
alter default privileges in schema _realtime grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema _realtime grant all on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- Tillägg som GoTrue och schemat behöver
-- ---------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema public;
create extension if not exists pgcrypto with schema public;
create extension if not exists citext with schema public;

-- ---------------------------------------------------------------
-- storage-shim
-- Repots schema.sql lägger in en bucket och två policies på
-- storage.objects. Vi har ingen Supabase Storage-tjänst, utan en egen
-- liten filserver (backend/storage). Tabellerna finns bara för att
-- schema.sql ska gå att köra oförändrat; åtkomsten kontrolleras i
-- storage-tjänsten i stället.
-- ---------------------------------------------------------------
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select string_to_array(name, '/');
$$;

-- Den egna storage-tjänsten skriver som service_role och läser publikt.
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;
grant all on all sequences in schema storage to anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- Realtime-publicationen som schema.sql fyller på
-- ---------------------------------------------------------------
create publication supabase_realtime;

-- ---------------------------------------------------------------
-- Standardrättigheter för tabeller som skapas senare (av postgres)
-- ---------------------------------------------------------------
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
SQL
