import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trash2, Edit2, Check, X, Save, Printer, Activity, ClipboardList, Plus, ChevronLeft, ChevronRight, BookOpen, MessageSquarePlus, Moon } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { NursingClinicalSheet } from '../../components/medical/NursingClinicalSheet';
import { SleepDiary } from '../../components/logbook/SleepDiary';
import { MedicationHistory } from './components/MedicationHistory';
import { TimeSelect } from '../../components/ui/TimeSelect';
import { AutocompleteInput } from '../../components/ui/AutocompleteInput';
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

interface GroupedMedication {
    id: string;
    medicamento: string;
    dosis: string;
    via: string;
    observacion: string;
    dose1Time: string;
    dose2Time: string;
    dose3Time: string;
    dose4Time: string;
    // Audit Fields
    dose1Checker?: string;
    dose1CheckTime?: string;
    dose2Checker?: string;
    dose2CheckTime?: string;
    dose3Checker?: string;
    dose3CheckTime?: string;
    dose4Checker?: string;
    dose4CheckTime?: string;
    dose1Status?: boolean;
    dose2Status?: boolean;
    dose3Status?: boolean;
    dose4Status?: boolean;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuthStore();

    // Tab State
    const [activeTab, setActiveTab] = useState<'vitals' | 'care' | 'sleep'>('vitals');
    const [residents, setResidents] = useState<Resident[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [showExtraDose, setShowExtraDose] = useState(false);
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

    const [medications, setMedications] = useState<GroupedMedication[]>(
        Array(3).fill(null).map((_, i) => ({
            id: `temp-${i}`,
            medicamento: '',
            dosis: '',
            via: '',
            observacion: '',
            dose1Time: '',
            dose2Time: '',
            dose3Time: '',
            dose4Time: ''
        }))
    );

    const medicationsRef = useRef(medications);
    useEffect(() => {
        medicationsRef.current = medications;
    }, [medications]);

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
            observacion: '',
            dose1Time: '',
            dose2Time: '',
            dose3Time: '',
            dose4Time: '',
            dose1Checker: '',
            dose1CheckTime: '',
            dose1Status: false,
            dose2Checker: '',
            dose2CheckTime: '',
            dose2Status: false,
            dose3Checker: '',
            dose3CheckTime: '',
            dose3Status: false,
            dose4Checker: '',
            dose4CheckTime: '',
            dose4Status: false
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
                    .select(`
                        id, resident_id, date, medicamento, dosis, via, observacion, recorded_by,
                        dose1_time, dose2_time, dose3_time, dose4_time,
                        dose1_checker, dose1_check_time, dose1_status,
                        dose2_checker, dose2_check_time, dose2_status,
                        dose3_checker, dose3_check_time, dose3_status,
                        dose4_checker, dose4_check_time, dose4_status
                    `)
                    .eq('resident_id', headerData.patientId)
                    .eq('date', headerData.date)
                    .order('created_at', { ascending: true });

                if (medError) throw medError;
                if (!mounted) return;

                if (medData && medData.length > 0) {
                    const loadedMeds = medData.map((d: any) => ({
                        id: d.id,
                        medicamento: d.medicamento,
                        dosis: d.dosis,
                        via: d.via,
                        observacion: d.observacion,
                        dose1Time: d.dose1_time ? d.dose1_time.substring(0, 5) : '',
                        dose2Time: d.dose2_time ? d.dose2_time.substring(0, 5) : '',
                        dose3Time: d.dose3_time ? d.dose3_time.substring(0, 5) : '',
                        dose4Time: d.dose4_time ? d.dose4_time.substring(0, 5) : '',
                        dose1Checker: d.dose1_checker || '',
                        dose1CheckTime: d.dose1_check_time || '',
                        dose1Status: d.dose1_status || false,
                        dose2Checker: d.dose2_checker || '',
                        dose2CheckTime: d.dose2_check_time || '',
                        dose2Status: d.dose2_status || false,
                        dose3Checker: d.dose3_checker || '',
                        dose3CheckTime: d.dose3_check_time || '',
                        dose3Status: d.dose3_status || false,
                        dose4Checker: d.dose4_checker || '',
                        dose4CheckTime: d.dose4_check_time || '',
                        dose4Status: d.dose4_status || false
                    }));

                    // Check if any row has a 4th dose to auto-show the column
                    if (loadedMeds.some((m: GroupedMedication) => m.dose4Time)) {
                        setShowExtraDose(true);
                    } else {
                        setShowExtraDose(false);
                    }

                    // Pad with empty rows if less than 3
                    while (loadedMeds.length < 3) {
                        loadedMeds.push({
                            id: `temp-${loadedMeds.length}`,
                            medicamento: '',
                            dosis: '',
                            via: '',
                            observacion: '',
                            dose1Time: '',
                            dose2Time: '',
                            dose3Time: '',
                            dose4Time: '',
                            dose1Checker: '',
                            dose1CheckTime: '',
                            dose1Status: false,
                            dose2Checker: '',
                            dose2CheckTime: '',
                            dose2Status: false,
                            dose3Checker: '',
                            dose3CheckTime: '',
                            dose3Status: false,
                            dose4Checker: '',
                            dose4CheckTime: '',
                            dose4Status: false
                        });
                    }
                    setMedications(loadedMeds);
                } else {
                    setMedications(Array(3).fill(null).map((_, i) => ({
                        id: `temp-${i}`,
                        medicamento: '',
                        dosis: '',
                        via: '',
                        observacion: '',
                        dose1Time: '',
                        dose2Time: '',
                        dose3Time: '',
                        dose4Time: '',
                        dose1Checker: '',
                        dose1CheckTime: '',
                        dose1Status: false,
                        dose2Checker: '',
                        dose2CheckTime: '',
                        dose2Status: false,
                        dose3Checker: '',
                        dose3CheckTime: '',
                        dose3Status: false,
                        dose4Checker: '',
                        dose4CheckTime: '',
                        dose4Status: false
                    })));
                }
            } catch (error) {
                console.error('Error fetching medications:', error);
            }

