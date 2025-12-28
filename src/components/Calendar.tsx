import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { apiClient } from '../services/api';
import { getAllAssignments, getAssignmentsForStudent, getAssignmentByStreamItemId } from '../services/assignmentService';
import { getAllQuizzes, getQuizzesForStudent } from '../services/quizService';
import { getAllMaterials } from '../services/materialService';
import { useAuthStore } from '../store/authStore';
import { loadClasses } from '../services/classService';
import { getSubmission } from '../services/submissionService';
import { getQuizSubmission } from '../services/quizSubmissionService';
import { AssignmentSubmissionModal } from './ui/AssignmentSubmissionModal';

interface CalendarProps {
  classId?: string;
  onClassChange?: (classId: string | 'all') => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'assignment' | 'quiz' | 'material' | 'announcement';
  classId: string;
  className?: string;
  streamItemId?: string;
  submissionStatus?: string | null; // Estado de submission para estudiantes
  pendingReviewCount?: number; // Para docentes
}

export const Calendar: React.FC<CalendarProps> = ({ classId, onClassChange }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Inicializar con la semana actual (Monday to Sunday)
  const getCurrentWeekStart = (): Date => {
    const today = new Date();
    const day = today.getDay();
    // Convertir Sunday (0) a 7 para facilitar el cálculo
    const dayOfWeek = day === 0 ? 7 : day;
    // Calcular cuántos días retroceder para llegar al lunes (Monday = 1)
    const diff = dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all');
  const [classes, setClasses] = useState<Array<{ id: string; title: string }>>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

  useEffect(() => {
    loadClassesData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentWeek, selectedClass]);

  const loadClassesData = async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user?.id) return;

      const classesData = await loadClasses(user.id);
      setClasses(classesData.map((cls: any) => ({ id: cls.id, title: cls.title || cls.subject || 'Sin nombre' })));
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const allEvents: CalendarEvent[] = [];

      // Cargar assignments con fechas de entrega
      try {
        let assignments;
        // Si es estudiante, usar getAssignmentsForStudent para obtener solo los suyos
        if (user.role === 'student') {
          assignments = await getAssignmentsForStudent(user.id, user.grupoAsignado);
        } else {
          assignments = await getAllAssignments();
        }

        // Para estudiantes, verificar el estado de submission
        const assignmentsWithStatus = await Promise.all(
          assignments.map(async (assignment) => {
            let submissionStatus = null;
            if (user.role === 'student') {
              try {
                const submission = await getSubmission(assignment.id, user.id);
                submissionStatus = submission?.status || null;
              } catch (error) {
                // Si no hay submission, queda como null
              }
            }
            return { ...assignment, submissionStatus };
          })
        );

        assignmentsWithStatus.forEach(assignment => {
          // Filtrar por clase si está seleccionada
          if (selectedClass !== 'all' && assignment.classId !== selectedClass) {
            return;
          }

          // Solo agregar si tiene fecha de entrega y no está archivado
          if (assignment.dueDate && !assignment.isArchived) {
            allEvents.push({
              id: assignment.id,
              title: assignment.title,
              date: assignment.dueDate,
              time: assignment.dueTime,
              type: 'assignment',
              classId: assignment.classId,
              className: assignment.className,
              streamItemId: assignment.streamItemId,
              submissionStatus: assignment.submissionStatus,
              pendingReviewCount: assignment.pendingReviewCount,
            });
          }
        });
      } catch (err) {
        console.error('Error loading assignments:', err);
      }

      // Cargar quizzes con fechas de entrega
      try {
        let quizzes;
        // Si es estudiante, usar getQuizzesForStudent para obtener solo los suyos
        if (user.role === 'student') {
          quizzes = await getQuizzesForStudent(user.id, user.grupoAsignado);
        } else {
          quizzes = await getAllQuizzes();
        }

        // Para estudiantes, verificar el estado de submission
        const quizzesWithStatus = await Promise.all(
          quizzes.map(async (quiz) => {
            let submissionStatus = null;
            if (user.role === 'student') {
              try {
                const submission = await getQuizSubmission(quiz.id, user.id);
                submissionStatus = submission?.status || null;
              } catch (error) {
                // Si no hay submission, queda como null
              }
            }
            return { ...quiz, submissionStatus };
          })
        );

        quizzesWithStatus.forEach(quiz => {
          // Filtrar por clase si está seleccionada
          if (selectedClass !== 'all' && quiz.classId !== selectedClass) {
            return;
          }

          // Solo agregar si tiene fecha de entrega y no está archivado
          if (quiz.dueDate && !quiz.isArchived) {
            allEvents.push({
              id: quiz.id,
              title: quiz.title,
              date: quiz.dueDate,
              time: quiz.dueTime,
              type: 'quiz',
              classId: quiz.classId,
              className: quiz.className,
              streamItemId: quiz.streamItemId,
              submissionStatus: quiz.submissionStatus,
              pendingReviewCount: quiz.pendingReviewCount,
            });
          }
        });
      } catch (err) {
        console.error('Error loading quizzes:', err);
      }

      // Cargar materials (si tienen fechas de entrega en el futuro)
      try {
        const materials = await getAllMaterials();
        materials.forEach(material => {
          // Filtrar por clase si está seleccionada
          if (selectedClass !== 'all' && material.classId !== selectedClass) {
            return;
          }

          // Los materials no tienen fecha de entrega por defecto, pero podemos agregarlos si tienen
          // Por ahora, no los agregamos al calendario ya que no tienen dueDate
        });
      } catch (err) {
        console.error('Error loading materials:', err);
      }

      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    // Convertir Sunday (0) a 7 para facilitar el cálculo
    const dayOfWeek = day === 0 ? 7 : day;
    // Calcular cuántos días retroceder para llegar al lunes (Monday = 1)
    const diff = dayOfWeek - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
  };

  const getWeekDays = (): Date[] => {
    const start = getWeekStart(currentWeek);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDateRange = (): string => {
    const start = getWeekStart(currentWeek);
    const end = getWeekEnd(currentWeek);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const getDayLabel = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(date);
    dayDate.setHours(0, 0, 0, 0);

    const diffTime = dayDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return '';
  };

  const getDayName = (date: Date): string => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Ajustar para que Monday sea el primer día
    const day = date.getDay();
    const dayIndex = day === 0 ? 6 : day - 1; // Sunday (0) -> 6, Monday (1) -> 0, etc.
    return days[dayIndex];
  };

  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const handleClassSelect = (classId: string | 'all') => {
    setSelectedClass(classId);
    setClassMenuOpen(false);
    if (onClassChange) {
      onClassChange(classId);
    }
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr && (selectedClass === 'all' || event.classId === selectedClass);
    });
  };

  const weekDays = getWeekDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDateShort = (date: Date): string => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header with class filter and navigation - estilo Google Classroom */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          {/* Class filter - izquierda */}
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setClassMenuOpen(!classMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 text-sm w-full md:w-auto"
            >
              <span>{selectedClass === 'all' ? 'Todas las clases' : classes.find(c => c.id === selectedClass)?.title || 'Todas las clases'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {classMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setClassMenuOpen(false)}
                ></div>
                <div className="absolute left-0 top-10 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-[200px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => handleClassSelect('all')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedClass === 'all' ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-800'
                      }`}
                  >
                    Todas las clases
                  </button>
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => handleClassSelect(cls.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedClass === cls.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-800'
                        }`}
                    >
                      {cls.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Week navigation - centro */}
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-center">
            <button
              onClick={handlePreviousWeek}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
              {formatDateRange()}
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week view - estilo Google Classroom */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.getTime() === today.getTime();
            const dayLabel = getDayLabel(day);
            const isPast = day < today && !isToday;
            const dayName = getDayName(day).toLowerCase();

            return (
              <section
                key={index}
                className="border-r border-b border-gray-200 bg-white min-h-[400px] flex flex-col"
                role="region"
                aria-labelledby={`day-${index}`}
              >
                {/* Header del día - estilo Google Classroom */}
                <h2 className="px-3 py-2 border-b border-gray-100 bg-gray-50/50" id={`day-${index}`}>
                  <div className="flex flex-col">
                    {/* Fecha corta (ej: "15 dic") */}
                    <span className="text-xs text-gray-600 mb-1 hidden md:block">
                      {formatDateShort(day)}
                    </span>
                    {/* Etiqueta especial (Hoy, Ayer, Mañana) */}
                    {dayLabel && (
                      <span className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                        {dayLabel === 'Today' ? 'Hoy' : dayLabel === 'Yesterday' ? 'Ayer' : dayLabel === 'Tomorrow' ? 'Mañana' : dayLabel}
                      </span>
                    )}
                    <div className="flex flex-col items-start">
                      {/* Día de la semana abreviado */}
                      <span className={`text-xs ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {dayName}
                      </span>
                      {/* Número del día */}
                      {isToday ? (
                        <span className="relative inline-flex items-center justify-center w-7 h-7 text-base font-medium text-blue-600 mt-1">
                          <span className="absolute inset-0 rounded-full bg-blue-100"></span>
                          <span className="relative z-10">{day.getDate()}</span>
                        </span>
                      ) : (
                        <span className={`text-base font-medium mt-1 ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </span>
                      )}
                    </div>
                  </div>
                </h2>

                {/* Área de eventos */}
                <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ) : dayEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      {/* Sin eventos - dejar vacío como Google Classroom */}
                    </div>
                  ) : (
                    dayEvents.map((event) => {
                      const getEventColor = () => {
                        // Si es estudiante y tiene submissionStatus, usar colores según el estado
                        if (user?.role === 'student' && event.submissionStatus) {
                          // Estados que indican que ya fue enviado/revisado/calificado
                          if (['submitted', 'to_review', 'reviewed', 'graded'].includes(event.submissionStatus)) {
                            // Verde para enviado/revisado/calificado
                            if (event.type === 'assignment') {
                              return 'bg-green-50 border-l-4 border-green-500 text-green-900 hover:bg-green-100';
                            } else if (event.type === 'quiz') {
                              return 'bg-green-50 border-l-4 border-green-500 text-green-900 hover:bg-green-100';
                            }
                          } else if (event.submissionStatus === 'draft' || event.submissionStatus === 'returned') {
                            // Amarillo para borrador o devuelto (pendiente de acción)
                            if (event.type === 'assignment') {
                              return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900 hover:bg-yellow-100';
                            } else if (event.type === 'quiz') {
                              return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900 hover:bg-yellow-100';
                            }
                          }
                        }

                        // Colores por defecto según tipo (para no estudiantes o sin submission)
                        switch (event.type) {
                          case 'assignment':
                            // Azul para pendiente (sin submission o no estudiante)
                            return 'bg-blue-50 border-l-4 border-blue-500 text-blue-900 hover:bg-blue-100';
                          case 'quiz':
                            return 'bg-purple-50 border-l-4 border-purple-500 text-purple-900 hover:bg-purple-100';
                          case 'material':
                            return 'bg-green-50 border-l-4 border-green-500 text-green-900 hover:bg-green-100';
                          default:
                            return 'bg-gray-50 border-l-4 border-gray-400 text-gray-900 hover:bg-gray-100';
                        }
                      };

                      const handleEventClick = async () => {
                        // Si es un assignment y el usuario es estudiante, abrir modal con la submission
                        if (event.type === 'assignment' && user?.role === 'student' && event.streamItemId) {
                          try {
                            const fullAssignment = await getAssignmentByStreamItemId(event.streamItemId);
                            if (fullAssignment) {
                              setViewingAssignment({
                                id: event.id,
                                streamItemId: event.streamItemId,
                                title: event.title,
                                instructions: fullAssignment.instructions,
                                dueDate: event.date,
                                dueTime: event.time,
                              });
                              setSubmissionModalOpen(true);
                            } else {
                              // Si no se puede cargar, navegar a la clase
                              if (event.classId) {
                                navigate(`/dashboard/classes/${event.classId}?tab=classwork`);
                              }
                            }
                          } catch (error) {
                            console.error('Error loading assignment:', error);
                            // Si hay error, navegar a la clase
                            if (event.classId) {
                              navigate(`/dashboard/classes/${event.classId}?tab=classwork`);
                            }
                          }
                        } else {
                          // Para otros tipos o usuarios no estudiantes, navegar normalmente
                          if (event.classId) {
                            navigate(`/dashboard/classes/${event.classId}?tab=classwork`);
                          }
                        }
                      };

                      return (
                        <div
                          key={event.id}
                          onClick={handleEventClick}
                          className={`p-2 rounded text-xs cursor-pointer transition-colors ${getEventColor()}`}
                          title={`${event.title}${event.className ? ` (${event.className})` : ''} - Click para abrir`}
                        >
                          <div className="font-medium truncate flex items-center gap-1">
                            {event.title}
                            {user?.role === 'student' && event.submissionStatus && (
                              <span className="text-[10px] opacity-75">
                                {['submitted', 'to_review', 'reviewed', 'graded'].includes(event.submissionStatus)
                                  ? '✓'
                                  : event.submissionStatus === 'draft'
                                    ? '📝'
                                    : event.submissionStatus === 'returned'
                                      ? '↩'
                                      : ''}
                              </span>
                            )}
                          </div>
                          {event.time && (
                            <div className="text-xs opacity-70 mt-0.5">{event.time}</div>
                          )}
                          {user?.role === 'student' && event.submissionStatus && (
                            <div className="text-[10px] opacity-70 mt-0.5">
                              {['submitted', 'to_review', 'reviewed', 'graded'].includes(event.submissionStatus)
                                ? 'Enviado'
                                : event.submissionStatus === 'draft'
                                  ? 'Borrador'
                                  : event.submissionStatus === 'returned'
                                    ? 'Devuelto'
                                    : 'Pendiente'}
                            </div>
                          )}
                          {/* Badge de pendientes por revisar para docentes */}
                          {user?.role !== 'student' && (event.pendingReviewCount || 0) > 0 && (
                            <div className="absolute top-[-4px] right-[-4px] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                              {event.pendingReviewCount}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Modal para ver assignment enviado */}
      {viewingAssignment && (
        <AssignmentSubmissionModal
          isOpen={submissionModalOpen}
          onClose={() => {
            setSubmissionModalOpen(false);
            setViewingAssignment(null);
          }}
          assignmentId={viewingAssignment.id}
          streamItemId={viewingAssignment.streamItemId}
          assignmentTitle={viewingAssignment.title}
          instructions={viewingAssignment.instructions}
          dueDate={viewingAssignment.dueDate}
          dueTime={viewingAssignment.dueTime}
          onSubmitted={async () => {
            // Recargar eventos después de enviar
            await loadEvents();
          }}
        />
      )}
    </div>
  );
};



