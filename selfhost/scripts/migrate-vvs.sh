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

for f in /vvs/migrations/*.sql; do
  echo "== $f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "== VVS-schemat är klart"
