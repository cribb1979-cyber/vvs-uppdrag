#!/bin/sh
# Kör VVS-migrationerna i ordning när databasen och GoTrue är uppe.
# Körs som engångstjänst av docker compose.
set -eu

: "${DB_URL:?DB_URL saknas}"

wait_for() {
  i=0
  until [ -n "$(psql "$DB_URL" -tAc "$1" 2>/dev/null)" ]; do
    i=$((i + 1))
    if [ "$i" -gt 150 ]; then
      echo "Timeout: väntade på $2" >&2
      exit 1
    fi
    sleep 2
  done
}

wait_for "select 1" "databasen"
wait_for "select to_regclass('auth.users')" "auth.users (GoTrue)"

psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists public.schema_migrations (
  filnamn text primary key,
  applied_at timestamptz not null default now()
);
revoke all on public.schema_migrations from anon, authenticated;
SQL

# Om apptabellerna redan finns men spårningstabellen är tom (en databas som
# migrerats innan spårningen infördes) markeras nuvarande filer som körda.
HAR_APP=$(psql "$DB_URL" -tAc "select to_regclass('public.assignments') is not null")
ANTAL=$(psql "$DB_URL" -tAc "select count(*) from public.schema_migrations")
if [ "$ANTAL" = "0" ] && [ "$HAR_APP" = "t" ]; then
  echo "== befintlig databas – baslinje för nuvarande migrationer"
  for f in /vvs/migrations/*.sql; do
    namn=$(basename "$f")
    psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
      "insert into public.schema_migrations (filnamn) values ('$namn') on conflict do nothing;"
  done
  echo "== VVS-schemat är klart"
  exit 0
fi

for f in /vvs/migrations/*.sql; do
  namn=$(basename "$f")
  kord=$(psql "$DB_URL" -tAc "select 1 from public.schema_migrations where filnamn = '$namn'")
  if [ "$kord" = "1" ]; then
    echo "== $namn (redan körd)"
    continue
  fi
  echo "== $namn"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -1 -f "$f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
    "insert into public.schema_migrations (filnamn) values ('$namn');"
done

echo "== VVS-schemat är klart"
