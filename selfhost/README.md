# VVS Uppdrag – egen backend på Y900

Det här är en liten Supabase-lik backend som körs i Docker på Y900:

- **Postgres 17** med RLS och alla VVS-migrationer
- **GoTrue** för lärare (e-post/lösenord) och anonyma elevsessioner
- **PostgREST** för tabeller och RPC:er
- **Egen storage-tjänst** för `quiz-images` och `installationer`
- **Egen funktion** för `identify-material` (Claude)
- **Caddy** som reverse proxy

Allt ligger i egna containrar, egna volymer och port **8082**. Den befintliga
`vilda`-stacken rörs inte.

## Starta

```bash
cd ~/vvs-supabase
python3 scripts/gen-keys.py        # skriver .env med nya hemligheter
docker compose up -d --build
```

Kontrollera:

```bash
docker compose ps
curl -s http://127.0.0.1:8082/healthz
```

## Gör den publik via Tailscale Funnel

Den publika adressen blir:

```
https://christoffer-ideacentre-y900-34isz.tail3766b4.ts.net:8443/vvs
```

Lägg till den som en path på den befintliga Funnel-porten 8443:

```bash
sudo tailscale funnel --bg --https=8443 --set-path=/vvs --yes http://127.0.0.1:8082
```

Kontrollera att de gamla vägarna är kvar:

```bash
tailscale funnel status
```

## Appen (Vercel)

Sätt dessa miljövariabler i Vercel och deploya om:

```
EXPO_PUBLIC_SUPABASE_URL=https://christoffer-ideacentre-y900-34isz.tail3766b4.ts.net:8443/vvs
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY från ~/vvs-supabase/.env>
```

`ANON_KEY` är publik och får ligga i appen. `SERVICE_ROLE_KEY` får aldrig
lämna servern.

## Första läraren och exempelmallar

När första läraren har registrerat sig i appen kan du köra exempelmallarna:

```bash
docker compose exec -T db psql -U postgres -d postgres < sql/seed/0012_uppdragsbank_exempel.sql
```

## Migrera befintlig data från Supabase

1. Lägg connection string i `~/.vvs-supabase-db-url` (inte anon-nyckeln).
2. Kör:

```bash
bash scripts/dump-supabase.sh
bash scripts/restore-supabase.sh
```

3. Kopiera bilderna från Supabase Storage:

```bash
SUPABASE_PROJECT_URL=https://<projektref>.supabase.co bash scripts/copy-storage-from-supabase.sh
```

## Backup

```bash
bash scripts/backup.sh
```

Lägg gärna in den i cron, t.ex. 03:15 varje natt:

```
15 3 * * * cd /home/christoffer/vvs-supabase && bash scripts/backup.sh
```

## Felsökning

```bash
docker compose ps
docker compose logs -f auth
docker compose logs -f migrate
docker compose logs -f storage
docker compose logs -f functions
docker compose logs -f caddy
```
