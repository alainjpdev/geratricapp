import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { loadClasses, createClass, updateClass, ClassData } from '../services/classService';
import { getTeachers, UserData } from '../services/userService';
import { getAssignmentsForStudent, getAssignmentByStreamItemId } from '../services/assignmentService';
import { getSubmission } from '../services/submissionService';
import { FileText, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { AssignmentSubmissionModal } from '../components/ui/AssignmentSubmissionModal';

interface ClassListItem {
  id: string;
  title: string;
  description: string;
  module?: { id: string; title: string };
  moduleId?: string;
  teacherId?: string;
  teacher?: { id: string; firstName: string; lastName: string };
}

interface AssignmentWithStatus {
  id: string;
  title: string;
  classId: string;
  className: string;
  dueDate?: string;
  dueTime?: string;
  points?: number;
  submissionStatus: string | null;
  submissionDate?: string;
  streamItemId?: string;
  instructions?: string;
}

const Classes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<{ id?: string; title: string; description: string; moduleId?: string }>({ title: '', description: '', moduleId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentWithStatus | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Si es estudiante, cargar assignments con su estado
        if (user.role === 'student') {
          const studentAssignments = await getAssignmentsForStudent(user.id, user.grupoAsignado);
          
          // Obtener el estado de submission para cada assignment
          const assignmentsWithStatus = await Promise.all(
            studentAssignments.map(async (assignment) => {
              try {
                const submission = await getSubmission(assignment.id, user.id);
                return {
                  id: assignment.id,
                  title: assignment.title,
                  classId: assignment.classId,
                  className: assignment.className || 'Sin clase',
                  dueDate: assignment.dueDate,
                  dueTime: assignment.dueTime,
                  points: assignment.points,
                  submissionStatus: submission?.status || null,
                  submissionDate: submission?.submittedAt || undefined,
                  streamItemId: assignment.streamItemId,
                  instructions: assignment.instructions,
                } as AssignmentWithStatus;
              } catch (error) {
                console.error(`Error loading submission for assignment ${assignment.id}:`, error);
                return {
                  id: assignment.id,
                  title: assignment.title,
                  classId: assignment.classId,
                  className: assignment.className || 'Sin clase',
                  dueDate: assignment.dueDate,
                  dueTime: assignment.dueTime,
                  points: assignment.points,
                  submissionStatus: null,
                  streamItemId: assignment.streamItemId,
                  instructions: assignment.instructions,
                } as AssignmentWithStatus;
              }
            })
          );
          
          setAssignments(assignmentsWithStatus);
          setLoading(false);
        } else {
          // Si es admin o teacher, cargar clases
          const classesData = await loadClasses(user.id);
          setClasses(classesData.map(cls => ({
            id: cls.id!,
            title: cls.title,
            description: cls.description || '',
            module: (cls as any).module,
            moduleId: cls.moduleId,
            teacherId: cls.teacherId,
            teacher: (cls as any).teacher,
          } as ClassListItem)));
          setLoading(false);
          
          // Cargar profesores
          const teachers = await getTeachers();
          setUsers(teachers.map(u => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
          })));
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setLoading(false);
        setUserError('Error al cargar datos');
      }
    };
    
    fetchData();
  }, [user?.id, user?.role, user?.grupoAsignado]);

  const handleTeacherChange = async (classId: string, teacherId: string) => {
    const updatedClasses = classes.map(cls => {
      if (cls.id === classId) {
        return { ...cls, teacherId };
      }
      return cls;
    });
    setClasses(updatedClasses);
    setSaveMsg(null);
    try {
      await updateClass(classId, { teacherId });
      setSaveMsg('Profesor asignado correctamente');
    } catch (err) {
      console.error('Error updating teacher:', err);
      setSaveMsg('Error al asignar profesor');
    }
  };

  const openCreateModal = () => {
    setEdit({ title: '', description: '', moduleId: '' });
    setModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const openEditModal = (cls: any) => {
    setEdit({ id: cls.id, title: cls.title, description: cls.description, moduleId: cls.module?.id || '' });
    setModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEdit({ title: '', description: '', moduleId: '' });
    setError(null);
    setSuccessMsg(null);
  };

  const handleSaveClass = async () => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (edit.id) {
        // Editar clase
        const updated = await updateClass(edit.id, {
          title: edit.title,
          description: edit.description,
          moduleId: edit.moduleId || undefined
        });
        setClasses(classes => classes.map(c => c.id === edit.id ? {
          id: updated.id!,
          title: updated.title,
          description: updated.description || '',
          module: (updated as any).module,
          moduleId: updated.moduleId,
          teacherId: updated.teacherId,
          teacher: (updated as any).teacher,
        } as ClassListItem : c));
        setSuccessMsg('¡Clase actualizada correctamente!');
      } else {
        // Crear clase
        const classData: ClassData = {
          title: edit.title,
          description: edit.description,
          classCode: '',
          teacherId: user.id,
          moduleId: edit.moduleId || undefined,
        };
        const created = await createClass(classData);
        setClasses(classes => [...classes, {
          id: created.id!,
          title: created.title,
          description: created.description || '',
          module: (created as any).module,
          moduleId: created.moduleId,
          teacherId: created.teacherId,
          teacher: (created as any).teacher,
        } as ClassListItem]);
        setSuccessMsg('¡Clase creada correctamente!');
      }
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err: any) {
      console.error('Error saving class:', err);
      setError(err.message || 'Error al guardar la clase');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" />
          No enviada
        </span>
      );
    }
    
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <FileText className="w-3 h-3" />
            Borrador
          </span>
        );
      case 'submitted':
      case 'to_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" />
            Enviada
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <CheckCircle2 className="w-3 h-3" />
            Revisada
          </span>
        );
      case 'graded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            Calificada
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            Devuelta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Vista para estudiantes: tabla de assignments
  if (user?.role === 'student') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text mb-6 flex items-center justify-between">
          <span>Mis Assignments</span>
        </h1>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-text">Título</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Clase</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Fecha de vencimiento</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Puntos</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Fecha de envío</th>
                  <th className="text-left py-3 px-4 font-medium text-text">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {userError ? (
                  <tr><td colSpan={7} className="py-6 text-center text-red-600">{userError}</td></tr>
                ) : loading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500">{t('loading', 'Cargando...')}</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500">No hay assignments asignados</td></tr>
                ) : (
                  assignments.map(assignment => (
                    <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{assignment.title}</td>
                      <td className="py-3 px-4">{assignment.className}</td>
                      <td className="py-3 px-4">
                        {assignment.dueDate ? (
                          <div>
                            {new Date(assignment.dueDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {assignment.dueTime && (
                              <span className="text-xs text-gray-500 block">{assignment.dueTime}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin fecha</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {assignment.points !== undefined ? (
                          <span className="font-medium">{assignment.points} pts</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(assignment.submissionStatus)}
                      </td>
                      <td className="py-3 px-4">
                        {assignment.submissionDate ? (
                          <span className="text-sm text-gray-600">
                            {new Date(assignment.submissionDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={async () => {
                            try {
                              // Verificar acceso
                              const { getStudentClasses } = await import('../services/classService');
                              const studentClasses = await getStudentClasses(user.id);
                              const hasAccess = studentClasses.some(c => c.id === assignment.classId);
                              
                              if (!hasAccess) {
                                alert('No tienes acceso a esta clase');
                                return;
                              }

                              // Cargar detalles completos del assignment
                              const fullAssignment = await getAssignmentByStreamItemId(assignment.streamItemId || assignment.id);
                              if (fullAssignment) {
                                setViewingAssignment({
                                  ...assignment,
                                  streamItemId: assignment.streamItemId || assignment.id,
                                  instructions: fullAssignment.instructions,
                                });
                                setSubmissionModalOpen(true);
                              } else {
                                alert('No se pudo cargar el assignment');
                              }
                            } catch (error) {
                              console.error('Error loading assignment:', error);
                              alert('Error al cargar el assignment');
                            }
                          }}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal para ver assignment enviado */}
        {viewingAssignment && (
          <AssignmentSubmissionModal
            isOpen={submissionModalOpen}
            onClose={() => {
              setSubmissionModalOpen(false);
              setViewingAssignment(null);
            }}
            assignmentId={viewingAssignment.id}
            streamItemId={viewingAssignment.streamItemId || viewingAssignment.id}
            assignmentTitle={viewingAssignment.title}
            instructions={viewingAssignment.instructions}
            dueDate={viewingAssignment.dueDate}
            dueTime={viewingAssignment.dueTime}
            onSubmitted={async () => {
              // Recargar assignments después de enviar
              const fetchData = async () => {
                if (!user?.id) return;
                
                try {
                  const studentAssignments = await getAssignmentsForStudent(user.id, user.grupoAsignado);
                  
                  const assignmentsWithStatus = await Promise.all(
                    studentAssignments.map(async (assignment) => {
                      try {
                        const submission = await getSubmission(assignment.id, user.id);
                        return {
                          id: assignment.id,
                          title: assignment.title,
                          classId: assignment.classId,
                          className: assignment.className || 'Sin clase',
                          dueDate: assignment.dueDate,
                          dueTime: assignment.dueTime,
                          points: assignment.points,
                          submissionStatus: submission?.status || null,
                          submissionDate: submission?.submittedAt || undefined,
                          streamItemId: assignment.streamItemId,
                          instructions: assignment.instructions,
                        };
                      } catch (error) {
                        console.error(`Error loading submission for assignment ${assignment.id}:`, error);
                        return {
                          id: assignment.id,
                          title: assignment.title,
                          classId: assignment.classId,
                          className: assignment.className || 'Sin clase',
                          dueDate: assignment.dueDate,
                          dueTime: assignment.dueTime,
                          points: assignment.points,
                          submissionStatus: null,
                          streamItemId: assignment.streamItemId,
                          instructions: assignment.instructions,
                        };
                      }
                    })
                  );
                  
                  setAssignments(assignmentsWithStatus);
                } catch (err) {
                  console.error('Error loading data:', err);
                }
              };
              await fetchData();
            }}
          />
        )}
      </div>
    );
  }

  // Vista para admin/teacher: tabla de clases
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text mb-6 flex items-center justify-between">
        {t('adminDashboard.allClasses', 'Todas las Clases')}
        {user?.role === 'admin' && (
          <Button size="sm" variant="primary" onClick={openCreateModal}>Agregar Clase</Button>
        )}
      </h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-text">Título</th>
                <th className="text-left py-3 px-4 font-medium text-text">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-text">Módulo</th>
                <th className="text-left py-3 px-4 font-medium text-text">Profesor</th>
                <th className="text-left py-3 px-4 font-medium text-text">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {userError ? (
                <tr><td colSpan={5} className="py-6 text-center text-red-600">{userError}</td></tr>
              ) : loading ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">{t('loading', 'Cargando...')}</td></tr>
              ) : classes.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">{t('adminDashboard.noClasses', 'No hay clases')}</td></tr>
              ) : (
                classes.map(cls => (
                  <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{cls.title}</td>
                    <td className="py-3 px-4">{cls.description}</td>
                    <td className="py-3 px-4">{cls.module?.title || cls.moduleId || '-'}</td>
                    <td className="py-3 px-4">
                      {Array.isArray(users) && users.length > 0 ? (
                        <select
                          value={cls.teacherId || ''}
                          onChange={e => handleTeacherChange(cls.id, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="">Sin asignar</option>
                          {users.filter(u => u.role === 'teacher' || u.role === 'admin').map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.firstName} {teacher.lastName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-400">
                          {cls.teacher ? `${cls.teacher.firstName} ${cls.teacher.lastName}` : 'Sin asignar'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user?.role === 'admin' && (
                        <Button size="sm" variant="outline" onClick={() => openEditModal(cls)}>Editar</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {saveMsg && <div className={saveMsg.includes('Error') ? 'text-red-600 mt-2' : 'text-green-600 mt-2'}>{saveMsg}</div>}
      {/* Modal de gestión de clase */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-panel rounded-lg shadow-2xl p-8 w-full max-w-md border border-border relative">
            <button className="absolute top-2 right-2 text-text-secondary hover:text-text" onClick={closeModal}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-text">{edit.id ? 'Editar Clase' : 'Agregar Clase'}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
              <input type="text" className="w-full border border-border rounded px-3 py-2 bg-panel text-text focus:outline-none focus:ring-2 focus:ring-primary" value={edit.title} onChange={e => setEdit(edit => ({ ...edit, title: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
              <textarea className="w-full border border-border rounded px-3 py-2 bg-panel text-text focus:outline-none focus:ring-2 focus:ring-primary" value={edit.description} onChange={e => setEdit(edit => ({ ...edit, description: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Módulo</label>
              <select className="w-full border border-border rounded px-3 py-2 bg-panel text-text" value={edit.moduleId} onChange={e => setEdit(edit => ({ ...edit, moduleId: e.target.value }))}>
                <option value="">Sin módulo</option>
                {/* Assuming 'modules' state is managed elsewhere or passed as a prop */}
                {/* For now, we'll just show a placeholder or assume it's available */}
                {/* {Array.isArray(modules) && modules.map(m => ( */}
                {/*   <option key={m.id} value={m.id}>{m.title}</option> */}
                {/* ))} */}
              </select>
            </div>
            {error && <div className="text-error mb-2">{error}</div>}
            {successMsg && <div className="text-success mb-2">{successMsg}</div>}
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={handleSaveClass} disabled={saving}>{saving ? 'Guardando...' : (edit.id ? 'Guardar Cambios' : 'Crear')}</Button>
              <Button size="sm" variant="outline" onClick={closeModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes; 