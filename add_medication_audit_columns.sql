-- Add audit columns to medications table for verification system
-- We need 3 new columns for EACH of the 4 potential doses

ALTER TABLE medications
-- Dose 1
ADD COLUMN IF NOT EXISTS dose1_checker UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dose1_check_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dose1_status BOOLEAN DEFAULT FALSE,

-- Dose 2
ADD COLUMN IF NOT EXISTS dose2_checker UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dose2_check_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dose2_status BOOLEAN DEFAULT FALSE,

-- Dose 3
ADD COLUMN IF NOT EXISTS dose3_checker UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dose3_check_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dose3_status BOOLEAN DEFAULT FALSE,

-- Dose 4
ADD COLUMN IF NOT EXISTS dose4_checker UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dose4_check_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dose4_status BOOLEAN DEFAULT FALSE;

-- Force refresh of the cache/schema if needed (usually automatic in Supabase)
