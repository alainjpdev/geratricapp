import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Search, Filter, MoreVertical, Mail, Calendar, User, X } from 'lucide-react';
// @ts-ignore
import { supabase } from '../../../config/supabaseClient';
import { residentService, Resident } from '../../../services/residentService';
import { createUser } from '../../../services/userService';
import { Toast } from '../../../components/ui/Toast';

interface StaffUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar: string | null;
  created_at: string;
  is_active: boolean;
}

type TabType = 'staff' | 'residents';

export const StaffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  // Trigger re-compile

  // Staff State
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // Residents State
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(true);

  // Shared State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditResident, setShowEditResident] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingResident, setUpdatingResident] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'staff',
    telefono: ''
  });
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      await createUser(newUser);
      setToast({ visible: true, message: 'Usuario creado exitosamente', type: 'success' });
      setShowAddUser(false);
      setNewUser({ firstName: '', lastName: '', email: '', role: 'staff', telefono: '' });
      fetchStaff();
    } catch (error) {
      console.error('Error creating user:', error);
      setToast({ visible: true, message: 'Error al crear usuario', type: 'error' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;

    try {
      setUpdatingResident(true);
      await residentService.updateResident(selectedResident.id, {
        conditions: selectedResident.conditions,
        roomNumber: selectedResident.roomNumber,
        status: selectedResident.status
      });
      setToast({ visible: true, message: 'Residente actualizado exitosamente', type: 'success' });
      setShowEditResident(false);
      fetchResidents();
    } catch (error) {
      console.error('Error updating resident:', error);
      setToast({ visible: true, message: 'Error al actualizar residente', type: 'error' });
    } finally {
      setUpdatingResident(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchResidents();
  }, []);

  const fetchStaff = async () => {
    try {
      setStaffLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      setResidentsLoading(true);
      const data = await residentService.getAllResidents();
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setResidentsLoading(false);
    }
  };

  const filteredStaff = staff.filter(user => {
    const matchesSearch =
      (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredResidents = residents.filter(resident => {
    const matchesSearch =
      (resident.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (resident.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'enfermero': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'teacher': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'student': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'parent': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">Gestión de Personal</h1>
          <p className="text-gray-500 dark:text-gray-400">Directorio de usuarios registrados en el sistema</p>
        </div>
        <button
          onClick={activeTab === 'staff' ? () => setShowAddUser(true) : () => { }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span>{activeTab === 'staff' ? 'NUEVO USUARIO' : 'NUEVO RESIDENTE'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('staff')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'staff'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            <Users className="w-5 h-5" />
            PERSONAL
          </button>
          <button
            onClick={() => setActiveTab('residents')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'residents'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
            `}
          >
            <User className="w-5 h-5" />
            RESIDENTES
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'staff' ? "Buscar por nombre o correo..." : "Buscar residente..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {activeTab === 'staff' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white w-full"
            >
              <option value="all">Todos los Roles</option>
              <option value="admin">Admin</option>
              <option value="enfermero">Enfermero</option>
              <option value="teacher">Maestro</option>
              <option value="student">Estudiante</option>
              <option value="parent">Familiar</option>
            </select>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Loading State */}
        {(activeTab === 'staff' ? staffLoading : residentsLoading) ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando {activeTab === 'staff' ? 'personal' : 'residentes'}...</p>
          </div>
        ) : (activeTab === 'staff' ? filteredStaff : filteredResidents).length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg">No se encontraron {activeTab === 'staff' ? 'usuarios' : 'residentes'}</p>
            <p className="text-sm">Intenta ajustar tu búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {activeTab === 'staff' ? 'Usuario' : 'Residente'}
                  </th>
                  {activeTab === 'staff' ? (
                    <>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Contacto</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Fecha Registro</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Habitación</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Condición</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {activeTab === 'staff' ? (
                  // STAFF ROW
                  filteredStaff.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(user.first_name, user.last_name)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase border border-opacity-20 ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.is_active ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.is_active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  // RESIDENTS ROW
                  filteredResidents.map((resident) => resident && (
                    <tr key={resident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {getInitials(resident.firstName, resident.lastName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                              {resident.firstName} {resident.lastName}
                            </p>
                            <p className="text-[10px] text-gray-400">{new Date().getFullYear() - new Date(resident.dateOfBirth).getFullYear()} años</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {resident.roomNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {resident.conditions ? (
                            resident.conditions.split(';').filter(Boolean).map((cond, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 font-bold uppercase">
                                {cond.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-xs">Sin condición</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase border border-opacity-20 ${resident.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {resident.status === 'Active' ? 'ACTIVO' : resident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setSelectedResident(resident);
                            setShowEditResident(true);
                          }}
                          className="px-3 py-1 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-md transition-colors border border-indigo-100 dark:border-indigo-800 font-bold"
                        >
                          MODIFICAR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Edit Resident Modal */}
      {showEditResident && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase">Modificar Residente</h2>
                <p className="text-xs text-gray-500">{selectedResident.firstName} {selectedResident.lastName}</p>
              </div>
              <button onClick={() => setShowEditResident(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateResident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Condiciones Médicas</label>
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 min-h-[40px]">
                  {selectedResident.conditions ? (
                    selectedResident.conditions.split(';').filter(Boolean).map((cond, i) => (
                      <div key={i} className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-700 dark:text-blue-300 shadow-sm font-bold uppercase">
                        {cond.trim()}
                        <button
                          type="button"
                          onClick={() => {
                            const conds = selectedResident.conditions?.split(';').filter(Boolean) || [];
                            conds.splice(i, 1);
                            setSelectedResident({ ...selectedResident, conditions: conds.join(';') });
                          }}
                          className="text-gray-400 hover:text-red-500 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 text-[10px] italic">No hay condiciones registradas.</span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe una condición y pulsa Enter..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          const current = selectedResident.conditions ? selectedResident.conditions.split(';').filter(Boolean) : [];
                          if (!current.includes(val)) {
                            setSelectedResident({ ...selectedResident, conditions: [...current, val].join(';') });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic uppercase">Pulsa Enter para añadir cada condición.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Habitación</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    value={selectedResident.roomNumber || ''}
                    onChange={e => setSelectedResident({ ...selectedResident, roomNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    value={selectedResident.status}
                    onChange={e => setSelectedResident({ ...selectedResident, status: e.target.value as any })}
                  >
                    <option value="Active">Activo</option>
                    <option value="Hospitalized">Hospitalizado</option>
                    <option value="Deceased">Finado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditResident(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingResident}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {updatingResident ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Usuario</h2>
              <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre *</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    value={newUser.firstName}
                    onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Apellido</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    value={newUser.lastName}
                    onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  value={newUser.telefono}
                  onChange={e => setNewUser({ ...newUser, telefono: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rol *</label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="teacher">Maestro (Teacher)</option>
                  <option value="student">Estudiante</option>
                  <option value="parent">Familiar</option>
                  <option value="enfermero">Enfermero</option>
                  <option value="staff">Staff General</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
