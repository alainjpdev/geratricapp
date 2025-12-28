import React, { useEffect, useState } from 'react';
import { BookOpen, Send, AlertTriangle, Info, FileText, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { medicalService, NursingNote } from '../../../services/medicalService';
import { residentService, Resident } from '../../../services/residentService';
import { useAuthStore } from '../../../store/authStore';

const LogbookDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [residents, setResidents] = useState<Resident[]>([]);
    const [recentNotes, setRecentNotes] = useState<NursingNote[]>([]);
    const [loading, setLoading] = useState(false);

    // New Note State
    const [selectedResidentId, setSelectedResidentId] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'General' | 'Incident' | 'Medical' | 'Family'>('General');
    const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [resData, notesData] = await Promise.all([
            residentService.getAllResidents(),
            medicalService.getRecentNotes()
        ]);
        setResidents(resData);
        setRecentNotes(notesData);
        if (resData.length > 0) setSelectedResidentId(resData[0].id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !selectedResidentId) return;

        try {
            setLoading(true);
            // Determine shift roughly
            const hour = new Date().getHours();
            const shift = hour < 14 ? 'Morning' : hour < 20 ? 'Afternoon' : 'Night';

            await medicalService.createNote({
                residentId: selectedResidentId,
                authorId: user.id,
                content: content,
                category: category,
                severity: severity,
                shift: shift
            });

            setContent('');
            loadData(); // Reload feed
        } catch (error) {
            alert('Error al crear nota');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                    Bitácora de Enfermería
                </h1>
                <p className="text-gray-500">Registro de incidencias y evolución diaria</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* New Entry Column */}
                <Card className="p-6 flex flex-col h-full overflow-y-auto">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Nueva Entrada</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Residente</label>
                            <select
                                className="w-full rounded border p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                                value={selectedResidentId}
                                onChange={e => setSelectedResidentId(e.target.value)}
                            >
                                {residents.map(r => (
                                    <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoría</label>
                            <div className="flex gap-2 flex-wrap">
                                {(['General', 'Incident', 'Medical', 'Family'] as const).map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCategory(c)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${category === c
                                                ? 'bg-amber-100 border-amber-300 text-amber-800'
                                                : 'bg-white border-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {c === 'Incident' ? 'Incidente' : c === 'Family' ? 'Familiar' : c === 'Medical' ? 'Médico' : 'General'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Severidad</label>
                            <div className="flex gap-2">
                                {(['Low', 'Medium', 'High'] as const).map(s => (
                                    <label key={s} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="severity"
                                            checked={severity === s}
                                            onChange={() => setSeverity(s)}
                                            className="text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className={`text-sm ${s === 'High' ? 'text-red-600 font-bold' :
                                                s === 'Medium' ? 'text-orange-600' :
                                                    'text-gray-600'
                                            }`}>
                                            {s === 'Low' ? 'Baja' : s === 'Medium' ? 'Media' : 'Alta'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Detalle</label>
                            <textarea
                                className="w-full h-full min-h-[150px] rounded border border-gray-300 dark:border-gray-700 p-3 text-sm resize-none focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="Escribe aquí los detalles del evento..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            ></textarea>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                            <Send className="w-4 h-4 mr-2" />
                            {loading ? 'Guardando...' : 'Registrar Nota'}
                        </Button>
                    </form>
                </Card>

                {/* Feed Column */}
                <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">Actividad Reciente</h3>

                    {recentNotes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No hay entradas recientes.</div>
                    ) : (
                        recentNotes.map(note => (
                            <Card key={note.id} className={`p-4 border-l-4 ${note.category === 'Incident' ? 'border-l-red-500' :
                                    note.category === 'Medical' ? 'border-l-blue-500' :
                                        'border-l-gray-300'
                                }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {note.resident?.firstName[0]}{note.resident?.lastName[0]}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 dark:text-white block text-sm">
                                                {note.resident?.firstName} {note.resident?.lastName}
                                            </span>
                                            <span className="text-xs text-gray-500 block">
                                                {new Date(note.createdAt).toLocaleString()} • Por {note.author?.firstName}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${note.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {note.category}
                                    </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap pl-10">
                                    {note.content}
                                </p>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogbookDashboard;
