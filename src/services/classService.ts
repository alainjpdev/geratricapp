/**
 * Servicio para interactuar con clases en Supabase
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localClassService from './localClassService';
import * as jsonClassService from './jsonClassService';
import { useAuthStore } from '../store/authStore';

export interface ClassData {
  id?: string;
  title: string;
  description?: string;
  classCode?: string;
  section?: string;
  subject?: string;
  room?: string;
  teacherId: string;
  moduleId?: string;
  backgroundImage?: string;
  isArchived?: boolean;
  status?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  module?: {
    id: string;
    title: string;
  };
}

export interface StreamItemData {
  id?: string;
  classId: string;
  type: 'announcement' | 'assignment' | 'quiz' | 'material';
  title: string;
  content?: string;
  authorId: string;
  topicId?: string;
  attachments?: Array<{
    type: string;
    name: string;
    url?: string;
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

/**
 * Cargar todas las clases de un profesor (o todas si es admin)
 */
export const loadClasses = async (teacherId: string): Promise<ClassData[]> => {
  // En modo JSON, usar JSON en memoria
  if (USE_JSON_DB) {
    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';
    return jsonClassService.loadClassesJSON(teacherId, isAdmin);
  }

  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';
    return localClassService.loadClassesLocal(teacherId, isAdmin);
  }

  try {
    // Auth Check: Use custom auth store or provided teacherId
    // Auth Check: Use custom auth store or provided teacherId
    const currentUser = useAuthStore.getState().user;
    const realTeacherId = teacherId || currentUser?.id;

    if (!realTeacherId) {
      console.warn('Authentication check failed: No teacherId available');
      throw new Error('Usuario no autenticado');
    }

    // Role Check
    const isAdmin = currentUser?.role === 'admin';

    // Construct Query
    let query = supabase
      .from('classes')
      .select(`
        *,
        teacher:users!classes_teacher_id_fkey(id, firstName:first_name, lastName:last_name),
        module:modules(id, title)
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    // Filter if not admin
    if (!isAdmin) {
      query = query.eq('teacher_id', realTeacherId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return (data || []).map((cls: any) => ({
      id: cls.id,
      title: cls.title,
      description: cls.description || undefined,
      classCode: cls.class_code,
      section: cls.section || undefined,
      subject: cls.subject || undefined,
      room: cls.room || undefined,
      teacherId: cls.teacher_id,
      moduleId: cls.module_id || undefined,
      backgroundImage: cls.background_image || undefined,
      isArchived: cls.is_archived,
      status: cls.status,
      teacher: cls.teacher ? {
        id: cls.teacher.id,
        firstName: cls.teacher.firstName,
        lastName: cls.teacher.lastName,
      } : undefined,
      module: cls.module ? {
        id: cls.module.id,
        title: cls.module.title,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error loading classes:', error);
    throw error;
  }
};

/**
 * Cargar una clase por ID
 */
export const loadClass = async (classId: string): Promise<ClassData | null> => {
  if (USE_JSON_DB) {
    return jsonClassService.loadClassJSON(classId);
  }
  if (USE_LOCAL_DB) {
    return localClassService.loadClassLocal(classId);
  }

  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher: users!classes_teacher_id_fkey(id, firstName: first_name, lastName: last_name),
          module: modules(id, title)
            `)
      .eq('id', classId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      classCode: data.class_code,
      section: data.section || undefined,
      subject: data.subject || undefined,
      room: data.room || undefined,
      teacherId: data.teacher_id,
      moduleId: data.module_id || undefined,
      backgroundImage: data.background_image || undefined,
      isArchived: data.is_archived,
      status: data.status,
      teacher: data.teacher ? {
        id: data.teacher.id,
        firstName: data.teacher.firstName,
        lastName: data.teacher.lastName,
      } : undefined,
      module: data.module ? {
        id: data.module.id,
        title: data.module.title,
      } : undefined,
    };
  } catch (error) {
    console.error('Error loading class:', error);
    throw error;
  }
};

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
 * Obtener o crear usuario en la tabla users basado en el ID de Supabase Auth
 */
