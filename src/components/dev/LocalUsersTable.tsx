/**
 * Componente para mostrar una tabla con email y rol de usuarios de la base de datos local
 * Solo visible en modo desarrollo
 */

import { useState, useEffect } from 'react';
import { localDB } from '../../db/localDB';
import { USE_LOCAL_DB } from '../../config/devMode';
import { Database, RefreshCw, Users } from 'lucide-react';

export const LocalUsersTable = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Solo mostrar en modo desarrollo con base local
  if (!USE_LOCAL_DB) {
    return null;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await localDB.users.toArray();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search) ||
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Usuarios - Base de Datos Local
          </h2>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email, rol, nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios en la base de datos local'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        user.role === 'enfermero' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          user.role === 'paciente' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            user.role === 'pariente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                      {user.role || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {user.grupoAsignado || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </div>
    </div>
  );
};








