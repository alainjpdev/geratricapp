import React, { useEffect, useState } from 'react';
import { medicalService, DailyMedication } from '../../../../services/medicalService';
import { Card } from '../../../../components/ui/Card';
import { Pill, Clock, Check } from 'lucide-react';

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
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">Vía</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">1ª Dosis</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">2ª Dosis</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">3ª Dosis</th>
                                <th className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-center w-24">4ª Dosis</th>
                                <th className="border-b border-gray-300 dark:border-gray-700 px-4 py-3 font-bold text-left">Observación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medications.map((med, index) => (
                                <tr key={med.id || index} className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-gray-200 font-medium">
                                        {med.medicamento}
                                    </td>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-gray-900 dark:text-gray-200">
                                        {med.dosis || '-'}
                                    </td>
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-gray-900 dark:text-gray-200">
                                        {med.via || '-'}
                                    </td>
                                    {/* 1st Dose */}
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {med.dose1Time ? (
                                                <span className="font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                                                    <Clock className="w-3 h-3" />
                                                    {med.dose1Time}
                                                </span>
                                            ) : '-'}
                                            {med.dose1Status && (
                                                <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-bold">
                                                    <Check className="w-3 h-3" /> Verificado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {/* 2nd Dose */}
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {med.dose2Time ? (
                                                <span className="font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                                                    <Clock className="w-3 h-3" />
                                                    {med.dose2Time}
                                                </span>
                                            ) : '-'}
                                            {med.dose2Status && (
                                                <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-bold">
                                                    <Check className="w-3 h-3" /> Verificado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {/* 3rd Dose */}
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {med.dose3Time ? (
                                                <span className="font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                                                    <Clock className="w-3 h-3" />
                                                    {med.dose3Time}
                                                </span>
                                            ) : '-'}
                                            {med.dose3Status && (
                                                <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-bold">
                                                    <Check className="w-3 h-3" /> Verificado
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {/* 4th Dose */}
                                    <td className="border-r border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {med.dose4Time ? (
                                                <span className="font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-xs">
                                                    <Clock className="w-3 h-3" />
                                                    {med.dose4Time}
                                                </span>
                                            ) : '-'}
                                            {med.dose4Status && (
                                                <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-bold">
                                                    <Check className="w-3 h-3" /> Verificado
                                                </span>
                                            )}
                                        </div>
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
