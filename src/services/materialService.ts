/**
 * Servicio para interactuar con materials en Supabase
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localMaterialService from './localMaterialService';
import * as jsonMaterialService from './jsonMaterialService';
import { getStudentsByGroup, getAllStudents } from './userService';

export interface MaterialData {
  streamItemId: string;
  description?: string;
  assignToAll?: boolean;
  assignedGroups?: string[];
  selectedStudents?: string[];
  attachments?: any[]; // Allow attachments to be returned
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
 * Crear o actualizar un material
 */
export const saveMaterial = async (data: MaterialData): Promise<void> => {
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localMaterialService.saveMaterialLocal(data);
  }

  try {
    const now = new Date().toISOString();

    // Preparar datos del material
    const materialData: any = {
      stream_item_id: data.streamItemId,
      description: data.description || null,
      assign_to_all: data.assignToAll ?? true,
      assigned_groups: data.assignedGroups || [],
      updated_at: now,
    };

    // Verificar si el material ya existe
    const { data: existingMaterial } = await supabase
      .from('materials')
      .select('id')
      .eq('stream_item_id', data.streamItemId)
      .maybeSingle();

    let materialId: string;

    if (existingMaterial) {
      // Actualizar material existente
      const { error: updateError } = await supabase
        .from('materials')
        .update(materialData)
        .eq('id', existingMaterial.id);

      if (updateError) throw updateError;
      materialId = existingMaterial.id;

      // Eliminar asignaciones de estudiantes existentes
      await supabase
        .from('material_students')
        .delete()
        .eq('material_id', materialId);
    } else {
      // Crear nuevo material
      materialData.id = generateUUID();
      materialData.created_at = now;

      const { data: newMaterial, error: createError } = await supabase
        .from('materials')
        .insert(materialData)
        .select('id')
        .single();

      if (createError) throw createError;
      if (!newMaterial) throw new Error('Failed to create material');
      materialId = newMaterial.id;
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

      // Crear registros en material_students
      if (studentIds.length > 0) {
        const materialStudentsData = studentIds.map(studentId => ({
          id: generateUUID(),
          material_id: materialId,
          student_id: studentId,
        }));

        const { error: studentsError } = await supabase
          .from('material_students')
          .insert(materialStudentsData);

        if (studentsError) {
          console.error('Error assigning students:', studentsError);
          // No lanzar error, solo registrar
        }
      }
    }
  } catch (error) {
    console.error('Error saving material:', error);
    throw error;
  }
};

/**
 * Obtener material por streamItemId
 */
