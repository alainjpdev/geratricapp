-- Fix Foreign Key Constraints for Medication Checks
-- Redirects validation to auth.users to avoid blocking if public profile is missing

-- 1. Drop potentially existing constraints pointing to public.users
ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose1_checker_fkey;
ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose2_checker_fkey;
ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose3_checker_fkey;
ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_dose4_checker_fkey;

-- 2. Add correct constraints pointing to auth.users
-- This ensures integrity with the Auth system (source of truth for IDs)
ALTER TABLE medications
    ADD CONSTRAINT medications_dose1_checker_fkey FOREIGN KEY (dose1_checker) REFERENCES auth.users(id),
    ADD CONSTRAINT medications_dose2_checker_fkey FOREIGN KEY (dose2_checker) REFERENCES auth.users(id),
    ADD CONSTRAINT medications_dose3_checker_fkey FOREIGN KEY (dose3_checker) REFERENCES auth.users(id),
    ADD CONSTRAINT medications_dose4_checker_fkey FOREIGN KEY (dose4_checker) REFERENCES auth.users(id);

-- 3. Force schema reload
NOTIFY pgrst, 'reload schema';
