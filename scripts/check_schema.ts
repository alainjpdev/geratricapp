
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking Database Schema...');

    // 1. Check assignment_submissions table columns
    console.log('\nChecking "assignment_submissions" table...');
    const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .limit(1);

    if (assignmentError) {
        console.error('❌ Error assessing assignment_submissions:', assignmentError.message);
    } else {
        console.log('✅ assignment_submissions table exists.');
        // Try to select 'grade' specifically to be sure, though * usually brings it if it exists.
        // Since we don't have access to information_schema via client (usually), we infer from the error or the returned object keys if logical.
        // But since the error says "Could not find the 'grade' column", it's likely missing.
        // We can't easily "describe table" with postgrest client.
        // But we can try to select 'grade' and see if it errors.
        const { error: colError } = await supabase.from('assignment_submissions').select('grade').limit(1);
        if (colError) {
            console.error('❌ Column "grade" MISSING in assignment_submissions:', colError.message);
        } else {
            console.log('✅ Column "grade" exists in assignment_submissions.');
        }
    }

    // 2. Check quiz_submissions table existence
    console.log('\nChecking "quiz_submissions" table...');
    const { error: quizError } = await supabase
        .from('quiz_submissions')
        .select('*')
        .limit(1);

    if (quizError) {
        console.error('❌ quiz_submissions table issue:', quizError.message);
    } else {
        console.log('✅ quiz_submissions table exists.');
    }

    // 3. Check other tables that appeared in snippet
    const tables = ['quizzes', 'quiz_questions', 'quiz_students'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.error(`❌ Table "${table}" issue:`, error.message);
        } else {
            console.log(`✅ Table "${table}" exists.`);
        }
    }
}

checkSchema();
