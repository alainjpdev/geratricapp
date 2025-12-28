/**
 * Servicio para interactuar con usuarios en Supabase
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import { localUserService } from './localUserService';
import { jsonUserService } from './jsonUserService';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  grupoAsignado?: string;
}

/**
 * Obtener todos los grupos disponibles (distintos valores de grupoAsignado)
 */
export const getAvailableGroups = async (): Promise<string[]> => {
  if (USE_JSON_DB) {
    return jsonUserService.getAllGroups();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localUserService.getAllGroups();
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('grupo_asignado')
      .not('grupo_asignado', 'is', null)
      .neq('grupo_asignado', '');

    if (error) throw error;

    // Obtener valores únicos
    const groups = [...new Set((data || []).map((u: any) => u.grupo_asignado).filter(Boolean))];
    return groups.sort();
  } catch (error) {
    console.error('Error loading groups:', error);
    throw error;
  }
};

/**
 * Obtener estudiantes por grupo asignado
 */
export const getStudentsByGroup = async (group: string): Promise<UserData[]> => {
  if (USE_JSON_DB) {
    return jsonUserService.getStudentsByGroup(group);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localUserService.getStudentsByGroup(group);
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, avatar, grupo_asignado')
      .eq('grupo_asignado', group)
      .eq('role', 'student')
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      role: u.role,
      avatar: u.avatar || undefined,
      grupoAsignado: u.grupo_asignado || undefined,
    }));
  } catch (error) {
    console.error('Error loading students by group:', error);
    throw error;
  }
};

/**
 * Obtener estudiantes de una clase
 */
export const getClassStudents = async (classId: string): Promise<UserData[]> => {
  try {
    const { data, error } = await supabase
      .from('class_members')
      .select(`
        student:users!class_members_student_id_fkey(
          id,
          email,
          first_name,
          last_name,
          role,
          avatar,
          grupo_asignado
        )
      `)
      .eq('class_id', classId)
      .eq('role', 'student');

    if (error) throw error;

    return (data || [])
      .map((cm: any) => cm.student)
      .filter(Boolean)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        role: u.role,
        avatar: u.avatar || undefined,
        grupoAsignado: u.grupo_asignado || undefined,
      }));
  } catch (error) {
    console.error('Error loading class students:', error);
    throw error;
  }
};

/**
 * Obtener todos los estudiantes (para asignación individual)
 */
export const getAllStudents = async (): Promise<UserData[]> => {
  if (USE_JSON_DB) {
    return jsonUserService.getAllStudents();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localUserService.getAllStudents();
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, avatar, grupo_asignado')
      .eq('role', 'student')
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      role: u.role,
      avatar: u.avatar || undefined,
      grupoAsignado: u.grupo_asignado || undefined,
    }));
  } catch (error) {
    console.error('Error loading all students:', error);
    throw error;
  }
};

/**
 * Obtener todos los profesores (teachers y admins)
 */
export const getTeachers = async (): Promise<UserData[]> => {
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localUserService.getTeachers();
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, avatar, grupo_asignado')
      .in('role', ['teacher', 'admin'])
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      role: u.role,
      avatar: u.avatar || undefined,
      grupoAsignado: u.grupo_asignado || undefined,
    }));
  } catch (error) {
    console.error('Error loading teachers:', error);
    throw error;
  }
};

