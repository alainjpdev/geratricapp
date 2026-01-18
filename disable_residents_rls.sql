-- DISABLE RLS on residents table
-- Since the app uses a custom 'users' table for login and not Supabase Auth,
-- the Supabase client connects as 'anon' (unauthenticated) from the DB perspective.
-- Policies for 'authenticated' users will NEVER match.

-- We must disable RLS to allow the app to read/write residents.
ALTER TABLE residents DISABLE ROW LEVEL SECURITY;
