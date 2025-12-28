/**
 * Servicio para gestionar submissions de assignments
 * Funciona con Supabase y base de datos local según USE_LOCAL_DB
 */

import { supabase } from '../config/supabaseClient';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localSubmissionService from './localSubmissionService';
import * as jsonSubmissionService from './jsonSubmissionService';

export interface AssignmentSubmissionData {
  assignmentId: string;
  studentId: string;
  content?: string;
  attachments?: Array<{
    type: string;
    name: string;
    url?: string;
  }>;
  status?: 'draft' | 'submitted' | 'to_review' | 'reviewed' | 'returned' | 'graded';
  grade?: number;
  studentComments?: string;
  teacherComments?: string;
}

/**
 * Generar UUID v4
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Guardar o actualizar una submission (draft o submitted)
 */
export const saveSubmission = async (data: AssignmentSubmissionData): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonSubmissionService.saveSubmissionJSON(data);
  }
  if (USE_LOCAL_DB) {
    return localSubmissionService.saveSubmissionLocal(data);
  }

  try {
    const now = new Date().toISOString();
    const isSubmitted = data.status === 'submitted' || data.status === 'to_review';
    const isReviewed = data.status === 'reviewed';

    // Verificar si ya existe una submission
    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', data.assignmentId)
      .eq('student_id', data.studentId)
      .maybeSingle();

    const submissionData: any = {
      assignment_id: data.assignmentId,
      student_id: data.studentId,
      content: data.content || null,
      attachments: data.attachments || null,
      status: data.status || 'draft',
      grade: data.grade || null,
      student_comments: data.studentComments || null,
      teacher_comments: data.teacherComments || null,
      updated_at: now,
    };

    if (isSubmitted) {
      submissionData.submitted_at = now;
    }

    if (isReviewed) {
      submissionData.reviewed_at = now;
    }

    if (existing) {
      // Actualizar submission existente
      const { error } = await supabase
        .from('assignment_submissions')
        .update(submissionData)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Crear nueva submission
      submissionData.id = generateUUID();
      submissionData.created_at = now;

      const { error } = await supabase
        .from('assignment_submissions')
        .insert(submissionData);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving submission:', error);
    throw error;
  }
};

/**
 * Obtener submission de un estudiante para un assignment
 */
export const getSubmission = async (assignmentId: string, studentId: string) => {
  if (USE_JSON_DB) {
    return jsonSubmissionService.getSubmissionJSON(assignmentId, studentId);
  }
  if (USE_LOCAL_DB) {
    return localSubmissionService.getSubmissionLocal(assignmentId, studentId);
  }

  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: data.id,
      assignmentId: data.assignment_id,
      studentId: data.student_id,
      content: data.content,
      attachments: data.attachments,
      status: data.status,
      grade: data.grade ? parseFloat(data.grade) : null,
      studentComments: data.student_comments,
      teacherComments: data.teacher_comments,
      submittedAt: data.submitted_at,
      returnedAt: data.returned_at,
      gradedAt: data.graded_at,
      reviewedAt: data.reviewed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error loading submission:', error);
    throw error;
  }
};

/**
 * Obtener todas las submissions de un assignment (para profesores)
 */
export const getSubmissionsByAssignment = async (assignmentId: string) => {
  if (USE_JSON_DB) {
    return jsonSubmissionService.getSubmissionsByAssignmentJSON(assignmentId);
  }
  if (USE_LOCAL_DB) {
    return localSubmissionService.getSubmissionsByAssignmentLocal(assignmentId);
  }

  try {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:users!assignment_submissions_student_id_fkey(
          id,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []).map((sub: any) => ({
      id: sub.id,
      assignmentId: sub.assignment_id,
      studentId: sub.student_id,
      content: sub.content,
      attachments: sub.attachments,
      status: sub.status,
      grade: sub.grade ? parseFloat(sub.grade) : null,
      studentComments: sub.student_comments,
      teacherComments: sub.teacher_comments,
      submittedAt: sub.submitted_at,
      returnedAt: sub.returned_at,
      gradedAt: sub.graded_at,
      reviewedAt: sub.reviewed_at,
      createdAt: sub.created_at,
      student: {
        id: sub.student?.id,
        name: `${sub.student?.first_name || ''} ${sub.student?.last_name || ''}`.trim() || 'Estudiante',
        avatar: sub.student?.avatar,
        group: sub.student?.grupo_asignado,
      },
    }));
  } catch (error) {
    console.error('Error loading submissions:', error);
    throw error;
  }
};

/**
 * Devolver una submission para correcciones
 */
export const returnSubmission = async (submissionId: string): Promise<void> => {
  if (USE_LOCAL_DB) {
    return localSubmissionService.returnSubmissionLocal(submissionId);
  }

  try {
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        status: 'returned',
        returned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error returning submission:', error);
    throw error;
  }
};

/**
 * Marcar submission como "to_review" (por revisar)
 */
export const markAsToReview = async (submissionId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonSubmissionService.markAsToReviewJSON(submissionId);
  }
  if (USE_LOCAL_DB) {
    return localSubmissionService.markAsToReviewLocal(submissionId);
  }

  try {
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        status: 'to_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking submission as to_review:', error);
    throw error;
  }
};

/**
 * Marcar submission como "reviewed" (revisado)
 */
export const markAsReviewed = async (submissionId: string, teacherComments?: string, grade?: number): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonSubmissionService.markAsReviewedJSON(submissionId, teacherComments, grade);
  }
  if (USE_LOCAL_DB) {
    return localSubmissionService.markAsReviewedLocal(submissionId, teacherComments, grade);
  }

  try {
    console.log('🏁 service.markAsReviewed called', { submissionId, grade });
    const updateData: any = {
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (teacherComments !== undefined) {
      updateData.teacher_comments = teacherComments;
    }

    if (grade !== undefined) {
      updateData.grade = grade;
    }

    console.log('📌 Updating assignment_submissions with:', updateData);

    const { error } = await supabase
      .from('assignment_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (error) {
      console.error('❌ Supabase error updating submission:', error);
      throw error;
    }
    console.log('✅ Submission marked as reviewed in DB');
  } catch (error) {
    console.error('Error marking submission as reviewed:', error);
    throw error;
  }
};


