-- Engångsverktyg för utvecklingsmiljön: nollställer schemat helt så att
-- 0001_init.sql kan köras på nytt från grunden. ANVÄND ALDRIG detta mot en
-- databas med riktig data -- allt raderas permanent.
--
-- Körs en gång om ett tidigare (delvis eller äldre) körning av
-- 0001_init.sql redan skapat tabeller/funktioner, t.ex. felet
-- "relation ... already exists".

drop table if exists public.material_orders cascade;
drop table if exists public.time_entries cascade;
drop table if exists public.quiz_answers cascade;
drop table if exists public.quiz_questions cascade;
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
drop function if exists public.get_quiz_view(uuid) cascade;
drop function if exists public.submit_quiz_answer(uuid, uuid, text) cascade;
drop function if exists public.get_quiz_results(uuid) cascade;
drop function if exists public.get_my_assessment_view(uuid) cascade;
drop function if exists public.submit_time_report(uuid) cascade;
drop function if exists public.reopen_time_report(uuid) cascade;
drop function if exists public.set_participant_display_name(uuid, text) cascade;
drop function if exists public.set_teacher_comment(uuid, text) cascade;
drop function if exists public.set_student_note(uuid, text) cascade;
drop function if exists public.set_quiz_answer_feedback(uuid, text, boolean) cascade;

-- 0004_ovning_provlage.sql lägger bara till en kolumn (assignments.reference_image_path)
-- och gör om join_session/open_assignment_as_student -- inget extra att droppa här,
-- create or replace + drop table cascade (assignments) täcker båda.

-- 0005/0006 (time_entries + assignment_participants.time_locked/time_submitted_at)
-- kräver inga extra drops -- drop table ... cascade på time_entries/
-- assignment_participants ovan tar med sig alla deras policyer automatiskt.

-- 0007 (display_name/teacher_comment/student_note-kolumner + quiz_answers-
-- kolumner + material_orders) kräver inga extra drops av samma skäl --
-- material_orders har sina policyer och droppas komplett ovan, och de nya
-- kolumnerna på assignment_participants/quiz_answers försvinner med
-- respektive tabell.

-- 0002_quiz.sql skapar RLS-policyer med vanlig create policy (Postgres
-- saknar "create or replace policy") -- måste droppas explicit annars
-- misslyckas en omkörning av 0002 med "policy already exists". Själva
-- Storage-bucketen ("quiz-images") och eventuella redan uppladdade bilder
-- rörs INTE här -- insert...on conflict do nothing i 0002 är redan
-- idempotent för bucketen, och den här filen ska aldrig radera riktiga
-- uppladdade filer.
drop policy if exists "quiz-images: lärare i org laddar upp" on storage.objects;
drop policy if exists "quiz-images: lärare i org tar bort egna" on storage.objects;
drop policy if exists "quiz-images: publik läsning" on storage.objects;

select 'Nollställt -- kör nu 0001_init.sql (och ev. 0002_quiz.sql) på nytt.' as status;
