import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, User, Save, FileText, Activity, Utensils, Droplets, BedDouble, ChevronLeft, ChevronRight } from 'lucide-react';
import { residentService, Resident } from '../../../services/residentService';
import { Card } from '../../../components/ui/Card';
import { VitalSignsSection } from './components/VitalSignsSection';
import { CareSection } from './components/CareSection';
import { NutritionSection } from './components/NutritionSection';
import { EliminationSection } from './components/EliminationSection';
import { MedicationSection } from './components/MedicationSection';

export const DailyLogbook: React.FC = () => {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [selectedResidentId, setSelectedResidentId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResidents();
    }, []);

    const loadResidents = async () => {
        try {
            const data = await residentService.getAllResidents();
            setResidents(data);
            if (data.length > 0) setSelectedResidentId(data[0].id);
        } catch (error) {
            console.error('Error loading residents', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const selectedResident = residents.find(r => r.id === selectedResidentId);

    if (loading) return <div className="p-8 text-center">Cargando residentes...</div>;

    return (
        <div className="px-1 py-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

                {/* Resident Selector */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Residente</label>
                        <select
                            value={selectedResidentId}
                            onChange={(e) => setSelectedResidentId(e.target.value)}
                            className="bg-transparent font-bold text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-0 w-full md:min-w-[200px]"
                        >
                            {residents.map(r => (
                                <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <button
                        onClick={() => handleDateChange(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="text-center">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fecha</label>
                        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                            <CalendarIcon className="w-4 h-4 text-indigo-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none p-0 focus:ring-0 font-bold"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => handleDateChange(1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {selectedResidentId && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Vital Signs */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-rose-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Signos Vitales</h2>
                        </div>
                        <VitalSignsSection residentId={selectedResidentId} date={selectedDate} />
                    </section>

                    {/* Medications */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-600">Rx</div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Medicamentos</h2>
                        </div>
                        <MedicationSection residentId={selectedResidentId} date={selectedDate} />
                    </section>

                    {/* Care & Hygiene */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <BedDouble className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cuidados e Higiene</h2>
                        </div>
                        <CareSection residentId={selectedResidentId} date={selectedDate} />
                    </section>

                    {/* Nutrition */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Utensils className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Alimentación</h2>
                        </div>
                        <NutritionSection residentId={selectedResidentId} date={selectedDate} />
                    </section>

                    {/* Elimination */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Droplets className="w-5 h-5 text-cyan-600" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Eliminación</h2>
                        </div>
                        <EliminationSection residentId={selectedResidentId} date={selectedDate} />
                    </section>

                </div>
            )}
        </div>
    );
};

export default DailyLogbook;
