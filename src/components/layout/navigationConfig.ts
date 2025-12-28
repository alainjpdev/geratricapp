import {
  Home,
  Users,
  FileText as FileTextIcon,
  ShoppingCart,
  Building2,
  CheckSquare,
  Settings,
  User,
  Plus,
  List,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  Database,
  MessageCircle,
  Layers,
  ExternalLink,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Heart,
  Download,
  Upload,
  Edit,
  Trash2,
  Save,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Key,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Music,
  Video,
  Camera,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Tag,
  Tags,
  Flag,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  HeartHandshake,
  Hand,
  Handshake,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  CreditCard,
  Wallet,
  Coins,
  Banknote,
  Receipt,
  Calculator,
  Percent,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Battery,
  BatteryLow,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Mic,
  MicOff,
  // Iconos adicionales verificados
  DollarSign,
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Trophy,
  Palette,
  Factory,
  Globe,
  Send,
  X,
  Minus,
  GripVertical,
} from 'lucide-react';
import { DynamicMenuItem } from '../../types/menu';

export interface NavigationSubItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export interface NavigationItem {
  to?: string;
  key?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  googleSheetUrl?: string; // URL de Google Sheets para enlazar
  submenu?: NavigationSubItem[];
  id?: string; // ID único del elemento dinámico para usar como fallback de key
  external?: boolean; // Si es un enlace externo (abre en nueva ventana)
}

// Mapeo de iconos de string a componentes de Lucide - SIN DUPLICACIONES - v2
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Iconos básicos de navegación
  Home,
  Users,
  FileText: FileTextIcon,
  ShoppingCart,
  Building2,
  CheckSquare,
  Settings,
  User,
  Plus,
  List,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  Database,
  MessageCircle,
  Layers,
  ExternalLink,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Heart,
  Download,
  Upload,
  Edit,
  Trash2,
  Save,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Key,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Music,
  Video,
  Camera,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Tag,
  Tags,
  Flag,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  HeartHandshake,
  Hand,
  Handshake,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  CreditCard,
  Wallet,
  Coins,
  Banknote,
  Receipt,
  Calculator,
  Percent,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Battery,
  BatteryLow,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Mic,
  MicOff,
  // Iconos adicionales
  DollarSign,
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Trophy,
  Palette,
  Factory,
  Globe,
  Send,
  X,
  Minus,
  GripVertical,
};

// Función para convertir DynamicMenuItem a NavigationItem
export const convertDynamicToNavigation = (dynamicItem: DynamicMenuItem): NavigationItem => {
  const IconComponent = iconMap[dynamicItem.icon] || Home;

  // Si no tiene 'to' definido, asignar un valor temporal para evitar errores
  // pero NavigationItem lo filtrará después
  const toValue = dynamicItem.to || (dynamicItem.label === 'SETTINGS' ? '/dashboard/settings' : undefined);

  // Verificar que tenga 'to' definido (solo para logging, no bloquear)
  if (!dynamicItem.to && dynamicItem.label !== 'SETTINGS') {
    console.warn('DynamicMenuItem sin "to" definido:', dynamicItem);
  }

  const result: NavigationItem = {
    to: toValue,
    key: dynamicItem.key,
    icon: IconComponent,
    label: dynamicItem.label,
    googleSheetUrl: dynamicItem.googleSheetUrl,
    id: dynamicItem.id // Incluir el ID único del elemento dinámico
  };

  // Solo agregar submenu si existe y tiene elementos
  if (dynamicItem.submenu && dynamicItem.submenu.length > 0) {
    result.submenu = dynamicItem.submenu.map(sub => ({
      to: sub.to,
      icon: iconMap[sub.icon] || Home,
      label: sub.label
    }));
  }

  return result;
};

export const adminNavigationItems: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Panel de Control' },
  { to: '/dashboard/users', icon: Users, label: 'Usuarios' },

  { to: '/dashboard/search', icon: Search, label: 'Search' },
  {
    key: 'orders',
    icon: ShoppingCart,
    label: 'Órdenes',
    submenu: [
      { to: '/dashboard/orders', icon: List, label: 'Listado' },
      { to: '/dashboard/orders/create', icon: Plus, label: 'Crear Orden' }
    ]
  },
  { to: '/dashboard/crm', icon: Building2, label: 'CRM' },

  // { to: '/dashboard/settings', icon: Settings, label: 'Configuración' },
  { to: '/dashboard/profile', icon: User, label: 'Perfil' },
];

// Configuración para otros roles (estudiantes, profesores)
export const studentNavigationItems: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Panel de Control' },
  { to: '/dashboard/classes', icon: Home, label: 'Mis Clases' },
  { to: '/dashboard/assignments', icon: CheckSquare, label: 'Tareas' },
  { to: '/dashboard/profile', icon: User, label: 'Perfil' },
];

export const teacherNavigationItems: NavigationItem[] = [
  { to: '/dashboard', icon: Home, label: 'Panel de Control' },
  { to: '/dashboard/classes', icon: Home, label: 'Mis Clases' },
  { to: '/dashboard/students', icon: Users, label: 'Estudiantes' },
  { to: '/dashboard/assignments', icon: CheckSquare, label: 'Tareas' },
  { to: '/dashboard/profile', icon: User, label: 'Perfil' },
];
