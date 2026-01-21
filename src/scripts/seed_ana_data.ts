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

// Data for Jan 20, 2026
const SEED_DATE = '2026-01-20';

async function seedAnaData() {
    console.log(`🌱 Seeding data for Ana Martines on ${SEED_DATE}...`);

    // 1. Find Ana
    const { data: ana, error: anaError } = await supabase
        .from('residents')
        .select('id, first_name, last_name')
        .ilike('first_name', '%Ana%')
        .ilike('last_name', '%Martínez%')
        .maybeSingle();

    if (anaError || !ana) {
        console.error('❌ Ana Martines not found.');
        return;
    }
    console.log(`✅ Found Ana: ${ana.first_name} ${ana.last_name} (${ana.id})`);

    // 2. Find a User (Author/Recorder)
    // Try to find 'ark2784' or 'admin' or just the first user
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1)
        .maybeSingle();

    if (userError || !user) {
        console.error('❌ No user found for authoring.');
        return;
    }
    const staffId = user.id;
    console.log(`✅ Using Staff ID: ${staffId} (${user.email})`);

    // --- Vitals ---
    console.log('  > Seeding Vitals...');
    const vitalsData = [
        { time: '08:00:00', ta: '120/80', fc: '72', temp: '36.5', sato2: '98', dxtx: '95' },
        { time: '14:00:00', ta: '125/82', fc: '75', temp: '36.6', sato2: '97', dxtx: '110' },
        { time: '20:00:00', ta: '118/78', fc: '70', temp: '36.4', sato2: '99', dxtx: '100' },
    ];

    for (const v of vitalsData) {
        const { error: vitalsError } = await supabase.from('vital_signs').insert({
            resident_id: ana.id,
            recorded_by: staffId,
            ta: v.ta, fc: Number(v.fc), fr: 16, temp: Number(v.temp), sato2: Number(v.sato2), dxtx: Number(v.dxtx),
            date: SEED_DATE,
            time: v.time,
            created_at: `${SEED_DATE}T${v.time}Z`,
        });
        if (vitalsError) console.error('Error inserting vitals:', vitalsError.message);
    }

    // --- Hygiene (Care Logs) ---
    console.log('  > Seeding Hygiene...');
    // Diaper, Sheets, Bath
    const hygieneLogs = [
        { category: 'Diaper Change', time: '09:00:00', notes: 'Routine change' },
        { category: 'Sheet Change', time: '09:15:00', notes: 'Morning freshening' },
        { category: 'Bath', time: '10:00:00', notes: 'Full bath' },
        { category: 'Diaper Change', time: '15:00:00', notes: 'After nap' },
        { category: 'Diaper Change', time: '21:00:00', notes: 'Bedtime' }
    ];

    for (const h of hygieneLogs) {
        const { error: careError } = await supabase.from('care_logs').insert({
            resident_id: ana.id,
            performed_by: staffId,
            category: h.category,
            notes: h.notes,
            date: SEED_DATE,
            performed_at: `${SEED_DATE}T${h.time}Z`
        });
        if (careError) console.error('Error inserting care log:', careError.message);
    }

    // --- Nutrition ---
    console.log('  > Seeding Nutrition...');
    const meals = [
        { type: 'Breakfast', time: '08:30:00', desc: 'Oatmeal & Fruit', notes: 'Ate well' },
        { type: 'Lunch', time: '13:30:00', desc: 'Chicken & Rice', notes: 'Left some veggies' },
        { type: 'Dinner', time: '19:30:00', desc: 'Toast & Tea', notes: 'Full portion' }
    ];

    for (const m of meals) {
        const { error: nutError } = await supabase.from('nutrition_logs').insert({
            resident_id: ana.id,
            logged_by: staffId,
            meal_type: m.type,
            description: m.desc,
            notes: m.notes,
            date: SEED_DATE,
            logged_at: `${SEED_DATE}T${m.time}Z`
        });
        if (nutError) console.error('Error inserting nutrition:', nutError.message);
    }

    // --- Elimination ---
    console.log('  > Seeding Elimination...');
    const outputs = [
        { type: 'Urination', time: '08:15:00', char: 'Normal' },
        { type: 'Bowel Movement', time: '09:30:00', char: 'Normal consistency' },
        { type: 'Urination', time: '12:00:00', char: 'Clear' },
        { type: 'Urination', time: '16:00:00', char: 'Normal' },
        { type: 'Urination', time: '20:30:00', char: 'Normal' }
    ];

    for (const o of outputs) {
        const { error: elimError } = await supabase.from('elimination_logs').insert({
            resident_id: ana.id,
            logged_by: staffId,
            type: o.type,
            characteristics: o.char,
            date: SEED_DATE,
            logged_at: `${SEED_DATE}T${o.time}Z`
        });
        if (elimError) console.error('Error inserting elimination:', elimError.message);
    }

    // --- Nursing Notes ---
    console.log('  > Seeding Notes...');
    const notes = [
        { shift: 'Morning', cat: 'General', time: '07:00:00', content: 'Patient woke up in good mood. Vital signs stable.' },
        { shift: 'Afternoon', cat: 'Activity', time: '16:00:00', content: 'Participated in group bingo. Seemed engaged.' },
        { shift: 'Night', cat: 'General', time: '22:00:00', content: 'Sleeping effectively. No issues reported.' }
    ];

    // Map cats to allowed enum
    // 'General' | 'Incident' | 'Medical' | 'Family' | 'Activity'

    for (const n of notes) {
        const { error: noteError } = await supabase.from('nursing_notes').insert({
            id: randomUUID(),
            resident_id: ana.id,
            author_id: staffId,
            shift: n.shift,
            category: n.cat, // 'Activity' is in our local list, hopefully in DB enum? Need to check. 
            // medicalService.ts interface says 'General' | 'Incident' | 'Medical' | 'Family' | 'Activity'.
            severity: 'Low',
            content: n.content,
            created_at: `${SEED_DATE}T${n.time}Z`,
            updated_at: `${SEED_DATE}T${n.time}Z`
        });
        if (noteError) console.error('Error inserting note:', noteError.message);
    }

    console.log('✅ Seeding Complete for Ana Martines!');
}

seedAnaData();
