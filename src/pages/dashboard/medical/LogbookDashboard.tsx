import React, { useState, useEffect } from 'react';
import { BookOpen, User, Droplet, Utensils, Activity, Tablet, Clipboard, FileText, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { residentService, Resident } from '../../../services/residentService';
import { Card } from '../../../components/ui/Card';

// Child components
import VitalSignsTable from '../../../components/logbook/VitalSignsTable';
import NursingNotesSection from '../../../components/logbook/NursingNotesSection';
import PatientHistorySummary from '../../../components/logbook/PatientHistorySummary';
import RecordsHistoryTable from '../../../components/logbook/RecordsHistoryTable';
import { NursingClinicalSheet } from '../../../components/medical/NursingClinicalSheet';

const LogbookDashboard: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
    const { user } = useAuthStore();
    const [residents, setResidents] = useState<Resident[]>([]);
    const [selectedResidentId, setSelectedResidentId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [activeTab, setActiveTab] = useState<'sheet' | 'notes' | 'history'>('sheet');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadResidents();
    }, []);

    const loadResidents = async () => {
        try {
            const data = await residentService.getAllResidents();
            setResidents(data);
            if (data.length > 0) setSelectedResidentId(data[0].id);
        } catch (error) {
            console.error('Error loading residents:', error);
        }
    };

    const selectedResident = residents.find(r => r.id === selectedResidentId);

    const tabs = [
        { id: 'sheet', label: 'Hoja Clínica', icon: FileText },
        { id: 'notes', label: 'Notas y Resumen', icon: BookOpen },
        { id: 'history', label: 'Historial Completo', icon: Clipboard },
    ] as const;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header / Controls - Sticky */}
            <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="p-6 pb-0">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-amber-600" />
                                Bitácora Digital
                            </h1>
                            <p className="text-gray-500 text-sm">Registro diario de cuidados de enfermería</p>
                        </div>

                        <div className="flex gap-4 items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-400 uppercase font-bold">Residente</label>
                                <select
                                    className="bg-transparent font-medium outline-none text-gray-700 dark:text-gray-200"
                                    value={selectedResidentId}
                                    onChange={(e) => setSelectedResidentId(e.target.value)}
                                >
                                    {residents.map(r => (
                                        <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden md:block"></div>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-400 uppercase font-bold">Fecha</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            const [y, m, d] = selectedDate.split('-').map(Number);
                                            const date = new Date(y, m - 1, d);
                                            date.setDate(date.getDate() - 1);
                                            setSelectedDate(date.toISOString().split('T')[0]);
                                        }}
                                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="date"
                                        className="bg-transparent font-medium outline-none text-gray-700 dark:text-gray-200"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                    <button
                                        onClick={() => {
                                            const [y, m, d] = selectedDate.split('-').map(Number);
                                            const date = new Date(y, m - 1, d);
                                            date.setDate(date.getDate() + 1);
                                            setSelectedDate(date.toISOString().split('T')[0]);
                                        }}
                                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-amber-600 text-amber-700 dark:text-amber-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
                {selectedResidentId && (
                    <>
                        {activeTab === 'sheet' && (
                            <>
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-amber-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Hoja Clínica</h2>
                                    </div>
                                    <NursingClinicalSheet patientId={selectedResidentId} date={selectedDate} readOnly={readOnly} />
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Signos Vitales</h2>
                                    </div>
                                    <VitalSignsTable residentId={selectedResidentId} date={selectedDate} readOnly={readOnly} />
                                </section>
                            </>
                        )}

                        {activeTab === 'notes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-green-600" />
                                        Notas de Enfermería
                                    </h2>
                                    <NursingNotesSection residentId={selectedResidentId} readOnly={readOnly} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Clipboard className="w-5 h-5 text-purple-600" />
                                        Resumen del Turno
                                    </h2>
                                    <PatientHistorySummary residentId={selectedResidentId} date={selectedDate} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <History className="w-5 h-5 text-gray-600" />
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Historial Completo</h2>
                                </div>
                                <RecordsHistoryTable residentId={selectedResidentId} />
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LogbookDashboard;
