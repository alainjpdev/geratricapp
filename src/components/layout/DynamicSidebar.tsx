import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronRight, Settings, Bug, Heart, LayoutDashboard, Users, Stethoscope, Briefcase, Pill, Activity, BookOpen, BookUser, UserPlus, FolderOpen, HeartPulse, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { BugReportModal } from '../modals/BugReportModal';
import { UserProfile } from './UserProfile';
import { NavigationItem } from './NavigationItem';
import { NavigationItem as NavigationItemType } from './navigationConfig';
import { hardcodedMenu } from '../../services/menuAPI'; // static menu
import { AdminMenu } from './AdminMenu';
import { useDarkMode } from '../../hooks/useDarkMode';
import logo from '../../assets/logohappy.png';
import logoWhite from '../../assets/logohappy.png';
import lpLogo from '../../assets/logohappy.png';

// Icon map for string identifiers to components
const iconMap = {
  LayoutDashboard,
  Users,
  Stethoscope,
  Briefcase,
  Pill,
  Activity,
  BookOpen,
  BookUser,
  UserPlus,
  FolderOpen,
  HeartPulse,
  AlertTriangle,
};

interface DynamicSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  role: string;
  expandedMenus: string[];
  onToggleSubmenu: (menuKey: string) => void;
  onLogout: () => void;
}

export const DynamicSidebar: React.FC<DynamicSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  role,
  expandedMenus,
  onToggleSubmenu,
  onLogout
}) => {
  const navigate = useNavigate();
  // Obtener usuario del store de autenticación
  const { user } = useAuthStore();
  // Use static hardcoded menu instead of dynamic hook
  const menuItems = hardcodedMenu;
  const [dark] = useDarkMode();
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  // Seleccionar logo según el tema
  const currentLogo = dark ? logo : logoWhite;

  // Convert hardcoded menu items to NavigationItem format
  const navigationItems: NavigationItemType[] = React.useMemo(() => {
    return menuItems.filter(item => item.isActive).map(item => {
      const mappedSubmenu = item.submenu?.map(sub => ({
        ...sub,
        icon: iconMap[sub.icon as keyof typeof iconMap] || LayoutDashboard,
      }));
      return {
        key: item.id,
        label: item.label,
        to: item.to,
        icon: iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard,
        submenu: mappedSubmenu,
      };
    });
  }, [menuItems]);

  return (
    <div className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 transition-all duration-200 z-50`}>
      <div className="flex flex-col h-full relative">
        {/* Collapse Button (centered vertically) */}
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 -right-3 z-50 transform -translate-y-1/2 bg-white shadow-lg border border-gray-200 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-gray-900" /> : <ChevronLeft className="w-5 h-5 text-gray-900" />}
        </button>

        {/* Logo */}
        <div className="flex items-center border-b border-gray-200 bg-white transition-all duration-200 justify-center py-5">
          <div
            className={`flex items-center gap-2 transition-all duration-200 cursor-pointer hover:opacity-80`}
            onClick={() => navigate('/dashboard')}
          >
            <div className="bg-sky-100 p-2 rounded-full flex-shrink-0">
              <Heart className={`text-sky-500 transition-all duration-200 ${collapsed ? 'h-6 w-6' : 'h-6 w-6'}`} />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap overflow-hidden">
                GeriApp
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <UserProfile user={user} collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationItems.map((item, index) => (
            <NavigationItem
              key={item.key || item.to || item.id || `menu-item-${index}`}
              item={item}
              collapsed={collapsed}
              expandedMenus={expandedMenus}
              onToggleSubmenu={onToggleSubmenu}
            />
          ))}
        </nav>

        {/* Settings and Logout */}
        <div className={`border-t dark:border-white/20 border-gray-200 transition-all duration-200 ${collapsed ? 'px-2 py-4' : 'px-2 py-4'
          }`}>
          {/* Theme Toggle */}
          <div className="mb-2">
            <AdminMenu collapsed={collapsed} />
          </div>

          {/* Settings button for admins - Oculto */}
          {false && role === 'admin' && (
            <div className="hidden">
              <button
                onClick={() => window.location.href = '/dashboard/settings'}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium dark:text-white text-gray-900 dark:hover:bg-white/10 hover:bg-gray-100 dark:hover:text-white hover:text-gray-700 rounded-lg transition-colors group relative mb-2 uppercase ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? 'Configuración' : ''}
              >
                <Settings className="w-5 h-5 mr-0" />
                {!collapsed && <span className="ml-3 uppercase">Configuración</span>}

                {/* Tooltip cuando está colapsado */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 dark:bg-black dark:border border-white/20 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
                    CONFIGURACIÓN
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Container for Logout and Bug Report */}
          <div className={`flex ${collapsed ? 'flex-col gap-2' : 'flex-row gap-1'} mt-1`}>
            {/* Logout */}
            <button
              onClick={onLogout}
              className={`flex items-center ${collapsed ? 'w-full justify-center' : 'flex-1'} px-3 py-2 text-sm font-medium dark:text-white text-gray-900 dark:hover:bg-white/10 hover:bg-gray-100 dark:hover:text-white hover:text-gray-700 rounded-lg transition-colors group relative uppercase`}
              title={collapsed ? 'Cerrar Sesión' : ''}
            >
              <LogOut className="w-5 h-5 mr-0" />
              {!collapsed && <span className="ml-3 uppercase">Cerrar Sesión</span>}

              {/* Tooltip cuando está colapsado */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 dark:bg-black dark:border border-white/20 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
                  CERRAR SESIÓN
                </div>
              )}
            </button>

            {/* Bug Report Button */}
            <button
              onClick={() => setIsBugModalOpen(true)}
              className={`flex items-center ${collapsed ? 'w-full justify-center' : 'w-auto'} px-2 py-2 text-sm font-medium dark:text-gray-400 text-gray-400 dark:hover:bg-white/10 hover:bg-gray-100 dark:hover:text-gray-200 hover:text-gray-600 rounded-lg transition-colors group relative uppercase`}
              title="Reportar Error"
            >
              <Bug className="w-5 h-5" />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
                REPORTAR ERROR
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
    </div>
  );
};
