import { supabase } from '../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface Resident {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string date
    roomNumber?: string;
    status: 'Active' | 'Hospitalized' | 'Deceased' | 'Archived';
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    };
    allergies?: string;
    conditions?: string;
    relevantNotes?: string;
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
            .neq('status', 'Archived')
            .order('last_name', { ascending: true });

        if (error) {
            console.error('residentService: Supabase error:', error);
            throw error;
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            firstName: item.first_name,
            lastName: item.last_name,
            dateOfBirth: item.date_of_birth,
            roomNumber: item.room_number,
            status: item.status,
            emergencyContact: item.emergency_contact,
            allergies: item.allergies,
            conditions: item.conditions,
            relevantNotes: item.relevant_notes,
            carePlanSummary: item.care_plan_summary,
            userId: item.user_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        })) as Resident[];
    },

    async getResidentById(id: string) {
        const { data, error } = await supabase
            .from('residents')
            .select('*')
            .eq('id', id)
            .eq('id', id)
            .maybeSingle();

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
                    id: uuidv4(),
                    first_name: resident.firstName,
                    last_name: resident.lastName,
                    date_of_birth: resident.dateOfBirth,
                    room_number: resident.roomNumber,
                    status: resident.status,
                    emergency_contact: resident.emergencyContact,
                    allergies: resident.allergies,
                    conditions: resident.conditions,
                    relevant_notes: resident.relevantNotes,
                    care_plan_summary: resident.carePlanSummary,
                    user_id: resident.userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .select()
            .maybeSingle();

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
        if (updates.relevantNotes) dbUpdates.relevant_notes = updates.relevantNotes;
        if (updates.carePlanSummary) dbUpdates.care_plan_summary = updates.carePlanSummary;
        if (updates.userId) dbUpdates.user_id = updates.userId;

        const { data, error } = await supabase
            .from('residents')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .select()
            .maybeSingle();

        if (error) {
            console.error(`Error updating resident ${id}:`, error);
            throw error;
        }

        return data;
    },

    async deleteResident(id: string) {
        const { error } = await supabase
            .from('residents')
            .update({ status: 'Archived' })
            .eq('id', id);

        if (error) {
            console.error(`Error deleting resident ${id}:`, error);
            throw error;
        }
    }
};
