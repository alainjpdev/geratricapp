/**
 * Servicio para gestionar submissions de quizzes
 * Funciona con Supabase y base de datos local según USE_LOCAL_DB
 */

import { supabase } from '../config/supabaseClient';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localQuizSubmissionService from './localQuizSubmissionService';
import * as jsonQuizSubmissionService from './jsonQuizSubmissionService';

export interface QuizSubmissionData {
  quizId: string;
  studentId: string;
  answers?: any; // Respuestas del estudiante (JSON)
  status?: 'draft' | 'submitted' | 'to_review' | 'reviewed' | 'graded';
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
 * Guardar o actualizar una quiz submission
 */
export const saveQuizSubmission = async (data: QuizSubmissionData): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonQuizSubmissionService.saveQuizSubmissionJSON(data);
  }
  if (USE_LOCAL_DB) {
    return localQuizSubmissionService.saveQuizSubmissionLocal(data);
  }

  try {
    const now = new Date().toISOString();
    const isSubmitted = data.status === 'submitted' || data.status === 'to_review';
    const isReviewed = data.status === 'reviewed';

    // Verificar si ya existe una submission
    const { data: existing } = await supabase
      .from('quiz_submissions')
      .select('id')
      .eq('quiz_id', data.quizId)
      .eq('student_id', data.studentId)
      .maybeSingle();

    const submissionData: any = {
      quiz_id: data.quizId,
      student_id: data.studentId,
      answers: data.answers || null,
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
        .from('quiz_submissions')
        .update(submissionData)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Crear nueva submission
      submissionData.id = generateUUID();
      submissionData.created_at = now;

      const { error } = await supabase
        .from('quiz_submissions')
        .insert(submissionData);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving quiz submission:', error);
    throw error;
  }
};

/**
 * Obtener submission de un estudiante para un quiz
 */
export const getQuizSubmission = async (quizId: string, studentId: string) => {
  if (USE_JSON_DB) {
    return jsonQuizSubmissionService.getQuizSubmissionJSON(quizId, studentId);
  }
  if (USE_LOCAL_DB) {
    return localQuizSubmissionService.getQuizSubmissionLocal(quizId, studentId);
  }

  try {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: data.id,
      quizId: data.quiz_id,
      studentId: data.student_id,
      answers: data.answers,
      status: data.status,
      grade: data.grade ? parseFloat(data.grade) : null,
      studentComments: data.student_comments,
      teacherComments: data.teacher_comments,
      submittedAt: data.submitted_at,
      gradedAt: data.graded_at,
      reviewedAt: data.reviewed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error loading quiz submission:', error);
    throw error;
  }
};

/**
 * Obtener todas las submissions de un quiz (para profesores)
 */
export const getQuizSubmissionsByQuiz = async (quizId: string) => {
  if (USE_JSON_DB) {
    return jsonQuizSubmissionService.getQuizSubmissionsByQuizJSON(quizId);
  }
  if (USE_LOCAL_DB) {
    return localQuizSubmissionService.getQuizSubmissionsByQuizLocal(quizId);
  }

  try {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select(`
        *,
        student:users!quiz_submissions_student_id_fkey(
          id,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('quiz_id', quizId)
      .order('submitted_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data || []).map((sub: any) => ({
      id: sub.id,
      quizId: sub.quiz_id,
      studentId: sub.student_id,
      answers: sub.answers,
      status: sub.status,
      grade: sub.grade ? parseFloat(sub.grade) : null,
      studentComments: sub.student_comments,
      teacherComments: sub.teacher_comments,
      submittedAt: sub.submitted_at,
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
    console.error('Error loading quiz submissions:', error);
    throw error;
  }
};

/**
 * Marcar quiz submission como "to_review" (por revisar)
 */
export const markQuizAsToReview = async (submissionId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonQuizSubmissionService.markQuizAsToReviewJSON(submissionId);
  }
  if (USE_LOCAL_DB) {
    return localQuizSubmissionService.markQuizAsToReviewLocal(submissionId);
  }

  try {
    const { error } = await supabase
      .from('quiz_submissions')
      .update({
        status: 'to_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking quiz submission as to_review:', error);
    throw error;
  }
};

/**
 * Marcar quiz submission como "reviewed" (revisado)
 */
export const markQuizAsReviewed = async (
  submissionId: string,
  teacherComments?: string,
  grade?: number
): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonQuizSubmissionService.markQuizAsReviewedJSON(submissionId, teacherComments, grade);
  }
  if (USE_LOCAL_DB) {
    return localQuizSubmissionService.markQuizAsReviewedLocal(submissionId, teacherComments, grade);
  }

  try {
    console.log('🏁 service.markQuizAsReviewed called', { submissionId, grade });
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

    console.log('📌 Updating quiz_submissions with:', updateData);

    const { error } = await supabase
      .from('quiz_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (error) {
      console.error('❌ Supabase error updating quiz submission:', error);
      throw error;
    }
    console.log('✅ Quiz submission marked as reviewed in DB');
  } catch (error) {
    console.error('Error marking quiz submission as reviewed:', error);
    throw error;
  }
};


