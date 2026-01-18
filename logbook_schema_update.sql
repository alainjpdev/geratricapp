-- Create care_logs table
CREATE TABLE IF NOT EXISTS care_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id TEXT REFERENCES residents(id) ON DELETE CASCADE,
    performed_by TEXT REFERENCES users(id),
    category TEXT CHECK (category IN ('Diaper Change', 'Sheet Change', 'Bath', 'Position Change', 'Other')),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    shift TEXT CHECK (shift IN ('Morning', 'Afternoon', 'Night')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nutrition_logs table
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id TEXT REFERENCES residents(id) ON DELETE CASCADE,
    logged_by TEXT REFERENCES users(id),
    meal_type TEXT CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Hydration')),
    percentage_consumed INTEGER CHECK (percentage_consumed >= 0 AND percentage_consumed <= 100),
    description TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create elimination_logs table
CREATE TABLE IF NOT EXISTS elimination_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id TEXT REFERENCES residents(id) ON DELETE CASCADE,
    logged_by TEXT REFERENCES users(id),
    type TEXT CHECK (type IN ('Urination', 'Bowel Movement', 'Vomit')),
    characteristics TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE elimination_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for now, assuming authenticated users can read/write)
-- Note: 'authenticated' role check usually works regardless of user ID type in public table
CREATE POLICY "Enable read access for authenticated users" ON care_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON care_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON nutrition_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON nutrition_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON elimination_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON elimination_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
