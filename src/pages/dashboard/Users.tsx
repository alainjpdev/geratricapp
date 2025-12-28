import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../config/supabaseClient';
import { getUsuarios, Usuario } from '../../services/supabaseDbService';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUsers, setEditUsers] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const currentUser = { id: '1', role: 'admin' };
  const [modules, setModules] = useState<any[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userModules, setUserModules] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'colaborador'
  });
  const [editUserForm, setEditUserForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'colaborador',
    activo: true
  });

  useEffect(() => {
    const loadUsersFromSupabase = async () => {
      try {
        setLoading(true);
        setSaveMsg(null);

        // Cargar todos los usuarios/colaboradores de la tabla usuarios
        const usuariosList = await getUsuarios();

        const mapped = usuariosList.map((u: Usuario) => ({
          id: u.id,
          firstName: u.nombre,
          lastName: u.apellido || '',
          email: u.email || '',
          telefono: u.telefono || '',
          role: u.rol,
          status: u.activo ? 'active' : 'suspended',
          notes: '',
          hours: 0,
          createdAt: u.id // Usaremos el ID como referencia temporal
        }));

        setUsers(mapped);
      } catch (err: any) {
        console.error('Error inesperado cargando usuarios desde Supabase:', err);
        setSaveMsg(err.message || 'Error inesperado al cargar usuarios');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    void loadUsersFromSupabase();
  }, []);

  useEffect(() => {
    if (saveMsg && saveMsg.includes('guardados correctamente')) {
      const timer = setTimeout(() => setSaveMsg(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [saveMsg]);

  // Obtener todos los módulos al montar
  useEffect(() => {
    // Datos mock para módulos (reemplazar con API real cuando esté disponible)
    const mockModules = [
      { id: '1', name: 'Dashboard', description: 'Panel principal' },
      { id: '2', name: 'Usuarios', description: 'Gestión de usuarios' },
      { id: '3', name: 'Cotizaciones', description: 'Gestión de cotizaciones' },
      { id: '4', name: 'CRM', description: 'Gestión de clientes' },
      { id: '5', name: 'Reportes', description: 'Generación de reportes' }
    ];
    setModules(mockModules);
  }, []);

  const openAssignModal = async (user: any) => {
    setSelectedUser(user);
    setAssignModalOpen(true);
    // Datos mock para módulos asignados al usuario
    const mockUserModules = user.id === '1' ? ['1', '2', '3'] : ['1', '4', '5'];
    setUserModules(mockUserModules);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedUser(null);
    setUserModules([]);
  };

  const handleToggleModule = (moduleId: string) => {
    setUserModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSaveModules = async () => {
    if (!selectedUser) return;
    // Simular guardado de módulos (reemplazar con API real cuando esté disponible)
    console.log('Guardando módulos para usuario:', selectedUser.id, 'Módulos:', userModules);
    setSaveMsg('Módulos asignados correctamente');
    closeAssignModal();
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message || 'Error al eliminar usuario');
      }

      setUsers(users => users.filter(u => u.id !== userId));
      setSaveMsg('Usuario eliminado correctamente');
    } catch (err: any) {
      setSaveMsg(err.message || 'Error al eliminar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.nombre || !newUser.rol) {
      setSaveMsg('Por favor completa nombre y rol');
      return;
    }

    try {
      setSaving(true);
      setSaveMsg(null);

      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          nombre: newUser.nombre,
          apellido: newUser.apellido || null,
          email: newUser.email || null,
          telefono: newUser.telefono || null,
          rol: newUser.rol,
          activo: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Error al crear usuario');
      }

      const mapped = {
        id: data.id,
        firstName: data.nombre,
        lastName: data.apellido || '',
        email: data.email || '',
        telefono: data.telefono || '',
        role: data.rol,
        status: data.activo ? 'active' : 'suspended',
        notes: '',
        hours: 0,
        createdAt: data.created_at
      };

      setUsers([mapped, ...users]);
      setNewUser({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        rol: 'colaborador'
      });
      setShowAddUser(false);
      setSaveMsg('Usuario creado correctamente');
    } catch (err: any) {
      setSaveMsg(err.message || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      nombre: user.firstName,
      apellido: user.lastName || '',
      email: user.email || '',
      telefono: user.telefono || '',
      rol: user.role,
      activo: user.status === 'active'
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editUserForm.nombre || !editUserForm.rol) {
      setSaveMsg('Por favor completa nombre y rol');
      return;
    }

    try {
      setSaving(true);
      setSaveMsg(null);

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nombre: editUserForm.nombre,
          apellido: editUserForm.apellido || null,
          email: editUserForm.email || null,
          telefono: editUserForm.telefono || null,
          rol: editUserForm.rol,
          activo: editUserForm.activo
          // updated_at se actualiza automáticamente por el trigger
        })
        .eq('id', editingUser.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Error al actualizar usuario');
      }

      const mapped = {
        id: data.id,
        firstName: data.nombre,
        lastName: data.apellido || '',
        email: data.email || '',
        telefono: data.telefono || '',
        role: data.rol,
        status: data.activo ? 'active' : 'suspended',
        notes: '',
        hours: 0,
        createdAt: data.created_at
      };

      setUsers(users.map(u => u.id === editingUser.id ? mapped : u));
      setShowEditUser(false);
      setEditingUser(null);
      setSaveMsg('Usuario actualizado correctamente');
    } catch (err: any) {
      setSaveMsg(err.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6 dark:bg-black bg-white min-h-screen p-0 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex-none p-4 md:p-0">
        <div className="flex flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold uppercase dark:text-white text-gray-900 mb-0 md:mb-2">{t('adminDashboard.allUsers', 'Todos los Usuarios')}</h1>
            <p className="dark:text-white text-gray-900 uppercase text-sm hidden md:block">Gestión de colaboradores de la empresa</p>
          </div>
          <Button
            onClick={() => setShowAddUser(true)}
            className="uppercase !p-2 md:!px-4 md:!py-2"
          >
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* Búsqueda */}
      <Card className="dark:bg-black/80 bg-white/80 backdrop-blur-sm dark:border-white/20 border-gray-200 mx-4 md:mx-0" padding="none">
        <div className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 dark:text-white text-gray-900" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2 text-sm md:text-base border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase dark:placeholder-gray-400 placeholder-gray-500"
            />
          </div>
        </div>
      </Card>

      {/* Mensaje de éxito/error */}
      {saveMsg && (
        <Card className={`${saveMsg.includes('Error') ? 'bg-red-900/20 border-red-800' : 'bg-green-900/20 border-green-800'}`}>
          <div className="p-4">
            <p className={`uppercase text-sm ${saveMsg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>
          </div>
        </Card>
      )}

      {/* Modal Agregar Usuario */}
      {showAddUser && (
        <div className="fixed inset-0 dark:bg-black/80 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 w-full max-w-2xl">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold uppercase dark:text-white text-gray-900">Nuevo Usuario</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Nombre *</label>
                  <input
                    type="text"
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Apellido</label>
                  <input
                    type="text"
                    value={newUser.apellido}
                    onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Apellido"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Teléfono</label>
                  <input
                    type="text"
                    value={newUser.telefono}
                    onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                    placeholder="Teléfono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Rol *</label>
                  <select
                    value={newUser.rol}
                    onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="productor">Productor</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="iluminacion">Iluminación</option>
                    <option value="audio">Audio</option>
                    <option value="escenografia">Escenografía</option>
                    <option value="transporte">Transporte</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({
                      nombre: '',
                      apellido: '',
                      email: '',
                      telefono: '',
                      rol: 'colaborador'
                    });
                  }}
                  className="uppercase"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddUser}
                  className="uppercase"
                  disabled={saving}
                >
                  {saving ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 dark:bg-black/80 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="dark:bg-black bg-white dark:border-white/20 border-gray-200 w-full max-w-2xl">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold uppercase dark:text-white text-gray-900">Editar Usuario</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Nombre *</label>
                  <input
                    type="text"
                    value={editUserForm.nombre}
                    onChange={(e) => setEditUserForm({ ...editUserForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Apellido</label>
                  <input
                    type="text"
                    value={editUserForm.apellido}
                    onChange={(e) => setEditUserForm({ ...editUserForm, apellido: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                    placeholder="Apellido"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase text-white">Teléfono</label>
                  <input
                    type="text"
                    value={editUserForm.telefono}
                    onChange={(e) => setEditUserForm({ ...editUserForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600"
                    placeholder="Teléfono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Rol *</label>
                  <select
                    value={editUserForm.rol}
                    onChange={(e) => setEditUserForm({ ...editUserForm, rol: e.target.value })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="productor">Productor</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="iluminacion">Iluminación</option>
                    <option value="audio">Audio</option>
                    <option value="escenografia">Escenografía</option>
                    <option value="transporte">Transporte</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase dark:text-white text-gray-900">Estado</label>
                  <select
                    value={editUserForm.activo ? 'active' : 'suspended'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, activo: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border dark:border-white/30 border-gray-300 dark:bg-black/50 bg-white dark:text-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-600 uppercase"
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                  }}
                  className="uppercase"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  className="uppercase"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <Card className="bg-black/80 backdrop-blur-sm border-gray-800">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 font-medium text-white uppercase">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-white uppercase">Email</th>
                <th className="text-left py-3 px-4 font-medium text-white uppercase">Teléfono</th>
                <th className="text-left py-3 px-4 font-medium text-white uppercase">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-white uppercase">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center dark:text-white text-gray-900 uppercase">{t('loading', 'Cargando...')}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center dark:text-white text-gray-900 uppercase">{t('adminDashboard.noUsers', 'No hay usuarios')}</td></tr>
              ) : (
                filteredUsers.map(user => {
                  return (
                    <tr key={user.id} className="border-b dark:border-white/20 border-gray-200 dark:hover:bg-white/5 hover:bg-gray-100/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium dark:text-white text-gray-900 uppercase">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="py-3 px-4 dark:text-white text-gray-900">{user.email || '-'}</td>
                      <td className="py-3 px-4 dark:text-white text-gray-900">{user.telefono || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium uppercase dark:bg-white/10 bg-gray-200 dark:text-white text-gray-900 dark:border border-white/20">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase ${user.status === 'active'
                          ? 'bg-green-900/30 text-green-400 border border-green-800'
                          : 'bg-red-900/30 text-red-400 border border-red-800'
                          }`}>
                          {user.status === 'active' ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            disabled={saving}
                            className="p-2 text-white hover:text-blue-400 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={saving}
                            className="p-2 text-white hover:text-red-400 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {assignModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-panel rounded-lg shadow-2xl p-8 w-full max-w-md border border-border relative">
            <button className="absolute top-2 right-2 text-text-secondary hover:text-text" onClick={closeAssignModal}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-text">Asignar módulos a {selectedUser.firstName} {selectedUser.lastName}</h2>
            <div className="mb-4 space-y-2 max-h-64 overflow-y-auto">
              {modules.map((mod) => (
                <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userModules.includes(mod.id)}
                    onChange={() => handleToggleModule(mod.id)}
                  />
                  <span className="text-text">{mod.title}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="primary" onClick={handleSaveModules}>Guardar</Button>
              <Button size="sm" variant="outline" onClick={closeAssignModal}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 