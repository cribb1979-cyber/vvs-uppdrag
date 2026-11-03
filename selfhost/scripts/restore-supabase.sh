#!/bin/sh
# Bygger om VVS-databasen och återställer en Supabase-dump.
# Kör först scripts/dump-supabase.sh.
set -eu
cd "$(dirname "$0")/.."
M=migrering

for f in "$M/auth-users.sql" "$M/auth-identities.sql" "$M/public.sql" "$M/storage-objects.csv" "$M/counts.txt"; do
  [ -f "$f" ] || { echo "Saknar $f"; exit 1; }
done

echo "== stoppar och tar bort den gamla volymen =="
docker compose down -v

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
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "truncate storage.objects;"
rm -rf data/storage/*

echo "== auth-användare =="
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$M/auth-users.sql"
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$M/auth-identities.sql"

echo "== tömmer public och återställer appens schema + data =="
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "drop schema public cascade; create schema public;"
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "create extension if not exists \"uuid-ossp\" with schema public; create extension if not exists pgcrypto with schema public; create extension if not exists citext with schema public;"
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$M/public.sql"

echo "== storage-rader =="
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "\copy storage.objects (id, bucket_id, name, owner, created_at) from stdin with (format csv, header true)" \
  < "$M/storage-objects.csv"

echo "== nyare migrationer som dumpen kan sakna =="
for f in sql/vvs/0012_uppdragsbank.sql sql/vvs/0013_materialplan_rsk.sql; do
  [ -f "$f" ] || continue
  echo "== $f"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$f"
done

echo "== kontrollerar antal rader mot dumpen =="
while read -r tabell forvantat; do
  [ -n "$tabell" ] || continue
  faktiskt=$(docker compose exec -T db psql -U postgres -d postgres -Atc "select count(*) from $tabell")
  if [ "$faktiskt" != "$forvantat" ]; then
    echo "FEL: $tabell har $faktiskt rader, dumpen hade $forvantat" >&2
    exit 1
  fi
  echo "  $tabell: $faktiskt"
done < "$M/counts.txt"

echo "== startar resten =="
docker compose up -d

echo "== klart. Glöm inte att kopiera storage-filerna och att sätta Vercel-env. =="
