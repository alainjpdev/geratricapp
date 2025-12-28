
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPasswords() {
    const args = process.argv.slice(2);
    const newPassword = args[0] || '123456';
    const targetEmail = args[1]; // Optional: confirm specific user, or 'all'

    console.log(`🔐 Preparing to reset passwords to: "${newPassword}"`);
    console.log(`⚠️  Target: ${targetEmail || 'ALL USERS'} \n`);

    // 1. Generate Hash
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    console.log(`generated hash: ${hash}`);

    // 2. Update Users
    let query = supabase.from('users').update({
        password_hash: hash,
        updated_at: new Date().toISOString()
    });

    if (targetEmail && targetEmail !== 'all') {
        query = query.eq('email', targetEmail);
    } else {
        // If 'all', we might want to be careful or update in batches if many users, 
        // but for <100 users, single query is fine.
        // We need a condition that is always true to update all if filter is omitted?
        // Actually, without .eq(), update() applies to all rows in Supabase/Postgrest *if* header is allowed or filters match.
        // But usually Supabase client requires a filter for update/delete unless we explicitly allow it.
        // A safe "update all" filter is checking id is not null.
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error, count } = await query.select();

    if (error) {
        console.error('❌ Error updating passwords:', error.message);
    } else {
        console.log(`✅ Successfully updated passwords for ${data?.length} users.`);
        console.log(`🎉 New Password: "${newPassword}"`);
    }
}

resetPasswords();
