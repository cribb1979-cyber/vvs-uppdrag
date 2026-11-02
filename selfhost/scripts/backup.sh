#!/bin/sh
# Enkel backup: databas + storage. Kör t.ex. varje natt med cron.
set -eu
cd "$(dirname "$0")/.."
mkdir -p data/backups
STAMP=$(date +%Y%m%d-%H%M)

docker compose exec -T db pg_dump -U postgres -d postgres -Fc > "data/backups/vvs-$STAMP.dump"
tar czf "data/backups/storage-$STAMP.tar.gz" -C data/storage .
find data/backups -type f -mtime +14 -delete

echo "Backup klar: data/backups/vvs-$STAMP.dump"
