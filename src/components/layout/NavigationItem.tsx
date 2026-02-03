import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NavigationItem as NavigationItemType } from './navigationConfig';

interface NavigationItemProps {
  item: NavigationItemType;
  collapsed: boolean;
  expandedMenus: string[];
  onToggleSubmenu: (menuKey: string) => void;
  onItemClick?: () => void;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  collapsed,
  expandedMenus,
  onToggleSubmenu,
  onItemClick
}) => {
  // Ocultar Perfil completamente (Desktop y Mobile)
  if (item.to === '/dashboard/profile') {
    return null;
  }

  // Ocultar Settings completamente (Desktop y Mobile)
  if (item.to === '/dashboard/settings') {
    return null;
  }

  // En móvil, solo mostrar Dashboard, Evento y Gastos
  // Mostrar todos los items en móvil también
  const isMobileAllowed = true;
  const mobileClass = 'flex';

  // Si tiene submenú
  if (item.submenu) {
    const menuKey = item.key || item.to || item.id || '';
    const isExpanded = expandedMenus.includes(menuKey);
    return (
      <div key={item.key || item.to || item.id || 'submenu'} className={isMobileAllowed ? '' : 'hidden md:block'}>
        <button
          onClick={() => !collapsed && onToggleSubmenu(menuKey)}
          className={`flex items-center w-full ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative text-gray-900 hover:bg-gray-100 hover:text-gray-700 uppercase`}
          title={collapsed ? item.label : ''}
        >
          <item.icon className={`w-5 h-5 transition-all duration-200 ${collapsed ? 'mr-0' : 'mr-0'
            }`} />
          {!collapsed && (
            <>
              <span className="ml-3 uppercase">{item.label.toUpperCase()}</span>
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                }`} />
            </>
          )}

          {/* Tooltip cuando está colapsado */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 dark:bg-black dark:border border-white/20 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
              {item.label.toUpperCase()}
            </div>
          )}
        </button>

        {/* Submenú */}
        {!collapsed && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.submenu.map((subItem) => (
              <NavLink
                key={subItem.to}
                to={subItem.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
                  (isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-900 hover:bg-gray-100 hover:text-gray-700')
                }
                onClick={onItemClick}
              >
                <subItem.icon className="w-4 h-4 mr-3" />
                <span className="uppercase">{subItem.label.toUpperCase()}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Si tiene Google Sheets URL, abrir en nueva pestaña
  if (item.googleSheetUrl) {
    return (
      <a
        key={item.key || item.to || item.id || 'google-sheets'}
        href={item.googleSheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${mobileClass} items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
          'dark:text-white text-gray-700 dark:hover:bg-white/10 hover:bg-gray-100 dark:hover:text-white hover:text-gray-900 uppercase'
        }
        onClick={onItemClick}
        title={collapsed ? `${item.label} (Google Sheets)` : ''}
      >
        <item.icon className={`w-5 h-5 transition-all duration-200 ${collapsed ? 'mr-0' : 'mr-0'
          }`} />
        {!collapsed && (
          <>
            <span className="ml-3 uppercase">{item.label.toUpperCase()}</span>
            <span className="ml-auto text-xs text-blue-500">📊</span>
          </>
        )}

        {/* Tooltip cuando está colapsado */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 dark:bg-gray-800 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
            {item.label.toUpperCase()} (GOOGLE SHEETS)
          </div>
        )}
      </a>
    );
  }

  // Si es un enlace externo
  if (item.external) {
    return (
      <a
        key={item.to || item.key || item.id || 'external-link'}
        href={item.to!}
        target="_blank"
        rel="noopener noreferrer"
        className={`${mobileClass} items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
          'dark:text-white text-gray-700 dark:hover:bg-white/10 hover:bg-gray-100 dark:hover:text-white hover:text-gray-900 uppercase'
        }
        onClick={onItemClick}
        title={collapsed ? `${item.label} (Nueva Ventana)` : ''}
      >
        <item.icon className={`w-5 h-5 transition-all duration-200 ${collapsed ? 'mr-0' : 'mr-0'
          }`} />
        {!collapsed && (
          <>
            <span className="ml-3 uppercase">{item.label.toUpperCase()}</span>
            <span className="ml-auto text-xs text-blue-500">🔗</span>
          </>
        )}

        {/* Tooltip cuando está colapsado */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 dark:bg-gray-800 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
            {item.label.toUpperCase()} (NUEVA VENTANA)
          </div>
        )}
      </a>
    );
  }

  // Si es un enlace normal
  // Verificar que tenga 'to' definido
  if (!item.to) {
    console.warn('NavigationItem sin "to" definido:', item);
    return null;
  }

  return (
    <NavLink
      key={item.to || item.key || item.id || 'nav-link'}
      to={item.to}
      end={item.to === '/dashboard'}
      className={({ isActive }) =>
        `${mobileClass} items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ` +
        (isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-900 hover:bg-gray-100 hover:text-gray-700')
      }
      onClick={onItemClick}
      title={collapsed ? item.label : ''}
    >
      <item.icon className={`w-5 h-5 transition-all duration-200 ${collapsed ? 'mr-0' : 'mr-0'
        }`} />
      {!collapsed && <span className="ml-3 uppercase">{item.label.toUpperCase()}</span>}

      {/* Tooltip cuando está colapsado */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 dark:bg-black dark:border border-white/20 bg-gray-700 dark:text-white text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 uppercase">
          {item.label.toUpperCase()}
        </div>
      )}
    </NavLink>
  );
};
