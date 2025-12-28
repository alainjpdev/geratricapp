/**
 * Componente Classwork específico para profesores
 * Muestra assignments, quizzes y materials de la clase
 * Permite crear, editar, eliminar y archivar
 */

import React from 'react';
import { Classwork } from '../Classwork';

interface TeacherClassworkProps {
  classId: string;
  className?: string;
}

export const TeacherClasswork: React.FC<TeacherClassworkProps> = ({ classId, className = '' }) => {
  return <Classwork classId={classId} isTeacher={true} className={className} />;
};








