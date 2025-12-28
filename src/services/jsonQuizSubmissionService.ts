/**
 * Servicio para interactuar con quiz submissions usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { QuizSubmissionData } from './quizSubmissionService';
import type { LocalQuizSubmission } from '../db/localDB';
import { jsonUserService } from './jsonUserService';

/**
 * Guardar o actualizar una quiz submission
 */
export const saveQuizSubmissionJSON = async (data: QuizSubmissionData): Promise<void> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();
    const isSubmitted = data.status === 'submitted' || data.status === 'to_review';
    const isReviewed = data.status === 'reviewed';

    // Verificar si ya existe una submission
    const existing = jsonDB.getQuizSubmissions().find(
      s => s.quizId === data.quizId && s.studentId === data.studentId
    );

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

    jsonDB.putQuizSubmission(submissionData);

    // Auto-save is disabled per request, so in-memory only unless manually saved.
  } catch (error) {
    console.error('Error saving quiz submission to JSON:', error);
    throw error;
  }
};

/**
 * Obtener submission de un estudiante para un quiz
 */
export const getQuizSubmissionJSON = async (quizId: string, studentId: string): Promise<{
  id: string;
  quizId: string;
  studentId: string;
  answers?: any;
  status: string;
  grade?: number;
  studentComments?: string;
  teacherComments?: string;
  submittedAt?: string;
  gradedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
} | null> => {
  try {
    await jsonDB.initialize();

    const submission = jsonDB.getQuizSubmissions().find(
      s => s.quizId === quizId && s.studentId === studentId
    );

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
    console.error('Error getting quiz submission from JSON:', error);
    return null;
  }
};

/**
 * Obtener todas las submissions de un quiz (para profesores)
 */
export const getQuizSubmissionsByQuizJSON = async (quizId: string) => {
  try {
    await jsonDB.initialize();

    const submissions = jsonDB.getQuizSubmissions()
      .filter(s => s.quizId === quizId)
      // Sort: submittedAt nulls last, then descending
      .sort((a, b) => {
        if (!a.submittedAt && !b.submittedAt) return 0;
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });

    return submissions.map(sub => {
      const student = jsonUserService.getUserById(sub.studentId);

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
          name: student ? `${student.firstName} ${student.lastName}`.trim() : 'Estudiante',
          avatar: student?.avatar,
          group: student?.grupoAsignado,
        },
      };
    });
  } catch (error) {
    console.error('Error getting quiz submissions by quiz from JSON:', error);
    return [];
  }
};

/**
 * Marcar quiz submission como "to_review"
 */
export const markQuizAsToReviewJSON = async (submissionId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getQuizSubmissionById(submissionId);
    if (!existing) {
      throw new Error('Quiz submission not found');
    }

    jsonDB.putQuizSubmission({
      ...existing,
      status: 'to_review',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking quiz submission as to_review JSON:', error);
    throw error;
  }
};

/**
 * Marcar quiz submission como "reviewed"
 */
export const markQuizAsReviewedJSON = async (
  submissionId: string,
  teacherComments?: string,
  grade?: number
): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getQuizSubmissionById(submissionId);
    if (!existing) {
      throw new Error('Quiz submission not found');
    }

    const updateData: any = {
      ...existing,
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (teacherComments !== undefined) {
      updateData.teacherComments = teacherComments;
    }

    if (grade !== undefined) {
      updateData.grade = grade;
    }

    jsonDB.putQuizSubmission(updateData);
  } catch (error) {
    console.error('Error marking quiz submission as reviewed JSON:', error);
    throw error;
  }
};