const getOrCreateUserFromAuthId = async (authUserId: string, email?: string): Promise<string> => {
  // Obtener información del usuario de Supabase Auth primero
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('Usuario no autenticado');
  }

  // Usar el email del usuario autenticado si está disponible
  const userEmail = authUser.email || email;

  // Primero intentar buscar por el ID de auth directamente
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUserId)
    .single();

  if (user && !userError) {
    return user.id;
  }

  // Si no existe, buscar por email del usuario autenticado
  if (userEmail) {
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', userEmail)
      .single();

    if (userByEmail && !emailError) {
      // IMPORTANTE: Si encontramos el usuario por email, usar su ID existente
      // No intentar cambiar el ID porque puede causar problemas de foreign key
      // En su lugar, devolver el ID que ya existe en la tabla
      return userByEmail.id;
    }
  }

  // Usar el mismo ID de Supabase Auth para mantener consistencia
  const userId = authUser.id;
  const now = new Date().toISOString();

  // Determinar el rol: usar el de user_metadata o buscar en la tabla users por email
  let userRole = authUser.user_metadata?.role || 'teacher';

  // Si no hay rol en metadata, intentar obtenerlo de la tabla users si existe
  if (!authUser.user_metadata?.role && userEmail) {
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('role')
      .eq('email', userEmail)
      .single();

    if (existingUserByEmail?.role) {
      userRole = existingUserByEmail.role;
    }
  }

  // Si es admin, asegurarse de que el rol sea 'admin'
  if (authUser.user_metadata?.role === 'admin' || userRole === 'admin') {
    userRole = 'admin';
  }

  const { error: createError } = await supabase
    .from('users')
    .insert({
      id: userId, // Usar el mismo ID de Supabase Auth
      email: userEmail || '',
      first_name: authUser.user_metadata?.firstName || '',
      last_name: authUser.user_metadata?.lastName || '',
      role: userRole, // Usar el rol correcto (admin, teacher, etc.)
      avatar: authUser.user_metadata?.avatar || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

  if (createError) {
    console.error('Error creating user:', createError);
    // Si el error es que el usuario ya existe (por race condition), intentar obtenerlo de nuevo
    if (createError.code === '23505') { // Unique violation
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        return existingUser.id;
      }
    }
    throw new Error('No se pudo crear el usuario en la base de datos: ' + createError.message);
  }

  return userId;
};

/**
 * Crear una nueva clase
 */
export const createClass = async (data: ClassData): Promise<ClassData> => {
  if (USE_JSON_DB) {
    return jsonClassService.createClassJSON(data);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localClassService.createClassLocal(data);
  }

  try {
    // Modificado para usar importación estática y evitar problemas de instancia
    const currentUser = useAuthStore.getState().user;

    console.log('🏗️ createClass calling with user:', currentUser ? `${currentUser.firstName} (${currentUser.role})` : 'NULL');

    if (!currentUser) {
      throw new Error('Usuario no autenticado (createClass service)');
    }

    // Determinar el teacherId:
    // Si es admin, puede especificar el teacherId.
    // Si no es admin (o no especificó), usar el ID del usuario actual.
    const isAdmin = currentUser.role === 'admin';
    // Si envían un teacherId y es admin, lo respetamos. Si no, forzamos el ID del usuario logueado.
    const teacherId = (isAdmin && data.teacherId) ? data.teacherId : currentUser.id;

    // Generar UUID para el ID
    const classId = generateUUID();

    // Generar código de clase único si no se proporciona
    let classCode = data.classCode;
    if (!classCode) {
      classCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      // Verificar que sea único
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('class_code', classCode)
        .maybeSingle();

      if (existing) {
        classCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      }
    }

    const now = new Date().toISOString();

    // Check for upsert by title
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id')
      .eq('title', data.title)
      .eq('teacher_id', teacherId)
      // .eq('is_archived', false) // Optional: restrict to active classes? 
      // User request implies ANY existing class.
      .maybeSingle();

    let resultData;
    let resultError;

    if (existingClass) {
      console.log('⚠️ Clase ya existe (Supabase), mostrando error al usuario:', data.title);
      throw new Error('A class with this name already exists.');
    } else {
      // Create new
      const { data: newClass, error: insertError } = await supabase
        .from('classes')
        .insert({
          id: classId,
          title: data.title,
          description: data.description,
          class_code: classCode,
          section: data.section,
          subject: data.subject,
          room: data.room,
          teacher_id: teacherId,
          module_id: data.moduleId,
          background_image: data.backgroundImage,
          status: data.status || 'active',
          created_at: now,
          updated_at: now,
        })
        .select(`
              *,
              teacher: users!classes_teacher_id_fkey(id, firstName: first_name, lastName: last_name)
                `)
        .single();

      resultData = newClass;
      resultError = insertError;
    }

    if (resultError) throw resultError;
    if (!resultData) throw new Error('Failed to create/update class');

    const newClass = resultData; // Normalize variable name for return

    // Fallback variable for return object (originally used 'newClass')
    // Changing logic structure to match return interface
    return {
      id: newClass.id,
      title: newClass.title,
      description: newClass.description || undefined,
      classCode: newClass.class_code,
      section: newClass.section || undefined,
      subject: newClass.subject || undefined,
      room: newClass.room || undefined,
      teacherId: newClass.teacher_id,
      moduleId: newClass.module_id || undefined,
      backgroundImage: newClass.background_image || undefined,
      isArchived: newClass.is_archived,
      status: newClass.status,
      teacher: newClass.teacher ? {
        id: newClass.teacher.id,
        firstName: newClass.teacher.firstName,
        lastName: newClass.teacher.lastName,
      } : undefined,
    };
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

/**
 * Actualizar una clase
 */
export const updateClass = async (classId: string, data: Partial<ClassData>): Promise<ClassData> => {
  if (USE_JSON_DB) {
    return jsonClassService.updateClassJSON(classId, data);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localClassService.updateClassLocal(classId, data);
  }

  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.room !== undefined) updateData.room = data.room;
    if (data.moduleId !== undefined) updateData.module_id = data.moduleId;
    if (data.backgroundImage !== undefined) updateData.background_image = data.backgroundImage;
    if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updated, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId)
      .select(`
                *,
                teacher: users!classes_teacher_id_fkey(id, firstName: first_name, lastName: last_name),
                  module: modules(id, title)
                    `)
      .single();

    if (error) throw error;
    if (!updated) throw new Error('Failed to update class');

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description || undefined,
      classCode: updated.class_code,
      section: updated.section || undefined,
      subject: updated.subject || undefined,
      room: updated.room || undefined,
      teacherId: updated.teacher_id,
      moduleId: updated.module_id || undefined,
      backgroundImage: updated.background_image || undefined,
      isArchived: updated.is_archived,
      status: updated.status,
      teacher: updated.teacher ? {
        id: updated.teacher.id,
        firstName: updated.teacher.firstName,
        lastName: updated.teacher.lastName,
      } : undefined,
      module: updated.module ? {
        id: updated.module.id,
        title: updated.module.title,
      } : undefined,
    };
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

