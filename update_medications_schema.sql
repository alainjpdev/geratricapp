-- Add explicit time columns to the medications table
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS dose1_time TIME,
ADD COLUMN IF NOT EXISTS dose2_time TIME,
ADD COLUMN IF NOT EXISTS dose3_time TIME,
ADD COLUMN IF NOT EXISTS dose4_time TIME;

-- Comment on columns for clarity
COMMENT ON COLUMN medications.dose1_time IS 'Time for the 1st dose';
COMMENT ON COLUMN medications.dose2_time IS 'Time for the 2nd dose';
COMMENT ON COLUMN medications.dose3_time IS 'Time for the 3rd dose';
COMMENT ON COLUMN medications.dose4_time IS 'Time for the 4th dose';
