-- Engångsverktyg för utvecklingsmiljön: nollställer schemat helt så att
-- 0001_init.sql kan köras på nytt från grunden. ANVÄND ALDRIG detta mot en
-- databas med riktig data -- allt raderas permanent.
--
-- Körs en gång om ett tidigare (delvis eller äldre) körning av
-- 0001_init.sql redan skapat tabeller/funktioner, t.ex. felet
-- "relation ... already exists".

drop table if exists public.material_plan_items cascade;
drop table if exists public.assignment_participants cascade;
drop table if exists public.session_participants cascade; -- äldre tabellnamn, ifall en tidigare version kördes
drop table if exists public.assessment_results cascade;
drop table if exists public.assessment_criteria cascade;
drop table if exists public.assignment_assignments cascade;
drop table if exists public.student_sessions cascade;
drop table if exists public.material_requirements cascade;
drop table if exists public.material_catalog cascade;
drop table if exists public.assignments cascade;
drop table if exists public.student_links cascade;
drop table if exists public.students cascade;
drop table if exists public.classes cascade;
drop table if exists public.profiles cascade;
drop table if exists public.orgs cascade;

drop function if exists public.current_teacher() cascade;
drop function if exists public.create_org_and_admin(text, text) cascade;
drop function if exists public.join_org(text, text) cascade;
drop function if exists public.join_session(text) cascade;
drop function if exists public.redeem_student_code(text) cascade;
drop function if exists public.add_student(uuid, text) cascade;
drop function if exists public.regenerate_student_code(uuid) cascade;
drop function if exists public.remove_student(uuid) cascade;
drop function if exists public.open_assignment_as_student(uuid) cascade;
drop function if exists public.list_my_assignments() cascade;
drop function if exists public.get_requirements_view(uuid) cascade;
drop function if exists public.submit_material_plan(uuid) cascade;
drop function if exists public.reopen_material_plan(uuid) cascade;

select 'Nollställt -- kör nu 0001_init.sql på nytt.' as status;