export const getMaterialByStreamItemId = async (streamItemId: string): Promise<(MaterialData & { isArchived?: boolean }) | null> => {
  if (USE_JSON_DB) {
    return jsonMaterialService.getMaterialByStreamItemIdJSON(streamItemId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localMaterialService.getMaterialByStreamItemIdLocal(streamItemId);
  }

  try {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        stream_item:stream_items(
          is_archived,
          attachments(*)
        ),
        material_students(student_id)
      `)
      .eq('stream_item_id', streamItemId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      streamItemId: data.stream_item_id,
      description: data.description || undefined,
      assignToAll: data.assign_to_all,
      assignedGroups: data.assigned_groups || [],
      selectedStudents: (data.material_students || []).map((ms: any) => ms.student_id),
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
    console.error('Error loading material:', error);
    throw error;
  }
};

/**
 * Obtener todos los materials (para admin)
 */
export const getAllMaterials = async (): Promise<any[]> => {
  if (USE_JSON_DB) {
    return jsonMaterialService.getAllMaterialsJSON();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localMaterialService.getAllMaterialsLocal();
  }

  try {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        id,
        stream_item_id,
        description,
        assign_to_all,
        created_at,
        stream_item:stream_items!inner(
          id,
          class_id,
          title,
          content,
          is_archived,
          created_at,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            firstName:first_name,
            lastName:last_name
          )
        ),
        material_students(count)
      `)
      // Nota: Filtramos is_archived en el componente para asegurar que funcione
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((material: any) => ({
      id: material.id,
      streamItemId: material.stream_item_id,
      type: 'material',
      classId: material.stream_item?.class_id || '',
      className: material.stream_item?.class?.title || 'Sin clase',
      title: material.stream_item?.title || '',
      description: material.description || undefined,
      assignToAll: material.assign_to_all,
      isArchived: material.stream_item?.is_archived || false,
      createdAt: material.created_at,
      author: material.stream_item?.author ? {
        id: material.stream_item.author.id,
        name: `${material.stream_item.author.firstName || ''} ${material.stream_item.author.lastName || ''}`.trim() || 'Usuario',
      } : undefined,
      studentCount: material.material_students?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error('Error loading materials:', error);
    throw error;
  }
};

/**
 * Obtener materials por clase
 */
export const getMaterialsByClass = async (classId: string, includeArchived: boolean = false): Promise<any[]> => {
  if (USE_JSON_DB) {
    return jsonMaterialService.getMaterialsByClassJSON(classId, includeArchived);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localMaterialService.getMaterialsByClassLocal(classId, includeArchived);
  }

  try {
    let query = supabase
      .from('materials')
      .select(`
        id,
        stream_item_id,
        description,
        assign_to_all,
        created_at,
        stream_item:stream_items(
          id,
          class_id,
          title,
          content,
          is_archived,
          created_at,
          author:users(
            id,
            firstName:first_name,
            lastName:last_name
          )
        ),
        material_students(count)
           `)
      .eq('stream_item.class_id', classId);

    // Nota: Filtramos is_archived en el componente para asegurar que funcione

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((material: any) => ({
      id: material.id,
      streamItemId: material.stream_item_id,
      type: 'material',
      classId: material.stream_item?.class_id || '',
      title: material.stream_item?.title || '',
      description: material.description || undefined,
      assignToAll: material.assign_to_all,
      isArchived: material.stream_item?.is_archived || false,
      createdAt: material.created_at,
      author: material.stream_item?.author ? {
        id: material.stream_item.author.id,
        name: `${material.stream_item.author.firstName || ''} ${material.stream_item.author.lastName || ''}`.trim() || 'Usuario',
      } : undefined,
      studentCount: material.material_students?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error('Error loading materials by class:', error);
    throw error;
  }
};

/**
 * Obtener materials para un estudiante específico
 * Considera: assignToAll, material_students, y grupo_asignado del estudiante
 */
export const getMaterialsForStudent = async (
  studentId: string,
  studentGrupoAsignado?: string
): Promise<Array<{
  id: string;
  streamItemId: string;
  classId: string;
  className: string;
  title: string;
  description?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  isArchived: boolean;
}>> => {
  if (USE_JSON_DB) {
    return jsonMaterialService.getMaterialsForStudentJSON(studentId, studentGrupoAsignado);
  }
  if (USE_LOCAL_DB) {
    return localMaterialService.getMaterialsForStudentLocal(studentId, studentGrupoAsignado);
  }

  try {
    // Obtener materials asignados directamente al estudiante
    const { data: studentMaterials, error: studentError } = await supabase
      .from('materials')
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
        material_students!inner(student_id)
      `)
      .eq('stream_item.is_archived', false)
      .eq('material_students.student_id', studentId);

    if (studentError && studentError.code !== 'PGRST116') {
      throw studentError;
    }

    // Obtener materials con assignToAll = true
    const { data: allMaterials, error: allError } = await supabase
      .from('materials')
      .select(`
        *,
        stream_item:stream_items!materials_stream_item_id_fkey(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes!stream_items_class_id_fkey(
            id,
            title
          ),
          author:users!stream_items_author_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        )
      `)
      .eq('stream_item.is_archived', false)
      .eq('assign_to_all', true);

    if (allError) throw allError;

    // Si el estudiante tiene grupo_asignado, obtener materials asignados a ese grupo
    let groupMaterials: any[] = [];
    if (studentGrupoAsignado) {
      const { data: groupData, error: groupError } = await supabase
        .from('materials')
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
        .eq('stream_item.is_archived', false)
        .eq('assign_to_all', false)
        .contains('assigned_groups', [studentGrupoAsignado]);

      if (groupError) {
        console.error('Error loading group materials:', groupError);
      } else {
        groupMaterials = groupData || [];
      }
    }

    // Combinar y deduplicar materials
    const allMaterialsMap = new Map<string, any>();

    (studentMaterials || []).forEach((m: any) => {
      if (m.stream_item) {
        allMaterialsMap.set(m.id, {
          id: m.id,
          streamItemId: m.stream_item_id,
          classId: m.stream_item.class_id,
          className: m.stream_item.class?.title || 'Sin clase',
          title: m.stream_item.title,
          description: m.description,
          assignToAll: m.assign_to_all,
          assignedGroups: m.assigned_groups || [],
          author: {
            id: m.stream_item.author?.id || '',
            name: `${m.stream_item.author?.first_name || ''} ${m.stream_item.author?.last_name || ''}`.trim() || 'Usuario',
            avatar: m.stream_item.author?.avatar,
          },
          createdAt: m.stream_item.created_at,
          isArchived: m.stream_item.is_archived,
        });
      }
    });

    (allMaterials || []).forEach((m: any) => {
      if (m.stream_item && !allMaterialsMap.has(m.id)) {
        allMaterialsMap.set(m.id, {
          id: m.id,
          streamItemId: m.stream_item_id,
          classId: m.stream_item.class_id,
          className: m.stream_item.class?.title || 'Sin clase',
          title: m.stream_item.title,
          description: m.description,
          assignToAll: m.assign_to_all,
          assignedGroups: m.assigned_groups || [],
          author: {
            id: m.stream_item.author?.id || '',
            name: `${m.stream_item.author?.first_name || ''} ${m.stream_item.author?.last_name || ''}`.trim() || 'Usuario',
            avatar: m.stream_item.author?.avatar,
          },
          createdAt: m.stream_item.created_at,
          isArchived: m.stream_item.is_archived,
        });
      }
    });

    groupMaterials.forEach((m: any) => {
      if (m.stream_item && !allMaterialsMap.has(m.id)) {
        allMaterialsMap.set(m.id, {
          id: m.id,
          streamItemId: m.stream_item_id,
          classId: m.stream_item.class_id,
          className: m.stream_item.class?.title || 'Sin clase',
          title: m.stream_item.title,
          description: m.description,
          assignToAll: m.assign_to_all,
          assignedGroups: m.assigned_groups || [],
          author: {
            id: m.stream_item.author?.id || '',
            name: `${m.stream_item.author?.first_name || ''} ${m.stream_item.author?.last_name || ''}`.trim() || 'Usuario',
            avatar: m.stream_item.author?.avatar,
          },
          createdAt: m.stream_item.created_at,
          isArchived: m.stream_item.is_archived,
        });
      }
    });

    return Array.from(allMaterialsMap.values());
  } catch (error) {
    console.error('Error loading materials for student:', error);
    throw error;
  }
};

