import { supabase } from '../config/supabaseClient';

export interface MedicationOrder {
    id: string;
    residentId: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    instructions?: string;
    resident?: {
        firstName: string;
        lastName: string;
        roomNumber?: string;
    };
}

export interface MedicationLog {
    id: string;
    orderId: string;
    administeredBy: string;
    administeredAt: string;
    status: 'Given' | 'Refused' | 'Missed';
    notes?: string;
    shift?: string;
    order?: MedicationOrder;
}

export const emarService = {
    // Get all active medication orders for a resident
    async getOrdersByResident(residentId: string) {
        const { data, error } = await supabase
            .from('medication_orders')
            .select(`
        *,
        resident:residents (first_name, last_name, room_number)
      `)
            .eq('resident_id', residentId)
            .eq('is_active', true)
            .order('medication_name');

        if (error) {
            console.error('Error fetching medication orders:', error);
            throw error;
        }

        return data as MedicationOrder[];
    },

    // Get all active orders for the facility to be shown on the dashboard (shift view)
    async getAllActiveOrders() {
        const { data, error } = await supabase
            .from('medication_orders')
            .select(`
        *,
        resident:residents (id, first_name, last_name, room_number)
      `)
            .eq('is_active', true)
            .order('resident_id'); // Group by resident roughly

        if (error) {
            console.error('Error fetching all active orders:', error);
            throw error;
        }

        // Map DB snake_case to camelCase partially handled by Supabase js types if defined, 
        // but here we rely on the component to handle or map it. 
        // Ideally we should map it here. Let's return raw data for now and map in UI or clean up types.
        // Actually, let's map it to keep backend clean.
        return data.map((d: any) => ({
            id: d.id,
            residentId: d.resident_id,
            medicationName: d.medication_name,
            dosage: d.dosage,
            frequency: d.frequency,
            route: d.route,
            startDate: d.start_date,
            endDate: d.end_date,
            isActive: d.is_active,
            instructions: d.instructions,
            resident: {
                id: d.resident?.id,
                firstName: d.resident?.first_name,
                lastName: d.resident?.last_name,
                roomNumber: d.resident?.room_number
            }
        }));
    },

    // Log a medication administration
    async logAdministration(logData: Omit<MedicationLog, 'id' | 'administeredAt'>) {
        const { data, error } = await supabase
            .from('medication_logs')
            .insert([
                {
                    order_id: logData.orderId,
                    administered_by: logData.administeredBy,
                    status: logData.status,
                    notes: logData.notes,
                    shift: logData.shift
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error logging medication:', error);
            throw error;
        }

        return data;
    },

    // Get logs for a specific resident (History)
    async getLogsByResident(residentId: string) {
        // This requires a join filtering by resident via order.
        // Supabase filtering on joined tables is a bit tricky with "inner join" logic, 
        // usually done by !inner modifier or separate queries.

        // Easier approach: Get order IDs for resident, then get logs for those orders.

        const { data: orders } = await supabase
            .from('medication_orders')
            .select('id')
            .eq('resident_id', residentId);

        if (!orders || orders.length === 0) return [];

        const orderIds = orders.map(o => o.id);

        const { data, error } = await supabase
            .from('medication_logs')
            .select(`
            *,
            order:medication_orders (medication_name, dosage)
        `)
            .in('order_id', orderIds)
            .order('administered_at', { ascending: false });

        if (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }

        return data.map((d: any) => ({
            id: d.id,
            orderId: d.order_id,
            administeredBy: d.administered_by,
            administeredAt: d.administered_at,
            status: d.status,
            notes: d.notes,
            shift: d.shift,
            order: {
                medicationName: d.order?.medication_name,
                dosage: d.order?.dosage
            }
        }));
    }
};
