/**
 * Servicio para interactuar con quizzes en Supabase
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { getStudentsByGroup, getAllStudents } from './userService';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localQuizService from './localQuizService';
import * as jsonQuizService from './jsonQuizService';

export interface QuizData {
  streamItemId: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  description?: string;
  assignToAll?: boolean;
  assignedGroups?: string[];
  selectedStudents?: string[];
  questions?: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    required: boolean;
    points: number;
    correctAnswer?: any;
    options?: any;
    order: number;
  }>;
}

/**
 * Generar UUID v4
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores que no soportan crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Crear o actualizar un quiz
 */
export const saveQuiz = async (data: QuizData): Promise<void> => {
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localQuizService.saveQuizLocal(data);
  }

  try {
    const now = new Date().toISOString();

    // Preparar datos del quiz
    const quizData: any = {
      stream_item_id: data.streamItemId,
      points: data.points || null,
      due_date: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : null,
      due_time: data.dueTime || null,
      description: data.description || null,
      assign_to_all: data.assignToAll ?? true,
      assigned_groups: data.assignedGroups || [],
      updated_at: now,
    };

    // Verificar si el quiz ya existe
    const { data: existingQuiz, error: checkError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('stream_item_id', data.streamItemId)
      .maybeSingle();

    let quizId: string;

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingQuiz) {
      // Actualizar quiz existente
      const { error: updateError } = await supabase
        .from('quizzes')
        .update(quizData)
        .eq('id', existingQuiz.id);

      if (updateError) throw updateError;
      quizId = existingQuiz.id;

      // Eliminar preguntas existentes
      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      // Eliminar asignaciones de estudiantes existentes
      await supabase
        .from('quiz_students')
        .delete()
        .eq('quiz_id', quizId);
    } else {
      // Crear nuevo quiz
      quizData.id = generateUUID();
      quizData.created_at = now;

      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert(quizData)
        .select('id')
        .single();

      if (createError) throw createError;
      if (!newQuiz) throw new Error('Failed to create quiz');
      quizId = newQuiz.id;
    }

    // Guardar preguntas si existen
    if (data.questions && data.questions.length > 0) {
      const questionsData = data.questions.map((q, index) => ({
        id: generateUUID(),
        quiz_id: quizId,
        title: q.title,
        description: q.description || null,
        type: q.type,
        required: q.required ?? false,
        points: q.points ?? 0,
        correct_answer: q.correctAnswer || null,
        options: q.options || null,
        order: q.order ?? index,
        created_at: now,
        updated_at: now,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsData);

      if (questionsError) {
        console.error('Error saving questions:', questionsError);
        throw questionsError;
      }
    }

    // Asignar estudiantes según la configuración
    if (!data.assignToAll) {
      let studentIds: string[] = [];

      // Si hay grupos asignados, obtener estudiantes de esos grupos
      if (data.assignedGroups && data.assignedGroups.length > 0) {
        const studentsByGroupPromises = data.assignedGroups.map(group =>
          getStudentsByGroup(group)
        );
        const studentsArrays = await Promise.all(studentsByGroupPromises);
        const groupStudentIds = studentsArrays.flat().map(s => s.id);
        studentIds = [...new Set([...studentIds, ...groupStudentIds])];
      }

      // Si hay estudiantes seleccionados individualmente, agregarlos
      if (data.selectedStudents && data.selectedStudents.length > 0) {
        studentIds = [...new Set([...studentIds, ...data.selectedStudents])];
      }

      // Crear registros en quiz_students
      if (studentIds.length > 0) {
        const quizStudentsData = studentIds.map(studentId => ({
          id: generateUUID(),
          quiz_id: quizId,
          student_id: studentId,
        }));

        const { error: studentsError } = await supabase
          .from('quiz_students')
          .insert(quizStudentsData);

        if (studentsError) {
          console.error('Error assigning students:', studentsError);
          // No lanzar error, solo registrar
        }
      }
    }
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
};

/**
 * Obtener quiz por streamItemId
 */
export const getQuizByStreamItemId = async (streamItemId: string): Promise<(QuizData & { isArchived?: boolean }) | null> => {
  if (USE_JSON_DB) {
    return jsonQuizService.getQuizByStreamItemIdJSON(streamItemId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localQuizService.getQuizByStreamItemIdLocal(streamItemId);
  }

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        stream_item:stream_items(
          is_archived
        ),
        quiz_students(student_id),
        questions:quiz_questions(*)
      `)
      .eq('stream_item_id', streamItemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      streamItemId: data.stream_item_id,
      points: data.points || undefined,
      dueDate: data.due_date || undefined,
      dueTime: data.due_time || undefined,
      description: data.description || undefined,
      assignToAll: data.assign_to_all,
      assignedGroups: data.assigned_groups || [],
      selectedStudents: (data.quiz_students || []).map((qs: any) => qs.student_id),
      isArchived: data.stream_item?.is_archived || false,
      questions: (data.questions || []).map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description || undefined,
        type: q.type,
        required: q.required,
        points: q.points,
        correctAnswer: q.correct_answer,
        options: q.options,
        order: q.order,
      })),
    };
  } catch (error) {
    console.error('Error loading quiz:', error);
    throw error;
  }
};

/**
 * Obtener todos los quizzes (para admin)
 */
export const getAllQuizzes = async (): Promise<any[]> => {
  if (USE_JSON_DB) {
    return jsonQuizService.getAllQuizzesJSON();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localQuizService.getAllQuizzesLocal();
  }

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        stream_item_id,
        points,
        due_date,
        due_time,
        description,
        assign_to_all,
        assigned_groups,
        created_at,
        stream_item:stream_items!inner(
          id,
          class_id,
          title,
          content,
          is_archived,
          created_at,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            firstName:first_name,
            lastName:last_name
          )
        ),
        quiz_students(count)
      `)
      // Nota: Filtramos is_archived en el componente para asegurar que funcione
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((quiz: any) => ({
      id: quiz.id,
      streamItemId: quiz.stream_item_id,
      type: 'quiz',
      classId: quiz.stream_item?.class_id || '',
      className: quiz.stream_item?.class?.title || 'Sin clase',
      title: quiz.stream_item?.title || '',
      description: quiz.description || undefined,
      points: quiz.points || undefined,
      dueDate: quiz.due_date || undefined,
      dueTime: quiz.due_time || undefined,
      assignToAll: quiz.assign_to_all,
      assignedGroups: quiz.assigned_groups || [],
      isArchived: quiz.stream_item?.is_archived || false,
      createdAt: quiz.created_at,
      author: quiz.stream_item?.author ? {
        id: quiz.stream_item.author.id,
        name: `${quiz.stream_item.author.firstName || ''} ${quiz.stream_item.author.lastName || ''}`.trim() || 'Usuario',
      } : undefined,
      studentCount: quiz.quiz_students?.[0]?.count || 0,
      pendingReviewCount: 0, // Not implemented for Supabase yet
    }));
  } catch (error) {
    console.error('Error loading quizzes:', error);
    throw error;
  }
};

/**
 * Obtener quizzes por clase
 */
export const getQuizzesByClass = async (classId: string, includeArchived: boolean = false): Promise<any[]> => {
  if (USE_JSON_DB) {
    return jsonQuizService.getQuizzesByClassJSON(classId, includeArchived);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localQuizService.getQuizzesByClassLocal(classId, includeArchived);
  }

  try {
    let query = supabase
      .from('quizzes')
      .select(`
        id,
        stream_item_id,
        points,
        due_date,
        due_time,
        description,
        assign_to_all,
        assigned_groups,
        created_at,
        stream_item:stream_items!inner(
          id,
          class_id,
          title,
          content,
          is_archived,
          created_at,
          author:users(
            id,
            firstName:first_name,
            lastName:last_name
          )
        ),
        quiz_students(count)
           `)
      .eq('stream_item.class_id', classId);

    // Nota: Filtramos is_archived en el componente para asegurar que funcione

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((quiz: any) => ({
      id: quiz.id,
      streamItemId: quiz.stream_item_id,
      type: 'quiz',
      classId: quiz.stream_item?.class_id || '',
      title: quiz.stream_item?.title || '',
      description: quiz.description || undefined,
      points: quiz.points || undefined,
      dueDate: quiz.due_date || undefined,
      dueTime: quiz.due_time || undefined,
      assignToAll: quiz.assign_to_all,
      assignedGroups: quiz.assigned_groups || [],
      isArchived: quiz.stream_item?.is_archived || false,
      createdAt: quiz.created_at,
      author: quiz.stream_item?.author ? {
        id: quiz.stream_item.author.id,
        name: `${quiz.stream_item.author.firstName || ''} ${quiz.stream_item.author.lastName || ''}`.trim() || 'Usuario',
      } : undefined,
      studentCount: quiz.quiz_students?.[0]?.count || 0,
      pendingReviewCount: 0, // Not implemented for Supabase yet
    }));
  } catch (error) {
    console.error('Error loading quizzes by class:', error);
    throw error;
  }
};

/**
 * Obtener quizzes para un estudiante específico
 * Considera: assignToAll, quiz_students, y grupo_asignado del estudiante
 */
export const getQuizzesForStudent = async (
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
  if (USE_JSON_DB) {
    return jsonQuizService.getQuizzesForStudentJSON(studentId, studentGrupoAsignado);
  }
  if (USE_LOCAL_DB) {
    return localQuizService.getQuizzesForStudentLocal(studentId, studentGrupoAsignado);
  }

  try {
    // Obtener quizzes asignados directamente al estudiante
    const { data: studentQuizzes, error: studentError } = await supabase
      .from('quizzes')
      .select(`
        *,
        stream_item:stream_items(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes(
            id,
            title
          ),
          author:users(
            id,
            first_name,
            last_name,
            avatar
          )
        ),
        quiz_students!inner(student_id)
      `)
      .eq('stream_item.is_archived', false)
      .eq('quiz_students.student_id', studentId);

    if (studentError && studentError.code !== 'PGRST116') {
      throw studentError;
    }

    // Obtener quizzes con assignToAll = true
    const { data: allQuizzes, error: allError } = await supabase
      .from('quizzes')
      .select(`
        *,
        stream_item:stream_items!quizzes_stream_item_id_fkey(
          id,
          class_id,
          title,
          content,
          author_id,
          created_at,
          is_archived,
          class:classes!stream_items_class_id_fkey(
            id,
            title
          ),
          author:users!stream_items_author_id_fkey(
            id,
            first_name,
            last_name,
            avatar
          )
        )
      `)
      .eq('stream_item.is_archived', false)
      .eq('assign_to_all', true);

    if (allError) throw allError;

    // Si el estudiante tiene grupo_asignado, obtener quizzes asignados a ese grupo
    let groupQuizzes: any[] = [];
    if (studentGrupoAsignado) {
      const { data: groupData, error: groupError } = await supabase
        .from('quizzes')
        .select(`
          *,
          stream_item:stream_items(
            id,
            class_id,
            title,
            content,
            author_id,
            created_at,
            is_archived,
            class:classes(
              id,
              title
            ),
            author:users(
              id,
              first_name,
              last_name,
              avatar
            )
          )
        `)
        .eq('stream_item.is_archived', false)
        .eq('assign_to_all', false)
        .contains('assigned_groups', [studentGrupoAsignado]);

      if (groupError) {
        console.error('Error loading group quizzes:', groupError);
      } else {
        groupQuizzes = groupData || [];
      }
    }

    // Combinar y deduplicar quizzes
    const allQuizzesMap = new Map<string, any>();

    (studentQuizzes || []).forEach((q: any) => {
      if (q.stream_item) {
        allQuizzesMap.set(q.id, {
          id: q.id,
          streamItemId: q.stream_item_id,
          classId: q.stream_item.class_id,
          className: q.stream_item.class?.title || 'Sin clase',
          title: q.stream_item.title,
          description: q.description,
          points: q.points,
          dueDate: q.due_date,
          dueTime: q.due_time,
          assignToAll: q.assign_to_all,
          assignedGroups: q.assigned_groups || [],
          author: {
            id: q.stream_item.author?.id || '',
            name: `${q.stream_item.author?.first_name || ''} ${q.stream_item.author?.last_name || ''}`.trim() || 'Usuario',
            avatar: q.stream_item.author?.avatar,
          },
          createdAt: q.stream_item.created_at,
          isArchived: q.stream_item.is_archived,
        });
      }
    });

    (allQuizzes || []).forEach((q: any) => {
      if (q.stream_item && !allQuizzesMap.has(q.id)) {
        allQuizzesMap.set(q.id, {
          id: q.id,
          streamItemId: q.stream_item_id,
          classId: q.stream_item.class_id,
          className: q.stream_item.class?.title || 'Sin clase',
          title: q.stream_item.title,
          description: q.description,
          points: q.points,
          dueDate: q.due_date,
          dueTime: q.due_time,
          assignToAll: q.assign_to_all,
          assignedGroups: q.assigned_groups || [],
          author: {
            id: q.stream_item.author?.id || '',
            name: `${q.stream_item.author?.first_name || ''} ${q.stream_item.author?.last_name || ''}`.trim() || 'Usuario',
            avatar: q.stream_item.author?.avatar,
          },
          createdAt: q.stream_item.created_at,
          isArchived: q.stream_item.is_archived,
        });
      }
    });

    groupQuizzes.forEach((q: any) => {
      if (q.stream_item && !allQuizzesMap.has(q.id)) {
        allQuizzesMap.set(q.id, {
          id: q.id,
          streamItemId: q.stream_item_id,
          classId: q.stream_item.class_id,
          className: q.stream_item.class?.title || 'Sin clase',
          title: q.stream_item.title,
          description: q.description,
          points: q.points,
          dueDate: q.due_date,
          dueTime: q.due_time,
          assignToAll: q.assign_to_all,
          assignedGroups: q.assigned_groups || [],
          author: {
            id: q.stream_item.author?.id || '',
            name: `${q.stream_item.author?.first_name || ''} ${q.stream_item.author?.last_name || ''}`.trim() || 'Usuario',
            avatar: q.stream_item.author?.avatar,
          },
          createdAt: q.stream_item.created_at,
          isArchived: q.stream_item.is_archived,
        });
      }
    });

    return Array.from(allQuizzesMap.values());
  } catch (error) {
    console.error('Error loading quizzes for student:', error);
    throw error;
  }
};

