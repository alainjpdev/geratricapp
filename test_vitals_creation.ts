
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Use Anon Key to simulate the real application
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Key is missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVitalsCreation() {
    console.log('--- Testing Vital Signs Creation (ANON KEY) ---');

    let residentId = '';

    try {
        // Fetch a resident
        const { data: residents, error: rError } = await supabase
            .from('residents')
            .select('id')
            .limit(1);

        if (rError) throw rError;
        if (!residents || residents.length === 0) {
            console.log('No residents found to test with.');
            return;
        }
        residentId = residents[0].id;

    } catch (e: any) {
        console.error('Error fetching resident:', e.message);
        return;
    }

    const testDate = new Date().toISOString().split('T')[0];
    const testTime = '10:00'; // Unique time for this test

    console.log(`Attempting to CREATE vital sign for Resident: ${residentId} at ${testTime}`);

    // Test Insert
    const { data: insertData, error: insertError } = await supabase
        .from('vital_signs')
        .insert([
            {
                resident_id: residentId,
                date: testDate,
                time: testTime,
                ta: '110/70',
                fc: '80',
                temp: '36.2',
                sato2: '99'
            }
        ])
        .select();

    if (insertError) {
        console.error('❌ Creation Failed:', insertError.message);
        console.error('Details:', insertError);
        return;
    }

    console.log('✅ Creation Successful:', insertData);
}

testVitalsCreation();
