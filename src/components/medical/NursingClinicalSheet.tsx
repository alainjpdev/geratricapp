import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { Toast } from '../ui/Toast';
import { TimeSelect } from '../ui/TimeSelect';
import { supabase } from '../../config/supabaseClient';
import { useAuthStore } from '../../store/authStore';

interface NursingClinicalSheetProps {
    patientId: string;
    date: string;
    readOnly?: boolean;
}

// Interfaces for our local state management
interface HygieneItem {
    id?: string;
    date: string;
    time: string;
    observaciones?: string;
}

interface HygieneRow {
    diaper: HygieneItem;
    sheets: HygieneItem;
    bath: HygieneItem;
}

interface FeedingItem {
    id?: string;
    hora: string;
    descripcion: string;
    observaciones: string;
}

interface OutputItem {
    id?: string; // We might need complex ID management here if we split rows
    // Actually, simpler to just map UI rows to database entries if possible, 
    // but schema requires splitting types. 
    // Let's Simplify: We will just save independent records with same timestamp if needed.
    // Or, for the UI, let's treat "Micciones", "Evacuaciones", "Vomito" as independent lists too?
    // The UI shares "Hora" across them. This implies they happened at same time.
    // Let's store specific IDs for each column in the row.
    hora: string;
    micciones: string; miccionesId?: string; miccionesDesc: string;
    evacuaciones: string; evacuacionesId?: string; evacuacionesDesc: string;
    vomito: string; vomitoId?: string; vomitoDesc: string;
}

