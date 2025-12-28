import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, MessageSquare, Star, FileText, Link as LinkIcon, AlertTriangle } from 'lucide-react';

interface SubmissionItem {
    id: string;
    type: 'assignment' | 'quiz';
    itemId: string;
    itemTitle: string;
    studentId: string;
    studentName: string;
    studentAvatar?: string;
    content?: string;
    answers?: any;
    status: string;
    grade?: number;
    studentComments?: string;
    teacherComments?: string;
    submittedAt?: string;
}

interface ReviewSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: SubmissionItem | null;
    onSave: (submissionId: string, type: 'assignment' | 'quiz', grade?: number, comments?: string) => Promise<void>;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
    isOpen,
    onClose,
    submission,
    onSave,
}) => {
    const [grade, setGrade] = useState<number | undefined>(undefined);
    const [comments, setComments] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (submission) {
            setGrade(submission.grade);
            setComments(submission.teacherComments || '');
        } else {
            setGrade(undefined);
            setComments('');
        }
    }, [submission]);

    if (!isOpen || !submission) return null;

    const handleSave = async () => {
        console.log('🏁 ReviewSubmissionModal.handleSave called', { submissionId: submission.id, grade, comments });
        setSaving(true);
        try {
            console.log('📌 Calling onSave prop');
            await onSave(submission.id, submission.type, grade, comments);
            console.log('✅ onSave completed successfully - REVIEW SAVED');
            console.log('📝 Saved Details:', { id: submission.id, grade, comments });
            onClose();
        } catch (error) {
            console.error('❌ Error saving grade in modal:', error);
            alert('Error al guardar la calificación');
        } finally {
            setSaving(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {submission.itemTitle}
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${submission.type === 'assignment' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                {submission.type === 'assignment' ? 'Tarea' : 'Quiz'}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">Entregado por:</span>
                            <span className="text-sm font-medium text-gray-700">{submission.studentName}</span>
                            {submission.submittedAt && (
                                <span className="text-xs text-gray-400">
                                    • {new Date(submission.submittedAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Submission Content */}
                    <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100 bg-white">
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">{submission.itemTitle}</h2>
                        </div>

                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            Contenido de la entrega
                        </h3>

                        {submission.content ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {submission.content}
                            </div>
                        ) : submission.type === 'assignment' ? (
                            <div className="text-gray-400 italic flex items-center gap-2 bg-gray-50 p-4 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                Sin contenido de texto
                            </div>
                        ) : null}

                        {/* Placeholder for attachments/links handling if we add them to SubmissionItem later */}

                        {submission.type === 'quiz' && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-purple-800 mb-2 font-medium">Respuestas del Quiz:</p>
                                <pre className="text-xs text-purple-700 overflow-x-auto">
                                    {JSON.stringify(submission.answers, null, 2)}
                                </pre>
                            </div>
                        )}

                        {submission.studentComments && (
                            <div className="mt-6">
                                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    Comentario del estudiante
                                </h4>
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-100">
                                    {submission.studentComments}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Grading Panel */}
                    <div className="w-[350px] bg-gray-50 p-6 flex flex-col overflow-y-auto">
                        <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Evaluación
                        </h3>

                        <div className="space-y-6">
                            {/* Grade Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Calificación
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={grade === undefined ? '' : grade}
                                        onChange={(e) => setGrade(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-medium focus:border-brand-green-medium"
                                        placeholder="0-100"
                                    />
                                    <Star className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            {/* Teacher Comments */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Comentarios privados
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={6}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green-medium focus:border-brand-green-medium text-sm resize-none"
                                    placeholder="Escribe un comentario para el estudiante..."
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    El estudiante recibirá una notificación con tu calificación y comentarios.
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-200">
                            <div className="space-y-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || grade === undefined}
                                    className="w-full py-2.5 px-4 bg-brand-green-medium text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        'Guardando...'
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Calificar y Devolver
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
