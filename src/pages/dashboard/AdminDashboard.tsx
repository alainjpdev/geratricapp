import React, { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp, AlertTriangle, UserPlus, Settings, BarChart3 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabaseClient';
import NotionTasksTable from './NotionTasksTable';

export const AdminDashboard: React.FC = () => {
  const { user: loggedUser } = useAuthStore();

  // Estados para datos reales
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('👥 Cargando usuario para AdminDashboard desde AuthStore...');

        if (!loggedUser) {
          console.log('ℹ️ No hay usuario autenticado en el store.');
          setUsers([]);
          setLoading(false);
          return;
        }

        const unifiedUser = {
          id: loggedUser.id,
          firstName: loggedUser.firstName || '',
          lastName: loggedUser.lastName || '',
          email: loggedUser.email,
          role: loggedUser.role || 'admin',
          status: 'active', // El usuario del store está activo por definición si está logueado
          createdAt: loggedUser.createdAt || new Date().toISOString()
        };

        setUsers([unifiedUser]);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error inesperado cargando usuario para AdminDashboard:', err);
        setError(err?.message || 'Error inesperado');
        setUsers([]);
        setLoading(false);
      }
    };

    if (loggedUser) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [loggedUser]);

  // Calcular estadísticas
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const activeStudents = Array.isArray(users) ? users.filter(u => u.role === 'paciente' && u.status === 'active').length : 0;
  const totalTeachers = Array.isArray(users) ? users.filter(u => u.role === 'enfermero').length : 0;
  const pendingUsers = Array.isArray(users) ? users.filter(u => u.status === 'pending').length : 0;
  // Dummy para crecimiento y tasa de finalización
  const monthlyGrowth = 12.5;
  const completionRate = 87.3;

  // Usuarios recientes (últimos 4 por fecha de creación si existe, si no, por id)
  const recentUsers = Array.isArray(users)
    ? [...users]
      .sort((a, b) => (b.createdAt || b.id) > (a.createdAt || a.id) ? 1 : -1)
      .slice(0, 4)
      .map(u => ({
        id: u.id,
        name: u.firstName + ' ' + u.lastName,
        email: u.email,
        role: u.role,
        status: u.status,
        joinDate: u.createdAt ? u.createdAt.split('T')[0] : ''
      }))
    : [];

  // Usuarios por rol
  const usersByRole = Array.isArray(users) ? {
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    coordinators: users.filter(u => u.role === 'enfermero').length,
    regular: users.filter(u => u.role === 'paciente').length
  } : { active: 0, pending: 0, coordinators: 0, regular: 0 };

  // Alertas del sistema basadas en datos reales
  const systemAlerts = [
    ...(pendingUsers > 0 ? [{
      id: '1',
      type: 'warning' as const,
      message: `${pendingUsers} usuario${pendingUsers > 1 ? 's' : ''} pendiente${pendingUsers > 1 ? 's' : ''} de activación`,
      timestamp: 'Reciente'
    }] : []),
    {
      id: '2',
      type: 'info' as const,
      message: `${usersByRole.active} usuarios activos en el sistema`,
      timestamp: 'Actualizado'
    },
    {
      id: '3',
      type: 'success' as const,
      message: 'Sistema funcionando correctamente',
      timestamp: 'Ahora'
    }
  ];

  const systemStats = {
    totalUsers,
    activeStudents,
    totalTeachers,
    pendingUsers,
    monthlyGrowth,
    completionRate
  };


  // Mostrar indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">
            Panel de Administración 🏭
          </h1>
          <p className="text-text-secondary mt-1">
            Gestiona usuarios, producción y el sistema completo de La Productora
          </p>
        </div>
        <div className="flex space-x-3">
          {/* <Button variant="outline">
            <Settings className="w-5 h-5 mr-2" />
            Configuración
          </Button> */}
          {/* <Button>
            <UserPlus className="w-5 h-5 mr-2" />
            Nuevo Usuario
          </Button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{systemStats.totalUsers.toLocaleString()}</h3>
          <p className="text-gray-600">Total Usuarios</p>
          <div className="flex items-center justify-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">+{systemStats.monthlyGrowth}%</span>
          </div>
        </Card>
        <Card className="text-center">
          <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{systemStats.activeStudents}</h3>
          <p className="text-gray-600">Usuarios Activos</p>
          <p className="text-sm text-gray-500 mt-2">de {systemStats.totalUsers} total</p>
        </Card>
        <Card className="text-center">
          <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{systemStats.totalTeachers}</h3>
          <p className="text-gray-600">Coordinadores</p>
          <p className="text-sm text-gray-500 mt-2">{systemStats.pendingUsers} pendientes</p>
        </Card>
        <Card className="text-center">
          <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-text">{Math.round((systemStats.activeStudents / systemStats.totalUsers) * 100) || 0}%</h3>
          <p className="text-gray-600">Usuarios Activos</p>
          <div className="flex items-center justify-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600">+{systemStats.monthlyGrowth}%</span>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Usuarios Recientes */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">Usuarios del Sistema</h2>
              <Button variant="outline" size="sm">Ver Todos</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {/* <th className="text-left py-3 px-4 font-medium text-text">ID</th> */}
                    <th className="text-left py-3 px-4 font-medium text-text">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Fecha de Ingreso</th>
                    {/* <th className="text-left py-3 px-4 font-medium text-text">Acciones</th> */}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* <td className="py-3 px-4">{user.id}</td> */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-700">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'enfermero'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}>
                          {user.role === 'enfermero' ? 'Enfermero' : user.role === 'paciente' ? 'Paciente' : user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {user.status === 'active' ? 'Activo' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">{user.joinDate}</td>
                      {/* <td className="py-3 px-4">
                        <Button size="sm" variant="outline">
                          Gestionar
                        </Button>
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Asignación de Profesores - OCULTO */}
          {/* <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">Asignación de Coordinadores</h2>
              <Button variant="outline" size="sm">Gestionar Todas</Button>
            </div>
            <div className="space-y-3">
              {teacherAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{assignment.className}</h3>
                    <p className="text-sm text-gray-600">
                      Coordinador: {assignment.teacherName}
                    </p>
                    <p className="text-sm text-gray-500">
                                              {assignment.students} estudiantes inscritos
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      assignment.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {assignment.status === 'active' ? 'Asignado' : 'Sin asignar'}
                    </span>
                    <Button size="sm" variant={assignment.status === 'pending' ? 'primary' : 'outline'}>
                      {assignment.status === 'pending' ? 'Asignar' : 'Cambiar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card> */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alertas del Sistema */}
          <Card>
            <h2 className="text-xl font-bold text-text mb-4">Alertas del Sistema</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${alert.type === 'warning' ? 'text-yellow-600' :
                    alert.type === 'info' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">hace {alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full mt-4">
              Ver Todas las Alertas
            </Button>
          </Card>

          {/* Reportes Rápidos - OCULTO */}
          {/* <Card>
            <h2 className="text-xl font-bold text-text mb-4">Reportes Rápidos</h2>
            <div className="space-y-3">
              <Button size="sm" variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reporte de Usuarios
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Estadísticas de Clases
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Análisis de Rendimiento
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Reporte Financiero
              </Button>
            </div>
          </Card> */}

          {/* Acciones Rápidas */}
          <Card>
            <h2 className="text-xl font-bold text-text mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <Button size="sm" className="w-full justify-start">
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Gestionar Usuarios
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </div>
          </Card>

          {/*
          <Card className="mt-8">
            <h2 className="text-xl font-bold text-text mb-4">Todas las Clases</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-text">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Módulo</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Profesor</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => (
                    <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{cls.id}</td>
                      <td className="py-3 px-4">{cls.title}</td>
                      <td className="py-3 px-4">{cls.description}</td>
                      <td className="py-3 px-4">{cls.module?.title || '-'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={cls.teacherId || ''}
                          onChange={e => handleTeacherChange(cls.id, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="">Sin asignar</option>
                          {users.filter(u => u.role === 'coordinator').map(teacher => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.firstName} {teacher.lastName}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {saveMsg && <div className={saveMsg.includes('Error') ? 'text-red-600 mt-2' : 'text-green-600 mt-2'}>{saveMsg}</div>}
          </Card>
          */}

          {/* Tareas - OCULTO */}
          {/* <Card className="mt-8">
            <h2 className="text-xl font-bold text-text mb-4">Todas las Tareas</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-text">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Descripción</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Clase</th>
                    <th className="text-left py-3 px-4 font-medium text-text">Fecha Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{a.id}</td>
                      <td className="py-3 px-4">{a.title}</td>
                      <td className="py-3 px-4">{a.description}</td>
                      <td className="py-3 px-4">{a.classId || '-'}</td>
                      <td className="py-3 px-4">{a.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card> */}
        </div>
        {/* <NotionTasksTable /> */}
      </div>
    </div>
  );
};