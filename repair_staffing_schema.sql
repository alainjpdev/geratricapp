
-- Repairs daily_staffing and global_staffing tables
-- Ensures columns, unique constraints, RLS status and permissions are correct

-- 1. Daily Staffing Table
DO $$ 
BEGIN
    -- Ensure columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_staffing' AND column_name='condition') THEN
        ALTER TABLE public.daily_staffing ADD COLUMN condition TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_staffing' AND column_name='relevant_notes') THEN
        ALTER TABLE public.daily_staffing ADD COLUMN relevant_notes TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_staffing' AND column_name='updated_at') THEN
        ALTER TABLE public.daily_staffing ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Ensure unique constraint (needed for upsert/onConflict)
ALTER TABLE public.daily_staffing DROP CONSTRAINT IF EXISTS daily_staffing_resident_id_date_key;
ALTER TABLE public.daily_staffing ADD CONSTRAINT daily_staffing_resident_id_date_key UNIQUE (resident_id, date);

-- Disable RLS to simplify custom auth flow
ALTER TABLE IF EXISTS public.daily_staffing DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions
GRANT ALL ON public.daily_staffing TO anon, authenticated, service_role;

-- 2. Global Staffing Table
ALTER TABLE IF EXISTS public.global_staffing DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.global_staffing TO anon, authenticated, service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
