import React, { useEffect, useState } from 'react';
import { Clipboard, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { careService, CareLog } from '../../services/careService';

interface Props {
    residentId: string;
    date: string;
}

const CareLogSection: React.FC<Props> = ({ residentId, date }) => {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState<CareLog[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [category, setCategory] = useState<CareLog['category']>('Diaper Change');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (residentId && date) loadLogs();
    }, [residentId, date]);

    const loadLogs = async () => {
        try {
            const data = await careService.getCareLogs(residentId, new Date(date));
            setLogs(data);
        } catch (error) {
            console.error('Error loading care logs', error);
        }
    };

    const calculateShift = () => {
        const hour = new Date().getHours();
        return hour < 14 ? 'Morning' : hour < 20 ? 'Afternoon' : 'Night';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !residentId) return;

        try {
            setLoading(true);
            await careService.logCare({
                residentId,
                performedBy: user.id,
                category,
                notes,
                shift: calculateShift()
            });
            setNotes('');
            loadLogs();
            // Optional: Show brief success feedback
        } catch (error) {
            alert('Error saving log');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <Card className="p-6 h-fit">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-teal-600" />
                    Registrar Cuidado / Higiene
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Actividad</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { val: 'Diaper Change', label: 'Cambio Pañal' },
                                { val: 'Sheet Change', label: 'Cambio Sábanas' },
                                { val: 'Bath', label: 'Baño' },
                                { val: 'Position Change', label: 'Cambio Posición' },
                                { val: 'Other', label: 'Otro' },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => setCategory(opt.val as any)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium border text-left transition-colors ${category === opt.val
                                        ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notas (Opcional)</label>
                        <textarea
                            className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-gray-800"
                            rows={3}
                            placeholder="Observaciones..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                        <Send className="w-4 h-4 mr-2" />
                        Registrar
                    </Button>
                </form>
            </Card>

            <div className="lg:col-span-2">
                <h3 className="font-bold text-gray-600 dark:text-gray-400 mb-2 text-sm uppercase tracking-wider">Historial del Día ({date})</h3>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase font-semibold text-xs border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Hora</th>
                                <th className="px-4 py-3">Actividad</th>
                                <th className="px-4 py-3">Notas</th>
                                <th className="px-4 py-3">Realizado por</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                                        No hay registros para este día.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {new Date(log.performedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                            ${log.category === 'Bath' ? 'bg-blue-100 text-blue-800' :
                                                    log.category === 'Diaper Change' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {log.category === 'Diaper Change' ? 'Cambio Pañal' :
                                                    log.category === 'Sheet Change' ? 'Cambio Sábanas' :
                                                        log.category === 'Bath' ? 'Baño' :
                                                            log.category === 'Position Change' ? 'Cambio Posición' : log.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={log.notes}>
                                            {log.notes || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {log.performer?.firstName}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CareLogSection;
