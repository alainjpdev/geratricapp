import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { Toast } from '../ui/Toast';
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
    // Ideally we'd change schema, but let's work with 'saving multiple records'.
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

    // 3 Rows for Hygiene (Dynamic)
    const [hygieneRows, setHygieneRows] = useState<HygieneRow[]>(
        Array(3).fill(null).map(() => ({
            diaper: { date: '', time: '' },
            sheets: { date: '', time: '' },
            bath: { date: '', time: '' }
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
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Fetch Data on Load
    useEffect(() => {
        if (!patientId || !date) return;

        const fetchData = async () => {
            // 1. Fetch Care Logs (Hygiene)
            const { data: careData } = await supabase
                .from('care_logs')
                .select('*')
                .eq('resident_id', patientId)
                .eq('date', date)
                .order('performed_at', { ascending: true });

            // Always start with fresh Hygiene rows based on count
            const newHygiene: HygieneRow[] = [];

            if (careData && careData.length > 0) {
                let dIdx = 0, sIdx = 0, bIdx = 0;
                careData.forEach((log: any) => {
                    const time = log.performed_at ? new Date(log.performed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                    const item = { id: log.id, date: log.date || '', time: time };

                    // Find first empty slot or push new
                    if (log.category === 'Diaper Change') {
                        while (newHygiene.length <= dIdx) newHygiene.push({ diaper: { date: '', time: '' }, sheets: { date: '', time: '' }, bath: { date: '', time: '' } });
                        newHygiene[dIdx++].diaper = item;
                    }
                    if (log.category === 'Sheet Change') {
                        while (newHygiene.length <= sIdx) newHygiene.push({ diaper: { date: '', time: '' }, sheets: { date: '', time: '' }, bath: { date: '', time: '' } });
                        newHygiene[sIdx++].sheets = item;
                    }
                    if (log.category === 'Bath') {
                        while (newHygiene.length <= bIdx) newHygiene.push({ diaper: { date: '', time: '' }, sheets: { date: '', time: '' }, bath: { date: '', time: '' } });
                        newHygiene[bIdx++].bath = item;
                    }
                });
            }


            // Ensure min 3 rows
            while (newHygiene.length < 3) {
                newHygiene.push({ diaper: { date: '', time: '' }, sheets: { date: '', time: '' }, bath: { date: '', time: '' } });
            }

            // Set state regardless of data presence to ensure clearing old data
            setHygieneRows(newHygiene);


            // 2. Fetch Nutrition
            const { data: nutData } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('resident_id', patientId)
                .eq('date', date);

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
            setFeeding(newFeeding);

            // 3. Fetch Elimination
            const { data: elimData } = await supabase
                .from('elimination_logs')
                .select('*')
                .eq('resident_id', patientId)
                .eq('date', date)
                .order('logged_at', { ascending: true });


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
            setOutputs(newOutputs);
        };

        fetchData();
    }, [patientId, date]);


    // Persistence Handlers

    // Hygiene
    const saveHygiene = async (index: number, type: 'diaper' | 'sheets' | 'bath') => {
        const row = hygieneRows[index];
        const item = row[type];

        // Only save if we have at least one field? 
        if (!item.time) return;

        const categoryMap = { diaper: 'Diaper Change', sheets: 'Sheet Change', bath: 'Bath' };

        // Construct timestamp associated
        const timestamp = item.time ? `${date}T${item.time}:00` : new Date().toISOString();
        // Note: this assumes local time handling, bit loose but ok for MVP.

        const payload = {
            resident_id: patientId,
            category: categoryMap[type],
            date: date, // display date
            performed_at: timestamp,
            performed_by: user?.id
        };

        console.log(`[NursingSheet] Saving Hygiene (${type}):`, payload);

        if (item.id) {
            const { error } = await supabase.from('care_logs').update(payload).eq('id', item.id);
            if (error) showToast('Error al guardar', 'error');
            else showToast('Guardado');
        } else {
            const { data, error } = await supabase.from('care_logs').insert(payload).select();
            if (error) {
                showToast('Error al guardar', 'error');
            } else if (data && data[0]) {
                const newRows = [...hygieneRows];
                newRows[index][type].id = data[0].id;
                setHygieneRows(newRows);
                showToast('Guardado');
            }
        }
    };

    const handleHygieneChange = (index: number, type: 'diaper' | 'sheets' | 'bath', field: 'date' | 'time', value: string) => {
        const newRows = [...hygieneRows];
        newRows[index][type][field] = value;
        setHygieneRows(newRows);
    };

    // Feeding
    const saveFeeding = async (meal: string) => {
        const item = feeding[meal as keyof typeof feeding];
        const mealMap = { desayuno: 'Breakfast', comida: 'Lunch', cena: 'Dinner' };

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

        console.log(`[NursingSheet] Saving Feeding (${meal}):`, payload);

        try {
            const { data, error } = await supabase
                .from('nutrition_logs')
                .upsert({
                    ...payload,
                    id: item.id // Include ID if it exists, otherwise undefined is fine for upsert if we rely on constraints? 
                    // Actually, for upsert to work on constraint, we shouldn't pass ID if we want it to find by constraint, 
                    // OR we pass ID if we have it. 
                    // Better: Upsert by the unique constraint columns.
                }, {
                    onConflict: 'resident_id,date,meal_type'
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setFeeding(prev => ({
                    ...prev,
                    [meal]: { ...prev[meal as keyof typeof prev], id: data.id }
                }));
                showToast('Guardado');
            }
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
    const saveOutput = async (index: number, type: 'micciones' | 'evacuaciones' | 'vomito') => {
        const row = outputs[index];
        // We trigger save on any change? or specific logic?
        // Let's create specific records.
        if (!row[type] && !row[`${type}Desc` as keyof OutputItem]) return;

        const typeMap = { micciones: 'Urination', evacuaciones: 'Bowel Movement', vomito: 'Vomit' };

        const timestamp = row.hora ? `${date}T${row.hora}:00` : new Date().toISOString();

        const payload = {
            resident_id: patientId,
            type: typeMap[type],
            date: date,
            logged_at: timestamp,
            characteristics: row[`${type}Desc` as keyof OutputItem] as string,
            logged_by: user?.id
        };

        console.log(`[NursingSheet] Saving Output (${type}):`, payload);

        const idField = `${type}Id` as keyof OutputItem;
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
        const newOutputs = [...outputs];
        (newOutputs[index] as any)[field] = value;
        setOutputs(newOutputs);
    };

    const addHygieneRow = () => {
        setHygieneRows(prev => [...prev, {
            diaper: { date: '', time: '' },
            sheets: { date: '', time: '' },
            bath: { date: '', time: '' }
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
        <div className="space-y-6">

            {/* Hygiene Section */}
            <Card className="p-0 border border-gray-300 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 uppercase">
                                <th className="border-r border-b border-gray-300 px-2 py-1 text-center font-bold">Cambio de Pañal</th>
                                <th className="border-r border-b border-gray-300 px-2 py-1 text-center font-bold">Cambio de Sábanas</th>
                                <th className="border-b border-gray-300 px-2 py-1 text-center font-bold">Baño</th>
                            </tr>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Hora</th>
                                <th className="border-r border-b border-gray-300 px-2 py-1 w-24">Hora</th>
                                <th className="border-b border-gray-300 px-2 py-1 w-24">Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hygieneRows.map((row, index) => (
                                <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    {/* Diaper */}
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="time" className="w-full h-10 border-none p-2 text-base md:text-sm focus:ring-0 bg-transparent text-center"
                                            value={row.diaper.time}
                                            disabled={readOnly}
                                            onChange={(e) => handleHygieneChange(index, 'diaper', 'time', e.target.value)}
                                            onBlur={() => saveHygiene(index, 'diaper')} />
                                    </td>
                                    {/* Sheets */}
                                    <td className="border-r border-b border-gray-300 p-0">
                                        <input type="time" className="w-full h-10 border-none p-2 text-base md:text-sm focus:ring-0 bg-transparent text-center"
                                            value={row.sheets.time}
                                            disabled={readOnly}
                                            onChange={(e) => handleHygieneChange(index, 'sheets', 'time', e.target.value)}
                                            onBlur={() => saveHygiene(index, 'sheets')} />
                                    </td>
                                    {/* Bath */}
                                    <td className="border-b border-gray-300 p-0">
                                        <input type="time" className="w-full h-10 border-none p-2 text-base md:text-sm focus:ring-0 bg-transparent text-center"
                                            value={row.bath.time}
                                            disabled={readOnly}
                                            onChange={(e) => handleHygieneChange(index, 'bath', 'time', e.target.value)}
                                            onBlur={() => saveHygiene(index, 'bath')} />
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
            < div className="space-y-2" >
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
                                                className="w-full h-full min-h-[40px] p-2 text-base md:text-sm border-none focus:ring-0 bg-transparent text-center"
                                                value={feeding[meal].hora}
                                                disabled={readOnly}
                                                onChange={(e) => handleFeedingChange(meal as any, 'hora', e.target.value)}
                                                onBlur={() => saveFeeding(meal)}
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input
                                                type="text"
                                                className="w-full h-full min-h-[40px] p-2 text-base md:text-sm border-none focus:ring-0 bg-transparent"
                                                placeholder={readOnly ? "" : "Descripción de la dieta..."}
                                                value={feeding[meal].descripcion}
                                                disabled={readOnly}
                                                onChange={(e) => handleFeedingChange(meal as any, 'descripcion', e.target.value)}
                                                onBlur={() => saveFeeding(meal)}
                                            />
                                        </td>
                                        <td className="border-b border-gray-300 p-0">
                                            <input
                                                type="text"
                                                className="w-full h-full p-2 border-none focus:ring-0 bg-transparent"
                                                placeholder={readOnly ? "" : "Observaciones..."}
                                                value={feeding[meal].observaciones}
                                                disabled={readOnly}
                                                onChange={(e) => handleFeedingChange(meal as any, 'observaciones', e.target.value)}
                                                onBlur={() => saveFeeding(meal)}
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
                                            <input type="time" className="w-full h-10 p-1 text-base md:text-sm text-center border-none bg-transparent"
                                                value={row.hora}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'hora', e.target.value)}
                                            // Saving entire row vs individual? 
                                            // Trigger saves on all components if we change time? 
                                            // For now, let's just assume time is saved when other fields are saved.
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-10 p-1 text-base md:text-sm text-center border-none bg-transparent"
                                                placeholder={readOnly ? "" : "✓"}
                                                value={row.micciones}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'micciones', e.target.value)}
                                                onBlur={() => saveOutput(index, 'micciones')}
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 border-none bg-transparent"
                                                value={row.miccionesDesc}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'miccionesDesc', e.target.value)}
                                                onBlur={() => saveOutput(index, 'micciones')}
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 text-center border-none bg-transparent"
                                                placeholder={readOnly ? "" : "✓"}
                                                value={row.evacuaciones}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'evacuaciones', e.target.value)}
                                                onBlur={() => saveOutput(index, 'evacuaciones')}
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 border-none bg-transparent"
                                                value={row.evacuacionesDesc}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'evacuacionesDesc', e.target.value)}
                                                onBlur={() => saveOutput(index, 'evacuaciones')}
                                            />
                                        </td>
                                        <td className="border-r border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 text-center border-none bg-transparent"
                                                placeholder={readOnly ? "" : "✓"}
                                                value={row.vomito}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'vomito', e.target.value)}
                                                onBlur={() => saveOutput(index, 'vomito')}
                                            />
                                        </td>
                                        <td className="border-b border-gray-300 p-0">
                                            <input type="text" className="w-full h-full p-1 border-none bg-transparent"
                                                value={row.vomitoDesc}
                                                disabled={readOnly}
                                                onChange={(e) => handleOutputChange(index, 'vomitoDesc', e.target.value)}
                                                onBlur={() => saveOutput(index, 'vomito')}
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
