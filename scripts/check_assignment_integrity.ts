
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.log('Keys found:', {
        URL: !!process.env.VITE_SUPABASE_URL,
        SERVICE: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        ANON: !!process.env.VITE_SUPABASE_ANON_KEY
    });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssignment(assignmentId: string) {
    console.log(`Checking assignment: ${assignmentId}`);

    // 1. Get Assignment
    const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

    if (assignmentError) {
        console.error('Error fetching assignment:', assignmentError);
        return;
    }

    if (!assignment) {
        console.error('Assignment not found');
        return;
    }

    console.log('Assignment found:', assignment);

    // 2. Get Stream Item
    const streamItemId = assignment.stream_item_id;
    console.log(`Checking stream item: ${streamItemId}`);

    const { data: streamItem, error: streamItemError } = await supabase
        .from('stream_items')
        .select('*')
        .eq('id', streamItemId)
        .single();

    if (streamItemError) {
        console.error('Error fetching stream item:', streamItemError);
    } else if (!streamItem) {
        console.error('Stream item NOT found. Orphaned assignment!');
    } else {
        console.log('Stream item found:', streamItem);
    }

    // 3. Try the Join Query
    console.log('Testing join query...');
    const { data: joinData, error: joinError } = await supabase
        .from('assignments')
        .select(`
      *,
      stream_item:stream_items(*)
    `)
        .eq('id', assignmentId)
        .single();

    if (joinError) {
        console.error('Join query error:', joinError);
    } else {
        console.log('Join query result:', JSON.stringify(joinData, null, 2));
    }
}

const assignmentId = 'bcfa7af4-f2dc-4f69-a5dc-9dc65d13c814';
checkAssignment(assignmentId);
