/**
 * Cargador de datos desde archivo JSON para desarrollo
 * Permite trabajar con datos dummy en formato JSON y sincronizarlos a IndexedDB
 */

import { localDB } from './localDB';
import type {
  LocalUser,
  LocalClass,
  LocalClassMember,
  LocalTopic,
  LocalStreamItem,
  LocalAssignment,
  LocalAssignmentStudent,
  LocalAssignmentSubmission,
  LocalQuiz,
  LocalQuizQuestion,
  LocalQuizStudent,
  LocalQuizSubmission,
  LocalMaterial,
  LocalMaterialStudent,
  LocalAttachment,
  LocalGrade,
} from './localDB';

export interface DummyData {
  users?: LocalUser[];
  classes?: LocalClass[];
  classMembers?: LocalClassMember[];
  topics?: LocalTopic[];
  streamItems?: LocalStreamItem[];
  assignments?: LocalAssignment[];
  assignmentStudents?: LocalAssignmentStudent[];
  assignmentSubmissions?: LocalAssignmentSubmission[];
  quizzes?: LocalQuiz[];
  quizQuestions?: LocalQuizQuestion[];
  quizStudents?: LocalQuizStudent[];
  quizSubmissions?: LocalQuizSubmission[];
  materials?: LocalMaterial[];
  materialStudents?: LocalMaterialStudent[];
  attachments?: LocalAttachment[];
  grades?: LocalGrade[];
}

/**
 * Cargar datos desde un archivo JSON
 */
export const loadDataFromJSON = async (jsonData: DummyData): Promise<void> => {
  try {
    // Usar transacción para asegurar consistencia
    await localDB.transaction('rw', 
      [
        localDB.users,
        localDB.classes,
        localDB.classMembers,
        localDB.topics,
        localDB.streamItems,
        localDB.assignments,
        localDB.assignmentStudents,
        localDB.assignmentSubmissions,
        localDB.quizzes,
        localDB.quizQuestions,
        localDB.quizStudents,
        localDB.quizSubmissions,
        localDB.materials,
        localDB.materialStudents,
        localDB.attachments,
        localDB.grades,
      ],
      async () => {
        // Limpiar datos existentes (opcional - comentar si quieres mantener datos existentes)
        // await localDB.users.clear();
        // await localDB.classes.clear();
        // ... etc

        // Cargar usuarios
        if (jsonData.users && jsonData.users.length > 0) {
          await localDB.users.bulkPut(jsonData.users);
          console.log(`✅ Cargados ${jsonData.users.length} usuarios`);
        }

        // Cargar clases
        if (jsonData.classes && jsonData.classes.length > 0) {
          await localDB.classes.bulkPut(jsonData.classes);
          console.log(`✅ Cargadas ${jsonData.classes.length} clases`);
        }

        // Cargar miembros de clase
        if (jsonData.classMembers && jsonData.classMembers.length > 0) {
          await localDB.classMembers.bulkPut(jsonData.classMembers);
          console.log(`✅ Cargados ${jsonData.classMembers.length} miembros de clase`);
        }

        // Cargar topics
        if (jsonData.topics && jsonData.topics.length > 0) {
          await localDB.topics.bulkPut(jsonData.topics);
          console.log(`✅ Cargados ${jsonData.topics.length} topics`);
        }

        // Cargar stream items
        if (jsonData.streamItems && jsonData.streamItems.length > 0) {
          await localDB.streamItems.bulkPut(jsonData.streamItems);
          console.log(`✅ Cargados ${jsonData.streamItems.length} stream items`);
        }

        // Cargar assignments
        if (jsonData.assignments && jsonData.assignments.length > 0) {
          await localDB.assignments.bulkPut(jsonData.assignments);
          console.log(`✅ Cargados ${jsonData.assignments.length} assignments`);
        }

        // Cargar assignment students
        if (jsonData.assignmentStudents && jsonData.assignmentStudents.length > 0) {
          await localDB.assignmentStudents.bulkPut(jsonData.assignmentStudents);
          console.log(`✅ Cargados ${jsonData.assignmentStudents.length} assignment students`);
        }

        // Cargar assignment submissions
        if (jsonData.assignmentSubmissions && jsonData.assignmentSubmissions.length > 0) {
          await localDB.assignmentSubmissions.bulkPut(jsonData.assignmentSubmissions);
          console.log(`✅ Cargados ${jsonData.assignmentSubmissions.length} assignment submissions`);
        }

        // Cargar quizzes
        if (jsonData.quizzes && jsonData.quizzes.length > 0) {
          await localDB.quizzes.bulkPut(jsonData.quizzes);
          console.log(`✅ Cargados ${jsonData.quizzes.length} quizzes`);
        }

        // Cargar quiz questions
        if (jsonData.quizQuestions && jsonData.quizQuestions.length > 0) {
          await localDB.quizQuestions.bulkPut(jsonData.quizQuestions);
          console.log(`✅ Cargadas ${jsonData.quizQuestions.length} quiz questions`);
        }

        // Cargar quiz students
        if (jsonData.quizStudents && jsonData.quizStudents.length > 0) {
          await localDB.quizStudents.bulkPut(jsonData.quizStudents);
          console.log(`✅ Cargados ${jsonData.quizStudents.length} quiz students`);
        }

        // Cargar quiz submissions
        if (jsonData.quizSubmissions && jsonData.quizSubmissions.length > 0) {
          await localDB.quizSubmissions.bulkPut(jsonData.quizSubmissions);
          console.log(`✅ Cargados ${jsonData.quizSubmissions.length} quiz submissions`);
        }

        // Cargar materials
        if (jsonData.materials && jsonData.materials.length > 0) {
          await localDB.materials.bulkPut(jsonData.materials);
          console.log(`✅ Cargados ${jsonData.materials.length} materials`);
        }

        // Cargar material students
        if (jsonData.materialStudents && jsonData.materialStudents.length > 0) {
          await localDB.materialStudents.bulkPut(jsonData.materialStudents);
          console.log(`✅ Cargados ${jsonData.materialStudents.length} material students`);
        }

        // Cargar attachments
        if (jsonData.attachments && jsonData.attachments.length > 0) {
          await localDB.attachments.bulkPut(jsonData.attachments);
          console.log(`✅ Cargados ${jsonData.attachments.length} attachments`);
        }

        // Cargar grades
        if (jsonData.grades && jsonData.grades.length > 0) {
          await localDB.grades.bulkPut(jsonData.grades);
          console.log(`✅ Cargadas ${jsonData.grades.length} grades`);
        }
      }
    );

    console.log('✅ Todos los datos cargados desde JSON');
  } catch (error) {
    console.error('❌ Error cargando datos desde JSON:', error);
    throw error;
  }
};

