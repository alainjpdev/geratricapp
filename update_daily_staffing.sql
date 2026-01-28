-- Add condition and relevant_notes columns to daily_staffing table
ALTER TABLE daily_staffing 
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS relevant_notes TEXT DEFAULT '';
