-- Add unique constraint to avoid duplicate meals per resident per day
ALTER TABLE nutrition_logs
ADD CONSTRAINT nutrition_logs_unique_meal UNIQUE (resident_id, date, meal_type);