            try {
                // Fetch Staffing
                const staffing = await medicalService.getDailyStaffing(headerData.patientId, headerData.date);
                if (!mounted) return;

                if (staffing && (staffing.tmNurse || staffing.tvNurse || staffing.tnNurse)) {
                    setHeaderData(prev => ({
                        ...prev,
                        tmName: staffing.tmNurse || '',
                        tvName: staffing.tvNurse || '',
                        tnName: staffing.tnNurse || ''
                    }));
                } else {
                    // Try Global Database Staffing first
                    const globalStaff = await medicalService.getGlobalStaffing(headerData.date);
                    if (globalStaff && (globalStaff.tmNurse || globalStaff.tvNurse || globalStaff.tnNurse)) {
                        console.log('[Dashboard] Auto-filling from Global DB:', globalStaff);
                        setHeaderData(prev => ({
                            ...prev,
                            tmName: globalStaff.tmNurse || '',
                            tvName: globalStaff.tvNurse || '',
                            tnName: globalStaff.tnNurse || ''
                        }));
                        // Auto-save to this resident's specific record
                        await medicalService.saveDailyStaffing({
                            residentId: headerData.patientId,
                            date: headerData.date,
                            tmNurse: globalStaff.tmNurse || '',
                            tvNurse: globalStaff.tvNurse || '',
                            tnNurse: globalStaff.tnNurse || ''
                        });
                    } else {
                        // Fallback to LocalStorage (User's last choice on this machine)
                        const savedStaff = localStorage.getItem(`staff_prefs_${headerData.date}`);
                        if (savedStaff) {
                            try {
                                const parsed = JSON.parse(savedStaff);
                                setHeaderData(prev => ({
                                    ...prev,
                                    tmName: parsed.tmName || '',
                                    tvName: parsed.tvName || '',
                                    tnName: parsed.tnName || ''
                                }));
                                // Sync back to DB (Both Global and Patient-Specific)
                                await medicalService.saveGlobalStaffing(headerData.date, parsed.tmName, parsed.tvName, parsed.tnName);
                                await medicalService.saveDailyStaffing({
                                    residentId: headerData.patientId,
                                    date: headerData.date,
                                    tmNurse: parsed.tmName || '',
                                    tvNurse: parsed.tvName || '',
                                    tnNurse: parsed.tnName || ''
                                });
                            } catch (e) { /* ignore */ }
                        }
                    }
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

                // GLOBAL PERSISTENCE: Save to Master record for the day
                // await medicalService.saveGlobalStaffing(
                //     updatedData.date,
                //     updatedData.tmName || '',
                //     updatedData.tvName || '',
                //     updatedData.tnName || ''
                // );

                // DATA PERSISTENCE: Save as "default" for this day in localStorage
                // This allows auto-filling for other patients
                // const currentPrefs = {
                //     tmName: updatedData.tmName,
                //     tvName: updatedData.tvName,
                //     tnName: updatedData.tnName
                // };
                // localStorage.setItem(`staff_prefs_${updatedData.date}`, JSON.stringify(currentPrefs));

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
        const row = medicationsRef.current[index];
        if (!headerData.patientId || !headerData.date) return;
        if (!row.medicamento) return; // Need at least a name

        try {
            const payload = {
                resident_id: headerData.patientId,
                date: headerData.date,
                medicamento: row.medicamento,
                dosis: row.dosis,
                via: row.via,
                dose1_time: row.dose1Time || null,
                dose2_time: row.dose2Time || null,
                dose3_time: row.dose3Time || null,
                dose4_time: row.dose4Time || null,
                observacion: row.observacion,
                recorded_by: user?.id
            };

            let newId = row.id;

            // Audit Logic is handled separately (toggleCheck), but if we save the row, we might need to preserve current state.
            // Actually, audit columns are likely updated via a separate endpoint or we need to include them here?
            // "Toggle Check" will be an independent action.
            // However, saveMedication persists the main data.
            // We should include audit columns in payload if we want to support saving them here too,
            // but the requirement implies "Check" is a specific action.
            // For now, let's include them in update payload to prevent overwriting with null if trigger updates row.

            // Wait, saveMedication is called on Blur of text inputs.
            // We shouldn't change audit state here. The DB value should persist.
            // But if we send the payload, we must ensure we don't accidentally clear them if we didn't include them in types.
            // Supabase update only updates specified columns.
            // Payload above (lines 526-538) DOES NOT include dose1_checker etc.
            // So they won't be touched. SAFE.

            if (row.id && !row.id.startsWith('temp-')) {
                // Update
                const { error } = await supabase.from('medications').update(payload).eq('id', row.id);
                if (error) throw error;
            } else {
                // Insert
                const { data, error } = await supabase.from('medications').insert(payload).select().single();
                if (error) throw error;
                if (data) {
                    newId = data.id;
                    const newMeds = [...medications];
                    newMeds[index].id = newId;
                    setMedications(newMeds);
                }
            }

            // Add to autocomplete library
            if (row.medicamento && row.medicamento.length > 2) {
                medicalService.addToLibrary(row.medicamento).catch(err => console.error("Auto-learn failed", err));
            }

            console.log('Medication row saved');
            showToast('Medicamento guardado');
        } catch (error) {
            console.error('Error saving medication:', error);
            showToast('Error al guardar', 'error');
        }
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const newMeds = [...medications];
        (newMeds[index] as any)[field] = value;
        setMedications(newMeds);
        medicationsRef.current = newMeds; // Update ref immediately for instant blur saves
    };

    const addMedicationRow = () => {
        setMedications(prev => [
            ...prev,
            {
                id: `temp-${prev.length}`,
                medicamento: '',
                dosis: '',
                via: '',
                observacion: '',
                dose1Time: '',
                dose2Time: '',
                dose3Time: '',
                dose4Time: '',
                dose1Checker: '',
                dose1CheckTime: '',
                dose1Status: false,
                dose2Checker: '',
                dose2CheckTime: '',
                dose2Status: false,
                dose3Checker: '',
                dose3CheckTime: '',
                dose3Status: false,
                dose4Checker: '',
                dose4CheckTime: '',
                dose4Status: false
            }
        ]);
    };

    // --- Verification Logic ---

    // Helper to check if row can be edited/checked
    const canToggleCheck = (checkTime: string | undefined, checkerId: string | undefined, doseTime: string | undefined) => {
        // 1. If checked by someone else AND I am not Admin, LOCK IT.
        if (checkerId && checkerId !== user?.id && user?.role !== 'admin') {
            return false;
        }

        // 2. Time Window: 2 Hours (+ grace).
        // If checked, we check against checkTime.
        if (checkTime) {
            const checkedAt = new Date(checkTime).getTime();
            const now = new Date().getTime();
            const diffHours = (now - checkedAt) / (1000 * 60 * 60);

            // If more than 2 hours passed since signing, it's frozen (unless Admin)
            if (diffHours > 2 && user?.role !== 'admin') {
                return false;
            }
        } else {
            // If NOT checked, we check if we are allowed to sign NOW.
            // Ideally we'd check against "Shift End", but we use "Time of Dose" inference or just allow signing anytime?
            // User Requirement: "Los enfermeros solo tienen 2 horas despues de acabar su turno".
            // Since we don't have shift schedules, we'll allow signing, but once signed, the clock starts?
            // Or maybe we strictly check the "Dose Time"?
            // Let's implement: If dose has a time (e.g. 08:00), check if NOW is within reasonable window?
            // For now, simpler "Lock once signed" is safer.
        }

        return true;
    };

    const toggleCheck = async (index: number, doseNum: 1 | 2 | 3 | 4) => {
        const row = medications[index];
        const currentChecker = (row as any)[`dose${doseNum}Checker`];
        const currentCheckTime = (row as any)[`dose${doseNum}CheckTime`];
        const doseTime = (row as any)[`dose${doseNum}Time`];

        if (!canToggleCheck(currentCheckTime, currentChecker, doseTime)) {
            showToast('No tienes permiso o el tiempo ha expirado', 'error');
            return;
        }

        // Determine new state
        const isChecked = !!currentChecker;
        const newStatus = !isChecked;

        // Optimistic Update
        const newMeds = [...medications];
        const targetRow = newMeds[index];

        if (newStatus) {
            // CHECKING
            (targetRow as any)[`dose${doseNum}Checker`] = user?.id;
            (targetRow as any)[`dose${doseNum}CheckTime`] = new Date().toISOString();
            (targetRow as any)[`dose${doseNum}Status`] = true;
        } else {
            // UNCHECKING
            (targetRow as any)[`dose${doseNum}Checker`] = null;
            (targetRow as any)[`dose${doseNum}CheckTime`] = null;
            (targetRow as any)[`dose${doseNum}Status`] = false;
        }
        setMedications(newMeds);

        // Persist to DB
        // We only update the specific columns for this dose to be safe
        try {
            const updatePayload: any = {};
            updatePayload[`dose${doseNum}_checker`] = newStatus ? user?.id : null;
            updatePayload[`dose${doseNum}_check_time`] = newStatus ? new Date().toISOString() : null;
            updatePayload[`dose${doseNum}_status`] = newStatus;

            const { error } = await supabase
                .from('medications')
                .update(updatePayload)
                .eq('id', row.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating check status:', error);
            showToast('Error al actualizar verificación', 'error');
            // Revert state? Simple reload or complex revert. For now assume success or user will retry.
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white px-1 py-1 md:py-4 md:p-8">
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            {/* Header / Controls - Sticky (Like LogbookDashboard) */}
            {/* Part 1: Header / Controls / Mobile Condition - ALWAYS STICKY */}
            <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xs mb-0 md:mb-0 -mx-1 md:-mx-8 px-1 md:px-8 py-1 md:py-2">
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
                                        setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', observacion: '', dose1Time: '', dose2Time: '', dose3Time: '', dose4Time: '' })));
                                        setShowExtraDose(false);


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
                                <label className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-0.5">
                                    Fecha ({medicalService.formatDateToDMY(headerData.date)})
                                </label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            // IMMEDIATE RESET
                                            setVitals(defaultVitalTimes.map(time => ({ time, ta: '', fc: '', fr: '', temp: '', sato2: '', dxtx: '' })));
                                            setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', observacion: '', dose1Time: '', dose2Time: '', dose3Time: '', dose4Time: '' })));
                                            setShowExtraDose(false);


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
                                            setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', observacion: '', dose1Time: '', dose2Time: '', dose3Time: '', dose4Time: '' })));
                                            setShowExtraDose(false);

                                            handleHeaderChange('date', e.target.value);
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            // IMMEDIATE RESET
                                            setVitals(defaultVitalTimes.map(time => ({ time, ta: '', fc: '', fr: '', temp: '', sato2: '', dxtx: '' })));
                                            setMedications(Array(3).fill(null).map((_, i) => ({ id: `temp-${i}`, medicamento: '', dosis: '', via: '', observacion: '', dose1Time: '', dose2Time: '', dose3Time: '', dose4Time: '' })));
                                            setShowExtraDose(false);

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

                    {/* Condition (Mobile Only - inside Sticky Header) */}
                    <div className="md:hidden">
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
                    </div>
                </div>
            </div>

            {/* Part 2: Notes / Desktop Condition - STATIC (Scrolls away) */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm mb-2 md:mb-4 -mx-1 md:-mx-8 px-1 md:px-8 pt-1 pb-1 md:pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
                    {/* Section 1: Condición (Desktop Static) */}
                    <div className="hidden md:block">
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
                                        <span className="leading-snug py-0.5" title={note.trim()}>{note.trim()}</span>
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

            <div className="max-w-5xl mx-auto w-full space-y-3 md:space-y-6">

                {/* Staff Assignment Section (Collapsed/Optional) */}
                <Card padding="none" className="border border-gray-300 overflow-hidden shadow-sm mb-1 md:mb-4">
                    <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-300">
                        <div className="md:border-b-0 border-r border-gray-300 p-1 md:p-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 md:mb-1">TM Nombre</label>
                            <select
                                value={headerData.tmName}
                                onChange={(e) => handleHeaderChange('tmName', e.target.value)}
                                disabled={user?.role !== 'admin' && user?.role !== 'enfermero'}
                                className={`w-full bg-transparent border-none p-0 text-xs md:text-sm font-medium focus:ring-0 ${user?.role !== 'admin' && user?.role !== 'enfermero' ? 'text-gray-500 cursor-not-allowed' : 'text-gray-700'}`}
                            >
                                <option value="">TM...</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={`${staff.first_name} ${staff.last_name}`}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:border-b-0 border-r border-gray-300 p-1 md:p-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 md:mb-1">TV Nombre</label>
                            <select
                                value={headerData.tvName}
                                onChange={(e) => handleHeaderChange('tvName', e.target.value)}
                                disabled={user?.role !== 'admin' && user?.role !== 'enfermero'}
                                className={`w-full bg-transparent border-none p-0 text-xs md:text-sm font-medium focus:ring-0 ${user?.role !== 'admin' && user?.role !== 'enfermero' ? 'text-gray-500 cursor-not-allowed' : 'text-gray-700'}`}
                            >
                                <option value="">TV...</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={`${staff.first_name} ${staff.last_name}`}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="p-1 md:p-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 md:mb-1">TN Nombre</label>
                            <select
                                value={headerData.tnName}
                                onChange={(e) => handleHeaderChange('tnName', e.target.value)}
                                disabled={user?.role !== 'admin' && user?.role !== 'enfermero'}
                                className={`w-full bg-transparent border-none p-0 text-xs md:text-sm font-medium focus:ring-0 ${user?.role !== 'admin' && user?.role !== 'enfermero' ? 'text-gray-500 cursor-not-allowed' : 'text-gray-700'}`}
                            >
                                <option value="">TN...</option>
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
                <div className="flex border-b border-gray-200 sticky top-[100px] md:static bg-white z-10">
                    <button
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-1.5 md:px-6 py-3 font-medium text-[10px] md:text-sm transition-colors ${activeTab === 'vitals'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('vitals')}
                    >
                        <Activity className="w-3.5 h-3.5 md:w-4 h-4" />
                        <span className="whitespace-normal md:whitespace-nowrap text-center">Signos y Meds</span>
                    </button>
                    <button
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-1.5 md:px-6 py-3 font-medium text-[10px] md:text-sm transition-colors ${activeTab === 'care'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('care')}
                    >
                        <ClipboardList className="w-3.5 h-3.5 md:w-4 h-4" />
                        <span className="whitespace-normal md:whitespace-nowrap text-center">Cuidados</span>
                    </button>
                    <button
                        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-1.5 md:px-6 py-3 font-medium text-[10px] md:text-sm transition-colors ${activeTab === 'sleep'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('sleep')}
                    >
                        <Moon className="w-3.5 h-3.5 md:w-4 h-4" />
                        <span className="whitespace-normal md:whitespace-nowrap text-center">Sueño</span>
                    </button>
                </div>

                {/* Content Section */}
                {
                    activeTab === 'vitals' ? (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Vital Signs Table */}
                            <div className="space-y-1 md:space-y-2">
                                <h3 className="text-sm md:text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-0.5 md:pb-1 inline-block">
                                    Signos Vitales
                                </h3>
                                <Card padding="none" className="border border-gray-300 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-sm">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] md:text-xs">
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 w-14 md:w-24 text-center font-bold">Hora</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 text-center font-bold">T/A</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 text-center font-bold">FC</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 text-center font-bold">FR</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 text-center font-bold">Temp</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 text-center font-bold">Sat O2%</th>
                                                    <th className="border-b border-gray-300 px-1 py-1 md:px-4 md:py-2 text-center font-bold">DxTx</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vitals.map((row, index) => {
                                                    const [sys, dia] = (row.ta || '').split('/');
                                                    return (
                                                        <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} text-xs md:text-sm`}>
                                                            <td className="border-r border-b border-gray-300 px-1 py-0.5 md:px-2 md:py-1 text-center font-bold text-gray-600 bg-gray-50">
                                                                {row.time}
                                                            </td>
                                                            <td className="border-r border-b border-gray-300 p-0">
                                                                <div className="flex items-center justify-center h-full w-full px-1">
                                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        value={sys || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            const newDia = dia || '';
                                                                            handleVitalChange(index, 'ta', `${val}/${newDia}`);
                                                                        }}
                                                                        onBlur={() => saveVitalSign(index)}
                                                                        className="w-10 text-right py-2 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                        placeholder="000"
                                                                    />
                                                                    <span className="text-gray-400 font-bold mx-0.5">/</span>
                                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        value={dia || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            const newSys = sys || '';
                                                                            handleVitalChange(index, 'ta', `${newSys}/${val}`);
                                                                        }}
                                                                        onBlur={() => saveVitalSign(index)}
                                                                        className="w-10 text-left py-2 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                        placeholder="00"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="border-r border-b border-gray-300 p-0">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={row.fc}
                                                                    onChange={(e) => handleVitalChange(index, 'fc', e.target.value)}
                                                                    onBlur={() => saveVitalSign(index)}
                                                                    className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                />
                                                            </td>
                                                            <td className="border-r border-b border-gray-300 p-0">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={row.fr}
                                                                    onChange={(e) => handleVitalChange(index, 'fr', e.target.value)}
                                                                    onBlur={() => saveVitalSign(index)}
                                                                    className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                />
                                                            </td>
                                                            <td className="border-r border-b border-gray-300 p-0">
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={row.temp}
                                                                    onChange={(e) => handleVitalChange(index, 'temp', e.target.value)}
                                                                    onBlur={() => saveVitalSign(index)}
                                                                    className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                />
                                                            </td>
                                                            <td className="border-r border-b border-gray-300 p-0">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={row.sato2}
                                                                    onChange={(e) => handleVitalChange(index, 'sato2', e.target.value)}
                                                                    onBlur={() => saveVitalSign(index)}
                                                                    className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                />
                                                            </td>
                                                            <td className="border-b border-gray-300 p-0">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={row.dxtx}
                                                                    onChange={(e) => handleVitalChange(index, 'dxtx', e.target.value)}
                                                                    onBlur={() => saveVitalSign(index)}
                                                                    className="w-full h-full text-center py-2 px-1 focus:outline-none focus:bg-blue-50 bg-transparent"
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Medications Table */}
                            <div className="space-y-1 md:space-y-2">
                                <h3 className="text-sm md:text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-0.5 md:pb-1 inline-block">
                                    Medicamentos
                                </h3>
                                <Card padding="none" className="border border-gray-300 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1000px] text-sm md:text-base">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-700 uppercase text-[10px] md:text-sm">
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-3 w-auto min-w-[100px] text-left font-bold">Medicamento</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-3 w-16 md:w-24 text-center font-bold">Dosis</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 md:px-4 md:py-3 w-20 md:w-28 text-center font-bold">Vía</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 w-24 md:w-32 text-center font-bold">1ª Dos</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 w-24 md:w-32 text-center font-bold">2ª Dos</th>
                                                    <th className="border-r border-b border-gray-300 px-1 py-1 w-24 md:w-32 text-center font-bold">3ª Dos</th>
                                                    {showExtraDose ? (
                                                        <th className="border-r border-b border-gray-300 px-1 py-1 w-24 md:w-32 text-center font-bold relative group">
                                                            4ª Dos
                                                            <button
                                                                onClick={() => setShowExtraDose(false)}
                                                                className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-0.5 hover:bg-red-200"
                                                                title="Ocultar columna"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </th>
                                                    ) : (
                                                        <th className="border-r border-b border-gray-300 px-1 py-1 w-8 md:w-10 text-center bg-gray-50 p-0">
                                                            <button
                                                                onClick={() => setShowExtraDose(true)}
                                                                className="w-full h-full flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                                                                title="Agregar 4ª Dosis"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </th>
                                                    )}
                                                    <th className="border-b border-gray-300 px-1 py-1 md:px-4 md:py-3 text-center font-bold min-w-[120px]">Obs</th>
                                                    <th className="border-b border-gray-300 px-1 py-1 w-10 md:w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {medications.map((row, index) => (
                                                    <tr key={row.id} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                        <td className="border-r border-b border-gray-300 p-0 h-10">
                                                            <AutocompleteInput
                                                                value={row.medicamento}
                                                                onChange={(val) => handleMedicationChange(index, 'medicamento', val)}
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
                                                                <option value=""></option>
                                                                <option value="oral">Oral</option>
                                                                <option value="intramuscular">Intramuscular</option>
                                                                <option value="intravenosa">Intravenosa</option>
                                                                <option value="subcutanea">Subcutanea</option>
                                                                <option value="oftalmologica">Oftalmologica</option>
                                                                <option value="otra">Otra</option>
                                                            </select>
                                                        </td>
                                                        {/* Dose 1 */}
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <div className="flex items-center justify-between py-1 px-3 gap-4">
                                                                <div className="flex-1">
                                                                    <TimeSelect
                                                                        value={row.dose1Time}
                                                                        onChange={(e) => handleMedicationChange(index, 'dose1Time', e.target.value)}
                                                                        onBlur={() => saveMedication(index)}
                                                                        disabled={!!row.dose1Checker && row.dose1Checker !== user?.id && user?.role !== 'admin'}
                                                                        className="w-full min-w-[65px]"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!row.dose1Status}
                                                                    onChange={() => toggleCheck(index, 1)}
                                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-auto"
                                                                    disabled={!canToggleCheck(row.dose1CheckTime, row.dose1Checker, row.dose1Time)}
                                                                    title={row.dose1Checker ? `Verificado por ${row.dose1Checker}` : "Verificar dosis"}
                                                                />
                                                            </div>
                                                        </td>
                                                        {/* Dose 2 */}
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <div className="flex items-center justify-between py-1 px-3 gap-4">
                                                                <div className="flex-1">
                                                                    <TimeSelect
                                                                        value={row.dose2Time}
                                                                        onChange={(e) => handleMedicationChange(index, 'dose2Time', e.target.value)}
                                                                        onBlur={() => saveMedication(index)}
                                                                        disabled={!!row.dose2Checker && row.dose2Checker !== user?.id && user?.role !== 'admin'}
                                                                        className="w-full min-w-[65px]"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!row.dose2Status}
                                                                    onChange={() => toggleCheck(index, 2)}
                                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-auto"
                                                                    disabled={!canToggleCheck(row.dose2CheckTime, row.dose2Checker, row.dose2Time)}
                                                                    title={row.dose2Checker ? `Verificado por ${row.dose2Checker}` : "Verificar dosis"}
                                                                />
                                                            </div>
                                                        </td>
                                                        {/* Dose 3 */}
                                                        <td className="border-r border-b border-gray-300 p-0">
                                                            <div className="flex items-center justify-between py-1 px-3 gap-4">
                                                                <div className="flex-1">
                                                                    <TimeSelect
                                                                        value={row.dose3Time}
                                                                        onChange={(e) => handleMedicationChange(index, 'dose3Time', e.target.value)}
                                                                        onBlur={() => saveMedication(index)}
                                                                        disabled={!!row.dose3Checker && row.dose3Checker !== user?.id && user?.role !== 'admin'}
                                                                        className="w-full min-w-[65px]"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!row.dose3Status}
                                                                    onChange={() => toggleCheck(index, 3)}
                                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-auto"
                                                                    disabled={!canToggleCheck(row.dose3CheckTime, row.dose3Checker, row.dose3Time)}
                                                                    title={row.dose3Checker ? `Verificado por ${row.dose3Checker}` : "Verificar dosis"}
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Dose 4 (Conditional) */}
                                                        {showExtraDose ? (
                                                            <td className="border-r border-b border-gray-300 p-0">
                                                                <div className="flex items-center justify-between py-1 px-3 gap-4">
                                                                    <div className="flex-1">
                                                                        <TimeSelect
                                                                            value={row.dose4Time || ''}
                                                                            onChange={(e) => handleMedicationChange(index, 'dose4Time', e.target.value)}
                                                                            onBlur={() => saveMedication(index)}
                                                                            disabled={!!row.dose4Checker && row.dose4Checker !== user?.id && user?.role !== 'admin'}
                                                                            className="w-full min-w-[65px]"
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!row.dose4Status}
                                                                        onChange={() => toggleCheck(index, 4)}
                                                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-auto"
                                                                        disabled={!canToggleCheck(row.dose4CheckTime, row.dose4Checker, row.dose4Time)}
                                                                        title={row.dose4Checker ? `Verificado por ${row.dose4Checker}` : "Verificar dosis"}
                                                                    />
                                                                </div>
                                                            </td>
                                                        ) : (
                                                            <td className="border-r border-b border-gray-300 bg-gray-50 p-0"></td>
                                                        )}
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
                                                        <td className="border-b border-gray-300 p-0 h-10 text-center">
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm('¿Eliminar medicamento?')) {
                                                                        if (row.id && !row.id.startsWith('temp-')) {
                                                                            await supabase.from('medications').delete().eq('id', row.id);
                                                                        }
                                                                        const newMeds = medications.filter((_, i) => i !== index);
                                                                        // Ensure we always have at least 3 rows
                                                                        while (newMeds.length < 3) {
                                                                            newMeds.push({
                                                                                id: `temp-${Date.now()}-${newMeds.length}`,
                                                                                medicamento: '',
                                                                                dosis: '',
                                                                                via: '',
                                                                                observacion: '',
                                                                                dose1Time: '',
                                                                                dose2Time: '',
                                                                                dose3Time: '',
                                                                                dose4Time: ''
                                                                            });
                                                                        }
                                                                        setMedications(newMeds);
                                                                    }
                                                                }}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
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

                            {/* Medication History */}
                            <MedicationHistory patientId={headerData.patientId} currentDate={headerData.date} />
                        </div>
                    ) : activeTab === 'care' ? (
                        <div className="space-y-3 md:space-y-6 animate-fadeIn">
                            <NursingClinicalSheet
                                key={`${headerData.patientId}-${headerData.date}`} // Force remount to clear state
                                patientId={headerData.patientId}
                                date={headerData.date}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-6 animate-fadeIn">
                            <SleepDiary
                                key={`${headerData.patientId}-${headerData.date}`}
                                patientId={headerData.patientId}
                                date={headerData.date}
                            />
                        </div>
                    )}

            </div >
            <div className="h-40 md:h-64"></div> {/* Large spacing for vertical scroll */}
        </div >
    );
};
