import { useState } from 'react';

export const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };

  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  return {
    collapsed,
    expandedMenus,
    toggleCollapse,
    toggleSubmenu
  };
};
