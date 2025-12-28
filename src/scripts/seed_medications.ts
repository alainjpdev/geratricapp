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

async function seedMedications() {
    console.log('💊 Seeding medications...');

    // 1. Get Residents
    const { data: residents, error: rError } = await supabase
        .from('residents')
        .select('id, first_name');

    if (rError || !residents || residents.length === 0) {
        console.error('No residents found. Please run seed_residents.ts first.');
        return;
    }

    const roberto = residents.find(r => r.first_name === 'Roberto');
    const ana = residents.find(r => r.first_name === 'Ana');
    const carlos = residents.find(r => r.first_name === 'Carlos');

    const medications = [];

    if (roberto) {
        medications.push(
            {
                resident_id: roberto.id,
                medication_name: 'Losartán',
                dosage: '50mg',
                frequency: 'Morning',
                route: 'Oral',
                start_date: new Date().toISOString(),
                instructions: 'Tomar con alimentos para evitar mareos.'
            },
            {
                resident_id: roberto.id,
                medication_name: 'Multivitamínico Senior',
                dosage: '1 tab',
                frequency: 'Morning',
                route: 'Oral',
                start_date: new Date().toISOString()
            }
        );
    }

    if (ana) {
        medications.push(
            {
                resident_id: ana.id,
                medication_name: 'Paracetamol',
                dosage: '500mg',
                frequency: 'PRN', // As needed
                route: 'Oral',
                start_date: new Date().toISOString(),
                instructions: 'Solo si hay dolor > 5/10.'
            },
            {
                resident_id: ana.id,
                medication_name: 'Gotas Lubricantes Oculares',
                dosage: '2 gotas ambos ojos',
                frequency: 'Evening',
                route: 'Ophthalmic',
                start_date: new Date().toISOString()
            }
        );
    }

    if (carlos) {
        medications.push(
            {
                resident_id: carlos.id,
                medication_name: 'Insulina Glargina',
                dosage: '10 unidades',
                frequency: 'Night',
                route: 'Subcutaneous',
                start_date: new Date().toISOString(),
                instructions: 'Rotar sitios de inyección.'
            },
            {
                resident_id: carlos.id,
                medication_name: 'Metformina',
                dosage: '850mg',
                frequency: 'Morning', // BID actually
                route: 'Oral',
                start_date: new Date().toISOString(),
                instructions: 'Junto con el desayuno.'
            },
            {
                resident_id: carlos.id,
                medication_name: 'Metformina',
                dosage: '850mg',
                frequency: 'Evening',
                route: 'Oral',
                start_date: new Date().toISOString(),
                instructions: 'Junto con la cena.'
            }
        );
    }

    for (const med of medications) {
        // Check duplicate to be safe (simple check)
        const { data: existing } = await supabase
            .from('medication_orders')
            .select('id')
            .eq('resident_id', med.resident_id)
            .eq('medication_name', med.medication_name)
            .eq('frequency', med.frequency)
            .eq('is_active', true)
            .maybeSingle();

        if (existing) {
            console.log(`Prescription ${med.medication_name} (${med.frequency}) already exists.`);
            continue;
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('medication_orders')
            .insert({
                id: randomUUID(),
                ...med,
                is_active: true,
                created_at: now,
                updated_at: now
            });

        if (error) {
            console.error(`Error adding ${med.medication_name}:`, error.message);
        } else {
            console.log(`✅ Prescribed ${med.medication_name} to resident.`);
        }
    }
}

seedMedications();
