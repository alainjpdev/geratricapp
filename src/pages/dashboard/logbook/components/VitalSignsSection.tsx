import React, { useEffect, useState } from 'react';
import { medicalService, VitalSign } from '../../../../services/medicalService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../../../store/authStore';

interface Props {
    residentId: string;
    date: string;
}

export const VitalSignsSection: React.FC<Props> = ({ residentId, date }) => {
    const { user } = useAuthStore();
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newVital, setNewVital] = useState<Partial<VitalSign>>({});

    useEffect(() => {
        loadVitals();
    }, [residentId, date]);

    const loadVitals = async () => {
        try {
            setLoading(true);
            // Ideally we filter by date in the backend service, but getVitalsByResident returns all history.
            // For now we filter client side or add a method to service.
            // Let's filter client side for MVP as the history shouldn't be massive yet.
            const allVitals = await medicalService.getVitalsByResident(residentId);
            const daysVitals = allVitals.filter(v =>
                new Date(v.recordedAt).toISOString().split('T')[0] === date
            );
            setVitals(daysVitals);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await medicalService.recordVitals({
                residentId,
                recordedBy: user?.id || '',
                // Combine date from picker with current time? Or just use now if it is today?
                // If editing historical, we should probably allow setting time.
                // For simplicity, let's assume we are logging "now" or "at specific time on that date"
                // But the service expects "recordedAt" which is timestamp.
                // Let's construct it:
                // If date is today, use now. If not, use noon? Or add a time picker.
                // Let's Add a time picker to the form.
                ...newVital as any
            });
            setIsAdding(false);
            setNewVital({});
            loadVitals();
        } catch (error) {
            alert('Error al guardar');
        }
    };

    return (
        <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {/* List of Vitals for the Day */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-3 py-2">Hora</th>
                            <th className="px-3 py-2">T/A</th>
                            <th className="px-3 py-2">FC</th>
                            <th className="px-3 py-2">FR</th>
                            <th className="px-3 py-2">Temp</th>
                            <th className="px-3 py-2">SatO2</th>
                            <th className="px-3 py-2">DxTx</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {vitals.map(v => (
                            <tr key={v.id}>
                                <td className="px-3 py-2 font-medium">{new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="px-3 py-2">{v.ta}</td>
                                <td className="px-3 py-2">{v.fc}</td>
                                <td className="px-3 py-2">{v.fr || '-'}</td>
                                <td className="px-3 py-2">{v.temp}°</td>
                                <td className="px-3 py-2">{v.sato2}%</td>
                                <td className="px-3 py-2">{v.dxtx || '-'}</td>
                            </tr>
                        ))}
                        {vitals.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-3 py-4 text-center text-gray-400 italic">
                                    Sin registros para este día
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Button */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-300"
                >
                    <Plus className="w-4 h-4" /> Agregar Registro
                </button>
            ) : (
                <form onSubmit={handleSave} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in">
                    <div>
                        <label className="text-xs font-bold text-gray-500">T/A (120/80)</label>
                        <input type="text" className="w-full p-2 border rounded" required placeholder="120/80"
                            onChange={e => setNewVital({ ...newVital, ta: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Frecuencia C.</label>
                        <input type="text" className="w-full p-2 border rounded" required
                            onChange={e => setNewVital({ ...newVital, fc: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Frecuencia R.</label>
                        <input type="text" className="w-full p-2 border rounded"
                            onChange={e => setNewVital({ ...newVital, fr: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Temperatura</label>
                        <input type="text" step="0.1" className="w-full p-2 border rounded" required
                            onChange={e => setNewVital({ ...newVital, temp: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Sat O2</label>
                        <input type="text" className="w-full p-2 border rounded" required
                            onChange={e => setNewVital({ ...newVital, sato2: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Glucosa</label>
                        <input type="text" className="w-full p-2 border rounded"
                            onChange={e => setNewVital({ ...newVital, dxtx: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                        <Button type="submit" className="flex-1">Guardar</Button>
                    </div>
                </form>
            )}
        </Card>
    );
};

