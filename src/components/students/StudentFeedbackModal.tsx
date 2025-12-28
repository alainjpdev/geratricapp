import React from 'react';
import { X, CheckCircle, MessageSquare, AlertCircle, FileText } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'assignment' | 'quiz';
    grade: number | null;
    maxPoints: number;
    comments?: string;
    submittedAt?: string;
    status: string;
}

export const StudentFeedbackModal: React.FC<FeedbackModalProps> = ({
    isOpen,
    onClose,
    title,
    type,
    grade,
    maxPoints,
    comments,
    submittedAt,
    status
}) => {
    if (!isOpen) return null;

    const percentage = grade !== null ? (grade / maxPoints) * 100 : 0;

    // Design improvements:
    // - Clean layout
    // - Distinct headers
    // - Clear visual hierarchy

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">

                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-start border-b ${type === 'quiz' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'
                    }`}>
                    <div>
                        <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${type === 'quiz' ? 'text-purple-600' : 'text-blue-600'
                            }`}>
                            {type} Feedback
                        </span>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Score Card */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div>
                            <span className="text-sm text-gray-500 font-medium block">Your Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-gray-900">
                                    {grade !== null ? grade : '--'}
                                </span>
                                <span className="text-sm text-gray-400">/ {maxPoints}</span>
                            </div>
                        </div>
                        {grade !== null && (
                            <div className="text-right">
                                <div className={`text-lg font-bold ${percentage >= 90 ? 'text-green-600' :
                                        percentage >= 70 ? 'text-blue-600' : 'text-yellow-600'
                                    }`}>
                                    {percentage.toFixed(0)}%
                                </div>
                                <span className="text-xs text-gray-400">Percentage</span>
                            </div>
                        )}
                    </div>

                    {/* Status & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                {status === 'reviewed' || status === 'graded' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">Status</span>
                                <span className="text-sm font-medium text-gray-800 capitalize">
                                    {status === 'to_review' ? 'Submitted' : status}
                                </span>
                            </div>
                        </div>
                        {submittedAt && (
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block">Submitted on</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {new Date(submittedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Teacher Feedback Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                            <MessageSquare className="w-4 h-4 text-brand-green-medium" />
                            Teacher Feedback
                        </h3>

                        {comments ? (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                "{comments}"
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                                No written feedback provided.
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};
