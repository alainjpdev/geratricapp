import React, { useEffect, useState } from 'react';
// Force refresh
import { Activity, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { medicalService, VitalSign } from '../../services/medicalService';

interface Props {
    residentId: string;
    date?: string;
    readOnly?: boolean;
}


const VitalSignsTable: React.FC<Props> = ({ residentId, date, readOnly = false }) => {
    const { user } = useAuthStore();
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [vitalsHistory, setVitalsHistory] = useState<VitalSign[]>([]);
    const [historyLimit, setHistoryLimit] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // New entry state
    const [newVital, setNewVital] = useState<any>({
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 75,
        temperature: 36.5,
        oxygenSaturation: 98,
        glucose: 100
    });

    const loadVitals = async (mounted: boolean) => {
        try {
            const data = await medicalService.getVitalsByResident(residentId, date);

            if (!mounted) return;

            // Sort by time ascending (early to late)
            const sortedData = [...data].sort((a, b) => {
                if (a.time && b.time) return a.time.localeCompare(b.time);
                return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
            });
            setVitals(sortedData);
        } catch (error) {
            console.error('Error loading vitals', error);
        }
    };

    const loadHistory = async (mounted: boolean) => {
        try {
            const data = await medicalService.getVitalsHistory(residentId, historyLimit);
            if (!mounted) return;
            // Filter out current date to avoid duplication
            setVitalsHistory(data.filter(v => v.date !== date));
        } catch (error) {
            console.error('Error loading history', error);
        }
    };

    useEffect(() => {
        if (residentId) {
            // Reset state immediately
            setVitals([]);
            setVitalsHistory([]);
            setNewVital({
                bloodPressureSystolic: 120,
                bloodPressureDiastolic: 80,
                heartRate: 75,
                temperature: 36.5,
                oxygenSaturation: 98,
                glucose: 100
            });
            setShowForm(false);

            let mounted = true;
            loadVitals(mounted);
            loadHistory(mounted);
            return () => { mounted = false; };
        }
    }, [residentId, date, historyLimit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !residentId) return;

        try {
            setLoading(true);
            await medicalService.recordVitals({
                residentId,
                recordedBy: user.id,
                ta: `${newVital.bloodPressureSystolic}/${newVital.bloodPressureDiastolic}`,
                fc: newVital.heartRate,
                temp: newVital.temperature,
                sato2: newVital.oxygenSaturation,
                dxtx: newVital.glucose,
                notes: newVital.notes
            });
            loadVitals(true);
            setShowForm(false);
        } catch (error) {
            alert('Error al registrar signos vitales');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className={`flex justify-between items-center ${readOnly ? 'mb-1' : 'mb-4'}`}>
                <h3 className={`${readOnly ? 'text-xs' : 'font-bold text-gray-900'} dark:text-white flex items-center gap-2 font-bold`}>
                    <Activity className={`${readOnly ? 'w-3 h-3' : 'w-5 h-5'} text-amber-600`} />
                    {readOnly ? 'S. VITALES' : 'Registro de Signos Vitales'}
                </h3>
                {!readOnly && (
                    <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
                        {showForm ? 'Cancelar' : 'Nuevo Registro'}
                    </Button>
                )}
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
                <table className={`w-full text-left ${readOnly ? 'text-xs' : 'text-sm'} whitespace-nowrap`}>
                    <thead className={`bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 ${readOnly ? 'text-[10px] uppercase' : ''}`}>
                        <tr>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>Hora</th>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>T/A</th>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>FC</th>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>Temp</th>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>SatO2</th>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>DxTx</th>
                            <th className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-3'} font-semibold`}>Por</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {vitals.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'} text-gray-900 dark:text-white font-medium`}>
                                    {v.time || new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'}`}>
                                    {v.ta}
                                </td>
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'}`}>
                                    {v.fc}
                                </td>
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'}`}>
                                    {v.temp}°
                                </td>
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'}`}>
                                    {v.sato2}%
                                </td>
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'}`}>
                                    {v.dxtx || '-'}
                                </td>
                                <td className={`${readOnly ? 'px-1 md:px-2 py-1' : 'px-2 md:px-4 py-2'} text-gray-500 text-[10px]`}>
                                    {v.recorderName?.split(' ')[0] || 'Unk'}
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

            {/* History of Vital Signs */}
            {vitalsHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{historyLimit === 1 ? 'SIGNOS DÍA ANTERIOR' : `HISTORIAL SIGNOS ${historyLimit}D`}</span>
                        </div>
                        <div className="flex gap-1">
                            {[1, 3, 7, 30].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setHistoryLimit(days)}
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors border ${historyLimit === days
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:text-blue-600'
                                        }`}
                                >
                                    {days === 1 ? 'AYER' : `${days}D`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                        {vitalsHistory.map((v, i) => (
                            <div key={v.id} className="flex gap-3 items-center py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors px-1 rounded">
                                <div className="flex flex-col w-12 shrink-0">
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-500 leading-none">
                                        {new Date(v.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit' })}
                                    </span>
                                    <span className="text-[8px] font-medium text-gray-400 uppercase leading-none mt-0.5">
                                        {new Date(v.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                                    </span>
                                </div>
                                <div className="grid grid-cols-5 md:grid-cols-6 flex-1 gap-2 text-[11px]">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-bold">T/A</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{v.ta}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-bold">FC</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{v.fc}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-bold">Temp</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{v.temp}°</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-bold">SatO2</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{v.sato2}%</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-400 uppercase leading-tight font-bold">DxTx</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">{v.dxtx || '-'}</span>
                                    </div>
                                    <div className="hidden md:flex flex-col justify-center">
                                        <span className="text-[9px] text-gray-400 italic">
                                            {v.time || new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VitalSignsTable;
