/**
 * Servicio de autenticación que usa directamente la tabla users
 * sin depender de Supabase Auth
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { User } from '../types';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import { loginWithLocalDB, getUserFromLocalDB } from './localAuthService';
import { loginWithJSON, getUserFromJSON } from './jsonAuthService';
import bcrypt from 'bcryptjs';

/**
 * Verificar credenciales contra la tabla users
 * Nota: La comparación de contraseñas debe hacerse en el servidor
 * usando una función RPC de Supabase
 */
export const loginWithUsersTable = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // En modo JSON, usar JSON en memoria
  if (USE_JSON_DB) {
    console.log('📄 Modo desarrollo: usando JSON en memoria');
    return loginWithJSON(email, password);
  }

  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    console.log('🔧 Modo desarrollo: usando base de datos local');
    return loginWithLocalDB(email, password);
  }

  try {
    // Primero, buscar el usuario en la tabla users
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, avatar, password_hash, is_active, grupo_asignado, font_size')
      .eq('email', email)
      .maybeSingle();

    if (userError || !dbUser) {
      throw new Error('Usuario no encontrado o credenciales incorrectas');
    }

    if (!dbUser.is_active) {
      throw new Error('Usuario inactivo. Contacta al administrador.');
    }

    // Verificar contraseña
    // Si no hay password_hash, permitir login sin verificación (para usuarios sin contraseña configurada)
    if (!dbUser.password_hash) {
      console.warn('Usuario sin contraseña configurada, permitiendo login sin verificación');
    } else {
      // Verificar usando bcryptjs en el cliente (ya que tenemos el hash)
      console.log('🔐 Verificando password para:', email);

      const passwordValid = await bcrypt.compare(password, dbUser.password_hash);

      if (!passwordValid) {
        throw new Error('Contraseña incorrecta');
      }
    }

    // Crear objeto User
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name || '',
      lastName: dbUser.last_name || '',
      role: (['admin', 'enfermero', 'paciente', 'pariente'].includes(dbUser.role) ? dbUser.role : 'paciente') as 'admin' | 'enfermero' | 'paciente' | 'pariente',
      avatar: dbUser.avatar || '',
      grupoAsignado: dbUser.grupo_asignado || undefined,
      createdAt: new Date().toISOString(),
      fontSize: dbUser.font_size || 16
    };

    // Generar un token simple (en producción, usar JWT)
    // Por ahora, usamos el ID del usuario como token
    const token = btoa(JSON.stringify({ userId: user.id, email: user.email, timestamp: Date.now() }));

    return { user, token };
  } catch (error: any) {
    console.error('Error en login:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

/**
 * Obtener usuario desde la tabla users por ID
 */
export const getUserFromTable = async (userId: string): Promise<User | null> => {
  // En modo JSON, usar JSON en memoria
  if (USE_JSON_DB) {
    return getUserFromJSON(userId);
  }

  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return getUserFromLocalDB(userId);
  }

  try {
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, avatar, is_active, grupo_asignado, font_size')
      .eq('id', userId)
      .maybeSingle();

    if (error || !dbUser || !dbUser.is_active) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name || '',
      lastName: dbUser.last_name || '',
      role: (['admin', 'enfermero', 'paciente', 'pariente'].includes(dbUser.role) ? dbUser.role : 'paciente') as 'admin' | 'enfermero' | 'paciente' | 'pariente',
      avatar: dbUser.avatar || '',
      grupoAsignado: dbUser.grupo_asignado || undefined,
      createdAt: new Date().toISOString(),
      fontSize: dbUser.font_size || 16
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
};
/**
 * Actualizar la contraseña del usuario
 */
export const updatePassword = async (userId: string, newPassword: string): Promise<void> => {
  // En modo JSON o local, no implementamos cambio de password por ahora
  // o podemos añadirlo si es necesario para pruebas
  if (USE_JSON_DB || USE_LOCAL_DB) {
    console.log('🔧 Modo desarrollo: cambio de password simulado');
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error actualizando contraseña:', error);
    throw new Error(error.message || 'Error al actualizar la contraseña');
  }
};

