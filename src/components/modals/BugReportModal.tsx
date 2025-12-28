import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../config/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { getRecentLogs } from '../../utils/logger';

interface BugReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const { user } = useAuthStore();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const logs = getRecentLogs();
            const finalDescription = description + (logs ? `\n\n--- Console Logs ---\n${logs}` : '');

            const { error } = await supabase
                .from('bug_reports')
                .insert({
                    id: crypto.randomUUID(),
                    description: finalDescription,
                    user_id: user?.id,
                    status: 'open'
                });

            if (error) throw error;

            setSubmitSuccess(true);
            setTimeout(() => {
                setSubmitSuccess(false);
                setDescription('');
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error submitting bug report:', error);
            alert('Error submitting report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-white shadow-xl relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase">Report a Bug</h2>
                    <p className="text-sm text-gray-500 mb-6 uppercase">
                        Found an issue? Let us know so we can fix it.
                    </p>

                    {submitSuccess ? (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center uppercase font-medium">
                            Report submitted successfully!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-400"
                                    placeholder="Describe the bug you encountered..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !description.trim()}
                                    className={`flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-sm rounded-lg transition-colors ${(isSubmitting || !description.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Send className="w-4 h-4" />
                                    {isSubmitting ? 'Sending...' : 'Send Report'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Card>
        </div>
    );
};
