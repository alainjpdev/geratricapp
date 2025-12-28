/**
 * Servicio para interactuar con assignments usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { AssignmentData } from './assignmentService';
import type { LocalAssignment, LocalAssignmentStudent } from '../db/localDB';
import { jsonUserService } from './jsonUserService';

/**
 * Crear o actualizar un assignment
 */
export const saveAssignmentJSON = async (data: AssignmentData): Promise<void> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();

    // Buscar assignment existente
    const existing = jsonDB.getAssignmentByStreamItemId(data.streamItemId);

    let assignmentId: string;

    if (existing) {
      // Actualizar
      assignmentId = existing.id;
      jsonDB.putAssignment({
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
      const existingStudents = jsonDB.getAssignmentStudents().filter(as => as.assignmentId === assignmentId);
      existingStudents.forEach(as => jsonDB.deleteAssignmentStudent(as.id));
    } else {
      // Crear nuevo
      assignmentId = crypto.randomUUID();
      jsonDB.putAssignment({
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

      if (data.assignedGroups && data.assignedGroups.length > 0) {
        for (const group of data.assignedGroups) {
          const students = jsonUserService.getStudentsByGroup(group);
          studentIds.push(...students.map(s => s.id));
        }
      }

      if (data.selectedStudents && data.selectedStudents.length > 0) {
        studentIds.push(...data.selectedStudents);
      }

      studentIds = [...new Set(studentIds)];

      if (studentIds.length > 0) {
        studentIds.forEach(studentId => {
          jsonDB.putAssignmentStudent({
            id: crypto.randomUUID(),
            assignmentId,
            studentId,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error saving assignment to JSON:', error);
    throw error;
  }
};

/**
 * Obtener assignment por streamItemId
 */
export const getAssignmentByStreamItemIdJSON = async (
  streamItemId: string
): Promise<(AssignmentData & { title?: string; isArchived?: boolean; attachments?: any[] }) | null> => {
  try {
    await jsonDB.initialize();
    const assignment = jsonDB.getAssignmentByStreamItemId(streamItemId);
    if (!assignment) return null;

    const streamItem = jsonDB.getStreamItemById(streamItemId);
    if (!streamItem) return null;

    const assignmentStudents = jsonDB.getAssignmentStudents().filter(as => as.assignmentId === assignment.id);
    const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === streamItemId);

    return {
      streamItemId: assignment.streamItemId,
      title: streamItem.title,
      points: assignment.points,
      dueDate: assignment.dueDate,
      dueTime: assignment.dueTime,
      instructions: assignment.instructions,
      assignToAll: assignment.assignToAll,
      assignedGroups: assignment.assignedGroups || [],
      selectedStudents: assignmentStudents.map(as => as.studentId),
      isArchived: streamItem.isArchived || false,
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
    console.error('Error getting assignment from JSON:', error);
    return null;
  }
};

/**
 * Obtener todos los assignments (para admins)
 */
export const getAllAssignmentsJSON = async (): Promise<Array<{
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
    await jsonDB.initialize();
    const assignments = jsonDB.getAssignments().filter(a => !a.isDeleted && (a.isVisible !== false));

    const result = assignments.map((assignment) => {
      const streamItem = jsonDB.getStreamItemById(assignment.streamItemId);
      if (!streamItem || streamItem.isArchived) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      const className = jsonDB.getClassById(streamItem.classId || '')?.title || streamItem.className || 'Sin clase';
      const assignmentStudents = jsonDB.getAssignmentStudents().filter(as => as.assignmentId === assignment.id);

      // Calcular pendientes de revisión
      const submissions = jsonDB.getAssignmentSubmissions().filter(s => s.assignmentId === assignment.id);
      const pendingReviewCount = submissions.filter(s =>
        s.status === 'submitted' || s.status === 'to_review'
      ).length;

      return {
        id: assignment.id,
        streamItemId: assignment.streamItemId,
        classId: streamItem.classId,
        className: className,
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
        studentCount: assignmentStudents.length,
        pendingReviewCount,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean) as any[];
  } catch (error) {
    console.error('Error getting all assignments from JSON:', error);
    return [];
  }
};

/**
 * Obtener assignments por clase
 */
export const getAssignmentsByClassJSON = async (
  classId: string,
  isAdmin: boolean = false
): Promise<Array<{
  id: string;
  streamItemId: string;
  classId: string;
  type: string;
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
  try {
    await jsonDB.initialize();

    // Obtener stream items de la clase
    const streamItems = jsonDB.getStreamItems()
      .filter(si => si.classId === classId && si.type === 'assignment' && !si.isArchived);

    const result = streamItems.map((streamItem) => {
      const assignment = jsonDB.getAssignmentByStreamItemId(streamItem.id);
      if (!assignment || assignment.isDeleted || (assignment.isVisible === false)) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      const assignmentStudents = jsonDB.getAssignmentStudents().filter(as => as.assignmentId === assignment.id);

      // Calcular pendientes de revisión
      const submissions = jsonDB.getAssignmentSubmissions().filter(s => s.assignmentId === assignment.id);
      const pendingReviewCount = submissions.filter(s =>
        s.status === 'submitted' || s.status === 'to_review'
      ).length;

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
        studentCount: assignmentStudents.length,
        pendingReviewCount,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean) as any[];
  } catch (error) {
    console.error('Error getting assignments by class from JSON:', error);
    return [];
  }
};

/**
 * Obtener assignments para un estudiante específico
 */
export const getAssignmentsForStudentJSON = async (
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
    await jsonDB.initialize();

    // Obtener todos los assignments que no están eliminados ni archivados
    // Obtener todos los assignments que no están eliminados ni archivados
    const allAssignments = jsonDB.getAssignments().filter(a => !a.isDeleted && (a.isVisible !== false));
    const streamItems = jsonDB.getStreamItems()
      .filter(si => si.type === 'assignment' && !si.isArchived);

    // Obtener assignments asignados directamente al estudiante
    const assignmentStudents = jsonDB.getAssignmentStudents().filter(as => as.studentId === studentId);
    const studentAssignmentIds = new Set(assignmentStudents.map(as => as.assignmentId));

    // Obtener las clases donde el estudiante es miembro
    const classMembers = jsonDB.getClassMembers().filter(cm => cm.userId === studentId);
    const studentClassIds = new Set(classMembers.map(cm => cm.classId));

    // Filtrar assignments relevantes
    const relevantAssignments = allAssignments.filter(assignment => {
      const streamItem = streamItems.find(si => si.id === assignment.streamItemId);
      if (!streamItem) return false;

      // Verificar que el estudiante sea miembro de la clase
      if (!studentClassIds.has(streamItem.classId || '')) return false;

      // Si está asignado a todos, incluirlo
      if (assignment.assignToAll) return true;

      // Si está asignado directamente al estudiante, incluirlo
      if (studentAssignmentIds.has(assignment.id)) return true;

      // Si el estudiante tiene grupoAsignado y el assignment está asignado a ese grupo
      if (studentGrupoAsignado && assignment.assignedGroups?.includes(studentGrupoAsignado)) {
        return true;
      }

      return false;
    });

    // Construir resultado
    const result = relevantAssignments.map((assignment) => {
      const streamItem = streamItems.find(si => si.id === assignment.streamItemId);
      if (!streamItem) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      const className = jsonDB.getClassById(streamItem.classId || '')?.title || streamItem.className || 'Sin clase';

      return {
        id: assignment.id,
        streamItemId: assignment.streamItemId,
        classId: streamItem.classId,
        className: className,
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
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean) as any[];
  } catch (error) {
    console.error('Error getting assignments for student from JSON:', error);
    return [];
  }
};

/**
 * Eliminar un assignment (soft delete)
 */
export const deleteAssignmentJSON = async (assignmentId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getAssignmentById(assignmentId);
    if (!existing) {
      throw new Error('Assignment no encontrado');
    }

    jsonDB.putAssignment({
      ...existing,
      isDeleted: true,
      isVisible: false,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting assignment from JSON:', error);
    throw error;
  }
};

/**
 * Archivar un assignment
 */
export const archiveAssignmentJSON = async (streamItemId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const streamItem = jsonDB.getStreamItemById(streamItemId);
    if (!streamItem) {
      throw new Error('Stream item no encontrado');
    }

    jsonDB.putStreamItem({
      ...streamItem,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error archiving assignment from JSON:', error);
    throw error;
  }
};

/**
 * Desarchivar un assignment
 */
export const unarchiveAssignmentJSON = async (streamItemId: string, className?: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const streamItem = jsonDB.getStreamItemById(streamItemId);
    if (!streamItem) {
      throw new Error('Stream item no encontrado');
    }

    // Verificar si la clase existe y está archivada
    if (streamItem.classId) {
      const cls = jsonDB.getClassById(streamItem.classId);
      if (cls) {
        if (cls.isArchived) {
          // Restaurar la clase automáticamente
          jsonDB.putClass({
            ...cls,
            isArchived: false,
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // La clase no existe, crear una clase por defecto
        const now = new Date().toISOString();
        const classTitle = className && className !== 'Sin clase' && className.trim() !== ''
          ? className.trim()
          : (streamItem.className || 'Clase Restaurada');

        const defaultClass = {
          id: streamItem.classId,
          title: classTitle,
          description: 'Clase creada automáticamente al restaurar un elemento',
          classCode: `CLASS-${Date.now()}`,
          teacherId: streamItem.authorId,
          isArchived: false,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        jsonDB.putClass(defaultClass);
      }
    }

    jsonDB.putStreamItem({
      ...streamItem,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unarchiving assignment from JSON:', error);
    throw error;
  }
};

/**
 * Obtener assignments archivados
 */
export const getArchivedAssignmentsJSON = async (): Promise<Array<{
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
    await jsonDB.initialize();

    // Obtener todos los stream items de tipo assignment archivados
    const archivedStreamItems = jsonDB.getStreamItems()
      .filter(si => si.type === 'assignment' && si.isArchived === true);

    const result = archivedStreamItems.map((streamItem) => {
      const assignment = jsonDB.getAssignmentByStreamItemId(streamItem.id);
      if (!assignment || assignment.isDeleted) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      // Fix potential null className
      const className = jsonDB.getClassById(streamItem.classId || '')?.title || streamItem.className || 'Sin clase';
      const assignmentStudents = jsonDB.getAssignmentStudents().filter(as => as.assignmentId === assignment.id);

      return {
        id: assignment.id,
        streamItemId: assignment.streamItemId,
        classId: streamItem.classId,
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
        studentCount: assignmentStudents.length,
      };
    });

    return result.filter(Boolean) as any[];
  } catch (error) {
    console.error('Error getting archived assignments from JSON:', error);
    return [];
  }
};

/**
 * Obtener assignment por ID
 */
export const getAssignmentByIdJSON = async (assignmentId: string): Promise<any> => {
  try {
    await jsonDB.initialize();
    const assignment = jsonDB.getAssignmentById(assignmentId);
    if (!assignment) return null;

    const streamItem = jsonDB.getStreamItemById(assignment.streamItemId);
    if (!streamItem) return null;

    const author = jsonUserService.getUserById(streamItem.authorId);
    const assignmentStudents = jsonDB.getAssignmentStudents().filter(as => as.assignmentId === assignmentId);

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
    console.error('Error getting assignment by ID from JSON:', error);
    return null;
  }
};

