
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('🔍 Verifying data persistence in Supabase...');

    // Query for the specific submissions mentioned in the user's table
    // Case 1: Grade 10, Comment "aqui"
    console.log('\nChecking for submission with Grade 10 and Comment "aqui"...');
    const { data: sub1, error: err1 } = await supabase
        .from('assignment_submissions')
        .select(`
            id,
            grade,
            teacher_comments,
            assignment:assignments(title),
            student:users(first_name, last_name)
        `)
        .eq('grade', 10)
        .ilike('teacher_comments', '%aqui%');

    if (err1) console.error('Error querying sub1:', err1);
    else console.log('Found:', sub1);


    // Case 2: Grade 30, Comment "checa"
    console.log('\nChecking for submission with Grade 30 and Comment "checa"...');
    const { data: sub2, error: err2 } = await supabase
        .from('assignment_submissions')
        .select(`
            id,
            grade,
            teacher_comments,
            assignment:assignments(title),
            student:users(first_name, last_name)
        `)
        .eq('grade', 30)
        .ilike('teacher_comments', '%checa%');

    if (err2) console.error('Error querying sub2:', err2);
    else console.log('Found:', sub2);

    // Case 3: Check for user 'Aylar Roufa Trigo' submissions
    console.log('\nChecking all submissions for users with name like "Aylar"...');
    const { data: userSubmissions, error: err3 } = await supabase
        .from('assignment_submissions')
        .select(`
            id,
            grade,
            teacher_comments,
            status,
            student:users!inner(first_name, last_name)
        `)
        .ilike('student.first_name', '%Aylar%')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (err3) console.error('Error querying user submissions:', err3);
    else {
        // Filter in memory since inner join filter might be tricky with nested json if simpler syntax fails, 
        // but the above !inner syntax is correct for Supabase/Postgrest if set up right.
        // Let's just print what we found.
        console.log('Found submissions for Aylar:', userSubmissions);
    }
}

checkData();
