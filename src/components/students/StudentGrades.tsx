import React, { useEffect, useState } from 'react';
import { getStudentGrades, StudentGradeItem } from '../../services/gradeService';
import { useAuthStore } from '../../store/authStore';
import { FileText, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';

import { StudentFeedbackModal } from './StudentFeedbackModal';

interface StudentGradesProps {
    classId: string;
}

export const StudentGrades: React.FC<StudentGradesProps> = ({ classId }) => {
    const { user } = useAuthStore();
    const [grades, setGrades] = useState<StudentGradeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [overallGrade, setOverallGrade] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<StudentGradeItem | null>(null);

    useEffect(() => {
        if (user?.id && classId) {
            loadGrades();
        }
    }, [user, classId]);

    const loadGrades = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await getStudentGrades(classId, user.id);
            setGrades(data);
            calculateOverall(data);
        } catch (error) {
            console.error('Failed to load grades', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateOverall = (items: StudentGradeItem[]) => {
        let totalEarned = 0;
        let totalMax = 0;

        items.forEach(item => {
            if (item.pointsEarned !== null && item.maxPoints > 0) {
                totalEarned += item.pointsEarned;
                totalMax += item.maxPoints;
            }
        });

        if (totalMax > 0) {
            setOverallGrade((totalEarned / totalMax) * 100);
        } else {
            setOverallGrade(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-medium"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Grades</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {grades.length} items graded
                    </p>
                </div>
                <div className="text-right">
                    <div className={`text-3xl font-bold ${overallGrade !== null
                            ? overallGrade >= 90 ? 'text-green-600'
                                : overallGrade >= 80 ? 'text-blue-600'
                                    : overallGrade >= 70 ? 'text-yellow-600'
                                        : 'text-red-600'
                            : 'text-gray-400'
                        }`}>
                        {overallGrade !== null ? `${overallGrade.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">
                        Overall Grade
                    </div>
                </div>
            </div>

            {/* Grades List */}
            <div className="space-y-4">
                {grades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                        No items found for this class.
                    </div>
                ) : (
                    grades.map((item) => (
                        <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => setSelectedItem(item)}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-full h-12 w-12 flex items-center justify-center transition-colors ${item.type === 'quiz'
                                            ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                                            : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                                        }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className="capitalize">{item.type}</span>
                                            <span>•</span>
                                            {item.status === 'reviewed' || item.status === 'graded' ? (
                                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                                    <CheckCircle className="w-3 h-3" /> Graded
                                                </span>
                                            ) : item.status === 'submitted' ? (
                                                <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                    <Clock className="w-3 h-3" /> Submitted
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <AlertCircle className="w-3 h-3" /> {item.status}
                                                </span>
                                            )}
                                        </div>
                                        {item.dueDate && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Due: {new Date(item.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                        {item.pointsEarned !== null ? item.pointsEarned : '—'}
                                        <span className="text-sm text-gray-400 font-normal"> / {item.maxPoints}</span>
                                    </div>
                                    {item.pointsEarned !== null && (
                                        <div className={`text-xs font-bold ${(item.pointsEarned / item.maxPoints) >= 0.9 ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                            {((item.pointsEarned / item.maxPoints) * 100).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            </div>

                            {item.feedback && (
                                <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50 rounded p-3 text-sm text-gray-700 flex gap-2">
                                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold text-gray-900 block mb-1 text-xs uppercase">Feedback:</span>
                                        <span className="line-clamp-2">{item.feedback}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Feedback Modal */}
            {selectedItem && (
                <StudentFeedbackModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    title={selectedItem.title}
                    type={selectedItem.type}
                    grade={selectedItem.pointsEarned}
                    maxPoints={selectedItem.maxPoints}
                    comments={selectedItem.feedback}
                    submittedAt={selectedItem.submittedAt}
                    status={selectedItem.status}
                />
            )}
        </div>
    );
};
