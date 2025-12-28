import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sidebar } from './Sidebar';
import { DynamicSidebar } from './DynamicSidebar';
import { NavigationItem } from './navigationConfig';
import { useSidebar } from '../../hooks/useSidebar';

interface BaseLayoutProps {
  navigationItems?: NavigationItem[];
  useDynamicMenu?: boolean;
  role?: 'admin' | 'productor' | 'coordinador';
  children?: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  navigationItems,
  useDynamicMenu = false,
  role = 'admin',
  children
}) => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const { collapsed, expandedMenus, toggleCollapse, toggleSubmenu } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentRole = role || (user?.role as 'admin' | 'productor' | 'coordinador') || 'admin';

  return (
    <div className="min-h-screen bg-bg">
      {useDynamicMenu ? (
        <DynamicSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          role={currentRole}
          expandedMenus={expandedMenus}
          onToggleSubmenu={toggleSubmenu}
          onLogout={handleLogout}
        />
      ) : (
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          navigationItems={navigationItems || []}
          expandedMenus={expandedMenus}
          onToggleSubmenu={toggleSubmenu}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <div className={`${collapsed ? 'ml-16' : 'ml-64'} bg-bg min-h-screen transition-all duration-200`}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