/**
 * Exportar datos desde IndexedDB a formato JSON
 */
export const exportDataToJSON = async (): Promise<DummyData> => {
  try {
    const data: DummyData = {
      users: await localDB.users.toArray(),
      classes: await localDB.classes.toArray(),
      classMembers: await localDB.classMembers.toArray(),
      topics: await localDB.topics.toArray(),
      streamItems: await localDB.streamItems.toArray(),
      assignments: await localDB.assignments.toArray(),
      assignmentStudents: await localDB.assignmentStudents.toArray(),
      assignmentSubmissions: await localDB.assignmentSubmissions.toArray(),
      quizzes: await localDB.quizzes.toArray(),
      quizQuestions: await localDB.quizQuestions.toArray(),
      quizStudents: await localDB.quizStudents.toArray(),
      quizSubmissions: await localDB.quizSubmissions.toArray(),
      materials: await localDB.materials.toArray(),
      materialStudents: await localDB.materialStudents.toArray(),
      attachments: await localDB.attachments.toArray(),
      grades: await localDB.grades.toArray(),
    };

    return data;
  } catch (error) {
    console.error('❌ Error exportando datos a JSON:', error);
    throw error;
  }
};

/**
 * Cargar datos desde el archivo dummy-data.json
 */
export const loadDummyData = async (): Promise<void> => {
  try {
    // Importar el archivo JSON
    const dummyDataModule = await import('../data/dummy-data.json');
    const dummyData = dummyDataModule.default as DummyData;
    
    await loadDataFromJSON(dummyData);
  } catch (error) {
    console.error('❌ Error cargando dummy-data.json:', error);
    throw error;
  }
};

/**
 * Exportar datos desde Supabase a formato JSON
 * Esto sincroniza TODA la información de Supabase al formato JSON
 */
