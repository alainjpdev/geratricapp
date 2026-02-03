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

export interface DailyMedication {
    id: string;
    residentId: string;
    medicamento: string;
    dosis: string;
    via: string;
    observacion: string;
    dose1Time?: string;
    dose2Time?: string;
    dose3Time?: string;
    dose4Time?: string;
    recordedBy?: string;
    date: string;
    // Audit / Verification Fields
    dose1Checker?: string;
    dose1CheckTime?: string;
    dose1Status?: boolean;
    dose2Checker?: string;
    dose2CheckTime?: string;
    dose2Status?: boolean;
    dose3Checker?: string;
    dose3CheckTime?: string;
    dose3Status?: boolean;
    dose4Checker?: string;
    dose4CheckTime?: string;
    dose4Status?: boolean;
}

export interface DailyStaffing {
    residentId: string;
    date: string;
    tmNurse?: string;
    tvNurse?: string;
    tnNurse?: string;
    condition?: string;
    relevantNotes?: string;
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
            .select()
            .maybeSingle();

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
            .select()
            .maybeSingle();

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
    },

    // --- Daily Medications (Ad-hoc Sheet) ---
    async getDailyMedications(residentId: string, date: string) {
        const { data, error } = await supabase
            .from('medications')
            .select(`
                id, resident_id, date, medicamento, dosis, via, observacion, recorded_by,
                dose1_time, dose2_time, dose3_time, dose4_time,
                dose1_checker, dose1_check_time, dose1_status,
                dose2_checker, dose2_check_time, dose2_status,
                dose3_checker, dose3_check_time, dose3_status,
                dose4_checker, dose4_check_time, dose4_status
            `)
            .eq('resident_id', residentId)
            .eq('date', date)
            .order('created_at', { ascending: true }); // Order by creation since time is now in columns

        if (error) {
            console.error('Error fetching medications:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            medicamento: d.medicamento,
            dosis: d.dosis,
            via: d.via,
            observacion: d.observacion,
            dose1Time: d.dose1_time,
            dose2Time: d.dose2_time,
            dose3Time: d.dose3_time,
            dose4Time: d.dose4_time,

            dose1Checker: d.dose1_checker,
            dose1CheckTime: d.dose1_check_time,
            dose1Status: d.dose1_status,
            dose2Checker: d.dose2_checker,
            dose2CheckTime: d.dose2_check_time,
            dose2Status: d.dose2_status,
            dose3Checker: d.dose3_checker,
            dose3CheckTime: d.dose3_check_time,
            dose3Status: d.dose3_status,
            dose4Checker: d.dose4_checker,
            dose4CheckTime: d.dose4_check_time,
            dose4Status: d.dose4_status,

            recordedBy: d.recorded_by,
            date: d.date
        }));
    },

    // --- Daily Staffing ---
    async getDailyStaffing(residentId: string, date: string) {
        const { data, error } = await supabase
            .from('daily_staffing')
            .select('*')
            .eq('resident_id', residentId)
            .eq('date', date)
            .maybeSingle();

        if (error) {
            console.error('Error fetching daily staffing:', error);
            return null;
        }

        if (!data) return null;

        return {
            residentId: data.resident_id,
            date: data.date,
            tmNurse: data.tm_nurse,
            tvNurse: data.tv_nurse,
            tnNurse: data.tn_nurse,
            condition: data.condition,
            relevantNotes: data.relevant_notes
        } as DailyStaffing;
    },

    async saveDailyStaffing(staffing: DailyStaffing) {
        const { error } = await supabase
            .from('daily_staffing')
            .upsert({
                resident_id: staffing.residentId,
                date: staffing.date,
                tm_nurse: staffing.tmNurse,
                tv_nurse: staffing.tvNurse,
                tn_nurse: staffing.tnNurse,
                condition: staffing.condition,
                relevant_notes: staffing.relevantNotes,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'resident_id,date'
            });

        if (error) {
            console.error('Error saving daily staffing:', error);
            throw error;
        }
    },

    async getGlobalStaffing(date: string) {
        const { data, error } = await supabase
            .from('global_staffing')
            .select('*')
            .eq('date', date)
            .maybeSingle();

        if (error) {
            console.error('Error fetching global staffing:', error);
            return null;
        }
        return data ? {
            tmNurse: data.tm_nurse,
            tvNurse: data.tv_nurse,
            tnNurse: data.tn_nurse
        } : null;
    },

    async saveGlobalStaffing(date: string, tm: string, tv: string, tn: string) {
        const { error } = await supabase
            .from('global_staffing')
            .upsert({
                date,
                tm_nurse: tm,
                tv_nurse: tv,
                tn_nurse: tn,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'date'
            });

        if (error) {
            console.error('Error saving global staffing:', error);
            throw error;
        }
    },

    // --- Range Queries for Reports ---
    async getVitalsRange(residentId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('vital_signs')
            .select('*')
            .eq('resident_id', residentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) {
            console.error('Error fetching vitals range:', error);
            throw error;
        }
        return data;
    },

    async getMedicationsRange(residentId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('medications')
            .select(`
                 id, resident_id, date, medicamento, dosis, via, observacion, recorded_by,
                 dose1_time, dose2_time, dose3_time, dose4_time
            `)
            .eq('resident_id', residentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching medications range:', error);
            throw error;
        }
        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            medicamento: d.medicamento,
            dosis: d.dosis,
            via: d.via,
            observacion: d.observacion,
            dose1Time: d.dose1_time,
            dose2Time: d.dose2_time,
            dose3Time: d.dose3_time,
            dose4Time: d.dose4_time,
            recordedBy: d.recorded_by,
            date: d.date
        }));
    },

    async getDailyStaffingRange(residentId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('daily_staffing')
            .select('*')
            .eq('resident_id', residentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching daily staffing range:', error);
            throw error;
        }
        return data.map((d: any) => ({
            residentId: d.resident_id,
            date: d.date,
            tmNurse: d.tm_nurse,
            tvNurse: d.tv_nurse,
            tnNurse: d.tn_nurse,
            condition: d.condition,
            relevantNotes: d.relevant_notes
        }));
    },

    async getCareLogsRange(residentId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('care_logs')
            .select('*')
            .eq('resident_id', residentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) {
            console.error('Error fetching care logs range:', error);
            throw error;
        }
        return data;
    },

    async getNutritionLogsRange(residentId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('resident_id', residentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) {
            console.error('Error fetching nutrition logs range:', error);
            throw error;
        }
        return data;
    },

    async getEliminationLogsRange(residentId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('elimination_logs')
            .select('*')
            .eq('resident_id', residentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) {
            console.error('Error fetching elimination logs range:', error);
            throw error;
        }
        return data;
    },

    // --- Medication Library (Autocomplete) ---
    async searchMedications(query: string) {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('medication_library')
            .select('name')
            .ilike('name', `%${query}%`)
            .limit(10);

        if (error) {
            console.error('Error searching medications:', error);
            return [];
        }
        return data.map(d => d.name);
    },

    async addToLibrary(name: string) {
        if (!name) return;
        const cleanName = name.trim();

        const { error } = await supabase
            .from('medication_library')
            .upsert(
                { name: cleanName },
                { onConflict: 'name', ignoreDuplicates: true }
            );

        if (error) {
            console.error('Error adding to medication library:', error);
        }
    },

    async removeFromLibrary(name: string) {
        if (!name) return;
        const { error } = await supabase
            .from('medication_library')
            .delete()
            .eq('name', name);

        if (error) {
            console.error('Error removing from medication library:', error);
            throw error;
        }
    },

    formatDateToDMY(dateStr: string) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        if (!y || !m || !d) return dateStr;
        return `${d}/${m}/${y}`;
    }
};
