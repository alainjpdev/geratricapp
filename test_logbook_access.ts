
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Service Role to bypass RLS and strictly check table existence
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Loading env from:', path.resolve(process.cwd(), '.env'));
console.log('URL present:', !!supabaseUrl);
console.log('Key present:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    // Try to proceed anyway if possible, or exit
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Testing Care Logs Access ---');

    // Mimic the failing query
    // care_logs?select=*&resident_id=eq...&date=eq...

    const { data, error } = await supabase
        .from('care_logs')
        .select('*')
        .eq('date', '2026-01-19')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching care_logs:');
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('✅ care_logs is accessible');
    }

    console.log('\n--- Testing Nutrition Logs Access ---');
    const { data: nut, error: nutError } = await supabase
        .from('nutrition_logs')
        .select('*')
        .limit(1);

    if (nutError) {
        console.error('❌ Error fetching nutrition_logs:');
        console.error(JSON.stringify(nutError, null, 2));
    } else {
        console.log('✅ nutrition_logs is accessible');
    }
}

main();
