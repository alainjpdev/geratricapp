import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function listResidents() {
    const { data, error } = await supabase.from('residents').select('id, first_name, last_name, status');
    if (error) console.error(error);
    else console.table(data);
}
listResidents();
