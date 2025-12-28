
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGradeQuery() {
    console.log('Testing Grade Query...');

    // Use a class ID that exists
    // The user mentioned: 07a2fff7-b160-4b10-88cc-d165b49ab9cc
    const classId = '07a2fff7-b160-4b10-88cc-d165b49ab9cc';

    console.log(`Querying for classId: ${classId}`);

    const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
        id,
        points,
        due_date,
        stream_item:stream_items!inner(
            id,
            title, 
            class_id
        )
      `)
        .eq('stream_item.class_id', classId);

    if (error) {
        console.error('Query Error:', error);
        return;
    }

    console.log(`Found ${assignments.length} assignments.`);

    assignments.forEach((a: any) => {
        console.log(`- AssignID: ${a.id}`);
        console.log(`  Title: ${a.stream_item?.title}`);
        console.log(`  ClassID: ${a.stream_item?.class_id}`);

        if (a.stream_item?.class_id !== classId) {
            console.error('  MISMATCH! This assignment belongs to a different class!');
        }
    });
}

testGradeQuery();
