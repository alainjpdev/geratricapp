/**
 * Servicio para interactuar con clases usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { ClassData } from './classService';
import type { LocalClass, LocalClassMember } from '../db/localDB';

/**
 * Cargar todas las clases de un profesor (o todas si es admin)
 */
export const loadClassesJSON = async (teacherId: string, isAdmin: boolean = false): Promise<ClassData[]> => {
  try {
    await jsonDB.initialize();

    let classes = jsonDB.getClasses();

    if (!isAdmin) {
      classes = classes.filter(c => c.teacherId === teacherId);
    }

    // Filtrar clases archivadas
    const activeClasses = classes.filter(c => !c.isArchived);

    // Obtener información de profesores
    const classesWithDetails = activeClasses.map((c) => {
      const teacher = jsonDB.getUserById(c.teacherId);
      const module = c.moduleId ? { id: c.moduleId, title: '' } : undefined;

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        classCode: c.classCode,
        section: c.section,
        subject: c.subject,
        room: c.room,
        teacherId: c.teacherId,
        moduleId: c.moduleId,
        backgroundImage: c.backgroundImage,
        isArchived: c.isArchived,
        status: c.status,
        teacher: teacher ? {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
        } : undefined,
        module,
      } as ClassData & { teacher?: { id: string; firstName: string; lastName: string }; module?: { id: string; title: string } };
    });

    return classesWithDetails;
  } catch (error) {
    console.error('Error loading classes from JSON:', error);
    throw error;
  }
};

/**
 * Obtener clases de un estudiante (donde es miembro)
 */
export const getStudentClassesJSON = async (studentId: string): Promise<ClassData[]> => {
  try {
    await jsonDB.initialize();

    // Obtener todas las membresías del estudiante
    const memberships = jsonDB.getClassMembers().filter(m => m.userId === studentId);
    console.log(`🔍 Buscando clases para estudiante ${studentId}. Membresías encontradas: ${memberships.length}`);

    // Obtener los IDs de las clases
    const classIds = memberships.map(m => m.classId);

    // Obtener las clases
    const classes = classIds
      .map(classId => jsonDB.getClassById(classId))
      .filter(c => c && !c.isArchived) as LocalClass[];

    // Obtener información de profesores y módulos
    const classesWithDetails = classes.map((c) => {
      const teacher = jsonDB.getUserById(c.teacherId);
      const module = c.moduleId ? { id: c.moduleId, title: '' } : undefined;

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        classCode: c.classCode,
        section: c.section,
        subject: c.subject,
        room: c.room,
        teacherId: c.teacherId,
        moduleId: c.moduleId,
        backgroundImage: c.backgroundImage,
        isArchived: c.isArchived,
        status: c.status,
        teacher: teacher ? {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
        } : undefined,
        module,
      } as ClassData & { teacher?: { id: string; firstName: string; lastName: string }; module?: { id: string; title: string } };
    });

    return classesWithDetails;
  } catch (error) {
    console.error('Error loading student classes from JSON:', error);
    throw error;
  }
};

/**
 * Obtener todos los estudiantes de una clase
 */
export const getStudentsByClassJSON = async (classId: string): Promise<{ id: string; firstName: string; lastName: string; email: string; avatar?: string }[]> => {
  try {
    await jsonDB.initialize();

    // Obtener miembros de la clase que son estudiantes
    const members = jsonDB.getClassMembers().filter(m => m.classId === classId && m.role === 'student');

    // Obtener detalles de los usuarios
    const students = members.map(m => {
      const user = jsonDB.getUserById(m.userId);
      if (!user) return null;
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar
      };
    }).filter(s => s !== null) as { id: string; firstName: string; lastName: string; email: string; avatar?: string }[];

    return students;
  } catch (error) {
    console.error('Error loading class students from JSON:', error);
    return [];
  }
};

/**
 * Crear una nueva clase
 */
export const createClassJSON = async (classData: ClassData): Promise<ClassData> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();
    const classCode = classData.classCode || `CLASS-${Date.now()}`;

    // Check for duplicate class (same title and teacher)
    const existingClass = jsonDB.getClasses().find(c =>
      c.title.trim().toLowerCase() === classData.title.trim().toLowerCase() &&
      c.teacherId === classData.teacherId &&
      !c.isArchived // Only check active classes? Or all? User said "si ya esta creada se crea sobre la creada". 
      // If archived, maybe we should restore it? 
      // Upsert usually implies updating the record regardless of status, or maybe filtering active.
      // If I update an archived class, it stays archived? Or becomes active?
      // "se crea sobre la creada" -> Updates it.
    );

    if (existingClass) {
      console.log('⚠️ Clase ya existe, actualizando en lugar de crear duplicado:', existingClass.title);
      return updateClassJSON(existingClass.id, {
        ...classData,
        // If we want to restore it if it was archived:
        isArchived: false,
        status: 'active'
      });
    }

    const newClass: LocalClass = {
      id: classData.id || crypto.randomUUID(),
      title: classData.title,
      description: classData.description,
      classCode: classCode,
      section: classData.section,
      subject: classData.subject,
      room: classData.room,
      teacherId: classData.teacherId,
      moduleId: classData.moduleId,
      backgroundImage: classData.backgroundImage,
      isArchived: false,
      status: classData.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    jsonDB.putClass(newClass);

    return {
      id: newClass.id,
      title: newClass.title,
      description: newClass.description,
      classCode: newClass.classCode,
      section: newClass.section,
      subject: newClass.subject,
      room: newClass.room,
      teacherId: newClass.teacherId,
      moduleId: newClass.moduleId,
      backgroundImage: newClass.backgroundImage,
      isArchived: newClass.isArchived,
      status: newClass.status,
    };
  } catch (error) {
    console.error('Error creating class in JSON:', error);
    throw error;
  }
};

