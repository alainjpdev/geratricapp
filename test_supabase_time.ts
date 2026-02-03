
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- Testing Supabase Response ---');
    // Use the ID found in previous step: bfb4668a-6661-4e59-9d46-6656f3a315d2
    const { data, error } = await supabase
        .from('medications')
        .select('id, dose1_time, dose2_time')
        .eq('id', 'bfb4668a-6661-4e59-9d46-6656f3a315d2')
        .single();

    if (error) console.error(error);
    console.log('Row Data:', data);
    console.log('Type of dose1_time:', typeof data?.dose1_time);
}

main();
