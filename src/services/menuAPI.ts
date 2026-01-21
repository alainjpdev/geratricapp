import { DynamicMenuItem, CreateMenuItemData, UpdateMenuItemData } from '../types/menu';
import { useAuthStore } from '../store/authStore';

// Hard‑coded menu items (always visible)
export const hardcodedMenu: DynamicMenuItem[] = [
  {
    id: 'adm-dashboard',
    label: 'DASHBOARD',
    icon: 'LayoutDashboard',
    to: '/dashboard',
    order: 0,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'res-directory',
    label: 'DIRECTORIO',
    icon: 'BookUser',
    to: '/dashboard/residents',
    order: 1,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'res-records',
    label: 'EXPEDIENTES',
    icon: 'FolderOpen',
    to: '/dashboard/records',
    order: 2,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'adm-medical',
    label: 'MÉDICA',
    icon: 'Stethoscope',
    to: '/dashboard/medical',
    order: 3,
    isActive: false,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    submenu: [
      { id: 'sub-med-care', label: 'Cuidados', to: '/dashboard/care-plans', icon: 'HeartPulse', order: 0, isActive: true },
      { id: 'sub-med-phar', label: 'Farmacia', to: '/dashboard/pharmacy', icon: 'Pill', order: 1, isActive: true },
      { id: 'sub-med-inc', label: 'Incidencias', to: '/dashboard/incidents', icon: 'AlertTriangle', order: 2, isActive: true }
    ]
  },
  {
    id: 'adm-staff',
    label: 'PERSONAL',
    icon: 'Briefcase',
    to: '/dashboard/staff',
    order: 4,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class MenuAPI {
  // Existing methods (kept for compatibility) ...

  // Obtener todos los elementos de menú para un rol específico
  async getMenuItems(role: 'admin' | 'enfermero' | 'paciente' | 'pariente'): Promise<DynamicMenuItem[]> {
    // Menú hardcodeado - siempre devolver el menú por defecto
    return this.getDefaultMenuItems(role);
  }

  // Menú por defecto
  private getDefaultMenuItems(role: 'admin' | 'enfermero' | 'paciente' | 'pariente'): DynamicMenuItem[] {
    const now = new Date();
    const user = useAuthStore.getState().user;
    const isRestrictedUser = user?.email === 'ark2784@gmail.com';

    // 🏥 ROLES ADMINISTRATIVOS
    if (role === 'admin') {
      const adminMenu: DynamicMenuItem[] = [
        {
          id: 'adm-dashboard',
          label: 'DASHBOARD',
          icon: 'LayoutDashboard',
          to: '/dashboard',
          order: 0,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'res-directory',
          label: 'DIRECTORIO',
          icon: 'BookUser',
          to: '/dashboard/residents',
          order: 1,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'res-records',
          label: 'EXPEDIENTES',
          icon: 'FolderOpen',
          to: '/dashboard/records',
          order: 2,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'adm-medical',
          label: 'MÉDICA',
          icon: 'Stethoscope',
          to: '/dashboard/medical',
          order: 3,
          isActive: false,
          role: 'admin',
          createdAt: now,
          updatedAt: now,
          submenu: [
            { id: 'sub-med-care', label: 'Cuidados', to: '/dashboard/care-plans', icon: 'HeartPulse', order: 0, isActive: true },
            { id: 'sub-med-phar', label: 'Farmacia', to: '/dashboard/pharmacy', icon: 'Pill', order: 1, isActive: true },
            { id: 'sub-med-inc', label: 'Incidencias', to: '/dashboard/incidents', icon: 'AlertTriangle', order: 2, isActive: true }
          ]
        },
        {
          id: 'adm-staff',
          label: 'PERSONAL',
          icon: 'Briefcase',
          to: '/dashboard/staff',
          order: 4,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        },
        /*
        {
          id: 'adm-hotel',
          label: 'HOTELERÍA',
          icon: 'Hotel',
          to: '/dashboard/facilities',
          order: 4,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now,
          submenu: [
            { id: 'sub-hot-bed', label: 'Camas', to: '/dashboard/beds', icon: 'Bed', order: 0, isActive: true },
            { id: 'sub-hot-kitch', label: 'Cocina', to: '/dashboard/kitchen', icon: 'Utensils', order: 1, isActive: true },
            { id: 'sub-hot-maint', label: 'Mantenimiento', to: '/dashboard/maintenance', icon: 'Hammer', order: 2, isActive: true }
          ]
        },
        */
        {
          id: 'adm-finance',
          label: 'FINANZAS',
          icon: 'DollarSign',
          to: '/dashboard/finance',
          order: 6,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        },
        /*
                {
                  id: 'menu-mgmt',
                  label: 'MENÚS',
                  icon: 'Menu',
                  to: '/dashboard/menu-management',
                  order: 99,
                  isActive: true,
                  role: 'admin',
                  createdAt: now,
                  updatedAt: now
                },
        */
      ];

      if (isRestrictedUser) {
        adminMenu.push({
          id: 'restricted-users-menu',
          label: 'USUARIOS SISTEMA',
          icon: 'Shield',
          to: '/dashboard/users', // Changed to standard users route or keep restricted if needed
          order: 98,
          isActive: true,
          role: 'admin',
          createdAt: now,
          updatedAt: now
        });
      }

      return adminMenu;
    }

    // 🩺 ROLES ENFERMERÍA
    if (role === 'enfermero') {
      return [
        {
          id: 'nurse-dashboard',
          label: 'MI TURNO',
          icon: 'ClipboardList',
          to: '/dashboard',
          order: 0,
          isActive: true,
          role: 'enfermero',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'nurse-emar',
          label: 'eMAR',
          icon: 'Pill',
          to: '/dashboard/emar',
          order: 1,
          isActive: true,
          role: 'enfermero',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'nurse-vitals',
          label: 'SIGNOS VITALES',
          icon: 'Activity',
          to: '/dashboard/vitals',
          order: 2,
          isActive: true,
          role: 'enfermero',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'nurse-log',
          label: 'BITÁCORA',
          icon: 'BookOpen',
          to: '/dashboard/logbook',
          order: 3,
          isActive: true,
          role: 'enfermero',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'nurse-adl',
          label: 'ACTIVIDADES (ADL)',
          icon: 'CheckSquare',
          to: '/dashboard/adl',
          order: 4,
          isActive: true,
          role: 'enfermero',
          createdAt: now,
          updatedAt: now
        }
      ];
    }

    // 👴 ROLES PACIENTE
    if (role === 'paciente') {
      return [
        {
          id: 'pat-day',
          label: 'MI DÍA',
          icon: 'Sun',
          to: '/dashboard',
          order: 0,
          isActive: true,
          role: 'paciente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'pat-meals',
          label: 'COMIDAS',
          icon: 'Utensils',
          to: '/dashboard/meals',
          order: 1,
          isActive: true,
          role: 'paciente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'pat-activities',
          label: 'ACTIVIDADES',
          icon: 'Music', // Or PartyPopper if available
          to: '/dashboard/activities',
          order: 2,
          isActive: true,
          role: 'paciente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'pat-family',
          label: 'MI FAMILIA',
          icon: 'Heart',
          to: '/dashboard/family',
          order: 3,
          isActive: true,
          role: 'paciente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'pat-help',
          label: 'AYUDA',
          icon: 'Bell',
          to: '/dashboard/help',
          order: 99,
          isActive: true,
          role: 'paciente',
          createdAt: now,
          updatedAt: now
        }
      ];
    }

    // 👪 ROLES PARIENTE
    if (role === 'pariente') {
      return [
        {
          id: 'fam-summary',
          label: 'RESUMEN',
          icon: 'Home',
          to: '/dashboard',
          order: 0,
          isActive: true,
          role: 'pariente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'fam-health',
          label: 'SALUD',
          icon: 'HeartPulse',
          to: '/dashboard/health-reports',
          order: 1,
          isActive: true,
          role: 'pariente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'fam-visits',
          label: 'VISITAS',
          icon: 'Calendar',
          to: '/dashboard/visits',
          order: 2,
          isActive: true,
          role: 'pariente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'fam-admin',
          label: 'ADMINISTRATIVO',
          icon: 'FileText',
          to: '/dashboard/admin-docs',
          order: 3,
          isActive: true,
          role: 'pariente',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'fam-contact',
          label: 'CONTACTO',
          icon: 'MessageCircle',
          to: '/dashboard/contact',
          order: 4,
          isActive: true,
          role: 'pariente',
          createdAt: now,
          updatedAt: now
        }
      ];
    }

    return []; // Fallback empty
  }

  // Obtener todos los elementos de menú (solo admin)
  async getAllMenuItems(): Promise<DynamicMenuItem[]> {
    // Menú hardcodeado - siempre devolver el menú por defecto
    return this.getDefaultMenuItems('admin');
  }

  // Crear un nuevo elemento de menú (no disponible - menú hardcodeado)
  async createMenuItem(data: CreateMenuItemData): Promise<DynamicMenuItem> {
    throw new Error('El menú es hardcodeado. No se pueden crear nuevos elementos.');
  }

  // Actualizar un elemento de menú existente (no disponible - menú hardcodeado)
  async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<DynamicMenuItem> {
    throw new Error('El menú es hardcodeado. No se pueden actualizar elementos.');
  }

  // Eliminar un elemento de menú (no disponible - menú hardcodeado)
  async deleteMenuItem(id: string): Promise<void> {
    throw new Error('El menú es hardcodeado. No se pueden eliminar elementos.');
  }

  // Reordenar elementos de menú (no disponible - menú hardcodeado)
  async reorderMenuItems(reorderData: Array<{ id: string; order: number }>): Promise<void> {
    throw new Error('El menú es hardcodeado. No se puede reordenar.');
  }

  // Toggle activar/desactivar elemento de menú (no disponible - menú hardcodeado)
  async toggleMenuItem(id: string): Promise<DynamicMenuItem> {
    throw new Error('El menú es hardcodeado. No se pueden desactivar elementos.');
  }

  // Restaurar elemento de menú oculto (no disponible - menú hardcodeado)
  async restoreMenuItem(id: string): Promise<{ success: boolean; message: string; item: DynamicMenuItem }> {
    throw new Error('El menú es hardcodeado. No se pueden restaurar elementos.');
  }

  // Obtener todos los menús incluyendo los ocultos
  async getAllMenuItemsWithHidden(): Promise<DynamicMenuItem[]> {
    return this.getAllMenuItems();
  }

  // Obtener iconos disponibles
  async getAvailableIcons(): Promise<string[]> {
    // Lista de iconos disponibles de Lucide React - v3 (sin duplicaciones)
    return [
      'Home', 'Users', 'FileText', 'ShoppingCart', 'Building2', 'CheckSquare',
      'Settings', 'User', 'Plus', 'List', 'BookOpen', 'Calendar', 'ClipboardList',
      'BarChart3', 'Database', 'MessageCircle', 'Layers', 'ExternalLink',
      'UserPlus', 'Mail', 'Phone', 'MapPin', 'Clock', 'Star', 'Heart',
      'Download', 'Upload', 'Edit', 'Trash2', 'Save', 'Search', 'Filter',
      'RefreshCw', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Shield', 'Key',
      'Bell', 'BellOff', 'Volume2', 'VolumeX', 'Play', 'Pause', 'Stop',
      'SkipBack', 'SkipForward', 'Repeat', 'Shuffle', 'Music', 'Video',
      'Camera', 'Image', 'File', 'Folder', 'FolderOpen', 'Archive',
      'Tag', 'Tags', 'Flag', 'Bookmark', 'BookmarkCheck', 'ThumbsUp',
      'ThumbsDown', 'Smile', 'Frown', 'Meh', 'Laugh', 'Angry', 'Sad',
      'Wink', 'Tongue', 'Kiss', 'HeartHandshake', 'Hand', 'Handshake',
      'Fingerprint', 'Scan', 'QrCode', 'Barcode', 'CreditCard', 'Wallet',
      'Coins', 'Banknote', 'Receipt', 'Calculator', 'Percent', 'TrendingUp',
      'TrendingDown', 'Activity', 'Pulse', 'Zap', 'Battery', 'BatteryLow',
      'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Radio', 'Tv',
      'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Watch', 'Headphones',
      'Speaker', 'Mic', 'MicOff', 'Volume1'
    ];
  }
}

export const menuAPI = new MenuAPI();
