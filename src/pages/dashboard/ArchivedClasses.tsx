import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, BookOpen, FileText, HelpCircle, Folder, ExternalLink, ArchiveRestore, Clock, Users, X, FolderOpen, ChevronDown } from 'lucide-react';
import { loadArchivedClasses, unarchiveClass, loadClasses } from '../../services/classService';
import { USE_LOCAL_DB } from '../../config/devMode';
import { localDB } from '../../db/localDB';
import { getArchivedAssignments, unarchiveAssignment, getAssignmentByStreamItemId } from '../../services/assignmentService';
import { loadArchivedStreamItems, unarchiveStreamItem, saveStreamItem } from '../../services/streamService';
import { getQuizByStreamItemId, saveQuiz } from '../../services/quizService';
import { getMaterialByStreamItemId } from '../../services/materialService';
import { useAuthStore } from '../../store/authStore';
import classroomCode from '../../assets/classroom-code.jpg';
import { AssignmentModal, AssignmentData } from '../../components/ui/AssignmentModal';
import { QuizAssignmentModal, QuizData } from '../../components/ui/QuizAssignmentModal';
import { saveAssignment } from '../../services/assignmentService';
import { RefreshCw } from 'lucide-react';

type TabType = 'classes' | 'assignments' | 'quizzes' | 'materials';

interface Class {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  section?: string;
  module?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  updatedAt?: string;
}

