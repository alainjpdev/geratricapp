import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DynamicSidebar } from '../components/layout/DynamicSidebar';
import { useSidebar } from '../hooks/useSidebar';
import { useAuthStore } from '../store/authStore';

export const SimpleLayout: React.FC = () => {
  const navigate = useNavigate();
  const { collapsed, expandedMenus, toggleCollapse, toggleSubmenu } = useSidebar();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Usar rol del usuario autenticado o 'admin' por defecto
  // Mapear roles: student -> 'student', teacher -> 'teacher', admin -> 'admin'
  const currentRole = (user?.role as 'admin' | 'productor' | 'coordinador' | 'student' | 'teacher') || 'admin';

  return (
    <div className="min-h-screen dark:bg-black bg-white">
      <DynamicSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        role={currentRole}
        expandedMenus={expandedMenus}
        onToggleSubmenu={toggleSubmenu}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className={`${collapsed ? 'ml-16' : 'ml-16 md:ml-64'} dark:bg-black bg-white transition-all duration-200 overflow-y-auto h-screen`}>
        <main className="p-0 md:p-6 dark:text-gray-400 text-gray-800 uppercase">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

