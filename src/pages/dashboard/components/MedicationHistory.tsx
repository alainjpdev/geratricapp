
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../config/supabaseClient';
import { Card } from '../../../components/ui/Card';
import { Check, X, Clock, Pill } from 'lucide-react';

interface MedicationHistoryProps {
    patientId: string;
    currentDate: string;
}

interface HistoryRecord {
    id: string;
    date: string;
    medicamento: string;
    dosis: string;
    via: string;
    dose1_time: string | null;
    dose1_status: boolean;
    dose2_time: string | null;
    dose2_status: boolean;
    dose3_time: string | null;
    dose3_status: boolean;
    dose4_time: string | null;
    dose4_status: boolean;
    observacion: string;
}

export const MedicationHistory: React.FC<MedicationHistoryProps> = ({ patientId, currentDate }) => {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (patientId && currentDate) {
            fetchHistory();
        }
    }, [patientId, currentDate]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const endDate = new Date(currentDate);
            endDate.setDate(endDate.getDate() - 1); // Exclude current date
            const startDate = new Date(currentDate);
            startDate.setDate(startDate.getDate() - 7); // Go back 7 days

            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('resident_id', patientId)
                .lte('date', endDate.toISOString().split('T')[0])
                .gte('date', startDate.toISOString().split('T')[0])
                .order('date', { ascending: false })
                .order('hora', { ascending: true }); // Assuming 'hora' might be used for ordering within date if available, or created_at

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching medication history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Cargando historial...</div>;
    if (history.length === 0) return null;

    // Group by date
    const groupedHistory = history.reduce((acc, record) => {
        if (!acc[record.date]) acc[record.date] = [];
        acc[record.date].push(record);
        return acc;
    }, {} as Record<string, HistoryRecord[]>);

    return (
        <div className="space-y-4">
            <h3 className="text-sm md:text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-0.5 md:pb-1 inline-block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial (Últimos 7 días)
            </h3>

            <div className="grid gap-4">
                {Object.entries(groupedHistory).map(([date, records]) => (
                    <Card key={date} padding="none" className="border border-gray-200 overflow-hidden shadow-sm bg-gray-50/50">
                        <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 font-bold text-xs text-gray-600 uppercase">
                            {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-500 bg-white">
                                        <th className="px-2 py-1 text-left w-1/4">Medicamento</th>
                                        <th className="px-2 py-1 text-center">Dosis</th>
                                        <th className="px-2 py-1 text-center">1ª</th>
                                        <th className="px-2 py-1 text-center">2ª</th>
                                        <th className="px-2 py-1 text-center">3ª</th>
                                        <th className="px-2 py-1 text-center">4ª</th>
                                        <th className="px-2 py-1 text-left">Obs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((row, idx) => (
                                        <tr key={row.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="px-2 py-1 font-medium text-gray-700">{row.medicamento}</td>
                                            <td className="px-2 py-1 text-center text-gray-500">{row.dosis}</td>

                                            {/* Status Columns */}
                                            {[1, 2, 3, 4].map(num => {
                                                const timeKey = `dose${num}_time` as keyof HistoryRecord;
                                                const statusKey = `dose${num}_status` as keyof HistoryRecord;
                                                const time = row[timeKey];
                                                const status = row[statusKey];

                                                if (!time) return <td key={num} className="bg-gray-50/50"></td>;

                                                return (
                                                    <td key={num} className="px-2 py-1 text-center border-l border-gray-100">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className="text-[10px] text-gray-400 font-mono">
                                                                {String(time).substring(0, 5)}
                                                            </span>
                                                            {status ? (
                                                                <Check className="w-3 h-3 text-green-500" />
                                                            ) : (
                                                                <X className="w-3 h-3 text-red-300" />
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="px-2 py-1 text-gray-500 italic truncate max-w-[150px]" title={row.observacion}>
                                                {row.observacion}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
