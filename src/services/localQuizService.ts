/**
 * Servicio local para interactuar con quizzes en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalQuiz, LocalQuizQuestion, LocalQuizStudent } from '../db/localDB';
import { QuizData } from './quizService';
import { localUserService } from './localUserService';

/**
 * Guardar un quiz
 */
export const saveQuizLocal = async (data: QuizData): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Buscar quiz existente
    const existing = await localDB.quizzes
      .where('streamItemId')
      .equals(data.streamItemId)
      .first();

    let quizId: string;

    if (existing) {
      // Actualizar
      quizId = existing.id;
      await localDB.quizzes.put({
        ...existing,
        points: data.points,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        description: data.description,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        updatedAt: now,
      });

      // Eliminar preguntas y estudiantes existentes
      await localDB.quizQuestions.where('quizId').equals(quizId).delete();
      await localDB.quizStudents.where('quizId').equals(quizId).delete();
    } else {
      // Crear nuevo
      quizId = crypto.randomUUID();
      await localDB.quizzes.add({
        id: quizId,
        streamItemId: data.streamItemId,
        points: data.points,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        description: data.description,
        assignToAll: data.assignToAll ?? true,
        assignedGroups: data.assignedGroups || [],
        createdAt: now,
        updatedAt: now,
      });
    }

    // Guardar preguntas
    if (data.questions && data.questions.length > 0) {
      const questionsData = data.questions.map((q, index) => ({
        id: crypto.randomUUID(),
        quizId,
        title: q.title,
        description: q.description,
        type: q.type,
        required: q.required ?? false,
        points: q.points ?? 0,
        correctAnswer: q.correctAnswer,
        options: q.options,
        order: index,
        createdAt: now,
        updatedAt: now,
      }));

      await localDB.quizQuestions.bulkAdd(questionsData);
    }

    // Asignar estudiantes
    if (!data.assignToAll) {
      let studentIds: string[] = [];

      if (data.assignedGroups && data.assignedGroups.length > 0) {
        for (const group of data.assignedGroups) {
          const students = await localUserService.getStudentsByGroup(group);
          studentIds.push(...students.map(s => s.id));
        }
      }

      if (data.selectedStudents && data.selectedStudents.length > 0) {
        studentIds.push(...data.selectedStudents);
      }

      studentIds = [...new Set(studentIds)];

      if (studentIds.length > 0) {
        const quizStudents = studentIds.map(studentId => ({
          id: crypto.randomUUID(),
          quizId,
          studentId,
        }));

        await localDB.quizStudents.bulkAdd(quizStudents);
      }
    }
  } catch (error) {
    console.error('Error saving quiz to local DB:', error);
    throw error;
  }
};

/**
 * Obtener quiz por stream item ID
 */
export const getQuizByStreamItemIdLocal = async (
  streamItemId: string
): Promise<(QuizData & { isArchived?: boolean }) | null> => {
  try {
    const quiz = await localDB.quizzes
      .where('streamItemId')
      .equals(streamItemId)
      .first();

    if (!quiz) return null;

    const streamItem = await localDB.streamItems.get(streamItemId);
    const questions = await localDB.quizQuestions
      .where('quizId')
      .equals(quiz.id)
      .sortBy('order');
    const quizStudents = await localDB.quizStudents
      .where('quizId')
      .equals(quiz.id)
      .toArray();

    return {
      streamItemId: quiz.streamItemId,
      points: quiz.points,
      dueDate: quiz.dueDate,
      dueTime: quiz.dueTime,
      description: quiz.description,
      assignToAll: quiz.assignToAll,
      assignedGroups: quiz.assignedGroups || [],
      selectedStudents: quizStudents.map(qs => qs.studentId),
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        required: q.required,
        points: q.points,
        correctAnswer: q.correctAnswer,
        options: q.options,
        order: q.order,
      })),
      isArchived: streamItem?.isArchived || false,
    };
  } catch (error) {
    console.error('Error getting quiz from local DB:', error);
    return null;
  }
};

/**
 * Obtener todos los quizzes
 */
