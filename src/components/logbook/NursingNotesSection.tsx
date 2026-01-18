import React, { useEffect, useState } from 'react';
import { Send, AlertTriangle, Info, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { medicalService, NursingNote } from '../../services/medicalService';
import { useAuthStore } from '../../store/authStore';

interface Props {
    residentId: string;
}

const NursingNotesSection: React.FC<Props> = ({ residentId }) => {
    const { user } = useAuthStore();
    const [notes, setNotes] = useState<NursingNote[]>([]);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'General' | 'Incident' | 'Medical' | 'Family'>('General');
    const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');

    useEffect(() => {
        if (residentId) loadNotes();
    }, [residentId]);

    const loadNotes = async () => {
        try {
            const data = await medicalService.getNotesByResident(residentId);
            setNotes(data);
        } catch (error) {
            console.error('Error loading notes', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !residentId) return;

        try {
            setLoading(true);
            const hour = new Date().getHours();
            const shift = hour < 14 ? 'Morning' : hour < 20 ? 'Afternoon' : 'Night';

            await medicalService.createNote({
                residentId: residentId,
                authorId: user.id,
                content: content,
                category: category,
                severity: severity,
                shift: shift
            });

            setContent('');
            loadNotes();
        } catch (error) {
            alert('Error al crear nota');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* New Entry */}
            <Card className="p-6 flex flex-col h-fit lg:h-full lg:overflow-y-auto">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Nueva Nota</h3>
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
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
                            className="w-full h-32 lg:h-full min-h-[150px] rounded border border-gray-300 dark:border-gray-700 p-3 text-sm resize-none focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Escribe aquí los detalles..."
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

            {/* Feed */}
            <div className="lg:col-span-2 space-y-4 lg:overflow-y-auto lg:pr-2 h-full">
                {notes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300">
                        No hay notas registradas para este residente.
                    </div>
                ) : (
                    notes.map(note => (
                        <Card key={note.id} className={`p-4 border-l-4 ${note.category === 'Incident' ? 'border-l-red-500' :
                            note.category === 'Medical' ? 'border-l-blue-500' :
                                'border-l-gray-300'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gray-100 rounded-full">
                                        {note.category === 'Incident' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                                            note.category === 'Medical' ? <Activity className="w-4 h-4 text-blue-500" /> :
                                                <FileText className="w-4 h-4 text-gray-500" />}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white block text-sm">
                                            {new Date(note.createdAt).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-500 block">
                                            Por {note.author?.firstName} {note.author?.lastName} • Turno {note.shift === 'Morning' ? 'Matutino' : note.shift === 'Afternoon' ? 'Vespertino' : 'Nocturno'}
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
    );
};

export default NursingNotesSection;
