import React, { useEffect, useState } from 'react';
import { emarService, MedicationOrder, MedicationLog } from '../../../../services/emarService';
import { Card } from '../../../../components/ui/Card';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Props {
    residentId: string;
    date: string;
}

export const MedicationSection: React.FC<Props> = ({ residentId, date }) => {
    const [orders, setOrders] = useState<MedicationOrder[]>([]);
    const [logs, setLogs] = useState<MedicationLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [residentId, date]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedOrders, fetchedLogs] = await Promise.all([
                emarService.getOrdersByResident(residentId),
                emarService.getLogsByResident(residentId)
            ]);

            // Filter orders active on this date
            // Start Date <= Selected Date
            // End Date >= Selected Date OR End Date is null
            const activeOrders = fetchedOrders.filter(o => {
                const start = new Date(o.startDate).setHours(0, 0, 0, 0);
                const current = new Date(date).setHours(0, 0, 0, 0);
                const end = o.endDate ? new Date(o.endDate).setHours(0, 0, 0, 0) : Infinity;
                return start <= current && end >= current;
            });

            // Filter logs for this date
            const dailyLogs = fetchedLogs.filter(l =>
                new Date(l.administeredAt).toISOString().split('T')[0] === date
            );

            setOrders(activeOrders);
            setLogs(dailyLogs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusForOrder = (orderId: string) => {
        const log = logs.find(l => l.orderId === orderId);
        if (log) {
            return { status: log.status, time: new Date(log.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        }
        return null;
    };

    return (
        <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {loading ? <div className="text-center p-4">Cargando medicamentos...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map(order => {
                        const status = getStatusForOrder(order.id);
                        return (
                            <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col justify-between bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200">{order.medicationName}</h4>
                                    <p className="text-sm text-gray-500">{order.dosage} • {order.frequency}</p>
                                    <p className="text-xs text-gray-400 mt-1">{order.route}</p>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    {status ? (
                                        <div className={`flex items-center gap-2 text-sm font-bold px-2 py-1 rounded-full ${status.status === 'Given' ? 'bg-green-100 text-green-700' :
                                                status.status === 'Refused' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {status.status === 'Given' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            <span>{status.status === 'Given' ? 'Administrado' : status.status} ({status.time})</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-200/50 px-2 py-1 rounded-full">
                                            <Clock className="w-4 h-4" />
                                            <span>Pendiente</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {orders.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 py-8 italic">
                            No hay medicamentos programados para este día.
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
