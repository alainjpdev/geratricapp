/**
 * Servicio local para interactuar con materials en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalMaterial, LocalMaterialStudent } from '../db/localDB';
import { MaterialData } from './materialService';
import { localUserService } from './localUserService';

/**
 * Guardar un material
 */
export const saveMaterialLocal = async (data: MaterialData): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Buscar material existente
    const existing = await localDB.materials
      .where('streamItemId')
      .equals(data.streamItemId)
      .first();

    let materialId: string;

    if (existing) {
      // Actualizar
      materialId = existing.id;
      await localDB.materials.put({
        ...existing,
        description: data.description,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        updatedAt: now,
      });

      // Eliminar estudiantes existentes
      await localDB.materialStudents
        .where('materialId')
        .equals(materialId)
        .delete();
    } else {
      // Crear nuevo
      materialId = crypto.randomUUID();
      await localDB.materials.add({
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
          const students = await localUserService.getStudentsByGroup(group);
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
        const materialStudents = studentIds.map(studentId => ({
          id: crypto.randomUUID(),
          materialId,
          studentId,
        }));

        await localDB.materialStudents.bulkAdd(materialStudents);
      }
    }
  } catch (error) {
    console.error('Error saving material to local DB:', error);
    throw error;
  }
};

/**
 * Obtener material por stream item ID
 */
export const getMaterialByStreamItemIdLocal = async (
  streamItemId: string
): Promise<(MaterialData & { isArchived?: boolean }) | null> => {
  try {
    const material = await localDB.materials
      .where('streamItemId')
      .equals(streamItemId)
      .first();

    if (!material) return null;

    const streamItem = await localDB.streamItems.get(streamItemId);
    const materialStudents = await localDB.materialStudents
      .where('materialId')
      .equals(material.id)
      .toArray();

    // Cargar attachments del stream item
    const attachments = streamItem ? await localDB.attachments
      .where('streamItemId')
      .equals(streamItemId)
      .toArray() : [];

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
    console.error('Error getting material from local DB:', error);
    return null;
  }
};

/**
 * Obtener todos los materials
 */
export const getAllMaterialsLocal = async (): Promise<any[]> => {
  try {
    const materials = await localDB.materials.toArray();
    const result = await Promise.all(
      materials.map(async (material) => {
        const streamItem = await localDB.streamItems.get(material.streamItemId);
        if (!streamItem || streamItem.isArchived) return null;

        const author = await localUserService.getUserById(streamItem.authorId);
        const className = await getClassNameLocal(streamItem.classId);
        
        // Cargar attachments del stream item
        const attachments = await localDB.attachments
          .where('streamItemId')
          .equals(streamItem.id)
          .toArray();

        return {
          id: material.id,
          streamItemId: material.streamItemId,
          classId: streamItem.classId,
          className: className || 'Sin clase',
          type: 'material', // Asegurar que el tipo esté incluido
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
      })
    );

    return result.filter(Boolean).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting all materials from local DB:', error);
    return [];
  }
};

/**
 * Obtener materials para un estudiante específico (local)
 */
export const getMaterialsForStudentLocal = async (
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
    const allMaterials = await getAllMaterialsLocal();
    const studentMaterials: any[] = [];

    for (const material of allMaterials) {
      if (material.isArchived) continue;

      // Si está asignado a todos, incluirlo
      if (material.assignToAll) {
        studentMaterials.push(material);
        continue;
      }

      // Verificar si el estudiante está asignado directamente
      const materialStudent = await localDB.materialStudents
        .where('[materialId+studentId]')
        .equals([material.id, studentId])
        .first();

      if (materialStudent) {
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
    console.error('Error getting materials for student from local DB:', error);
    return [];
  }
};

/**
 * Obtener materials por clase
 */
export const getMaterialsByClassLocal = async (
  classId: string,
  includeArchived: boolean = false
): Promise<any[]> => {
  try {
    // Obtener todos los stream items de tipo material
    const allStreamItems = await localDB.streamItems
      .where('type')
      .equals('material')
      .toArray();
    
    // Filtrar por classId
    let streamItems = allStreamItems.filter(si => si.classId === classId);

    if (!includeArchived) {
      streamItems = streamItems.filter(si => !si.isArchived);
    }

    const result = await Promise.all(
      streamItems.map(async (streamItem) => {
        const material = await localDB.materials
          .where('streamItemId')
          .equals(streamItem.id)
          .first();

        if (!material) return null;

        const author = await localUserService.getUserById(streamItem.authorId);
        
        // Cargar attachments del stream item
        const attachments = await localDB.attachments
          .where('streamItemId')
          .equals(streamItem.id)
          .toArray();

        return {
          id: material.id,
          streamItemId: material.streamItemId,
          classId: streamItem.classId, // Asegurar que classId esté incluido
          type: 'material', // Asegurar que el tipo esté incluido
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
      })
    );

    return result.filter(Boolean).sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting materials by class from local DB:', error);
    return [];
  }
};

/**
 * Obtener nombre de clase
 */
const getClassNameLocal = async (classId: string): Promise<string | undefined> => {
  try {
    const cls = await localDB.classes.get(classId);
    return cls?.title;
  } catch {
    return undefined;
  }
};


