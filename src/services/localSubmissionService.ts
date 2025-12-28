/**
 * Servicio local para interactuar con assignment submissions en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalAssignmentSubmission } from '../db/localDB';
import { AssignmentSubmissionData } from './submissionService';

/**
 * Guardar o actualizar una submission
 */
export const saveSubmissionLocal = async (data: AssignmentSubmissionData): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const isSubmitted = data.status === 'submitted' || data.status === 'to_review';
    const isReviewed = data.status === 'reviewed';

    // Verificar si ya existe una submission
    const existing = await localDB.assignmentSubmissions
      .where('[assignmentId+studentId]')
      .equals([data.assignmentId, data.studentId])
      .first();

    const submissionData: LocalAssignmentSubmission = {
      id: existing?.id || crypto.randomUUID(),
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      content: data.content || undefined,
      attachments: data.attachments || undefined,
      status: data.status || 'draft',
      grade: data.grade,
      studentComments: data.studentComments,
      teacherComments: data.teacherComments,
      submittedAt: isSubmitted ? now : existing?.submittedAt,
      returnedAt: existing?.returnedAt,
      gradedAt: existing?.gradedAt,
      reviewedAt: isReviewed ? now : existing?.reviewedAt,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await localDB.assignmentSubmissions.put(submissionData);
  } catch (error) {
    console.error('Error saving submission to local DB:', error);
    throw error;
  }
};

/**
 * Obtener submission de un estudiante para un assignment
 */
export const getSubmissionLocal = async (assignmentId: string, studentId: string) => {
  try {
    const submission = await localDB.assignmentSubmissions
      .where('[assignmentId+studentId]')
      .equals([assignmentId, studentId])
      .first();

    if (!submission) return null;

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      content: submission.content,
      attachments: submission.attachments,
      status: submission.status,
      grade: submission.grade,
      studentComments: submission.studentComments,
      teacherComments: submission.teacherComments,
      submittedAt: submission.submittedAt,
      returnedAt: submission.returnedAt,
      gradedAt: submission.gradedAt,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  } catch (error) {
    console.error('Error loading submission from local DB:', error);
    throw error;
  }
};

/**
 * Obtener todas las submissions de un assignment (para profesores)
 */
export const getSubmissionsByAssignmentLocal = async (assignmentId: string) => {
  try {
    const submissions = await localDB.assignmentSubmissions
      .where('assignmentId')
      .equals(assignmentId)
      .toArray();

    // Obtener información de estudiantes
    const submissionsWithStudents = await Promise.all(
      submissions.map(async (sub) => {
        const student = await localDB.users.get(sub.studentId);
        return {
          id: sub.id,
          assignmentId: sub.assignmentId,
          studentId: sub.studentId,
          content: sub.content,
          attachments: sub.attachments,
          status: sub.status,
          grade: sub.grade,
          studentComments: sub.studentComments,
          teacherComments: sub.teacherComments,
          submittedAt: sub.submittedAt,
          returnedAt: sub.returnedAt,
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
    console.error('Error loading submissions from local DB:', error);
    throw error;
  }
};

/**
 * Devolver una submission para correcciones
 */
export const returnSubmissionLocal = async (submissionId: string): Promise<void> => {
  try {
    const submission = await localDB.assignmentSubmissions.get(submissionId);
    if (!submission) throw new Error('Submission not found');

    await localDB.assignmentSubmissions.update(submissionId, {
      status: 'returned',
      returnedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error returning submission in local DB:', error);
    throw error;
  }
};

/**
 * Marcar submission como "to_review" (por revisar)
 */
export const markAsToReviewLocal = async (submissionId: string): Promise<void> => {
  try {
    await localDB.assignmentSubmissions.update(submissionId, {
      status: 'to_review',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error marking submission as to_review in local DB:', error);
    throw error;
  }
};

/**
 * Marcar submission como "reviewed" (revisado)
 */
export const markAsReviewedLocal = async (
  submissionId: string,
  teacherComments?: string,
  grade?: number
): Promise<void> => {
  try {
    const updateData: Partial<LocalAssignmentSubmission> = {
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

    await localDB.assignmentSubmissions.update(submissionId, updateData);
  } catch (error) {
    console.error('Error marking submission as reviewed in local DB:', error);
    throw error;
  }
};








