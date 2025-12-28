
import { supabase } from '../src/config/supabaseClient';

async function checkSchema() {
    const { data, error } = await supabase
        .from('class_members')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting * from class_members:', error);
    } else {
        console.log('Success selecting * from class_members (retrieved keys):', data && data.length > 0 ? Object.keys(data[0]) : 'No rows found');
    }
}

checkSchema();
