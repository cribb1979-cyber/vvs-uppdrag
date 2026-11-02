#!/bin/sh
# Kopierar bilderna från Supabase Storage till den egna storage-mappen.
# Bucketarna quiz-images och installationer är publika, så inga nycklar behövs.
#
# Kör efter restore-supabase.sh:
#   SUPABASE_PROJECT_URL=https://<projektref>.supabase.co bash scripts/copy-storage-from-supabase.sh
set -eu
cd "$(dirname "$0")/.."
: "${SUPABASE_PROJECT_URL:?Sätt SUPABASE_PROJECT_URL, t.ex. https://abcdefgh.supabase.co}"

docker compose exec -T db psql -U postgres -d postgres -tAc \
  "select bucket_id || E'\t' || name from storage.objects order by bucket_id, name" |
while IFS="$(printf '\t')" read -r bucket name; do
  [ -n "$bucket" ] && [ -n "$name" ] || continue
  mkdir -p "data/storage/$bucket/$(dirname "$name")"
  echo "hämtar $bucket/$name"
  curl -fsS --path-as-is \
    "$SUPABASE_PROJECT_URL/storage/v1/object/public/$bucket/$name" \
    -o "data/storage/$bucket/$name"
done

echo "Klart: $(find data/storage -type f | wc -l) filer i data/storage"