/**
 * Actualizar una clase
 */
export const updateClassJSON = async (classId: string, classData: Partial<ClassData>): Promise<ClassData> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getClassById(classId);
    if (!existing) {
      throw new Error('Clase no encontrada');
    }

    const updated: LocalClass = {
      ...existing,
      ...classData,
      updatedAt: new Date().toISOString(),
    };

    jsonDB.putClass(updated);

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      classCode: updated.classCode,
      section: updated.section,
      subject: updated.subject,
      room: updated.room,
      teacherId: updated.teacherId,
      moduleId: updated.moduleId,
      backgroundImage: updated.backgroundImage,
      isArchived: updated.isArchived,
      status: updated.status,
    };
  } catch (error) {
    console.error('Error updating class in JSON:', error);
    throw error;
  }
};

/**
 * Archivar una clase
 */
export const archiveClassJSON = async (classId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getClassById(classId);
    if (!existing) {
      throw new Error('Clase no encontrada');
    }

    jsonDB.putClass({
      ...existing,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error archiving class in JSON:', error);
    throw error;
  }
};

/**
 * Desarchivar una clase
 */
export const unarchiveClassJSON = async (classId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getClassById(classId);
    if (!existing) {
      throw new Error('Clase no encontrada');
    }

    jsonDB.putClass({
      ...existing,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unarchiving class in JSON:', error);
    throw error;
  }
};

/**
 * Eliminar una clase permanentemente
 * NOTA: Los streamItems y assignments NO se borran, solo se desvinculan de la clase
 */
export const deleteClassJSON = async (classId: string): Promise<void> => {
  try {
    await jsonDB.initialize();

    // Desvincular todos los streamItems de esta clase de forma optimizada
    jsonDB.unlinkStreamItemsFromClass(classId);

    // Eliminar la clase permanentemente
    jsonDB.deleteClass(classId);

    // Nota: Los miembros de la clase quedarían huérfanos en memoria, 
    // pero idealmente deberíamos tener un método deleteClassMembers(classId) en jsonDB también.
    // Por ahora, esto soluciona el problema principal de que la clase "no se borra".

  } catch (error) {
    console.error('Error deleting class from JSON:', error);
    throw error;
  }
};

/**
 * Cargar una clase por ID
 */
export const loadClassJSON = async (classId: string): Promise<ClassData | null> => {
  try {
    await jsonDB.initialize();
    const cls = jsonDB.getClassById(classId);
    if (!cls) return null;

    const teacher = jsonDB.getUserById(cls.teacherId);
    const module = cls.moduleId ? { id: cls.moduleId, title: `Module ${cls.moduleId}` } : undefined;

    return {
      id: cls.id,
      title: cls.title,
      description: cls.description,
      classCode: cls.classCode,
      section: cls.section,
      subject: cls.subject,
      room: cls.room,
      teacherId: cls.teacherId,
      moduleId: cls.moduleId,
      backgroundImage: cls.backgroundImage,
      isArchived: cls.isArchived,
      status: cls.status,
      teacher: teacher ? {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
      } : undefined,
      module,
    } as ClassData & { teacher?: { id: string; firstName: string; lastName: string }; module?: { id: string; title: string } };
  } catch (error) {
    console.error('Error loading class from JSON:', error);
    return null;
  }
};

/**
 * Cargar todas las clases archivadas
 */
export const loadArchivedClassesJSON = async (): Promise<ClassData[]> => {
  try {
    await jsonDB.initialize();
    const classes = jsonDB.getClasses().filter(c => c.isArchived === true);

    return classes.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      classCode: c.classCode,
      section: c.section,
      subject: c.subject,
      room: c.room,
      teacherId: c.teacherId,
      moduleId: c.moduleId,
      backgroundImage: c.backgroundImage,
      isArchived: c.isArchived,
      status: c.status,
    }));
  } catch (error) {
    console.error('Error loading archived classes from JSON:', error);
    throw error;
  }
};








