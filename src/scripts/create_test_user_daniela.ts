import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import path from 'path';

// Fix for dotenv not finding .env in script directory context sometimes
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDanielaAdmin() {
    const email = 'daniela@test.com';
    const password = '123456';

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    console.log(`Checking if user ${email} exists...`);
    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error searching user:', findError);
    }

    if (existingUser) {
        console.log('User already exists. Updating password to 123456 and role to admin...');
        const { error } = await supabase
            .from('users')
            .update({
                password_hash: hashedPassword,
                role: 'admin',
                first_name: 'Daniela',
                last_name: 'Test',
                is_active: true,
                updated_at: now
            })
            .eq('email', email);

        if (error) {
            console.error('Error updating:', error);
        } else {
            console.log('✅ User updated successfully');
        }
    } else {
        console.log('Creating new admin user daniela@test.com...');
        const { error } = await supabase
            .from('users')
            .insert({
                id: crypto.randomUUID(),
                email,
                password_hash: hashedPassword,
                role: 'admin',
                is_active: true,
                first_name: 'Daniela',
                last_name: 'Test',
                avatar: '',
                grupo_asignado: null,
                created_at: now,
                updated_at: now
            });

        if (error) {
            console.error('Error creating:', error);
        } else {
            console.log('✅ User created successfully');
        }
    }
}

createDanielaAdmin().catch(console.error);
