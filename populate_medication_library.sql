-- Populate medication_library with existing unique medication names from the medications table
INSERT INTO medication_library (name)
SELECT DISTINCT TRIM(medicamento)
FROM medications
WHERE medicamento IS NOT NULL 
  AND TRIM(medicamento) != ''
  AND LENGTH(TRIM(medicamento)) > 2
ON CONFLICT (name) DO NOTHING;

-- Analyze to update stats
ANALYZE medication_library;
