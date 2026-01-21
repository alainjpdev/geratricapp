import { supabase } from '../config/supabaseClient';

export interface VitalSign {
    id: string;
    residentId: string;
    recordedBy: string;
    recordedAt: string; // We will map 'created_at' or rely on 'date' + 'time'
    date?: string;
    time?: string;
    // Database fields are strings
    ta?: string;
    fc?: string;
    fr?: string;
    temp?: string;
    sato2?: string;
    dxtx?: string;
    notes?: string;
    resident?: {
        firstName: string;
        lastName: string;
    };
    recorderName?: string;
}

export interface NursingNote {
    id: string;
    residentId: string;
    authorId: string;
    createdAt: string;
    shift: 'Morning' | 'Afternoon' | 'Night';
    category: 'General' | 'Incident' | 'Medical' | 'Family' | 'Activity';
    content: string;
    severity: 'Low' | 'Medium' | 'High';
    resident?: {
        firstName: string;
        lastName: string;
    };
    author?: {
        firstName: string;
        lastName: string;
    };
}

export const medicalService = {
    // --- Vitals ---

    async recordVitals(data: any) { // Simplified type for now as direct usage is usually via specific UIs
        // This method might not be used by Dashboard.tsx which has its own logic, 
        // but keeping it compatible just in case.
        const { data: result, error } = await supabase
            .from('vital_signs')
            .insert([
                {
                    resident_id: data.residentId,
                    recorded_by: data.recordedBy,
                    ta: data.ta,
                    fc: data.fc,
                    fr: data.fr,
                    temp: data.temp,
                    sato2: data.sato2,
                    dxtx: data.dxtx,
                    date: new Date().toISOString().split('T')[0], // Fallback
                    time: new Date().toLocaleTimeString(), // Fallback
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error recording vitals:', error);
            throw error;
        }
        return result;
    },

    async getVitalsByResident(residentId: string, date?: string) {
        let query = supabase
            .from('vital_signs')
            .select(`
        *,
        recorder:users (first_name, last_name)
      `)
            .eq('resident_id', residentId);

        if (date) {
            query = query.eq('date', date);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching vitals:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            recordedBy: d.recorded_by,
            recordedAt: d.created_at, // Map created_at to recordedAt interface property
            date: d.date,
            time: d.time,
            ta: d.ta,
            fc: d.fc,
            fr: d.fr,
            temp: d.temp,
            sato2: d.sato2,
            dxtx: d.dxtx,
            recorderName: d.recorder ? `${d.recorder.first_name || ''} ${d.recorder.last_name || ''}` : 'Unknown'
        }));
    },


    // --- Nursing Notes ---

    async createNote(data: Omit<NursingNote, 'id' | 'createdAt'>) {
        const { data: result, error } = await supabase
            .from('nursing_notes')
            .insert([
                {
                    resident_id: data.residentId,
                    author_id: data.authorId,
                    shift: data.shift,
                    category: data.category,
                    content: data.content,
                    severity: data.severity
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating note:', error);
            throw error;
        }
        return result;
    },

    async getNotesByResident(residentId: string) {
        const { data, error } = await supabase
            .from('nursing_notes')
            .select(`
        *,
        author:users (first_name, last_name)
      `)
            .eq('resident_id', residentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            authorId: d.author_id,
            createdAt: d.created_at,
            shift: d.shift,
            category: d.category,
            content: d.content,
            severity: d.severity,
            author: {
                firstName: d.author?.first_name,
                lastName: d.author?.last_name
            }
        }));
    },

    // Get recent notes for the general dashboard
    async getRecentNotes() {
        const { data, error } = await supabase
            .from('nursing_notes')
            .select(`
        *,
        resident:residents (first_name, last_name),
        author:users (first_name, last_name)
      `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching recent notes:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            authorId: d.author_id,
            createdAt: d.created_at,
            shift: d.shift,
            category: d.category,
            content: d.content,
            severity: d.severity,
            resident: {
                firstName: d.resident?.first_name,
                lastName: d.resident?.last_name
            },
            author: {
                firstName: d.author?.first_name,
                lastName: d.author?.last_name
            }
        }));
    }
};
