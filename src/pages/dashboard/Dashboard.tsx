import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Save, Printer, Activity, ClipboardList } from 'lucide-react';
import { NursingClinicalSheet } from '../../components/medical/NursingClinicalSheet';

export const Dashboard: React.FC = () => {
    // Tab State
    const [activeTab, setActiveTab] = useState<'vitals' | 'care'>('vitals');

    // State for Header
    const [headerData, setHeaderData] = useState({
        date: new Date().toISOString().split('T')[0],
        tmName: '',
        tvName: '',
        tnName: '',
        patientName: '',
        diagnosis: ''
    });

    // State for Vital Signs
    // Hardcoded times based on the reference (Standard 24h nursing shifts usually start at 8am or 7am)
    const defaultVitalTimes = [
        '08:00', '10:00', '12:00', '14:00', '16:00', '18:00',
        '20:00', '22:00', '00:00', '02:00', '04:00', '06:00'
    ];

    const [vitals, setVitals] = useState(
        defaultVitalTimes.map(time => ({
            time,
            ta: '',
            fc: '',
            fr: '',
            temp: '',
            sato2: '',
            dxtx: ''
        }))
    );

    // State for Medications (Start with 10 empty rows)
    const [medications, setMedications] = useState(
        Array(10).fill({
            medicamento: '',
            dosis: '',
            via: '',
            hora: '',
            observacion: ''
        })
    );

    const handleHeaderChange = (field: string, value: string) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    };

    const handleVitalChange = (index: number, field: string, value: string) => {
        const newVitals = [...vitals];
        newVitals[index] = { ...newVitals[index], [field]: value };
        setVitals(newVitals);
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        newMeds[index] = { ...newMeds[index], [field]: value };
        setMedications(newMeds);
    };

    return (
        <div className="flex flex-col h-full bg-white p-4 md:p-8 overflow-y-auto">

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                        Bitácora de Cuidados de Enfermería
                    </h1>
                    <p className="text-sm text-gray-500">
                        {headerData.patientName ? `Paciente: ${headerData.patientName}` : 'Registro Diario'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Button>
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="w-4 h-4" />
                        Guardar
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full space-y-6">

                {/* Header Section */}
                <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-12 border-b border-gray-300">
                        <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-gray-300 p-3 bg-gray-50 flex flex-col">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                            <input
                                type="date"
                                value={headerData.date}
                                onChange={(e) => handleHeaderChange('date', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-gray-300 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">TM Nombre</label>
                            <input
                                type="text"
                                value={headerData.tmName}
                                onChange={(e) => handleHeaderChange('tmName', e.target.value)}
                                className="w-full bg-white border-b border-gray-300 px-0 py-1 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
                                placeholder="Enfermero Turno Mañana"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-gray-300 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">TV Nombre</label>
                            <input
                                type="text"
                                value={headerData.tvName}
                                onChange={(e) => handleHeaderChange('tvName', e.target.value)}
                                className="w-full bg-white border-b border-gray-300 px-0 py-1 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
                                placeholder="Enfermero Turno Vespertino"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">TN Nombre</label>
                            <input
                                type="text"
                                value={headerData.tnName}
                                onChange={(e) => handleHeaderChange('tnName', e.target.value)}
                                className="w-full bg-white border-b border-gray-300 px-0 py-1 text-gray-900 focus:outline-none focus:border-blue-500 text-sm"
                                placeholder="Enfermero Turno Nocturno"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-12">
                        <div className="col-span-12 md:col-span-6 border-b md:border-b-0 md:border-r border-gray-300 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Paciente</label>
                            <input
                                type="text"
                                value={headerData.patientName}
                                onChange={(e) => handleHeaderChange('patientName', e.target.value)}
                                className="w-full bg-white border-b border-gray-300 px-0 py-1 text-gray-900 focus:outline-none focus:border-blue-500"
                                placeholder="Nombre del Paciente"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Diagnóstico</label>
                            <input
                                type="text"
                                value={headerData.diagnosis}
                                onChange={(e) => handleHeaderChange('diagnosis', e.target.value)}
                                className="w-full bg-white border-b border-gray-300 px-0 py-1 text-gray-900 focus:outline-none focus:border-blue-500"
                                placeholder="Diagnóstico Médico"
                            />
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'vitals'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('vitals')}
                    >
                        <Activity className="w-4 h-4" />
                        Signos Vitales y Medicamentos
                    </button>
                    <button
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'care'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('care')}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Cuidados y Eliminación
                    </button>
                </div>

                {/* Content Section */}
                {activeTab === 'vitals' ? (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Vital Signs Table */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 inline-block">
                                Signos Vitales
                            </h3>
                            <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-700 uppercase">
                                                <th className="border-r border-b border-gray-300 px-4 py-2 w-24 text-center font-bold">Hora</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 text-center font-bold">T/A</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 text-center font-bold">FC</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 text-center font-bold">FR</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 text-center font-bold">Temp</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 text-center font-bold">Sat O2%</th>
                                                <th className="border-b border-gray-300 px-4 py-2 text-center font-bold">DxTx</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vitals.map((row, index) => (
                                                <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                    <td className="border-r border-b border-gray-300 px-2 py-1 text-center font-bold text-gray-600 bg-gray-50">
                                                        {row.time}
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.ta}
                                                            onChange={(e) => handleVitalChange(index, 'ta', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.fc}
                                                            onChange={(e) => handleVitalChange(index, 'fc', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.fr}
                                                            onChange={(e) => handleVitalChange(index, 'fr', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.temp}
                                                            onChange={(e) => handleVitalChange(index, 'temp', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.sato2}
                                                            onChange={(e) => handleVitalChange(index, 'sato2', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.dxtx}
                                                            onChange={(e) => handleVitalChange(index, 'dxtx', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>

                        {/* Medications Table */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 inline-block">
                                Medicamentos
                            </h3>
                            <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-700 uppercase">
                                                <th className="border-r border-b border-gray-300 px-4 py-2 w-1/3 text-left font-bold">Medicamento</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 w-24 text-center font-bold">Dosis</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 w-24 text-center font-bold">Vía</th>
                                                <th className="border-r border-b border-gray-300 px-4 py-2 w-24 text-center font-bold">Hora</th>
                                                <th className="border-b border-gray-300 px-4 py-2 text-left font-bold">Observación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {medications.map((row, index) => (
                                                <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.medicamento}
                                                            onChange={(e) => handleMedicationChange(index, 'medicamento', e.target.value)}
                                                            className="w-full h-full py-2 px-2 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            placeholder="Nombre del medicamento"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.dosis}
                                                            onChange={(e) => handleMedicationChange(index, 'dosis', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.via}
                                                            onChange={(e) => handleMedicationChange(index, 'via', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-r border-b border-gray-300 p-0">
                                                        <input
                                                            type="time"
                                                            value={row.hora}
                                                            onChange={(e) => handleMedicationChange(index, 'hora', e.target.value)}
                                                            className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                        />
                                                    </td>
                                                    <td className="border-b border-gray-300 p-0">
                                                        <input
                                                            type="text"
                                                            value={row.observacion}
                                                            onChange={(e) => handleMedicationChange(index, 'observacion', e.target.value)}
                                                            className="w-full h-full py-2 px-2 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            placeholder="Notas..."
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex justify-end">
                                    <span className="text-xs text-gray-500 italic">Página 1 de 2</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        <NursingClinicalSheet />
                    </div>
                )}

            </div>
        </div>
    );
};
