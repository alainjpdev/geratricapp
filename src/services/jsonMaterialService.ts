/**
 * Servicio para interactuar con materials usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { MaterialData } from './materialService';
import type { LocalMaterial, LocalMaterialStudent } from '../db/localDB';
import { jsonUserService } from './jsonUserService';

/**
 * Guardar un material
 */
export const saveMaterialJSON = async (data: MaterialData): Promise<void> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();

    // Buscar material existente
    const existing = jsonDB.getMaterialByStreamItemId(data.streamItemId);

    let materialId: string;

    if (existing) {
      // Actualizar
      materialId = existing.id;
      jsonDB.putMaterial({
        ...existing,
        description: data.description,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        updatedAt: now,
      });

      // Eliminar estudiantes existentes
      const existingStudents = jsonDB.getMaterialStudents().filter(ms => ms.materialId === materialId);
      existingStudents.forEach(ms => jsonDB.deleteMaterialStudent(ms.id));
    } else {
      // Crear nuevo
      materialId = crypto.randomUUID();
      jsonDB.putMaterial({
        id: materialId,
        streamItemId: data.streamItemId,
        description: data.description,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Asignar estudiantes
    if (!data.assignToAll) {
      let studentIds: string[] = [];

      // Si hay grupos asignados
      if (data.assignedGroups && data.assignedGroups.length > 0) {
        for (const group of data.assignedGroups) {
          const students = jsonUserService.getStudentsByGroup(group);
          studentIds.push(...students.map(s => s.id));
        }
      }

      // Si hay estudiantes seleccionados individualmente
      if (data.selectedStudents && data.selectedStudents.length > 0) {
        studentIds.push(...data.selectedStudents);
      }

      // Eliminar duplicados
      studentIds = [...new Set(studentIds)];

      // Crear asignaciones
      if (studentIds.length > 0) {
        studentIds.forEach(studentId => {
          jsonDB.putMaterialStudent({
            id: crypto.randomUUID(),
            materialId,
            studentId,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error saving material to JSON:', error);
    throw error;
  }
};

/**
 * Obtener material por stream item ID
 */
export const getMaterialByStreamItemIdJSON = async (
  streamItemId: string
): Promise<(MaterialData & { isArchived?: boolean }) | null> => {
  try {
    await jsonDB.initialize();
    const material = jsonDB.getMaterialByStreamItemId(streamItemId);
    if (!material) return null;

    const streamItem = jsonDB.getStreamItemById(streamItemId);
    const materialStudents = jsonDB.getMaterialStudents().filter(ms => ms.materialId === material.id);

    // Cargar attachments del stream item
    const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === streamItemId);

    return {
      streamItemId: material.streamItemId,
      description: material.description,
      assignToAll: material.assignToAll,
      assignedGroups: material.assignedGroups || [],
      selectedStudents: materialStudents.map(ms => ms.studentId),
      isArchived: streamItem?.isArchived || false,
      attachments: attachments.map(att => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url,
        filePath: att.filePath,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
      })),
    };
  } catch (error) {
    console.error('Error getting material from JSON:', error);
    return null;
  }
};

/**
 * Obtener todos los materials
 */
export const getAllMaterialsJSON = async (): Promise<any[]> => {
  try {
    await jsonDB.initialize();
    const materials = jsonDB.getMaterials();

    const result = materials.map((material) => {
      const streamItem = jsonDB.getStreamItemById(material.streamItemId);
      if (!streamItem || streamItem.isArchived) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      const className = jsonDB.getClassById(streamItem.classId)?.title || streamItem.className || 'Sin clase';
      
      // Cargar attachments del stream item
      const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === streamItem.id);

      return {
        id: material.id,
        streamItemId: material.streamItemId,
        classId: streamItem.classId,
        className: className,
        type: 'material',
        title: streamItem.title,
        description: material.description,
        assignToAll: material.assignToAll,
        author: {
          id: author?.id || '',
          name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
          avatar: author?.avatar,
        },
        attachments: attachments.map(att => ({
          id: att.id,
          type: att.type,
          name: att.name,
          url: att.url,
          filePath: att.filePath,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
        createdAt: streamItem.createdAt,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting all materials from JSON:', error);
    return [];
  }
};

/**
 * Obtener materials para un estudiante específico
 */
export const getMaterialsForStudentJSON = async (
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
  try {
    await jsonDB.initialize();
    const allMaterials = await getAllMaterialsJSON();
    const studentMaterials: any[] = [];

    for (const material of allMaterials) {
      if (material.isArchived) continue;

      // Si está asignado a todos, incluirlo
      if (material.assignToAll) {
        studentMaterials.push(material);
        continue;
      }

      // Verificar si el estudiante está asignado directamente
      const materialStudents = jsonDB.getMaterialStudents()
        .filter(ms => ms.materialId === material.id && ms.studentId === studentId);
      if (materialStudents.length > 0) {
        studentMaterials.push(material);
        continue;
      }

      // Verificar si el estudiante está en un grupo asignado
      if (studentGrupoAsignado && material.assignedGroups && material.assignedGroups.includes(studentGrupoAsignado)) {
        studentMaterials.push(material);
      }
    }

    return studentMaterials;
  } catch (error) {
    console.error('Error getting materials for student from JSON:', error);
    return [];
  }
};

/**
 * Obtener materials por clase
 */
export const getMaterialsByClassJSON = async (
  classId: string,
  includeArchived: boolean = false
): Promise<any[]> => {
  try {
    await jsonDB.initialize();
    
    // Obtener todos los stream items de tipo material
    let streamItems = jsonDB.getStreamItems()
      .filter(si => si.classId === classId && si.type === 'material');

    if (!includeArchived) {
      streamItems = streamItems.filter(si => !si.isArchived);
    }

    const result = streamItems.map((streamItem) => {
      const material = jsonDB.getMaterialByStreamItemId(streamItem.id);
      if (!material) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === streamItem.id);

      return {
        id: material.id,
        streamItemId: material.streamItemId,
        classId: streamItem.classId,
        type: 'material',
        title: streamItem.title,
        description: material.description,
        assignToAll: material.assignToAll,
        assignedGroups: material.assignedGroups || [],
        author: {
          id: author?.id || '',
          name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
          avatar: author?.avatar,
        },
        attachments: attachments.map(att => ({
          id: att.id,
          type: att.type,
          name: att.name,
          url: att.url,
          filePath: att.filePath,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
        createdAt: streamItem.createdAt,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting materials by class from JSON:', error);
    return [];
  }
};







