#!/bin/sh
# Dumpar VVS-produktionen från Supabase till migrering/.
#
# Lägg connection string (URI, inte anon-nyckeln) i ~/.vvs-supabase-db-url:
#   postgresql://postgres.<projektref>:<lösenord>@aws-0-...:5432/postgres
#
# Kör:  bash scripts/dump-supabase.sh
set -eu
cd "$(dirname "$0")/.."
OUT=migrering
FILE="${SUPABASE_DB_URL_FILE:-$HOME/.vvs-supabase-db-url}"
[ -f "$FILE" ] || { echo "Saknar $FILE"; exit 1; }
mkdir -p "$OUT"

RAW=$(cat "$FILE")
USER=$(printf '%s' "$RAW" | sed -E 's#^[^:]+://([^:]+):.*#\1#')
PASS=$(printf '%s' "$RAW" | sed -E 's#^[^:]+://[^:]+:([^@]*)@.*#\1#')
HOST=$(printf '%s' "$RAW" | sed -E 's#^[^@]+@([^:/]+).*#\1#')
PORT=$(printf '%s' "$RAW" | sed -nE 's#^[^@]+@[^:]+:([0-9]+).*#\1#p')
PORT=${PORT:-5432}
[ -n "$USER" ] && [ -n "$PASS" ] && [ -n "$HOST" ] || { echo "Kunde inte läsa URL:en"; exit 1; }

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT; chmod 600 "$TMP"
printf 'PGPASSWORD=%s\n' "$PASS" > "$TMP"

docker run --rm --env-file "$TMP" \
  -e PGHOST="$HOST" -e PGPORT="$PORT" -e PGUSER="$USER" -e PGDATABASE=postgres \
  -v "$PWD/$OUT:/out" postgres:17 sh -c '
    set -e
    echo "== public (schema + data)"
    pg_dump --schema=public --no-owner --no-privileges --file=/out/public.sql
    echo "== auth.users"
    pg_dump --data-only --table=auth.users --file=/out/auth-users.sql
    echo "== auth.identities"
    pg_dump --data-only --table=auth.identities --file=/out/auth-identities.sql
    echo "== storage.objects"
    pg_dump --data-only --table=storage.objects --file=/out/storage-objects.sql
    ls -l /out
  '
