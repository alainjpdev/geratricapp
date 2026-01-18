-- Create Resident: Oralia Ladrón de Guevara (if not exists)
DO $$
DECLARE
    new_resident_id TEXT;
    admin_user_id TEXT;
BEGIN
    -- 1. Ensure Resident Exists
    IF NOT EXISTS (SELECT 1 FROM residents WHERE first_name = 'Oralia' AND last_name = 'Ladrón de Guevara') THEN
        INSERT INTO residents (id, first_name, last_name, date_of_birth, room_number, status, created_at, updated_at)
        VALUES (
            uuid_generate_v4()::text, -- Using UUID-as-text
            'Oralia', 
            'Ladrón de Guevara', 
            '1945-05-15', -- Approximated birth date
            '101',        -- Approximated room
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO new_resident_id;
    ELSE
        SELECT id INTO new_resident_id FROM residents WHERE first_name = 'Oralia' AND last_name = 'Ladrón de Guevara';
    END IF;

    -- 2. Clean old test data for this resident (Optional, keep if you want to wipe previous attempts)
    DELETE FROM care_logs WHERE resident_id = new_resident_id;
    DELETE FROM nutrition_logs WHERE resident_id = new_resident_id;
    DELETE FROM elimination_logs WHERE resident_id = new_resident_id;
    DELETE FROM vital_signs WHERE resident_id = new_resident_id;

    -- 3. Get an Admin User for "Logged By" (First admin found)
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Fallback if no admin, use the resident creator (not ideal, but prevents error)
    -- OR just leave NULL if allowed, but schema says REFERENCES users.
    -- Assuming at least one user exists.

    -- -------------------------
    -- INSERT SAMPLE DATA
    -- -------------------------

    -- A. VITAL SIGNS (Sample day)
    INSERT INTO vital_signs (id, resident_id, recorded_by, bp_systolic, bp_diastolic, heart_rate, temperature, oxygen_saturation, glucose, recorded_at, updated_at)
    VALUES
    (uuid_generate_v4()::text, new_resident_id, admin_user_id, 120, 80, 72, 36.5, 98, 95, NOW() - INTERVAL '4 hours', NOW()), -- Morning
    (uuid_generate_v4()::text, new_resident_id, admin_user_id, 130, 85, 75, 36.7, 97, 110, NOW() - INTERVAL '1 hour', NOW());  -- Afternoon

    -- B. NUTRITION
    INSERT INTO nutrition_logs (id, resident_id, logged_by, meal_type, percentage_consumed, description, logged_at)
    VALUES
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Breakfast', 80, 'Papaya, Avena, Té', NOW() - INTERVAL '5 hours'),
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Hydration', 100, 'Vaso de agua', NOW() - INTERVAL '3 hours'),
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Lunch', 50, 'Pollo con verduras', NOW() - INTERVAL '1 hour');

    -- C. CARE / HYGIENE
    INSERT INTO care_logs (id, resident_id, performed_by, category, notes, shift, performed_at)
    VALUES
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Bath', 'Baño en regadera asistido', 'Morning', NOW() - INTERVAL '6 hours'),
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Diaper Change', 'Orina abundante', 'Morning', NOW() - INTERVAL '4 hours'),
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Position Change', 'Decúbito lateral', 'Afternoon', NOW() - INTERVAL '2 hours');

    -- D. ELIMINATION
    INSERT INTO elimination_logs (id, resident_id, logged_by, type, characteristics, logged_at)
    VALUES
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Urination', 'Normal, amarilla clara', NOW() - INTERVAL '4 hours'),
    (uuid_generate_v4(), new_resident_id, admin_user_id, 'Bowel Movement', 'Normal', NOW() - INTERVAL '1 hour');

END $$;
