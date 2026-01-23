
-- Create table for daily staff assignments per resident
CREATE TABLE IF NOT EXISTS daily_staffing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id TEXT REFERENCES residents(id) NOT NULL,
    date DATE NOT NULL,
    tm_nurse TEXT, -- Turno Mañana Name (or ID, but UI uses Name currently)
    tv_nurse TEXT, -- Turno Vespertino Name
    tn_nurse TEXT, -- Turno Nocturno Name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(resident_id, date)
);

-- RLS Policies
ALTER TABLE daily_staffing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON daily_staffing
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert/update for authenticated users" ON daily_staffing
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
