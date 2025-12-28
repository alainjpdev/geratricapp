/**
 * Servicio para interactuar con assignments en Supabase
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { getStudentsByGroup, getAllStudents } from './userService';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localAssignmentService from './localAssignmentService';
import * as jsonAssignmentService from './jsonAssignmentService';

export interface AssignmentData {
  streamItemId: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  instructions?: string;
  assignToAll?: boolean;
  assignedGroups?: string[];
  selectedStudents?: string[];
  isVisible?: boolean; // New field for visibility control
}

/**
 * Generar UUID v4
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores que no soportan crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Crear o actualizar un assignment
 */
export const saveAssignment = async (data: AssignmentData): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.saveAssignmentJSON(data);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.saveAssignmentLocal(data);
  }

  try {
    const now = new Date().toISOString();

    // Preparar datos del assignment
    const assignmentData: any = {
      stream_item_id: data.streamItemId,
      points: data.points || null,
      due_date: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : null,
      due_time: data.dueTime || null,
      instructions: data.instructions || null,
      assign_to_all: data.assignToAll ?? true,
      assigned_groups: data.assignedGroups || [],
      updated_at: now,
    };

    // Verificar si el assignment ya existe
    const { data: existingAssignment } = await supabase
      .from('assignments')
      .select('id')
      .eq('stream_item_id', data.streamItemId)
      .maybeSingle();

    let assignmentId: string;

    if (existingAssignment) {
      // Actualizar assignment existente
      assignmentId = existingAssignment.id;
      const { error: updateError } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      // Eliminar asignaciones de estudiantes existentes
      await supabase
        .from('assignment_students')
        .delete()
        .eq('assignment_id', assignmentId);
    } else {
      // Crear nuevo assignment
      assignmentData.id = generateUUID();
      assignmentData.created_at = now;

      const { data: newAssignment, error: createError } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select('id')
        .single();

      if (createError) throw createError;
      if (!newAssignment) throw new Error('Failed to create assignment');

      assignmentId = newAssignment.id;
    }

    // Asignar estudiantes según la configuración
    if (!data.assignToAll) {
      let studentIds: string[] = [];

      // Si hay grupos asignados, obtener estudiantes de esos grupos
      if (data.assignedGroups && data.assignedGroups.length > 0) {
        const studentsByGroupPromises = data.assignedGroups.map(group =>
          getStudentsByGroup(group)
        );
        const studentsArrays = await Promise.all(studentsByGroupPromises);
        const groupStudentIds = studentsArrays.flat().map(s => s.id);
        studentIds = [...new Set([...studentIds, ...groupStudentIds])];
      }

      // Si hay estudiantes seleccionados individualmente, agregarlos
      if (data.selectedStudents && data.selectedStudents.length > 0) {
        studentIds = [...new Set([...studentIds, ...data.selectedStudents])];
      }

      // Crear registros en assignment_students
      if (studentIds.length > 0) {
        const assignmentStudentsData = studentIds.map(studentId => ({
          id: generateUUID(),
          assignment_id: assignmentId,
          student_id: studentId,
        }));

        const { error: studentsError } = await supabase
          .from('assignment_students')
          .insert(assignmentStudentsData);

        if (studentsError) {
          console.error('Error assigning students:', studentsError);
          // No lanzar error, solo registrar
        }
      }
    }
  } catch (error) {
    console.error('Error saving assignment:', error);
    throw error;
  }
};

/**
 * Obtener assignment por streamItemId
 */
