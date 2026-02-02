
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Fix for ESM __dirname
const currentDir = process.cwd();

// Try loading .env.local since .env was not found
const envPath = path.resolve(currentDir, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // try .env
    dotenv.config({ path: path.resolve(currentDir, '.env') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mmhwkhggbfpycqiopjyg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error("No VITE_SUPABASE_ANON_KEY found in .env or .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(query: string) {
    console.log(`Searching for "${query}"...`);
    const { data, error } = await supabase
        .from('medication_library')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Results:', data);
    }
}

// Run test
testSearch('par');
testSearch('ibu');
