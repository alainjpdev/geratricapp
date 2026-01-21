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

  // Forzar rol admin para que siempre vea los ítems principales
  const currentRole = 'admin';

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
      <div className={`${collapsed ? 'ml-16' : 'ml-64'} dark:bg-black bg-white transition-all duration-200 overflow-y-auto h-screen`}>
        <main className="p-0 md:p-6 dark:text-gray-400 text-gray-800 uppercase">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

