/**
 * Servicio para interactuar con stream items usando JSON en memoria
 * Solo para desarrollo rápido
 */

import { jsonDB } from '../db/jsonDatabase';
import { StreamItemData, StreamItemWithAuthor } from './streamService';
import type { LocalStreamItem, LocalAttachment } from '../db/localDB';
import { jsonUserService } from './jsonUserService';

/**
 * Cargar stream items de una clase (o todas si es admin)
 */
export const loadStreamItemsJSON = async (classId?: string, isAdmin: boolean = false): Promise<StreamItemWithAuthor[]> => {
  try {
    await jsonDB.initialize();
    
    let items = jsonDB.getStreamItems();
    
    if (isAdmin) {
      items = items.filter(item => !item.isArchived);
    } else if (classId) {
      items = items.filter(item => item.classId === classId && !item.isArchived);
    } else {
      items = [];
    }

    // Obtener attachments y autores
    const itemsWithDetails = items.map((item) => {
      const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === item.id);
      const author = jsonUserService.getUserById(item.authorId);
      const className = classId ? undefined : (jsonDB.getClassById(item.classId)?.title);

      return {
        id: item.id,
        classId: item.classId,
        type: item.type,
        title: item.title,
        content: item.content,
        authorId: item.authorId,
        topicId: item.topicId,
        createdAt: item.createdAt,
        isArchived: item.isArchived,
        author: {
          name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
          avatar: author?.avatar,
        },
        attachments: attachments.map(att => ({
          id: att.id,
          type: att.type,
          name: att.name,
          url: att.url,
          filePath: att.filePath,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
        className,
      } as StreamItemWithAuthor;
    });

    return itemsWithDetails.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error loading stream items from JSON:', error);
    throw error;
  }
};

/**
 * Guardar un stream item
 */
export const saveStreamItemJSON = async (data: StreamItemData): Promise<StreamItemWithAuthor> => {
  try {
    await jsonDB.initialize();
    const now = new Date().toISOString();
    const itemId = data.id || crypto.randomUUID();

    // Obtener el nombre de la clase
    let className = data.className;
    if (!className && data.classId) {
      const cls = jsonDB.getClassById(data.classId);
      className = cls?.title;
    }

    const newItem: LocalStreamItem = {
      id: itemId,
      classId: data.classId,
      type: data.type,
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      topicId: data.topicId,
      className: className,
      isArchived: false,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    jsonDB.putStreamItem(newItem);

    // Guardar attachments si hay
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((att, index) => {
        const attachment: LocalAttachment = {
          id: crypto.randomUUID(),
          streamItemId: itemId,
          type: att.type,
          name: att.name,
          url: att.url,
          filePath: att.filePath,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
          order: index,
          createdAt: now,
        };
        jsonDB.putAttachment(attachment);
      });
    }

    // Obtener autor y attachments para retornar
    const author = jsonUserService.getUserById(data.authorId);
    const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === itemId);

    return {
      ...newItem,
      author: {
        name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
        avatar: author?.avatar,
      },
      attachments: attachments.map(att => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url,
        filePath: att.filePath,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
      })),
    };
  } catch (error) {
    console.error('Error saving stream item to JSON:', error);
    throw error;
  }
};

/**
 * Actualizar un stream item
 */
