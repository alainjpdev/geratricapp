/**
 * Servicio de autenticación usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import bcrypt from 'bcryptjs';
import { User } from '../types';
import type { LocalUser } from '../db/localDB';

/**
 * Login usando base de datos JSON
 */
export const loginWithJSON = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    // Asegurar que la BD está inicializada
    await jsonDB.initialize();

    // Buscar usuario
    console.log(`🔍 Buscando usuario con email: ${email}`);
    const dbUser = jsonDB.getUserByEmail(email);

    if (!dbUser) {
      const users = jsonDB.getUsers();
      if (users.length === 0) {
        throw new Error('No hay usuarios en la base de datos. Por favor, carga datos desde dummy-data.json');
      }
      // En desarrollo, mostrar algunos emails disponibles para ayudar a debuggear
      const availableEmails = users.slice(0, 5).map(u => u.email).join(', ');
      console.log(`❌ Usuario no encontrado. Algunos emails disponibles: ${availableEmails}${users.length > 5 ? '...' : ''}`);
      throw new Error('Usuario no encontrado o credenciales incorrectas');
    }
    
    console.log(`✅ Usuario encontrado: ${dbUser.email} (${dbUser.role})`);

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
    console.error('Error en login JSON:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

/**
 * Obtener usuario desde JSON por ID
 */
export const getUserFromJSON = async (userId: string): Promise<User | null> => {
  try {
    await jsonDB.initialize();
    const dbUser = jsonDB.getUserById(userId);

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
    console.error('Error obteniendo usuario JSON:', error);
    return null;
  }
};

/**
 * Crear o actualizar usuario en JSON
 */
export const saveUserToJSON = async (userData: Partial<LocalUser>): Promise<LocalUser> => {
  await jsonDB.initialize();
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
    isActive: userData.isActive !== false,
    createdAt: userData.createdAt || now,
    updatedAt: now,
  };

  jsonDB.putUser(user);
  return user;
};





