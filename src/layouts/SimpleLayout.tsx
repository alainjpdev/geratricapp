import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { DynamicSidebar } from '../components/layout/DynamicSidebar';
import { useAuthStore } from '../store/authStore';
import { Menu, X } from 'lucide-react';

export const SimpleLayout: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  // State to control collapse/expand of the sidebar
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => setCollapsed(!collapsed);

  // Apply font size preference
  React.useEffect(() => {
    if (user?.fontSize) {
      document.documentElement.style.fontSize = `${user.fontSize}px`;
    } else {
      // Reset to default if no preference (usually browser default 16px, but explicit is safer if scaling)
      document.documentElement.style.fontSize = '16px';
    }
  }, [user?.fontSize]);

  // State for mobile sidebar
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      {/* Mobile Menu Toggle Button */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-4 right-4 z-40 bg-sky-500 text-white p-2.5 rounded-full shadow-lg hover:bg-sky-600 transition-all duration-200"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <DynamicSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        role={currentRole}
        expandedMenus={expandedMenus}
        onToggleSubmenu={toggleSubmenu}
        onLogout={handleLogout}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content */}
      <div className={`flex-1 ${collapsed ? 'md:ml-16' : 'md:ml-64'} h-[100dvh] overflow-y-auto transition-all duration-200 harmonious-scroll`}>
        <main className="p-1 md:p-6 dark:text-gray-400 text-gray-800 uppercase">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

