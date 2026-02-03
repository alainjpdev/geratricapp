-- Create global_staffing table to persist staff across all patients
CREATE TABLE IF NOT EXISTS global_staffing (
    date DATE PRIMARY KEY,
    tm_nurse TEXT,
    tv_nurse TEXT,
    tn_nurse TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We keep the existing daily_staffing for historical/specific overrides,
-- but global_staffing will be the master source for the day.
