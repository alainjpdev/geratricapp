import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const residents = [
    {
        first_name: 'Roberto',
        last_name: 'Gómez',
        date_of_birth: '1945-02-21T00:00:00Z',
        room_number: '101',
        status: 'Active',
        allergies: 'Penicilina',
        conditions: 'HipertensiónControlada',
        care_plan_summary: 'Dieta baja en sodio. Caminata diaria de 15 min.',
        emergency_contact: {
            name: 'Laura Gómez',
            phone: '555-0101',
            relation: 'Hija'
        }
    },
    {
        first_name: 'Ana',
        last_name: 'Martínez',
        date_of_birth: '1938-11-15T00:00:00Z',
        room_number: '102',
        status: 'Active',
        allergies: 'Ninguna',
        conditions: 'Arthritis',
        care_plan_summary: 'Asistencia para vestirse. Terapia física martes y jueves.',
        emergency_contact: {
            name: 'Pedro Martínez',
            phone: '555-0102',
            relation: 'Hijo'
        }
    },
    {
        first_name: 'Carlos',
        last_name: 'Ruiz',
        date_of_birth: '1940-06-30T00:00:00Z',
        room_number: '103',
        status: 'Hospitalized',
        allergies: 'Nueces',
        conditions: 'Diabetes Tipo 2',
        care_plan_summary: 'Control de glucosa cada 6 horas. Insulina según escala.',
        emergency_contact: {
            name: 'Maria Ruiz',
            phone: '555-0103',
            relation: 'Esposa'
        }
    }
];

async function seedResidents() {
    console.log('🌱 Seeding residents...');

    for (const r of residents) {
        // Check if exists by name to avoid duplicates
        const { data: existing } = await supabase
            .from('residents')
            .select('id')
            .eq('first_name', r.first_name)
            .eq('last_name', r.last_name)
            .single();

        if (existing) {
            console.log(`Resident ${r.first_name} ${r.last_name} already exists. Skipping.`);
            continue;
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('residents')
            .insert({
                id: randomUUID(),
                ...r,
                created_at: now,
                updated_at: now
            });

        if (error) {
            console.error(`Error creating ${r.first_name}:`, error.message);
        } else {
            console.log(`✅ Created ${r.first_name} ${r.last_name}`);
        }
    }
}

seedResidents();
