
// Script to verify resident data from terminal
// Usage: npx ts-node verify_residents.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Try to read env vars or hardcode if necessary for testing
// Note: In a real environment we'd read from process.env, but here we might need 
// to see if we can access the client config.
// Let's assume we can read the .env file.

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publicAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('Missing VITE_SUPABASE_URL');
    process.exit(1);
}

async function testConnection(keyName: string, key: string | undefined) {
    console.log(`\nTesting with ${keyName}...`);
    if (!key) {
        console.log('Skipping: Key not found.');
        return;
    }

    const client = createClient(supabaseUrl!, key);
    const { data, error } = await client.from('residents').select('*');

    if (error) {
        console.error('ERROR:', error.message);
    } else {
        console.log(`SUCCESS: Found ${data.length} residents.`);
        if (data.length > 0) {
            console.log('Sample:', data[0].first_name, data[0].last_name);
        } else {
            console.log('Table is empty.');
        }
    }
}

async function run() {
    await testConnection('SERVICE_ROLE_KEY (Admin - Bypasses RLS)', serviceRoleKey);
    await testConnection('PUBLISHABLE_KEY (Public - Subject to RLS)', publicAnonKey);
}

run();


