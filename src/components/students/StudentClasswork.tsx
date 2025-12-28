/**
 * Componente Classwork específico para estudiantes
 * Muestra assignments, quizzes y materials asignados al estudiante
 * Permite enviar respuestas pero no crear/editar/eliminar
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, HelpCircle, Book, X, ExternalLink, Calendar, Users, Award, FolderOpen, CheckCircle2, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getAssignmentsForStudent } from '../../services/assignmentService';
import { getQuizzesForStudent, getQuizByStreamItemId } from '../../services/quizService';
import { getMaterialsForStudent } from '../../services/materialService';
import { getSubmission } from '../../services/submissionService';
import { saveQuizSubmission, getQuizSubmission } from '../../services/quizSubmissionService';
import { AssignmentSubmissionModal } from '../ui/AssignmentSubmissionModal';

interface StudentClassworkProps {
  classId: string;
  className?: string;
}

export const StudentClasswork: React.FC<StudentClassworkProps> = ({ classId, className = '' }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedAssignmentForSubmission, setSelectedAssignmentForSubmission] = useState<any>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [questionId: string]: string }>({});
  const [quizSubmissionStatus, setQuizSubmissionStatus] = useState<string | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);

  useEffect(() => {
    if (user?.id && classId) {
      loadItems();
    }
  }, [classId, user?.id]);

  const loadItems = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Cargar assignments asignados al estudiante en esta clase
      const studentAssignments = await getAssignmentsForStudent(user.id, user.grupoAsignado);
      const assignmentsInClass = studentAssignments.filter(a => a.classId === classId && !a.isArchived);
      
      // Filtrar assignments que ya fueron enviados (submitted, reviewed, graded)
      const assignmentsWithStatus = await Promise.all(
        assignmentsInClass.map(async (assignment) => {
          try {
            const submission = await getSubmission(assignment.id, user.id);
            return {
              ...assignment,
              submissionStatus: submission?.status || null,
            };
          } catch (error) {
            return { ...assignment, submissionStatus: null };
          }
        })
      );
      
      // Solo mostrar assignments que no han sido enviados o están en draft/returned
      const filteredAssignments = assignmentsWithStatus.filter(a => 
        !a.submissionStatus || 
        a.submissionStatus === 'draft' || 
        a.submissionStatus === 'returned'
      );
      setAssignments(filteredAssignments);

      // Cargar quizzes asignados al estudiante en esta clase
      const studentQuizzes = await getQuizzesForStudent(user.id, user.grupoAsignado);
      const quizzesInClass = studentQuizzes.filter(q => q.classId === classId && !q.isArchived);
      
      // Filtrar quizzes que ya fueron enviados (submitted, reviewed, graded)
      const quizzesWithStatus = await Promise.all(
        quizzesInClass.map(async (quiz) => {
          try {
            const submission = await getQuizSubmission(quiz.id, user.id);
            return {
              ...quiz,
              submissionStatus: submission?.status || null,
            };
          } catch (error) {
            return { ...quiz, submissionStatus: null };
          }
        })
      );
      
      // Solo mostrar quizzes que no han sido enviados o están en draft
      const filteredQuizzes = quizzesWithStatus.filter(q => 
        !q.submissionStatus || 
        q.submissionStatus === 'draft'
      );
      setQuizzes(filteredQuizzes);

      // Cargar materials asignados al estudiante en esta clase
      const studentMaterials = await getMaterialsForStudent(user.id, user.grupoAsignado);
      const filteredMaterials = studentMaterials.filter(m => m.classId === classId && !m.isArchived);
      setMaterials(filteredMaterials);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: any) => {
    // Si es un quiz, cargar las preguntas y respuestas existentes
    if (item.type === 'quiz' && item.streamItemId) {
      try {
        const fullQuiz = await getQuizByStreamItemId(item.streamItemId);
        if (fullQuiz) {
          setViewingItem({
            ...item,
            questions: fullQuiz.questions || [],
            points: fullQuiz.points,
            dueDate: fullQuiz.dueDate,
            dueTime: fullQuiz.dueTime,
            description: fullQuiz.description,
          });
          
          // Cargar submission existente si hay
          if (user?.id && item.id) {
            try {
              const submission = await getQuizSubmission(item.id, user.id);
              if (submission) {
                setQuizSubmissionStatus(submission.status);
                if (submission.answers) {
                  setQuizAnswers(submission.answers);
                }
              } else {
                setQuizSubmissionStatus(null);
                setQuizAnswers({});
              }
            } catch (error) {
              console.error('Error loading quiz submission:', error);
              setQuizSubmissionStatus(null);
              setQuizAnswers({});
            }
          }
        } else {
          setViewingItem(item);
        }
      } catch (error) {
        console.error('Error loading quiz questions:', error);
        setViewingItem(item);
      }
    } else {
      setViewingItem(item);
      setQuizAnswers({});
      setQuizSubmissionStatus(null);
    }
    
    // Si es un assignment, verificar si ya hay una submission
    if (item.type === 'assignment' && user?.id && item.id) {
      try {
        const submission = await getSubmission(item.id, user.id);
        if (submission) {
          setSubmissionStatus(submission.status);
        } else {
          setSubmissionStatus(null);
        }
      } catch (error) {
        console.error('Error loading submission:', error);
        setSubmissionStatus(null);
      }
    } else {
      setSubmissionStatus(null);
    }
  };

  const handleSubmitAssignment = (assignment: any) => {
    console.log('🔵 handleSubmitAssignment llamado con:', assignment);
    if (!assignment) {
      console.error('❌ No hay assignment para enviar');
      return;
    }
    if (!assignment.id) {
      console.error('❌ Assignment no tiene ID:', assignment);
      return;
    }
    console.log('🔵 Estado antes de abrir modal - submissionModalOpen:', submissionModalOpen);
    setSelectedAssignmentForSubmission(assignment);
    setSubmissionModalOpen(true);
    console.log('✅ Modal abierto para assignment:', assignment.id);
    // Verificar estado después de un pequeño delay
    setTimeout(() => {
      console.log('🔍 Estado después de abrir - submissionModalOpen debería ser true');
    }, 100);
  };

  // Vista de detalle del item
  if (viewingItem) {
    const isAssignment = viewingItem.type === 'assignment';
    const isQuiz = viewingItem.type === 'quiz';
    const isMaterial = viewingItem.type === 'material';

    return (
      <>
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                setViewingItem(null);
                setQuizAnswers({});
                setQuizSubmissionStatus(null);
                setSubmissionStatus(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Volver</span>
            </button>
            {viewingItem.classId && (
              <button
                onClick={() => {
                  setViewingItem(null);
                  navigate(`/dashboard/classes/${viewingItem.classId}?tab=classwork`);
                }}
                className="px-4 py-2 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ir a la clase
              </button>
            )}
          </div>

          {/* Item completo */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">{viewingItem.title}</h1>

            {/* Class Name */}
            {viewingItem.className && (
              <div className="mb-6">
                <span className="inline-block text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded">
                  {viewingItem.className}
                </span>
              </div>
            )}

            {/* Instructions/Description */}
            {(viewingItem.instructions || viewingItem.description) && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-3">
                  {isQuiz || isMaterial ? 'Descripción' : 'Instrucciones'}
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {viewingItem.instructions || viewingItem.description}
                  </p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {viewingItem.attachments && viewingItem.attachments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Archivos adjuntos</h2>
                <div className="space-y-2">
                  {viewingItem.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id || attachment.url}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name || 'Google Drive file'}
                        </p>
                        {attachment.url && (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {attachment.url}
                          </a>
                        )}
                      </div>
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Abrir
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions (for quizzes) */}
            {isQuiz && viewingItem.questions && viewingItem.questions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Preguntas</h2>
                <div className="space-y-6">
                  {viewingItem.questions.map((q: any, index: number) => (
                    <div key={q.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900">
                          {index + 1}. {q.title}
                        </h3>
                        <span className="text-sm text-gray-500">{q.points} puntos</span>
                      </div>
                      {q.description && (
                        <p className="text-sm text-gray-600 mb-4">{q.description}</p>
                      )}
                      
                      {/* Opciones de respuesta para multiple-choice */}
                      {q.type === 'multiple-choice' && q.options && Array.isArray(q.options) && (
                        <div className="space-y-2 mt-4">
                          {q.options.map((option: string, optIndex: number) => (
                            <label
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                                quizAnswers[q.id] === option
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              } ${quizSubmissionStatus === 'submitted' || quizSubmissionStatus === 'graded' ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={option}
                                checked={quizAnswers[q.id] === option}
                                onChange={(e) => {
                                  if (quizSubmissionStatus !== 'submitted' && quizSubmissionStatus !== 'graded') {
                                    setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value });
                                  }
                                }}
                                disabled={quizSubmissionStatus === 'submitted' || quizSubmissionStatus === 'graded'}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-900 flex-1">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {/* Campo de texto para short-answer */}
                      {q.type === 'short-answer' && (
                        <div className="mt-4">
                          <textarea
                            value={quizAnswers[q.id] || ''}
                            onChange={(e) => {
                              if (quizSubmissionStatus !== 'submitted' && quizSubmissionStatus !== 'graded') {
                                setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value });
                              }
                            }}
                            disabled={quizSubmissionStatus === 'submitted' || quizSubmissionStatus === 'graded'}
                            placeholder="Escribe tu respuesta aquí..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {viewingItem.points !== undefined && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Award className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Puntos</p>
                    <p className="text-2xl font-semibold text-gray-900">{viewingItem.points}</p>
                  </div>
                </div>
              )}

              {viewingItem.dueDate && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de vencimiento</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {new Date(viewingItem.dueDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {viewingItem.dueTime && (
                        <span className="text-base font-normal text-gray-600 block mt-1">
                          a las {viewingItem.dueTime}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Details */}
            {isAssignment && (
              <div className="border-t border-gray-200 pt-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Asignación</h2>
                {viewingItem.assignToAll ? (
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-gray-600" />
                    <span className="text-gray-900 text-lg">Todos los estudiantes</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingItem.assignedGroups && viewingItem.assignedGroups.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Grupos asignados:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingItem.assignedGroups.map((group: string) => (
                            <span key={group} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Author */}
            {viewingItem.author && (
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                  Creado por: <span className="font-medium text-gray-900">{viewingItem.author.name}</span>
                </p>
                {viewingItem.createdAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(viewingItem.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Botones para quiz (guardar borrador y enviar) */}
            {isQuiz && viewingItem.questions && viewingItem.questions.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                {quizSubmissionStatus === 'submitted' || quizSubmissionStatus === 'graded' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          Quiz {quizSubmissionStatus === 'graded' ? 'calificado' : 'enviado'}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {quizSubmissionStatus === 'graded' 
                            ? 'Tu quiz ha sido calificado. Revisa tus resultados.'
                            : 'Tu quiz ha sido enviado. El profesor lo revisará pronto.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!user?.id || !viewingItem.id) return;
                        setSavingQuiz(true);
                        try {
                          await saveQuizSubmission({
                            quizId: viewingItem.id,
                            studentId: user.id,
                            answers: quizAnswers,
                            status: 'draft',
                          });
                          alert('Borrador guardado correctamente');
                        } catch (error) {
                          console.error('Error saving quiz draft:', error);
                          alert('Error al guardar el borrador');
                        } finally {
                          setSavingQuiz(false);
                        }
                      }}
                      disabled={savingQuiz}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingQuiz ? 'Guardando...' : 'Guardar borrador'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!user?.id || !viewingItem.id) return;
                        
                        // Verificar que todas las preguntas requeridas tengan respuesta
                        const requiredQuestions = viewingItem.questions.filter((q: any) => q.required);
                        const unansweredRequired = requiredQuestions.filter((q: any) => !quizAnswers[q.id]);
                        
                        if (unansweredRequired.length > 0) {
                          alert(`Por favor responde todas las preguntas requeridas. Faltan ${unansweredRequired.length} pregunta(s).`);
                          return;
                        }
                        
                        if (!confirm('¿Estás seguro de que deseas enviar el quiz? No podrás modificarlo después.')) {
                          return;
                        }
                        
                        setSavingQuiz(true);
                        try {
                          await saveQuizSubmission({
                            quizId: viewingItem.id,
                            studentId: user.id,
                            answers: quizAnswers,
                            status: 'submitted',
                          });
                          setQuizSubmissionStatus('submitted');
                          alert('Quiz enviado correctamente');
                          loadItems();
                        } catch (error) {
                          console.error('Error submitting quiz:', error);
                          alert('Error al enviar el quiz');
                        } finally {
                          setSavingQuiz(false);
                        }
                      }}
                      disabled={savingQuiz || Object.keys(quizAnswers).length === 0}
                      className="px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingQuiz ? 'Enviando...' : 'Enviar quiz'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botón para enviar respuesta (solo para assignments) */}
            {isAssignment && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                {/* Solo mostrar el botón si no hay submission o si está en estado 'draft' o 'returned' */}
                {(!submissionStatus || submissionStatus === 'draft' || submissionStatus === 'returned') ? (
                  <button
                    onClick={() => handleSubmitAssignment(viewingItem)}
                    className="w-full px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    {submissionStatus === 'draft' ? 'Continuar borrador' : 
                     submissionStatus === 'returned' ? 'Reenviar respuesta' : 
                     'Enviar respuesta'}
                  </button>
                ) : (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5 shadow-md">
                    <div className="flex items-start gap-4">
                      {/* Icono destacado */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        submissionStatus === 'submitted' || submissionStatus === 'to_review' 
                          ? 'bg-blue-100' 
                          : submissionStatus === 'reviewed' 
                          ? 'bg-yellow-100' 
                          : 'bg-green-100'
                      }`}>
                        {submissionStatus === 'submitted' || submissionStatus === 'to_review' ? (
                          <Clock className="w-6 h-6 text-blue-600" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {submissionStatus === 'submitted' ? '✅ Respuesta enviada' :
                             submissionStatus === 'to_review' ? '⏳ En revisión' :
                             submissionStatus === 'reviewed' ? '📝 Revisada por el profesor' :
                             submissionStatus === 'graded' ? '🎯 Calificada' :
                             '✅ Respuesta enviada'}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                          {submissionStatus === 'submitted' ? 'Tu respuesta ha sido enviada exitosamente. El profesor la revisará pronto.' :
                           submissionStatus === 'to_review' ? 'Tu respuesta está siendo revisada por el profesor.' :
                           submissionStatus === 'reviewed' ? 'El profesor ha revisado tu respuesta. Revisa los comentarios si los hay.' :
                           submissionStatus === 'graded' ? 'Tu respuesta ha sido calificada. Revisa tu calificación y comentarios.' :
                           'Tu respuesta ha sido enviada exitosamente.'}
                        </p>
                        <button
                          onClick={() => handleSubmitAssignment(viewingItem)}
                          className="px-4 py-2 text-sm bg-white border-2 border-green-400 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium flex items-center gap-2 shadow-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Ver mi respuesta
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Modal - Renderizado fuera de la vista de detalle */}
      {selectedAssignmentForSubmission && (
        <AssignmentSubmissionModal
          isOpen={submissionModalOpen}
          onClose={() => {
            console.log('🔴 Cerrando modal');
            setSubmissionModalOpen(false);
            setSelectedAssignmentForSubmission(null);
            loadItems();
          }}
          assignmentId={selectedAssignmentForSubmission.id}
          streamItemId={selectedAssignmentForSubmission.streamItemId}
          assignmentTitle={selectedAssignmentForSubmission.title}
          instructions={selectedAssignmentForSubmission.instructions}
          dueDate={selectedAssignmentForSubmission.dueDate}
          dueTime={selectedAssignmentForSubmission.dueTime}
          onSubmitted={async () => {
            await loadItems();
            // Recargar el estado de submission si estamos viendo un assignment
            if (viewingItem?.type === 'assignment' && user?.id && viewingItem?.id) {
              try {
                const submission = await getSubmission(viewingItem.id, user.id);
                if (submission) {
                  setSubmissionStatus(submission.status);
                } else {
                  setSubmissionStatus(null);
                }
              } catch (error) {
                console.error('Error loading submission:', error);
              }
            }
          }}
        />
      )}
      </>
    );
  }

  // Vista de lista
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-medium mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assignments */}
            {assignments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assignments
                </h2>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      onClick={() => handleItemClick({ ...assignment, type: 'assignment' })}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                          {assignment.instructions && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.instructions}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {assignment.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(assignment.dueDate).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  {assignment.dueTime && ` a las ${assignment.dueTime}`}
                                </span>
                              </div>
                            )}
                            {assignment.points !== undefined && (
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>{assignment.points} puntos</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quizzes */}
            {quizzes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Quizzes
                </h2>
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      onClick={() => handleItemClick({ ...quiz, type: 'quiz' })}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            {quiz.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(quiz.dueDate).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  {quiz.dueTime && ` a las ${quiz.dueTime}`}
                                </span>
                              </div>
                            )}
                            {quiz.points !== undefined && (
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>{quiz.points} puntos</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {materials.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Materials
                </h2>
                <div className="space-y-4">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => handleItemClick({ ...material, type: 'material' })}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {assignments.length === 0 && quizzes.length === 0 && materials.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay tareas asignadas</h3>
                <p className="text-gray-600">No hay assignments, quizzes o materials asignados para esta clase</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {selectedAssignmentForSubmission && (
        <>
          {console.log('🎭 Renderizando modal - submissionModalOpen:', submissionModalOpen, 'selectedAssignment:', selectedAssignmentForSubmission.id)}
          <AssignmentSubmissionModal
            isOpen={submissionModalOpen}
            onClose={() => {
              console.log('🔴 Cerrando modal');
              setSubmissionModalOpen(false);
              setSelectedAssignmentForSubmission(null);
              loadItems();
            }}
            assignmentId={selectedAssignmentForSubmission.id}
            streamItemId={selectedAssignmentForSubmission.streamItemId}
            assignmentTitle={selectedAssignmentForSubmission.title}
            instructions={selectedAssignmentForSubmission.instructions}
            dueDate={selectedAssignmentForSubmission.dueDate}
            dueTime={selectedAssignmentForSubmission.dueTime}
            onSubmitted={() => {
              loadItems();
            }}
          />
        </>
      )}
    </div>
  );
};


