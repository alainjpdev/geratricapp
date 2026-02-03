import React, { useEffect, useState } from 'react';
import { Clock, Check, AlertCircle, Filter, Search, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { emarService, MedicationOrder } from '../../../services/emarService';
import { useAuthStore } from '../../../store/authStore';
// @ts-ignore
import { supabase } from '../../../config/supabaseClient';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
}

const EMARDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<MedicationOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterShift, setFilterShift] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning');

    // Staff selection state
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');

    // Dummy logic to determine current shift based on hour for default selection
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 14) setFilterShift('Morning');
        else if (hour >= 14 && hour < 20) setFilterShift('Evening'); // Using Evening instead of Afternoon for consistency with seed
        else setFilterShift('Night');

        loadOrders();
        fetchStaffMembers();
    }, []);

    const fetchStaffMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, first_name, last_name, role')
                .in('role', ['admin', 'enfermero'])
                .eq('is_active', true)
                .order('first_name');

            if (error) throw error;
            setStaffMembers(data || []);

            // Auto-select current user if they are in the list
            if (user?.id && data?.some((s: StaffMember) => s.id === user.id)) {
                setSelectedStaffId(user.id);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await emarService.getAllActiveOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load medication orders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminister = async (order: MedicationOrder) => {
        if (!confirm(`¿Confirmar administración de ${order.medicationName} a ${order.resident?.firstName}?`)) return;

        try {
            const adminUser = selectedStaffId || user?.id;

            if (!adminUser) {
                alert('Por favor seleccione el personal que administra');
                return;
            }

            await emarService.logAdministration({
                orderId: order.id,
                administeredBy: adminUser,
                status: 'Given',
                notes: 'Administrado desde eMAR Dashboard',
                shift: filterShift,
                medicationName: order.medicationName,
                residentId: order.residentId
            });

            alert('Medicamento registrado exitosamente');
            // In a real app we might update local state to show "Given" for today
        } catch (error) {
            alert('Error al registrar medicamento');
        }
    };

    // Filter orders by frequency roughly matching the shift (very basic logic)
    const filteredOrders = orders.filter(o => {
        if (o.frequency === 'PRN') return true; // Always show PRN
        if (o.frequency === filterShift) return true;
        if (o.frequency === 'Morning' && filterShift === 'Morning') return true;
        if (o.frequency === 'Evening' && (filterShift === 'Evening' || filterShift === 'Afternoon')) return true;
        if (o.frequency === 'Night' && filterShift === 'Night') return true;
        // Handle specific times later
        return false;
    });

    return (
        <div className="flex flex-col min-h-screen bg-white px-1 py-4 md:p-8 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-sky-600" />
                        eMAR - Administración de Medicamentos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestión de dosis por turno</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    {/* Staff Dropdown */}
                    <div className="relative min-w-[200px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm h-10 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                            <option value="">Seleccionar Personal</option>
                            {staffMembers.map(staff => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.first_name} {staff.last_name} ({staff.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {(['Morning', 'Evening', 'Night'] as const).map(shift => (
                            <Button
                                key={shift}
                                variant={filterShift === shift ? 'primary' : 'outline'}
                                onClick={() => setFilterShift(shift)}
                                className="capitalize"
                            >
                                {shift === 'Morning' ? 'Mañana' : shift === 'Evening' ? 'Tarde/Noche' : 'Noche'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Cargando medicamentos...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Todo al día</h3>
                    <p className="text-gray-500">No hay medicamentos programados pendientes para el turno de la {filterShift === 'Morning' ? 'Mañana' : filterShift === 'Evening' ? 'Tarde' : 'Noche'}.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full min-w-[1000px] text-sm text-left border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                            <tr>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 w-1/5">Residente</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 w-1/4">Medicamento</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-center w-24 md:w-32">Dosis</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-center w-28 md:w-40">Vía</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-center w-24 md:w-32">1ª Dosis</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-center w-24 md:w-32">2ª Dosis</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-center w-24 md:w-32">3ª Dosis</th>
                                <th className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 text-center w-24 md:w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredOrders.map((order) => {
                                // Simple logic to determine which columns are 'active' based on frequency
                                // This is aesthetic to match the request "1st, 2nd, 3rd dose"
                                const isMorning = order.frequency.includes('Morning') || order.frequency === 'Every 8 hours' || order.frequency === 'Every 6 hours';
                                const isAfternoon = order.frequency.includes('Afternoon') || order.frequency.includes('Evening') || order.frequency === 'Every 8 hours' || order.frequency === 'Every 6 hours';
                                const isNight = order.frequency.includes('Night') || order.frequency === 'Every 8 hours';

                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            <div className="flex flex-col">
                                                <span>{order.resident?.firstName} {order.resident?.lastName}</span>
                                                <span className="text-xs text-gray-500">Hab: {order.resident?.roomNumber || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">{order.medicationName}</span>
                                                {order.instructions && <span className="text-xs text-orange-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {order.instructions}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">{order.dosage}</td>
                                        <td className="px-4 py-3 text-center">{order.route}</td>

                                        {/* 1st Dose */}
                                        <td className="px-4 py-3 text-center">
                                            {isMorning ? (
                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                                                    Mañana
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>

                                        {/* 2nd Dose */}
                                        <td className="px-4 py-3 text-center">
                                            {isAfternoon ? (
                                                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-semibold">
                                                    Tarde
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>

                                        {/* 3rd Dose */}
                                        <td className="px-4 py-3 text-center">
                                            {isNight ? (
                                                <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-semibold">
                                                    Noche
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                size="sm"
                                                onClick={() => handleAdminister(order)}
                                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm w-full"
                                            >
                                                Administrar
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EMARDashboard;