export const getAssignmentByStreamItemId = async (streamItemId: string): Promise<(AssignmentData & { title?: string; isArchived?: boolean; attachments?: any[] }) | null> => {
  // En modo JSON, usar JSON en memoria
  if (USE_JSON_DB) {
    return jsonAssignmentService.getAssignmentByStreamItemIdJSON(streamItemId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.getAssignmentByStreamItemIdLocal(streamItemId);
  }

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items(
          id,
          title,
          is_archived,
          attachments(*)
        ),
        assignment_students(student_id)
      `)
      .eq('stream_item_id', streamItemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No encontrado
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      streamItemId: data.stream_item_id,
      title: data.stream_item?.title || '',
      points: data.points || undefined,
      dueDate: data.due_date || undefined,
      dueTime: data.due_time || undefined,
      instructions: data.instructions || undefined,
      assignToAll: data.assign_to_all,
      assignedGroups: data.assigned_groups || [],
      selectedStudents: (data.assignment_students || []).map((as: any) => as.student_id),
      isArchived: data.stream_item?.is_archived || false,
      attachments: (data.stream_item?.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
    };
  } catch (error) {
    console.error('Error loading assignment:', error);
    throw error;
  }
};

/**
 * Obtener todos los assignments (para admins)
 */
export const getAllAssignments = async (): Promise<Array<{
  id: string;
  streamItemId: string;
  classId: string;
  className: string;
  title: string;
  instructions?: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  studentCount: number;
  pendingReviewCount: number;
  isArchived: boolean;
}>> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.getAllAssignmentsJSON();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.getAllAssignmentsLocal();
  }

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            first_name,
            last_name,
            avatar
          ),
          attachments(*)
        ),
        assignment_students(count)
      `)
      .eq('is_deleted', false) // Excluir assignments eliminados
      // Nota: Filtramos is_archived en el componente para asegurar que funcione
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((assignment: any) => ({
      id: assignment.id,
      streamItemId: assignment.stream_item_id,
      type: 'assignment',
      classId: assignment.stream_item?.class_id || '',
      className: assignment.stream_item?.class?.title || 'Sin clase',
      title: assignment.stream_item?.title || '',
      instructions: assignment.instructions || undefined,
      points: assignment.points || undefined,
      dueDate: assignment.due_date || undefined,
      dueTime: assignment.due_time || undefined,
      assignToAll: assignment.assign_to_all,
      assignedGroups: assignment.assigned_groups || [],
      author: {
        id: assignment.stream_item?.author_id || '',
        name: `${assignment.stream_item?.author?.first_name || ''} ${assignment.stream_item?.author?.last_name || ''}`.trim() || 'Usuario',
        avatar: assignment.stream_item?.author?.avatar || undefined,
      },
      createdAt: assignment.created_at,
      studentCount: assignment.assignment_students?.[0]?.count || 0,
      pendingReviewCount: 0, // Not implemented for Supabase yet, requires joining submissions
      isArchived: assignment.stream_item?.is_archived || false,
      attachments: (assignment.stream_item?.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
    }));
  } catch (error) {
    console.error('Error loading all assignments:', error);
    throw error;
  }
};

/**
 * Obtener assignments por clase (para profesores o admins)
 */
