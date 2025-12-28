/**
 * Base de datos simulada usando JSON en memoria
 * Para desarrollo rápido sin IndexedDB ni Supabase
 * 
 * Los datos se cargan desde dummy-data.json y se mantienen en memoria
 * Todas las operaciones CRUD se hacen sobre estos datos en memoria
 */

import type { DummyData } from './jsonDataLoader';
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

class JSONDatabase {
  private data: DummyData = {
    users: [],
    classes: [],
    classMembers: [],
    topics: [],
    streamItems: [],
    assignments: [],
    assignmentStudents: [],
    assignmentSubmissions: [],
    quizzes: [],
    quizQuestions: [],
    quizStudents: [],
    quizSubmissions: [],
    materials: [],
    materialStudents: [],
    attachments: [],
    grades: [],
  };

  private initialized = false;
  private saveTimeout: any = null;

  /**
   * Guardar cambios en el archivo JSON (via servidor Vite)
   * Debounced para evitar demasiadas escrituras
   */
  private saveToFile(): void {
    return; // Feature disabled to prevent dev server errors as per user request
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      try {
        console.log('💾 Guardando cambios en dummy-data.json...');
        const response = await fetch('/api/__save-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.data)
        });

        if (response.ok) {
          console.log('✅ Cambios guardados exitosamente');
        } else {
          console.error('❌ Error guardando cambios (Server responded with error):', response.status);
        }
      } catch (error) {
        console.error('❌ Error guardando cambios:', error);
      }
    }, 1000); // Esperar 1 segundo de inactividad antes de guardar
  }

  /**
   * Inicializar la base de datos desde el archivo JSON
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Importar el JSON - Vite maneja automáticamente los imports de JSON
      // @ts-ignore
      const dummyDataModule = await import('../data/dummy-data.json');
      // El JSON puede venir como default o directamente
      const importedData = (dummyDataModule.default || dummyDataModule) as DummyData;
      this.data = importedData;
      this.initialized = true;
      console.log('✅ Base de datos JSON inicializada desde dummy-data.json');
      console.log(`📊 Cargados: ${this.data.users?.length || 0} usuarios, ${this.data.classes?.length || 0} clases`);
    } catch (error) {
      console.error('❌ Error inicializando base de datos JSON:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  getUsers(): LocalUser[] {
    return this.data.users || [];
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(id: string): LocalUser | undefined {
    return this.data.users?.find(u => u.id === id);
  }

  /**
   * Obtener usuario por email
   */
  getUserByEmail(email: string): LocalUser | undefined {
    return this.data.users?.find(u => u.email === email);
  }

  /**
   * Agregar o actualizar usuario
   */
  putUser(user: LocalUser): void {
    if (!this.data.users) this.data.users = [];
    const index = this.data.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.data.users[index] = user;
    } else {
      this.data.users.push(user);
    }
    this.saveToFile();
  }

  /**
   * Obtener todas las clases
   */
  getClasses(): LocalClass[] {
    return this.data.classes || [];
  }

  /**
   * Obtener clase por ID
   */
  getClassById(id: string): LocalClass | undefined {
    return this.data.classes?.find(c => c.id === id);
  }

  /**
   * Agregar o actualizar clase
   */
  putClass(cls: LocalClass): void {
    if (!this.data.classes) this.data.classes = [];
    const index = this.data.classes.findIndex(c => c.id === cls.id);
    if (index >= 0) {
      this.data.classes[index] = cls;
    } else {
      this.data.classes.push(cls);
    }
    this.saveToFile();
  }

  /**
   * Eliminar clase por ID
   */
  deleteClass(id: string): void {
    if (!this.data.classes) return;
    this.data.classes = this.data.classes.filter(c => c.id !== id);
    this.saveToFile();
  }

  /**
   * Desvincular stream items de una clase (optimizado)
   */
  unlinkStreamItemsFromClass(classId: string): void {
    if (!this.data.streamItems) return;

    let modified = false;
    this.data.streamItems.forEach(item => {
      if (item.classId === classId) {
        (item as any).classId = null;
        modified = true;
      }
    });

    if (modified) {
      this.saveToFile();
    }
  }

  /**
   * Obtener miembros de clase
   */
  getClassMembers(): LocalClassMember[] {
    return this.data.classMembers || [];
  }

  /**
   * Agregar o actualizar miembro de clase
   */
  putClassMember(member: LocalClassMember): void {
    if (!this.data.classMembers) this.data.classMembers = [];
    const index = this.data.classMembers.findIndex(m => m.id === member.id);
    if (index >= 0) {
      this.data.classMembers[index] = member;
    } else {
      this.data.classMembers.push(member);
    }
    this.saveToFile();
  }

  /**
   * Obtener stream items
   */
  getStreamItems(): LocalStreamItem[] {
    return this.data.streamItems || [];
  }

  /**
   * Obtener stream item por ID
   */
  getStreamItemById(id: string): LocalStreamItem | undefined {
    return this.data.streamItems?.find(si => si.id === id);
  }

  /**
   * Agregar o actualizar stream item
   */
  putStreamItem(item: LocalStreamItem): void {
    if (!this.data.streamItems) this.data.streamItems = [];
    const index = this.data.streamItems.findIndex(si => si.id === item.id);
    if (index >= 0) {
      this.data.streamItems[index] = item;
    } else {
      this.data.streamItems.push(item);
    }
    this.saveToFile();
  }

  /**
   * Obtener assignments
   */
  getAssignments(): LocalAssignment[] {
    return this.data.assignments || [];
  }

  /**
   * Obtener assignment por ID
   */
  getAssignmentById(id: string): LocalAssignment | undefined {
    return this.data.assignments?.find(a => a.id === id);
  }

  /**
   * Obtener assignment por streamItemId
   */
  getAssignmentByStreamItemId(streamItemId: string): LocalAssignment | undefined {
    return this.data.assignments?.find(a => a.streamItemId === streamItemId);
  }

  /**
   * Agregar o actualizar assignment
   */
  putAssignment(assignment: LocalAssignment): void {
    if (!this.data.assignments) this.data.assignments = [];
    const index = this.data.assignments.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      this.data.assignments[index] = assignment;
    } else {
      this.data.assignments.push(assignment);
    }
    this.saveToFile();
  }

  /**
   * Obtener assignment students
   */
  getAssignmentStudents(): LocalAssignmentStudent[] {
    return this.data.assignmentStudents || [];
  }

  /**
   * Agregar o actualizar assignment student
   */
  putAssignmentStudent(as: LocalAssignmentStudent): void {
    if (!this.data.assignmentStudents) this.data.assignmentStudents = [];
    const index = this.data.assignmentStudents.findIndex(a => a.id === as.id);
    if (index >= 0) {
      this.data.assignmentStudents[index] = as;
    } else {
      this.data.assignmentStudents.push(as);
    }
    this.saveToFile();
  }

  /**
   * Eliminar assignment student
   */
  deleteAssignmentStudent(id: string): void {
    if (!this.data.assignmentStudents) return;
    this.data.assignmentStudents = this.data.assignmentStudents.filter(as => as.id !== id);
    this.saveToFile();
  }

  /**
   * Obtener assignment submissions
   */
  getAssignmentSubmissions(): LocalAssignmentSubmission[] {
    return this.data.assignmentSubmissions || [];
  }

  /**
   * Agregar o actualizar assignment submission
   */
  putAssignmentSubmission(submission: LocalAssignmentSubmission): void {
    if (!this.data.assignmentSubmissions) this.data.assignmentSubmissions = [];
    const index = this.data.assignmentSubmissions.findIndex(s => s.id === submission.id);
    if (index >= 0) {
      this.data.assignmentSubmissions[index] = submission;
    } else {
      this.data.assignmentSubmissions.push(submission);
    }
    this.saveToFile();
  }

  /**
   * Obtener quizzes
   */
  getQuizzes(): LocalQuiz[] {
    return this.data.quizzes || [];
  }

  /**
   * Obtener quiz por ID
   */
  getQuizById(id: string): LocalQuiz | undefined {
    return this.data.quizzes?.find(q => q.id === id);
  }

  /**
   * Obtener quiz por streamItemId
   */
  getQuizByStreamItemId(streamItemId: string): LocalQuiz | undefined {
    return this.data.quizzes?.find(q => q.streamItemId === streamItemId);
  }

  /**
   * Agregar o actualizar quiz
   */
  putQuiz(quiz: LocalQuiz): void {
    if (!this.data.quizzes) this.data.quizzes = [];
    const index = this.data.quizzes.findIndex(q => q.id === quiz.id);
    if (index >= 0) {
      this.data.quizzes[index] = quiz;
    } else {
      this.data.quizzes.push(quiz);
    }
    this.saveToFile();
  }

  /**
   * Obtener quiz questions
   */
  getQuizQuestions(): LocalQuizQuestion[] {
    return this.data.quizQuestions || [];
  }

  /**
   * Agregar o actualizar quiz question
   */
  putQuizQuestion(question: LocalQuizQuestion): void {
    if (!this.data.quizQuestions) this.data.quizQuestions = [];
    const index = this.data.quizQuestions.findIndex(q => q.id === question.id);
    if (index >= 0) {
      this.data.quizQuestions[index] = question;
    } else {
      this.data.quizQuestions.push(question);
    }
    this.saveToFile();
  }

  /**
   * Obtener quiz students
   */
  getQuizStudents(): LocalQuizStudent[] {
    return this.data.quizStudents || [];
  }

  /**
   * Agregar o actualizar quiz student
   */
  putQuizStudent(qs: LocalQuizStudent): void {
    if (!this.data.quizStudents) this.data.quizStudents = [];
    const index = this.data.quizStudents.findIndex(q => q.id === qs.id);
    if (index >= 0) {
      this.data.quizStudents[index] = qs;
    } else {
      this.data.quizStudents.push(qs);
    }
    this.saveToFile();
  }

  /**
   * Eliminar quiz student
   */
  deleteQuizStudent(id: string): void {
    if (!this.data.quizStudents) return;
    this.data.quizStudents = this.data.quizStudents.filter(qs => qs.id !== id);
    this.saveToFile();
  }

  /**
   * Obtener quiz submissions
   */
  getQuizSubmissions(): LocalQuizSubmission[] {
    return this.data.quizSubmissions || [];
  }

  /**
   * Agregar o actualizar quiz submission
   */
  putQuizSubmission(submission: LocalQuizSubmission): void {
    if (!this.data.quizSubmissions) this.data.quizSubmissions = [];
    const index = this.data.quizSubmissions.findIndex(s => s.id === submission.id);
    if (index >= 0) {
      this.data.quizSubmissions[index] = submission;
    } else {
      this.data.quizSubmissions.push(submission);
    }
    this.saveToFile();
  }

  /**
   * Obtener quiz submission por ID
   */
  getQuizSubmissionById(id: string): LocalQuizSubmission | undefined {
    return this.data.quizSubmissions?.find(s => s.id === id);
  }

  /**
   * Obtener materials
   */
  getMaterials(): LocalMaterial[] {
    return this.data.materials || [];
  }

  /**
   * Obtener material por ID
   */
  getMaterialById(id: string): LocalMaterial | undefined {
    return this.data.materials?.find(m => m.id === id);
  }

  /**
   * Obtener material por streamItemId
   */
  getMaterialByStreamItemId(streamItemId: string): LocalMaterial | undefined {
    return this.data.materials?.find(m => m.streamItemId === streamItemId);
  }

  /**
   * Agregar o actualizar material
   */
  putMaterial(material: LocalMaterial): void {
    if (!this.data.materials) this.data.materials = [];
    const index = this.data.materials.findIndex(m => m.id === material.id);
    if (index >= 0) {
      this.data.materials[index] = material;
    } else {
      this.data.materials.push(material);
    }
    this.saveToFile();
  }

  /**
   * Obtener material students
   */
  getMaterialStudents(): LocalMaterialStudent[] {
    return this.data.materialStudents || [];
  }

  /**
   * Agregar o actualizar material student
   */
  putMaterialStudent(ms: LocalMaterialStudent): void {
    if (!this.data.materialStudents) this.data.materialStudents = [];
    const index = this.data.materialStudents.findIndex(m => m.id === ms.id);
    if (index >= 0) {
      this.data.materialStudents[index] = ms;
    } else {
      this.data.materialStudents.push(ms);
    }
    this.saveToFile();
  }

  /**
   * Eliminar material student
   */
  deleteMaterialStudent(id: string): void {
    if (!this.data.materialStudents) return;
    this.data.materialStudents = this.data.materialStudents.filter(ms => ms.id !== id);
    this.saveToFile();
  }

  /**
   * Obtener attachments
   */
  getAttachments(): LocalAttachment[] {
    return this.data.attachments || [];
  }

  /**
   * Agregar o actualizar attachment
   */
  putAttachment(attachment: LocalAttachment): void {
    if (!this.data.attachments) this.data.attachments = [];
    const index = this.data.attachments.findIndex(a => a.id === attachment.id);
    if (index >= 0) {
      this.data.attachments[index] = attachment;
    } else {
      this.data.attachments.push(attachment);
    }
    this.saveToFile();
  }

  /**
   * Obtener topics
   */
  getTopics(): LocalTopic[] {
    return this.data.topics || [];
  }

  /**
   * Agregar o actualizar topic
   */
  putTopic(topic: LocalTopic): void {
    if (!this.data.topics) this.data.topics = [];
    const index = this.data.topics.findIndex(t => t.id === topic.id);
    if (index >= 0) {
      this.data.topics[index] = topic;
    } else {
      this.data.topics.push(topic);
    }
    this.saveToFile();
  }

  /**
   * Obtener grades
   */
  getGrades(): LocalGrade[] {
    return this.data.grades || [];
  }

  /**
   * Agregar o actualizar grade
   */
  putGrade(grade: LocalGrade): void {
    if (!this.data.grades) this.data.grades = [];
    const index = this.data.grades.findIndex(g => g.id === grade.id);
    if (index >= 0) {
      this.data.grades[index] = grade;
    } else {
      this.data.grades.push(grade);
    }
    this.saveToFile();
  }

  /**
   * Exportar todos los datos
   */
  exportData(): DummyData {
    return { ...this.data };
  }

  /**
   * Importar datos (reemplaza todos los datos actuales)
   */
  importData(data: DummyData): void {
    this.data = { ...data };
  }

  /**
   * Limpiar todos los datos
   */
  clear(): void {
    this.data = {
      users: [],
      classes: [],
      classMembers: [],
      topics: [],
      streamItems: [],
      assignments: [],
      assignmentStudents: [],
      assignmentSubmissions: [],
      quizzes: [],
      quizQuestions: [],
      quizStudents: [],
      quizSubmissions: [],
      materials: [],
      materialStudents: [],
      attachments: [],
      grades: [],
    };
  }
}

// Instancia global de la base de datos JSON
export const jsonDB = new JSONDatabase();

