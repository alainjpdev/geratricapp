/**
 * Servicio para interactuar con quizzes usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { QuizData } from './quizService';
import type { LocalQuiz, LocalQuizQuestion, LocalQuizStudent } from '../db/localDB';
import { jsonUserService } from './jsonUserService';

/**
 * Guardar un quiz
 */
export const saveQuizJSON = async (data: QuizData): Promise<void> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();

    // Buscar quiz existente
    const existing = jsonDB.getQuizByStreamItemId(data.streamItemId);

    let quizId: string;

    if (existing) {
      // Actualizar
      quizId = existing.id;
      jsonDB.putQuiz({
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
      const existingQuestions = jsonDB.getQuizQuestions().filter(q => q.quizId === quizId);
      existingQuestions.forEach(q => {
        const index = jsonDB.getQuizQuestions().findIndex(qq => qq.id === q.id);
        if (index >= 0) {
          jsonDB.getQuizQuestions().splice(index, 1);
        }
      });

      const existingStudents = jsonDB.getQuizStudents().filter(qs => qs.quizId === quizId);
      existingStudents.forEach(qs => jsonDB.deleteQuizStudent(qs.id));
    } else {
      // Crear nuevo
      quizId = crypto.randomUUID();
      jsonDB.putQuiz({
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
      data.questions.forEach((q, index) => {
        jsonDB.putQuizQuestion({
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
        });
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
          jsonDB.putQuizStudent({
            id: crypto.randomUUID(),
            quizId,
            studentId,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error saving quiz to JSON:', error);
    throw error;
  }
};

/**
 * Obtener quiz por stream item ID
 */
export const getQuizByStreamItemIdJSON = async (
  streamItemId: string
): Promise<(QuizData & { isArchived?: boolean }) | null> => {
  try {
    await jsonDB.initialize();
    const quiz = jsonDB.getQuizByStreamItemId(streamItemId);
    if (!quiz) return null;

    const streamItem = jsonDB.getStreamItemById(streamItemId);
    const questions = jsonDB.getQuizQuestions()
      .filter(q => q.quizId === quiz.id)
      .sort((a, b) => a.order - b.order);
    const quizStudents = jsonDB.getQuizStudents().filter(qs => qs.quizId === quiz.id);

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
    console.error('Error getting quiz from JSON:', error);
    return null;
  }
};

/**
 * Obtener todos los quizzes
 */
export const getAllQuizzesJSON = async (): Promise<any[]> => {
  try {
    await jsonDB.initialize();
    const quizzes = jsonDB.getQuizzes();

    const result = quizzes.map((quiz) => {
      const streamItem = jsonDB.getStreamItemById(quiz.streamItemId);
      if (!streamItem || streamItem.isArchived) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);
      const className = jsonDB.getClassById(streamItem.classId || '')?.title || streamItem.className || 'Sin clase';

      // Calcular pendientes de revisión
      // Nota: En dummy-data no tenemos quizSubmissions explícito, pero podemos simularlo o agregarlo si es necesario.
      // Por ahora, usamos quizSubmissions array si existe en jsonDB
      const submissions = jsonDB.getQuizSubmissions().filter(s => s.quizId === quiz.id);
      const pendingReviewCount = submissions.filter(s =>
        // Asumiendo que las respuestas cortas necesitan revisión
        s.status === 'submitted' || s.status === 'to_review'
      ).length;

      return {
        id: quiz.id,
        streamItemId: quiz.streamItemId,
        classId: streamItem.classId,
        className: className,
        type: 'quiz',
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
        pendingReviewCount,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean).sort((a, b) =>
      new Date(b?.createdAt || '').getTime() - new Date(a?.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting all quizzes from JSON:', error);
    return [];
  }
};

/**
 * Obtener quizzes por clase
 */
export const getQuizzesByClassJSON = async (
  classId: string,
  includeArchived: boolean = false
): Promise<any[]> => {
  try {
    await jsonDB.initialize();

    // Obtener todos los stream items de tipo quiz
    let streamItems = jsonDB.getStreamItems()
      .filter(si => si.classId === classId && si.type === 'quiz');

    if (!includeArchived) {
      streamItems = streamItems.filter(si => !si.isArchived);
    }

    const result = streamItems.map((streamItem) => {
      const quiz = jsonDB.getQuizByStreamItemId(streamItem.id);
      if (!quiz) return null;

      const author = jsonUserService.getUserById(streamItem.authorId);

      // Calcular pendientes de revisión
      const submissions = jsonDB.getQuizSubmissions().filter(s => s.quizId === quiz.id);
      const pendingReviewCount = submissions.filter(s =>
        s.status === 'submitted' || s.status === 'to_review'
      ).length;

      return {
        id: quiz.id,
        streamItemId: quiz.streamItemId,
        classId: streamItem.classId,
        type: 'quiz',
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
        pendingReviewCount,
        isArchived: streamItem.isArchived || false,
      };
    });

    return result.filter(Boolean).sort((a, b) =>
      new Date(b?.createdAt || '').getTime() - new Date(a?.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error getting quizzes by class from JSON:', error);
    return [];
  }
};

/**
 * Obtener quizzes para un estudiante específico
 */
export const getQuizzesForStudentJSON = async (
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
    await jsonDB.initialize();
    const allQuizzes = await getAllQuizzesJSON();
    const studentQuizzes: any[] = [];

    for (const quiz of allQuizzes) {
      if (quiz.isArchived) continue;

      // Si está asignado a todos, incluirlo
      if (quiz.assignToAll) {
        studentQuizzes.push(quiz);
        continue;
      }

      // Verificar si el estudiante está asignado directamente
      const quizStudents = jsonDB.getQuizStudents().filter(qs => qs.quizId === quiz.id && qs.studentId === studentId);
      if (quizStudents.length > 0) {
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
    console.error('Error getting quizzes for student from JSON:', error);
    return [];
  }
};