export const updateStreamItemJSON = async (
  itemId: string,
  data: Partial<StreamItemData>
): Promise<StreamItemWithAuthor> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getStreamItemById(itemId);
    if (!existing) {
      throw new Error('Stream item no encontrado');
    }

    let className = data.className;
    if (!className && existing.classId) {
      const cls = jsonDB.getClassById(existing.classId);
      className = cls?.title || existing.className;
    } else if (!className) {
      className = existing.className;
    }

    const updated: LocalStreamItem = {
      ...existing,
      ...data,
      className: className,
      updatedAt: new Date().toISOString(),
    };

    jsonDB.putStreamItem(updated);

    // Actualizar attachments si se proporcionan
    if (data.attachments !== undefined) {
      // Eliminar attachments existentes (filtrar)
      const existingAttachments = jsonDB.getAttachments().filter(att => att.streamItemId === itemId);
      // En JSON, simplemente reemplazamos los attachments
      
      // Agregar nuevos attachments
      if (data.attachments.length > 0) {
        const now = new Date().toISOString();
        data.attachments.forEach((att, index) => {
          const attachment: LocalAttachment = {
            id: crypto.randomUUID(),
            streamItemId: itemId,
            type: att.type,
            name: att.name,
            url: att.url,
            filePath: att.filePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            order: index,
            createdAt: now,
          };
          jsonDB.putAttachment(attachment);
        });
      }
    }

    // Obtener autor y attachments para retornar
    const author = jsonUserService.getUserById(updated.authorId);
    const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === itemId);

    return {
      ...updated,
      author: {
        name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
        avatar: author?.avatar,
      },
      attachments: attachments.map(att => ({
        id: att.id,
        type: att.type,
        name: att.name,
        url: att.url,
        filePath: att.filePath,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
      })),
    };
  } catch (error) {
    console.error('Error updating stream item in JSON:', error);
    throw error;
  }
};

/**
 * Archivar un stream item
 */
export const archiveStreamItemJSON = async (streamItemId: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const existing = jsonDB.getStreamItemById(streamItemId);
    if (!existing) {
      throw new Error('Stream item no encontrado');
    }

    jsonDB.putStreamItem({
      ...existing,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error archiving stream item in JSON:', error);
    throw error;
  }
};

/**
 * Desarchivar un stream item
 */
export const unarchiveStreamItemJSON = async (streamItemId: string, className?: string): Promise<void> => {
  try {
    await jsonDB.initialize();
    const streamItem = jsonDB.getStreamItemById(streamItemId);
    if (!streamItem) {
      throw new Error('Stream item no encontrado');
    }

    // Verificar si la clase existe y está archivada
    if (streamItem.classId) {
      const cls = jsonDB.getClassById(streamItem.classId);
      if (cls) {
        if (cls.isArchived) {
          // Restaurar la clase automáticamente
          jsonDB.putClass({
            ...cls,
            isArchived: false,
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // La clase no existe, crear una clase por defecto
        const now = new Date().toISOString();
        const classTitle = className && className !== 'Sin clase' && className.trim() !== '' 
          ? className.trim() 
          : (streamItem.className || 'Clase Restaurada');
        
        const defaultClass = {
          id: streamItem.classId,
          title: classTitle,
          description: 'Clase creada automáticamente al restaurar un elemento',
          classCode: `CLASS-${Date.now()}`,
          teacherId: streamItem.authorId,
          isArchived: false,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        jsonDB.putClass(defaultClass);
      }
    }

    jsonDB.putStreamItem({
      ...streamItem,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unarchiving stream item from JSON:', error);
    throw error;
  }
};

/**
 * Cargar stream items archivados
 */
export const loadArchivedStreamItemsJSON = async (
  type?: 'assignment' | 'quiz' | 'material' | 'announcement'
): Promise<StreamItemWithAuthor[]> => {
  try {
    await jsonDB.initialize();
    let items = jsonDB.getStreamItems().filter(item => item.isArchived === true);

    if (type) {
      items = items.filter(item => item.type === type);
    }

    // Obtener detalles
    const itemsWithDetails = items.map((item) => {
      const attachments = jsonDB.getAttachments().filter(att => att.streamItemId === item.id);
      const author = jsonUserService.getUserById(item.authorId);
      const className = jsonDB.getClassById(item.classId)?.title || item.className;

      return {
        id: item.id,
        classId: item.classId,
        type: item.type,
        title: item.title,
        content: item.content,
        authorId: item.authorId,
        topicId: item.topicId,
        createdAt: item.createdAt,
        isArchived: item.isArchived,
        author: {
          name: author ? `${author.firstName} ${author.lastName}`.trim() : 'Usuario',
          avatar: author?.avatar,
        },
        attachments: attachments.map(att => ({
          id: att.id,
          type: att.type,
          name: att.name,
          url: att.url,
          filePath: att.filePath,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
        className,
      } as StreamItemWithAuthor;
    });

    return itemsWithDetails.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error loading archived stream items from JSON:', error);
    throw error;
  }
};








