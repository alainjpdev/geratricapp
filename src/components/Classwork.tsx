import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, HelpCircle, Book, Repeat, List, ClipboardList, Calendar, Users, Award, X, ExternalLink, Edit, Trash2, Archive, ArchiveRestore, MoreVertical, FolderOpen } from 'lucide-react';
import { Button } from './ui/Button';
import { AssignmentModal, AssignmentData } from './ui/AssignmentModal';
import { QuizAssignmentModal, QuizData } from './ui/QuizAssignmentModal';
import { MaterialModal, MaterialData } from './ui/MaterialModal';
import { saveStreamItem as saveStreamItemToService, updateStreamItem, deleteStreamItem, archiveStreamItem, unarchiveStreamItem } from '../services/streamService';
import { saveAssignment, getAllAssignments, getAssignmentsByClass, getAssignmentByStreamItemId, deleteAssignment, archiveAssignment, unarchiveAssignment, getAssignmentById } from '../services/assignmentService';
import { saveQuiz, getAllQuizzes, getQuizzesByClass, getQuizByStreamItemId } from '../services/quizService';
import { saveMaterial, getAllMaterials, getMaterialsByClass, getMaterialByStreamItemId } from '../services/materialService';
import { getStudentsByClass } from '../services/classService';
import { useAuthStore } from '../store/authStore';
import { AssignmentSubmissionModal } from './ui/AssignmentSubmissionModal';

interface ClassworkProps {
  classId: string;
  isTeacher?: boolean;
  className?: string;
}

