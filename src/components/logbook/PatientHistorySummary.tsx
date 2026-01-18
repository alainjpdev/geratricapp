import React, { useEffect, useState } from 'react';
import { Activity, Utensils, Droplet, Clipboard, FileText, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { careService } from '../../services/careService';
import { medicalService } from '../../services/medicalService';

interface Props {
    residentId: string;
    date: string;
}

interface TimelineItem {
    id: string;
    type: 'care' | 'nutrition' | 'elimination' | 'vital' | 'note';
    timestamp: string; // ISO
    title: string;
    subtitle?: string;
    detail?: string;
    author: string;
    icon: any;
    colorClass: string;
}

const PatientHistorySummary: React.FC<Props> = ({ residentId, date }) => {
    const [items, setItems] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (residentId && date) loadAllData();
    }, [residentId, date]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const dateObj = new Date(date);

            // 1. Fetch all concurrently
            const [care, nutrition, elimination, vitals, notes] = await Promise.all([
                careService.getCareLogs(residentId, dateObj),
                careService.getNutritionLogs(residentId, dateObj),
                careService.getEliminationLogs(residentId, dateObj),
                medicalService.getVitalsByResident(residentId), // Returns all history, need to filter
                medicalService.getNotesByResident(residentId)   // Returns all history, need to filter
            ]);

            const timeline: TimelineItem[] = [];

            // Helper to check if same day (local date string match)
            const isSameDate = (isoDate: string) => {
                return isoDate.split('T')[0] === date;
            };

            // Care
            care.forEach((log: any) => timeline.push({
                id: log.id,
                type: 'care',
                timestamp: log.performedAt,
                title: log.category,
                subtitle: log.notes,
                author: `${log.performer?.firstName || ''}`,
                icon: Clipboard,
                colorClass: 'text-purple-600 bg-purple-100 border-purple-200'
            }));

            // Nutrition
            nutrition.forEach((log: any) => timeline.push({
                id: log.id,
                type: 'nutrition',
                timestamp: log.loggedAt,
                title: log.mealType,
                subtitle: `${log.description} (${log.percentageConsumed}%)`,
                author: `${log.logger?.firstName || ''}`,
                icon: Utensils,
                colorClass: 'text-green-600 bg-green-100 border-green-200'
            }));

            // Elimination
            elimination.forEach((log: any) => timeline.push({
                id: log.id,
                type: 'elimination',
                timestamp: log.loggedAt,
                title: log.type,
                subtitle: log.characteristics,
                author: `${log.logger?.firstName || ''}`,
                icon: Droplet,
                colorClass: 'text-blue-600 bg-blue-100 border-blue-200'
            }));

            // Vitals (Filter by date)
            vitals.filter((v: any) => isSameDate(v.recordedAt)).forEach((v: any) => timeline.push({
                id: v.id,
                type: 'vital',
                timestamp: v.recordedAt,
                title: 'Signos Vitales',
                subtitle: `TA: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} | Temp: ${v.temperature}°`,
                author: v.recorderName || '',
                icon: Activity,
                colorClass: 'text-amber-600 bg-amber-100 border-amber-200'
            }));

            // Notes (Filter by date)
            notes.filter((n: any) => isSameDate(n.createdAt)).forEach((n: any) => timeline.push({
                id: n.id,
                type: 'note',
                timestamp: n.createdAt,
                title: `Nota: ${n.category}`,
                subtitle: n.content,
                author: `${n.author?.firstName || ''}`,
                icon: FileText,
                colorClass: 'text-gray-600 bg-gray-100 border-gray-200'
            }));

            // Sort by timestamp desc
            timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setItems(timeline);
        } catch (error) {
            console.error('Error loading summary', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Cargando actividad...</div>;

    return (
        <Card className="p-6 h-full overflow-y-auto">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Línea de Tiempo Diaria
            </h3>

            {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic border border-dashed rounded-lg">
                    No hay actividad registrada para esta fecha.
                </div>
            ) : (
                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-8 pb-8">
                    {items.map(item => (
                        <div key={item.id} className="ml-6 relative">
                            {/* Dot */}
                            <div className={`absolute -left-[31px] bg-white dark:bg-gray-800 p-1 rounded-full border-2 ${item.colorClass.split(' ')[2]}`}>
                                <item.icon className={`w-4 h-4 ${item.colorClass.split(' ')[0]}`} />
                            </div>

                            {/* Content */}
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.colorClass}`}>
                                        {item.type === 'vital' ? 'Signos' :
                                            item.type === 'care' ? 'Cuidado' :
                                                item.type === 'nutrition' ? 'Alimentos' :
                                                    item.type === 'elimination' ? 'Eliminación' : 'Nota'}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.subtitle}</p>

                                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                    <span>Por: {item.author}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default PatientHistorySummary;
