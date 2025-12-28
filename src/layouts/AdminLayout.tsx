import React from 'react';
import { BaseLayout, adminNavigationItems } from '../components/layout';

export const AdminLayout: React.FC = () => {
  return <BaseLayout navigationItems={adminNavigationItems} role="admin" />;
};