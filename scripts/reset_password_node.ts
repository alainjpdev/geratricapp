
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
    const email = 'ark2784@gmail.com';
    const newPassword = '123456';

    console.log(`🔄 Resetting password for ${email} to '${newPassword}'...`);

    // 1. Generate Hash using bcryptjs
    const salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(newPassword, salt);

    // Replace $2b$ with $2a$ for better compatibility with older pgcrypto versions
    hash = hash.replace('$2b$', '$2a$');

    console.log('🔑 Generated new hash (adjusted for version):', hash);

    // 2. Update User in DB
    const { data, error } = await supabase
        .from('users')
        .update({ password_hash: hash })
        .eq('email', email);

    if (error) {
        console.error('❌ Error updating password:', error.message);
        return;
    }

    console.log('✅ Password updated successfully in database.');
}

resetPassword();
