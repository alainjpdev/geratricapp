
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = 'ark2784@gmail.com';
    const password = '123456';

    console.log(`🔐 Testing login for ${email} with password '${password}'...`);

    // 1. Get User Hash
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('email', email)
        .single();

    if (user) console.log('📄 Stored Hash:', user.password_hash);

    if (userError || !user) {
        console.error('❌ User not found:', userError?.message);
        return;
    }

    console.log('✅ User found. Verifying password...');

    // 2. Verify Password via RPC
    const { data: isValid, error: rpcError } = await supabase.rpc('verify_password', {
        user_password_hash: user.password_hash,
        input_password: password
    });

    if (rpcError) {
        console.error('❌ RPC Error:', rpcError.message);
        return;
    }

    if (isValid) {
        console.log('🎉 SUCCESS: Password is correct! Login should work.');
    } else {
        console.error('❌ FAILURE: Password verification returned false.');
    }
}

testLogin();
