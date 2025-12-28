import React from 'react';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from './UserProfile';
import { NavigationItem } from './NavigationItem';
import { NavigationItem as NavigationItemType } from './navigationConfig';
import { useDarkMode } from '../../hooks/useDarkMode';
import logo from '../../assets/logohappy.png';
import logoWhite from '../../assets/logohappy.png';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  navigationItems: NavigationItemType[];
  expandedMenus: string[];
  onToggleSubmenu: (menuKey: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  navigationItems,
  expandedMenus,
  onToggleSubmenu,
  onLogout
}) => {
  const { user } = useAuthStore();
  const [dark] = useDarkMode();
  const currentLogo = dark ? logo : logoWhite;

  return (
    <div className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-sidebar shadow-lg border-r border-border transition-all duration-200`}>
      <div className="flex flex-col h-full relative">
        {/* Collapse Button (centered vertically) */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 -right-4 z-20 transform -translate-y-1/2 bg-panel shadow-lg border border-border p-2 rounded-full hover:bg-border transition"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-text" /> : <ChevronLeft className="w-5 h-5 text-text" />}
        </button>

        {/* Logo */}
        <div className="flex items-center border-b border-border bg-sidebar transition-all duration-200">
          <div className={`flex items-center transition-all duration-200 ${collapsed ? 'justify-center w-16 py-4' : 'justify-center w-full py-6'
            }`}>
            <img
              src={currentLogo}
              alt="GeriatricApp Logo"
              className={`transition-all duration-200 ${collapsed
                ? 'h-10 w-10'
                : 'h-20 w-auto'
                }`}
            />
          </div>
        </div>

        {/* User Info */}
        <UserProfile user={user} collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.to || item.key}
              item={item}
              collapsed={collapsed}
              expandedMenus={expandedMenus}
              onToggleSubmenu={onToggleSubmenu}
            />
          ))}

          {/* Elemento reservado SOLO para ark2784@gmail.com */}
          {user?.email === 'ark2784@gmail.com' && (
            <NavigationItem
              item={{
                to: '/dashboard/restricted-users',
                label: 'Usuarios (Admin)',
                icon: (props) => (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    {...props}
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                key: 'restricted-users'
              }}
              collapsed={collapsed}
              expandedMenus={expandedMenus}
              onToggleSubmenu={onToggleSubmenu}
            />
          )}
        </nav>

        {/* Logout */}
        <div className={`border-t border-border transition-all duration-200 ${collapsed ? 'px-2 py-4' : 'px-2 py-4'
          }`}>
          <button
            onClick={onLogout}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium text-text-secondary hover:bg-border hover:text-text rounded-lg transition-colors group relative ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Cerrar Sesión' : ''}
          >
            <LogOut className="w-5 h-5 mr-0" />
            {!collapsed && <span className="ml-3">Cerrar Sesión</span>}

            {/* Tooltip cuando está colapsado */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Cerrar Sesión
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
