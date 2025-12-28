import { DynamicMenuItem, CreateMenuItemData, UpdateMenuItemData } from '../types/menu';

// Mock data para desarrollo
const mockMenuItems: DynamicMenuItem[] = [
  {
    id: '2',
    to: '/dashboard/users',
    icon: 'Users',
    label: 'Usuarios',
    order: 1,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    to: '/dashboard/quotations',
    icon: 'FileText',
    label: 'Cotizaciones',
    order: 3,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    key: 'orders',
    icon: 'ShoppingCart',
    label: 'Órdenes',
    order: 4,
    isActive: true,
    role: 'admin',
    submenu: [
      {
        id: '4-1',
        to: '/dashboard/orders',
        icon: 'List',
        label: 'Listado',
        order: 1,
        isActive: true
      },
      {
        id: '4-2',
        to: '/dashboard/orders/create',
        icon: 'Plus',
        label: 'Crear Orden',
        order: 2,
        isActive: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    to: '/dashboard/crm',
    icon: 'Building2',
    label: 'CRM',
    order: 5,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    to: '/dashboard/todo',
    icon: 'CheckSquare',
    label: 'To Do',
    order: 6,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    to: '/dashboard/menu-management',
    icon: 'Settings',
    label: 'Gestión de Menús',
    order: 7,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '8',
    // to: '/dashboard/settings', // Oculto
    icon: 'Settings',
    label: 'Configuración',
    order: 8,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '9',
    to: '/dashboard/profile',
    icon: 'User',
    label: 'Perfil',
    order: 9,
    isActive: true,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

class MenuAPIMock {
  private menuItems: DynamicMenuItem[] = [];
  private readonly STORAGE_KEY = 'colorland_menu_items';

  constructor() {
    this.loadFromStorage();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.menuItems = JSON.parse(stored);
      } else {
        this.menuItems = [...mockMenuItems];
        this.saveToStorage();
      }
    } catch (error) {
      console.warn('Error loading menu items from storage:', error);
      this.menuItems = [...mockMenuItems];
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.menuItems));
    } catch (error) {
      console.warn('Error saving menu items to storage:', error);
    }
  }

  async getMenuItems(role: 'admin' | 'teacher' | 'student'): Promise<DynamicMenuItem[]> {
    await this.delay(300);
    return this.menuItems
      .filter(item => item.role === role)
      .sort((a, b) => a.order - b.order);
  }

  async createMenuItem(data: CreateMenuItemData): Promise<DynamicMenuItem> {
    await this.delay(500);
    
    const newItem: DynamicMenuItem = {
      id: this.generateId(),
      to: data.to,
      key: data.key,
      icon: data.icon,
      label: data.label,
      order: data.order || this.menuItems.length + 1,
      isActive: true,
      role: data.role,
      submenu: data.submenu?.map(sub => ({
        id: this.generateId(),
        to: sub.to,
        icon: sub.icon,
        label: sub.label,
        order: sub.order || 1,
        isActive: true
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.menuItems.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  async updateMenuItem(id: string, data: UpdateMenuItemData): Promise<DynamicMenuItem> {
    await this.delay(500);
    
    const itemIndex = this.menuItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new Error('Elemento no encontrado');
    }

    const updatedItem: DynamicMenuItem = {
      ...this.menuItems[itemIndex],
      ...data,
      updatedAt: new Date(),
      submenu: data.submenu?.map(sub => ({
        id: sub.id || this.generateId(),
        to: sub.to,
        icon: sub.icon,
        label: sub.label,
        order: sub.order || 1,
        isActive: sub.isActive !== undefined ? sub.isActive : true
      })) || this.menuItems[itemIndex].submenu
    };

    this.menuItems[itemIndex] = updatedItem;
    this.saveToStorage();
    return updatedItem;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await this.delay(500);
    
    const itemIndex = this.menuItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      throw new Error('Elemento no encontrado');
    }

    this.menuItems.splice(itemIndex, 1);
    this.saveToStorage();
  }

  async reorderMenuItems(reorderData: Array<{ id: string; order: number }>): Promise<void> {
    await this.delay(500);
    
    // Actualizar el orden de los elementos
    reorderData.forEach(({ id, order }) => {
      const itemIndex = this.menuItems.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        this.menuItems[itemIndex] = {
          ...this.menuItems[itemIndex],
          order,
          updatedAt: new Date()
        };
      }
    });
    
    this.saveToStorage();
  }

  async getAvailableIcons(): Promise<string[]> {
    await this.delay(200);
    return [
      // Iconos 100% verificados - SOLO LOS QUE EXISTEN
      'Home', 'Users', 'FileText', 'ShoppingCart', 'Building2', 'CheckSquare',
      'Settings', 'User', 'Plus', 'List', 'BookOpen', 'Calendar', 'ClipboardList',
      'BarChart3', 'Database', 'MessageCircle', 'Layers', 'ExternalLink',
      'UserPlus', 'Mail', 'Phone', 'MapPin', 'Clock', 'Star', 'Heart',
      'Download', 'Upload', 'Edit', 'Trash2', 'Save', 'Search', 'Filter',
      'RefreshCw', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Shield', 'Key',
      'Bell', 'BellOff', 'Volume2', 'VolumeX', 'Play', 'Pause',
      'SkipBack', 'SkipForward', 'Repeat', 'Shuffle', 'Music', 'Video',
      'Camera', 'Image', 'File', 'Folder', 'FolderOpen', 'Archive',
      'Tag', 'Tags', 'Flag', 'Bookmark', 'BookmarkCheck', 'ThumbsUp',
      'ThumbsDown', 'Smile', 'Frown', 'Meh', 'Laugh', 'Angry',
      'HeartHandshake', 'Hand', 'Handshake',
      'Fingerprint', 'Scan', 'QrCode', 'Barcode', 'CreditCard', 'Wallet',
      'Coins', 'Banknote', 'Receipt', 'Calculator', 'Percent', 'TrendingUp',
      'TrendingDown', 'Activity', 'Zap', 'Battery', 'BatteryLow',
      'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothOff', 'Radio', 'Tv',
      'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Watch', 'Headphones',
      'Speaker', 'Mic', 'MicOff', 'Volume1',
      // Iconos adicionales verificados
      'DollarSign', 'Package', 'ArrowLeft', 'ArrowRight', 'CheckCircle',
      'AlertCircle', 'AlertTriangle', 'Trophy', 'Palette', 'Factory',
      'Globe', 'Send', 'X', 'Minus', 'GripVertical'
    ];
  }

  // Método para resetear los datos a su estado original
  async resetToDefaults(): Promise<void> {
    this.menuItems = [...mockMenuItems];
    this.saveToStorage();
  }

  // Método para limpiar el almacenamiento
  async clearStorage(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.menuItems = [...mockMenuItems];
    this.saveToStorage();
  }
}

export const menuAPIMock = new MenuAPIMock();
