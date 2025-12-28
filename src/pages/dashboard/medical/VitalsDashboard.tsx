import React, { useEffect, useState } from 'react';
import { Activity, Heart, Thermometer, Droplets, Scale, Save, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { medicalService, VitalSign } from '../../../services/medicalService';
import { residentService, Resident } from '../../../services/residentService';
import { useAuthStore } from '../../../store/authStore';

const VitalsDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [residents, setResidents] = useState<Resident[]>([]);
    const [selectedResidentId, setSelectedResidentId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        bpSystolic: '',
        bpDiastolic: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        glucose: '',
        weight: '',
        notes: ''
    });

    useEffect(() => {
        loadResidents();
    }, []);

    const loadResidents = async () => {
        try {
            const data = await residentService.getAllResidents();
            setResidents(data);
            if (data.length > 0) setSelectedResidentId(data[0].id);
        } catch (error) {
            console.error('Failed to load residents', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !selectedResidentId) return;

        try {
            setLoading(true);
            await medicalService.recordVitals({
                residentId: selectedResidentId,
                recordedBy: user.id,
                bloodPressureSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic) : undefined,
                bloodPressureDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic) : undefined,
                heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
                temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
                oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
                glucose: formData.glucose ? parseInt(formData.glucose) : undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                notes: formData.notes
            });

            setSuccessMsg('Signos vitales registrados correctamente');
            setFormData({
                bpSystolic: '',
                bpDiastolic: '',
                heartRate: '',
                temperature: '',
                oxygenSaturation: '',
                glucose: '',
                weight: '',
                notes: ''
            });
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-6 h-6 text-pink-600" />
                    Registro de Signos Vitales
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Captura rápida de parámetros clínicos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Entry Form */}
                <Card className="p-6 lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Residente</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {residents.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setSelectedResidentId(r.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${selectedResidentId === r.id
                                                ? 'bg-sky-100 border-sky-300 text-sky-800'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <User className="w-4 h-4" />
                                        {r.firstName} {r.lastName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Heart className="w-4 h-4 text-red-500" /> Tensión Arterial (mmHg)
                                </label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Sistólica (e.g 120)"
                                        type="number"
                                        value={formData.bpSystolic}
                                        onChange={e => setFormData({ ...formData, bpSystolic: e.target.value })}
                                    />
                                    <span className="text-gray-400">/</span>
                                    <Input
                                        placeholder="Diastólica (e.g 80)"
                                        type="number"
                                        value={formData.bpDiastolic}
                                        onChange={e => setFormData({ ...formData, bpDiastolic: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Activity className="w-4 h-4 text-green-500" /> Frecuencia Cardíaca (BPM)
                                </label>
                                <Input
                                    placeholder="e.g 75"
                                    type="number"
                                    value={formData.heartRate}
                                    onChange={e => setFormData({ ...formData, heartRate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Thermometer className="w-4 h-4 text-orange-500" /> Temperatura (°C)
                                </label>
                                <Input
                                    placeholder="e.g 36.5"
                                    type="number"
                                    step="0.1"
                                    value={formData.temperature}
                                    onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Droplets className="w-4 h-4 text-blue-500" /> Saturación O2 (%)
                                </label>
                                <Input
                                    placeholder="e.g 98"
                                    type="number"
                                    value={formData.oxygenSaturation}
                                    onChange={e => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Glusoca (mg/dL)
                                </label>
                                <Input
                                    placeholder="e.g 100"
                                    type="number"
                                    value={formData.glucose}
                                    onChange={e => setFormData({ ...formData, glucose: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Scale className="w-4 h-4 text-gray-500" /> Peso (kg)
                                </label>
                                <Input
                                    placeholder="e.g 70.5"
                                    type="number"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas Adicionales</label>
                            <textarea
                                className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800"
                                rows={3}
                                placeholder="Observaciones..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            {successMsg && <span className="text-green-600 font-medium animate-pulse">{successMsg}</span>}
                            <Button type="submit" disabled={loading} className="w-full md:w-auto bg-sky-600 hover:bg-sky-700">
                                {loading ? 'Guardando...' : 'Guardar Registro'}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Guidelines / Recent (Placeholder) */}
                <div className="space-y-6">
                    <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Rangos Normales</h3>
                        <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
                            <li className="flex justify-between">
                                <span>Presión Arterial</span>
                                <span className="font-medium">90/60 - 120/80</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Frecuencia Cardíaca</span>
                                <span className="font-medium">60 - 100 BPM</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Temperatura</span>
                                <span className="font-medium">36.1 - 37.2 °C</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Saturación O2</span>
                                <span className="font-medium">95 - 100%</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VitalsDashboard;
