/**
 * Servicio para interactuar con usuarios usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import type { LocalUser } from '../db/localDB';

export interface LocalUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  avatar?: string;
  grupoAsignado?: string;
}

/**
 * Obtener usuario por ID
 */
export const getUserById = (userId: string): LocalUserData | null => {
  try {
    const user = jsonDB.getUserById(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      grupoAsignado: user.grupoAsignado,
    };
  } catch (error) {
    console.error('Error getting user from JSON:', error);
    return null;
  }
};

/**
 * Obtener todos los estudiantes
 */
export const getAllStudents = (): LocalUserData[] => {
  try {
    const users = jsonDB.getUsers().filter(u => u.role === 'student' && u.isActive);

    return users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      avatar: u.avatar,
      grupoAsignado: u.grupoAsignado,
    }));
  } catch (error) {
    console.error('Error getting students from JSON:', error);
    return [];
  }
};

/**
 * Obtener estudiantes por grupo
 */
export const getStudentsByGroup = (group: string): LocalUserData[] => {
  try {
    const users = jsonDB.getUsers().filter(
      u => u.role === 'student' && u.isActive && u.grupoAsignado === group
    );

    return users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      avatar: u.avatar,
      grupoAsignado: u.grupoAsignado,
    }));
  } catch (error) {
    console.error('Error getting students by group from JSON:', error);
    return [];
  }
};

/**
 * Obtener todos los grupos únicos
 */
export const getAllGroups = (): string[] => {
  try {
    const users = jsonDB.getUsers().filter(u => u.role === 'student' && u.isActive && u.grupoAsignado);
    const groups = new Set(users.map(u => u.grupoAsignado).filter(Boolean) as string[]);
    return Array.from(groups).sort();
  } catch (error) {
    console.error('Error getting groups from JSON:', error);
    return [];
  }
};

// Exportar como objeto para mantener compatibilidad con localUserService
export const jsonUserService = {
  getUserById,
  getAllStudents,
  getStudentsByGroup,
  getAllGroups,
};








