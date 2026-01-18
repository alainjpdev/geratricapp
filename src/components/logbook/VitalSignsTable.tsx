import React, { useEffect, useState } from 'react';
// Force refresh
import { Activity, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { medicalService, VitalSign } from '../../services/medicalService';

interface Props {
    residentId: string;
}

const VitalSignsTable: React.FC<Props> = ({ residentId }) => {
    const { user } = useAuthStore();
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // New entry state
    const [newVital, setNewVital] = useState<Partial<VitalSign>>({
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 75,
        temperature: 36.5,
        oxygenSaturation: 98,
        glucose: 100
    });

    useEffect(() => {
        if (residentId) loadVitals();
    }, [residentId]);

    const loadVitals = async () => {
        try {
            const data = await medicalService.getVitalsByResident(residentId);
            setVitals(data);
        } catch (error) {
            console.error('Error loading vitals', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !residentId) return;

        try {
            setLoading(true);
            await medicalService.recordVitals({
                residentId,
                recordedBy: user.id,
                bloodPressureSystolic: newVital.bloodPressureSystolic,
                bloodPressureDiastolic: newVital.bloodPressureDiastolic,
                heartRate: newVital.heartRate,
                temperature: newVital.temperature,
                oxygenSaturation: newVital.oxygenSaturation,
                glucose: newVital.glucose,
                notes: newVital.notes
            });
            loadVitals();
            setShowForm(false);
        } catch (error) {
            alert('Error al registrar signos vitales');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-600" />
                    Registro de Signos Vitales
                </h3>
                <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
                    {showForm ? 'Cancelar' : 'Nuevo Registro'}
                </Button>
            </div>

            {showForm && (
                <Card className="p-4 mb-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">T/A Sistólica</label>
                            <input type="number" className="w-full p-2 rounded border" value={newVital.bloodPressureSystolic} onChange={e => setNewVital({ ...newVital, bloodPressureSystolic: +e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">T/A Diastólica</label>
                            <input type="number" className="w-full p-2 rounded border" value={newVital.bloodPressureDiastolic} onChange={e => setNewVital({ ...newVital, bloodPressureDiastolic: +e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Frecuencia C.</label>
                            <input type="number" className="w-full p-2 rounded border" value={newVital.heartRate} onChange={e => setNewVital({ ...newVital, heartRate: +e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Temperatura</label>
                            <input type="number" step="0.1" className="w-full p-2 rounded border" value={newVital.temperature} onChange={e => setNewVital({ ...newVital, temperature: +e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Sat O2</label>
                            <input type="number" className="w-full p-2 rounded border" value={newVital.oxygenSaturation} onChange={e => setNewVital({ ...newVital, oxygenSaturation: +e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Glucemia</label>
                            <input type="number" className="w-full p-2 rounded border" value={newVital.glucose} onChange={e => setNewVital({ ...newVital, glucose: +e.target.value })} />
                        </div>
                        <div className="col-span-2 flex items-end">
                            <Button type="submit" disabled={loading} className="w-full">Guardar Registro</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Fecha / Hora</th>
                            <th className="px-4 py-3 font-semibold">T/A</th>
                            <th className="px-4 py-3 font-semibold">FC</th>
                            <th className="px-4 py-3 font-semibold">Temp</th>
                            <th className="px-4 py-3 font-semibold">SatO2</th>
                            <th className="px-4 py-3 font-semibold">DxTx</th>
                            <th className="px-4 py-3 font-semibold">Registrado por</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {vitals.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                                    {new Date(v.recordedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-2">
                                    {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}
                                </td>
                                <td className="px-4 py-2">
                                    {v.heartRate} bpm
                                </td>
                                <td className="px-4 py-2">
                                    {v.temperature}°C
                                </td>
                                <td className="px-4 py-2">
                                    {v.oxygenSaturation}%
                                </td>
                                <td className="px-4 py-2">
                                    {v.glucose || '-'}
                                </td>
                                <td className="px-4 py-2 text-gray-500 text-xs">
                                    {v.recorderName || 'Unknown'}
                                </td>
                            </tr>
                        ))}
                        {vitals.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-gray-400">
                                    No hay signos vitales registrados para este residente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VitalSignsTable;
