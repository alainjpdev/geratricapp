/**
 * Servicio local para interactuar con clases en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalClass, LocalClassMember } from '../db/localDB';
import { ClassData } from './classService';
import { USE_LOCAL_DB } from '../config/devMode';

/**
 * Cargar todas las clases de un profesor (o todas si es admin)
 */
export const loadClassesLocal = async (teacherId: string, isAdmin: boolean = false): Promise<ClassData[]> => {
  try {
    let classes: LocalClass[];

    if (isAdmin) {
      // Admin ve todas las clases
      classes = await localDB.classes.toArray();
    } else {
      // Profesor ve solo sus clases
      classes = await localDB.classes
        .where('teacherId')
        .equals(teacherId)
        .toArray();
    }

    // Filtrar clases archivadas
    const activeClasses = classes.filter(c => !c.isArchived);

    // Obtener IDs únicos de profesores
    const teacherIds = [...new Set(activeClasses.map(c => c.teacherId))];

    // Obtener información de todos los profesores en una sola consulta
    const teachers = await localDB.users.where('id').anyOf(teacherIds).toArray();
    const teacherMap = new Map(teachers.map(t => [t.id, t]));

    // Módulos: fetch en bulk si tuviéramos tabla, pero por ahora solo mapeamos el ID
    // Si se agrega tabla de módulos, usar patrón similar: 
    // const moduleIds = [...new Set(activeClasses.map(c => c.moduleId).filter(Boolean))];
    // const modules = await localDB.modules.where('id').anyOf(moduleIds).toArray();

    // Mapear con la información del profesor
    const classesWithDetails = activeClasses.map((c) => {
      const teacherUser = teacherMap.get(c.teacherId);
      const teacher = teacherUser ? {
        id: teacherUser.id,
        firstName: teacherUser.firstName,
        lastName: teacherUser.lastName,
      } : undefined;

      // Módulo: por ahora no tenemos tabla de módulos en localDB
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
        teacher,
        module,
      } as ClassData & { teacher?: { id: string; firstName: string; lastName: string }; module?: { id: string; title: string } };
    });

    return classesWithDetails;
  } catch (error) {
    console.error('Error loading classes from local DB:', error);
    throw error;
  }
};

/**
 * Obtener clases de un estudiante (donde es miembro)
 */
export const getStudentClassesLocal = async (studentId: string): Promise<ClassData[]> => {
  try {
    // Obtener todas las membresías del estudiante
    const memberships = await localDB.classMembers
      .where('userId')
      .equals(studentId)
      .toArray();

    // Obtener los IDs de las clases
    const classIds = memberships.map(m => m.classId);

    // Obtener las clases
    // Obtener las clases usando una consulta bulk optimizada
    const classes = await localDB.classes.where('id').anyOf(classIds).toArray();

    // Filtrar clases archivadas y asegurar que 'c' no es undefined (aunque toArray() retorna array de objetos definidos o vacio)
    const activeClasses = classes.filter((c): c is LocalClass => !!c && !c.isArchived);

    // Obtener IDs únicos de profesores
    const teacherIds = [...new Set(activeClasses.map(c => c.teacherId))];

    // Obtener información de todos los profesores en una sola consulta
    const teachers = await localDB.users.where('id').anyOf(teacherIds).toArray();
    const teacherMap = new Map(teachers.map(t => [t.id, t]));

    const classesWithDetails = activeClasses.map((c) => {
      const teacherUser = teacherMap.get(c.teacherId);
      const teacher = teacherUser ? {
        id: teacherUser.id,
        firstName: teacherUser.firstName,
        lastName: teacherUser.lastName,
      } : undefined;

      // Módulo: por ahora no tenemos tabla de módulos en localDB
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
        teacher,
        module,
      } as ClassData & { teacher?: { id: string; firstName: string; lastName: string }; module?: { id: string; title: string } };
    });

    return classesWithDetails;
  } catch (error) {
    console.error('Error loading student classes from local DB:', error);
    throw error;
  }
};

