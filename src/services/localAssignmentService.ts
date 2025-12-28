/**
 * Servicio local para interactuar con assignments en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalAssignment, LocalAssignmentStudent, LocalClass } from '../db/localDB';
import { AssignmentData } from './assignmentService';
import { localUserService } from './localUserService';

/**
 * Crear o actualizar un assignment
 */
export const saveAssignmentLocal = async (data: AssignmentData): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Buscar assignment existente
    const existing = await localDB.assignments
      .where('streamItemId')
      .equals(data.streamItemId)
      .first();

    let assignmentId: string;

    if (existing) {
      // Actualizar
      assignmentId = existing.id;
      await localDB.assignments.put({
        ...existing,
        points: data.points,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        instructions: data.instructions,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        updatedAt: now,
      });

      // Eliminar asignaciones existentes
      await localDB.assignmentStudents
        .where('assignmentId')
        .equals(assignmentId)
        .delete();
    } else {
      // Crear nuevo
      assignmentId = crypto.randomUUID();
      await localDB.assignments.add({
        id: assignmentId,
        streamItemId: data.streamItemId,
        points: data.points,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        instructions: data.instructions,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        isDeleted: false,
        isVisible: true,
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
        const assignments = studentIds.map(studentId => ({
          id: crypto.randomUUID(),
          assignmentId,
          studentId,
        }));

        await localDB.assignmentStudents.bulkAdd(assignments);
      }
    }
  } catch (error) {
    console.error('Error saving assignment to local DB:', error);
    throw error;
  }
};

/**
 * Obtener assignment por stream item ID
 */
