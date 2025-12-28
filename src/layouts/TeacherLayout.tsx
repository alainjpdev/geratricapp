import React from 'react';
import { BaseLayout, teacherNavigationItems } from '../components/layout';

export const TeacherLayout: React.FC = () => {
  return <BaseLayout navigationItems={teacherNavigationItems} />;
};