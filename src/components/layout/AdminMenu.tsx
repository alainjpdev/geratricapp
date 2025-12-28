import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminMenuProps {
  collapsed: boolean;
}

export const AdminMenu: React.FC<AdminMenuProps> = ({ collapsed }) => {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`hidden flex items-center w-full px-3 py-2 text-sm font-medium dark:text-white text-gray-900 dark:hover:bg-white/10 hover:bg-gray-100 dark:hover:text-white hover:text-gray-700 rounded-lg transition-colors group relative uppercase ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? (dark ? 'Modo Claro' : 'Modo Oscuro') : ''}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? (
        <Sun className="w-5 h-5 mr-0" />
      ) : (
        <Moon className="w-5 h-5 mr-0" />
      )}
      {!collapsed && (
        <span className="ml-3 uppercase">
          {dark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}

      {/* Tooltip cuando está colapsado */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 dark:bg-black dark:border border-white/20 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
          {dark ? 'MODO CLARO' : 'MODO OSCURO'}
        </div>
      )}
    </button>
  );
};

