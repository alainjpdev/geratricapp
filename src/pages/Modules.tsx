import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../services/api';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
// Sin autenticación, no necesitamos useAuthStore
import useAutoTranslate from '../hooks/useAutoTranslate';
import { testModules, createTestModule } from '../data/testModules';

const Modules: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<{ title: string; description: string; url: string }>({ title: '', description: '', url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Sin autenticación, usar rol admin por defecto
  const userRole = 'admin';
  const [allModules, setAllModules] = useState<any[]>([]); // Para todos los módulos
  const [assignedModuleIds, setAssignedModuleIds] = useState<string[]>([]); // Solo ids asignados
  // Estado para el modal de assignment
  const [assignmentModal, setAssignmentModal] = useState<{ open: boolean; moduleId: string | null }>({ open: false, moduleId: null });
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentSaved, setAssignmentSaved] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  // Simulación de assignments guardados por módulo (en memoria + backend)
  const [userAssignments, setUserAssignments] = useState<{ [moduleId: string]: string }>({});

  useEffect(() => {
    // Función para cargar módulos de prueba como fallback
    const loadTestModules = () => {
      if (userRole === 'student') {
        setAllModules(testModules);
        setAssignedModuleIds(['mod-001', 'mod-002']); // Simular módulos asignados
      } else {
        setModules(testModules);
      }
      setLoading(false);
    };

    // Sin backend, siempre usar módulos de prueba
    console.log('Cargando módulos de prueba (sin backend)...');
    loadTestModules();
  }, []);

  const openModal = (module: any) => {
    setSelected(module);
    setEdit({ title: module.title, description: module.description, url: module.url });
    setModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setEdit({ title: '', description: '', url: '' });
    setError(null);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.put(`/api/modules/${selected.id}`, edit);
      const updated = res.data;
      setModules(modules => modules.map(m => m.id === selected.id ? updated : m));
      setSuccessMsg('¡Módulo actualizado correctamente!');
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm('¿Seguro que quieres eliminar este módulo?')) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.delete(`/api/modules/${selected.id}`);
      setModules(modules => modules.filter(m => m.id !== selected.id));
      setSuccessMsg('¡Módulo eliminado correctamente!');
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setError('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  // Agregar función para crear módulo
  const openCreateModal = () => {
    setSelected(null);
    setEdit({ title: '', description: '', url: '' });
    setModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post('/api/modules', edit);
      const created = res.data;
      setModules(modules => [...modules, created]);
      setSuccessMsg('¡Módulo creado correctamente!');
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setError('Error al crear');
    } finally {
      setSaving(false);
    }
  };

  // Función para reordenar el array
  function reorder(list: any[], startIndex: number, endIndex: number) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newOrder = reorder(modules, result.source.index, result.destination.index);
    setModules(newOrder);
    // Enviar el nuevo orden al backend
    try {
      await apiClient.put('/api/modules/reorder', {
        orderedIds: newOrder.map(m => m.id)
      });
    } catch (err) {
      // Manejar error (opcional: revertir el orden en el frontend)
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este módulo?')) return;
    try {
      await apiClient.delete(`/api/modules/${id}`);
      setModules(modules => modules.filter(m => m.id !== id));
    } catch (err) {
      alert('Error al eliminar el módulo');
    }
  };

  const handleOpenAssignment = async (moduleId: string) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    setAssignmentText('');
    setAssignmentModal({ open: true, moduleId });
    setAssignmentSaved(false);
    try {
      // Sin backend, cargar desde localStorage
      const savedAssignment = localStorage.getItem(`assignment_${moduleId}`);
      if (savedAssignment) {
        const data = JSON.parse(savedAssignment);
        setAssignmentText(data.content || '');
        setUserAssignments(prev => ({ ...prev, [moduleId]: data.content || '' }));
      }
    } catch (err) {
      console.log('Error al cargar assignment:', err);
      setAssignmentError('No se pudo cargar el assignment.');
    } finally {
      setAssignmentLoading(false);
    }
  };
  const handleCloseAssignment = () => {
    setAssignmentModal({ open: false, moduleId: null });
    setAssignmentText('');
    setAssignmentSaved(false);
    setAssignmentError(null);
  };
  const handleSaveAssignment = async () => {
    if (!assignmentModal.moduleId) return;
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      // Sin backend, guardar en localStorage
      const assignmentData = {
        moduleId: assignmentModal.moduleId,
        content: assignmentText,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`assignment_${assignmentModal.moduleId}`, JSON.stringify(assignmentData));
      setUserAssignments(prev => ({ ...prev, [assignmentModal.moduleId!]: assignmentText }));
      setAssignmentSaved(true);
      setTimeout(() => {
        setAssignmentSaved(false);
        setTimeout(() => {
          handleCloseAssignment();
        }, 500);
      }, 1500);
    } catch (err) {
      console.log('Error al guardar assignment:', err);
      setAssignmentError('No se pudo guardar el assignment.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const TranslatedModuleCard: React.FC<{ module: any; i18n: any; isActive: boolean }> = ({ module, i18n, isActive }) => {
    const translatedTitle = useAutoTranslate(module.title, 'es', i18n.language);
    const translatedDescription = useAutoTranslate(module.description, 'es', i18n.language);
    return (
      <div
        className={`bg-panel border border-border rounded-xl shadow-md overflow-hidden flex flex-col ${!isActive ? 'opacity-60' : ''}`}
      >
        <img
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
          alt="Imagen del módulo"
          className="w-full h-[150px] object-cover"
        />
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full inline-block mb-2">
              ARTIFICIAL INTELLIGENCE
            </span>
            <h3 className="text-lg font-bold text-text mb-1">{translatedTitle}</h3>
            <p className="text-sm text-text-secondary mb-2">{translatedDescription}</p>
            <p className="text-xs text-text-secondary">Grades: 3–6</p>
            <p className="text-xs text-text-secondary mb-4">Duration: Lesson</p>
          </div>
          <div className="flex gap-2 mt-4">
            {isActive ? (
              <>
                <a
                  href={module.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-white font-medium text-sm py-2 px-4 rounded hover:bg-primary/80 transition"
                >
                  Let’s Go
                </a>
                <button
                  type="button"
                  className="font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-primary text-primary hover:bg-bg focus:ring-primary px-3 py-1.5 text-sm"
                  onClick={() => handleOpenAssignment(module.id)}
                >
                  Assignment
                </button>
              </>
            ) : (
              <button
                className="mt-auto bg-gray-400 text-white font-medium text-sm py-2 px-4 rounded cursor-not-allowed"
                disabled
              >
                Not Assigned
              </button>
            )}
          </div>
          {userAssignments[module.id] && (
            <div className="mt-2 text-xs text-success">Assignment guardado</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text mb-6 flex items-center justify-between">
          {t('adminDashboard.allModules', 'Todos los Módulos')}
          {user?.role === 'admin' && (
            <Button size="sm" variant="primary" onClick={openCreateModal}>
              {t('adminDashboard.createModule', 'Crear Módulo')}
            </Button>
          )}
        </h1>
    
        {loading ? (
          <p className="text-center text-text-secondary py-10">{t('loading', 'Cargando...')}</p>
        ) : user?.role === 'student' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {allModules.length === 0 ? (
              <p className="text-center text-text-secondary col-span-full">
                {t('adminDashboard.noModules', 'No hay módulos')}
              </p>
            ) : (
              allModules.map((module) => {
                const isActive = assignedModuleIds.includes(module.id);
                return (
                  <TranslatedModuleCard key={module.id} module={module} i18n={i18n} isActive={isActive} />
                );
              })
            )}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="modules-table">
                  {(provided: DroppableProvided) => (
                    <table className="w-full" ref={provided.innerRef} {...provided.droppableProps}>
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-text-secondary">Título</th>
                          <th className="text-left py-3 px-4 font-medium text-text-secondary">Descripción</th>
                          <th className="text-left py-3 px-4 font-medium text-text-secondary">URL</th>
                          <th className="text-left py-3 px-4 font-medium text-text-secondary">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modules.map((module, index) => (
                          <Draggable key={module.id} draggableId={module.id} index={index}>
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`border-b border-border hover:bg-panel ${snapshot.isDragging ? 'bg-primary/10' : ''}`}
                              >
                                <td className="py-3 px-4">{module.title}</td>
                                <td className="py-3 px-4">{module.description}</td>
                                <td className="py-3 px-4">
                                  <a href={module.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{module.url}</a>
                                </td>
                                <td className="py-3 px-4 flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openModal(module)}>Editar</Button>
                                  <Button size="sm" variant="danger" onClick={() => handleDeleteModule(module.id)}>Eliminar</Button>
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </tbody>
                    </table>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </Card>
        )}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-panel rounded-lg shadow-2xl p-8 w-full max-w-md border border-border relative">
            <button className="absolute top-2 right-2 text-text-secondary hover:text-text" onClick={closeModal}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-text">{selected ? 'Editar Módulo' : 'Crear Módulo'}</h2>
            <div className="mb-4 space-y-2">
              <input
                type="text"
                className="w-full border border-border rounded-lg px-3 py-2 mb-2"
                placeholder="Título"
                value={edit.title}
                onChange={e => setEdit({ ...edit, title: e.target.value })}
              />
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 mb-2"
                placeholder="Descripción"
                value={edit.description}
                onChange={e => setEdit({ ...edit, description: e.target.value })}
              />
              <input
                type="text"
                className="w-full border border-border rounded-lg px-3 py-2"
                placeholder="URL"
                value={edit.url}
                onChange={e => setEdit({ ...edit, url: e.target.value })}
              />
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="primary" onClick={selected ? handleSave : handleCreate} disabled={saving}>
                {selected ? 'Guardar' : 'Crear'}
              </Button>
              <Button size="sm" variant="outline" onClick={closeModal} disabled={saving}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Assignment */}
      {assignmentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-panel rounded-lg shadow-2xl p-8 w-full max-w-md border border-border relative">
            <button className="absolute top-2 right-2 text-text-secondary hover:text-text" onClick={handleCloseAssignment}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-text">Assignment del Módulo</h2>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 mb-2"
              placeholder="Pega aquí tu link o escribe tu texto..."
              value={assignmentText}
              onChange={e => setAssignmentText(e.target.value)}
              rows={4}
              disabled={assignmentLoading}
            />
            {assignmentLoading && <div className="text-blue-600 mb-2">Cargando...</div>}
            {assignmentSaved && <div className="text-green-600 mb-2">¡Assignment guardado!</div>}
            {assignmentError && <div className="text-red-500 mb-2">{assignmentError}</div>}
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="primary" onClick={handleSaveAssignment} disabled={assignmentLoading}>
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCloseAssignment} disabled={assignmentLoading}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modules; 