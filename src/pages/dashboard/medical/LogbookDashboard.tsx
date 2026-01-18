import React, { useState, useEffect } from 'react';
// Force refresh import
import { BookOpen, User, Droplet, Utensils, Activity, Tablet, Clipboard } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { residentService, Resident } from '../../../services/residentService';
import { Card } from '../../../components/ui/Card';

// Child components (placeholders for now)
import VitalSignsTable from '../../../components/logbook/VitalSignsTable';
// import MedicationsLog from '../../../components/logbook/MedicationsLog';
import CareLogSection from '../../../components/logbook/CareLogSection';
import NutritionLogSection from '../../../components/logbook/NutritionLogSection';
import EliminationLogSection from '../../../components/logbook/EliminationLogSection';
import NursingNotesSection from '../../../components/logbook/NursingNotesSection';
import PatientHistorySummary from '../../../components/logbook/PatientHistorySummary';
import RecordsHistoryTable from '../../../components/logbook/RecordsHistoryTable';

const LogbookDashboard: React.FC = () => {
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
    const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'vitals' | 'meds' | 'care' | 'nutrition' | 'elimination'>('summary');
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
        { id: 'summary', label: 'Resumen Diario', icon: BookOpen },
        { id: 'history', label: 'Historial Completo', icon: Clipboard },
        { id: 'vitals', label: 'Signos Vitales', icon: Activity },
        // { id: 'meds', label: 'Medicamentos', icon: Tablet }, // Will integrate later or keep simply text based for now
        { id: 'care', label: 'Cuidados', icon: Clipboard },
        { id: 'nutrition', label: 'Alimentación', icon: Utensils },
        { id: 'elimination', label: 'Eliminación', icon: Droplet },
    ] as const;

    return (
        <div className="p-6 flex flex-col h-[calc(100vh-64px)]">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-amber-600" />
                        Bitácora Digital
                    </h1>
                    <p className="text-gray-500 text-sm">Registro diario de cuidados de enfermería</p>
                </div>

                <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
                        <input
                            type="date"
                            className="bg-transparent font-medium outline-none text-gray-700 dark:text-gray-200"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 border-b border-gray-200 dark:border-gray-700 mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedResidentId && (
                        <>
                            {activeTab === 'summary' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                                    <NursingNotesSection residentId={selectedResidentId} />
                                    <PatientHistorySummary residentId={selectedResidentId} date={selectedDate} />
                                </div>
                            )}
                            {activeTab === 'history' && <RecordsHistoryTable residentId={selectedResidentId} />}
                            {activeTab === 'vitals' && <VitalSignsTable residentId={selectedResidentId} />}
                            {activeTab === 'care' && <CareLogSection residentId={selectedResidentId} date={selectedDate} />}
                            {activeTab === 'nutrition' && <NutritionLogSection residentId={selectedResidentId} date={selectedDate} />}
                            {activeTab === 'elimination' && <EliminationLogSection residentId={selectedResidentId} date={selectedDate} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogbookDashboard;