export const NursingClinicalSheet: React.FC<NursingClinicalSheetProps> = ({ patientId, date, readOnly = false }) => {
    const { user } = useAuthStore();
    // activeField removed

    // 3 Rows for Hygiene (Dynamic)
    const [hygieneRows, setHygieneRows] = useState<HygieneRow[]>(
        Array(3).fill(null).map(() => ({
            diaper: { date: '', time: '', observaciones: '' },
            sheets: { date: '', time: '' },
            bath: { date: '', time: '', observaciones: '' }
        }))
    );

    // Feeding
    const [feeding, setFeeding] = useState<{ [key: string]: FeedingItem }>({
        desayuno: { hora: '', descripcion: '', observaciones: '' },
        comida: { hora: '', descripcion: '', observaciones: '' },
        cena: { hora: '', descripcion: '', observaciones: '' },
    });

    // Outputs - 3 Rows (Dynamic)
    const [outputs, setOutputs] = useState<OutputItem[]>(
        Array(3).fill(null).map(() => ({
            hora: '',
            micciones: '', miccionesDesc: '',
            evacuaciones: '', evacuacionesDesc: '',
            vomito: '', vomitoDesc: ''
        }))
    );

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Fetch Data on Load
    useEffect(() => {
        if (!patientId || !date) return;

        // Reset state immediately to avoid stale data
        setHygieneRows(
            Array(3).fill(null).map(() => ({
                diaper: { date: '', time: '', observaciones: '' },
                sheets: { date: '', time: '' },
                bath: { date: '', time: '', observaciones: '' }
            }))
        );

        setFeeding({
            desayuno: { hora: '', descripcion: '', observaciones: '' },
            comida: { hora: '', descripcion: '', observaciones: '' },
            cena: { hora: '', descripcion: '', observaciones: '' },
        });

        setOutputs(Array(3).fill(null).map(() => ({
            hora: '',
            micciones: '', miccionesDesc: '',
            evacuaciones: '', evacuacionesDesc: '',
            vomito: '', vomitoDesc: ''
        })));

        let mounted = true;

        const fetchData = async () => {
            // 1. Fetch Care Logs (Hygiene)
            const { data: careData } = await supabase
                .from('care_logs')
                .select('*')
                .eq('resident_id', patientId)
                .eq('date', date)
                .order('performed_at', { ascending: true });

            if (!mounted) return;

            // Always start with fresh Hygiene rows based on count
            const newHygiene: HygieneRow[] = [];
            let dIdx = 0, sIdx = 0, bIdx = 0;

            if (careData && careData.length > 0) {
                careData.forEach((log: any) => {
                    const time = log.performed_at ? new Date(log.performed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                    const item = { id: log.id, date: log.date || '', time: time, observaciones: log.notes || '' };

                    // Find first empty slot or push new
                    if (log.category === 'Diaper Change') {
                        while (newHygiene.length <= dIdx) newHygiene.push({ diaper: { date: '', time: '', observaciones: '' }, sheets: { date: '', time: '' }, bath: { date: '', time: '', observaciones: '' } });
                        newHygiene[dIdx++].diaper = item;
                    }
                    if (log.category === 'Sheet Change') {
                        while (newHygiene.length <= sIdx) newHygiene.push({ diaper: { date: '', time: '', observaciones: '' }, sheets: { date: '', time: '' }, bath: { date: '', time: '', observaciones: '' } });
                        newHygiene[sIdx++].sheets = item;
                    }
                    if (log.category === 'Bath') {
                        while (newHygiene.length <= bIdx) newHygiene.push({
                            diaper: { date: '', time: '', observaciones: '' },
                            sheets: { date: '', time: '' },
                            bath: { date: '', time: '', observaciones: '' }
                        });
                        newHygiene[bIdx++].bath = item;
                    }
                });
            }


            // Ensure min 3 rows
            while (newHygiene.length < 3) {
                newHygiene.push({
                    diaper: { date: '', time: '', observaciones: '' },
                    sheets: { date: '', time: '' },
                    bath: { date: '', time: '', observaciones: '' }
                });
            }

            // Set state regardless of data presence to ensure clearing old data
            if (mounted) setHygieneRows(newHygiene);


            // 2. Fetch Nutrition
            const { data: nutData } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('resident_id', patientId)
                .eq('date', date);

            if (!mounted) return;

            // Start with FRESH feeding object
            const newFeeding = {
                desayuno: { hora: '', descripcion: '', observaciones: '' },
                comida: { hora: '', descripcion: '', observaciones: '' },
                cena: { hora: '', descripcion: '', observaciones: '' },
            };

            if (nutData && nutData.length > 0) {
                nutData.forEach((log: any) => {
                    const key = log.meal_type === 'Breakfast' ? 'desayuno' :
                        log.meal_type === 'Lunch' ? 'comida' :
                            log.meal_type === 'Dinner' ? 'cena' : null;
                    if (key && (newFeeding as any)[key]) {
                        (newFeeding as any)[key] = {
                            id: log.id,
                            hora: log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                            descripcion: log.description || '',
                            observaciones: log.notes || ''
                        };
                    }
                });
            }
            if (mounted) setFeeding(newFeeding);

            // 3. Fetch Elimination
            const { data: elimData } = await supabase
                .from('elimination_logs')
                .select('*')
                .eq('resident_id', patientId)
                .eq('date', date)
                .order('logged_at', { ascending: true });

            if (!mounted) return;

            // Build groups from scratch
            const groups: { [time: string]: OutputItem } = {};

            if (elimData && elimData.length > 0) {
                elimData.forEach((log: any) => {
                    const time = log.logged_at ? new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';
                    if (!groups[time]) {
                        groups[time] = { hora: time, micciones: '', miccionesDesc: '', evacuaciones: '', evacuacionesDesc: '', vomito: '', vomitoDesc: '' };
                    }

                    if (log.type === 'Urination') {
                        groups[time].micciones = '✓';
                        groups[time].miccionesDesc = log.characteristics || '';
                        groups[time].miccionesId = log.id;
                    } else if (log.type === 'Bowel Movement') {
                        groups[time].evacuaciones = '✓';
                        groups[time].evacuacionesDesc = log.characteristics || '';
                        groups[time].evacuacionesId = log.id;
                    } else if (log.type === 'Vomit') {
                        groups[time].vomito = '✓';
                        groups[time].vomitoDesc = log.characteristics || '';
                        groups[time].vomitoId = log.id;
                    }
                });
            }

            // Convert map to array and pad
            const newOutputs = Object.values(groups);
            while (newOutputs.length < 3) {
                newOutputs.push({ hora: '', micciones: '', miccionesDesc: '', evacuaciones: '', evacuacionesDesc: '', vomito: '', vomitoDesc: '' });
            }
            // Always set outputs, ensuring reset if no data
            if (mounted) setOutputs(newOutputs);
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [patientId, date]);


    // Persistence Handlers

    // Hygiene
    // Hygiene
    const saveHygiene = async (index: number, type: 'diaper' | 'sheets' | 'bath', overrides?: any) => {
        const row = hygieneRows[index];
        const item = { ...row[type], ...overrides };

        // Only save if we have at least one field? 
        if (!item.time && !item.observaciones) return;

        const categoryMap = { diaper: 'Diaper Change', sheets: 'Sheet Change', bath: 'Bath' };

        // Construct timestamp associated
        const timestamp = item.time ? `${date}T${item.time}:00` : new Date().toISOString();
        // Note: this assumes local time handling, bit loose but ok for MVP.

        const payload = {
            resident_id: patientId,
            category: categoryMap[type],
            date: date, // display date
            performed_at: timestamp,
            notes: item.observaciones || '',
            performed_by: user?.id
        };

        console.log(`[NursingSheet] Saving Hygiene(${type}): `, payload);

        if (item.id) {
            const { error } = await supabase.from('care_logs').update(payload).eq('id', item.id);
            if (error) showToast('Error al guardar', 'error');
            else showToast('Guardado');
        } else {
            const { data, error } = await supabase.from('care_logs').insert(payload).select();
            if (error) {
                showToast('Error al guardar', 'error');
            } else if (data && data[0]) {
                setHygieneRows(prev => {
                    const newRows = [...prev];
                    newRows[index] = { ...newRows[index] };
                    newRows[index][type] = { ...newRows[index][type], id: data[0].id };
                    return newRows;
                });
                showToast('Guardado');
            }
        }
    };

    const handleHygieneChange = (index: number, type: 'diaper' | 'sheets' | 'bath', field: 'date' | 'time' | 'observaciones', value: string) => {
        setHygieneRows(prev => {
            const newRows = [...prev];
            // Create a shallow copy of the row object we are modifying
            newRows[index] = { ...newRows[index] };
            // Create a shallow copy of the specific item (diaper/sheets/bath)
            newRows[index][type] = { ...newRows[index][type], [field]: value };
            return newRows;
        });
    };

    // Feeding
    // Feeding
    const saveFeeding = async (meal: string, overrides?: any) => {
        const currentItem = feeding[meal as keyof typeof feeding];
        const item = { ...currentItem, ...overrides };
        const mealMap = { desayuno: 'Breakfast', comida: 'Lunch', cena: 'Dinner' };

        // If no data, don't save empty records?
        // if (!item.hora && !item.descripcion) return; 

        const timestamp = item.hora ? `${date}T${item.hora}:00` : new Date().toISOString();

        const payload = {
            resident_id: patientId,
            meal_type: mealMap[meal as keyof typeof mealMap],
            date: date,
            logged_at: timestamp,
            description: item.descripcion,
            notes: item.observaciones,
            logged_by: user?.id
        };

        console.log(`[NursingSheet] Saving Feeding(${meal}): `, payload);

        try {
            // First check if a record already exists for this resident+date+meal
            const { data: existingData } = await supabase
                .from('nutrition_logs')
                .select('id')
                .eq('resident_id', patientId)
                .eq('date', date)
                .eq('meal_type', payload.meal_type)
                .maybeSingle();

            let savedId = item.id;

            if (existingData) {
                // UPDATE
                const { error } = await supabase
                    .from('nutrition_logs')
                    .update(payload)
                    .eq('id', existingData.id);

                if (error) throw error;
                savedId = existingData.id;
            } else {
                // INSERT
                const { data: inserted, error } = await supabase
                    .from('nutrition_logs')
                    .insert(payload)
                    .select()
                    .single();

                if (error) throw error;
                savedId = inserted.id;
            }

            if (savedId) {
                setFeeding(prev => ({
                    ...prev,
                    [meal]: { ...prev[meal as keyof typeof feeding], id: savedId }
                }));
            }

            showToast('Nutrición guardada');
        } catch (error) {
            console.error('Error saving nutrition:', error);
            showToast('Error al guardar', 'error');
        }
    };

    const handleFeedingChange = (meal: 'desayuno' | 'comida' | 'cena', field: string, value: string) => {
        setFeeding(prev => ({
            ...prev,
            [meal]: { ...prev[meal], [field]: value }
        }));
    };

    // Output
    // Output
    const saveOutput = async (index: number, type: 'micciones' | 'evacuaciones' | 'vomito', overrides?: any) => {
        const currentRow = outputs[index];
        const row = { ...currentRow, ...overrides };

        // We trigger save on any change? or specific logic?
        // Let's create specific records.
        if (!row[type] && !row[`${type} Desc` as keyof OutputItem]) return;

        const typeMap = { micciones: 'Urination', evacuaciones: 'Bowel Movement', vomito: 'Vomit' };

        const timestamp = row.hora ? `${date}T${row.hora}:00` : new Date().toISOString();

        const payload = {
            resident_id: patientId,
            type: typeMap[type],
            date: date,
            logged_at: timestamp,
            characteristics: row[`${type} Desc` as keyof OutputItem] as string,
            logged_by: user?.id
        };

        console.log(`[NursingSheet] Saving Output(${type}): `, payload);

        const idField = `${type} Id` as keyof OutputItem;
        const existingId = row[idField];

        if (existingId) {
            const { error } = await supabase.from('elimination_logs').update(payload).eq('id', existingId);
            if (error) showToast('Error al guardar', 'error');
            else showToast('Guardado');
        } else {
            const { data, error } = await supabase.from('elimination_logs').insert(payload).select();
            if (error) {
                showToast('Error al guardar', 'error');
            } else if (data && data[0]) {
                const newOutputs = [...outputs];
                (newOutputs[index][idField] as any) = data[0].id; // Type casting bit dirty but functional
                setOutputs(newOutputs);
                showToast('Guardado');
            }
        }
    };

    const handleOutputChange = (index: number, field: string, value: string) => {
        setOutputs(prev => {
            const newOutputs = [...prev];
            newOutputs[index] = { ...newOutputs[index], [field]: value };
            return newOutputs;
        });
    };

    const addHygieneRow = () => {
        setHygieneRows(prev => [...prev, {
            diaper: { date: '', time: '', observaciones: '' },
            sheets: { date: '', time: '' },
            bath: { date: '', time: '', observaciones: '' }
        }]);
    };

    const addOutputRow = () => {
        setOutputs(prev => [...prev, {
            hora: '',
            micciones: '', miccionesDesc: '',
            evacuaciones: '', evacuacionesDesc: '',
            vomito: '', vomitoDesc: ''
        }]);
    };

    return (
        <div className={readOnly ? "space-y-1 md:space-y-2" : "space-y-3 md:space-y-6"}>

            {/* Hygiene Section */}
            <Card padding={readOnly ? 'none' : 'none'} className={`p-0 border border-gray-300 overflow-hidden shadow-sm ${readOnly ? 'bg-white' : ''} md:p-0`}>
                <div className="overflow-x-auto">
                    <table className={`w-full min-w-[600px] ${readOnly ? 'text-xs' : 'text-sm'} border-collapse`}>
                        <thead>
                            <tr className={`bg-gray-100 text-gray-700 uppercase ${readOnly ? 'text-[10px]' : ''}`}>
                                <th colSpan={2} className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'} text-center font-bold`}>Cambio de Pañal</th>
                                <th colSpan={2} className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'} text-center font-bold`}>Baño</th>
                                <th className={`border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'} text-center font-bold`}>Sábanas</th>
                            </tr>
                            <tr className={`bg-gray-50 text-gray-600 uppercase ${readOnly ? 'text-[9px]' : 'text-xs'}`}>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'} w-20 md:w-24`}>Hora</th>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'}`}>Observación</th>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'} w-20 md:w-24`}>Hora</th>
                                <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'}`}>Observación</th>
                                <th className={`border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1'} w-20 md:w-24`}>Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hygieneRows.map((row, index) => (
                                <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} `}>
                                    {/* Diaper */}
                                    <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                        <TimeSelect
                                            value={row.diaper.time}
                                            onChange={(e) => {
                                                handleHygieneChange(index, 'diaper', 'time', e.target.value);
                                                saveHygiene(index, 'diaper', { time: e.target.value });
                                            }}
                                            disabled={readOnly}
                                            className={`text-center p-1 ${readOnly ? 'text-xs h-6' : 'text-base md:text-sm h-10'} border-none shadow-none`}
                                        />
                                    </td>
                                    <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                        <input
                                            type="text"
                                            value={row.diaper.observaciones || ''}
                                            onChange={(e) => handleHygieneChange(index, 'diaper', 'observaciones', e.target.value)}
                                            onBlur={() => saveHygiene(index, 'diaper')}
                                            onKeyDown={(e) => e.key === 'Enter' && saveHygiene(index, 'diaper')}
                                            disabled={readOnly}
                                            className={`w-full h-full px-2 py-1 bg-transparent border-none focus:ring-0 ${readOnly ? 'text-xs truncate' : 'text-base md:text-sm'}`}
                                            placeholder={readOnly ? '' : 'Notas...'}
                                        />
                                    </td>
                                    {/* Bath */}
                                    <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                        <TimeSelect
                                            value={row.bath.time}
                                            onChange={(e) => {
                                                handleHygieneChange(index, 'bath', 'time', e.target.value);
                                                saveHygiene(index, 'bath', { time: e.target.value });
                                            }}
                                            disabled={readOnly}
                                            className={`text-center p-1 ${readOnly ? 'text-xs h-6' : 'text-base md:text-sm h-10'} border-none shadow-none`}
                                        />
                                    </td>
                                    <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                        <input
                                            type="text"
                                            value={row.bath.observaciones || ''}
                                            onChange={(e) => handleHygieneChange(index, 'bath', 'observaciones', e.target.value)}
                                            onBlur={() => saveHygiene(index, 'bath')}
                                            onKeyDown={(e) => e.key === 'Enter' && saveHygiene(index, 'bath')}
                                            disabled={readOnly}
                                            className={`w-full h-full px-2 py-1 bg-transparent border-none focus:ring-0 ${readOnly ? 'text-xs truncate' : 'text-base md:text-sm'}`}
                                            placeholder={readOnly ? '' : 'Notas...'}
                                        />
                                    </td>
                                    {/* Sheets */}
                                    <td className={`border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                        <TimeSelect
                                            value={row.sheets.time}
                                            onChange={(e) => {
                                                handleHygieneChange(index, 'sheets', 'time', e.target.value);
                                                saveHygiene(index, 'sheets', { time: e.target.value });
                                            }}
                                            disabled={readOnly}
                                            className={`text-center p-1 ${readOnly ? 'text-xs h-6' : 'text-base md:text-sm h-10'} border-none shadow-none`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!readOnly && (
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex justify-center">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={addHygieneRow}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1 w-full justify-center"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Fila
                        </Button>
                    </div>
                )
                }
            </Card >

            {/* Feeding Section */}
            <div className={readOnly ? "space-y-1" : "space-y-2"}>
                <h3 className={`${readOnly ? 'text-xs mb-0.5' : 'text-lg mb-2'} font-bold text-gray-800 uppercase border-b border-gray-200 pb-0.5 inline-block tracking-tighter`}>
                    Alimentación
                </h3>
                <Card padding={readOnly ? 'none' : 'md'} className={`p-0 border border-gray-300 overflow-hidden shadow-sm ${readOnly ? 'bg-white' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className={`w-full min-w-[600px] ${readOnly ? 'text-[10px] md:text-xs' : 'text-xs md:text-sm'} border-collapse`}>
                            <thead>
                                <tr className={`bg-gray-100 text-gray-700 uppercase ${readOnly ? 'text-[10px]' : ''}`}>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5 w-20' : 'px-2 py-1 md:px-4 md:py-2 w-32'} font-bold text-left`}>Comida</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5 w-20' : 'px-2 py-1 md:px-4 md:py-2 w-32'} font-bold text-center`}>Hora</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1 md:px-4 md:py-2'} font-bold text-left`}>Descripción</th>
                                    <th className={`border-b border-gray-300 ${readOnly ? 'px-1 py-0.5' : 'px-2 py-1 md:px-4 md:py-2'} font-bold text-left`}>Obs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['desayuno', 'comida', 'cena'].map((meal) => (
                                    <tr key={meal} className="hover:bg-blue-50 bg-white">
                                        <td className={`border-r border-b border-gray-300 ${readOnly ? 'px-1.5 py-1' : 'px-3 py-2'} font-bold text-gray-700 uppercase bg-gray-50`}>
                                            {meal === 'desayuno' ? 'DES' : meal === 'comida' ? 'COM' : 'CEN'}
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                            <TimeSelect
                                                value={feeding[meal].hora}
                                                onChange={(e) => {
                                                    handleFeedingChange(meal as any, 'hora', e.target.value);
                                                    saveFeeding(meal, { hora: e.target.value });
                                                }}
                                                disabled={readOnly}
                                                className={`text-center p-1 ${readOnly ? 'text-xs h-6' : 'text-base md:text-sm h-10'} border-none shadow-none`}
                                            />
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : ''}`}>
                                            <input
                                                type="text"
                                                className={`w-full h-full p-2 border-none focus:ring-0 bg-transparent ${readOnly ? 'text-xs px-2 py-0.5 truncate' : 'text-base md:text-sm'}`}
                                                placeholder={readOnly ? "" : "Descripción de la dieta..."}
                                                value={feeding[meal].descripcion}
                                                disabled={readOnly}
                                                onChange={(e) => handleFeedingChange(meal as any, 'descripcion', e.target.value)}
                                                onBlur={() => saveFeeding(meal)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveFeeding(meal)}
                                            />
                                        </td>
                                        <td className={`border-b border-gray-300 p-0 ${readOnly ? 'h-6' : ''}`}>
                                            <input
                                                type="text"
                                                className={`w-full h-full p-2 border-none focus:ring-0 bg-transparent ${readOnly ? 'text-xs px-2 py-0.5 truncate' : ''}`}
                                                placeholder={readOnly ? "" : "Observaciones..."}
                                                value={feeding[meal].observaciones}
                                                disabled={readOnly}
                                                onChange={(e) => handleFeedingChange(meal as any, 'observaciones', e.target.value)}
                                                onBlur={() => saveFeeding(meal)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveFeeding(meal)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div >

            {/* Output Section */}
            <div className={readOnly ? "space-y-1" : "space-y-2"}>
                <h3 className={`${readOnly ? 'text-xs mb-0.5' : 'text-lg mb-2'} font-bold text-gray-800 uppercase border-b border-gray-200 pb-0.5 inline-block tracking-tighter`}>
                    Eliminación
                </h3>
                <Card padding={readOnly ? 'none' : 'md'} className={`p-0 border border-gray-300 overflow-hidden shadow-sm ${readOnly ? 'bg-white' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className={`w-full min-w-[600px] ${readOnly ? 'text-xs' : 'text-sm'} border-collapse`}>
                            <thead>
                                <tr className={`bg-gray-100 text-gray-700 uppercase ${readOnly ? 'text-[10px]' : ''}`}>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5 w-16' : 'px-2 py-1 w-24'} align-bottom font-bold`}>Hora</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5 w-12' : 'px-2 py-1 w-24'} align-bottom font-bold text-center`}>Mic</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-2 py-1'} align-bottom font-bold text-left`}>Desc</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5 w-12' : 'px-2 py-1 w-24'} align-bottom font-bold text-center`}>Eva</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-2 py-1'} align-bottom font-bold text-left`}>Desc</th>
                                    <th className={`border-r border-b border-gray-300 ${readOnly ? 'px-1 py-0.5 w-12' : 'px-2 py-1 w-24'} align-bottom font-bold text-center`}>Vom</th>
                                    <th className={`border-b border-gray-300 ${readOnly ? 'px-2 py-1' : 'px-2 py-1'} align-bottom font-bold text-left`}>Desc</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outputs.map((row, index) => (
                                    <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} `}>
                                        <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : 'h-10'}`}>
                                            <TimeSelect
                                                value={row.hora}
                                                onChange={(e) => {
                                                    handleOutputChange(index, 'hora', e.target.value);
                                                    saveOutput(index, 'vomito', { hora: e.target.value });
                                                    if (row.micciones) saveOutput(index, 'micciones', { hora: e.target.value });
                                                    if (row.evacuaciones) saveOutput(index, 'evacuaciones', { hora: e.target.value });
                                                    if (row.vomito) saveOutput(index, 'vomito', { hora: e.target.value });
                                                }}
                                                disabled={readOnly}
                                                className={`text-center p-1 ${readOnly ? 'text-xs h-6' : 'text-base md:text-sm h-10'} border-none shadow-none`}
                                            />
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 text-center ${readOnly ? 'h-6' : ''}`}>
                                            <select
                                                value={row.micciones}
                                                onChange={(e) => {
                                                    handleOutputChange(index, 'micciones', e.target.value);
                                                    saveOutput(index, 'micciones', { micciones: e.target.value });
                                                }}
                                                disabled={readOnly}
                                                className={`w-full h-full p-1 text-center border-none bg-transparent focus:outline-none appearance-none cursor-pointer ${readOnly ? 'text-xs px-1 py-0' : 'text-base md:text-sm'}`}
                                            >
                                                <option value="" disabled></option>
                                                <option value="✓">✓</option>
                                                <option value="-">-</option>
                                            </select>
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : ''}`}>
                                            <input type="text" className={`w-full h-full border-none bg-transparent focus:ring-0 ${readOnly ? 'text-xs px-1 py-0 truncate' : 'p-1'}`}
                                                value={row.miccionesDesc}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'miccionesDesc', e.target.value)}
                                                onBlur={() => saveOutput(index, 'micciones')}
                                                onKeyDown={(e) => e.key === 'Enter' && saveOutput(index, 'micciones')}
                                            />
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 text-center ${readOnly ? 'h-6' : ''}`}>
                                            <select
                                                value={row.evacuaciones}
                                                onChange={(e) => {
                                                    handleOutputChange(index, 'evacuaciones', e.target.value);
                                                    saveOutput(index, 'evacuaciones', { evacuaciones: e.target.value });
                                                }}
                                                disabled={readOnly}
                                                className={`w-full h-full p-1 text-center border-none bg-transparent focus:outline-none appearance-none cursor-pointer ${readOnly ? 'text-xs px-1 py-0' : 'text-base md:text-sm'}`}
                                            >
                                                <option value="" disabled></option>
                                                <option value="✓">✓</option>
                                                <option value="-">-</option>
                                            </select>
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 ${readOnly ? 'h-6' : ''}`}>
                                            <input type="text" className={`w-full h-full border-none bg-transparent focus:ring-0 ${readOnly ? 'text-xs px-1 py-0 truncate' : 'p-1'}`}
                                                value={row.evacuacionesDesc}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'evacuacionesDesc', e.target.value)}
                                                onBlur={() => saveOutput(index, 'evacuaciones')}
                                                onKeyDown={(e) => e.key === 'Enter' && saveOutput(index, 'evacuaciones')}
                                            />
                                        </td>
                                        <td className={`border-r border-b border-gray-300 p-0 text-center ${readOnly ? 'h-6' : ''}`}>
                                            <select
                                                value={row.vomito}
                                                onChange={(e) => {
                                                    handleOutputChange(index, 'vomito', e.target.value);
                                                    saveOutput(index, 'vomito', { vomito: e.target.value });
                                                }}
                                                disabled={readOnly}
                                                className={`w-full h-full p-1 text-center border-none bg-transparent focus:outline-none appearance-none cursor-pointer ${readOnly ? 'text-xs px-1 py-0' : 'text-base md:text-sm'}`}
                                            >
                                                <option value="" disabled></option>
                                                <option value="✓">✓</option>
                                                <option value="-">-</option>
                                            </select>
                                        </td>
                                        <td className={`border-b border-gray-300 p-0 ${readOnly ? 'h-6' : ''}`}>
                                            <input type="text" className={`w-full h-full border-none bg-transparent ${readOnly ? 'text-xs px-1 py-0 truncate' : 'p-1'}`}
                                                value={row.vomitoDesc}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'vomitoDesc', e.target.value)}
                                                onBlur={() => saveOutput(index, 'vomito')}
                                                onKeyDown={(e) => e.key === 'Enter' && saveOutput(index, 'vomito')}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!readOnly && (
                        <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex justify-center">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={addOutputRow}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1 w-full justify-center"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Fila de Eliminación
                            </Button>
                        </div>
                    )}
                </Card>
                {
                    toast.visible && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={hideToast}
                        />
                    )
                }
            </div>
        </div>
    );
};
