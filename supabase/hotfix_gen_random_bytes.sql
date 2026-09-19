-- Engångsfix: gen_random_bytes() bor i schemat `extensions` på riktiga
-- Supabase-projekt (inte `public`, som på lokala testdatabaser). Våra
-- SECURITY DEFINER-funktioner låste search_path till bara `public` av
-- säkerhetsskäl, vilket gjorde att de inte hittade den. Lägger till
-- `extensions` i sökvägen för de tre funktioner som använder den.
-- Säker att köra utan reset -- CREATE OR REPLACE rör inga tabeller/data.

create or replace function public.create_org_and_admin(org_name text, teacher_name text)
returns public.orgs
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_org public.orgs;
  code text;
begin
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Du har redan en lärarprofil.';
  end if;
  if org_name is null or length(trim(org_name)) = 0 then
    raise exception 'Skolans namn krävs.';
  end if;

  loop
    code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.orgs where join_code = code);
  end loop;

  insert into public.orgs (name, join_code) values (trim(org_name), code)
  returning * into new_org;

  insert into public.profiles (id, org_id, full_name, role, status)
  values (auth.uid(), new_org.id, coalesce(trim(teacher_name), ''), 'admin', 'approved');

  return new_org;
end;
$$;

create or replace function public.add_student(p_class_id uuid, p_name text)
returns public.students
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  teacher public.profiles;
  cls public.classes;
  new_code text;
  new_student public.students;
begin
  teacher := public.current_teacher();
  if teacher.id is null then
    raise exception 'Ingen behörighet.';
  end if;

  select * into cls from public.classes where id = p_class_id and org_id = teacher.org_id;
  if cls.id is null then
    raise exception 'Okänd klass.';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Elevens namn krävs.';
  end if;

  loop
    new_code := 'ELEV-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.students where code = new_code);
  end loop;

  insert into public.students (class_id, name, code)
  values (p_class_id, trim(p_name), new_code)
  returning * into new_student;

  return new_student;
end;
$$;

create or replace function public.regenerate_student_code(p_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  teacher public.profiles;
  new_code text;
  updated public.students;
begin
  teacher := public.current_teacher();
  if teacher.id is null then
    raise exception 'Ingen behörighet.';
  end if;
  if not exists (
    select 1 from public.students s join public.classes c on c.id = s.class_id
    where s.id = p_student_id and c.org_id = teacher.org_id
  ) then
    raise exception 'Okänd elev.';
  end if;

  loop
    new_code := 'ELEV-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.students where code = new_code);
  end loop;

  update public.students set code = new_code where id = p_student_id
  returning * into updated;

  return updated;
end;
$$;

select 'Klart -- gen_random_bytes-fixen är på plats.' as status;
