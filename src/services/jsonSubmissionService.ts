/**
 * Servicio para interactuar con assignment submissions usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { AssignmentSubmissionData } from './submissionService';
import type { LocalAssignmentSubmission } from '../db/localDB';
import { jsonUserService } from './jsonUserService';

/**
 * Guardar o actualizar una submission
 */
export const saveSubmissionJSON = async (data: AssignmentSubmissionData): Promise<void> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();
    const isSubmitted = data.status === 'submitted' || data.status === 'to_review';
    const isReviewed = data.status === 'reviewed';

    // Verificar si ya existe una submission
    const existing = jsonDB.getAssignmentSubmissions().find(
      s => s.assignmentId === data.assignmentId && s.studentId === data.studentId
    );

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

    jsonDB.putAssignmentSubmission(submissionData);
    // Auto-save disabled
  } catch (error) {
    console.error('Error saving submission to JSON:', error);
    throw error;
  }
};

/**
 * Obtener submission de un estudiante para un assignment
 */
export const getSubmissionJSON = async (assignmentId: string, studentId: string): Promise<{
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  attachments?: any[];
  status: string;
  grade?: number;
  studentComments?: string;
  teacherComments?: string;
  submittedAt?: string;
  returnedAt?: string;
  gradedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
} | null> => {
  try {
    await jsonDB.initialize();

    const submission = jsonDB.getAssignmentSubmissions().find(
      s => s.assignmentId === assignmentId && s.studentId === studentId
    );

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
    console.error('Error getting submission from JSON:', error);
    return null;
  }
};

/**
 * Obtener todas las submissions de un assignment (para profesores)
 */
export const getSubmissionsByAssignmentJSON = async (assignmentId: string) => {
  try {
    await jsonDB.initialize();

    const all = jsonDB.getAssignmentSubmissions();
    console.log(`DEBUG_JSON: getSubmissionsByAssignmentJSON for ${assignmentId}. Total in DB: ${all.length}`);

    const submissions = all
      .filter(s => s.assignmentId === assignmentId)
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
          name: student ? `${student.firstName} ${student.lastName}`.trim() : 'Estudiante',
          avatar: student?.avatar,
          group: student?.grupoAsignado,
        },
      };
    });
  } catch (error) {
    console.error('Error getting submissions by assignment from JSON:', error);
    return [];
  }
};

/**
 * Marcar submission como "to_review"
 */
export const markAsToReviewJSON = async (submissionId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getAssignmentSubmissions().find(s => s.id === submissionId);
    if (!existing) {
      throw new Error('Submission not found');
    }

    existing.status = 'to_review';
    existing.updatedAt = new Date().toISOString();

    jsonDB.putAssignmentSubmission(existing);
  } catch (error) {
    console.error('Error marking submission as to_review JSON:', error);
    throw error;
  }
};

/**
 * Marcar submission como "reviewed"
 */
export const markAsReviewedJSON = async (
  submissionId: string,
  teacherComments?: string,
  grade?: number
): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getAssignmentSubmissions().find(s => s.id === submissionId);
    if (!existing) {
      throw new Error('Submission not found');
    }

    existing.status = 'reviewed';
    existing.reviewedAt = new Date().toISOString();
    existing.updatedAt = new Date().toISOString();

    if (teacherComments !== undefined) {
      existing.teacherComments = teacherComments;
    }

    if (grade !== undefined) {
      existing.grade = grade;
    }

    jsonDB.putAssignmentSubmission(existing);
  } catch (error) {
    console.error('Error marking submission as reviewed JSON:', error);
    throw error;
  }
};