interface Assignment {
  id: string;
  streamItemId: string;
  classId: string;
  className: string;
  title: string;
  instructions?: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface StreamItem {
  id: string;
  classId: string;
  className?: string;
  type: 'assignment' | 'quiz' | 'material' | 'announcement';
  title: string;
  content?: string;
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export const ArchivedClasses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('assignments');
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<StreamItem[]>([]);
  const [materials, setMaterials] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{ streamItemId: string; type: 'assignment' | 'quiz' | 'material' } | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: string; title: string; subject?: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Republish states
  const [republishModalOpen, setRepublishModalOpen] = useState(false);
  const [republishQuizModalOpen, setRepublishQuizModalOpen] = useState(false);
  const [pendingRepublish, setPendingRepublish] = useState<{ item: any; type: 'assignment' | 'quiz'; originalStreamItemId?: string; originalClassName?: string } | null>(null);
  const [targetClassForRepublish, setTargetClassForRepublish] = useState<string>('');

  useEffect(() => {
    loadData();
    loadAvailableSubjects();
  }, [activeTab]);

  const loadAvailableSubjects = async () => {
    try {
      if (!user?.id) return;

      let allClasses: any[] = [];

      if (USE_LOCAL_DB) {
        // En modo local, obtener todas las clases (activas y archivadas) directamente de la BD
        const isAdmin = user?.role === 'admin';
        if (isAdmin) {
          allClasses = await localDB.classes.toArray();
        } else {
          allClasses = await localDB.classes
            .where('teacherId')
            .equals(user.id)
            .toArray();
        }
      } else {
        // En modo Supabase, obtener clases activas y archivadas
        const activeClasses = await loadClasses(user.id);
        const archivedClasses = await loadArchivedClasses();
        allClasses = [...activeClasses, ...archivedClasses];
      }

      // Mapear todas las clases disponibles con su título y subject
      const classesList = allClasses
        .filter(cls => !cls.isArchived) // Solo clases activas
        .map(cls => ({
          id: cls.id,
          title: cls.title || cls.subject || 'Sin nombre',
          subject: cls.subject,
        }))
        .sort((a, b) => a.title.localeCompare(b.title));

      console.log('📚 Clases disponibles:', classesList);
      setAvailableClasses(classesList);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'classes') {
        const data = await loadArchivedClasses();
        setClasses(data as unknown as Class[]);
      } else if (activeTab === 'assignments') {
        const data = await getArchivedAssignments();
        setAssignments(data as unknown as Assignment[]);
      } else if (activeTab === 'quizzes') {
        const data = await loadArchivedStreamItems('quiz');
        setQuizzes(data as unknown as StreamItem[]);
      } else if (activeTab === 'materials') {
        const data = await loadArchivedStreamItems('material');
        setMaterials(data as unknown as StreamItem[]);
      }
    } catch (err: any) {
      console.error('Error loading archived items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchiveClass = async (id: string) => {
    if (!confirm('¿Estás seguro de restaurar esta clase?')) return;
    try {
      await unarchiveClass(id);
      await loadData();
    } catch (err) {
      console.error('Error unarchiving class:', err);
      alert('Error al restaurar la clase');
    }
  };

  const handleUnarchiveAssignment = async (streamItemId: string, className?: string) => {
    if (!confirm('¿Estás seguro de restaurar este assignment?')) return;

    // Si NO tiene className o es "Sin clase", mostrar modal para seleccionar clase
    if (!className || className === 'Sin clase' || className.trim() === '') {
      setPendingRestore({ streamItemId, type: 'assignment' });
      setSelectedClassId('');
      setShowSubjectModal(true);
      // Recargar clases disponibles cuando se abre el modal
      loadAvailableSubjects();
      return;
    }

    // Si tiene className válido, restaurar directamente sin mostrar modal
    // La función unarchiveAssignmentLocal creará la clase automáticamente si fue borrada
    try {
      console.log('🔄 Restaurando assignment - streamItemId:', streamItemId, 'className:', className);
      await unarchiveAssignment(streamItemId, className);
      await loadData();
    } catch (err) {
      console.error('Error unarchiving assignment:', err);
      alert('Error al restaurar el assignment');
    }
  };

  const handleConfirmRestore = async () => {
    if ((!pendingRestore && !pendingRepublish) || !selectedClassId.trim()) {
      alert('Por favor, selecciona una clase');
      return;
    }

    // Obtener el nombre de la clase seleccionada
    const selectedClass = availableClasses.find(cls => cls.id === selectedClassId || cls.title === selectedClassId);
    const className = selectedClass?.title || selectedClass?.subject || selectedClassId || 'Sin clase';
    // Si estamos en modo republicación
    if (pendingRepublish) {
      setTargetClassForRepublish(selectedClassId); // Store ID, not name
      // Aquí necesitamos usar el ID real de la clase, no el nombre
      const realClassId = availableClasses.find(c => c.id === selectedClassId)?.id || selectedClassId;
      setTargetClassForRepublish(realClassId);

      setTargetClassForRepublish(realClassId);

      // Removed modal transition logic as updated handleInitRepublish bypasses this
      return;
    }

    try {
      if (pendingRestore) {
        if (pendingRestore.type === 'assignment') {
          await unarchiveAssignment(pendingRestore.streamItemId, className);
        } else {
          await unarchiveStreamItem(pendingRestore.streamItemId, className);
        }
      }
      setShowSubjectModal(false);
      setPendingRestore(null);
      setSelectedClassId('');
      await loadData();
    } catch (err) {
      console.error('Error restoring item:', err);
      alert('Error al restaurar el elemento');
    }
  };

  const handleUnarchiveStreamItem = async (streamItemId: string, className?: string, type: 'quiz' | 'material' = 'quiz') => {
    if (!confirm('¿Estás seguro de restaurar este elemento?')) return;

    // Si NO tiene className o es "Sin clase", mostrar modal para seleccionar clase
    if (!className || className === 'Sin clase' || className.trim() === '') {
      setPendingRestore({ streamItemId, type });
      setSelectedClassId('');
      setShowSubjectModal(true);
      // Recargar clases disponibles cuando se abre el modal
      loadAvailableSubjects();
      return;
    }

    // Si tiene className válido, restaurar directamente sin mostrar modal
    // La función unarchiveStreamItemLocal creará la clase automáticamente si fue borrada
    try {
      console.log('🔄 Restaurando stream item - streamItemId:', streamItemId, 'className:', className);
      await unarchiveStreamItem(streamItemId, className);
      await loadData();
    } catch (err) {
      console.error('Error unarchiving item:', err);
      alert('Error al restaurar el elemento');
    }
  };

  const handleOpenClass = (classId: string) => {
    navigate(`/dashboard/classes/${classId}`);
  };

  const handleOpenGradebook = (classId: string) => {
    navigate(`/dashboard/classes/${classId}?tab=grades`);
  };

  const handleOpenAssignment = (classId: string) => {
    navigate(`/dashboard/classes/${classId}?tab=classwork`);
  };

  const handleViewAssignment = async (assignment: Assignment) => {
    try {
      const fullAssignment = await getAssignmentByStreamItemId(assignment.streamItemId);
      if (fullAssignment) {
        setViewingItem({
          ...assignment,
          ...fullAssignment,
          type: 'assignment',
        });
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
      alert('Error al cargar el assignment.');
    }
  };

  const handleViewQuiz = async (quiz: StreamItem) => {
    try {
      const fullQuiz = await getQuizByStreamItemId(quiz.id);
      if (fullQuiz) {
        setViewingItem({
          ...quiz,
          ...fullQuiz,
          type: 'quiz',
        });
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Error al cargar el quiz.');
    }
  };

  const handleViewMaterial = async (material: StreamItem) => {
    try {
      const fullMaterial = await getMaterialByStreamItemId(material.id);
      if (fullMaterial) {
        setViewingItem({
          ...material,
          ...fullMaterial,
          type: 'material',
        });
      }
    } catch (error) {
      console.error('Error loading material:', error);
      alert('Error al cargar el material.');
    }
  };

  const handleInitRepublish = async (item: Assignment | StreamItem, type: 'assignment' | 'quiz') => {
    // Cargar detalles completos si es necesario
    let fullItem = item;
    try {
      if (type === 'assignment') {
        const details = await getAssignmentByStreamItemId((item as Assignment).streamItemId);
        if (details) fullItem = { ...item, ...details };
      } else if (type === 'quiz') {
        const details = await getQuizByStreamItemId(item.id);
        if (details) fullItem = { ...item, ...details };
      }
    } catch (e) {
      console.error('Error fetching full details for republish:', e);
    }

    // Limpiar datos específicos para la nueva publicación
    const cleanItem = {
      ...fullItem,
      id: undefined, // Asegurar que no tiene ID para que se cree como nuevo
      createdAt: undefined,
      updatedAt: undefined,
      dueDate: undefined,
      dueTime: undefined,
      assignTo: 'all', // Reset assignTo
      selectedStudents: [],
      selectedGroups: [],
    };

    setPendingRepublish({
      item: cleanItem,
      type,
      originalStreamItemId: (item as any).streamItemId || (item as any).stream_item_id || item.id, // Fallback for quiz ID if needed
      originalClassName: (item as any).className
    });
    // Don't show subject modal, open assignment/quiz modal directly
    // Let the modal handle class selection via availableClasses
    loadAvailableSubjects(); // Ensure we have the list
    if (type === 'assignment') {
      setRepublishModalOpen(true);
    } else {
      setRepublishQuizModalOpen(true);
    }
  };

  const handleSaveRepublishAssignment = async (data: AssignmentData) => {
    // data should contain the selected classId now
    const targetClassId = (data as any).classId || targetClassForRepublish;

    if (!targetClassId) {
      alert('Por favor selecciona una clase destino en el formulario.');
      return;
    }

    try {
      console.log('Republicando assignment en clase:', targetClassId);

      // 1. Create a NEW Stream Item for the new class
      const user = useAuthStore.getState().user;
      const newStreamItem = await saveStreamItem({
        classId: targetClassId,
        type: 'assignment',
        title: data.title,
        content: data.instructions || '', // Optional content/description
        authorId: user?.id || 'unknown',
        // attachments: data.attachments // Handle attachments if needed? For now straightforward
      });

      // 2. Save the Assignment with LINK to the new Stream Item
      await saveAssignment({
        ...data,
        streamItemId: newStreamItem.id, // VITAL: Use the new ID
        classId: targetClassId,
        id: undefined
      } as any);

      alert('Assignment republicado exitosamente');
      setRepublishModalOpen(false);

      // Unarchive the original item as requested
      if (pendingRepublish?.originalStreamItemId) {
        try {
          console.log('Desarchivando item original:', pendingRepublish.originalStreamItemId);
          await unarchiveAssignment(pendingRepublish.originalStreamItemId, pendingRepublish.originalClassName);
        } catch (e) {
          console.error('Error desarchivando original:', e);
          // Non-blocking error
        }
      }

      setPendingRepublish(null);
      await loadData(); // Reload to see changes (item removed from list)
    } catch (error) {
      console.error('Error republicando assignment:', error);
      alert('Error al republicar el assignment');
    }
  };

  const handleSaveRepublishQuiz = async (data: QuizData) => {
    const targetClassId = (data as any).classId || targetClassForRepublish;

    if (!targetClassId) {
      alert('Por favor selecciona una clase destino en el formulario.');
      return;
    }

    try {
      console.log('Republicando quiz en clase:', targetClassId);

      // 1. Create a NEW Stream Item for the new class
      const user = useAuthStore.getState().user;
      const newStreamItem = await saveStreamItem({
        classId: targetClassId,
        type: 'quiz',
        title: data.title,
        content: data.description || '', // Quiz description
        authorId: user?.id || 'unknown',
      });

      // 2. Save the Quiz with LINK to the new Stream Item
      await saveQuiz({
        ...data,
        streamItemId: newStreamItem.id, // VITAL: Use the new ID
        classId: targetClassId,
        id: undefined
      } as any);

      setRepublishQuizModalOpen(false);

      // Unarchive the original item
      if (pendingRepublish?.originalStreamItemId) {
        try {
          // For quizzes, we usually use unarchiveStreamItem or unarchiveQuiz
          // archivedClasses uses unarchiveStreamItem for generic or specific?
          // The file imports unarchiveAssignment. We need unarchiveQuiz?
          // archivedClasses uses unarchiveStreamItem(id, className) for quizzes usually?
          // Checking handleConfirmRestore... it uses unarchiveStreamItem.
          await unarchiveStreamItem(pendingRepublish.originalStreamItemId, pendingRepublish.originalClassName);
        } catch (e) {
          console.error('Error desarchivando original:', e);
        }
      }

      setPendingRepublish(null);
      await loadData();
    } catch (error) {
      console.error('Error republicando quiz:', error);
      alert('Error al republicar el quiz');
    }
  };

  const tabs = [
    // { id: 'classes' as TabType, label: 'Clases', icon: BookOpen },
    { id: 'assignments' as TabType, label: 'Assignments', icon: FileText },
    { id: 'quizzes' as TabType, label: 'Quizzes', icon: HelpCircle },
    { id: 'materials' as TabType, label: 'Materials', icon: Folder },
  ];

  // Si hay un item siendo visualizado, mostrar la vista completa
  if (viewingItem) {
    return (
      <div className="space-y-6 p-6">
        {/* Header con botón volver */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setViewingItem(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
            <span>Volver a elementos archivados</span>
          </button>
          {viewingItem.classId && (
            <div className="flex gap-2">
              <button
                onClick={() => handleInitRepublish(viewingItem, viewingItem.type)}
                className="px-4 py-2 text-sm bg-brand-green-medium text-white rounded hover:bg-brand-green-dark transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Republicar
              </button>
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
            </div>
          )}
        </div>

        {/* Item completo */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
          {/* Título */}
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
                {viewingItem.type === 'quiz' || viewingItem.type === 'material' ? 'Descripción' : 'Instrucciones'}
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
          {viewingItem.type === 'quiz' && viewingItem.questions && viewingItem.questions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Preguntas</h2>
              <div className="space-y-4">
                {viewingItem.questions.map((question: any, index: number) => (
                  <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        Pregunta {index + 1}: {question.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {question.type}
                      </span>
                    </div>
                    {question.description && (
                      <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                    )}
                    {question.options && question.options.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {question.options.map((option: string, optIndex: number) => (
                          <li key={optIndex}>{option}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {viewingItem.points && (
                <div>
                  <span className="text-gray-600">Puntos:</span>
                  <span className="ml-2 font-medium text-gray-900">{viewingItem.points}</span>
                </div>
              )}

              {/* Modals for Republication */}
              {republishModalOpen && pendingRepublish?.type === 'assignment' && (
                <AssignmentModal
                  isOpen={republishModalOpen}
                  onClose={() => {
                    setRepublishModalOpen(false);
                    setPendingRepublish(null);
                  }}
                  classId={targetClassForRepublish}
                  availableClasses={availableClasses}
                  initialData={pendingRepublish.item}
                  onSave={handleSaveRepublishAssignment}
                />
              )}

              {republishQuizModalOpen && pendingRepublish?.type === 'quiz' && (
                <QuizAssignmentModal
                  isOpen={republishQuizModalOpen}
                  onClose={() => {
                    setRepublishQuizModalOpen(false);
                    setPendingRepublish(null);
                  }}
                  classId={targetClassForRepublish}
                  availableClasses={availableClasses}
                  initialData={pendingRepublish.item}
                  onSave={handleSaveRepublishQuiz}
                />
              )}

              {/* Modal para seleccionar clase (reused) */}
              {showSubjectModal && !pendingRepublish && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {pendingRepublish ? 'Seleccionar clase destino' : 'Seleccionar Clase'}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      {pendingRepublish
                        ? 'Selecciona la clase donde deseas republicar este contenido:'
                        : 'La clase asociada fue eliminada. Por favor, selecciona una clase disponible:'}
                    </p>

                    <div className="relative mb-4">
                      <button
                        onClick={() => setShowClassDropdown(!showClassDropdown)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between bg-white hover:bg-gray-50"
                      >
                        <span className={selectedClassId ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedClassId
                            ? availableClasses.find(cls => cls.id === selectedClassId || cls.title === selectedClassId)?.title || selectedClassId
                            : 'Selecciona una clase'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showClassDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showClassDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowClassDropdown(false)}
                          ></div>
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {availableClasses.map(cls => (
                              <button
                                key={cls.id}
                                onClick={() => {
                                  setSelectedClassId(cls.id);
                                  setShowClassDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-900"
                              >
                                {cls.title}
                                {cls.subject && <span className="text-gray-500 ml-2">({cls.subject})</span>}
                              </button>
                            ))}
                            {availableClasses.length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500">No hay clases disponibles</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowSubjectModal(false);
                          setPendingRestore(null);
                          setPendingRepublish(null);
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmRestore}
                        disabled={!selectedClassId}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pendingRepublish ? 'Continuar' : 'Restaurar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {viewingItem.dueDate && (
                <div>
                  <span className="text-gray-600">Fecha límite:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(viewingItem.dueDate).toLocaleDateString()}
                    {viewingItem.dueTime && ` ${viewingItem.dueTime}`}
                  </span>
                </div>
              )}
              {viewingItem.author && (
                <div>
                  <span className="text-gray-600">Autor:</span>
                  <span className="ml-2 font-medium text-gray-900">{viewingItem.author.name}</span>
                </div>
              )}
              {viewingItem.createdAt && (
                <div>
                  <span className="text-gray-600">Creado:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(viewingItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div >
      </div >
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Archived</h1>
          <p className="text-gray-600">Elementos archivados: clases, assignments, quizzes y materials</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-brand-green-medium text-brand-green-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando elementos archivados...</div>
      ) : (
        <>
          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <>
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay clases archivadas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map(cls => (
                    <div
                      key={cls.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                    >
                      <div
                        className="h-32 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${classroomCode})` }}
                      >
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                          <h3 className="text-xl font-bold text-white mb-1">{cls.title}</h3>
                          {cls.module?.title && (
                            <p className="text-white/80 text-sm">{cls.module.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        {cls.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{cls.description}</p>
                        )}
                        {cls.subject && (
                          <p className="text-xs text-gray-500 mb-2">Materia: {cls.subject}</p>
                        )}
                        {cls.teacher && (
                          <p className="text-xs text-gray-500 mb-4">
                            Profesor: {cls.teacher.firstName} {cls.teacher.lastName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => handleOpenClass(cls.id)}
                            className="flex-1 px-3 py-2 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                          >
                            Ver clase
                          </button>
                          <button
                            onClick={() => handleOpenGradebook(cls.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden md:inline">Gradebook</span>
                          </button>
                          {/* <button
                            onClick={() => handleUnarchiveClass(cls.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Restaurar clase"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay assignments archivados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                            {assignment.className && assignment.className !== 'Sin clase' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {assignment.className}
                              </span>
                            )}
                          </div>
                          {assignment.instructions && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{assignment.instructions}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            {assignment.points && (
                              <span className="flex items-center gap-1">
                                <span>{assignment.points} puntos</span>
                              </span>
                            )}
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(assignment.dueDate).toLocaleDateString()}
                                  {assignment.dueTime && ` ${assignment.dueTime}`}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{assignment.author.name}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleViewAssignment(assignment)}
                            className="px-3 py-2 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                          >
                            Ver
                          </button>
                          {/* <button
                            onClick={() => handleUnarchiveAssignment(assignment.streamItemId, assignment.className)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Restaurar assignment"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <>
              {quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay quizzes archivados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map(quiz => (
                    <div
                      key={quiz.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                            {quiz.className && quiz.className !== 'Sin clase' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {quiz.className}
                              </span>
                            )}
                          </div>
                          {quiz.content && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{quiz.content}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{quiz.author.name}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleViewQuiz(quiz)}
                            className="px-3 py-2 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                          >
                            Ver
                          </button>
                          {/* <button
                            onClick={() => handleUnarchiveStreamItem(quiz.id, quiz.className, 'quiz')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Restaurar quiz"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <>
              {materials.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay materials archivados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materials.map(material => (
                    <div
                      key={material.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{material.title}</h3>
                            {material.className && material.className !== 'Sin clase' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {material.className}
                              </span>
                            )}
                          </div>
                          {material.content && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{material.content}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{material.author.name}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleViewMaterial(material)}
                            className="px-3 py-2 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                          >
                            Ver
                          </button>
                          {/* <button
                            onClick={() => handleUnarchiveStreamItem(material.id, material.className, 'material')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Restaurar material"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal para seleccionar clase */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Seleccionar Clase
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              La clase asociada fue eliminada. Por favor, selecciona una clase disponible:
            </p>

            <div className="relative mb-4">
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span className={selectedClassId ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedClassId
                    ? availableClasses.find(cls => cls.id === selectedClassId || cls.title === selectedClassId)?.title || selectedClassId
                    : 'Selecciona una clase'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showClassDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showClassDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowClassDropdown(false)}
                  ></div>
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {availableClasses.length > 0 ? (
                      availableClasses.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            setShowClassDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{cls.title}</div>
                          {cls.subject && (
                            <div className="text-xs text-gray-500">{cls.subject}</div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No hay clases disponibles
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSubjectModal(false);
                  setPendingRestore(null);
                  setSelectedClassId('');
                  setShowClassDropdown(false);
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={!selectedClassId.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-400 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
