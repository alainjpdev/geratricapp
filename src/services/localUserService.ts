/**
 * Servicio local para interactuar con usuarios en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalUser } from '../db/localDB';

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
export const getUserByIdLocal = async (userId: string): Promise<LocalUserData | null> => {
  try {
    const user = await localDB.users.get(userId);
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
    console.error('Error getting user from local DB:', error);
    return null;
  }
};

/**
 * Obtener todos los estudiantes
 */
export const getAllStudentsLocal = async (): Promise<LocalUserData[]> => {
  try {
    const users = await localDB.users
      .where('role')
      .equals('student')
      .and(u => u.isActive)
      .toArray();

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
    console.error('Error getting students from local DB:', error);
    return [];
  }
};

/**
 * Obtener estudiantes por grupo
 */
export const getStudentsByGroupLocal = async (group: string): Promise<LocalUserData[]> => {
  try {
    const users = await localDB.users
      .where('grupoAsignado')
      .equals(group)
      .and(u => u.role === 'student' && u.isActive)
      .toArray();

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
    console.error('Error getting students by group from local DB:', error);
    return [];
  }
};

/**
 * Obtener todos los grupos únicos
 */
export const getAllGroupsLocal = async (): Promise<string[]> => {
  try {
    const users = await localDB.users
      .where('role')
      .equals('student')
      .and(u => u.isActive && u.grupoAsignado)
      .toArray();

    const groups = new Set<string>();
    users.forEach(u => {
      if (u.grupoAsignado) {
        groups.add(u.grupoAsignado);
      }
    });

    return Array.from(groups).sort();
  } catch (error) {
    console.error('Error getting groups from local DB:', error);
    return [];
  }
};

/**
 * Obtener todos los profesores (teachers y admins)
 */
export const getTeachersLocal = async (): Promise<LocalUserData[]> => {
  try {
    const users = await localDB.users
      .where('role')
      .anyOf(['teacher', 'admin'])
      .and(u => u.isActive)
      .toArray();

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
    console.error('Error getting teachers from local DB:', error);
    return [];
  }
};

// Exportar como objeto para compatibilidad
export const localUserService = {
  getUserById: getUserByIdLocal,
  getAllStudents: getAllStudentsLocal,
  getStudentsByGroup: getStudentsByGroupLocal,
  getAllGroups: getAllGroupsLocal,
  getTeachers: getTeachersLocal,
};

