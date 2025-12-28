/**
 * Servicio de autenticación usando base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalUser } from '../db/localDB';
import bcrypt from 'bcryptjs';
import { User } from '../types';

/**
 * Login usando base de datos local
 */
export const loginWithLocalDB = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    // Buscar usuario en la base local
    const dbUser = await localDB.users
      .where('email')
      .equals(email)
      .first();

    if (!dbUser) {
      // Verificar si hay usuarios en la base de datos
      const userCount = await localDB.users.count();
      if (userCount === 0) {
        throw new Error('No hay usuarios en la base de datos local. Por favor, sincroniza desde Supabase usando el botón "Sincronizar desde Supabase" o importa el CSV usando el botón "Importar CSV" en la esquina inferior izquierda.');
      }
      throw new Error('Usuario no encontrado o credenciales incorrectas');
    }

    if (!dbUser.isActive) {
      throw new Error('Usuario inactivo. Contacta al administrador.');
    }

    // Verificar contraseña
    if (dbUser.passwordHash) {
      const isValid = await bcrypt.compare(password, dbUser.passwordHash);
      if (!isValid) {
        throw new Error('Contraseña incorrecta');
      }
    } else {
      console.warn('Usuario sin contraseña configurada, permitiendo login sin verificación');
    }

    // Crear objeto User
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      role: dbUser.role,
      avatar: dbUser.avatar || '',
      grupoAsignado: dbUser.grupoAsignado,
      createdAt: dbUser.createdAt
    };

    // Generar token simple
    const token = btoa(JSON.stringify({ userId: user.id, email: user.email, timestamp: Date.now() }));

    return { user, token };
  } catch (error: any) {
    console.error('Error en login local:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

/**
 * Obtener usuario desde la base local por ID
 */
export const getUserFromLocalDB = async (userId: string): Promise<User | null> => {
  try {
    const dbUser = await localDB.users.get(userId);

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      role: dbUser.role,
      avatar: dbUser.avatar || '',
      grupoAsignado: dbUser.grupoAsignado,
      createdAt: dbUser.createdAt
    };
  } catch (error) {
    console.error('Error obteniendo usuario local:', error);
    return null;
  }
};

/**
 * Crear o actualizar usuario en la base local
 */
export const saveUserToLocalDB = async (userData: Partial<LocalUser>): Promise<LocalUser> => {
  const now = new Date().toISOString();
  
  const user: LocalUser = {
    id: userData.id || crypto.randomUUID(),
    email: userData.email || '',
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    role: userData.role || 'student',
    avatar: userData.avatar,
    passwordHash: userData.passwordHash,
    grupoAsignado: userData.grupoAsignado,
    isActive: userData.isActive ?? true,
    createdAt: userData.createdAt || now,
    updatedAt: now
  };

  await localDB.users.put(user);
  return user;
};

