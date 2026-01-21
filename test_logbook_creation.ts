
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Use Service Role to bypass potential RLS issues for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Testing Logbook Creation ---');

    // 1. Get a resident
    const { data: residents } = await supabase.from('residents').select('id').limit(1);
    if (!residents || residents.length === 0) {
        console.error('❌ No residents found to test with.');
        return;
    }
    const residentId = residents[0].id;
    console.log(`Using Resident ID: ${residentId}`);

    // 2. Get a user
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;
    console.log(`Using User ID: ${userId || 'CHECK_AUTH_IF_NULL'}`);

    const testDate = new Date().toISOString().split('T')[0];
    const testTime = new Date().toISOString();

    // 3. Test Care Log Insert
    console.log('\n1. Testing Care Log (Hygiene)...');
    const { data: careData, error: careError } = await supabase
        .from('care_logs')
        .insert({
            resident_id: residentId,
            performed_by: userId,
            category: 'Diaper Change',
            performed_at: testTime,
            date: testDate,
            notes: 'Test script insert'
        })
        .select();

    if (careError) {
        console.error('❌ Care Log Insert Failed:', careError);
    } else {
        console.log('✅ Care Log Created:', careData[0].id);
        // Cleanup
        await supabase.from('care_logs').delete().eq('id', careData[0].id);
    }

    // 4. Test Nutrition Log Insert
    console.log('\n2. Testing Nutrition Log...');
    const { data: nutData, error: nutError } = await supabase
        .from('nutrition_logs')
        .insert({
            resident_id: residentId,
            logged_by: userId,
            meal_type: 'Breakfast',
            logged_at: testTime,
            date: testDate,
            description: 'Test meal',
            notes: 'Test script insert'
        })
        .select();

    if (nutError) {
        console.error('❌ Nutrition Log Insert Failed:', nutError);
    } else {
        console.log('✅ Nutrition Log Created:', nutData[0].id);
        // Cleanup
        await supabase.from('nutrition_logs').delete().eq('id', nutData[0].id);
    }

    // 5. Test Elimination Log Insert
    console.log('\n3. Testing Elimination Log...');
    const { data: elimData, error: elimError } = await supabase
        .from('elimination_logs')
        .insert({
            resident_id: residentId,
            logged_by: userId,
            type: 'Urination',
            logged_at: testTime,
            date: testDate,
            characteristics: 'Normal',
            notes: 'Test script insert'
        })
        .select();

    if (elimError) {
        console.error('❌ Elimination Log Insert Failed:', elimError);
    } else {
        console.log('✅ Elimination Log Created:', elimData[0].id);
        // Cleanup
        await supabase.from('elimination_logs').delete().eq('id', elimData[0].id);
    }
}

main();
