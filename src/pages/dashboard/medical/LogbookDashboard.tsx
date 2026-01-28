import React, { useState, useEffect } from 'react';
import { BookOpen, User, Users, Droplet, Utensils, Activity, Tablet, Clipboard, FileText, History, ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { residentService, Resident } from '../../../services/residentService';
import { medicalService, DailyStaffing } from '../../../services/medicalService';
import { Card } from '../../../components/ui/Card';

// Child components
import VitalSignsTable from '../../../components/logbook/VitalSignsTable';
import NursingNotesSection from '../../../components/logbook/NursingNotesSection';
import PatientHistorySummary from '../../../components/logbook/PatientHistorySummary';
import RecordsHistoryTable from '../../../components/logbook/RecordsHistoryTable';
import { NursingClinicalSheet } from '../../../components/medical/NursingClinicalSheet';
import { MedicationSection } from '../../dashboard/logbook/components/MedicationSection';
import { SleepDiary } from '../../../components/logbook/SleepDiary';
import { StaffingModal } from '../../../components/logbook/StaffingModal';
import { LogbookPrintModal } from '../../../components/logbook/LogbookPrintModal';
import { Printer } from 'lucide-react';

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
    const [dailyStaffing, setDailyStaffing] = useState<DailyStaffing | null>(null);
    const [staffingModalOpen, setStaffingModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    useEffect(() => {
        loadResidents();
    }, []);

    useEffect(() => {
        if (selectedResidentId && selectedDate) {
            loadStaffing();
        }
    }, [selectedResidentId, selectedDate]);

    const loadStaffing = async () => {
        try {
            const data = await medicalService.getDailyStaffing(selectedResidentId, selectedDate);
            setDailyStaffing(data);
        } catch (error) {
            console.error('Error loading staffing:', error);
        }
    };

    const loadResidents = async () => {
        try {
            const data = await residentService.getAllResidents();
            setResidents(data);
            if (data.length > 0) setSelectedResidentId(data[0].id);
        } catch (error) {
            console.error('Error loading residents:', error);
        }
    };

    const handleSaveStaffing = async (data: DailyStaffing) => {
        try {
            await medicalService.saveDailyStaffing(data);
            setDailyStaffing(data);
        } catch (error) {
            console.error('Error saving staffing:', error);
        }
    };

    const handleUpdateField = async (field: keyof DailyStaffing, value: string) => {
        // Optimistic update
        const updatedStaffing: DailyStaffing = {
            ...(dailyStaffing || { residentId: selectedResidentId, date: selectedDate }),
            [field]: value
        };
        setDailyStaffing(updatedStaffing);

        // Debounce save or just save? Immediate save might spam. 
        // For simplicity in this turn, I'll save immediately but usually debounce is better.
        // User asked for "siempre se guarden", so onBlur is safer for text areas, 
        // but let's do onBlur to avoid spamming DB on every keystroke.
    };

    const handleSaveField = async (field: keyof DailyStaffing, value: string) => {
        const updatedStaffing: DailyStaffing = {
            ...(dailyStaffing || { residentId: selectedResidentId, date: selectedDate }),
            [field]: value
        };
        try {
            await medicalService.saveDailyStaffing(updatedStaffing);
        } catch (error) {
            console.error(`Error saving ${field}:`, error);
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

                    {!readOnly && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPrintModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                                title="Imprimir Reporte"
                            >
                                <Printer className="w-5 h-5" />
                                <span className="hidden md:inline">Imprimir</span>
                            </button>
                            <button
                                onClick={() => setStaffingModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                            >
                                <Users className="w-5 h-5" />
                                <span className="font-medium hidden md:inline">Asignar Personal</span>
                            </button>
                        </div>
                    )}
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


            {/* Content Area */}
            <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
                {selectedResidentId && (
                    <>
                        {activeTab === 'sheet' && (
                            <>
                                {/* Staffing Banner */}
                                {dailyStaffing && (dailyStaffing.tmNurse || dailyStaffing.tvNurse || dailyStaffing.tnNurse) && (
                                    <div className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-600" />
                                            <span className="font-bold text-gray-700 dark:text-gray-200 uppercase text-sm tracking-wide">Enfermeros Asignados:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            {dailyStaffing.tmNurse && (
                                                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-800">
                                                    <span className="text-xs font-bold text-blue-500 uppercase">Mañana:</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{dailyStaffing.tmNurse}</span>
                                                </div>
                                            )}
                                            {dailyStaffing.tvNurse && (
                                                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-md border border-amber-100 dark:border-amber-800">
                                                    <span className="text-xs font-bold text-amber-500 uppercase">Tarde:</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{dailyStaffing.tvNurse}</span>
                                                </div>
                                            )}
                                            {dailyStaffing.tnNurse && (
                                                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                                                    <span className="text-xs font-bold text-indigo-500 uppercase">Noche:</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{dailyStaffing.tnNurse}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Relevant Notes - Daily */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clipboard className="w-5 h-5 text-purple-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Notas Relevantes del Día</h2>
                                    </div>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                                        rows={3}
                                        placeholder="Escriba notas relevantes para este día..."
                                        value={dailyStaffing?.relevantNotes || selectedResident?.relevantNotes || ''}
                                        onChange={(e) => handleUpdateField('relevantNotes', e.target.value)}
                                        onBlur={(e) => handleSaveField('relevantNotes', e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Signos Vitales</h2>
                                    </div>
                                    <VitalSignsTable residentId={selectedResidentId} date={selectedDate} readOnly={readOnly} />
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Tablet className="w-5 h-5 text-emerald-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Medicamentos</h2>
                                    </div>
                                    <MedicationSection residentId={selectedResidentId} date={selectedDate} />
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-amber-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Hoja Clínica</h2>
                                    </div>
                                    <NursingClinicalSheet patientId={selectedResidentId} date={selectedDate} readOnly={readOnly} />
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Moon className="w-5 h-5 text-indigo-600" />
                                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Diario de Sueño</h2>
                                    </div>
                                    <SleepDiary patientId={selectedResidentId} date={selectedDate} readOnly={readOnly} />
                                </section>

                                {/* Resident Condition - Daily */}
                                <div className="mt-8 mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-5 h-5 text-amber-600" />
                                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Condición del Residente (Diaria)</h2>
                                    </div>
                                    <textarea
                                        className="w-full p-3 border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-shadow"
                                        rows={2}
                                        placeholder="Describa la condición general del residente hoy..."
                                        value={dailyStaffing?.condition || selectedResident?.conditions || ''}
                                        onChange={(e) => handleUpdateField('condition', e.target.value)}
                                        onBlur={(e) => handleSaveField('condition', e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>

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


            {
                selectedResidentId && (
                    <StaffingModal
                        isOpen={staffingModalOpen}
                        onClose={() => setStaffingModalOpen(false)}
                        onSave={handleSaveStaffing}
                        initialData={dailyStaffing}
                        residentId={selectedResidentId}
                        date={selectedDate}
                    />
                )

            }
            <LogbookPrintModal
                isOpen={printModalOpen}
                onClose={() => setPrintModalOpen(false)}
                residentId={selectedResidentId}
                initialDate={selectedDate}
            />
        </div >
    );
};

export default LogbookDashboard;
