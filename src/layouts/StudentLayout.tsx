import React from 'react';
import { BaseLayout, studentNavigationItems } from '../components/layout';

export const StudentLayout: React.FC = () => {
  return <BaseLayout navigationItems={studentNavigationItems} />;
};