import { supabase } from '../config/supabaseClient';

export interface VitalSign {
    id: string;
    residentId: string;
    recordedBy: string;
    recordedAt: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    glucose?: number;
    weight?: number;
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

    async recordVitals(data: Omit<VitalSign, 'id' | 'recordedAt'>) {
        const { data: result, error } = await supabase
            .from('vital_signs')
            .insert([
                {
                    resident_id: data.residentId,
                    recorded_by: data.recordedBy,
                    bp_systolic: data.bloodPressureSystolic,
                    bp_diastolic: data.bloodPressureDiastolic,
                    heart_rate: data.heartRate,
                    temperature: data.temperature,
                    oxygen_saturation: data.oxygenSaturation,
                    glucose: data.glucose,
                    weight: data.weight,
                    notes: data.notes
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

    async getVitalsByResident(residentId: string) {
        const { data, error } = await supabase
            .from('vital_signs')
            .select(`
        *,
        recorder:users (first_name, last_name)
      `)
            .eq('resident_id', residentId)
            .order('recorded_at', { ascending: false });

        if (error) {
            console.error('Error fetching vitals:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            recordedBy: d.recorded_by,
            recordedAt: d.recorded_at,
            bloodPressureSystolic: d.bp_systolic,
            bloodPressureDiastolic: d.bp_diastolic,
            heartRate: d.heart_rate,
            temperature: d.temperature,
            oxygenSaturation: d.oxygen_saturation,
            glucose: d.glucose,
            weight: d.weight,
            notes: d.notes,
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
