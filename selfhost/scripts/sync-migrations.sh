#!/bin/sh
# Kopierar appens migrationer och seed till selfhost-stacken.
# Körs innan docker compose up -d --build.
set -eu
cd "$(dirname "$0")/.."
mkdir -p sql/vvs sql/seed
cp ../supabase/migrations/*.sql sql/vvs/
cp ../supabase/seed/*.sql sql/seed/ 2>/dev/null || true
echo "Synkade $(ls sql/vvs | wc -l) migrationer och $(ls sql/seed 2>/dev/null | wc -l) seed-fil(er)."