export const Classwork: React.FC<ClassworkProps> = ({ classId, isTeacher = true, className = '' }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedAssignmentForSubmission, setSelectedAssignmentForSubmission] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Cargar assignments al montar el componente o cuando cambie classId
  useEffect(() => {
    loadAssignments();
    loadStudents();
  }, [classId, user?.id]);

  const loadStudents = async () => {
    if (classId) {
      try {
        const studentsData = await getStudentsByClass(classId);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    }
  };

  const loadAssignments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('📚 Classwork.loadAssignments - classId:', classId, 'user.role:', user.role);
      let loadedItems: any[] = [];

      // Cargar assignments - SIEMPRE filtrar por classId si está disponible
      if (classId) {
        console.log('📚 Calling getAssignmentsByClass with classId:', classId);
        const assignments = await getAssignmentsByClass(classId, false);
        console.log('📚 Loaded assignments for classId:', classId, 'count:', assignments.length);
        console.log('📚 Assignment details:', assignments.map(a => ({
          id: a.id,
          classId: (a as any).classId || 'NO CLASSID',
          title: a.title,
          streamItemId: a.streamItemId
        })));

        // FILTRAR ADICIONALMENTE POR classId EN MEMORIA (por si acaso)
        const filteredAssignments = assignments.filter(a => {
          const matches = (a as any).classId === classId;
          if (!matches) {
            console.warn('⚠️ Assignment filtered out - classId mismatch:', {
              assignmentId: a.id,
              assignmentClassId: (a as any).classId,
              expectedClassId: classId,
              title: a.title
            });
          }
          return matches;
        });

        console.log('📚 After additional filtering:', filteredAssignments.length, 'assignments');
        loadedItems = [...loadedItems, ...filteredAssignments];
      } else {
        // Solo si no hay classId y es admin, cargar todos
        const isAdmin = user.role === 'admin';
        if (isAdmin) {
          loadedItems = [...loadedItems, ...(await getAllAssignments())];
        }
      }

      // Cargar quizzes - SIEMPRE filtrar por classId si está disponible
      if (classId) {
        loadedItems = [...loadedItems, ...(await getQuizzesByClass(classId, false))];
      } else {
        // Solo si no hay classId y es admin, cargar todos
        const isAdmin = user.role === 'admin';
        if (isAdmin) {
          loadedItems = [...loadedItems, ...(await getAllQuizzes())];
        }
      }

      // Cargar materials - SIEMPRE filtrar por classId si está disponible
      if (classId) {
        loadedItems = [...loadedItems, ...(await getMaterialsByClass(classId, false))];
      } else {
        // Solo si no hay classId y es admin, cargar todos
        const isAdmin = user.role === 'admin';
        if (isAdmin) {
          loadedItems = [...loadedItems, ...(await getAllMaterials())];
        }
      }

      // Filtrar items archivados (por si acaso el filtro de la BD no funciona)
      console.log('Items before filtering:', loadedItems.map(item => ({
        id: item.id,
        title: item.title,
        isArchived: item.isArchived,
        type: item.type
      })));
      loadedItems = loadedItems.filter(item => {
        // Verificar si el item está archivado (puede ser true, false, undefined, o null)
        const isArchived = item.isArchived === true || item.isArchived === 'true' || item.is_archived === true || item.is_archived === 'true';
        if (isArchived) {
          console.log('Filtering out archived item:', item.title, item.id, 'isArchived:', item.isArchived, 'is_archived:', item.is_archived);
        }
        return !isArchived;
      });

      console.log('Loaded items after filtering:', loadedItems.length, 'items');
      setAssignments(loadedItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenuToggle = () => {
    setCreateMenuOpen(!createMenuOpen);
  };

  const handleCreateAssignment = () => {
    setCreateMenuOpen(false);
    setAssignmentModalOpen(true);
  };

  const handleCreateQuiz = () => {
    setCreateMenuOpen(false);
    setQuizModalOpen(true);
  };

  const handleSaveAssignment = async (assignment: AssignmentData) => {
    if (!classId || !user?.id) {
      console.error('Cannot save assignment: classId or userId is missing');
      alert(`Cannot save: ${!classId ? 'Missing Class ID' : 'Missing User ID'}`);
      return;
    }

    try {
      console.log('💾 Saving assignment:', assignment);
      console.log('💾 classId being used:', classId);
      console.log('💾 user.id:', user.id);

      // 1. Guardar el stream item primero (incluir el nombre de la clase)
      const streamItem = await saveStreamItemToService({
        classId,
        type: 'assignment',
        title: assignment.title,
        content: assignment.instructions,
        authorId: user.id,
        className: className, // Pasar el nombre de la clase para guardarlo
        attachments: assignment.attachments?.map(att => ({
          type: att.type || 'drive',
          name: att.name || '',
          url: att.url,
          filePath: att.filePath,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })) || [],
      });

      console.log('✅ Stream item saved:', streamItem.id, 'classId:', streamItem.classId);

      // 2. Guardar el assignment con grupos/estudiantes asignados
      await saveAssignment({
        streamItemId: streamItem.id || '',
        points: assignment.points,
        dueDate: assignment.dueDate,
        dueTime: assignment.dueTime,
        instructions: assignment.instructions,
        assignToAll: assignment.assignTo === 'all',
        assignedGroups: assignment.assignTo === 'groups' ? assignment.selectedGroups : [],
        selectedStudents: assignment.assignTo === 'students' ? assignment.selectedStudents : [],
      });

      console.log('✅ Assignment saved successfully');

      // Recargar assignments desde la base de datos
      await loadAssignments();
      setAssignmentModalOpen(false);
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error al guardar el assignment. Por favor, intenta de nuevo.');
    }
  };

  const handleSaveQuiz = async (quiz: QuizData) => {
    if (!classId || !user?.id) {
      console.error('Cannot save quiz: classId or userId is missing');
      alert(`Cannot save: ${!classId ? 'Missing Class ID' : 'Missing User ID'}`);
      return;
    }

    try {
      console.log('Saving quiz:', quiz);

      if (editingQuiz) {
        // Actualizar quiz existente
        const updateData: any = {
          title: quiz.title,
        };
        if (quiz.description) {
          updateData.content = quiz.description;
        }
        await updateStreamItem(editingQuiz.id, updateData);

        // Actualizar quiz
        await saveQuiz({
          streamItemId: editingQuiz.id,
          points: quiz.points,
          dueDate: quiz.dueDate,
          dueTime: quiz.dueTime,
          description: quiz.description,
          assignToAll: quiz.assignTo === 'all',
          assignedGroups: quiz.assignTo === 'groups' ? quiz.selectedGroups : [],
          selectedStudents: quiz.assignTo === 'students' ? quiz.selectedStudents : [],
          questions: quiz.questions?.map((q, i) => ({ ...q, order: i })) || [],
        });

        await loadAssignments();
        setQuizModalOpen(false);
        setEditingQuiz(null);
      } else {
        // Crear nuevo quiz
        const streamItem = await saveStreamItemToService({
          classId,
          type: 'quiz',
          title: quiz.title,
          content: quiz.description,
          authorId: user.id,
          className: className, // Pasar el nombre de la clase para guardarlo
          attachments: [],
        });

        await saveQuiz({
          streamItemId: streamItem.id || '',
          points: quiz.points,
          dueDate: quiz.dueDate,
          dueTime: quiz.dueTime,
          description: quiz.description,
          assignToAll: quiz.assignTo === 'all',
          assignedGroups: quiz.assignTo === 'groups' ? quiz.selectedGroups : [],
          selectedStudents: quiz.assignTo === 'students' ? quiz.selectedStudents : [],
          questions: quiz.questions?.map((q, i) => ({ ...q, order: i })) || [],
        });

        console.log('✅ Quiz saved successfully');
        await loadAssignments();
        setQuizModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error al guardar el quiz. Por favor, intenta de nuevo.');
    }
  };

  const handleSaveMaterial = async (material: MaterialData) => {
    if (!classId || !user?.id) {
      console.error('Cannot save material: classId or userId is missing');
      alert(`Cannot save: ${!classId ? 'Missing Class ID' : 'Missing User ID'}`);
      return;
    }

    try {
      console.log('Saving material:', material);

      if (editingMaterial) {
        // Actualizar material existente
        const updateData: any = {
          title: material.title,
        };
        if (material.description) {
          updateData.content = material.description;
        }
        // Incluir attachments al actualizar
        if (material.attachments) {
          updateData.attachments = material.attachments.map(att => ({
            type: att.type || 'drive',
            name: att.name || '',
            url: att.url,
            filePath: att.filePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          }));
        }
        await updateStreamItem(editingMaterial.id, updateData);

        // Actualizar material
        await saveMaterial({
          streamItemId: editingMaterial.id,
          description: material.description,
          assignToAll: material.assignTo === 'all',
          assignedGroups: material.assignTo === 'groups' ? material.selectedGroups : [],
          selectedStudents: material.assignTo === 'students' ? material.selectedStudents : [],
        });

        await loadAssignments();
        setMaterialModalOpen(false);
        setEditingMaterial(null);
      } else {
        // Crear nuevo material
        const streamItem = await saveStreamItemToService({
          classId,
          type: 'material',
          title: material.title,
          content: material.description,
          authorId: user.id,
          className: className, // Pasar el nombre de la clase para guardarlo
          attachments: material.attachments?.map(att => ({
            type: att.type || 'drive',
            name: att.name || '',
            url: att.url,
            filePath: att.filePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
          })) || [],
        });

        await saveMaterial({
          streamItemId: streamItem.id || '',
          description: material.description,
          assignToAll: material.assignTo === 'all',
          assignedGroups: material.assignTo === 'groups' ? material.selectedGroups : [],
          selectedStudents: material.assignTo === 'students' ? material.selectedStudents : [],
        });

        console.log('✅ Material saved successfully');
        await loadAssignments();
        setMaterialModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Error al guardar el material. Por favor, intenta de nuevo.');
    }
  };


  const handleCreateQuestion = () => {
    setCreateMenuOpen(false);
    // TODO: Open question creation modal
    console.log('Create question');
  };

  const handleCreateMaterial = () => {
    setCreateMenuOpen(false);
    setMaterialModalOpen(true);
  };

  const handleReusePost = () => {
    setCreateMenuOpen(false);
    // TODO: Open reuse post modal
    console.log('Reuse post');
  };

  const handleCreateTopic = () => {
    setCreateMenuOpen(false);
    // TODO: Open topic creation modal
    console.log('Create topic');
  };

  const handleEditItem = async (item: any) => {
    try {
      const itemType = item.type || 'assignment';

      if (itemType === 'assignment') {
        const fullAssignment = await getAssignmentByStreamItemId(item.streamItemId);
        if (fullAssignment) {
          console.log('handleEditItem - item:', item);
          console.log('handleEditItem - fullAssignment:', fullAssignment);
          // Usar el título de fullAssignment (que ahora incluye el título del stream item)
          const title = fullAssignment.title || item.title || '';
          const editData = {
            title: title,
            instructions: item.instructions || fullAssignment.instructions || '',
            points: fullAssignment.points,
            dueDate: fullAssignment.dueDate,
            dueTime: fullAssignment.dueTime,
            assignTo: fullAssignment.assignToAll ? 'all' : ((fullAssignment.assignedGroups?.length ?? 0) > 0 ? 'groups' : 'students'),
            selectedGroups: fullAssignment.assignedGroups || [],
            selectedStudents: fullAssignment.selectedStudents || [],
            attachments: fullAssignment.attachments || item.attachments || [],
          };
          console.log('handleEditItem - editData:', editData);
          // Primero establecer los datos de edición
          setEditingAssignment({
            id: item.streamItemId,
            data: editData
          });
          // Luego abrir el modal después de un pequeño delay para asegurar que los datos estén disponibles
          setTimeout(() => {
            setAssignmentModalOpen(true);
          }, 0);
        }
      } else if (itemType === 'quiz') {
        const fullQuiz = await getQuizByStreamItemId(item.streamItemId);
        if (fullQuiz) {
          setEditingQuiz({
            id: item.streamItemId,
            data: {
              title: item.title,
              description: item.description || fullQuiz.description || '',
              points: fullQuiz.points,
              dueDate: fullQuiz.dueDate,
              dueTime: fullQuiz.dueTime,
              assignTo: fullQuiz.assignToAll ? 'all' : ((fullQuiz.assignedGroups?.length ?? 0) > 0 ? 'groups' : 'students'),
              selectedGroups: fullQuiz.assignedGroups || [],
              selectedStudents: fullQuiz.selectedStudents || [],
              questions: fullQuiz.questions || [],
            }
          });
          setQuizModalOpen(true);
        }
      } else if (itemType === 'material') {
        const fullMaterial = await getMaterialByStreamItemId(item.streamItemId);
        if (fullMaterial) {
          setEditingMaterial({
            id: item.streamItemId,
            data: {
              title: item.title,
              description: item.description || fullMaterial.description || '',
              assignTo: fullMaterial.assignToAll ? 'all' : ((fullMaterial.assignedGroups?.length ?? 0) > 0 ? 'groups' : 'students'),
              selectedGroups: fullMaterial.assignedGroups || [],
              selectedStudents: fullMaterial.selectedStudents || [],
              attachments: (fullMaterial as any).attachments || item.attachments || [],
            }
          });
          setMaterialModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error loading item for editing:', error);
      alert('Error al cargar el item para editar.');
    }
  };

  const handleArchiveItem = async (item: any) => {
    setOpenMenuId(null);
    if (!confirm(`¿Estás seguro de que quieres archivar "${item.title}"?`)) {
      return;
    }

    try {
      await archiveStreamItem(item.streamItemId);
      await loadAssignments();
      alert('Item archivado correctamente.');
    } catch (error) {
      console.error('Error archiving item:', error);
      alert('Error al archivar el item.');
    }
  };

  const handleUnarchiveItem = async (item: any) => {
    setOpenMenuId(null);
    try {
      await unarchiveStreamItem(item.streamItemId);
      await loadAssignments();
      alert('Item desarchivado correctamente.');
    } catch (error) {
      console.error('Error unarchiving item:', error);
      alert('Error al desarchivar el item.');
    }
  };

  const handleDeleteItem = async (item: any) => {
    setOpenMenuId(null);
    if (!confirm(`¿Estás seguro de que quieres eliminar "${item.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      if (item.type === 'assignment') {
        // Para assignments, usamos soft delete (isVisible: false)
        await deleteAssignment(item.id);
      } else {
        // Para otros items, mantenemos el comportamiento actual
        await deleteStreamItem(item.streamItemId);
      }
      await loadAssignments();
      alert('Item eliminado correctamente.');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar el item.');
    }
  };

  // Si estamos viendo un assignment, mostrar solo ese assignment en pantalla completa
  if (viewingAssignment) {
    // Verificar si el usuario puede editar/eliminar/archivar
    const canModify = user?.role === 'admin' || viewingAssignment.authorId === user?.id;
    const isStudent = user?.role === 'student';

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header con botón volver */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewingAssignment(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              <span>Volver a assignments</span>
            </button>
            {viewingAssignment.classId && (
              <button
                onClick={() => {
                  setViewingAssignment(null);
                  if (user?.role === 'admin' || viewingAssignment.classId !== classId) {
                    navigate(`/dashboard/classes/${viewingAssignment.classId}?tab=classwork`);
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ir a la clase
              </button>
            )}
          </div>

          {/* Assignment completo */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
            {/* Título */}
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">{viewingAssignment.title}</h1>

            {/* Class Name (for admins) */}
            {viewingAssignment.className && user?.role === 'admin' && (
              <div className="mb-6">
                <span className="inline-block text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded">
                  {viewingAssignment.className}
                </span>
              </div>
            )}

            {/* Instructions/Description */}
            {(viewingAssignment.instructions || viewingAssignment.description) && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-3">
                  {viewingAssignment.type === 'quiz' || viewingAssignment.type === 'material' ? 'Descripción' : 'Instrucciones'}
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {viewingAssignment.instructions || viewingAssignment.description}
                  </p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {viewingAssignment.attachments && viewingAssignment.attachments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Archivos adjuntos</h2>
                <div className="space-y-2">
                  {viewingAssignment.attachments.map((attachment: any) => (
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
            {viewingAssignment.type === 'quiz' && viewingAssignment.questions && viewingAssignment.questions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Preguntas</h2>
                <div className="space-y-4">
                  {viewingAssignment.questions.map((q: any, index: number) => (
                    <div key={q.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {index + 1}. {q.title}
                        </h3>
                        <span className="text-sm text-gray-500">{q.points} puntos</span>
                      </div>
                      {q.description && (
                        <p className="text-sm text-gray-600 mb-2">{q.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mb-3">Tipo: {q.type}</p>

                      {/* Render options for multiple-choice questions */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs font-medium text-gray-700">Opciones:</p>
                          <ul className="list-disc list-inside space-y-1 pl-2">
                            {q.options.map((option: string, optIndex: number) => (
                              <li key={optIndex} className={`text-sm ${q.correctAnswer === option ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                {option}
                                {q.correctAnswer === option && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Correcta</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {viewingAssignment.points !== undefined && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Award className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Puntos</p>
                    <p className="text-2xl font-semibold text-gray-900">{viewingAssignment.points}</p>
                  </div>
                </div>
              )}

              {viewingAssignment.dueDate && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de vencimiento</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {new Date(viewingAssignment.dueDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {viewingAssignment.dueTime && (
                        <span className="text-base font-normal text-gray-600 block mt-1">
                          a las {viewingAssignment.dueTime}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Details (only for assignments) */}
            {viewingAssignment.type === 'assignment' && (
              <div className="border-t border-gray-200 pt-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Asignación</h2>
                {viewingAssignment.assignToAll ? (
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-gray-600" />
                    <span className="text-gray-900 text-lg">Todos los estudiantes</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingAssignment.assignedGroups && viewingAssignment.assignedGroups.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Grupos asignados:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingAssignment.assignedGroups.map((group: string) => (
                            <span key={group} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingAssignment.selectedStudents && viewingAssignment.selectedStudents.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Estudiantes asignados:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingAssignment.selectedStudents.map((studentId: string) => {
                            const student = students.find(s => s.id === studentId);
                            return (
                              <span key={studentId} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                {student ? `${student.firstName} ${student.lastName}` : 'Estudiante desconocido'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assignment Details (for quizzes and materials) */}
            {(viewingAssignment.type === 'quiz' || viewingAssignment.type === 'material') && (
              <div className="border-t border-gray-200 pt-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Asignación</h2>
                {viewingAssignment.assignToAll ? (
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-gray-600" />
                    <span className="text-gray-900 text-lg">Todos los estudiantes</span>
                  </div>
                ) : (
                  <div>
                    {viewingAssignment.selectedStudents && viewingAssignment.selectedStudents.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Estudiantes asignados:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingAssignment.selectedStudents.map((studentId: string) => {
                            const student = students.find(s => s.id === studentId);
                            return (
                              <span key={studentId} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" />
                                {student ? `${student.firstName} ${student.lastName}` : 'Estudiante desconocido'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : viewingAssignment.assignedGroups && viewingAssignment.assignedGroups.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Grupos asignados:</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingAssignment.assignedGroups.map((group: string) => (
                            <span key={group} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin asignación específica</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Author */}
            {viewingAssignment.author && (
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                  Creado por: <span className="font-medium text-gray-900">{viewingAssignment.author.name}</span>
                </p>
                {viewingAssignment.createdAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(viewingAssignment.createdAt).toLocaleDateString('es-ES', {
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

            {/* Botones de acción */}
            <div className="border-t border-gray-200 pt-6 mt-6 flex items-center gap-3 hidden">
              {/* Botón para estudiantes: Enviar respuesta (solo para assignments) */}
              {isStudent && viewingAssignment.type === 'assignment' && (
                <button
                  onClick={() => {
                    setSelectedAssignmentForSubmission(viewingAssignment);
                    setSubmissionModalOpen(true);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {viewingAssignment.submissionStatus ? 'Ver/Editar mi respuesta' : 'Enviar respuesta'}
                </button>
              )}

              {/* Botones de edición/eliminación para teachers/admins */}
              {canModify && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        if (viewingAssignment.type === 'assignment') {
                          const fullAssignment = await getAssignmentByStreamItemId(viewingAssignment.streamItemId);
                          if (fullAssignment) {
                            setEditingAssignment({
                              id: viewingAssignment.streamItemId,
                              data: {
                                title: viewingAssignment.title,
                                instructions: viewingAssignment.instructions || '',
                                points: fullAssignment.points,
                                dueDate: fullAssignment.dueDate,
                                dueTime: fullAssignment.dueTime,
                                assignTo: fullAssignment.assignToAll ? 'all' : ((fullAssignment.assignedGroups?.length ?? 0) > 0 ? 'groups' : 'students'),
                                selectedGroups: fullAssignment.assignedGroups || [],
                                selectedStudents: fullAssignment.selectedStudents || [],
                                attachments: fullAssignment.attachments || viewingAssignment.attachments || [],
                              }
                            });
                            setAssignmentModalOpen(true);
                          }
                        } else if (viewingAssignment.type === 'quiz') {
                          const fullQuiz = await getQuizByStreamItemId(viewingAssignment.streamItemId);
                          if (fullQuiz) {
                            setEditingQuiz({
                              id: viewingAssignment.streamItemId,
                              data: {
                                title: viewingAssignment.title,
                                description: viewingAssignment.description || fullQuiz.description || '',
                                points: fullQuiz.points,
                                dueDate: fullQuiz.dueDate,
                                dueTime: fullQuiz.dueTime,
                                assignTo: fullQuiz.assignToAll ? 'all' : ((fullQuiz.assignedGroups?.length ?? 0) > 0 ? 'groups' : 'students'),
                                selectedGroups: fullQuiz.assignedGroups || [],
                                selectedStudents: fullQuiz.selectedStudents || [],
                                questions: fullQuiz.questions || [],
                              }
                            });
                            setQuizModalOpen(true);
                          }
                        } else if (viewingAssignment.type === 'material') {
                          const fullMaterial = await getMaterialByStreamItemId(viewingAssignment.streamItemId);
                          if (fullMaterial) {
                            setEditingMaterial({
                              id: viewingAssignment.streamItemId,
                              data: {
                                title: viewingAssignment.title,
                                description: viewingAssignment.description || fullMaterial.description || '',
                                assignTo: fullMaterial.assignToAll ? 'all' : 'selected',
                                selectedStudents: fullMaterial.selectedStudents || [],
                                attachments: viewingAssignment.attachments || [],
                              }
                            });
                            setMaterialModalOpen(true);
                          }
                        }
                      } catch (error) {
                        console.error('Error loading item for editing:', error);
                        alert('Error al cargar el item para editar.');
                      }
                    }}
                    className="px-6 py-3 bg-brand-green-light text-white rounded-lg hover:bg-brand-green-medium transition-colors font-medium flex items-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header con botón Create */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1"></div>
          <div className="relative">
            <button
              onClick={handleCreateMenuToggle}
              className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Create</span>
            </button>

            {/* Menú desplegable Create */}
            {createMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setCreateMenuOpen(false)}
                ></div>
                <div className="absolute right-0 top-12 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[220px]">
                  <button
                    onClick={handleCreateAssignment}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Assignment</span>
                  </button>
                  <button
                    onClick={handleCreateQuiz}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Quiz assignment</span>
                  </button>
                  <button
                    onClick={handleCreateQuestion}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 hidden"
                  >
                    <HelpCircle className="w-5 h-5 text-gray-600" />
                    <span>Question</span>
                  </button>
                  <button
                    onClick={handleCreateMaterial}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                  >
                    <Book className="w-5 h-5 text-gray-600" />
                    <span>Material</span>
                  </button>
                  <button
                    onClick={handleReusePost}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 hidden"
                  >
                    <Repeat className="w-5 h-5 text-gray-600" />
                    <span>Reuse post</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleCreateTopic}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 hidden"
                  >
                    <List className="w-5 h-5 text-gray-600" />
                    <span>Topic</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botón "View your work" para estudiantes */}
        {!isTeacher && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-5 h-5" />
              <span>View your work</span>
            </Button>
          </div>
        )}

        {/* Contenido principal */}
        {assignments.length === 0 ? (
          <div className="text-center py-16">
            {/* SVG ilustrativo */}
            <svg
              viewBox="0 0 238 134"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="w-64 h-auto mx-auto mb-6 text-gray-400"
            >
              <path
                d="M116.595 13.9408L101.654 5.62358C101.655 5.67073 102.784 8.16035 102.784 8.16035L100.904 8.61261L101.563 10.1003L98.3151 10.9611L113.233 19.306C115.108 18.0993 116.398 16.0763 116.595 13.9408Z"
                fill="#1E8E3E"
              />
              <path
                d="M98.8805 5.79916C99.2962 6.99028 98.5161 8.26467 97.2788 8.45413L95.2839 5.9474C95.0808 5.68426 95.2792 5.33334 95.6163 5.37946L98.8805 5.79916Z"
                fill="#5F6368"
              />
              <path
                d="M101.789 5.96962L95.4866 5.6473L98.927 11.0948"
                stroke="#5F6368"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M107 103.3L183 103.957V88.5222C183 57.8497 160.068 32.957 131.783 32.957L107.859 42.0865L107 103.3Z"
                fill="#DADCE0"
              />
              <path
                d="M97 102.957H120V93.9578H106.187C101.098 93.893 97 97.9718 97 102.957Z"
                fill="#DADCE0"
              />
              <path
                d="M177.995 92.0402C178.455 91.1595 179.476 91.0085 180.368 91.3213C190.399 94.6613 200.909 91.0111 210.436 88.4643C215.171 87.1736 220.485 85.6947 225.187 88.2578C229.494 90.58 231.915 94.8489 232.363 99.3071C232.802 103.527 232.032 108.713 227.394 110.605C223.46 112.23 219.259 110.748 215.16 110.49C213.065 110.373 211.205 110.631 209.586 111.888C208.091 113.067 206.879 114.418 205.015 115.062C201.129 116.483 197.664 113.669 194.691 111.697C193.958 111.249 193.226 110.802 192.425 110.467C191.792 110.235 191.125 110.06 190.342 110.202C189.322 110.353 188.432 111.049 187.589 111.541C186.405 112.212 185.052 112.78 183.624 112.838C182.14 112.861 180.728 112.385 179.787 111.267C178.979 110.309 178.526 109.025 178.207 107.9C177.404 105.162 177.077 102.405 177.226 99.6292C177.217 99.391 177.355 99.1654 177.458 98.9961C177.541 97.3418 178.064 95.7248 178.983 94.3488C178.926 94.3143 178.836 94.3363 178.779 94.3019C177.921 93.9327 177.637 92.7517 177.995 92.0402Z"
                fill="#DADCE0"
              />
              <path
                d="M100.597 31.2005L100.092 27.7059L105.359 26.6501C105.821 24.7988 106.54 21.6134 107.398 19.9604C107.992 18.8364 108.653 17.7785 109.445 16.8529C108.124 12.7535 107.332 9.88448 107.662 5.52069C107.794 4.33056 108.124 3.0082 109.445 2.67761C110.633 2.34702 111.781 2.75907 112.64 3.42025C114.422 4.87485 115.453 5.6789 116.972 7.39797C118.227 8.85257 119.349 10.3733 120.405 12.0262C123.245 11.6295 126.084 11.4312 128.989 11.3651C130.046 11.3651 131.036 11.3651 132.092 11.5634C132.687 7.92692 133.479 5.75918 135.46 2.58552C136.12 1.52763 136.978 0.535855 138.365 0.866446C139.554 1.13092 140.478 2.67761 140.478 2.67761C141.419 3.80397 142.261 6.20785 142.855 8.38974C143.515 10.9022 143.845 13.547 143.977 16.1917C143.977 16.39 143.977 16.5223 143.911 16.6545C147.939 19.4315 150.976 22.6051 152.693 23.9275C153.419 24.5226 161.475 30.0765 149.656 30.6054C154.081 31.2005 168.633 41.9752 147.174 38.3387C147.439 39.3305 159.098 48.9862 138.035 48.3912C136.714 48.3251 102.842 54.4079 94.7206 34.4403L98.4842 33.9113C99.8048 33.713 100.729 32.5228 100.597 31.2005Z"
                fill="#DADCE0"
              />
              <path
                d="M100.093 27.7061L100.598 31.1345C100.796 32.4569 99.8054 33.7131 98.4849 33.9115L94.8262 34.7447C93.9678 32.6289 93.4239 31.607 93.2258 28.8962L100.093 27.7061Z"
                fill="#5F6368"
              />
              <path
                d="M117.954 72.957C118.05 80.1039 118.002 87.1851 117.761 94.332C110.28 95.279 109.241 100.203 109 102.957"
                stroke="#5F6368"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M118.04 99.4629C116.18 99.8045 114.688 102.179 114.505 103.087"
                stroke="#5F6368"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M104 98.957C102.084 99.619 101 102.087 101 102.957"
                stroke="#5F6368"
                strokeWidth="2"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M121.145 27.8622C120.581 27.9058 120.088 27.483 120.045 26.9178C120.001 26.3526 120.423 25.859 120.987 25.8154C121.551 25.7717 122.044 26.1945 122.088 26.7597C122.132 27.3249 121.71 27.8185 121.145 27.8622Z"
                fill="#5F6368"
              />
              <path
                d="M109.598 26.6512C109.033 26.6949 108.541 26.272 108.497 25.7068C108.453 25.1416 108.875 24.6481 109.439 24.6044C110.004 24.5608 110.496 24.9836 110.54 25.5488C110.584 26.114 110.162 26.6076 109.598 26.6512Z"
                fill="#5F6368"
              />
              <path
                d="M141.516 38.3389C143.043 39.0428 146.545 40.2635 148.328 39.5154"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M135.566 39.291C136.151 40.1914 138.081 42.1456 141.131 42.7594"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M41 102H70V88H41C45.1938 92.1674 45.1938 97.8326 41 102Z"
                fill="#5F6368"
              />
              <path
                d="M13.2949 88H39C34.3263 83.9628 34.2329 78.2326 38.8131 74.1953L39 74H13.2949C8.90169 78.1674 8.90169 83.7674 13.2949 88Z"
                fill="#DADCE0"
              />
              <path
                d="M32 81H79"
                stroke="#DADCE0"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M32 87H79"
                stroke="#DADCE0"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M1 95H63"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M1 101H63"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M32 75H79"
                stroke="#DADCE0"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M1 89H63"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7.28938 67.951C5.41313 67.951 3.88867 67.951 3.88867 64.5502V24.8558C3.88867 22.9795 5.41313 21.4551 7.28938 21.4551H69.0352C70.9114 21.4551 72.4359 22.9795 72.4359 24.8558L7.28938 67.951Z"
                fill="#CEEAD6"
              />
              <path
                d="M4.07143 68.1345H68.3043C70.2392 68.1345 71.8223 66.5515 71.8223 64.6166V25.1566C71.8223 23.2218 70.2392 21.6387 68.3043 21.6387L7.5894 21.6387C5.65452 21.6387 4.07143 23.2218 4.07143 25.1566V68.1345Z"
                stroke="#5F6368"
                strokeWidth="2"
                strokeMiterlimit="10"
              />
              <path
                d="M92.7904 68.2686H3V74.4081H92.7904C94.4858 74.4081 95.8602 73.0337 95.8602 71.3383C95.8602 69.6429 94.4858 68.2686 92.7904 68.2686Z"
                fill="#5F6368"
              />
              <path
                d="M112 7.95703L114 13.957"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M137 6.95703L138 12.957"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M118.487 39.8768C117.746 47.6332 116.034 62.1001 116.034 62.1001L96.1434 60.2671C98.2227 53.5399 100.102 47.8608 102.369 39.8768L118.487 39.8768Z"
                fill="#5F6368"
              />
              <path
                d="M115.955 41.1963C115.14 44.4072 113.625 49.7609 112.234 54.5774C111.442 57.3212 110.693 59.8815 110.142 61.7561C109.873 62.6705 109.651 63.4217 109.495 63.9512L91.895 60.6012C92.6965 58.5653 93.489 56.6018 94.2883 54.6217C95.9565 50.4888 97.6539 46.2836 99.5233 41.1962L115.955 41.1963Z"
                fill="white"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M108.418 42.9432C100.744 43.7107 97.9015 39.7526 97.9015 39.7526L117.628 39.7526C117.628 39.7526 116.093 42.1758 108.418 42.9432Z"
                fill="#DADCE0"
              />
              <path
                d="M119.279 33.8346C118.111 35.2699 115.428 40.2128 121.11 43.8439"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M98 36.957H115V40.957L98 40.557V36.957Z"
                fill="#DADCE0"
              />
              <path
                d="M99.1969 41.8728C102.843 43.7476 111.606 45.8632 117.496 39.3267"
                stroke="#5F6368"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              This is where you'll assign work
            </h3>
            <p className="text-gray-600 mb-6">
              You can add assignments and other work for the class, then organize it into topics
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Cargando assignments...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista de assignments/tareas */}
            {assignments.map((assignment) => {
              const canModify = user?.role === 'admin' || assignment.author?.id === user?.id;

              return (
                <div
                  key={assignment.id || assignment.streamItemId}
                  className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative ${assignment.classId && assignment.classId.trim() !== '' ? 'cursor-pointer' : ''
                    } ${assignment.isArchived ? 'opacity-75 border-gray-300' : ''}`}
                  onClick={async (e) => {
                    // No abrir si se hace clic en el menú
                    if ((e.target as HTMLElement).closest('.item-menu')) {
                      return;
                    }
                    e.stopPropagation();
                    // Cargar detalles completos del item y mostrar en pantalla completa
                    try {
                      const itemType = assignment.type || 'assignment';
                      let fullItem: any = null;

                      if (itemType === 'assignment') {
                        fullItem = await getAssignmentByStreamItemId(assignment.streamItemId);
                        if (fullItem) {
                          // Si es estudiante, verificar si tiene submission
                          let submissionStatus = null;
                          if (user?.role === 'student' && user?.id) {
                            try {
                              const { getSubmission } = await import('../services/submissionService');
                              const submission = await getSubmission(assignment.id, user.id);
                              if (submission) {
                                submissionStatus = submission.status;
                              }
                            } catch (err) {
                              console.error('Error loading submission:', err);
                            }
                          }

                          setViewingAssignment({
                            ...assignment,
                            ...fullItem,
                            type: 'assignment',
                            authorId: assignment.author?.id,
                            submissionStatus,
                            attachments: fullItem.attachments || assignment.attachments || [],
                          });
                          setIsArchived(fullItem.isArchived || assignment.isArchived || false);

                          // Cargar estudiantes si no están cargados o si es de otra clase
                          if (fullItem.classId && (!classId || fullItem.classId !== classId)) {
                            try {
                              const studentsData = await getStudentsByClass(fullItem.classId);
                              setStudents(prev => {
                                // Combinar con los existentes para no perder los de la clase actual si los hay
                                const newStudents = [...prev];
                                studentsData.forEach(s => {
                                  if (!newStudents.find(existing => existing.id === s.id)) {
                                    newStudents.push(s);
                                  }
                                });
                                return newStudents;
                              });
                            } catch (err) {
                              console.error('Error loading students for assignment:', err);
                            }
                          }
                        }
                      } else if (itemType === 'quiz') {
                        fullItem = await getQuizByStreamItemId(assignment.streamItemId);
                        if (fullItem) {
                          setViewingAssignment({
                            ...assignment,
                            ...fullItem,
                            type: 'quiz',
                            description: fullItem.description || assignment.description,
                            authorId: assignment.author?.id,
                          });
                          setIsArchived(fullItem.isArchived || assignment.isArchived || false);

                          // Cargar estudiantes si es necesario
                          if (fullItem.classId && (!classId || fullItem.classId !== classId)) {
                            try {
                              const studentsData = await getStudentsByClass(fullItem.classId);
                              setStudents(prev => {
                                const newStudents = [...prev];
                                studentsData.forEach(s => {
                                  if (!newStudents.find(existing => existing.id === s.id)) {
                                    newStudents.push(s);
                                  }
                                });
                                return newStudents;
                              });
                            } catch (err) {
                              console.error('Error loading students for quiz:', err);
                            }
                          }
                        }
                      } else if (itemType === 'material') {
                        fullItem = await getMaterialByStreamItemId(assignment.streamItemId);
                        if (fullItem) {
                          setViewingAssignment({
                            ...assignment,
                            ...fullItem,
                            type: 'material',
                            description: fullItem.description || assignment.description,
                            authorId: assignment.author?.id,
                          });
                          setIsArchived(fullItem.isArchived || assignment.isArchived || false);
                        }
                      }
                    } catch (error) {
                      console.error('Error loading item details:', error);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                        {assignment.isArchived && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            <Archive className="w-3 h-3" />
                            Archivado
                          </span>
                        )}
                      </div>
                      {assignment.className && user?.role === 'admin' && (
                        <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded mb-2">
                          {assignment.className}
                        </span>
                      )}
                      {(assignment.instructions || assignment.description) && (
                        <p className="text-sm text-gray-600 mb-3">
                          {assignment.instructions || assignment.description}
                        </p>
                      )}
                    </div>

                    {/* Menú de opciones */}
                    {canModify && (
                      <div className="relative item-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === assignment.streamItemId ? null : assignment.streamItemId);
                          }}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === assignment.streamItemId && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            ></div>
                            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  handleEditItem(assignment);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </button>
                              {assignment.isArchived ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnarchiveItem(assignment);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                                >
                                  {/* <ArchiveRestore className="w-4 h-4" /> */}
                                  Desarchivar
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveItem(assignment);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                                >
                                  <Archive className="w-4 h-4" />
                                  Archivar
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(assignment);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detalles del assignment */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {assignment.points !== undefined && (
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{assignment.points} puntos</span>
                      </div>
                    )}
                    {assignment.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Vence: {new Date(assignment.dueDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {assignment.dueTime && ` a las ${assignment.dueTime}`}
                        </span>
                      </div>
                    )}
                    {assignment.assignToAll ? (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Todos los estudiantes</span>
                      </div>
                    ) : (
                      <>
                        {assignment.assignedGroups && assignment.assignedGroups.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Grupos: {assignment.assignedGroups.join(', ')}</span>
                          </div>
                        )}
                        {assignment.studentCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{assignment.studentCount} estudiante(s) asignado(s)</span>
                          </div>
                        )}
                      </>
                    )}
                    {assignment.author && (
                      <div className="text-xs text-gray-500">
                        Por: {assignment.author.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assignment Modal */}
        <AssignmentModal
          isOpen={assignmentModalOpen}
          onClose={() => {
            setAssignmentModalOpen(false);
            setEditingAssignment(null);
          }}
          classId={classId}
          className={className}
          initialData={editingAssignment?.data}
          isEdit={!!editingAssignment}
          onSave={async (assignmentData: AssignmentData) => {
            if (editingAssignment) {
              // Actualizar assignment existente
              try {
                // Actualizar stream item (título, contenido y attachments)
                const updateData: any = {
                  title: assignmentData.title,
                  attachments: assignmentData.attachments?.map(att => ({
                    type: att.type || 'drive',
                    name: att.name || '',
                    url: att.url,
                    filePath: att.filePath,
                    fileSize: att.fileSize,
                    mimeType: att.mimeType,
                  })) || [],
                };
                if (assignmentData.instructions) {
                  updateData.content = assignmentData.instructions;
                }
                await updateStreamItem(editingAssignment.id, updateData);

                // Actualizar assignment
                await saveAssignment({
                  streamItemId: editingAssignment.id,
                  points: assignmentData.points,
                  dueDate: assignmentData.dueDate,
                  dueTime: assignmentData.dueTime,
                  instructions: assignmentData.instructions,
                  assignToAll: assignmentData.assignTo === 'all',
                  assignedGroups: assignmentData.assignTo === 'groups' ? assignmentData.selectedGroups : [],
                  selectedStudents: assignmentData.assignTo === 'students' ? assignmentData.selectedStudents : [],
                });

                await loadAssignments();
                setAssignmentModalOpen(false);
                setEditingAssignment(null);
                if (viewingAssignment) {
                  // Recargar el assignment que se está viendo
                  const fullAssignment = await getAssignmentByStreamItemId(editingAssignment.id);
                  if (fullAssignment) {
                    setViewingAssignment({
                      ...viewingAssignment,
                      ...fullAssignment,
                    });
                  }
                }
              } catch (error) {
                console.error('Error updating assignment:', error);
                alert('Error al actualizar el assignment.');
              }
            } else {
              // Crear nuevo assignment
              await handleSaveAssignment(assignmentData);
            }
          }}
        />

        {/* Quiz Assignment Modal */}
        <QuizAssignmentModal
          isOpen={quizModalOpen}
          onClose={() => {
            setQuizModalOpen(false);
            setEditingQuiz(null);
          }}
          classId={classId}
          className={className}
          initialData={editingQuiz?.data}
          isEdit={!!editingQuiz}
          onSave={handleSaveQuiz}
        />

        {/* Material Modal */}
        <MaterialModal
          isOpen={materialModalOpen}
          onClose={() => {
            setMaterialModalOpen(false);
            setEditingMaterial(null);
          }}
          classId={classId}
          className={className}
          initialData={editingMaterial?.data}
          isEdit={!!editingMaterial}
          onSave={handleSaveMaterial}
        />

        {/* Assignment Submission Modal */}
        {selectedAssignmentForSubmission && (
          <AssignmentSubmissionModal
            isOpen={submissionModalOpen}
            onClose={() => {
              setSubmissionModalOpen(false);
              setSelectedAssignmentForSubmission(null);
            }}
            assignmentId={selectedAssignmentForSubmission.id}
            streamItemId={selectedAssignmentForSubmission.streamItemId}
            assignmentTitle={selectedAssignmentForSubmission.title}
            instructions={selectedAssignmentForSubmission.instructions}
            dueDate={selectedAssignmentForSubmission.dueDate}
            dueTime={selectedAssignmentForSubmission.dueTime}
            onSubmitted={() => {
              // Recargar assignments para actualizar el estado
              loadAssignments();
            }}
          />
        )}
      </div>
    </div>
  );
};

