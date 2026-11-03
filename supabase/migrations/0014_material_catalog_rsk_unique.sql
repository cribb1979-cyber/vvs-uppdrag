-- Ett RSK-nummer ska bara finnas en gång per skola. Tomma RSK får vara flera
-- (artiklar utan RSK). Det hindrar att elevplaner skapar dubbletter.
create unique index if not exists material_catalog_org_rsk_uidx
  on public.material_catalog (org_id, rsk_number)
  where rsk_number <> '';
