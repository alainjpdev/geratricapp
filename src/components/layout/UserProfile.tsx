import React from 'react';
import { User } from 'lucide-react';

interface UserProfileProps {
  user: {
    firstName?: string;
    lastName?: string;
    role?: string;
    email?: string;
    grupoAsignado?: string;
  } | null;
  collapsed: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, collapsed }) => {
  if (collapsed) return null;

  // Mostrar el email del usuario, o un valor por defecto si no está disponible
  const displayEmail = user?.email || 'Usuario';
  
  // Obtener rol y grupo asignado
  const role = user?.role || '';
  const grupoAsignado = user?.grupoAsignado || '';
  
  // Función para obtener etiqueta del rol
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Profesor';
      case 'student': return 'Estudiante';
      case 'parent': return 'Padre';
      default: return role || '';
    }
  };
  
  // Determinar qué mostrar: si rol y grupo son iguales, solo mostrar grupo
  const roleLabel = getRoleLabel(role);
  const roleMatchesGroup = roleLabel && grupoAsignado && roleLabel.toLowerCase() === grupoAsignado.toLowerCase();
  const showRole = roleLabel && !roleMatchesGroup;
  const showGroup = grupoAsignado;

  return (
    <div className="px-6 py-4 border-b dark:border-white/20 border-gray-200">
      <div className="flex items-center">
        <div className="w-10 h-10 dark:bg-black dark:border border-white/20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 dark:text-white text-gray-900" />
        </div>
        <div className="ml-3 min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-medium dark:text-white text-gray-900 uppercase hidden">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`.toUpperCase()
              : 'Usuario'}
          </p>
          <p className="text-[10px] dark:text-white text-gray-900 uppercase truncate">
            {displayEmail.toUpperCase()}
          </p>
          {/* Mostrar rol y grupo asignado */}
          {(showRole || showGroup) && (
            <div className="mt-1 space-y-0.5">
              {showRole && (
                <p className="text-[9px] dark:text-white/80 text-gray-700 uppercase truncate">
                  {roleLabel.toUpperCase()}
                </p>
              )}
              {showGroup && (
                <p className="text-[9px] dark:text-white/80 text-gray-700 truncate">
                  {grupoAsignado}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
