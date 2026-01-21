
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

async function testMedicationsCreation() {
    console.log('--- Testing Medications Creation (ANON KEY) ---');

    let residentId = '';
    let userId = '';

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

        // Fetch a user (simulating the logged-in user)
        // We need a user from the 'users' table since our FK points there now
        const { data: users, error: uError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (uError) throw uError;
        if (!users || users.length === 0) {
            console.log('No users found to test with.');
            return;
        }
        userId = users[0].id;
        console.log('Using User ID:', userId);

    } catch (e: any) {
        console.error('Error fetching prerequisites:', e.message);
        return;
    }

    const testDate = new Date().toISOString().split('T')[0];
    const testTime = '12:00';
    const testMed = 'Paracetamol Test';

    console.log(`Attempting to CREATE medication for Resident: ${residentId} by User: ${userId}`);

    // Test Insert
    const { data: insertData, error: insertError } = await supabase
        .from('medications')
        .insert([
            {
                resident_id: residentId,
                date: testDate,
                medicamento: testMed,
                dosis: '500mg',
                via: 'Oral',
                hora: testTime,
                observacion: 'Test insert',
                recorded_by: userId // This was failing before
            }
        ])
        .select();

    if (insertError) {
        console.error('❌ Creation Failed:', insertError.message);
        console.error('Details:', insertError);
        return;
    }

    console.log('✅ Creation Successful:', insertData);

    // Cleanup (optional, but good for tests)
    if (insertData && insertData[0]) {
        console.log('Cleaning up test record...');
        await supabase.from('medications').delete().eq('id', insertData[0].id);
        console.log('Cleanup complete.');
    }
}

testMedicationsCreation();
