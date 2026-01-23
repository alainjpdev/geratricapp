import React, { useEffect, useState } from 'react';
import { medicalService, DailyMedication } from '../../../../services/medicalService';
import { Card } from '../../../../components/ui/Card';
import { Pill, Clock } from 'lucide-react';

interface Props {
    residentId: string;
    date: string;
}

export const MedicationSection: React.FC<Props> = ({ residentId, date }) => {
    const [medications, setMedications] = useState<DailyMedication[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (residentId && date) {
            loadData();
        }
    }, [residentId, date]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await medicalService.getDailyMedications(residentId, date);
            setMedications(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                Medicamentos Administrados
            </h3>

            {loading ? (
                <div className="text-center p-4 text-gray-500">Cargando medicamentos...</div>
            ) : medications.length === 0 ? (
                <div className="text-center p-8 text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    No hay medicamentos registrados en la hoja diaria para esta fecha.
                </div>
            ) : (
                <div className="space-y-3">
                    {medications.map(med => (
                        <div key={med.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                                        {med.medicamento}
                                    </span>
                                    {med.hora && (
                                        <span className="text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {med.hora}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                                    {med.dosis && <span><strong>Dosis:</strong> {med.dosis}</span>}
                                    {med.via && <span><strong>Vía:</strong> {med.via}</span>}
                                </div>
                                {med.observacion && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700/50">
                                        Note: {med.observacion}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
