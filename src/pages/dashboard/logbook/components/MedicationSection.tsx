import React, { useEffect, useState } from 'react';
import { medicalService, DailyMedication } from '../../../../services/medicalService';
import { Card } from '../../../../components/ui/Card';
import { Pill, Clock, Check } from 'lucide-react';

interface Props {
    residentId: string;
    date: string;
    readOnly?: boolean;
}

export const MedicationSection: React.FC<Props> = ({ residentId, date, readOnly = false }) => {
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
        <Card padding={readOnly ? 'none' : 'md'} className={`${readOnly ? 'p-2' : 'p-4'} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
            <h3 className={`${readOnly ? 'text-xs mb-1' : 'font-bold text-base mb-4'} font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
                <Pill className={`${readOnly ? 'w-3 h-3' : 'w-5 h-5'} text-blue-600`} />
                {readOnly ? 'MEDS ADMIN.' : 'Medicamentos Administrados'}
            </h3>

            {loading ? (
                <div className="text-center p-4 text-gray-500">Cargando medicamentos...</div>
            ) : medications.length === 0 ? (
                <div className="text-center p-8 text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    No hay medicamentos registrados en la hoja diaria para esta fecha.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className={`w-full min-w-[1000px] ${readOnly ? 'text-xs md:text-sm' : 'text-sm'} border-collapse`}>
                        <thead>
                            <tr className={`bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase ${readOnly ? 'text-[10px] md:text-xs' : 'text-[10px] md:text-sm'}`}>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-1/4' : 'px-1.5 md:px-4 py-3 w-1/4'} font-bold text-left`}>Med</th>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-20 md:w-32' : 'px-1.5 md:px-4 py-3 w-20 md:w-32'} font-bold text-center`}>Dos</th>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-24 md:w-40' : 'px-1.5 md:px-4 py-3 w-24 md:w-40'} font-bold text-center`}>Vía</th>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-20 md:w-28' : 'px-1.5 md:px-4 py-3 w-20 md:w-28'} font-bold text-center`}>1ª</th>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-20 md:w-28' : 'px-1.5 md:px-4 py-3 w-20 md:w-28'} font-bold text-center`}>2ª</th>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-20 md:w-28' : 'px-1.5 md:px-4 py-3 w-20 md:w-28'} font-bold text-center`}>3ª</th>
                                <th className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1 w-20 md:w-28' : 'px-1.5 md:px-4 py-3 w-20 md:w-28'} font-bold text-center`}>4ª</th>
                                <th className={`border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1' : 'px-1.5 md:px-4 py-3'} font-bold text-left`}>Obs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medications.map((med, index) => (
                                <tr key={med.id || index} className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1' : 'px-1.5 md:px-4 py-2'} text-gray-900 dark:text-gray-200 font-medium`}>
                                        {med.medicamento}
                                    </td>
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1' : 'px-1.5 md:px-4 py-2'} text-center text-gray-900 dark:text-gray-200`}>
                                        {med.dosis || '-'}
                                    </td>
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1' : 'px-1.5 md:px-4 py-2'} text-center text-gray-900 dark:text-gray-200`}>
                                        {med.via || '-'}
                                    </td>
                                    {/* 1st Dose */}
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-0.5 py-0.5' : 'px-1.5 md:px-4 py-2'} text-center`}>
                                        {med.dose1Time ? (
                                            <div className="flex flex-col items-center gap-0">
                                                <span className={`font-mono text-blue-700 dark:text-blue-300 ${readOnly ? 'text-[9px]' : 'bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] md:text-xs'}`}>
                                                    {!readOnly && <Clock className="w-2.5 h-2.5 md:w-3 h-3" />}
                                                    {med.dose1Time}
                                                </span>
                                                {med.dose1Status && (
                                                    <span className="text-green-600 flex items-center gap-1 text-[8px] md:text-[9px] uppercase font-bold text-center leading-tight">
                                                        <Check className={`${readOnly ? 'w-2 h-2' : 'w-2.5 h-2.5 md:w-3 h-3'}`} /> {readOnly ? 'OK' : 'VERIF'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    {/* 2nd Dose */}
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-0.5 py-0.5' : 'px-1.5 md:px-4 py-2'} text-center`}>
                                        {med.dose2Time ? (
                                            <div className="flex flex-col items-center gap-0">
                                                <span className={`font-mono text-blue-700 dark:text-blue-300 ${readOnly ? 'text-[9px]' : 'bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] md:text-xs'}`}>
                                                    {!readOnly && <Clock className="w-2.5 h-2.5 md:w-3 h-3" />}
                                                    {med.dose2Time}
                                                </span>
                                                {med.dose2Status && (
                                                    <span className="text-green-600 flex items-center gap-1 text-[8px] md:text-[9px] uppercase font-bold text-center leading-tight">
                                                        <Check className={`${readOnly ? 'w-2 h-2' : 'w-2.5 h-2.5 md:w-3 h-3'}`} /> {readOnly ? 'OK' : 'VERIF'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    {/* 3rd Dose */}
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-0.5 py-0.5' : 'px-1.5 md:px-4 py-2'} text-center`}>
                                        {med.dose3Time ? (
                                            <div className="flex flex-col items-center gap-0">
                                                <span className={`font-mono text-blue-700 dark:text-blue-300 ${readOnly ? 'text-[9px]' : 'bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] md:text-xs'}`}>
                                                    {!readOnly && <Clock className="w-2.5 h-2.5 md:w-3 h-3" />}
                                                    {med.dose3Time}
                                                </span>
                                                {med.dose3Status && (
                                                    <span className="text-green-600 flex items-center gap-1 text-[8px] md:text-[9px] uppercase font-bold text-center leading-tight">
                                                        <Check className={`${readOnly ? 'w-2 h-2' : 'w-2.5 h-2.5 md:w-3 h-3'}`} /> {readOnly ? 'OK' : 'VERIF'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    {/* 4th Dose */}
                                    <td className={`border-r border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-0.5 py-0.5' : 'px-1.5 md:px-4 py-2'} text-center`}>
                                        {med.dose4Time ? (
                                            <div className="flex flex-col items-center gap-0">
                                                <span className={`font-mono text-blue-700 dark:text-blue-300 ${readOnly ? 'text-[9px]' : 'bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 text-[10px] md:text-xs'}`}>
                                                    {!readOnly && <Clock className="w-2.5 h-2.5 md:w-3 h-3" />}
                                                    {med.dose4Time}
                                                </span>
                                                {med.dose4Status && (
                                                    <span className="text-green-600 flex items-center gap-1 text-[8px] md:text-[9px] uppercase font-bold text-center leading-tight">
                                                        <Check className={`${readOnly ? 'w-2 h-2' : 'w-2.5 h-2.5 md:w-3 h-3'}`} /> {readOnly ? 'OK' : 'VERIF'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={`border-b border-gray-300 dark:border-gray-700 ${readOnly ? 'px-1 py-1' : 'px-1.5 md:px-4 py-2'} text-gray-600 dark:text-gray-400 italic`}>
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