export const getAssignmentsByClass = async (classId: string, isAdmin: boolean = false): Promise<Array<{
  id: string;
  streamItemId: string;
  title: string;
  instructions?: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  studentCount: number;
  isArchived: boolean;
}>> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.getAssignmentsByClassJSON(classId, isAdmin);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.getAssignmentsByClassLocal(classId, isAdmin);
  }

  try {
    let query = supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items!inner(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          author:users(
            id,
            first_name,
            last_name,
            avatar
          ),
          attachments(*)
        ),
        assignment_students(count)
      `)
      .eq('is_deleted', false) // Excluir assignments eliminados
      // Nota: Filtramos is_archived en el componente para asegurar que funcione
      .order('created_at', { ascending: false });

    // Si no es admin, filtrar por clase
    if (!isAdmin) {
      query = query.eq('stream_item.class_id', classId);
    }
    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((assignment: any) => ({
      id: assignment.id,
      streamItemId: assignment.stream_item_id,
      title: assignment.stream_item?.title || '',
      classId: assignment.stream_item?.class_id, // Add missing classId
      instructions: assignment.instructions || undefined,
      points: assignment.points || undefined,
      dueDate: assignment.due_date || undefined,
      dueTime: assignment.due_time || undefined,
      assignToAll: assignment.assign_to_all,
      assignedGroups: assignment.assigned_groups || [],
      author: {
        id: assignment.stream_item?.author_id || '',
        name: `${assignment.stream_item?.author?.first_name || ''} ${assignment.stream_item?.author?.last_name || ''}`.trim() || 'Usuario',
        avatar: assignment.stream_item?.author?.avatar || undefined,
      },
      createdAt: assignment.created_at,
      studentCount: assignment.assignment_students?.[0]?.count || 0,
      pendingReviewCount: 0, // Not implemented for Supabase yet
      isArchived: assignment.stream_item?.is_archived || false,
      attachments: (assignment.stream_item?.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
    }));
  } catch (error) {
    console.error('Error loading assignments by class:', error);
    throw error;
  }
};

/**
 * Eliminar assignment (soft delete)
 */
export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.deleteAssignmentJSON(assignmentId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.deleteAssignmentLocal(assignmentId);
  }

  try {
    const { error } = await supabase
      .from('assignments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

/**
 * Archivar assignment
 */
export const archiveAssignment = async (streamItemId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.archiveAssignmentJSON(streamItemId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.archiveAssignmentLocal(streamItemId);
  }

  try {
    const { error } = await supabase
      .from('stream_items')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', streamItemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error archiving assignment:', error);
    throw error;
  }
};

/**
 * Obtener todos los assignments archivados
 */
export const getArchivedAssignments = async (): Promise<Array<{
  id: string;
  streamItemId: string;
  classId: string;
  className: string;
  title: string;
  instructions?: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  studentCount: number;
}>> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.getArchivedAssignmentsJSON();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.getArchivedAssignmentsLocal();
  }

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            first_name,
            last_name,
            avatar
          )
        ),
        assignment_students(count)
      `)
      .eq('is_deleted', false)
      .eq('stream_item.is_archived', true) // Solo archivados
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((assignment: any) => ({
      id: assignment.id,
      streamItemId: assignment.stream_item_id,
      type: 'assignment',
      classId: assignment.stream_item?.class_id || '',
      className: assignment.stream_item?.class?.title || 'Sin clase',
      title: assignment.stream_item?.title || '',
      instructions: assignment.instructions || undefined,
      points: assignment.points || undefined,
      dueDate: assignment.due_date || undefined,
      dueTime: assignment.due_time || undefined,
      assignToAll: assignment.assign_to_all,
      assignedGroups: assignment.assigned_groups || [],
      author: {
        id: assignment.stream_item?.author_id || '',
        name: `${assignment.stream_item?.author?.first_name || ''} ${assignment.stream_item?.author?.last_name || ''}`.trim() || 'Usuario',
        avatar: assignment.stream_item?.author?.avatar || undefined,
      },
      createdAt: assignment.created_at,
      studentCount: assignment.assignment_students?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error('Error loading archived assignments:', error);
    throw error;
  }
};

/**
 * Desarchivar assignment
 */
export const unarchiveAssignment = async (streamItemId: string, className?: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.unarchiveAssignmentJSON(streamItemId, className);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.unarchiveAssignmentLocal(streamItemId, className);
  }

  try {
    const { error } = await supabase
      .from('stream_items')
      .update({
        is_archived: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', streamItemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unarchiving assignment:', error);
    throw error;
  }
};

/**
 * Obtener assignment por ID (para edición)
 */
export const getAssignmentById = async (assignmentId: string) => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.getAssignmentByIdJSON(assignmentId);
  }
  if (USE_LOCAL_DB) {
    return localAssignmentService.getAssignmentByIdLocal(assignmentId);
  }
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items(
          id,
          title,
          content,
          class_id,
          is_archived
        ),
        assignment_students(student_id)
      `)
      .eq('id', assignmentId)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      streamItemId: data.stream_item_id,
      title: data.stream_item?.title || '',
      instructions: data.instructions || undefined,
      points: data.points || undefined,
      dueDate: data.due_date || undefined,
      dueTime: data.due_time || undefined,
      assignToAll: data.assign_to_all,
      assignedGroups: data.assigned_groups || [],
      selectedStudents: (data.assignment_students || []).map((as: any) => as.student_id),
      classId: data.stream_item?.class_id,
      isArchived: data.stream_item?.is_archived || false,
    };
  } catch (error) {
    console.error('Error loading assignment:', error);
    throw error;
  }
};

/**
 * Obtener assignments para un estudiante específico
 * Considera: assignToAll, assignment_students, y grupo_asignado del estudiante
 */
export const getAssignmentsForStudent = async (
  studentId: string,
  studentGrupoAsignado?: string
): Promise<Array<{
  id: string;
  streamItemId: string;
  classId: string;
  className: string;
  title: string;
  instructions?: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  isArchived: boolean;
  pendingReviewCount?: number; // Optional for students
}>> => {
  if (USE_JSON_DB) {
    return jsonAssignmentService.getAssignmentsForStudentJSON(studentId, studentGrupoAsignado);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localAssignmentService.getAssignmentsForStudentLocal(studentId, studentGrupoAsignado);
  }

  try {
    // Primero, obtener todos los assignments que no están eliminados ni archivados
    const { data: allAssignments, error: allError } = await supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            first_name,
            last_name,
            avatar
          )
        ),
        assignment_students!inner(student_id)
      `)
      .eq('is_deleted', false)
      .eq('stream_item.is_archived', false)
      .eq('assignment_students.student_id', studentId);

    if (allError && allError.code !== 'PGRST116') {
      throw allError;
    }

    // También obtener assignments con assignToAll = true
    const { data: allAssignmentsForAll, error: allForAllError } = await supabase
      .from('assignments')
      .select(`
        *,
        stream_item:stream_items(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            first_name,
            last_name,
            avatar
          )
        )
      `)
      .eq('is_deleted', false)
      .eq('stream_item.is_archived', false)
      .eq('assign_to_all', true);

    if (allForAllError) throw allForAllError;

    // Si el estudiante tiene grupo_asignado, también obtener assignments asignados a ese grupo
    let groupAssignments: any[] = [];
    if (studentGrupoAsignado) {
      const { data: groupData, error: groupError } = await supabase
        .from('assignments')
        .select(`
          *,
          stream_item:stream_items(
            id,
            class_id,
            title,
            content,
            author_id,
            created_at,
            is_archived,
            class:classes(
              id,
              title
            ),
            author:users(
              id,
              first_name,
              last_name,
              avatar
            )
          )
        `)
        .eq('is_deleted', false)
        .eq('stream_item.is_archived', false)
        .eq('assign_to_all', false)
        .contains('assigned_groups', [studentGrupoAsignado]);

      if (groupError) {
        console.error('Error loading group assignments:', groupError);
      } else {
        groupAssignments = groupData || [];
      }
    }

    // Combinar y deduplicar assignments
    const assignmentMap = new Map<string, any>();

    // Agregar assignments asignados directamente al estudiante
    (allAssignments || []).forEach((assignment: any) => {
      assignmentMap.set(assignment.id, assignment);
    });

    // Agregar assignments para todos
    (allAssignmentsForAll || []).forEach((assignment: any) => {
      assignmentMap.set(assignment.id, assignment);
    });

    // Agregar assignments del grupo del estudiante
    groupAssignments.forEach((assignment: any) => {
      assignmentMap.set(assignment.id, assignment);
    });

    // Convertir a array y mapear
    return Array.from(assignmentMap.values()).map((assignment: any) => ({
      id: assignment.id,
      streamItemId: assignment.stream_item_id,
      classId: assignment.stream_item?.class_id || '',
      className: assignment.stream_item?.class?.title || 'Sin clase',
      title: assignment.stream_item?.title || '',
      instructions: assignment.instructions || undefined,
      points: assignment.points || undefined,
      dueDate: assignment.due_date || undefined,
      dueTime: assignment.due_time || undefined,
      assignToAll: assignment.assign_to_all,
      assignedGroups: assignment.assigned_groups || [],
      author: {
        id: assignment.stream_item?.author_id || '',
        name: `${assignment.stream_item?.author?.first_name || ''} ${assignment.stream_item?.author?.last_name || ''}`.trim() || 'Usuario',
        avatar: assignment.stream_item?.author?.avatar || undefined,
      },
      createdAt: assignment.stream_item?.created_at || assignment.created_at,
      isArchived: assignment.stream_item?.is_archived || false,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error loading assignments for student:', error);
    throw error;
  }
};

