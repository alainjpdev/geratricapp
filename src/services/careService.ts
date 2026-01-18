import { supabase } from '../config/supabaseClient';

export interface CareLog {
    id: string;
    residentId: string;
    performedBy: string;
    category: 'Diaper Change' | 'Sheet Change' | 'Bath' | 'Position Change' | 'Other';
    performedAt: string;
    notes?: string;
    shift: 'Morning' | 'Afternoon' | 'Night';
    performer?: {
        firstName: string;
        lastName: string;
    };
}

export interface NutritionLog {
    id: string;
    residentId: string;
    loggedBy: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Hydration';
    percentageConsumed: number;
    description: string;
    loggedAt: string;
    notes?: string;
    logger?: {
        firstName: string;
        lastName: string;
    };
}

export interface EliminationLog {
    id: string;
    residentId: string;
    loggedBy: string;
    type: 'Urination' | 'Bowel Movement' | 'Vomit';
    characteristics: string;
    loggedAt: string;
    notes?: string;
    logger?: {
        firstName: string;
        lastName: string;
    };
}

export const careService = {
    // --- Care / Hygiene ---
    async logCare(data: Omit<CareLog, 'id' | 'performedAt'>) {
        const { data: result, error } = await supabase
            .from('care_logs')
            .insert([{
                resident_id: data.residentId,
                performed_by: data.performedBy,
                category: data.category,
                notes: data.notes,
                shift: data.shift
            }])
            .select()
            .single();

        if (error) {
            console.error('Error logging care:', error);
            throw error;
        }
        return result;
    },

    async getCareLogs(residentId: string, date: Date) {
        // Parse date string (assuming incoming date is YYYY-MM-DD based from Dashboard) or Date object
        const d = new Date(date);
        // Create strict start/end in local time based on the input date's Y/M/D
        // If input is YYYY-MM-DD string, 'new Date' treats it as UTC. We want to treat it as "This Day" in local time.
        // Actually, best to rely on string manipulation or just ensure the range covers the intended 24h.

        // Fix: Explicitly use the year/month/day from the input object 
        // to construct local Midnight to EOD 
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        // Adjust for potential UTC mismatch if the input 'date' was created from string "YYYY-MM-DD" (which implies UTC midnight)
        // If the 'date' passed in is strictly the result of `new Date("YYYY-MM-DD")`, its getFullYear/etc methods return local values 
        // derived from that UTC instance. 
        // E.g. "2024-01-17" -> UTC 00:00 -> EST 19:00 (prev day).
        // If we want "2024-01-17", we should look at the string passed or handle offset.
        // But since the service signature expects `Date`, we assume the caller passes a valid Date object.

        // BETTER FIX: The Dashboard is passing `new Date(dateString)`.
        // If dateString is "2024-01-17", date obj is UTC.
        // We should construct ISO strings for the query.

        // Let's use the ISO string of the date passed, split and reconstruct to avoid timezone shifts.
        const dateStr = date.toISOString().split('T')[0]; // "2024-01-17"

        // Create start/end using that string as local
        // Wait, if it's already a date object, toISOString might be different from local.
        // Let's rely on the fact we want to query for the 24h period of the *intended* day.
        // If Dashboard passes "2024-01-17", we want records where performed_at is within 2024-01-17 Local Time? 
        // DB stores TIMESTAMPTZ (UTC).
        // If we want "Everything that happened on Jan 17th", that is 2024-01-17 00:00 UTC to 23:59 UTC?
        // Or Local Time? Usually logbooks are local time.

        // Let's assume Local Time for now.
        // We need to query range [LocalMidnight_in_UTC, LocalEOD_in_UTC]

        // Reuse the logic: 'date' argument comes from `new Date(string)`.
        // If string is "2024-01-17", 'date' is UTC midnight.
        // We want 2024-01-17 00:00:00 UTC to 23:59:59 UTC?
        // Yes, likely simply matching the date string implies UTC day for consistency if DB stores UTC.

        // Simplified approach: Query the whole day in UTC to match the 'date' object.
        const startStr = date.toISOString().split('T')[0] + 'T00:00:00.000Z';
        const endStr = date.toISOString().split('T')[0] + 'T23:59:59.999Z';

        // BUT wait, `logCare` uses NOW(), which is UTC.
        // So querying 00:00 to 23:59 UTC should find it.

        // Reverting to the simpler filtered logic which likely failed due to timezones:
        // previous startOfDay logic did strict local conversion.

        // NEW LOGIC: Use the ISO string directly.
        const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD


        const { data, error } = await supabase
            .from('care_logs')
            .select(`
                *,
                performer:users (first_name, last_name)
            `)
            .eq('resident_id', residentId)
            .gte('performed_at', `${isoDate}T00:00:00.000Z`)
            .lte('performed_at', `${isoDate}T23:59:59.999Z`)
            .order('performed_at', { ascending: false });

        if (error) {
            console.error('Error fetching care logs:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            performedBy: d.performed_by,
            category: d.category,
            performedAt: d.performed_at,
            notes: d.notes,
            shift: d.shift,
            performer: {
                firstName: d.performer?.first_name,
                lastName: d.performer?.last_name
            }
        }));
    },

    // --- Nutrition ---
    async logNutrition(data: Omit<NutritionLog, 'id' | 'loggedAt'>) {
        const { data: result, error } = await supabase
            .from('nutrition_logs')
            .insert([{
                resident_id: data.residentId,
                logged_by: data.loggedBy,
                meal_type: data.mealType,
                percentage_consumed: data.percentageConsumed,
                description: data.description,
                notes: data.notes
            }])
            .select()
            .single();

        if (error) {
            console.error('Error logging nutrition:', error);
            throw error;
        }
        return result;
    },

    async getNutritionLogs(residentId: string, date: Date) {
        const isoDate = date.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('nutrition_logs')
            .select(`
                *,
                logger:users (first_name, last_name)
            `)
            .eq('resident_id', residentId)
            .gte('logged_at', `${isoDate}T00:00:00.000Z`)
            .lte('logged_at', `${isoDate}T23:59:59.999Z`)
            .order('logged_at', { ascending: true });

        if (error) {
            console.error('Error fetching nutrition logs:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            loggedBy: d.logged_by,
            mealType: d.meal_type,
            percentageConsumed: d.percentage_consumed,
            description: d.description,
            loggedAt: d.logged_at,
            notes: d.notes,
            logger: {
                firstName: d.logger?.first_name,
                lastName: d.logger?.last_name
            }
        }));
    },

    // --- Elimination ---
    async logElimination(data: Omit<EliminationLog, 'id' | 'loggedAt'>) {
        const { data: result, error } = await supabase
            .from('elimination_logs')
            .insert([{
                resident_id: data.residentId,
                logged_by: data.loggedBy,
                type: data.type,
                characteristics: data.characteristics,
                notes: data.notes
            }])
            .select()
            .single();

        if (error) {
            console.error('Error logging elimination:', error);
            throw error;
        }
        return result;
    },

    async getEliminationLogs(residentId: string, date: Date) {
        const isoDate = date.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('elimination_logs')
            .select(`
                *,
                logger:users (first_name, last_name)
            `)
            .eq('resident_id', residentId)
            .gte('logged_at', `${isoDate}T00:00:00.000Z`)
            .lte('logged_at', `${isoDate}T23:59:59.999Z`)
            .order('logged_at', { ascending: false });

        if (error) {
            console.error('Error fetching elimination logs:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            loggedBy: d.logged_by,
            type: d.type,
            characteristics: d.characteristics,
            loggedAt: d.logged_at,
            notes: d.notes,
            logger: {
                firstName: d.logger?.first_name,
                lastName: d.logger?.last_name
            }
        }));
    },

    // --- Unified History ---
    async getResidentHistory(residentId: string, limit = 50) {
        // Fetch most recent logs from all categories
        const [care, nutrition, elimination] = await Promise.all([
            supabase.from('care_logs')
                .select('*, performer:users(first_name, last_name)')
                .eq('resident_id', residentId)
                .order('performed_at', { ascending: false })
                .limit(limit),
            supabase.from('nutrition_logs')
                .select('*, logger:users(first_name, last_name)')
                .eq('resident_id', residentId)
                .order('logged_at', { ascending: false })
                .limit(limit),
            supabase.from('elimination_logs')
                .select('*, logger:users(first_name, last_name)')
                .eq('resident_id', residentId)
                .order('logged_at', { ascending: false })
                .limit(limit)
        ]);

        const history: any[] = [];

        care.data?.forEach((d: any) => history.push({
            id: d.id,
            type: 'Cuidados',
            summary: d.category,
            detail: d.notes,
            timestamp: d.performed_at,
            author: `${d.performer?.first_name || ''} ${d.performer?.last_name || ''}`
        }));

        nutrition.data?.forEach((d: any) => history.push({
            id: d.id,
            type: 'Alimentación',
            summary: d.meal_type,
            detail: `${d.description} (${d.percentage_consumed}%)`,
            timestamp: d.logged_at,
            author: `${d.logger?.first_name || ''} ${d.logger?.last_name || ''}`
        }));

        elimination.data?.forEach((d: any) => history.push({
            id: d.id,
            type: 'Eliminación',
            summary: d.type,
            detail: d.characteristics,
            timestamp: d.logged_at,
            author: `${d.logger?.first_name || ''} ${d.logger?.last_name || ''}`
        }));

        // Sort combined
        return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    }
};
