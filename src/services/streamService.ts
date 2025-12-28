/**
 * Servicio para interactuar con stream items en Supabase
 * En modo desarrollo, puede usar base de datos local
 */

import { supabase } from '../config/supabaseClient';
import { USE_LOCAL_DB, USE_JSON_DB } from '../config/devMode';
import * as localStreamService from './localStreamService';
import * as jsonStreamService from './jsonStreamService';
import { useAuthStore } from '../store/authStore';

export interface StreamItemData {
  id?: string;
  classId: string;
  type: 'announcement' | 'assignment' | 'quiz' | 'material';
  title: string;
  content?: string;
  authorId: string;
  topicId?: string;
  className?: string; // Nombre de la clase/materia (para cuando la clase sea eliminada)
  createdAt?: string;
  isArchived?: boolean;
  attachments?: Array<{
    type: string;
    name: string;
    url?: string;
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

export interface StreamItemWithAuthor extends StreamItemData {
  author: {
    name: string;
    avatar?: string;
  };
  className?: string; // Nombre de la clase (útil para admins que ven todos los items)
}

/**
 * Cargar stream items de una clase (o todas si es admin)
 */
export const loadStreamItems = async (classId?: string): Promise<StreamItemWithAuthor[]> => {
  if (USE_JSON_DB) {
    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';
    return jsonStreamService.loadStreamItemsJSON(classId, isAdmin);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';
    return localStreamService.loadStreamItemsLocal(classId, isAdmin);
  }

  try {
    // Auth check using static import
    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';

    let query = supabase
      .from('stream_items')
      .select(`
        *,
        author:users(id, firstName:first_name, lastName:last_name, avatar),
        attachments(*),
        topic:topics(id, name),
        class:classes(id, title)
      `)
      .eq('is_archived', false) // Excluir items archivados
      .order('created_at', { ascending: false });

    // Si no es admin y hay classId, filtrar por clase
    if (!isAdmin && classId) {
      query = query.eq('class_id', classId);
    }
    // Si es admin, no filtrar (ver todos los stream items)

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id || item.class?.id, // Asegurar que siempre haya classId
      type: item.type as 'announcement' | 'assignment' | 'quiz' | 'material',
      title: item.title,
      content: item.content || undefined,
      authorId: item.author_id,
      topicId: item.topic_id || undefined,
      createdAt: item.created_at,
      isArchived: item.is_archived || false,
      author: {
        name: `${item.author?.firstName || ''} ${item.author?.lastName || ''}`.trim() || 'Usuario',
        avatar: item.author?.avatar || undefined,
      },
      attachments: (item.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
      className: item.class?.title || undefined, // Incluir nombre de clase para admins
    }));
  } catch (error) {
    console.error('Error loading stream items:', error);
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
 * Guardar un nuevo stream item
 */
export const saveStreamItem = async (data: StreamItemData): Promise<StreamItemWithAuthor> => {
  if (USE_JSON_DB) {
    return jsonStreamService.saveStreamItemJSON(data);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localStreamService.saveStreamItemLocal(data);
  }

  try {
    // Generar UUID para el ID
    const itemId = generateUUID();

    const now = new Date().toISOString();

    // Crear el stream item
    const { data: newItem, error: itemError } = await supabase
      .from('stream_items')
      .insert({
        id: itemId,
        class_id: data.classId,
        type: data.type,
        title: data.title,
        content: data.content,
        author_id: data.authorId,
        topic_id: data.topicId,
        created_at: now,
        updated_at: now,
      })
      .select(`
        *,
        author:users(id, firstName:first_name, lastName:last_name, avatar)
      `)
      .single();

    if (itemError) throw itemError;
    if (!newItem) throw new Error('Failed to create stream item');

    // Crear attachments si existen
    if (data.attachments && data.attachments.length > 0) {
      const attachmentsData = data.attachments.map((att, index) => ({
        id: generateUUID(),
        stream_item_id: newItem.id,
        type: att.type,
        name: att.name,
        url: att.url,
        file_path: att.filePath,
        file_size: att.fileSize || null,
        mime_type: att.mimeType,
        order: index,
      }));

      const { error: attError } = await supabase
        .from('attachments')
        .insert(attachmentsData);

      if (attError) {
        console.warn('Error creating attachments:', attError);
        // Continuar aunque falle la creación de attachments
      }
    }

    // Recargar con attachments
    const { data: itemWithAttachments, error: reloadError } = await supabase
      .from('stream_items')
      .select(`
        *,
        author:users(id, firstName:first_name, lastName:last_name, avatar),
        attachments(*)
      `)
      .eq('id', newItem.id)
      .single();

    if (reloadError) throw reloadError;
    if (!itemWithAttachments) throw new Error('Failed to reload stream item');

    return {
      id: itemWithAttachments.id,
      classId: itemWithAttachments.class_id,
      type: itemWithAttachments.type as 'announcement' | 'assignment' | 'quiz' | 'material',
      title: itemWithAttachments.title,
      content: itemWithAttachments.content || undefined,
      authorId: itemWithAttachments.author_id,
      topicId: itemWithAttachments.topic_id || undefined,
      createdAt: itemWithAttachments.created_at,
      author: {
        name: `${itemWithAttachments.author?.firstName || ''} ${itemWithAttachments.author?.lastName || ''}`.trim() || 'Usuario',
        avatar: itemWithAttachments.author?.avatar || undefined,
      },
      attachments: (itemWithAttachments.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
    };
  } catch (error) {
    console.error('Error saving stream item:', error);
    throw error;
  }
};

/**
 * Actualizar un stream item
 */
export const updateStreamItem = async (
  itemId: string,
  data: Partial<StreamItemData>
): Promise<StreamItemWithAuthor> => {
  if (USE_JSON_DB) {
    return jsonStreamService.updateStreamItemJSON(itemId, data);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localStreamService.updateStreamItemLocal(itemId, data);
  }

  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.topicId !== undefined) updateData.topic_id = data.topicId;

    const { data: updated, error } = await supabase
      .from('stream_items')
      .update(updateData)
      .eq('id', itemId)
      .select(`
        *,
        author:users(id, firstName:first_name, lastName:last_name, avatar),
        attachments(*)
      `)
      .single();

    if (error) throw error;
    if (!updated) throw new Error('Failed to update stream item');

    // Actualizar attachments si se proporcionan
    if (data.attachments !== undefined) {
      // Eliminar attachments existentes
      await supabase
        .from('attachments')
        .delete()
        .eq('stream_item_id', itemId);

      // Crear nuevos attachments si hay alguno
      if (data.attachments.length > 0) {
        const attachmentsData = data.attachments.map((att, index) => ({
          id: generateUUID(),
          stream_item_id: itemId,
          type: att.type,
          name: att.name,
          url: att.url,
          file_path: att.filePath,
          file_size: att.fileSize || null,
          mime_type: att.mimeType,
          order: index,
        }));

        const { error: attError } = await supabase
          .from('attachments')
          .insert(attachmentsData);

        if (attError) {
          console.warn('Error updating attachments:', attError);
          // Continuar aunque falle la actualización de attachments
        }
      }

      // Recargar con los nuevos attachments
      const { data: itemWithAttachments, error: reloadError } = await supabase
        .from('stream_items')
        .select(`
          *,
          author:users(id, firstName:first_name, lastName:last_name, avatar),
          attachments(*)
        `)
        .eq('id', itemId)
        .single();

      if (reloadError) throw reloadError;
      if (!itemWithAttachments) throw new Error('Failed to reload stream item');

      return {
        id: itemWithAttachments.id,
        classId: itemWithAttachments.class_id,
        type: itemWithAttachments.type as 'announcement' | 'assignment' | 'quiz' | 'material',
        title: itemWithAttachments.title,
        content: itemWithAttachments.content || undefined,
        authorId: itemWithAttachments.author_id,
        topicId: itemWithAttachments.topic_id || undefined,
        createdAt: itemWithAttachments.created_at,
        author: {
          name: `${itemWithAttachments.author?.firstName || ''} ${itemWithAttachments.author?.lastName || ''}`.trim() || 'Usuario',
          avatar: itemWithAttachments.author?.avatar || undefined,
        },
        attachments: (itemWithAttachments.attachments || []).map((att: any) => ({
          id: att.id,
          type: att.type,
          name: att.name,
          url: att.url || undefined,
          filePath: att.file_path || undefined,
          fileSize: att.file_size ? Number(att.file_size) : undefined,
          mimeType: att.mime_type || undefined,
        })),
      };
    }

    return {
      id: updated.id,
      classId: updated.class_id,
      type: updated.type as 'announcement' | 'assignment' | 'quiz' | 'material',
      title: updated.title,
      content: updated.content || undefined,
      authorId: updated.author_id,
      topicId: updated.topic_id || undefined,
      createdAt: updated.created_at,
      author: {
        name: `${updated.author?.firstName || ''} ${updated.author?.lastName || ''}`.trim() || 'Usuario',
        avatar: updated.author?.avatar || undefined,
      },
      attachments: (updated.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
    };
  } catch (error) {
    console.error('Error updating stream item:', error);
    throw error;
  }
};

/**
 * Eliminar un stream item
 */
export const deleteStreamItem = async (itemId: string): Promise<void> => {
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localStreamService.deleteStreamItemLocal(itemId);
  }

  try {
    // Las relaciones tienen onDelete: Cascade, así que esto eliminará attachments automáticamente
    const { error } = await supabase
      .from('stream_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting stream item:', error);
    throw error;
  }
};

/**
 * Cargar stream items archivados por tipo
 */
export const loadArchivedStreamItems = async (type?: 'assignment' | 'quiz' | 'material' | 'announcement'): Promise<StreamItemWithAuthor[]> => {
  if (USE_JSON_DB) {
    return jsonStreamService.loadArchivedStreamItemsJSON(type);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localStreamService.loadArchivedStreamItemsLocal(type);
  }

  try {
    // Modificado para usar authStore static import
    const authUser = useAuthStore.getState().user;

    // Con authStore ya tenemos el rol, no necesitamos consultarlo a la DB
    const isAdmin = authUser?.role === 'admin';

    let query = supabase
      .from('stream_items')
      .select(`
        *,
        author:users(id, firstName:first_name, lastName:last_name, avatar),
        attachments(*),
        topic:topics(id, name),
        class:classes(id, title)
      `)
      .eq('is_archived', true) // Solo archivados
      .order('created_at', { ascending: false });

    // Filtrar por tipo si se especifica
    if (type) {
      query = query.eq('type', type);
    }

    // Si no es admin, solo mostrar items de las clases del usuario
    if (!isAdmin && authUser) {
      // Obtener las clases del usuario
      const { data: userClasses } = await supabase
        .from('classes')
        .select('id')
        .or(`teacher_id.eq.${authUser.id},id.in.(select class_id from class_members where user_id.eq.${authUser.id})`);

      if (userClasses && userClasses.length > 0) {
        const classIds = userClasses.map(c => c.id);
        query = query.in('class_id', classIds);
      } else {
        // Si no tiene clases, retornar array vacío
        return [];
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      classId: item.class_id || item.class?.id,
      type: item.type as 'announcement' | 'assignment' | 'quiz' | 'material',
      title: item.title,
      content: item.content || undefined,
      authorId: item.author_id,
      topicId: item.topic_id || undefined,
      createdAt: item.created_at,
      isArchived: item.is_archived || false,
      author: {
        name: `${item.author?.firstName || ''} ${item.author?.lastName || ''}`.trim() || 'Usuario',
        avatar: item.author?.avatar || undefined,
      },
      attachments: (item.attachments || []).map((att: any) => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url || undefined,
        filePath: att.file_path || undefined,
        fileSize: att.file_size ? Number(att.file_size) : undefined,
        mimeType: att.mime_type || undefined,
      })),
      className: item.class?.title || undefined,
    }));
  } catch (error) {
    console.error('Error loading archived stream items:', error);
    throw error;
  }
};

/**
 * Archivar un stream item
 */
export const archiveStreamItem = async (streamItemId: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonStreamService.archiveStreamItemJSON(streamItemId);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localStreamService.archiveStreamItemLocal(streamItemId);
  }

  try {
    const { error } = await supabase
      .from('stream_items')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', streamItemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error archiving stream item:', error);
    throw error;
  }
};

/**
 * Desarchivar un stream item
 */
export const unarchiveStreamItem = async (streamItemId: string, className?: string): Promise<void> => {
  if (USE_JSON_DB) {
    return jsonStreamService.unarchiveStreamItemJSON(streamItemId, className);
  }
  // En modo desarrollo con base local, usar la base local
  if (USE_LOCAL_DB) {
    return localStreamService.unarchiveStreamItemLocal(streamItemId, className);
  }

  try {
    const { error } = await supabase
      .from('stream_items')
      .update({
        is_archived: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', streamItemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unarchiving stream item:', error);
    throw error;
  }
};