export const getAssignmentByStreamItemIdLocal = async (
  streamItemId: string
): Promise<(AssignmentData & { title?: string; isArchived?: boolean; attachments?: any[] }) | null> => {
  try {
    const assignment = await localDB.assignments
      .where('streamItemId')
      .equals(streamItemId)
      .first();

    if (!assignment) return null;

    // Obtener stream item para el título
    const streamItem = await localDB.streamItems.get(streamItemId);

    // Obtener attachments
    const attachments = await localDB.attachments
      .where('streamItemId')
      .equals(streamItemId)
      .toArray();

    // Obtener estudiantes asignados
    const assignmentStudents = await localDB.assignmentStudents
      .where('assignmentId')
      .equals(assignment.id)
      .toArray();

    return {
      streamItemId: assignment.streamItemId,
      title: streamItem?.title,
      points: assignment.points,
      dueDate: assignment.dueDate,
      dueTime: assignment.dueTime,
      instructions: assignment.instructions,
      assignToAll: assignment.assignToAll,
      assignedGroups: assignment.assignedGroups || [],
      selectedStudents: assignmentStudents.map(as => as.studentId),
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
    console.error('Error getting assignment from local DB:', error);
    return null;
  }
};

/**
 * Obtener todos los assignments (para admins)
 */
export const getAllAssignmentsLocal = async (): Promise<any[]> => {
  try {
    // Obtener todos los assignments y filtrar por isDeleted en memoria
    const allAssignments = await localDB.assignments.toArray();
    const assignments = allAssignments.filter(a => !a.isDeleted);

    const result = await Promise.all(
      assignments.map(async (assignment) => {
        const streamItem = await localDB.streamItems.get(assignment.streamItemId);
        if (!streamItem || streamItem.isArchived) return null;

        const author = await localUserService.getUserById(streamItem.authorId);
        const className = await getClassNameLocal(streamItem.classId || '');
        const assignmentStudents = await localDB.assignmentStudents
          .where('assignmentId')
          .equals(assignment.id)
          .toArray();

        return {
          id: assignment.id,
          streamItemId: assignment.streamItemId,
          classId: streamItem.classId,
          className: className || 'Sin clase',
          type: 'assignment', // Asegurar que el tipo esté incluido
          title: streamItem.title,
          instructions: assignment.instructions,
          points: assignment.points,
          dueDate: assignment.dueDate,
          dueTime: assignment.dueTime,
          assignToAll: assignment.assignToAll,
          assignedGroups: assignment.assignedGroups || [],
          author: {
            id: author?.id || '',
            name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
            avatar: author?.avatar,
          },
          createdAt: streamItem.createdAt,
          studentCount: assignmentStudents.length,
          pendingReviewCount: 0,
          isArchived: streamItem.isArchived || false,
        };
      })
    );

    return result.filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting all assignments from local DB:', error);
    return [];
  }
};

/**
 * Obtener assignments por clase
 */
export const getAssignmentsByClassLocal = async (
  classId: string,
  isAdmin: boolean = false
): Promise<any[]> => {
  try {
    console.log('🔍 getAssignmentsByClassLocal - classId:', classId, 'isAdmin:', isAdmin);

    // Obtener stream items de la clase
    // Primero obtener todos los stream items de tipo assignment
    const allStreamItems = await localDB.streamItems
      .where('type')
      .equals('assignment')
      .toArray();

    console.log('📋 All assignment stream items:', allStreamItems.length);
    console.log('📋 Stream items classIds:', allStreamItems.map(si => ({ id: si.id, classId: si.classId, title: si.title })));

    // Filtrar por classId (SIEMPRE, incluso si es admin cuando se llama desde una clase específica)
    let streamItems = allStreamItems.filter(si => si.classId === classId);

    console.log('✅ Filtered by classId:', streamItems.length, 'items for classId:', classId);
    console.log('✅ Filtered items:', streamItems.map(si => ({ id: si.id, classId: si.classId, title: si.title })));

    // Filtrar archivados
    streamItems = streamItems.filter(si => !si.isArchived);
    console.log('✅ After filtering archived:', streamItems.length, 'items');

    // Obtener IDs de stream items
    const streamItemIds = streamItems.map(si => si.id);

    // CONSULTA BULK 1: Obtener todos los assignments asociados de una vez
    // y filtrar los que NO están marcados como deleted
    const assignments = await localDB.assignments
      .where('streamItemId')
      .anyOf(streamItemIds)
      .filter(a => !a.isDeleted && (a.isVisible !== false))
      .toArray();

    // Mapa para acceso rápido: streamItemId -> assignment
    const assignmentMap = new Map(assignments.map(a => [a.streamItemId, a]));

    // Filtrar streamItems que tienen un assignment válido (no borrado)
    const validStreamItems = streamItems.filter(si => assignmentMap.has(si.id));

    // CONSULTA BULK 2: Obtener autores
    const authorIds = [...new Set(validStreamItems.map(si => si.authorId))];
    const authors = await localDB.users.where('id').anyOf(authorIds).toArray();
    const authorMap = new Map(authors.map(u => [u.id, u]));

    // CONSULTA BULK 3: Obtener conteo de estudiantes
    // Nota: Dexie no soporta 'count group by', así que traemos todos los assignmentStudents
    // para los assignments válidos. Si son muchos, esto podría optimizarse después.
    const assignmentIds = assignments.map(a => a.id);
    const allAssignmentStudents = await localDB.assignmentStudents
      .where('assignmentId')
      .anyOf(assignmentIds)
      .toArray();

    // Agrupar conteos en memoria
    const studentCountMap = new Map<string, number>();
    allAssignmentStudents.forEach(as => {
      studentCountMap.set(as.assignmentId, (studentCountMap.get(as.assignmentId) || 0) + 1);
    });

    const result = validStreamItems.map(streamItem => {
      const assignment = assignmentMap.get(streamItem.id)!; // Seguro porque filtramos antes
      const author = authorMap.get(streamItem.authorId);
      const studentCount = studentCountMap.get(assignment.id) || 0;

      return {
        id: assignment.id,
        streamItemId: assignment.streamItemId,
        classId: streamItem.classId,
        type: 'assignment',
        title: streamItem.title,
        instructions: assignment.instructions,
        points: assignment.points,
        dueDate: assignment.dueDate,
        dueTime: assignment.dueTime,
        assignToAll: assignment.assignToAll,
        assignedGroups: assignment.assignedGroups || [],
        author: {
          id: author?.id || '',
          name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
          avatar: author?.avatar,
        },
        createdAt: streamItem.createdAt,
        studentCount: studentCount,
        pendingReviewCount: 0,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting assignments by class from local DB:', error);
    return [];
  }
};

/**
 * Eliminar un assignment (soft delete)
 */
export const deleteAssignmentLocal = async (assignmentId: string): Promise<void> => {
  try {
    const existing = await localDB.assignments.get(assignmentId);
    if (!existing) {
      throw new Error('Assignment no encontrado');
    }

    await localDB.assignments.put({
      ...existing,
      isDeleted: true,
      isVisible: false,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // También marcar el streamItem como borrado/oculto o eliminarlo
    // Dado que no hay isDeleted en streamItem explícitamente en la interfaz visible, 
    // y para asegurar consistencia, podemos eliminarlo si es la intención "borrar"
    // O mejor, para consistencia con "papelera", simplemente asegurarnos de que no aparezca.
    // Pero el bug reportado es que SIGUE APARECIENDO.
    // La forma más robusta es eliminar el streamItem de la lista "visible".

    // OPCIÓN: Eliminar el streamItem físicamente (hard delete del puntero) 
    // ya que el assignment tiene el soft delete y los datos reales.
    // Esto asegura que getAssignmentsByClassLocal (que itera streamItems) NO lo encuentre.
    // StreamItem is preserved but hidden via isVisible/isDeleted flags
    // await localDB.streamItems.delete(existing.streamItemId);
  } catch (error) {
    console.error('Error deleting assignment from local DB:', error);
    throw error;
  }
};

/**
 * Archivar un assignment
 */
export const archiveAssignmentLocal = async (streamItemId: string): Promise<void> => {
  try {
    const streamItem = await localDB.streamItems.get(streamItemId);
    if (!streamItem) {
      throw new Error('Stream item no encontrado');
    }

    await localDB.streamItems.put({
      ...streamItem,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error archiving assignment from local DB:', error);
    throw error;
  }
};

/**
 * Desarchivar un assignment
 */
export const unarchiveAssignmentLocal = async (streamItemId: string, className?: string): Promise<void> => {
  try {
    const streamItem = await localDB.streamItems.get(streamItemId);
    if (!streamItem) {
      throw new Error('Stream item no encontrado');
    }

    // Verificar si la clase existe y está archivada
    if (streamItem.classId) {
      const cls = await localDB.classes.get(streamItem.classId);
      if (cls) {
        if (cls.isArchived) {
          console.log('⚠️ La clase asociada está archivada. Restaurando clase...');
          // Restaurar la clase automáticamente
          await localDB.classes.put({
            ...cls,
            isArchived: false,
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // La clase no existe, crear una clase por defecto
        console.log('⚠️ La clase asociada no existe. Creando clase por defecto...');
        console.log('📝 className recibido:', className);
        console.log('📝 streamItem.className guardado:', streamItem.className);

        const now = new Date().toISOString();
        // Priorizar: 1) className pasado como parámetro, 2) className guardado en streamItem, 3) nombre por defecto
        let classTitle = 'Clase Restaurada';
        if (className && className !== 'Sin clase' && className.trim() !== '') {
          classTitle = className.trim();
        } else if (streamItem.className && streamItem.className.trim() !== '') {
          classTitle = streamItem.className.trim();
          console.log('✅ Usando className guardado en streamItem:', classTitle);
        }
        console.log('📝 classTitle final:', classTitle);
        const defaultClass: LocalClass = {
          id: streamItem.classId, // Usar el mismo ID que tenía originalmente
          title: classTitle, // Usar el nombre original de la clase si está disponible
          description: 'Clase creada automáticamente al restaurar un assignment',
          classCode: `CLASS-${Date.now()}`,
          teacherId: streamItem.authorId, // Usar el autor del assignment como profesor
          isArchived: false,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        // Usar put() en lugar de add() para evitar errores si la clase ya existe
        await localDB.classes.put(defaultClass);
        console.log('✅ Clase por defecto creada:', defaultClass.id, 'con nombre:', classTitle);
      }
    }

    await localDB.streamItems.put({
      ...streamItem,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unarchiving assignment from local DB:', error);
    throw error;
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

/**
 * Obtener assignment por ID
 */
export const getAssignmentByIdLocal = async (assignmentId: string): Promise<any> => {
  try {
    const assignment = await localDB.assignments.get(assignmentId);
    if (!assignment) return null;

    const streamItem = await localDB.streamItems.get(assignment.streamItemId);
    if (!streamItem) return null;

    const author = await localUserService.getUserById(streamItem.authorId);
    const assignmentStudents = await localDB.assignmentStudents
      .where('assignmentId')
      .equals(assignmentId)
      .toArray();

    return {
      id: assignment.id,
      streamItemId: assignment.streamItemId,
      title: streamItem.title,
      instructions: assignment.instructions,
      points: assignment.points,
      dueDate: assignment.dueDate,
      dueTime: assignment.dueTime,
      assignToAll: assignment.assignToAll,
      assignedGroups: assignment.assignedGroups || [],
      selectedStudents: assignmentStudents.map(as => as.studentId),
      author: {
        id: author?.id || '',
        name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
        avatar: author?.avatar,
      },
      createdAt: streamItem.createdAt,
    };
  } catch (error) {
    console.error('Error getting assignment by ID from local DB:', error);
    return null;
  }
};

/**
 * Obtener assignments archivados
 */
export const getArchivedAssignmentsLocal = async (): Promise<Array<{
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
  try {
    console.log('🔍 getArchivedAssignmentsLocal - buscando assignments archivados');

    // Obtener todos los stream items de tipo assignment
    const allStreamItems = await localDB.streamItems
      .where('type')
      .equals('assignment')
      .toArray();

    console.log('📋 Todos los stream items de tipo assignment:', allStreamItems.length);
    console.log('📋 Estados isArchived:', allStreamItems.map(si => ({ id: si.id, title: si.title, isArchived: si.isArchived })));

    // Filtrar por isArchived === true
    const archivedStreamItems = allStreamItems.filter(si => si.isArchived === true);
    console.log('✅ Stream items archivados encontrados:', archivedStreamItems.length);

    // Obtener detalles de cada assignment
    const result = await Promise.all(
      archivedStreamItems.map(async (streamItem) => {
        const assignment = await localDB.assignments
          .where('streamItemId')
          .equals(streamItem.id)
          .first();

        if (!assignment || assignment.isDeleted) return null;

        const author = await localUserService.getUserById(streamItem.authorId);
        // Priorizar className guardado en streamItem, luego buscar por classId
        const className = streamItem.className || await getClassNameLocal(streamItem.classId || '');
        const assignmentStudents = await localDB.assignmentStudents
          .where('assignmentId')
          .equals(assignment.id)
          .toArray();

        return {
          id: assignment.id,
          streamItemId: assignment.streamItemId,
          classId: streamItem.classId || '',
          className: className || 'Sin clase',
          title: streamItem.title || '',
          instructions: assignment.instructions,
          points: assignment.points,
          dueDate: assignment.dueDate,
          dueTime: assignment.dueTime,
          assignToAll: assignment.assignToAll,
          assignedGroups: assignment.assignedGroups || [],
          author: {
            id: author?.id || '',
            name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
            avatar: author?.avatar,
          },
          createdAt: streamItem.createdAt,
          studentCount: assignmentStudents.length,
          pendingReviewCount: 0,
          isArchived: streamItem.isArchived || false,
        };
      })
    );

    const filtered = result.filter((item): item is NonNullable<typeof item> => item !== null);
    console.log('✅ Assignments archivados finales:', filtered.length);
    return filtered.sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting archived assignments from local DB:', error);
    return [];
  }
};

/**
 * Obtener assignments para un estudiante específico
 * Considera: assignToAll, assignment_students, y grupoAsignado del estudiante
 */
export const getAssignmentsForStudentLocal = async (
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
  pendingReviewCount?: number;
}>> => {
  try {
    console.log('🔍 getAssignmentsForStudentLocal - studentId:', studentId, 'grupoAsignado:', studentGrupoAsignado);

    // Obtener todos los assignments que no están eliminados ni archivados
    const allAssignments = await localDB.assignments
      .filter(a => !a.isDeleted)
      .toArray();

    console.log('📋 Todos los assignments:', allAssignments.length);

    // Obtener los stream items asociados
    const streamItemIds = allAssignments.map(a => a.streamItemId);
    const streamItems = await localDB.streamItems
      .where('id')
      .anyOf(streamItemIds)
      .and(si => si.type === 'assignment' && !si.isArchived)
      .toArray();

    console.log('📋 Stream items no archivados:', streamItems.length);

    // Obtener las clases donde el estudiante es miembro
    const classMembers = await localDB.classMembers
      .where('userId')
      .equals(studentId)
      .toArray();
    const studentClassIds = new Set(classMembers.map(cm => cm.classId));
    console.log('📋 Clases donde el estudiante es miembro:', studentClassIds.size);

    // Obtener assignments asignados directamente al estudiante
    const assignmentStudents = await localDB.assignmentStudents
      .where('studentId')
      .equals(studentId)
      .toArray();

    const studentAssignmentIds = new Set(assignmentStudents.map(as => as.assignmentId));
    console.log('📋 Assignments asignados directamente al estudiante:', studentAssignmentIds.size);

    // Obtener assignments con assignToAll = true
    const allAssignmentsForAll = allAssignments.filter(a => a.assignToAll);
    console.log('📋 Assignments para todos:', allAssignmentsForAll.length);

    // Si el estudiante tiene grupoAsignado, obtener assignments asignados a ese grupo
    let groupAssignments: typeof allAssignments = [];
    if (studentGrupoAsignado) {
      groupAssignments = allAssignments.filter(a =>
        !a.assignToAll &&
        a.assignedGroups &&
        a.assignedGroups.includes(studentGrupoAsignado)
      );
      console.log('📋 Assignments asignados al grupo', studentGrupoAsignado + ':', groupAssignments.length);
    }

    // Combinar y deduplicar assignments, pero solo de clases donde el estudiante es miembro
    const assignmentMap = new Map<string, any>();

    // Agregar assignments asignados directamente al estudiante (solo si es miembro de la clase)
    allAssignments
      .filter(a => {
        const streamItem = streamItems.find(si => si.id === a.streamItemId);
        return streamItem && studentClassIds.has(streamItem.classId || '') && studentAssignmentIds.has(a.id);
      })
      .forEach(assignment => {
        assignmentMap.set(assignment.id, assignment);
      });

    // Agregar assignments para todos (solo si es miembro de la clase)
    allAssignmentsForAll
      .filter(a => {
        const streamItem = streamItems.find(si => si.id === a.streamItemId);
        return streamItem && studentClassIds.has(streamItem.classId || '');
      })
      .forEach(assignment => {
        assignmentMap.set(assignment.id, assignment);
      });

    // Agregar assignments del grupo del estudiante (solo si es miembro de la clase)
    groupAssignments
      .filter(a => {
        const streamItem = streamItems.find(si => si.id === a.streamItemId);
        return streamItem && studentClassIds.has(streamItem.classId || '');
      })
      .forEach(assignment => {
        assignmentMap.set(assignment.id, assignment);
      });

    console.log('✅ Total assignments únicos para el estudiante:', assignmentMap.size);

    // Obtener IDs únicos para consultas bulk
    const assignmentsList = Array.from(assignmentMap.values());
    const streamItemsList = assignmentsList.map(a => streamItems.find(si => si.id === a.streamItemId)).filter((si): si is NonNullable<typeof si> => !!si);

    const authorIds = [...new Set(streamItemsList.map(si => si.authorId))];
    const classIds = [...new Set(streamItemsList.map(si => si.classId).filter((id): id is string => !!id))];

    // Consultas bulk
    const authors = await localDB.users.where('id').anyOf(authorIds).toArray();
    const classes = await localDB.classes.where('id').anyOf(classIds).toArray();

    const authorMap = new Map(authors.map(u => [u.id, u]));
    const classMap = new Map(classes.map(c => [c.id, c]));

    // Convertir a array y mapear con detalles de memoria
    const result = assignmentsList.map((assignment) => {
      const streamItem = streamItems.find(si => si.id === assignment.streamItemId);
      if (!streamItem) return null;

      const author = authorMap.get(streamItem.authorId);
      const classObj = streamItem.classId ? classMap.get(streamItem.classId) : undefined;
      const className = streamItem.className || (classObj ? classObj.title : 'Sin clase');

      return {
        id: assignment.id,
        streamItemId: assignment.streamItemId,
        classId: streamItem.classId || '',
        className: className,
        title: streamItem.title || '',
        instructions: assignment.instructions,
        points: assignment.points,
        dueDate: assignment.dueDate,
        dueTime: assignment.dueTime,
        assignToAll: assignment.assignToAll,
        assignedGroups: assignment.assignedGroups || [],
        author: {
          id: author?.id || '',
          name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
          avatar: author?.avatar,
        },
        createdAt: streamItem.createdAt,
        isArchived: streamItem.isArchived || false,
        pendingReviewCount: 0,
      };
    });

    const filtered = result.filter((item): item is NonNullable<typeof item> => item !== null);
    console.log('✅ Assignments finales para el estudiante:', filtered.length);
    return filtered.sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting assignments for student from local DB:', error);
    throw error;
  }
};