export const exportFromSupabase = async (): Promise<DummyData> => {
  const { supabase } = await import('../config/supabaseClient');
  
  try {
    console.log('🔄 Exportando datos desde Supabase...');
    
    const data: DummyData = {};

    // Exportar usuarios
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw usersError;
    if (users) {
      data.users = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        role: u.role || 'student',
        avatar: u.avatar || undefined,
        passwordHash: u.password_hash || undefined,
        grupoAsignado: u.grupo_asignado || undefined,
        isActive: u.is_active !== false,
        createdAt: u.created_at || new Date().toISOString(),
        updatedAt: u.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.users.length} usuarios`);
    }

    // Exportar clases
    const { data: classes, error: classesError } = await supabase.from('classes').select('*');
    if (classesError) throw classesError;
    if (classes) {
      data.classes = classes.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description || undefined,
        classCode: c.class_code || '',
        section: c.section || undefined,
        subject: c.subject || undefined,
        room: c.room || undefined,
        teacherId: c.teacher_id,
        moduleId: c.module_id || undefined,
        backgroundImage: c.background_image || undefined,
        isArchived: c.is_archived || false,
        status: c.status || 'active',
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportadas ${data.classes.length} clases`);
    }

    // Exportar class members
    const { data: classMembers, error: classMembersError } = await supabase.from('class_members').select('*');
    if (classMembersError) throw classMembersError;
    if (classMembers) {
      data.classMembers = classMembers.map((cm: any) => ({
        id: cm.id,
        classId: cm.class_id,
        userId: cm.user_id,
        role: cm.role || 'student',
        joinedAt: cm.joined_at || new Date().toISOString(),
        status: cm.status || 'active',
      }));
      console.log(`✅ Exportados ${data.classMembers.length} class members`);
    }

    // Exportar stream items
    const { data: streamItems, error: streamItemsError } = await supabase
      .from('stream_items')
      .select(`
        *,
        class:classes!stream_items_class_id_fkey(id, title)
      `);
    if (streamItemsError) throw streamItemsError;
    if (streamItems) {
      data.streamItems = streamItems.map((si: any) => ({
        id: si.id,
        classId: si.class_id,
        type: si.type,
        title: si.title,
        content: si.content || undefined,
        authorId: si.author_id,
        topicId: si.topic_id || undefined,
        className: si.class?.title || undefined,
        isArchived: si.is_archived || false,
        createdAt: si.created_at || new Date().toISOString(),
        updatedAt: si.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.streamItems.length} stream items`);
    }

    // Exportar assignments
    const { data: assignments, error: assignmentsError } = await supabase.from('assignments').select('*');
    if (assignmentsError) throw assignmentsError;
    if (assignments) {
      data.assignments = assignments.map((a: any) => ({
        id: a.id,
        streamItemId: a.stream_item_id,
        points: a.points || undefined,
        dueDate: a.due_date || undefined,
        dueTime: a.due_time || undefined,
        instructions: a.instructions || undefined,
        assignToAll: a.assign_to_all || false,
        assignedGroups: a.assigned_groups || [],
        isDeleted: a.is_deleted || false,
        deletedAt: a.deleted_at || undefined,
        createdAt: a.created_at || new Date().toISOString(),
        updatedAt: a.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.assignments.length} assignments`);
    }

    // Exportar assignment students
    const { data: assignmentStudents, error: assignmentStudentsError } = await supabase.from('assignment_students').select('*');
    if (assignmentStudentsError) throw assignmentStudentsError;
    if (assignmentStudents) {
      data.assignmentStudents = assignmentStudents.map((as: any) => ({
        id: as.id,
        assignmentId: as.assignment_id,
        studentId: as.student_id,
      }));
      console.log(`✅ Exportados ${data.assignmentStudents.length} assignment students`);
    }

    // Exportar assignment submissions
    const { data: assignmentSubmissions, error: assignmentSubmissionsError } = await supabase.from('assignment_submissions').select('*');
    if (assignmentSubmissionsError) throw assignmentSubmissionsError;
    if (assignmentSubmissions) {
      data.assignmentSubmissions = assignmentSubmissions.map((as: any) => ({
        id: as.id,
        assignmentId: as.assignment_id,
        studentId: as.student_id,
        content: as.content || undefined,
        attachments: as.attachments || undefined,
        status: as.status || 'draft',
        grade: as.grade || undefined,
        studentComments: as.student_comments || undefined,
        teacherComments: as.teacher_comments || undefined,
        submittedAt: as.submitted_at || undefined,
        returnedAt: as.returned_at || undefined,
        gradedAt: as.graded_at || undefined,
        reviewedAt: as.reviewed_at || undefined,
        createdAt: as.created_at || new Date().toISOString(),
        updatedAt: as.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.assignmentSubmissions.length} assignment submissions`);
    }

    // Exportar quizzes
    const { data: quizzes, error: quizzesError } = await supabase.from('quizzes').select('*');
    if (quizzesError) throw quizzesError;
    if (quizzes) {
      data.quizzes = quizzes.map((q: any) => ({
        id: q.id,
        streamItemId: q.stream_item_id,
        points: q.points || undefined,
        dueDate: q.due_date || undefined,
        dueTime: q.due_time || undefined,
        description: q.description || undefined,
        assignToAll: q.assign_to_all || false,
        assignedGroups: q.assigned_groups || [],
        createdAt: q.created_at || new Date().toISOString(),
        updatedAt: q.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.quizzes.length} quizzes`);
    }

    // Exportar quiz questions
    const { data: quizQuestions, error: quizQuestionsError } = await supabase.from('quiz_questions').select('*');
    if (quizQuestionsError) throw quizQuestionsError;
    if (quizQuestions) {
      data.quizQuestions = quizQuestions.map((qq: any) => ({
        id: qq.id,
        quizId: qq.quiz_id,
        title: qq.title,
        description: qq.description || undefined,
        type: qq.type,
        required: qq.required || false,
        points: qq.points || 0,
        correctAnswer: qq.correct_answer || undefined,
        options: qq.options || undefined,
        order: qq.order || 0,
        createdAt: qq.created_at || new Date().toISOString(),
        updatedAt: qq.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportadas ${data.quizQuestions.length} quiz questions`);
    }

    // Exportar quiz students
    const { data: quizStudents, error: quizStudentsError } = await supabase.from('quiz_students').select('*');
    if (quizStudentsError) throw quizStudentsError;
    if (quizStudents) {
      data.quizStudents = quizStudents.map((qs: any) => ({
        id: qs.id,
        quizId: qs.quiz_id,
        studentId: qs.student_id,
      }));
      console.log(`✅ Exportados ${data.quizStudents.length} quiz students`);
    }

    // Exportar quiz submissions
    const { data: quizSubmissions, error: quizSubmissionsError } = await supabase.from('quiz_submissions').select('*');
    if (quizSubmissionsError) throw quizSubmissionsError;
    if (quizSubmissions) {
      data.quizSubmissions = quizSubmissions.map((qs: any) => ({
        id: qs.id,
        quizId: qs.quiz_id,
        studentId: qs.student_id,
        answers: qs.answers || undefined,
        status: qs.status || 'draft',
        grade: qs.grade || undefined,
        studentComments: qs.student_comments || undefined,
        teacherComments: qs.teacher_comments || undefined,
        submittedAt: qs.submitted_at || undefined,
        gradedAt: qs.graded_at || undefined,
        reviewedAt: qs.reviewed_at || undefined,
        createdAt: qs.created_at || new Date().toISOString(),
        updatedAt: qs.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.quizSubmissions.length} quiz submissions`);
    }

    // Exportar materials
    const { data: materials, error: materialsError } = await supabase.from('materials').select('*');
    if (materialsError) throw materialsError;
    if (materials) {
      data.materials = materials.map((m: any) => ({
        id: m.id,
        streamItemId: m.stream_item_id,
        description: m.description || undefined,
        assignToAll: m.assign_to_all || false,
        assignedGroups: m.assigned_groups || [],
        createdAt: m.created_at || new Date().toISOString(),
        updatedAt: m.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.materials.length} materials`);
    }

    // Exportar material students
    const { data: materialStudents, error: materialStudentsError } = await supabase.from('material_students').select('*');
    if (materialStudentsError) throw materialStudentsError;
    if (materialStudents) {
      data.materialStudents = materialStudents.map((ms: any) => ({
        id: ms.id,
        materialId: ms.material_id,
        studentId: ms.student_id,
      }));
      console.log(`✅ Exportados ${data.materialStudents.length} material students`);
    }

    // Exportar attachments
    const { data: attachments, error: attachmentsError } = await supabase.from('attachments').select('*');
    if (attachmentsError) throw attachmentsError;
    if (attachments) {
      data.attachments = attachments.map((att: any) => ({
        id: att.id,
        streamItemId: att.stream_item_id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size || undefined,
        mimeType: att.mime_type || undefined,
        order: att.order || 0,
        createdAt: att.created_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.attachments.length} attachments`);
    }

    // Exportar grades
    const { data: grades, error: gradesError } = await supabase.from('grades').select('*');
    if (gradesError) throw gradesError;
    if (grades) {
      data.grades = grades.map((g: any) => ({
        id: g.id,
        classId: g.class_id,
        assignmentId: g.assignment_id || undefined,
        quizId: g.quiz_id || undefined,
        studentId: g.student_id,
        pointsEarned: g.points_earned || undefined,
        maxPoints: g.max_points || undefined,
        percentage: g.percentage || undefined,
        status: g.status || 'pending',
        feedback: g.feedback || undefined,
        submittedAt: g.submitted_at || undefined,
        gradedAt: g.graded_at || undefined,
        gradedById: g.graded_by_id || undefined,
        createdAt: g.created_at || new Date().toISOString(),
        updatedAt: g.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportadas ${data.grades.length} grades`);
    }

    // Exportar topics
    const { data: topics, error: topicsError } = await supabase.from('topics').select('*');
    if (topicsError) throw topicsError;
    if (topics) {
      data.topics = topics.map((t: any) => ({
        id: t.id,
        classId: t.class_id,
        name: t.name,
        description: t.description || undefined,
        order: t.order || 0,
        createdAt: t.created_at || new Date().toISOString(),
        updatedAt: t.updated_at || new Date().toISOString(),
      }));
      console.log(`✅ Exportados ${data.topics.length} topics`);
    }

    console.log('✅ Exportación desde Supabase completada');
    return data;
  } catch (error) {
    console.error('❌ Error exportando desde Supabase:', error);
    throw error;
  }
};

