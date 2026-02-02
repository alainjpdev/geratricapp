-- 1. Enable the pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create medication_library table if it doesn't exist
CREATE TABLE IF NOT EXISTS medication_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for faster search using GIN and trigram ops
-- Correct syntax uses GIN, not "trigram" as the access method
CREATE INDEX IF NOT EXISTS idx_medication_library_name_trgm 
ON medication_library 
USING GIN (name gin_trgm_ops);

-- 4. Populate with existing medications
INSERT INTO medication_library (name)
SELECT DISTINCT TRIM(medicamento)
FROM medications
WHERE medicamento IS NOT NULL 
  AND TRIM(medicamento) != ''
  AND LENGTH(TRIM(medicamento)) > 2
ON CONFLICT (name) DO NOTHING;

-- 5. Update stats
ANALYZE medication_library;
