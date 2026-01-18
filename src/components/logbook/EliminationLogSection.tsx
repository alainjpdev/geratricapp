import React, { useEffect, useState } from 'react';
import { Droplet, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { careService, EliminationLog } from '../../services/careService';

interface Props {
    residentId: string;
    date: string;
}

const EliminationLogSection: React.FC<Props> = ({ residentId, date }) => {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState<EliminationLog[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [type, setType] = useState<EliminationLog['type']>('Urination');
    const [characteristics, setCharacteristics] = useState('Normal');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (residentId && date) loadLogs();
    }, [residentId, date]);

    const loadLogs = async () => {
        try {
            const data = await careService.getEliminationLogs(residentId, new Date(date));
            setLogs(data);
        } catch (error) {
            console.error('Error loading elimination logs', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !residentId) return;

        try {
            setLoading(true);
            await careService.logElimination({
                residentId,
                loggedBy: user.id,
                type,
                characteristics,
                notes
            });
            // Reset some fields
            setCharacteristics('Normal');
            setNotes('');
            loadLogs();
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
                    <Droplet className="w-5 h-5 text-blue-600" />
                    Registrar Eliminación
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
                        <div className="flex gap-2">
                            {[
                                { val: 'Urination', label: 'Micción' },
                                { val: 'Bowel Movement', label: 'Evacuación' },
                                { val: 'Vomit', label: 'Vómito' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => setType(opt.val as any)}
                                    className={`flex-1 px-2 py-2 rounded-md text-xs font-bold border transition-colors ${type === opt.val
                                        ? 'bg-blue-100 border-blue-500 text-blue-800'
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Características</label>
                        <input
                            type="text"
                            className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800"
                            placeholder="Ej. Normal, Líquida, Escasa..."
                            value={characteristics}
                            onChange={e => setCharacteristics(e.target.value)}
                            required
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['Normal', 'Abundante', 'Escasa', 'Líquida', 'Con Sangre'].map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCharacteristics(c)}
                                    className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Observaciones</label>
                        <textarea
                            className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800"
                            rows={2}
                            placeholder="Opcional..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Características</th>
                                <th className="px-4 py-3">Registrado por</th>
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
                                            {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold 
                                            ${log.type === 'Vomit' ? 'bg-red-100 text-red-800' :
                                                    log.type === 'Bowel Movement' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {log.type === 'Urination' ? 'Micción' : log.type === 'Bowel Movement' ? 'Evacuación' : 'Vómito'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {log.characteristics}
                                            {log.notes && <span className="block text-xs text-gray-400 italic mt-0.5">{log.notes}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {log.logger?.firstName}
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

export default EliminationLogSection;
