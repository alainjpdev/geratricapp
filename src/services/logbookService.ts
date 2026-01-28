import { supabase } from '../config/supabaseClient';

export interface CareLog {
    id: string;
    resident_id: string;
    performed_by?: string;
    category: 'Diaper Change' | 'Sheet Change' | 'Bath' | 'Position Change' | 'Other';
    performed_at: string;
    notes?: string;
    shift?: 'Morning' | 'Afternoon' | 'Night';
    date: string;
}

export interface NutritionLog {
    id: string;
    resident_id: string;
    logged_by?: string;
    meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Hydration';
    percentage_consumed: number;
    description?: string;
    logged_at: string;
    date: string;
    notes?: string;
}

export interface EliminationLog {
    id: string;
    resident_id: string;
    logged_by?: string;
    type: 'Urination' | 'Bowel Movement' | 'Vomit';
    characteristics?: string;
    logged_at: string;
    date: string;
    notes?: string;
}


export interface SleepLog {
    id: string;
    resident_id: string;
    date: string;
    start_time: string;
    end_time?: string;
    quality?: 'Good' | 'Fair' | 'Poor' | 'Interrupted';
    observations?: string;
    created_at?: string;
    created_by?: string;
}

export const logbookService = {
    // --- Care Logs ---
    async getCareLogs(residentId: string, date: string) {
        const { data, error } = await supabase
            .from('care_logs')
            .select('*')
            .eq('resident_id', residentId)
            .eq('date', date)
            .order('performed_at', { ascending: false });

        if (error) throw error;
        return data as CareLog[];
    },

    async addCareLog(log: Omit<CareLog, 'id'>) {
        const { data, error } = await supabase
            .from('care_logs')
            .insert([log])
            .select()
            .single();

        if (error) throw error;
        return data as CareLog;
    },

    async deleteCareLog(id: string) {
        const { error } = await supabase.from('care_logs').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Nutrition Logs ---
    async getNutritionLogs(residentId: string, date: string) {
        const { data, error } = await supabase
            .from('nutrition_logs')
            .select('*')
            .eq('resident_id', residentId)
            .eq('date', date)
            .order('logged_at', { ascending: false });

        if (error) throw error;
        return data as NutritionLog[];
    },

    async addNutritionLog(log: Omit<NutritionLog, 'id'>) {
        const { data, error } = await supabase
            .from('nutrition_logs')
            .insert([log])
            .select()
            .single();

        if (error) throw error;
        return data as NutritionLog;
    },

    async deleteNutritionLog(id: string) {
        const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Elimination Logs ---
    async getEliminationLogs(residentId: string, date: string) {
        const { data, error } = await supabase
            .from('elimination_logs')
            .select('*')
            .eq('resident_id', residentId)
            .eq('date', date)
            .order('logged_at', { ascending: false });

        if (error) throw error;
        return data as EliminationLog[];
    },

    async addEliminationLog(log: Omit<EliminationLog, 'id'>) {
        const { data, error } = await supabase
            .from('elimination_logs')
            .insert([log])
            .select()
            .single();

        if (error) throw error;
        return data as EliminationLog;
    },

    async deleteEliminationLog(id: string) {
        const { error } = await supabase.from('elimination_logs').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Sleep Logs ---
    async getSleepLogs(residentId: string, date: string) {
        const { data, error } = await supabase
            .from('sleep_logs')
            .select('*')
            .eq('resident_id', residentId)
            .eq('date', date)
            .order('start_time', { ascending: false });

        if (error) throw error;
        return data as SleepLog[];
    },

    async addSleepLog(log: Omit<SleepLog, 'id'>) {
        const { data, error } = await supabase
            .from('sleep_logs')
            .insert([log])
            .select()
            .single();

        if (error) throw error;
        return data as SleepLog;
    },

    async deleteSleepLog(id: string) {
        const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
        if (error) throw error;
    },
};
