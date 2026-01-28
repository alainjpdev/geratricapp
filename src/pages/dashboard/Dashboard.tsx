import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trash2, Edit2, Check, X, Save, Printer, Activity, ClipboardList, Plus, ChevronLeft, ChevronRight, BookOpen, MessageSquarePlus, Moon } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { NursingClinicalSheet } from '../../components/medical/NursingClinicalSheet';
import { SleepDiary } from '../../components/logbook/SleepDiary';
import { TimeSelect } from '../../components/ui/TimeSelect';
import { residentService, Resident } from '../../services/residentService';
import { medicalService } from '../../services/medicalService';
import { supabase } from '../../config/supabaseClient';
import { useAuthStore } from '../../store/authStore';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
}

interface VitalSign {
    time: string;
    ta: string;
    fc: string;
    fr: string;
    temp: string;
    sato2: string;
    dxtx: string;
    recorded_by?: string;
    shift?: string;
}

interface Medication {
    id: string; // Internal ID for React keys, might be UUID if saved
    medicamento: string;
    dosis: string;
    via: string;
    hora: string;
    observacion: string;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuthStore();

    // Tab State
    const [activeTab, setActiveTab] = useState<'vitals' | 'care' | 'sleep'>('vitals');
    const [residents, setResidents] = useState<Resident[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    // activeField removed - using TimeInput component

    // State for Header
    const [headerData, setHeaderData] = useState({
        date: new Date().toISOString().split('T')[0],
        tmName: '',
        tvName: '',
        tnName: '',
        patientName: '',
        patientId: '',
        diagnosis: '', // Condition (Static)
        notes: ''      // Relevant Notes (Deletable)
    });

    // Hardcoded times based on the reference
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

    const [medications, setMedications] = useState<Medication[]>(
        Array(3).fill(null).map((_, i) => ({
            id: `temp-${i}`,
            medicamento: '',
            dosis: '',
            via: '',
            hora: '',
            observacion: ''
        }))
    );

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    const [showNoteInput, setShowNoteInput] = useState(false);
    const [tempNote, setTempNote] = useState('');

    useEffect(() => {
        const loadResidents = async () => {
            try {
                const data = await residentService.getAllResidents();
                setResidents(data);
            } catch (error) {
                console.error('Error loading residents:', error);
            }
        };

        const loadStaff = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, role')
                    .in('role', ['admin', 'enfermero'])
                    .eq('is_active', true)
                    .order('first_name');

                if (error) throw error;
                setStaffMembers(data || []);
            } catch (error) {
                console.error('Error loading staff:', error);
            }
        };

        loadResidents();
        loadStaff();
    }, []);

    // Fetch vitals when patient or date changes
    useEffect(() => {
        if (!headerData.patientId || !headerData.date) return;

        // Reset to empty immediately to avoid showing stale data while loading
        setVitals(defaultVitalTimes.map(time => ({
            time,
            ta: '',
            fc: '',
            fr: '',
            temp: '',
            sato2: '',
            dxtx: ''
        })));

        setMedications(Array(3).fill(null).map((_, i) => ({
            id: `temp-${i}`,
            medicamento: '',
            dosis: '',
            via: '',
            hora: '',
            observacion: ''
        })));

        let mounted = true;

        const fetchVitals = async () => {
            try {
                const { data, error } = await supabase
                    .from('vital_signs')
                    .select('*')
                    .eq('resident_id', headerData.patientId)
                    .eq('date', headerData.date);

                if (error) throw error;
                if (!mounted) return;

                if (data && data.length > 0) {
                    // Update local state with fetched data
                    const newVitals = defaultVitalTimes.map(time => {
                        const savedVital = data.find(v => v.time === time);
                        return savedVital ? {
                            time,
                            ta: savedVital.ta || '',
                            fc: savedVital.fc || '',
                            fr: savedVital.fr || '',
                            temp: savedVital.temp || '',
                            sato2: savedVital.sato2 || '',
                            dxtx: savedVital.dxtx || ''
                        } : {
                            time,
                            ta: '',
                            fc: '',
                            fr: '',
                            temp: '',
                            sato2: '',
                            dxtx: ''
                        };
                    });
                    setVitals(newVitals);
                } else {
                    // Reset to empty if no data found
                    setVitals(defaultVitalTimes.map(time => ({
                        time,
                        ta: '',
                        fc: '',
                        fr: '',
                        temp: '',
                        sato2: '',
                        dxtx: ''
                    })));
                }
            } catch (error) {
                console.error('Error fetching vitals:', error);
            }

            try {
                // Fetch Medications
                const { data: medData, error: medError } = await supabase
                    .from('medications')
                    .select('*')
                    .eq('resident_id', headerData.patientId)
                    .eq('date', headerData.date);

                if (medError) throw medError;
                if (!mounted) return;

                if (medData && medData.length > 0) {
                    const count = Math.max(medData.length, 3);
                    const newMeds = Array(count).fill(null).map((_, i) => ({
                        id: `temp-${i}`,
                        medicamento: '',
                        dosis: '',
                        via: '',
                        hora: '',
                        observacion: ''
                    }));

                    // Map existing data to rows
                    medData.forEach((record: any, i) => {
                        newMeds[i] = {
                            id: record.id || `saved-${i}`,
                            medicamento: record.medicamento || '',
                            dosis: record.dosis || '',
                            via: record.via || '',
                            hora: record.hora || '',
                            observacion: record.observacion || ''
                        };
                    });
                    setMedications(newMeds);
                } else {
                    setMedications(Array(3).fill(null).map((_, i) => ({
                        id: `temp-${i}`,
                        medicamento: '',
                        dosis: '',
                        via: '',
                        hora: '',
                        observacion: ''
                    })));
                }
            } catch (error) {
                console.error('Error fetching medications:', error);
            }

            try {
                // Fetch Staffing
                const staffing = await medicalService.getDailyStaffing(headerData.patientId, headerData.date);
                if (!mounted) return;

                if (staffing) {
                    setHeaderData(prev => ({
                        ...prev,
                        tmName: staffing.tmNurse || '',
                        tvName: staffing.tvNurse || '',
                        tnName: staffing.tnNurse || ''
                    }));
                } else {
                    setHeaderData(prev => ({
                        ...prev,
                        tmName: '',
                        tvName: '',
                        tnName: ''
                    }));
                }
            } catch (error) {
                console.error('Error fetching staffing:', error);
            }
        };

        fetchVitals();

        return () => {
            mounted = false;
        };
    }, [headerData.patientId, headerData.date]);

    const handleHeaderChange = async (field: string, value: string) => {
        console.log(`[Dashboard] Header Change: ${field} = ${value}`);
        setHeaderData(prev => ({ ...prev, [field]: value }));

        // Persist relevant notes if they changed
        if (field === 'notes' && headerData.patientId) {
            try {
                await residentService.updateResident(headerData.patientId, {
                    relevantNotes: value
                });
            } catch (error) {
                console.error('Error persisting relevant notes:', error);
            }
        }

        // Persist Staffing
        if ((field === 'tmName' || field === 'tvName' || field === 'tnName') && headerData.patientId) {
            const updatedData = { ...headerData, [field]: value };
            try {
                await medicalService.saveDailyStaffing({
                    residentId: updatedData.patientId,
                    date: updatedData.date,
                    tmNurse: updatedData.tmName,
                    tvNurse: updatedData.tvName,
                    tnNurse: updatedData.tnName
                });
            } catch (error) {
                console.error('Error saving staffing:', error);
            }
        }
    };

    const handleVitalChange = (index: number, field: string, value: string) => {
        const newVitals = [...vitals];
        newVitals[index] = { ...newVitals[index], [field]: value };
        setVitals(newVitals);
    };

    const saveVitalSign = async (vitalIndex: number) => {
        const vital = vitals[vitalIndex];

        // Basic validation: ensure there's at least one value or we are clearing it (handled by db)
        // Also ensure patient and date are selected
        if (!headerData.patientId) {
            // Maybe show a toast/tooltip? For now just return
            return;
        }

        // Prevent saving if all fields are empty (avoids overwriting with nulls if state was somehow lost or empty)
        const hasData = vital.ta || vital.fc || vital.fr || vital.temp || vital.sato2 || vital.dxtx;
        if (!hasData) {
            console.log(`[Dashboard] Skipping save for ${vital.time} - no data entered`);
            return;
        }

        // Determine Shift
        const hour = parseInt(vital.time.split(':')[0], 10);
        let shift = 'TN'; // Default Night
        if (hour >= 7 && hour < 15) shift = 'TM'; // 07:00 - 14:59
        else if (hour >= 15 && hour < 22) shift = 'TV'; // 15:00 - 21:59

        try {
            console.log(`[Dashboard] Saving Vital Sign (${shift}):`, {
                resident_id: headerData.patientId,
                date: headerData.date,
                shift,
                ...vital
            });

            const { error } = await supabase
                .from('vital_signs')
                .upsert({
                    resident_id: headerData.patientId,
                    date: headerData.date,
                    time: vital.time,
                    shift: shift,
                    ta: vital.ta || null,
                    fc: vital.fc || null,
                    fr: vital.fr || null,
                    temp: vital.temp || null,
                    sato2: vital.sato2 || null,
                    dxtx: vital.dxtx || null,
                    recorded_by: user?.id
                }, {
                    onConflict: 'resident_id,date,time'
                });

            if (error) throw error;
            console.log(`Vital sign saved (${shift}):`, vital.time);
            showToast('Signos vitales guardados');
        } catch (error) {
            console.error('Error saving vital sign:', error);
            showToast('Error al guardar', 'error');
        }
    };

    const saveMedication = async (index: number) => {
        const med = medications[index];
        if (!headerData.patientId || !headerData.date) return;

        // If completely empty, maybe skip upsert if it doesn't exist? 
        // But user might be clearing a field.
        // We need a unique constraint. For this design, let's assume Row Index maps to a slot, 
        // OR we just use (resident, date, medicamento, hora) as constraint.
        // HOWEVER: The user might change 'medicamento' or 'hora', breaking the constraint match logic used for updates.
        // IDEAL: Use a hidden ID column if we loaded it.

        // Simplified approach for this "Sheet" view: 
        // We will try to upsert based on (resident_id, date, row_index) logic if we had it, but we don't.
        // We effectively need to treat this as a list.
        // CONSTRAINT in DB: UNIQUE(resident_id, date, medicamento, hora).
        // If user changes 'hora', it's a new unique key -> Insert. Old one remains? This is tricky with simple tables.
        // BETTER: For this specific "Paper Sheet" emulation, we often just want to save.

        // Let's rely on standard upsert if we have an ID, or Insert if new.
        // Since we are not fully tracking IDs for new rows, we'll do this:

        if (!med.medicamento && !med.hora) return; // Don't save empty rows if not needed

        try {
            const payload: any = {
                resident_id: headerData.patientId,
                date: headerData.date,
                medicamento: med.medicamento,
                dosis: med.dosis,
                via: med.via,
                hora: med.hora,
                observacion: med.observacion,
                recorded_by: user?.id
            };

            console.log('[Dashboard] Saving Medication Payload:', payload);

            // If we have a real UUID (not temp-), include it to update
            if (!med.id.startsWith('temp-')) {
                const { error } = await supabase
                    .from('medications')
                    .update(payload)
                    .eq('id', med.id)
                    .select();

                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('medications')
                    .upsert(payload, { onConflict: 'resident_id,date,medicamento,hora' })
                    .select();

                if (error) throw error;

                if (data && data[0]) {
                    const newMeds = [...medications];
                    newMeds[index] = { ...newMeds[index], id: data[0].id };
                    setMedications(newMeds);
                }
            }



            console.log('Medication saved');
            showToast('Medicamento guardado');

        } catch (error) {
            console.error('Error saving medication:', error);
            showToast('Error al guardar medicamento', 'error');
        }
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        newMeds[index] = { ...newMeds[index], [field]: value };
        setMedications(newMeds);
    };

    const addMedicationRow = () => {
        setMedications(prev => [
            ...prev,
            {
                id: `temp-${prev.length}`,
                medicamento: '',
                dosis: '',
                via: '',
                hora: '',
                observacion: ''
            }
        ]);
    };

    return (
        <div className="flex flex-col min-h-screen bg-white p-4 md:p-8">
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            {/* Header / Controls - Sticky (Like LogbookDashboard) */}
            <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm mb-4 -mx-4 md:-mx-8 px-4 md:px-8 py-2">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                    Bitácora de Cuidados
                                </h1>
                                <p className="text-gray-500 text-[10px] hidden md:block">Registro diario de cuidados de enfermería</p>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 w-full md:w-auto overflow-x-auto">
                            <div className="flex flex-col min-w-[120px]">
                                <label className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-0.5">Residente</label>
                                <select
                                    className="bg-transparent font-semibold outline-none text-xs text-gray-700 dark:text-gray-200"
                                    value={headerData.patientId}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;

                                        // IMMEDIATE RESET to prevent flicker
                                        setVitals(defaultVitalTimes.map(time => ({ time, ta: '', fc: '', fr: '', temp: '', sato2: '', dxtx: '' })));
                                        setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', hora: '', observacion: '' })));

                                        const resident = residents.find(r => r.id === selectedId);
                                        if (resident) {
                                            setHeaderData(prev => ({
                                                ...prev,
                                                patientId: resident.id,
                                                patientName: `${resident.firstName} ${resident.lastName}`,
                                                diagnosis: resident.conditions || '',
                                                notes: resident.relevantNotes || ''
                                            }));
                                        } else {
                                            setHeaderData(prev => ({ ...prev, patientId: '', patientName: '', diagnosis: '', notes: '' }));
                                        }
                                    }}
                                >
                                    <option value="">Seleccionar...</option>
                                    {residents.map(r => (
                                        <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 shrink-0"></div>
                            <div className="flex flex-col min-w-[140px]">
                                <label className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-0.5">Fecha</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            // IMMEDIATE RESET
                                            setVitals(defaultVitalTimes.map(time => ({ time, ta: '', fc: '', fr: '', temp: '', sato2: '', dxtx: '' })));
                                            setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', hora: '', observacion: '' })));

                                            const [y, m, d] = headerData.date.split('-').map(Number);
                                            const date = new Date(y, m - 1, d);
                                            date.setDate(date.getDate() - 1);
                                            handleHeaderChange('date', date.toISOString().split('T')[0]);
                                        }}
                                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>
                                    <input
                                        type="date"
                                        className="bg-transparent font-semibold outline-none text-xs text-gray-700 dark:text-gray-200"
                                        value={headerData.date}
                                        onChange={(e) => {
                                            // IMMEDIATE RESET
                                            setVitals(defaultVitalTimes.map(time => ({ time, ta: '', fc: '', fr: '', temp: '', sato2: '', dxtx: '' })));
                                            setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', hora: '', observacion: '' })));

                                            handleHeaderChange('date', e.target.value);
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            // IMMEDIATE RESET
                                            setVitals(defaultVitalTimes.map(time => ({ time, ta: '', fc: '', fr: '', temp: '', sato2: '', dxtx: '' })));
                                            setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', hora: '', observacion: '' })));

                                            const [y, m, d] = headerData.date.split('-').map(Number);
                                            const date = new Date(y, m - 1, d);
                                            date.setDate(date.getDate() + 1);
                                            handleHeaderChange('date', date.toISOString().split('T')[0]);
                                        }}
                                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prominent Nursing Notes in Header - Compact */}
                    {/* Prominent Info Row in Header - Thinner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Section 1: Condición (Static) */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-900/30 p-1.5 px-2 rounded-md flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-blue-700/80 dark:text-blue-500 font-bold text-[9px] uppercase tracking-wider">
                                <Activity className="w-3 h-3" />
                                Condición del Residente:
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center min-h-[22px]">
                                {headerData.diagnosis ? (
                                    headerData.diagnosis.split(';').filter(Boolean).map((cond, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/50 text-[11px] font-bold text-blue-700 dark:text-blue-300 shadow-sm uppercase">
                                            {cond.trim()}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-[10px] italic">Sin condición registrada</span>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Notas de Enfermería Relevantes (Dynamic) */}
                        <div className="bg-amber-50/50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/30 p-1.5 px-2 rounded-md flex flex-col gap-1">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5 text-amber-700/80 dark:text-amber-500 font-bold text-[9px] uppercase tracking-wider">
                                    <ClipboardList className="w-3 h-3" />
                                    Notas Relevantes:
                                </div>
                                {!showNoteInput && (
                                    <button
                                        onClick={() => setShowNoteInput(true)}
                                        className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-100 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 items-center min-h-[22px]">
                                {headerData.notes ? (
                                    headerData.notes.split(';').filter(Boolean).map((note, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/50 text-[11px] text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shadow-sm max-w-full">
                                            <span className="truncate max-w-[200px] md:max-w-[300px]" title={note.trim()}>{note.trim()}</span>
                                            <button
                                                onClick={() => {
                                                    const notes = headerData.notes.split(';').filter(Boolean);
                                                    notes.splice(idx, 1);
                                                    handleHeaderChange('notes', notes.join(';'));
                                                }}
                                                className="text-gray-300 hover:text-red-500"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ))
                                ) : !showNoteInput && (
                                    <button
                                        onClick={() => setShowNoteInput(true)}
                                        className="flex items-center gap-1.5 text-amber-600/50 hover:text-amber-600 text-[10px] italic py-0.5"
                                    >
                                        <Plus className="w-3 h-3 border border-dashed border-amber-300 rounded" />
                                        Agregar nota...
                                    </button>
                                )}

                                {showNoteInput && (
                                    <div className="flex items-center gap-1.5 flex-1 w-full">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempNote}
                                            onChange={(e) => setTempNote(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (tempNote.trim()) {
                                                        const currentNotes = headerData.notes ? headerData.notes.split(';').filter(Boolean) : [];
                                                        handleHeaderChange('notes', [...currentNotes, tempNote.trim()].join(';'));
                                                        setTempNote('');
                                                        setShowNoteInput(false);
                                                    } else {
                                                        setShowNoteInput(false);
                                                    }
                                                }
                                                if (e.key === 'Escape') setShowNoteInput(false);
                                            }}
                                            onBlur={() => {
                                                if (!tempNote.trim()) setShowNoteInput(false);
                                            }}
                                            className="bg-white dark:bg-gray-800 border-amber-200 focus:border-amber-400 rounded px-2 py-0.5 text-xs flex-1 focus:ring-1 focus:ring-amber-300 outline-none h-6"
                                            placeholder="Escribe y pulsa Enter..."
                                        />
                                        <button
                                            onClick={() => {
                                                if (tempNote.trim()) {
                                                    const currentNotes = headerData.notes ? headerData.notes.split(';').filter(Boolean) : [];
                                                    handleHeaderChange('notes', [...currentNotes, tempNote.trim()].join(';'));
                                                    setTempNote('');
                                                }
                                                setShowNoteInput(false);
                                            }}
                                            className="text-green-600 p-0.5"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full space-y-6">

                {/* Staff Assignment Section (Collapsed/Optional) */}
                <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 bg-gray-50 border-b border-gray-300">
                        <div className="border-b md:border-b-0 md:border-r border-gray-300 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">TM Nombre</label>
                            <select
                                value={headerData.tmName}
                                onChange={(e) => handleHeaderChange('tmName', e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 focus:ring-0"
                            >
                                <option value="">Enfermero Turno Mañana...</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={`${staff.first_name} ${staff.last_name}`}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="border-b md:border-b-0 md:border-r border-gray-300 p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">TV Nombre</label>
                            <select
                                value={headerData.tvName}
                                onChange={(e) => handleHeaderChange('tvName', e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 focus:ring-0"
                            >
                                <option value="">Enfermero Turno Vespertino...</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={`${staff.first_name} ${staff.last_name}`}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="p-3">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">TN Nombre</label>
                            <select
                                value={headerData.tnName}
                                onChange={(e) => handleHeaderChange('tnName', e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 focus:ring-0"
                            >
                                <option value="">Enfermero Turno Nocturno...</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={`${staff.first_name} ${staff.last_name}`}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Diagnosis (moved from old grid) */}
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
                    <button
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'sleep'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('sleep')}
                    >
                        <Moon className="w-4 h-4" />
                        Diario de Sueño
                    </button>
                </div>

                {/* Content Section */}
                {
                    activeTab === 'vitals' ? (
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
                                                                onBlur={() => saveVitalSign(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.fc}
                                                                onChange={(e) => handleVitalChange(index, 'fc', e.target.value)}
                                                                onBlur={() => saveVitalSign(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.fr}
                                                                onChange={(e) => handleVitalChange(index, 'fr', e.target.value)}
                                                                onBlur={() => saveVitalSign(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.temp}
                                                                onChange={(e) => handleVitalChange(index, 'temp', e.target.value)}
                                                                onBlur={() => saveVitalSign(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.sato2}
                                                                onChange={(e) => handleVitalChange(index, 'sato2', e.target.value)}
                                                                onBlur={() => saveVitalSign(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.dxtx}
                                                                onChange={(e) => handleVitalChange(index, 'dxtx', e.target.value)}
                                                                onBlur={() => saveVitalSign(index)}
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
                                                    <tr key={row.id} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.medicamento}
                                                                onChange={(e) => handleMedicationChange(index, 'medicamento', e.target.value)}
                                                                onBlur={() => saveMedication(index)}
                                                                className="w-full h-full py-2 px-2 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                placeholder={index === 0 ? "Nombre del medicamento" : ""}
                                                            />
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.dosis}
                                                                onChange={(e) => handleMedicationChange(index, 'dosis', e.target.value)}
                                                                onBlur={() => saveMedication(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                placeholder={index === 0 ? "dosis" : ""}
                                                            />
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0 text-center relative group">
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
                                                                {!row.via && index === 0 && <span className="opacity-50">oral</span>}
                                                            </div>
                                                            <select
                                                                value={row.via}
                                                                onChange={(e) => handleMedicationChange(index, 'via', e.target.value)}
                                                                onBlur={() => saveMedication(index)}
                                                                className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent appearance-none cursor-pointer relative z-10"
                                                            >
                                                                <option value="" className="text-gray-400">Seleccionar...</option>
                                                                <option value="oral">Oral</option>
                                                                <option value="intramuscular">Intramuscular</option>
                                                                <option value="intravenosa">Intravenosa</option>
                                                                <option value="subcutanea">Subcutanea</option>
                                                                <option value="oftalmologica">Oftalmologica</option>
                                                                <option value="otra">Otra</option>
                                                            </select>
                                                        </td>
                                                        <td className="border-r border-b border-gray-300 p-0 h-10">
                                                            <TimeSelect
                                                                value={row.hora}
                                                                onChange={(e) => handleMedicationChange(index, 'hora', e.target.value)}
                                                                onBlur={() => saveMedication(index)}
                                                                className="text-center py-2 px-1 h-full"
                                                            />
                                                        </td>
                                                        <td className="border-b border-gray-300 p-0">
                                                            <input
                                                                type="text"
                                                                value={row.observacion}
                                                                onChange={(e) => handleMedicationChange(index, 'observacion', e.target.value)}
                                                                onBlur={() => saveMedication(index)}
                                                                className="w-full h-full py-2 px-2 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                placeholder={index === 0 ? "Notas..." : ""}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex justify-center">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={addMedicationRow}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1 w-full justify-center"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Agregar Medicamento
                                        </Button>
                                    </div>

                                </Card>
                            </div>
                        </div>
                    ) : activeTab === 'care' ? (
                        <div className="space-y-6 animate-fadeIn">
                            <NursingClinicalSheet
                                key={`${headerData.patientId}-${headerData.date}`} // Force remount to clear state
                                patientId={headerData.patientId}
                                date={headerData.date}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fadeIn">
                            <SleepDiary
                                key={`${headerData.patientId}-${headerData.date}`}
                                patientId={headerData.patientId}
                                date={headerData.date}
                            />
                        </div>
                    )}

            </div >
        </div >
    );
};
