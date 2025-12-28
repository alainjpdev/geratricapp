
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('🔍 Testing login for sample users...');

    // List of common passwords to try since we don't know the plain text for everyone
    const commonPasswords = [
        'password123',
        '123456',
        'password',
        'admin',
        'ark2784@2025!', // Try the known password too
        'testing123'
    ];

    // Fetch a sample of users
    const { data: users, error } = await supabase
        .from('users')
        .select('email, password_hash')
        .limit(5);

    if (error || !users) {
        console.error('Error fetching users:', error);
        return;
    }

    for (const user of users) {
        if (!user.password_hash) {
            console.log(`⚠️ User ${user.email} has no password hash.`);
            continue;
        }

        console.log(`\nTesting user: ${user.email}`);
        let found = false;

        for (const pwd of commonPasswords) {
            const { data: isValid, error: rpcError } = await supabase.rpc('verify_password', {
                user_password_hash: user.password_hash,
                input_password: pwd
            });

            if (rpcError) {
                console.error(`  RPC Error checking '${pwd}':`, rpcError.message);
                break; // Stop testing this user if RPC is broken
            }

            if (isValid) {
                console.log(`  🎉 SUCCESS! Password is: "${pwd}"`);
                found = true;
                break;
            }
        }

        if (!found) {
            console.log(`  ❌ Failed to verify with common passwords.`);
        }
    }
}

checkUsers();
