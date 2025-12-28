/**
 * Base de datos local para desarrollo usando IndexedDB (Dexie.js)
 * Esta base de datos replica la estructura de Supabase para desarrollo local
 */

import Dexie, { Table } from 'dexie';

// ============================================
// Interfaces basadas en el schema de Prisma
// ============================================

export interface LocalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  avatar?: string;
  passwordHash?: string;
  grupoAsignado?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalClass {
  id: string;
  title: string;
  description?: string;
  classCode: string;
  section?: string;
  subject?: string;
  room?: string;
  teacherId: string;
  moduleId?: string;
  backgroundImage?: string;
  isArchived: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalClassMember {
  id: string;
  classId: string;
  userId: string;
  role: string;
  joinedAt: string;
  status: string;
}

export interface LocalTopic {
  id: string;
  classId: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalStreamItem {
  id: string;
  classId: string | null; // Puede ser null si la clase fue eliminada
  type: 'announcement' | 'assignment' | 'quiz' | 'material';
  title: string;
  content?: string;
  authorId: string;
  topicId?: string;
  className?: string; // Nombre de la clase/materia (para cuando la clase sea eliminada)
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAssignment {
  id: string;
  streamItemId: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  instructions?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  isDeleted: boolean;
  isVisible?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAssignmentStudent {
  id: string;
  assignmentId: string;
  studentId: string;
}

export interface LocalAssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  attachments?: any;
  status: string; // draft, submitted, to_review, reviewed, returned, graded
  grade?: number;
  studentComments?: string; // Comentarios del estudiante
  teacherComments?: string; // Comentarios del profesor
  submittedAt?: string;
  returnedAt?: string;
  gradedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalQuiz {
  id: string;
  streamItemId: string;
  points?: number;
  dueDate?: string;
  dueTime?: string;
  description?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalQuizQuestion {
  id: string;
  quizId: string;
  title: string;
  description?: string;
  type: string;
  required: boolean;
  points: number;
  correctAnswer?: any;
  options?: any;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalQuizStudent {
  id: string;
  quizId: string;
  studentId: string;
}

export interface LocalQuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answers?: any; // Respuestas del estudiante
  status: string; // draft, submitted, to_review, reviewed, graded
  grade?: number;
  studentComments?: string; // Comentarios del estudiante
  teacherComments?: string; // Comentarios del profesor
  submittedAt?: string;
  gradedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMaterial {
  id: string;
  streamItemId: string;
  description?: string;
  assignToAll: boolean;
  assignedGroups: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalMaterialStudent {
  id: string;
  materialId: string;
  studentId: string;
}

export interface LocalAttachment {
  id: string;
  streamItemId: string;
  type: string;
  name: string;
  url?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  order: number;
  createdAt: string;
}

export interface LocalGrade {
  id: string;
  classId: string;
  assignmentId?: string;
  quizId?: string;
  studentId: string;
  pointsEarned?: number;
  maxPoints?: number;
  percentage?: number;
  status: string;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  gradedById?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Clase de base de datos local
// ============================================

export class LocalDatabase extends Dexie {
  users!: Table<LocalUser, string>;
  classes!: Table<LocalClass, string>;
  classMembers!: Table<LocalClassMember, string>;
  topics!: Table<LocalTopic, string>;
  streamItems!: Table<LocalStreamItem, string>;
  assignments!: Table<LocalAssignment, string>;
  assignmentStudents!: Table<LocalAssignmentStudent, string>;
  assignmentSubmissions!: Table<LocalAssignmentSubmission, string>;
  quizzes!: Table<LocalQuiz, string>;
  quizQuestions!: Table<LocalQuizQuestion, string>;
  quizStudents!: Table<LocalQuizStudent, string>;
  quizSubmissions!: Table<LocalQuizSubmission, string>;
  materials!: Table<LocalMaterial, string>;
  materialStudents!: Table<LocalMaterialStudent, string>;
  attachments!: Table<LocalAttachment, string>;
  grades!: Table<LocalGrade, string>;

  constructor() {
    super('HTLocalDB');

    this.version(4).stores({
      // Tablas principales
      users: 'id, email, role, grupoAsignado, isActive, [email+role]',
      classes: 'id, classCode, teacherId, isArchived, [teacherId+isArchived]',
      classMembers: 'id, classId, userId, [classId+userId]',
      topics: 'id, classId',
      streamItems: 'id, classId, type, authorId, isArchived, [classId+type], [classId+isArchived], [type+isArchived]',

      // Assignments
      assignments: 'id, streamItemId, isDeleted, [streamItemId+isDeleted]',
      assignmentStudents: 'id, assignmentId, studentId, [assignmentId+studentId]',
      assignmentSubmissions: 'id, assignmentId, studentId, status, [assignmentId+studentId]',

      // Quizzes
      quizzes: 'id, streamItemId',
      quizQuestions: 'id, quizId, order, [quizId+order]',
      quizStudents: 'id, quizId, studentId, [quizId+studentId]',
      quizSubmissions: 'id, quizId, studentId, status, [quizId+studentId], [quizId+status]',

      // Materials
      materials: 'id, streamItemId',
      materialStudents: 'id, materialId, studentId, [materialId+studentId]',

      // Attachments & Grades
      attachments: 'id, streamItemId, type',
      grades: 'id, classId, studentId, assignmentId, quizId, [classId+studentId]',
    });
  }
}

// Instancia global de la base de datos
export const localDB = new LocalDatabase();

// Función para limpiar la base de datos (útil para desarrollo)
export const clearLocalDB = async () => {
  await localDB.delete();
  await localDB.open();
  console.log('✅ Base de datos local limpiada');
};

// Función para exportar todos los datos como JSON
export const exportLocalDB = async () => {
  const data = {
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

  return JSON.stringify(data, null, 2);
};

// Función para importar datos desde JSON
export const importLocalDB = async (jsonData: string) => {
  const data = JSON.parse(jsonData);

  // Usar transacciones múltiples para evitar el límite de argumentos
  await localDB.transaction('rw', [
    localDB.users, localDB.classes, localDB.classMembers, localDB.topics,
    localDB.streamItems, localDB.assignments, localDB.assignmentStudents,
    localDB.assignmentSubmissions, localDB.quizzes, localDB.quizQuestions,
    localDB.quizStudents, localDB.quizSubmissions, localDB.materials,
    localDB.materialStudents, localDB.attachments, localDB.grades
  ], async () => {
    await localDB.users.bulkPut(data.users || []);
    await localDB.classes.bulkPut(data.classes || []);
    await localDB.classMembers.bulkPut(data.classMembers || []);
    await localDB.topics.bulkPut(data.topics || []);
    await localDB.streamItems.bulkPut(data.streamItems || []);
    await localDB.assignments.bulkPut(data.assignments || []);
    await localDB.assignmentStudents.bulkPut(data.assignmentStudents || []);
    await localDB.assignmentSubmissions.bulkPut(data.assignmentSubmissions || []);
    await localDB.quizzes.bulkPut(data.quizzes || []);
    await localDB.quizQuestions.bulkPut(data.quizQuestions || []);
    await localDB.quizStudents.bulkPut(data.quizStudents || []);
    await localDB.quizSubmissions.bulkPut(data.quizSubmissions || []);
    await localDB.materials.bulkPut(data.materials || []);
    await localDB.materialStudents.bulkPut(data.materialStudents || []);
    await localDB.attachments.bulkPut(data.attachments || []);
    await localDB.grades.bulkPut(data.grades || []);
  });

  console.log('✅ Datos importados a la base de datos local');
};

