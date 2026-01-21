
-- Drop tables if they exist to ensure clean state
DROP TABLE IF EXISTS care_logs;
DROP TABLE IF EXISTS nutrition_logs;
DROP TABLE IF EXISTS elimination_logs;

-- Create care_logs table
CREATE TABLE care_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id TEXT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    performed_by TEXT REFERENCES users(id),
    category TEXT CHECK (category IN ('Diaper Change', 'Sheet Change', 'Bath', 'Position Change', 'Other')),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    shift TEXT CHECK (shift IN ('Morning', 'Afternoon', 'Night')),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nutrition_logs table
CREATE TABLE nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id TEXT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    logged_by TEXT REFERENCES users(id),
    meal_type TEXT CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Hydration')),
    percentage_consumed INTEGER CHECK (percentage_consumed >= 0 AND percentage_consumed <= 100),
    description TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create elimination_logs table
CREATE TABLE elimination_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id TEXT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    logged_by TEXT REFERENCES users(id),
    type TEXT CHECK (type IN ('Urination', 'Bowel Movement', 'Vomit')),
    characteristics TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for all tables (Custom Auth Strategy)
ALTER TABLE care_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE elimination_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON care_logs TO anon;
GRANT ALL ON care_logs TO authenticated;
GRANT ALL ON care_logs TO service_role;

GRANT ALL ON nutrition_logs TO anon;
GRANT ALL ON nutrition_logs TO authenticated;
GRANT ALL ON nutrition_logs TO service_role;

GRANT ALL ON elimination_logs TO anon;
GRANT ALL ON elimination_logs TO authenticated;
GRANT ALL ON elimination_logs TO service_role;

NOTIFY pgrst, 'reload schema';
