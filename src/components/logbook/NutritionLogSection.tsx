import React, { useEffect, useState } from 'react';
import { Utensils, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import { careService, NutritionLog } from '../../services/careService';

interface Props {
    residentId: string;
    date: string;
}

const NutritionLogSection: React.FC<Props> = ({ residentId, date }) => {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [mealType, setMealType] = useState<NutritionLog['mealType']>('Breakfast');
    const [percentage, setPercentage] = useState(100);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (residentId && date) loadLogs();
    }, [residentId, date]);

    const loadLogs = async () => {
        try {
            const data = await careService.getNutritionLogs(residentId, new Date(date));
            setLogs(data);
        } catch (error) {
            console.error('Error loading nutrition logs', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !residentId) return;

        try {
            setLoading(true);
            await careService.logNutrition({
                residentId,
                loggedBy: user.id,
                mealType,
                percentageConsumed: percentage,
                description,
                notes
            });
            // Reset some fields
            setPercentage(100);
            setDescription('');
            setNotes('');
            loadLogs();
        } catch (error) {
            alert('Error saving nutrition log');
        } finally {
            setLoading(false);
        }
    };

    const getMealLabel = (type: string) => {
        switch (type) {
            case 'Breakfast': return 'Desayuno';
            case 'Lunch': return 'Comida';
            case 'Dinner': return 'Cena';
            case 'Snack': return 'Colación';
            case 'Hydration': return 'Hidratación';
            default: return type;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <Card className="p-6 h-fit">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-green-600" />
                    Registrar Alimentación
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo de Comida</label>
                        <select
                            className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 bg-white dark:bg-gray-800"
                            value={mealType}
                            onChange={e => setMealType(e.target.value as any)}
                        >
                            <option value="Breakfast">Desayuno</option>
                            <option value="Lunch">Comida</option>
                            <option value="Dinner">Cena</option>
                            <option value="Snack">Colación</option>
                            <option value="Hydration">Hidratación (Agua/Té)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción / Menú</label>
                        <input
                            type="text"
                            className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800"
                            placeholder="Ej. Huevo con jamón, Papaya..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Porcentaje Consumido: {percentage}%</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={percentage}
                            onChange={e => setPercentage(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Observaciones</label>
                        <textarea
                            className="w-full rounded border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800"
                            rows={2}
                            placeholder="Ej. Tuvo dificultad para tragar..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Send className="w-4 h-4 mr-2" />
                        Registrar
                    </Button>
                </form>
            </Card>

            <div className="lg:col-span-2">
                <h3 className="font-bold text-gray-600 dark:text-gray-400 mb-2 text-sm uppercase tracking-wider">Historial del Día ({date})</h3>
                <div className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300">
                            No se han registrado alimentos hoy.
                        </div>
                    ) : (
                        logs.map(log => (
                            <Card key={log.id} className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                    ${log.mealType === 'Breakfast' ? 'bg-orange-100 text-orange-800' :
                                                log.mealType === 'Dinner' ? 'bg-indigo-100 text-indigo-800' :
                                                    log.mealType === 'Lunch' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {getMealLabel(log.mealType)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-md">{log.description}</h4>
                                    {log.notes && <p className="text-sm text-gray-500 mt-1 italic">"{log.notes}"</p>}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className={`block text-xl font-bold ${log.percentageConsumed < 50 ? 'text-red-500' :
                                            log.percentageConsumed < 80 ? 'text-yellow-600' : 'text-green-600'
                                            }`}>
                                            {log.percentageConsumed}%
                                        </span>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold">Consumido</span>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NutritionLogSection;
