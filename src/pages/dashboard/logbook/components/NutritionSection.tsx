import React, { useEffect, useState } from 'react';
import { logbookService } from '../../../../services/logbookService';
import { Card } from '../../../../components/ui/Card';
import { useAuthStore } from '../../../../store/authStore';

interface Props {
    residentId: string;
    date: string;
}

interface MealRow {
    id?: string;
    time: string;
    description: string;
    percentage: number;
    notes: string;
}

export const NutritionSection: React.FC<Props> = ({ residentId, date }) => {
    const { user } = useAuthStore();
    const [meals, setMeals] = useState<{ [key: string]: MealRow }>({
        Breakfast: { id: '', time: '', description: '', percentage: 100, notes: '' }, // Desayuno
        Lunch: { id: '', time: '', description: '', percentage: 100, notes: '' },     // Comida
        Dinner: { id: '', time: '', description: '', percentage: 100, notes: '' },    // Cena
        Snack: { id: '', time: '', description: '', percentage: 100, notes: '' },     // Colación
        Hydration: { id: '', time: '', description: '', percentage: 100, notes: '' }  // Hidratación
    });

    useEffect(() => {
        loadLogs();
    }, [residentId, date]);

    const loadLogs = async () => {
        try {
            const data = await logbookService.getNutritionLogs(residentId, date);
            const newMeals: { [key: string]: MealRow } = {
                Breakfast: { id: '', time: '', description: '', percentage: 100, notes: '' },
                Lunch: { id: '', time: '', description: '', percentage: 100, notes: '' },
                Dinner: { id: '', time: '', description: '', percentage: 100, notes: '' },
                Snack: { id: '', time: '', description: '', percentage: 100, notes: '' },
                Hydration: { id: '', time: '', description: '', percentage: 100, notes: '' }
            };

            data.forEach(log => {
                if (newMeals[log.meal_type as keyof typeof newMeals]) {
                    newMeals[log.meal_type as keyof typeof newMeals] = {
                        id: log.id,
                        time: new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                        description: log.description || '',
                        percentage: log.percentage_consumed,
                        notes: log.notes || ''
                    };
                }
            });
            setMeals(newMeals);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (type: string) => {
        const item = meals[type];
        if (!item.time) return;

        const timestamp = `${date}T${item.time}:00`;

        const payload = {
            resident_id: residentId,
            meal_type: type as any,
            date,
            logged_at: timestamp,
            percentage_consumed: item.percentage,
            description: item.description,
            notes: item.notes,
            logged_by: user?.id
        };

        try {
            if (item.id) {
                // assume update logic or skip
            } else {
                const newLog = await logbookService.addNutritionLog(payload);
                setMeals(prev => ({
                    ...prev,
                    [type]: { ...prev[type], id: newLog.id }
                }));
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
    };

    const handleChange = (type: string, field: keyof MealRow, value: any) => {
        setMeals(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: value }
        }));
    };

    const translateType = (type: string) => {
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
        <Card className="p-0 border border-gray-200 overflow-hidden shadow-sm bg-white dark:bg-gray-800">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 uppercase text-[10px] md:text-xs">
                            <th className="border-r border-b px-1.5 md:px-3 py-2 text-left w-24 md:w-32">Tiempo</th>
                            <th className="border-r border-b px-1.5 md:px-3 py-2 w-20 md:w-24">Hora</th>
                            <th className="border-r border-b px-1.5 md:px-3 py-2">Desc</th>
                            <th className="border-r border-b px-1.5 md:px-3 py-2 w-20 md:w-24">%</th>
                            <th className="border-b px-1.5 md:px-3 py-2">Obs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(meals).map((type) => (
                            <tr key={type} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-850">
                                <td className="px-3 py-2 font-bold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                                    {translateType(type)}
                                </td>
                                <td className="px-2 py-1 border-r dark:border-gray-700">
                                    <input
                                        type="time"
                                        className="w-full h-full bg-transparent border-gray-200 dark:border-gray-600 rounded text-center"
                                        value={meals[type].time}
                                        onChange={e => handleChange(type, 'time', e.target.value)}
                                        onBlur={() => handleSave(type)}
                                    />
                                </td>
                                <td className="px-2 py-1 border-r dark:border-gray-700">
                                    <input
                                        type="text"
                                        className="w-full h-full bg-transparent border-transparent focus:border-indigo-500 rounded px-1 md:px-2 text-xs md:text-sm"
                                        placeholder="Descripción..."
                                        value={meals[type].description}
                                        onChange={e => handleChange(type, 'description', e.target.value)}
                                        onBlur={() => handleSave(type)}
                                    />
                                </td>
                                <td className="px-1 md:px-2 py-1 border-r dark:border-gray-700">
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            className="w-12 md:w-16 bg-transparent border-gray-200 dark:border-gray-600 rounded text-center text-xs md:text-sm"
                                            value={meals[type].percentage}
                                            onChange={e => handleChange(type, 'percentage', +e.target.value)}
                                            onBlur={() => handleSave(type)}
                                        />
                                        <span className="text-gray-500 text-[10px] md:text-xs">%</span>
                                    </div>
                                </td>
                                <td className="px-1 md:px-2 py-1">
                                    <input
                                        type="text"
                                        className="w-full h-full bg-transparent border-transparent focus:border-indigo-500 rounded px-1 md:px-2 text-xs md:text-sm"
                                        placeholder="Notas..."
                                        value={meals[type].notes}
                                        onChange={e => handleChange(type, 'notes', e.target.value)}
                                        onBlur={() => handleSave(type)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
