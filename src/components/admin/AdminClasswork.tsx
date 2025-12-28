/**
 * Componente Classwork específico para administradores
 * Muestra assignments, quizzes y materials de todas las clases
 * Permite crear, editar, eliminar y archivar en cualquier clase
 */

import React from 'react';
import { Classwork } from '../Classwork';

interface AdminClassworkProps {
  classId: string;
  className?: string;
}

export const AdminClasswork: React.FC<AdminClassworkProps> = ({ classId, className = '' }) => {
  return <Classwork classId={classId} isTeacher={true} className={className} />;
};








