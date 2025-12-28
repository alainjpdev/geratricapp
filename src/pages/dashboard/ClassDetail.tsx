import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Edit,
  Info,
  Video,
  Copy,
  RotateCcw,
  PowerOff,
  Maximize2,
  Repeat,
  Settings,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { loadClass, updateClass } from '../../services/classService';
import { loadStreamItems as loadStreamItemsFromService, saveStreamItem as saveStreamItemToService, deleteStreamItem as deleteStreamItemFromService, updateStreamItem, archiveStreamItem as archiveStreamItemService, unarchiveStreamItem as unarchiveStreamItemService } from '../../services/streamService';
import { getAssignmentByStreamItemId, deleteAssignment as deleteAssignmentFromService, getAssignmentById, saveAssignment as saveAssignmentService, archiveAssignment as archiveAssignmentService, unarchiveAssignment as unarchiveAssignmentService } from '../../services/assignmentService';
import { Classwork } from '../../components/Classwork';
import { AnnouncementModal, AnnouncementData } from '../../components/ui/AnnouncementModal';
import { EditClassModal } from '../../components/ui/EditClassModal';
import { People } from '../../components/People';
import { Grades } from '../../components/Grades';
import { StreamItem } from '../../components/StreamItem';
import { AssignmentModal, AssignmentData } from '../../components/ui/AssignmentModal';
import classroomCode from '../../assets/classroom-code.jpg';
import classroomRead from '../../assets/classroom-read.jpg';
import classroomBookclub from '../../assets/classroom-bookclub.jpg';
import classroomBacktoschool from '../../assets/classroom-backtoschool.jpg';

import { supabase } from '../../config/supabaseClient';
import type { StreamItemWithAuthor } from '../../services/streamService';

interface ClassDetail {
  id: string;
  title: string;
  description?: string;
  classCode?: string;
  section?: string;
  subject?: string;
  room?: string;
  module?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  backgroundImage?: string;
}

// Función para generar un código de clase único
const generateClassCode = (id: string): string => {
  // Usar los últimos 8 caracteres del ID y convertirlos a un código legible
  const hash = id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const code = Math.abs(hash).toString(36).substring(0, 8);
  return code;
};

