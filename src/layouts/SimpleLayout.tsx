import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DynamicSidebar } from '../components/layout/DynamicSidebar';
import { useAuthStore } from '../store/authStore';

export const SimpleLayout: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  // State to control collapse/expand of the sidebar
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => setCollapsed(!collapsed);
  // State for expanded submenus
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuKey)
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Usar el rol del usuario autenticado
  const currentRole = user?.role || 'admin';

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
      <div className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-64'} min-h-screen transition-all duration-200`}>
        <main className="p-4 md:p-6 dark:text-gray-400 text-gray-800 uppercase harmonious-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