/**
 * Archivar una clase
 */
export const archiveClass = async (classId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonClassService.archiveClassJSON(classId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localClassService.archiveClassLocal(classId);
  }

  try {
    const { error } = await supabase
      .from('classes')
      .update({
        is_archived: true,
        status: 'archived',
      })
      .eq('id', classId);

    if (error) throw error;
  } catch (error) {
    console.error('Error archiving class:', error);
    throw error;
  }
};

/**
 * Desarchivar una clase
 */
export const unarchiveClass = async (classId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonClassService.unarchiveClassJSON(classId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localClassService.unarchiveClassLocal(classId);
  }

  try {
    const { error } = await supabase
      .from('classes')
      .update({
        is_archived: false,
        status: 'active',
      })
      .eq('id', classId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unarchiving class:', error);
    throw error;
  }
};

/**
 * Eliminar una clase (hard delete)
 * NOTA: Los streamItems y assignments NO se borran, solo se desvinculan de la clase
 * Esto preserva los datos históricos en la base de datos
 */
export const deleteClass = async (classId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonClassService.deleteClassJSON(classId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localClassService.deleteClassLocal(classId);
  }

  try {
    // Primero, desvincular todos los streamItems de esta clase (poner classId a null)
    // Esto evita que se borren en cascada
    const { error: streamItemsError } = await supabase
      .from('stream_items')
      .update({ class_id: null })
      .eq('class_id', classId);

    if (streamItemsError) {
      console.error('Error updating stream items:', streamItemsError);
      // Continuar con la eliminación de la clase aunque falle la actualización
    }

    // Ahora eliminar la clase
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};

/**
 * Cargar todas las clases archivadas
 */
export const loadArchivedClasses = async (): Promise<ClassData[]> => {
  if (USE_JSON_DB) {
    return jsonClassService.loadArchivedClassesJSON();
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localClassService.loadArchivedClassesLocal();
  }

  try {
    // Auth Check: Use custom auth store or provided teacherId
    const currentUser = useAuthStore.getState().user;
    const realTeacherId = currentUser?.id; // Assuming teacherId is not passed as an argument to loadArchivedClasses

    if (!realTeacherId) {
      console.warn('Authentication check failed: No teacherId available');
      throw new Error('Usuario no autenticado');
    }

    // Role Check: Trust the store (fastest) or query DB (more secure, but RLS might block if anon)
    const isAdmin = currentUser?.role === 'admin';

    // Construct Query
    let query = supabase
      .from('classes')
      .select(`
                    *,
                    teacher: users!classes_teacher_id_fkey(id, firstName: first_name, lastName: last_name),
                      module: modules(id, title)
                        `)
      .order('created_at', { ascending: false });

    // Filter if not admin
    if (!isAdmin) {
      // For archived classes, we specifically want is_archived: true
      query = query.eq('teacher_id', realTeacherId).eq('is_archived', true);
    } else {
      // Admins see all archived classes
      query = query.eq('is_archived', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    return (data || []).map((cls: any) => ({
      id: cls.id,
      title: cls.title,
      description: cls.description || undefined,
      classCode: cls.class_code,
      section: cls.section || undefined,
      subject: cls.subject || undefined,
      room: cls.room || undefined,
      teacherId: cls.teacher_id,
      moduleId: cls.module_id || undefined,
      backgroundImage: cls.background_image || undefined,
      isArchived: cls.is_archived,
      status: cls.status,
      teacher: cls.teacher ? {
        id: cls.teacher.id,
        firstName: cls.teacher.firstName,
        lastName: cls.teacher.lastName,
      } : undefined,
      module: cls.module ? {
        id: cls.module.id,
        title: cls.module.title,
      } : undefined,
    }));
  } catch (error) {
    console.error('Error loading archived classes:', error);
    throw error;
  }
};

/**
 * Obtener clases de un estudiante (donde es miembro)
 */
export const getStudentClasses = async (studentId: string): Promise<ClassData[]> => {
  if (USE_JSON_DB) {
    return jsonClassService.getStudentClassesJSON(studentId);
  }
  if (USE_LOCAL_DB) {
    return localClassService.getStudentClassesLocal(studentId);
  }
  try {
    const { data, error } = await supabase
      .from('class_members')
      .select(`
  class: classes!inner(
    id, title, description, class_code, section, subject, room, is_archived, status, created_at, updated_at,
    teacher: users!classes_teacher_id_fkey(id, firstName: first_name, lastName: last_name),
    module: modules(id, title)
  )
    `)
      .eq('user_id', studentId)
      .eq('role', 'student')
      .eq('class.is_archived', false)
      .eq('class.is_archived', false);
    // .order('joined_at', { ascending: false });

    console.log('Fetching student classes without order');

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('Sample class member keys:', Object.keys(data[0]));
      // @ts-ignore
      if (data[0].class) console.log('Sample class keys:', Object.keys(data[0].class));
    }

    return (data || []).map((cm: any) => ({
      id: cm.class.id,
      title: cm.class.title,
      description: cm.class.description,
      classCode: cm.class.class_code,
      section: cm.class.section,
      subject: cm.class.subject,
      room: cm.class.room,
      teacherId: cm.class.teacher?.id,
      teacher: cm.class.teacher ? {
        id: cm.class.teacher.id,
        firstName: cm.class.teacher.firstName,
        lastName: cm.class.teacher.lastName,
      } : undefined,
      moduleId: cm.class.module?.id,
      module: cm.class.module ? {
        id: cm.class.module.id,
        title: cm.class.module.title,
      } : undefined,
      isArchived: cm.class.is_archived,
      status: cm.class.status,
      createdAt: cm.class.created_at,
      updatedAt: cm.class.updated_at,
    }));
  } catch (error) {
    console.error('Error loading student classes:', error);
    throw error;
  }
};

/**
 * Obtener todos los estudiantes de una clase
 */
export const getStudentsByClass = async (classId: string): Promise<{ id: string; firstName: string; lastName: string; email: string; avatar?: string }[]> => {
  if (USE_JSON_DB) {
    return jsonClassService.getStudentsByClassJSON(classId);
  }

  // Implementación para Supabase (placeholder por ahora, ajustar según sea necesario)
  if (USE_LOCAL_DB) {
    // return localClassService.getStudentsByClassLocal(classId);
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('class_members')
      .select(`
  user: users!class_members_user_id_fkey(
    id, first_name, last_name, email, avatar
  )
    `)
      .eq('class_id', classId)
      .eq('role', 'student');

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.user.id,
      firstName: item.user.first_name,
      lastName: item.user.last_name,
      email: item.user.email,
      avatar: item.user.avatar
    }));
  } catch (error) {
    console.error('Error loading class students:', error);
    return [];
  }
};

