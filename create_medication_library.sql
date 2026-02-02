-- Create medication_library table for autocomplete
CREATE TABLE IF NOT EXISTS medication_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster search
CREATE INDEX IF NOT EXISTS idx_medication_library_name ON medication_library USING trigram(name);

-- (Optional) If pg_trgm extension is needed for fuzzy search, enabled it:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
