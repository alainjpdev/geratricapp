-- Allow public (anon) access to all tables
-- This is necessary because we are using a custom users table for authentication
-- instead of Supabase Auth, so all requests appear as 'anon' to the database.

-- Drop existing policies that restrict to 'authenticated'
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.class_members;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.stream_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.assignment_students;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.quizzes;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.quiz_questions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.quiz_students;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.quiz_submissions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.materials;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.material_students;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.attachments;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.grades;

-- Create new policies allowing access to everyone (public)
CREATE POLICY "Enable all for public" ON public.users FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.classes FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.class_members FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.topics FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.stream_items FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.assignments FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.assignment_students FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.assignment_submissions FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.quizzes FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.quiz_questions FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.quiz_students FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.quiz_submissions FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.materials FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.material_students FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.attachments FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.grades FOR ALL USING (true);
