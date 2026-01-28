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
            setMedications([]); // Clear previous data
            let mounted = true;
            loadData(mounted);
            return () => { mounted = false; };
        }
    }, [residentId, date]);

    const loadData = async (mounted: boolean) => {
        try {
            setLoading(true);
            const data = await medicalService.getDailyMedications(residentId, date);
            if (mounted) setMedications(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            if (mounted) setLoading(false);
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
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-left">Medicamento</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">Dosis</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-32">Vía</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">Hora</th>
                                <th className="border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-left">Observación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medications.map((med, index) => (
                                <tr key={med.id} className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200 font-medium">
                                        {med.medicamento}
                                    </td>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-gray-900 dark:text-gray-200">
                                        {med.dosis || '-'}
                                    </td>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-gray-900 dark:text-gray-200">
                                        {med.via || '-'}
                                    </td>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                                        {med.hora && (
                                            <span className="font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                                                <Clock className="w-3 h-3" />
                                                {med.hora}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-600 dark:text-gray-400 italic">
                                        {med.observacion || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};
