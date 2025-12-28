import { supabase } from '../config/supabaseClient';

export interface Resident {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string date
    roomNumber?: string;
    status: 'Active' | 'Hospitalized' | 'Deceased';
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    };
    allergies?: string;
    conditions?: string;
    carePlanSummary?: string;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const residentService = {
    async getAllResidents() {
        const { data, error } = await supabase
            .from('residents')
            .select('*')
            .order('last_name', { ascending: true });

        if (error) {
            console.error('Error fetching residents:', error);
            throw error;
        }

        return data as Resident[];
    },

    async getResidentById(id: string) {
        const { data, error } = await supabase
            .from('residents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error fetching resident ${id}:`, error);
            throw error;
        }

        return data as Resident;
    },

    async createResident(resident: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>) {
        const { data, error } = await supabase
            .from('residents')
            .insert([
                {
                    first_name: resident.firstName,
                    last_name: resident.lastName,
                    date_of_birth: resident.dateOfBirth,
                    room_number: resident.roomNumber,
                    status: resident.status,
                    emergency_contact: resident.emergencyContact,
                    allergies: resident.allergies,
                    conditions: resident.conditions,
                    care_plan_summary: resident.carePlanSummary,
                    user_id: resident.userId
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating resident:', error);
            throw error;
        }

        return data;
    },

    async updateResident(id: string, updates: Partial<Resident>) {
        // Map camelCase to snake_case for DB
        const dbUpdates: any = {};
        if (updates.firstName) dbUpdates.first_name = updates.firstName;
        if (updates.lastName) dbUpdates.last_name = updates.lastName;
        if (updates.dateOfBirth) dbUpdates.date_of_birth = updates.dateOfBirth;
        if (updates.roomNumber) dbUpdates.room_number = updates.roomNumber;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.emergencyContact) dbUpdates.emergency_contact = updates.emergencyContact;
        if (updates.allergies) dbUpdates.allergies = updates.allergies;
        if (updates.conditions) dbUpdates.conditions = updates.conditions;
        if (updates.carePlanSummary) dbUpdates.care_plan_summary = updates.carePlanSummary;
        if (updates.userId) dbUpdates.user_id = updates.userId;

        const { data, error } = await supabase
            .from('residents')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`Error updating resident ${id}:`, error);
            throw error;
        }

        return data;
    }
};