/**
 * Crear una nueva clase
 */
export const createClassLocal = async (classData: ClassData): Promise<ClassData> => {
  try {
    const now = new Date().toISOString();
    const classCode = classData.classCode || `CLASS-${Date.now()}`;

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

    await localDB.classes.add(newClass);

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
    console.error('Error creating class in local DB:', error);
    throw error;
  }
};

/**
 * Actualizar una clase
 */
export const updateClassLocal = async (classId: string, classData: Partial<ClassData>): Promise<ClassData> => {
  try {
    const existing = await localDB.classes.get(classId);
    if (!existing) {
      throw new Error('Clase no encontrada');
    }

    const updated: LocalClass = {
      ...existing,
      ...classData,
      updatedAt: new Date().toISOString(),
    };

    await localDB.classes.put(updated);

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
    console.error('Error updating class in local DB:', error);
    throw error;
  }
};

/**
 * Archivar una clase
 */
export const archiveClassLocal = async (classId: string): Promise<void> => {
  try {
    const existing = await localDB.classes.get(classId);
    if (!existing) {
      throw new Error('Clase no encontrada');
    }

    await localDB.classes.put({
      ...existing,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error archiving class in local DB:', error);
    throw error;
  }
};

/**
 * Desarchivar una clase
 */
export const unarchiveClassLocal = async (classId: string): Promise<void> => {
  try {
    const existing = await localDB.classes.get(classId);
    if (!existing) {
      throw new Error('Clase no encontrada');
    }

    await localDB.classes.put({
      ...existing,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unarchiving class in local DB:', error);
    throw error;
  }
};

/**
 * Eliminar una clase permanentemente
 * NOTA: Los streamItems y assignments NO se borran, solo se desvinculan de la clase
 * Esto preserva los datos históricos en la base de datos
 */
export const deleteClassLocal = async (classId: string): Promise<void> => {
  try {
    // Primero, desvincular todos los streamItems de esta clase (poner classId a null)
    // Esto preserva los assignments, quizzes y materials en la base de datos
    // Primero, desvincular todos los streamItems de esta clase (poner classId a null)
    // Esto preserva los assignments, quizzes y materials en la base de datos
    await localDB.streamItems
      .where('classId')
      .equals(classId)
      .modify({ classId: null as any });

    // Eliminar miembros de la clase
    await localDB.classMembers
      .where('classId')
      .equals(classId)
      .delete();

    // Finalmente, eliminar la clase
    await localDB.classes.delete(classId);
  } catch (error) {
    console.error('Error deleting class from local DB:', error);
    throw error;
  }
};

/**
 * Cargar una clase por ID
 */
export const loadClassLocal = async (classId: string): Promise<ClassData | null> => {
  try {
    const cls = await localDB.classes.get(classId);
    if (!cls) return null;

    // Obtener información del profesor
    let teacher: { id: string; firstName: string; lastName: string } | undefined;
    try {
      const teacherUser = await localDB.users.get(cls.teacherId);
      if (teacherUser) {
        teacher = {
          id: teacherUser.id,
          firstName: teacherUser.firstName,
          lastName: teacherUser.lastName,
        };
      }
    } catch (err) {
      console.warn('Error loading teacher for class:', cls.id, err);
    }

    // Módulo: por ahora no tenemos tabla de módulos en localDB, así que solo devolvemos el ID
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
      teacher,
      module,
    } as ClassData & { teacher?: { id: string; firstName: string; lastName: string }; module?: { id: string; title: string } };
  } catch (error) {
    console.error('Error loading class from local DB:', error);
    return null;
  }
};

/**
 * Cargar todas las clases archivadas
 */
export const loadArchivedClassesLocal = async (): Promise<ClassData[]> => {
  try {
    // Obtener todas las clases y filtrar por isArchived en memoria
    const allClasses = await localDB.classes.toArray();
    const classes = allClasses.filter(c => c.isArchived === true);

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
    console.error('Error loading archived classes from local DB:', error);
    throw error;
  }
};

