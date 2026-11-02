#!/bin/sh
# Bygger om VVS-databasen och återställer en Supabase-dump.
# Kör först scripts/dump-supabase.sh.
set -eu
cd "$(dirname "$0")/.."
M=migrering

for f in "$M/auth-users.sql" "$M/auth-identities.sql" "$M/public.sql" "$M/storage-objects.sql"; do
  [ -f "$f" ] || { echo "Saknar $f"; exit 1; }
done

echo "== stoppar och tar bort den gamla volymen =="
docker compose down
docker volume rm vvs-supabase_pgdata 2>/dev/null || true

echo "== startar PostgreSQL 17 + GoTrue =="
docker compose up -d db auth

echo "== väntar på auth.users =="
i=0
until docker compose exec -T db psql -U postgres -d postgres -tAc "select to_regclass('auth.users');" 2>/dev/null | grep -q auth.users; do
  i=$((i+1))
  [ "$i" -gt 90 ] && { echo "Timeout: auth.users dök inte upp"; exit 1; }
  sleep 2
done

echo "== tömmer gamla storage-rader och filer =="
docker compose exec -T db psql -U postgres -d postgres -c "truncate storage.objects;" || true
rm -rf data/storage/*

echo "== auth-användare =="
docker compose exec -T db psql -U postgres -d postgres < "$M/auth-users.sql"
docker compose exec -T db psql -U postgres -d postgres < "$M/auth-identities.sql"

echo "== tömmer public och återställer appens schema + data =="
docker compose exec -T db psql -U postgres -d postgres -c "drop schema public cascade; create schema public;"
docker compose exec -T db psql -U postgres -d postgres -c "create extension if not exists \"uuid-ossp\" with schema public; create extension if not exists pgcrypto with schema public; create extension if not exists citext with schema public;"
docker compose exec -T db psql -U postgres -d postgres < "$M/public.sql"

echo "== storage-rader =="
docker compose exec -T db psql -U postgres -d postgres < "$M/storage-objects.sql"

echo "== nyare migrationer som dumpen kan sakna =="
docker compose exec -T db psql -U postgres -d postgres < sql/vvs/0012_uppdragsbank.sql

echo "== startar resten =="
docker compose up -d

echo "== klart. Glöm inte att kopiera storage-filerna och att sätta Vercel-env. =="
