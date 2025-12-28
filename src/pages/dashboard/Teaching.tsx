import React, { useEffect, useState } from 'react';
import { ChevronDown, MessageSquare, Star, CheckCircle, User } from 'lucide-react';
import { getAllAssignments } from '../../services/assignmentService';
import { getSubmissionsByAssignment, markAsReviewed } from '../../services/submissionService';
import { getAllQuizzes } from '../../services/quizService';
import { getQuizSubmissionsByQuiz, markQuizAsReviewed } from '../../services/quizSubmissionService';
import { loadClasses } from '../../services/classService';
import { useAuthStore } from '../../store/authStore';
import { ReviewSubmissionModal } from '../../components/ui/ReviewSubmissionModal';

interface TeachingProps {
  classId?: string;
  onClassChange?: (classId: string | 'all') => void;
}

interface SubmissionItem {
  id: string;
  type: 'assignment' | 'quiz';
  itemId: string; // assignmentId or quizId
  itemTitle: string;
  classId?: string;
  className?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  studentGroup?: string;
  content?: string; // For assignments
  answers?: any; // For quizzes
  status: string;
  grade?: number;
  studentComments?: string;
  teacherComments?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export const Teaching: React.FC<TeachingProps> = ({ classId, onClassChange }) => {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all');
  const [classes, setClasses] = useState<Array<{ id: string; title: string }>>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'to-review' | 'reviewed'>('to-review');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  // const [editingSubmission, setEditingSubmission] = useState<{ id: string; grade?: number; teacherComments?: string } | null>(null); // Replaced by modal

  useEffect(() => {
    loadClassesList();
  }, [user?.id]);

  useEffect(() => {
    loadSubmissions();
    const fetchAndLoadSubmissions = async () => {
      const myClassIds = await loadClassesList(); // This will also set the classes state
      loadSubmissions(myClassIds);
    };
    fetchAndLoadSubmissions();
  }, [selectedClass, activeTab, user?.id]);

  const loadClassesList = async () => {
    try {
      if (user?.id) {
        const allClasses = await loadClasses(user.id);
        const myClassIds = allClasses.map((cls: any) => cls.id);
        setClasses(allClasses.map((cls: any) => ({ id: cls.id, title: cls.title })));

        // If admin, return null to indicate no filtering
        if (user.role === 'admin') return null;

        // Pasar los IDs de mis clases a loadSubmissions para filtrar
        return myClassIds;
      }
      return []; // Ensure a return value if user.id is not present
    } catch (err) {
      console.error('Error loading classes:', err);
      return [];
    }
  };

  const loadSubmissions = async (initialClassIds?: string[] | null) => {
    setLoading(true);
    try {
      // 1. Obtener assignments y quizzes
      const allAssignments = await getAllAssignments();
      const allQuizzes = await getAllQuizzes();

      console.log('DEBUG: Loaded all items', {
        assignmentsCount: allAssignments.length,
        quizzesCount: allQuizzes.length
      });

      // Obtener IDs de clases validas (ya sean pasadas o del estado)
      // Si initialClassIds es null (admin), no filtramos por "mis clases"
      const restrictToClassIds = initialClassIds;

      // 2. Filtrar por clase si está seleccionada
      // Si es 'all', mostramos todo (si es admin) o solo lo que pertenezca a mis clases (si es teacher)
      let filteredAssignments = allAssignments;
      let filteredQuizzes = allQuizzes;

      if (selectedClass !== 'all') {
        filteredAssignments = allAssignments.filter((a: any) => a.classId === selectedClass);
        filteredQuizzes = allQuizzes.filter((q: any) => q.classId === selectedClass);
      } else if (restrictToClassIds) {
        // Si es 'all' pero hay restricción de clases (no es admin)
        filteredAssignments = allAssignments.filter((a: any) => restrictToClassIds.includes(a.classId));
        filteredQuizzes = allQuizzes.filter((q: any) => restrictToClassIds.includes(q.classId));
      }

      console.log('DEBUG: Filtered items', {
        selectedClass,
        restrictToClasses: restrictToClassIds ? restrictToClassIds.length : 'ALL (Admin)',
        filteredAssignmentsCount: filteredAssignments.length,
        filteredQuizzesCount: filteredQuizzes.length
      });

      // 3. Obtener submissions
      const allSubmissions: SubmissionItem[] = [];

      // Process Assignments
      for (const assignment of filteredAssignments) {
        try {
          const assignmentSubmissions = await getSubmissionsByAssignment(assignment.id);

          if (assignmentSubmissions.length > 0) {
            console.log(`DEBUG: Fetched ${assignmentSubmissions.length} submissions for assignment ${assignment.id}. ActiveTab: ${activeTab}`);
            assignmentSubmissions.forEach(s => console.log(` - Sub ${s.id}: status=${s.status}`));
          }

          for (const submission of assignmentSubmissions) {
            if ((activeTab === 'to-review' && (submission.status === 'to_review' || submission.status === 'submitted')) ||
              (activeTab === 'reviewed' && (submission.status === 'reviewed' || submission.status === 'graded'))) {

              allSubmissions.push({
                id: submission.id,
                type: 'assignment',
                itemId: assignment.id,
                itemTitle: assignment.title,
                classId: assignment.classId,
                className: assignment.className,
                studentId: submission.studentId,
                studentName: submission.student?.name || 'Estudiante',
                studentAvatar: submission.student?.avatar,
                studentGroup: (submission.student as any)?.group,
                content: submission.content,
                status: submission.status,
                grade: submission.grade || undefined,
                studentComments: submission.studentComments,
                teacherComments: submission.teacherComments,
                submittedAt: submission.submittedAt,
                reviewedAt: submission.reviewedAt,
              });
            }
          }
        } catch (err) {
          console.error(`Error loading submissions for assignment ${assignment.id}:`, err);
        }
      }

      // Process Quizzes
      for (const quiz of filteredQuizzes) {
        try {
          const quizSubmissions = await getQuizSubmissionsByQuiz(quiz.id);

          for (const submission of quizSubmissions) {
            if ((activeTab === 'to-review' && (submission.status === 'to_review' || submission.status === 'submitted')) ||
              (activeTab === 'reviewed' && (submission.status === 'reviewed' || submission.status === 'graded'))) {

              console.log('DEBUG: Found assignment submission to display', {
                id: submission.id,
                status: submission.status,
                activeTab
              });

              allSubmissions.push({
                id: submission.id,
                type: 'quiz',
                itemId: quiz.id,
                itemTitle: quiz.title,
                classId: quiz.classId,
                className: quiz.className,
                studentId: submission.studentId,
                studentName: submission.student?.name || 'Estudiante',
                studentAvatar: submission.student?.avatar,
                studentGroup: (submission.student as any)?.group,
                answers: submission.answers,
                status: submission.status,
                grade: submission.grade || undefined,
                studentComments: submission.studentComments,
                teacherComments: submission.teacherComments,
                submittedAt: submission.submittedAt,
                reviewedAt: submission.reviewedAt,
              });
            }
          }
        } catch (err) {
          console.error(`Error loading submissions for quiz ${quiz.id}:`, err);
        }
      }

      // Ordenar por fecha de envío (más recientes primero)
      allSubmissions.sort((a, b) => {
        if (!a.submittedAt && !b.submittedAt) return 0;
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });

      console.log('DEBUG: Final submissions list', { count: allSubmissions.length });
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classId: string | 'all') => {
    setSelectedClass(classId);
    setClassMenuOpen(false);
    if (onClassChange) {
      onClassChange(classId);
    }
  };

  const handleMarkAsReviewed = async (submissionId: string, type: 'assignment' | 'quiz', grade?: number, teacherComments?: string) => {
    console.log('🏁 handleMarkAsReviewed called with:', { submissionId, type, grade, teacherComments });
    try {
      if (type === 'assignment') {
        console.log('📌 Calling markAsReviewed for assignment');
        await markAsReviewed(submissionId, teacherComments, grade);
      } else {
        console.log('📌 Calling markQuizAsReviewed for quiz');
        await markQuizAsReviewed(submissionId, teacherComments, grade);
      }
      console.log('✅ Marked as reviewed successfully');
      setReviewModalOpen(false);
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (err) {
      console.error('❌ Error marking submission as reviewed:', err);
      alert('Error al marcar como revisado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-medium"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with class filter */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative inline-block">
            <button
              onClick={() => setClassMenuOpen(!classMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700"
            >
              <span>{selectedClass === 'all' ? 'All classes' : classes.find(c => c.id === selectedClass)?.title || 'All classes'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {classMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setClassMenuOpen(false)}
                ></div>
                <div className="absolute left-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                  <button
                    onClick={() => handleClassSelect('all')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedClass === 'all' ? 'text-brand-green-medium font-medium' : 'text-gray-800'
                      }`}
                  >
                    All classes
                  </button>
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => handleClassSelect(cls.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedClass === cls.id ? 'text-brand-green-medium font-medium' : 'text-gray-800'
                        }`}
                    >
                      {cls.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('to-review')}
              className={`py-4 px-1 border-b-2 ${activeTab === 'to-review'
                ? 'border-brand-green-medium text-brand-green-medium'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                } transition-colors text-sm font-medium`}
            >
              To review
            </button>
            <button
              onClick={() => setActiveTab('reviewed')}
              className={`py-4 px-1 border-b-2 ${activeTab === 'reviewed'
                ? 'border-brand-green-medium text-brand-green-medium'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                } transition-colors text-sm font-medium`}
            >
              Reviewed
            </button>
          </nav>
        </div>

        {/* Empty state */}
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg
              viewBox="0 0 210 174"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-48 h-auto mx-auto mb-4 text-gray-400"
              aria-hidden="true"
            >
              <path
                d="M80.7852 170.407L132.959 46.7041M108.555 170.407L131.276 47.5456"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M129.593 169.986L131.219 49.2291M131.276 45.0215L131.219 49.2291M155.259 170.828L131.219 49.2291"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M180.084 172.09L132.538 50.9121"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M67.9948 155.932H6.31178C3.53478 155.932 1.2627 153.66 1.2627 150.883V94.2493C1.2627 91.4723 3.53478 89.2002 6.31178 89.2002H62.9457C65.7227 89.2002 67.9948 91.4723 67.9948 94.2493V155.932Z"
                stroke="#5F6368"
                strokeWidth="2"
                strokeMiterlimit="10"
              />
              <path
                d="M4.88078 154.671C2.18794 154.671 0 152.483 0 149.79V92.8193C0 90.1264 2.18794 87.9385 4.88078 87.9385H61.8513C64.5442 87.9385 66.7321 90.1264 66.7321 92.8193L4.88078 154.671Z"
                fill="#5F6368"
              />
              <path
                d="M208.864 164.6L136.746 39.8031V37.4469C136.746 34.3333 134.222 31.7246 131.024 31.7246C127.91 31.7246 125.302 34.2492 125.302 37.4469V39.8031L53.268 164.6C52.3423 166.199 52.9314 168.134 54.4461 169.06L58.6537 171.5C60.2525 172.426 62.188 171.837 63.1137 170.322L131.024 52.6783L198.934 170.322C199.86 171.921 201.795 172.426 203.394 171.5L207.602 169.06C209.201 168.218 209.79 166.199 208.864 164.6Z"
                fill="#1E8E3E"
              />
              <path
                d="M109.396 6.73214L117.391 5.89062M130.855 26.087C130.855 26.4236 131.136 31.8373 131.276 34.5021"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M147.181 11.2764C147.181 20.1964 139.944 27.4334 131.024 27.4334C122.104 27.4334 114.867 20.1964 114.867 11.2764H147.181Z"
                fill="#CEEAD6"
              />
              <path
                d="M120.505 0C117.392 0 114.867 2.52454 114.867 5.63815V11.2763H126.143V5.63815C126.059 2.52454 123.619 0 120.505 0Z"
                fill="#CEEAD6"
              />
              <path
                d="M128.331 17.251C129.173 18.0925 131.445 19.5231 133.801 18.5132"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M43.7933 59.3332L43.0635 41.584"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M43.2595 49.3815C43.7726 48.0742 44.4317 47.1489 45.6543 46.1489C48.0996 44.1487 50.9918 45.8757 50.769 47.5929C50.6228 48.7195 49.1637 50.7819 47.3131 50.9723C45.1536 51.1946 43.8828 50.8101 43.3699 50.6088"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M43.1922 49.7431C42.7694 48.4039 42.1749 47.4358 41.0233 46.3547C38.72 44.1926 35.7169 45.7184 35.8221 47.4469C35.8911 48.5808 36.4669 50.0443 39.0397 51.0539C41.0605 51.847 42.473 51.1258 42.9985 50.96"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M38.0703 86.6842C46.1057 89.8377 55.1745 85.8841 58.326 77.8537C61.4775 69.8232 57.5183 60.7569 49.483 57.6034C41.4476 54.4499 32.3788 58.4035 29.2273 66.434C26.0757 74.4644 30.0349 83.5308 38.0703 86.6842Z"
                fill="#DADCE0"
              />
              <path
                d="M34.4039 78.6508C35.6111 79.1245 36.3586 77.2197 35.1515 76.7459C33.9443 76.2722 33.1968 78.177 34.4039 78.6508Z"
                fill="#5F6368"
              />
              <path
                d="M38.941 74.9359C40.1482 75.4097 40.8957 73.5048 39.6886 73.0311C38.4814 72.5573 37.7339 74.4622 38.941 74.9359Z"
                fill="#5F6368"
              />
              <path
                d="M42.2525 81.0717C43.4597 81.5454 44.2072 79.6406 43.0001 79.1668C41.7929 78.6931 41.0454 80.598 42.2525 81.0717Z"
                fill="#5F6368"
              />
              <path
                d="M37.5484 82.5961C38.7556 83.0698 39.5031 81.165 38.296 80.6912C37.0888 80.2175 36.3413 82.1224 37.5484 82.5961Z"
                fill="#5F6368"
              />
              <path
                d="M44.1148 56.5226C35.4827 56.2857 28.3179 63.1461 28.0846 71.7742C27.9998 74.2323 28.5478 76.5723 29.5381 78.7195L53.7583 60.1606C51.1074 57.9478 47.8285 56.5878 44.1148 56.5226Z"
                fill="#5F6368"
              />
            </svg>
            <p className="text-xl font-medium text-gray-900 mb-2">
              {activeTab === 'to-review' ? 'Nothing to review right now' : 'No reviewed assignments'}
            </p>
            <p className="text-sm text-gray-600">
              {activeTab === 'to-review'
                ? 'This is where you can track assignments and other work across all your classes'
                : 'Reviewed assignments will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grupo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment/Quiz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comentarios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calificación
                    </th>
                    {activeTab === 'to-review' && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      {/* Estudiante */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {submission.studentAvatar ? (
                            <img
                              src={submission.studentAvatar}
                              alt={submission.studentName}
                              className="h-10 w-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{submission.studentName}</div>
                            {submission.className && (
                              <div className="text-xs text-gray-500">{submission.className}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Grupo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                          {submission.studentGroup || 'N/A'}
                        </span>
                      </td>

                      {/* Assignment/Quiz */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          <span className={`mr-2 px-1.5 py-0.5 text-xs rounded ${submission.type === 'assignment' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {submission.type === 'assignment' ? 'Tarea' : 'Quiz'}
                          </span>
                          {submission.itemTitle}
                        </div>
                        {submission.content && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">
                            {submission.content}
                          </div>
                        )}
                        {submission.answers && (
                          <div className="text-xs text-gray-500 mt-1">
                            {/* Simple display for quiz answers existence */}
                            Respuestas recibidas
                          </div>
                        )}
                      </td>

                      {/* Comentarios */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {submission.studentComments && (
                            <div className="text-xs">
                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <MessageSquare className="w-3 h-3" />
                                <span className="font-medium">Estudiante:</span>
                              </div>
                              <p className="text-gray-700 bg-blue-50 p-2 rounded border border-blue-100">
                                {submission.studentComments}
                              </p>
                            </div>
                          )}
                          {submission.teacherComments && (
                            <div className="text-xs">
                              <div className="flex items-center gap-1 text-gray-600 mb-1">
                                <MessageSquare className="w-3 h-3" />
                                <span className="font-medium">Profesor:</span>
                              </div>
                              <p className="text-gray-700 bg-green-50 p-2 rounded border border-green-100">
                                {submission.teacherComments}
                              </p>
                            </div>
                          )}
                          {!submission.studentComments && !submission.teacherComments && (
                            <span className="text-xs text-gray-400">Sin comentarios</span>
                          )}
                        </div>
                      </td>

                      {/* Calificación */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade !== undefined && submission.grade !== null ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium text-gray-900">{submission.grade}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin calificar</span>
                        )}
                      </td>

                      {/* Acciones (solo para to-review) */}
                      {activeTab === 'to-review' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              console.log('🔘 "Revisar" button clicked for submission:', submission);
                              setSelectedSubmission(submission);
                              setReviewModalOpen(true);
                            }}
                            className="px-4 py-2 bg-brand-green-medium text-white rounded hover:bg-green-700 text-sm flex items-center gap-2 ml-auto"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Revisar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ReviewSubmissionModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          onSave={handleMarkAsReviewed}
        />
      </div>
    </div>
  );
};

