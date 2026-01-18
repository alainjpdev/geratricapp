-- Add RLS policy for residents table to allow all authenticated users to read
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- 1. DROP EXISTING POLICIES to avoid "already exists" errors and ensure we have the correct settings
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."residents";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."residents";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."residents";
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "public"."residents";

-- 2. CREATE NEW POLICIES
-- Allow any logged-in user to VIEW residents
CREATE POLICY "Enable read access for all authenticated users" ON "public"."residents"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow any logged-in user to ADD residents
CREATE POLICY "Enable insert for authenticated users" ON "public"."residents"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow any logged-in user to UPDATE residents
CREATE POLICY "Enable update for authenticated users" ON "public"."residents"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);