export const getAllQuizzesLocal = async (): Promise<any[]> => {
  try {
    const quizzes = await localDB.quizzes.toArray();
    const result = await Promise.all(
      quizzes.map(async (quiz) => {
        const streamItem = await localDB.streamItems.get(quiz.streamItemId);
        if (!streamItem || streamItem.isArchived) return null;

        const author = await localUserService.getUserById(streamItem.authorId);
        const className = await getClassNameLocal(streamItem.classId || '');

        return {
          id: quiz.id,
          streamItemId: quiz.streamItemId,
          classId: streamItem.classId,
          className: className || 'Sin clase',
          type: 'quiz', // Asegurar que el tipo esté incluido
          title: streamItem.title,
          description: quiz.description,
          points: quiz.points,
          dueDate: quiz.dueDate,
          dueTime: quiz.dueTime,
          assignToAll: quiz.assignToAll,
          assignedGroups: quiz.assignedGroups || [],
          author: {
            id: author?.id || '',
            name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
            avatar: author?.avatar,
          },
          createdAt: streamItem.createdAt,
          isArchived: streamItem.isArchived || false,
        };
      })
    );

    return (result.filter(item => item !== null) as any[]).sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting all quizzes from local DB:', error);
    return [];
  }
};

/**
 * Obtener quizzes para un estudiante específico (local)
 */
export const getQuizzesForStudentLocal = async (
  studentId: string,
  studentGrupoAsignado?: string
): Promise<Array<{
  id: string;
  streamItemId: string;
  classId: string;
  className: string;
  title: string;
  description?: string;
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
}>> => {
  try {
    const allQuizzes = await getAllQuizzesLocal();
    const studentQuizzes: any[] = [];

    for (const quiz of allQuizzes) {
      if (quiz.isArchived) continue;

      // Si está asignado a todos, incluirlo
      if (quiz.assignToAll) {
        studentQuizzes.push(quiz);
        continue;
      }

      // Verificar si el estudiante está asignado directamente
      const quizStudent = await localDB.quizStudents
        .where('[quizId+studentId]')
        .equals([quiz.id, studentId])
        .first();

      if (quizStudent) {
        studentQuizzes.push(quiz);
        continue;
      }

      // Verificar si el estudiante está en un grupo asignado
      if (studentGrupoAsignado && quiz.assignedGroups && quiz.assignedGroups.includes(studentGrupoAsignado)) {
        studentQuizzes.push(quiz);
      }
    }

    return studentQuizzes;
  } catch (error) {
    console.error('Error getting quizzes for student from local DB:', error);
    return [];
  }
};

/**
 * Obtener quizzes por clase
 */
export const getQuizzesByClassLocal = async (
  classId: string,
  includeArchived: boolean = false
): Promise<any[]> => {
  try {
    // Obtener todos los stream items de tipo quiz
    const allStreamItems = await localDB.streamItems
      .where('type')
      .equals('quiz')
      .toArray();

    // Filtrar por classId
    let streamItems = allStreamItems.filter(si => si.classId === classId);

    if (!includeArchived) {
      streamItems = streamItems.filter(si => !si.isArchived);
    }

    const result = await Promise.all(
      streamItems.map(async (streamItem) => {
        const quiz = await localDB.quizzes
          .where('streamItemId')
          .equals(streamItem.id)
          .first();

        if (!quiz) return null;

        const author = await localUserService.getUserById(streamItem.authorId);

        return {
          id: quiz.id,
          streamItemId: quiz.streamItemId,
          classId: streamItem.classId, // Asegurar que classId esté incluido
          type: 'quiz', // Asegurar que el tipo esté incluido
          title: streamItem.title,
          description: quiz.description,
          points: quiz.points,
          dueDate: quiz.dueDate,
          dueTime: quiz.dueTime,
          assignToAll: quiz.assignToAll,
          assignedGroups: quiz.assignedGroups || [],
          author: {
            id: author?.id || '',
            name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
            avatar: author?.avatar,
          },
          createdAt: streamItem.createdAt,
          isArchived: streamItem.isArchived || false,
        };
      })
    );

    return result.filter(Boolean).sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting quizzes by class from local DB:', error);
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


