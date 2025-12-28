import React, { useState } from 'react';
import { Card } from '../ui/Card';

export const NursingClinicalSheet: React.FC = () => {
    // State for Hygiene (10 rows default)
    const [hygieneRows, setHygieneRows] = useState(
        Array(10).fill({
            diaperDate: '', diaperTime: '',
            sheetsDate: '', sheetsTime: '',
            bathDate: '', bathTime: ''
        })
    );

    // State for Feeding
    const [feeding, setFeeding] = useState({
        desayuno: { hora: '', descripcion: '', observaciones: '' },
        comida: { hora: '', descripcion: '', observaciones: '' },
        cena: { hora: '', descripcion: '', observaciones: '' },
    });

    // State for Outputs (Micciones, Evacuaciones, Vómito) - 5 rows
    const [outputs, setOutputs] = useState(
        Array(5).fill({
            hora: '',
            micciones: '', miccionesDesc: '',
            evacuaciones: '', evacuacionesDesc: '',
            vomito: '', vomitoDesc: ''
        })
    );

    const handleHygieneChange = (index: number, field: string, value: string) => {
        const newRows = [...hygieneRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setHygieneRows(newRows);
    };

    const handleFeedingChange = (meal: 'desayuno' | 'comida' | 'cena', field: string, value: string) => {
        setFeeding(prev => ({
            ...prev,
            [meal]: { ...prev[meal], [field]: value }
        }));
    };

    const handleOutputChange = (index: number, field: string, value: string) => {
        const newOutputs = [...outputs];
        newOutputs[index] = { ...newOutputs[index], [field]: value };
        setOutputs(newOutputs);
    };

    return (
        <div className="space-y-6">

            {/* Hygiene Section */}
            <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 uppercase">
                                <th colSpan={2} className="border-r border-b border-gray-300 px-2 py-1 text-center font-bold">Cambio de Pañal</th>
                                <th colSpan={2} className="border-r border-b border-gray-300 px-2 py-1 text-center font-bold">Cambio de Sábanas</th>
                                <th colSpan={2} className="border-b border-gray-300 px-2 py-1 text-center font-bold">Baño</th>
                            </tr>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Fecha</th>
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Hora</th>
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Fecha</th>
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Hora</th>
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Fecha</th>
                                <th className="border-b border-gray-300 px-2 py-1 w-24">Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hygieneRows.map((row, index) => (
                                <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="date" className="w-full border-none p-1 text-xs focus:ring-0 bg-transparent"
                                            value={row.diaperDate} onChange={(e) => handleHygieneChange(index, 'diaperDate', e.target.value)} />
                                    </td>
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="time" className="w-full border-none p-1 text-xs focus:ring-0 bg-transparent text-center"
                                            value={row.diaperTime} onChange={(e) => handleHygieneChange(index, 'diaperTime', e.target.value)} />
                                    </td>
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="date" className="w-full border-none p-1 text-xs focus:ring-0 bg-transparent"
                                            value={row.sheetsDate} onChange={(e) => handleHygieneChange(index, 'sheetsDate', e.target.value)} />
                                    </td>
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="time" className="w-full border-none p-1 text-xs focus:ring-0 bg-transparent text-center"
                                            value={row.sheetsTime} onChange={(e) => handleHygieneChange(index, 'sheetsTime', e.target.value)} />
                                    </td>
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="date" className="w-full border-none p-1 text-xs focus:ring-0 bg-transparent"
                                            value={row.bathDate} onChange={(e) => handleHygieneChange(index, 'bathDate', e.target.value)} />
                                    </td>
                                    <td className="border-b border-gray-300 p-0">
                                        <input type="time" className="w-full border-none p-1 text-xs focus:ring-0 bg-transparent text-center"
                                            value={row.bathTime} onChange={(e) => handleHygieneChange(index, 'bathTime', e.target.value)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Feeding Section */}
            <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 inline-block">
                    Alimentación
                </h3>
                <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700 uppercase">
                                    <th className="border-r border-b border-gray-300 px-2 py-2 w-32 font-bold text-left"></th>
                                    <th className="border-r border-b border-gray-300 px-2 py-2 w-32 font-bold text-center">Hora</th>
                                    <th className="border-r border-b border-gray-300 px-2 py-2 font-bold text-left">Descripción</th>
                                    <th className="border-b border-gray-300 px-2 py-2 font-bold text-left">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['desayuno', 'comida', 'cena'].map((meal) => (
                                    <tr key={meal} className="hover:bg-blue-50 bg-white">
                                        <td className="border-r border-b border-gray-300 px-3 py-2 font-bold text-gray-700 uppercase bg-gray-50">
                                            {meal}
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input
                                                type="time"
                                                className="w-full h-full p-2 border-none focus:ring-0 bg-transparent text-center"
                                                value={feeding[meal as keyof typeof feeding].hora}
                                                onChange={(e) => handleFeedingChange(meal as any, 'hora', e.target.value)}
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input
                                                type="text"
                                                className="w-full h-full p-2 border-none focus:ring-0 bg-transparent"
                                                placeholder="Descripción de la dieta..."
                                                value={feeding[meal as keyof typeof feeding].descripcion}
                                                onChange={(e) => handleFeedingChange(meal as any, 'descripcion', e.target.value)}
                                            />
                                        </td>
                                        <td className="border-b border-gray-300 p-0">
                                            <input
                                                type="text"
                                                className="w-full h-full p-2 border-none focus:ring-0 bg-transparent"
                                                placeholder="Observaciones..."
                                                value={feeding[meal as keyof typeof feeding].observaciones}
                                                onChange={(e) => handleFeedingChange(meal as any, 'observaciones', e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Output Section */}
            <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 inline-block">
                    Eliminación
                </h3>
                <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700 uppercase">
                                    <th className="border-r border-b border-gray-300 px-2 py-1 w-24 align-bottom">Hora</th>
                                    <th className="border-r border-b border-gray-300 px-2 py-1 w-24 align-bottom">Micciones</th>
                                    <th className="border-r border-b border-gray-300 px-2 py-1 align-bottom">Descripción</th>
                                    <th className="border-r border-b border-gray-300 px-2 py-1 w-24 align-bottom">Evacuaciones</th>
                                    <th className="border-r border-b border-gray-300 px-2 py-1 align-bottom">Descripción</th>
                                    <th className="border-r border-b border-gray-300 px-2 py-1 w-24 align-bottom">Vómito</th>
                                    <th className="border-b border-gray-300 px-2 py-1 align-bottom">Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outputs.map((row, index) => (
                                    <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="time" className="w-full h-full p-1 text-center border-none bg-transparent"
                                                value={row.hora} onChange={(e) => handleOutputChange(index, 'hora', e.target.value)} />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 text-center border-none bg-transparent"
                                                placeholder="✓"
                                                value={row.micciones} onChange={(e) => handleOutputChange(index, 'micciones', e.target.value)} />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 border-none bg-transparent"
                                                value={row.miccionesDesc} onChange={(e) => handleOutputChange(index, 'miccionesDesc', e.target.value)} />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 text-center border-none bg-transparent"
                                                placeholder="✓"
                                                value={row.evacuaciones} onChange={(e) => handleOutputChange(index, 'evacuaciones', e.target.value)} />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 border-none bg-transparent"
                                                value={row.evacuacionesDesc} onChange={(e) => handleOutputChange(index, 'evacuacionesDesc', e.target.value)} />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 text-center border-none bg-transparent"
                                                placeholder="✓"
                                                value={row.vomito} onChange={(e) => handleOutputChange(index, 'vomito', e.target.value)} />
                                        </td>
                                        <td className="border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 border-none bg-transparent"
                                                value={row.vomitoDesc} onChange={(e) => handleOutputChange(index, 'vomitoDesc', e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

        </div>
    );
};