export const ClassDetail: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'classwork' | 'people' | 'grades'>('classwork');
  const [classCodeMenuOpen, setClassCodeMenuOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editClassModalOpen, setEditClassModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{ id: string; data: AssignmentData } | null>(null);
  const [streamItems, setStreamItems] = useState<StreamItemWithAuthor[]>([]);

  // Actualizar el tab cuando cambian los searchParams o el classId
  useEffect(() => {
    const tab = searchParams.get('tab');
    console.log('ClassDetail - Tab from URL:', tab, 'classId:', classId);
    if (tab && ['classwork', 'people', 'grades'].includes(tab)) {
      console.log('Setting activeTab to:', tab);
      setActiveTab(tab as 'classwork' | 'people' | 'grades');
    } else {
      setActiveTab('classwork');
    }
  }, [searchParams, classId]);

  useEffect(() => {
    if (classId) {
      loadClassData();
      // loadStreamItems(); // Comentado: el tab stream está oculto y no se usa
    }
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) return;

    try {
      const classData = await loadClass(classId);
      if (classData) {
        setClassData({
          id: classData.id || '',
          title: classData.title || '',
          description: classData.description,
          classCode: classData.classCode,
          section: classData.section,
          subject: classData.subject,
          room: classData.room,
          teacher: classData.teacher,
          module: classData.module,
        });
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading class:', err);
      setLoading(false);
    }
  };

  const handleCopyClassCode = () => {
    if (classData?.classCode) {
      navigator.clipboard.writeText(classData.classCode);
      setClassCodeMenuOpen(false);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/dashboard/classes/${classId}`;
    navigator.clipboard.writeText(inviteLink);
    setClassCodeMenuOpen(false);
  };

  const loadStreamItems = async () => {
    // Si es admin, cargar todos los stream items; si no, solo los de la clase
    try {
      const items = await loadStreamItemsFromService(classId || undefined);
      console.log('Loaded stream items:', items.map(item => ({ id: item.id, classId: item.classId, className: item.className })));
      setStreamItems(items);
    } catch (err) {
      console.error('Error loading stream items:', err);
    }
  };

  const saveStreamItem = async (item: {
    type: 'announcement' | 'assignment' | 'quiz' | 'material';
    title: string;
    content?: string;
    attachments?: Array<{
      type: string;
      name: string;
      url?: string;
      filePath?: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }) => {
    if (!classId || !user?.id) {
      console.error('Cannot save stream item: classId or userId is missing');
      return;
    }
    try {
      await saveStreamItemToService({
        classId,
        type: item.type,
        title: item.title,
        content: item.content,
        authorId: user.id,
        attachments: item.attachments,
      });

      // Recargar todos los items
      await loadStreamItems();
    } catch (err) {
      console.error('Error saving stream item:', err);
    }
  };

  const handleSaveClassInfo = async (updatedData: {
    title: string;
    description: string;
    section?: string;
    subject?: string;
    room?: string;
  }) => {
    if (!classId) return;

    try {
      const updated = await updateClass(classId, updatedData);
      setClassData({
        id: updated.id || '',
        title: updated.title || '',
        description: updated.description,
        classCode: updated.classCode,
        section: updated.section,
        subject: updated.subject,
        room: updated.room,
        teacher: updated.teacher,
        module: updated.module,
      });
    } catch (err: any) {
      console.error('Error updating class:', err);
    }
  };

  const handleEditAssignment = async (streamItemId: string) => {
    try {
      // Obtener el assignment asociado al stream item
      const assignmentData = await getAssignmentByStreamItemId(streamItemId);

      // Obtener el stream item para tener el título y contenido
      const streamItem = streamItems.find(item => item.id === streamItemId);

      if (!streamItem) {
        console.error('Stream item not found');
        return;
      }

      // Determinar assignTo basado en los datos
      let assignTo: 'all' | 'groups' | 'students' = 'all';
      if (assignmentData) {
        if (assignmentData.assignedGroups && assignmentData.assignedGroups.length > 0) {
          assignTo = 'groups';
        } else if (assignmentData.selectedStudents && assignmentData.selectedStudents.length > 0) {
          assignTo = 'students';
        }
      }

      // Preparar los datos para el modal de edición (formato AssignmentModal)
      const editData: AssignmentData = {
        title: streamItem.title,
        instructions: assignmentData?.instructions || streamItem.content || '',
        points: assignmentData?.points,
        dueDate: assignmentData?.dueDate,
        dueTime: assignmentData?.dueTime,
        topic: 'No topic', // Por defecto
        assignTo: assignTo,
        selectedGroups: assignmentData?.assignedGroups || [],
        selectedStudents: assignmentData?.selectedStudents || [],
        attachments: (streamItem.attachments || []) as any,
      };

      setEditingAssignment({
        id: streamItemId,
        data: editData,
      });
      setAssignmentModalOpen(true);
    } catch (err) {
      console.error('Error loading assignment for editing:', err);
    }
  };

  const handleUpdateAssignment = async (assignment: AssignmentData) => {
    if (!editingAssignment) return;

    try {
      const streamItemId = editingAssignment.id;

      // Actualizar el stream item (título y contenido)
      await updateStreamItem(streamItemId, {
        title: assignment.title || '',
        content: assignment.instructions,
      });

      // Convertir el formato del modal al formato del servicio
      const assignToAll = assignment.assignTo === 'all';
      const assignedGroups = assignment.assignTo === 'groups' ? (assignment.selectedGroups || []) : [];
      const selectedStudents = assignment.assignTo === 'students' ? (assignment.selectedStudents || []) : [];

      // Actualizar el assignment
      await saveAssignmentService({
        streamItemId: streamItemId,
        points: assignment.points,
        dueDate: assignment.dueDate,
        dueTime: assignment.dueTime,
        instructions: assignment.instructions,
        assignToAll: assignToAll,
        assignedGroups: assignedGroups,
        selectedStudents: selectedStudents,
      });

      // Recargar los stream items
      await loadStreamItems();

      // Cerrar el modal
      setAssignmentModalOpen(false);
      setEditingAssignment(null);
    } catch (err) {
      console.error('Error updating assignment:', err);
    }
  };

  const handleArchiveAssignment = async (streamItemId: string) => {
    try {
      // Usar la función genérica que funciona para todos los tipos
      await archiveStreamItemService(streamItemId);
      await loadStreamItems();
    } catch (err) {
      console.error('Error archiving item:', err);
    }
  };

  const handleUnarchiveAssignment = async (streamItemId: string) => {
    try {
      // Usar la función genérica que funciona para todos los tipos
      await unarchiveStreamItemService(streamItemId);
      await loadStreamItems();
    } catch (err) {
      console.error('Error unarchiving item:', err);
    }
  };

  // Imagen de fondo para el header - usar la misma lógica que en Home
  const backgroundImages = [
    classroomCode,
    classroomRead,
    classroomBookclub,
    classroomBacktoschool,
  ];

  // Usar backgroundImage de la clase si está disponible, sino calcular basado en el ID
  const getBackgroundImage = () => {
    if (classData?.backgroundImage) {
      // Si la clase tiene una imagen guardada, usarla
      return classData.backgroundImage;
    }
    // Si no, calcular basado en el ID de la clase para mantener consistencia
    if (classData?.id) {
      // Convertir el ID a un número para determinar qué imagen usar
      const hash = classData.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return backgroundImages[hash % backgroundImages.length];
    }
    return classroomCode; // Fallback
  };

  const backgroundImage = getBackgroundImage();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-medium"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-black mb-2">Clase no encontrada</h2>
          <button
            onClick={() => navigate('/dashboard/home')}
            className="text-brand-green-medium hover:underline"
          >
            Volver a Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header con imagen de fondo */}
      <div className="relative">
        <div
          className="h-40 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="max-w-7xl mx-auto flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-normal text-white mb-1 drop-shadow-lg">{classData.title}</h1>
                {classData.description && (
                  <p className="text-white text-sm drop-shadow-md">{classData.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 hidden">
                <button
                  className="px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  title="Customize"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden md:inline">Customize</span>
                </button>
                <button
                  className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-md transition-colors"
                  title="View class information"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-4 p-4">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-3 hidden">
          {/* Meet Link */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hidden">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <img
                  src="https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-48dp/logo_meet_2020q4_color_1x_web_48dp.png"
                  alt="Meet"
                  className="w-6 h-6"
                />
                Meet
              </h2>
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Class Code */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">Class code</h2>
              <div className="relative">
                <button
                  onClick={() => setClassCodeMenuOpen(!classCodeMenuOpen)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                  </svg>
                </button>
                {classCodeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setClassCodeMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                      <button
                        onClick={() => {
                          setClassCodeMenuOpen(false);
                          setEditClassModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2 hidden"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={handleCopyInviteLink}
                        className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy class invite link
                      </button>
                      <button
                        onClick={handleCopyClassCode}
                        className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy class code
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Reset class code
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2 border-t border-gray-200">
                        <PowerOff className="w-4 h-4" />
                        Turn off
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium text-gray-900">
                {classData.classCode || 'jqrkw6br'}
              </div>
              <button
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Display class code"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hidden">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Upcoming</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 font-medium">No work due soon</span>
              </div>
              <p className="text-xs text-gray-500">Woohoo, no work due soon!</p>
              <button className="text-sm text-brand-green-medium hover:underline mt-2">
                View all
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex gap-6">
              {/* Stream tab está oculto y no se usa */}
              {false && (
                <button
                  onClick={() => setActiveTab('stream' as any)}
                  className={`hidden pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${(activeTab as any) === 'stream'
                    ? 'border-brand-green-medium text-brand-green-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Stream
                </button>
              )}
              <button
                onClick={() => setActiveTab('classwork')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'classwork'
                  ? 'border-brand-green-medium text-brand-green-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                Classwork
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors hidden ${activeTab === 'people'
                  ? 'border-brand-green-medium text-brand-green-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                People
              </button>
              {false && (
                <button
                  onClick={() => setActiveTab('grades')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'grades'
                    ? 'border-brand-green-medium text-brand-green-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Grades
                </button>
              )}
            </nav>
          </div>

          {/* Content based on active tab */}
          {/* Stream tab está oculto y no se usa */}
          {false && (activeTab as any) === 'stream' && (
            <div className="hidden space-y-3">
              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAnnouncementModalOpen(true)}
                  className="hidden px-4 py-2 bg-brand-green-light text-white rounded-md hover:bg-brand-green-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  New announcement
                </button>
                <button className="hidden px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Reuse post
                </button>
              </div>

              {/* Stream items */}
              {streamItems.length > 0 ? (
                <div className="space-y-3">
                  {streamItems.map((item) => (
                    <StreamItem
                      key={item.id}
                      id={item.id || ''}
                      type={item.type}
                      title={item.title}
                      content={item.content}
                      author={item.author}
                      createdAt={item.createdAt || ''}
                      classId={item.classId}
                      className={item.className}
                      attachments={item.attachments as any}
                      onEdit={(id) => {
                        if (item.type === 'assignment' || item.type === 'quiz') {
                          handleEditAssignment(id);
                        }
                      }}
                      onArchive={(id) => {
                        if (item.type === 'assignment' || item.type === 'quiz') {
                          handleArchiveAssignment(id);
                        }
                      }}
                      onUnarchive={(id) => {
                        if (item.type === 'assignment' || item.type === 'quiz') {
                          handleUnarchiveAssignment(id);
                        }
                      }}
                      isArchived={item.isArchived}
                      onDelete={async (id) => {
                        try {
                          // Si es un assignment, también eliminar el assignment
                          if (item.type === 'assignment' || item.type === 'quiz') {
                            const assignmentData = await getAssignmentByStreamItemId(id);
                            if (assignmentData) {
                              // Buscar el assignment ID desde la base de datos
                              const { data: assignment } = await supabase
                                .from('assignments')
                                .select('id')
                                .eq('stream_item_id', id)
                                .single();

                              if (assignment?.id) {
                                await deleteAssignmentFromService(assignment.id);
                              }
                            }
                          }

                          // Eliminar el stream item
                          await deleteStreamItemFromService(id);
                          await loadStreamItems();
                        } catch (err) {
                          console.error('Error deleting stream item:', err);
                        }
                      }}
                      onClick={(id, clickedClassId) => {
                        // Navegar a la clase cuando se hace clic en el item
                        console.log('StreamItem clicked in ClassDetail:', { id, clickedClassId, currentClassId: classId });
                        if (clickedClassId) {
                          console.log('Navigating to class:', clickedClassId);
                          navigate(`/dashboard/classes/${clickedClassId}?tab=stream`);
                        } else {
                          console.warn('No classId available for stream item:', id, 'item:', item);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <svg
                    viewBox="0 0 241 149"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-48 h-32 mx-auto mb-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M138.19 145.143L136.835 145.664C134.646 146.498 132.249 145.352 131.519 143.164L82.4271 8.37444C81.5933 6.18697 82.7398 3.79117 84.9286 3.06201L86.2836 2.54118C88.4724 1.70786 90.8697 2.85368 91.5993 5.04115L140.691 139.831C141.421 142.018 140.379 144.414 138.19 145.143Z"
                      stroke="#5F6368"
                      strokeWidth="2"
                    />
                    <path
                      d="M225.952 147.956H157.994C154.554 147.956 151.74 145.143 151.74 141.706V73.79C151.74 70.3525 154.554 67.54 157.994 67.54H225.952C229.391 67.54 232.205 70.3525 232.205 73.79V141.706C232.205 145.247 229.495 147.956 225.952 147.956Z"
                      stroke="#5F6368"
                      strokeWidth="2"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    This is where you can talk to your class
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Use the stream to share announcements, post assignments, and respond to student questions
                  </p>
                  <button
                    onClick={() => setEditClassModalOpen(true)}
                    className="px-4 py-2 bg-brand-green-light text-white rounded-md hover:bg-brand-green-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Settings className="w-4 h-4" />
                    Stream settings
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classwork' && (
            <Classwork classId={classId || ''} isTeacher={true} className={classData?.title || ''} />
          )}

          {activeTab === 'people' && (
            <div className="hidden">
              <People classId={classId || ''} isTeacher={true} />
            </div>
          )}

          {activeTab === 'grades' && (
            <Grades classId={classId || ''} isTeacher={true} />
          )}
        </main>

        {/* Announcement Modal */}
        <AnnouncementModal
          isOpen={announcementModalOpen}
          onClose={() => setAnnouncementModalOpen(false)}
          classId={classId || ''}
          className={classData?.title || ''}
          onSave={(announcement: AnnouncementData) => {
            console.log('Saving announcement:', announcement);
            // Create stream item
            const content = announcement.content || '';
            const streamItem = {
              id: `announcement_${Date.now()}`,
              type: 'announcement' as const,
              title: content.length > 50 ? content.substring(0, 50) + '...' : (content || 'Announcement'),
              content: content,
              author: {
                name: 'Current User', // TODO: Get from auth
                avatar: undefined
              },
              createdAt: new Date().toISOString(),
              attachments: announcement.attachments || []
            };
            saveStreamItem(streamItem);
            setAnnouncementModalOpen(false);
          }}
        />

        {/* Edit Class Modal */}
        {classData && (
          <EditClassModal
            isOpen={editClassModalOpen}
            onClose={() => setEditClassModalOpen(false)}
            classData={{ ...classData, description: classData.description || '' }}
            onSave={handleSaveClassInfo}
          />
        )}

        {/* Assignment Modal for Editing */}
        <AssignmentModal
          isOpen={assignmentModalOpen}
          onClose={() => {
            setAssignmentModalOpen(false);
            setEditingAssignment(null);
          }}
          classId={classId || ''}
          className={classData?.title || ''}
          initialData={editingAssignment?.data}
          isEdit={!!editingAssignment}
          onSave={(assignment: AssignmentData) => {
            if (editingAssignment) {
              handleUpdateAssignment(assignment);
            }
          }}
        />
      </div>
    </div>
  );
};

