import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, Moon } from 'lucide-react';
import { Toast } from '../ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { logbookService, SleepLog } from '../../services/logbookService';
import { TimeSelect } from '../ui/TimeSelect';

interface SleepDiaryProps {
    patientId: string;
    date: string;
    readOnly?: boolean;
}

export const SleepDiary: React.FC<SleepDiaryProps> = ({ patientId, date, readOnly = false }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<SleepLog[]>([]);

    // New entry state
    const [newItem, setNewItem] = useState<{
        start_time: string;
        end_time: string;
        quality: 'Good' | 'Fair' | 'Poor' | 'Interrupted';
        observations: string;
    }>({
        start_time: '',
        end_time: '',
        quality: 'Good',
        observations: ''
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    useEffect(() => {
        if (!patientId || !date) return;

        // Immediate reset to prevent stale data
        setLogs([]);

        let mounted = true;

        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await logbookService.getSleepLogs(patientId, date);
                if (mounted) {
                    setLogs(data);
                }
            } catch (error) {
                console.error('Error fetching sleep logs:', error);
                if (mounted) {
                    showToast('Error al cargar diario de sueño', 'error');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchLogs();

        return () => {
            mounted = false;
        };
    }, [patientId, date]);

    const handleAddItem = async () => {
        if (!newItem.start_time) {
            showToast('Por favor ingrese la hora de inicio', 'error');
            return;
        }

        try {
            const logToAdd = {
                resident_id: patientId,
                date,
                start_time: newItem.start_time,
                end_time: newItem.end_time || undefined,
                quality: newItem.quality,
                observations: newItem.observations,
                created_by: user?.id
            };

            const savedLog = await logbookService.addSleepLog(logToAdd);
            setLogs(prev => [savedLog, ...prev]);

            // Reset form
            setNewItem({
                start_time: '',
                end_time: '',
                quality: 'Good',
                observations: ''
            });


            showToast('Registro de sueño guardado');
        } catch (error) {
            console.error('Error adding sleep log:', error);
            showToast('Error al guardar registro', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar este registro?')) return;

        try {
            await logbookService.deleteSleepLog(id);
            setLogs(prev => prev.filter(l => l.id !== id));
            showToast('Registro eliminado');
        } catch (error) {
            console.error('Error deleting sleep log:', error);
            showToast('Error al eliminar registro', 'error');
        }
    };

    return (
        <div className={readOnly ? "space-y-2" : "space-y-6"}>
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(prev => ({ ...prev, visible: false }))}
                />
            )}

            {/* Input Form - Only show if NOT readOnly */}
            {!readOnly && (
                <Card className="p-4 bg-white shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-primary-700">
                        <Moon className="w-5 h-5" />
                        <h3 className="font-semibold">Nuevo Registro de Sueño</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Inicio</label>
                            <TimeSelect
                                value={newItem.start_time}
                                onChange={(e) => setNewItem({ ...newItem, start_time: e.target.value })}
                                className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all text-sm h-[38px]"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fin</label>
                            <TimeSelect
                                value={newItem.end_time}
                                onChange={(e) => setNewItem({ ...newItem, end_time: e.target.value })}
                                className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all text-sm h-[38px]"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Calidad</label>
                            <select
                                value={newItem.quality}
                                onChange={(e) => setNewItem({ ...newItem, quality: e.target.value as any })}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white"
                            >
                                <option value="Good">Buena</option>
                                <option value="Fair">Regular</option>
                                <option value="Poor">Mala</option>
                                <option value="Interrupted">Interrumpida</option>
                            </select>
                        </div>

                        <div className="md:col-span-5">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
                            <input
                                type="text"
                                value={newItem.observations}
                                onChange={(e) => setNewItem({ ...newItem, observations: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                                placeholder="Comentarios sobre el sueño..."
                            />
                        </div>

                        <div className="md:col-span-1">
                            <Button
                                onClick={handleAddItem}
                                className="w-full h-[38px] flex items-center justify-center p-0 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* List Table */}
            <Card className={`p-0 border border-gray-300 overflow-hidden shadow-sm ${readOnly ? 'bg-white' : ''}`}>
                <div className="overflow-x-auto">
                    <table className={`w-full min-w-[600px] ${readOnly ? 'text-xs' : 'text-sm'} border-collapse`}>
                        <thead>
                            <tr className={`bg-gray-100 text-gray-700 uppercase ${readOnly ? 'text-[10px]' : ''}`}>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-3'} font-bold text-center w-20 md:w-32`}>Inicio</th>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-3'} font-bold text-center w-20 md:w-32`}>Fin</th>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-3'} font-bold text-center w-24 md:w-32`}>Calidad</th>
                                <th className={`border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-3'} font-bold text-left`}>Observaciones</th>
                                {!readOnly && <th className="border-b border-gray-300 px-2 py-3 w-10"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={readOnly ? 4 : 5} className="text-center py-8 text-gray-500">
                                        Cargando...
                                    </td>
                                </tr>
                            )}
                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan={readOnly ? 4 : 5} className="text-center py-8 text-gray-400 bg-gray-50/50">
                                        No hay registros de sueño para este día
                                    </td>
                                </tr>
                            )}
                            {logs.map((log, index) => (
                                <tr key={log.id} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-2'} text-center text-gray-900 font-medium`}>
                                        {log.start_time.slice(0, 5)}
                                    </td>
                                    <td className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-2'} text-center text-gray-900 font-medium`}>
                                        {log.end_time ? log.end_time.slice(0, 5) : '-'}
                                    </td>
                                    <td className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-2'} text-center`}>
                                        <span className={`px-2 py-0.5 rounded-full ${readOnly ? 'text-[10px]' : 'text-xs'} font-semibold
                                            ${log.quality === 'Good' ? 'bg-green-100 text-green-700' :
                                                log.quality === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                                                    log.quality === 'Poor' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700'
                                            }`}>
                                            {log.quality === 'Good' ? 'Buena' :
                                                log.quality === 'Fair' ? 'Regular' :
                                                    log.quality === 'Poor' ? 'Mala' : 'Interrumpida'}
                                        </span>
                                    </td>
                                    <td className={`border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-4 py-2'} text-gray-600`}>
                                        {log.observations || '-'}
                                    </td>
                                    {!readOnly && (
                                        <td className="border-b border-gray-300 px-2 py-2 text-center">
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                title="Eliminar registro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
