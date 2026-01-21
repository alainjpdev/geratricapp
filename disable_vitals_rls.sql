-- DISABLE RLS on vital_signs table
-- The app uses custom auth, so Supabase sees requests as 'anon'.
ALTER TABLE vital_signs DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
