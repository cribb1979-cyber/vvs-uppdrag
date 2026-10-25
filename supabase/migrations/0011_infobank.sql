-- 0011_infobank.sql
-- Infobank: en fysisk installation i verkstaden får en QR-kod. Den som
-- scannar får funktion, driftsättning och ett flödesschema – utan inloggning.
-- Läraren kan stänga av visningen direkt, eller sätta ett tidsfönster.
-- Ingen elevdata finns här; sidan är avsiktligt publik.

create table if not exists public.installations (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  created_by    uuid not null references public.profiles(id),
  token         text not null unique,          -- slumpad, aldrig löpnummer
  titel         text not null,
  plats         text not null default '',
  funktion      text not null default '',
  driftsattning text[] not null default '{}',
  foto_path     text,
  schema_path   text,
  publicerad    boolean not null default false,
  visas_fran    date,
  visas_till    date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ix_installations_org on public.installations(org_id);

alter table public.installations enable row level security;

create policy "installations: läsa inom org"
on public.installations for select to authenticated
using (org_id = (select org_id from public.current_teacher()));

create policy "installations: skapa inom org"
on public.installations for insert to authenticated
with check (
  org_id = (select org_id from public.current_teacher())
  and created_by = auth.uid()
);

create policy "installations: uppdatera inom org"
on public.installations for update to authenticated
using (org_id = (select org_id from public.current_teacher()))
with check (org_id = (select org_id from public.current_teacher()));

create policy "installations: ta bort inom org"
on public.installations for delete to authenticated
using (org_id = (select org_id from public.current_teacher()));

create or replace function public.set_installation_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists installations_updated_at on public.installations;
create trigger installations_updated_at
before update on public.installations
for each row execute function public.set_installation_updated_at();

-- Publik läsning via token. security definer, så anon behöver ingen
-- radbehörighet. Svarar alltid med en status i stället för ett fel, så att
-- en avstängd QR-kod ger ett begripligt besked i stället för en trasig sida.
create or replace function public.installation_public(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  i public.installations;
begin
  if p_token is null or length(p_token) < 8 then
    return jsonb_build_object('status', 'saknas');
  end if;

  select * into i from public.installations where token = p_token;
  if not found then
    return jsonb_build_object('status', 'saknas');
  end if;
  if not i.publicerad then
    return jsonb_build_object('status', 'avstangd');
  end if;
  if i.visas_fran is not null and current_date < i.visas_fran then
    return jsonb_build_object('status', 'planerad', 'fran', i.visas_fran);
  end if;
  if i.visas_till is not null and current_date > i.visas_till then
    return jsonb_build_object('status', 'utgangen', 'till', i.visas_till);
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'titel', i.titel,
    'plats', i.plats,
    'funktion', i.funktion,
    'driftsattning', to_jsonb(i.driftsattning),
    'foto', i.foto_path,
    'schema', i.schema_path,
    'uppdaterad', i.updated_at
  );
end;
$$;

revoke all on function public.installation_public(text) from public;
grant execute on function public.installation_public(text) to anon, authenticated;

-- ---------------------------------------------------------------- bilder --
-- Sökväg: installationer/<org_id>/<uuid>.<ext>. Publik läsning avsiktligt
-- öppen, precis som quiz-images: annars kan en anonym QR-elev inte se bilden.
insert into storage.buckets (id, name, public)
values ('installationer', 'installationer', true)
on conflict (id) do nothing;

create policy "installationer: lärare i org laddar upp"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'installationer'
  and (storage.foldername(name))[1] = (select org_id::text from public.current_teacher())
);

create policy "installationer: lärare i org tar bort"
on storage.objects for delete to authenticated
using (
  bucket_id = 'installationer'
  and (storage.foldername(name))[1] = (select org_id::text from public.current_teacher())
);

create policy "installationer: publik läsning"
on storage.objects for select to public
using (bucket_id = 'installationer');
