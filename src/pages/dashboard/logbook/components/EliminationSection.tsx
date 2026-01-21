import React, { useEffect, useState } from 'react';
import { logbookService } from '../../../../services/logbookService';
import { Card } from '../../../../components/ui/Card';
import { useAuthStore } from '../../../../store/authStore';

interface Props {
    residentId: string;
    date: string;
}

interface OutputRow {
    time: string;
    urination: boolean; urinationObs: string; urinationId?: string;
    bm: boolean; bmObs: string; bmId?: string;
    vomit: boolean; vomitObs: string; vomitId?: string;
}

export const EliminationSection: React.FC<Props> = ({ residentId, date }) => {
    const { user } = useAuthStore();
    const [rows, setRows] = useState<OutputRow[]>(Array(5).fill(null).map(() => ({
        time: '',
        urination: false, urinationObs: '',
        bm: false, bmObs: '',
        vomit: false, vomitObs: ''
    })));

    useEffect(() => {
        loadLogs();
    }, [residentId, date]);

    const loadLogs = async () => {
        try {
            const data = await logbookService.getEliminationLogs(residentId, date);

            // Group by time roughly? Or just list sequentially?
            // NursingClinicalSheet groups by time. Let's try to group by time (HH:MM).
            const groups: { [key: string]: OutputRow } = {};

            data.forEach(log => {
                const time = new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                if (!groups[time]) {
                    groups[time] = { time, urination: false, urinationObs: '', bm: false, bmObs: '', vomit: false, vomitObs: '' };
                }

                if (log.type === 'Urination') {
                    groups[time].urination = true;
                    groups[time].urinationObs = log.characteristics || '';
                    groups[time].urinationId = log.id;
                } else if (log.type === 'Bowel Movement') {
                    groups[time].bm = true;
                    groups[time].bmObs = log.characteristics || '';
                    groups[time].bmId = log.id;
                } else if (log.type === 'Vomit') {
                    groups[time].vomit = true;
                    groups[time].vomitObs = log.characteristics || '';
                    groups[time].vomitId = log.id;
                }
            });

            const loadedRows = Object.values(groups);
            // Pad to 5 rows
            while (loadedRows.length < 5) {
                loadedRows.push({ time: '', urination: false, urinationObs: '', bm: false, bmObs: '', vomit: false, vomitObs: '' });
            }
            setRows(loadedRows);

        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (index: number, type: 'urination' | 'bm' | 'vomit') => {
        const row = rows[index];
        if (!row.time) return;

        // Only save if checked or has obs
        // Actually if checked is false, maybe delete if it existed? Complex.
        // Let's assume we save if it's checked.

        const isChecked = row[type];
        const obs = row[`${type}Obs` as keyof OutputRow] as string;

        // Map types
        const typeMap = { urination: 'Urination', bm: 'Bowel Movement', vomit: 'Vomit' };

        if (!isChecked && !obs) return; // Skip if nothing to save for this cell

        const timestamp = `${date}T${row.time}:00`;
        const payload = {
            resident_id: residentId,
            type: typeMap[type] as any,
            date,
            logged_at: timestamp,
            characteristics: obs,
            logged_by: user?.id
        };

        try {
            const idField = `${type}Id` as keyof OutputRow;
            if (row[idField]) {
                // update logic skipped
            } else {
                const newLog = await logbookService.addEliminationLog(payload);
                const newRows = [...rows];
                (newRows[index] as any)[idField] = newLog.id;
                setRows(newRows);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (index: number, field: string, value: any) => {
        const newRows = [...rows];
        (newRows[index] as any)[field] = value;
        setRows(newRows);
    };

    return (
        <Card className="p-0 border border-gray-200 overflow-hidden shadow-sm bg-white dark:bg-gray-800">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 uppercase text-xs">
                            <th className="border-r border-b px-2 py-2 w-24">Hora</th>
                            <th className="border-r border-b px-2 py-2 w-16 text-center">Orina</th>
                            <th className="border-r border-b px-2 py-2">Obs. Orina</th>
                            <th className="border-r border-b px-2 py-2 w-16 text-center">Evacuación</th>
                            <th className="border-r border-b px-2 py-2">Obs. Evacuación</th>
                            <th className="border-r border-b px-2 py-2 w-16 text-center">Vómito</th>
                            <th className="border-b px-2 py-2">Obs. Vómito</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-850 border-b border-gray-100 last:border-0">
                                <td className="border-r p-1">
                                    <input
                                        type="time"
                                        value={row.time}
                                        onChange={e => handleChange(i, 'time', e.target.value)}
                                        className="w-full text-center bg-transparent border-gray-200 rounded"
                                    />
                                </td>
                                {['urination', 'bm', 'vomit'].map(type => (
                                    <React.Fragment key={type}>
                                        <td className="border-r p-1 text-center">
                                            <input
                                                type="checkbox"
                                                checked={(row as any)[type]}
                                                onChange={e => handleChange(i, type, e.target.checked)}
                                                onBlur={() => handleSave(i, type as any)}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                        </td>
                                        <td className={`p-1 ${type !== 'vomit' ? 'border-r' : ''}`}>
                                            <input
                                                type="text"
                                                value={(row as any)[`${type}Obs`]}
                                                onChange={e => handleChange(i, `${type}Obs`, e.target.value)}
                                                onBlur={() => handleSave(i, type as any)}
                                                className="w-full bg-transparent border-transparent focus:border-indigo-300 rounded px-2"
                                                placeholder="..."
                                            />
                                        </td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
