import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { careService } from '../../services/careService';
import { History, FileText } from 'lucide-react';

interface Props {
    residentId: string;
}

const RecordsHistoryTable: React.FC<Props> = ({ residentId }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (residentId) loadHistory();
    }, [residentId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await careService.getResidentHistory(residentId);
            setHistory(data);
        } catch (error) {
            console.error('Error loading history', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-600" />
                    Historial de Registros
                </h3>
                <button onClick={loadHistory} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                    Actualizar
                </button>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 font-semibold">
                        <tr>
                            <th className="px-4 py-3">Fecha / Hora</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Resumen</th>
                            <th className="px-4 py-3">Detalle</th>
                            <th className="px-4 py-3">Autor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Cargando...</td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay registros recientes.</td></tr>
                        ) : (
                            history.map((item, idx) => (
                                <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-200 font-mono text-xs">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold 
                                        ${item.type === 'Cuidados' ? 'bg-purple-100 text-purple-700' :
                                                item.type === 'Alimentación' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-300">
                                        {item.summary}
                                    </td>
                                    <td className="px-4 py-2 text-gray-500 max-w-xs truncate" title={item.detail}>
                                        {item.detail || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-gray-500 text-xs">
                                        {item.author}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default RecordsHistoryTable;
