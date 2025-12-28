/**
 * Servicio local para interactuar con quiz submissions en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalQuizSubmission } from '../db/localDB';
import { QuizSubmissionData } from './quizSubmissionService';

/**
 * Guardar o actualizar una quiz submission
 */
export const saveQuizSubmissionLocal = async (data: QuizSubmissionData): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const isSubmitted = data.status === 'submitted' || data.status === 'to_review';
    const isReviewed = data.status === 'reviewed';

    // Verificar si ya existe una submission
    const existing = await localDB.quizSubmissions
      .where('[quizId+studentId]')
      .equals([data.quizId, data.studentId])
      .first();

    const submissionData: LocalQuizSubmission = {
      id: existing?.id || crypto.randomUUID(),
      quizId: data.quizId,
      studentId: data.studentId,
      answers: data.answers || undefined,
      status: data.status || 'draft',
      grade: data.grade,
      studentComments: data.studentComments,
      teacherComments: data.teacherComments,
      submittedAt: isSubmitted ? now : existing?.submittedAt,
      gradedAt: existing?.gradedAt,
      reviewedAt: isReviewed ? now : existing?.reviewedAt,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await localDB.quizSubmissions.put(submissionData);
  } catch (error) {
    console.error('Error saving quiz submission to local DB:', error);
    throw error;
  }
};

/**
 * Obtener submission de un estudiante para un quiz
 */
export const getQuizSubmissionLocal = async (quizId: string, studentId: string) => {
  try {
    const submission = await localDB.quizSubmissions
      .where('[quizId+studentId]')
      .equals([quizId, studentId])
      .first();

    if (!submission) return null;

    return {
      id: submission.id,
      quizId: submission.quizId,
      studentId: submission.studentId,
      answers: submission.answers,
      status: submission.status,
      grade: submission.grade,
      studentComments: submission.studentComments,
      teacherComments: submission.teacherComments,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  } catch (error) {
    console.error('Error loading quiz submission from local DB:', error);
    throw error;
  }
};

/**
 * Obtener todas las submissions de un quiz (para profesores)
 */
export const getQuizSubmissionsByQuizLocal = async (quizId: string) => {
  try {
    const submissions = await localDB.quizSubmissions
      .where('quizId')
      .equals(quizId)
      .toArray();

    // Obtener información de estudiantes
    const submissionsWithStudents = await Promise.all(
      submissions.map(async (sub) => {
        const student = await localDB.users.get(sub.studentId);
        return {
          id: sub.id,
          quizId: sub.quizId,
          studentId: sub.studentId,
          answers: sub.answers,
          status: sub.status,
          grade: sub.grade,
          studentComments: sub.studentComments,
          teacherComments: sub.teacherComments,
          submittedAt: sub.submittedAt,
          gradedAt: sub.gradedAt,
          reviewedAt: sub.reviewedAt,
          createdAt: sub.createdAt,
          student: {
            id: student?.id,
            name: `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Estudiante',
            avatar: student?.avatar,
          },
        };
      })
    );

    // Ordenar por submittedAt descendente
    return submissionsWithStudents.sort((a, b) => {
      if (!a.submittedAt && !b.submittedAt) return 0;
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  } catch (error) {
    console.error('Error loading quiz submissions from local DB:', error);
    throw error;
  }
};

/**
 * Marcar quiz submission como "to_review" (por revisar)
 */
export const markQuizAsToReviewLocal = async (submissionId: string): Promise<void> => {
  try {
    await localDB.quizSubmissions.update(submissionId, {
      status: 'to_review',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error marking quiz submission as to_review in local DB:', error);
    throw error;
  }
};

/**
 * Marcar quiz submission como "reviewed" (revisado)
 */
export const markQuizAsReviewedLocal = async (
  submissionId: string,
  teacherComments?: string,
  grade?: number
): Promise<void> => {
  try {
    const updateData: Partial<LocalQuizSubmission> = {
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (teacherComments !== undefined) {
      updateData.teacherComments = teacherComments;
    }

    if (grade !== undefined) {
      updateData.grade = grade;
    }

    await localDB.quizSubmissions.update(submissionId, updateData);
  } catch (error) {
    console.error('Error marking quiz submission as reviewed in local DB:', error);
    throw error;
  }
};








