// Layout Components
export { BaseLayout } from './BaseLayout';
export { Sidebar } from './Sidebar';
export { DynamicSidebar } from './DynamicSidebar';
export { UserProfile } from './UserProfile';
export { NavigationItem } from './NavigationItem';
export { MenuManager } from './MenuManager';
export { AdminMenu } from './AdminMenu';

// Navigation Configuration
export { 
  adminNavigationItems, 
  studentNavigationItems, 
  teacherNavigationItems,
  iconMap,
  convertDynamicToNavigation,
  type NavigationItem,
  type NavigationSubItem 
} from './navigationConfig';
