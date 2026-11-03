#!/bin/sh
# Lägger till nattlig VVS-backup i användarens crontab utan att röra andra rader.
set -eu
cd "$(dirname "$0")/.."
PROJECT=$(pwd)
LINE="15 3 * * * cd $PROJECT && /bin/sh $PROJECT/scripts/backup.sh >> $PROJECT/data/backups/backup.log 2>&1"

if crontab -l 2>/dev/null | grep -F "$PROJECT/scripts/backup.sh" >/dev/null; then
  echo "Cron-raden finns redan:"
  crontab -l | grep -F "$PROJECT/scripts/backup.sh"
  exit 0
fi

{
  crontab -l 2>/dev/null || true
  echo "# VVS Uppdrag: nattlig backup av databas + storage (03:15)"
  echo "$LINE"
} | crontab -

echo "Cron-rad installerad:"
crontab -l | tail -3
