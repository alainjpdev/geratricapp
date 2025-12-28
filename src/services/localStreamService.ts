/**
 * Servicio local para interactuar con stream items en la base de datos local
 * Solo para desarrollo
 */

import { localDB, LocalStreamItem, LocalAttachment, LocalClass } from '../db/localDB';
import { StreamItemData, StreamItemWithAuthor } from './streamService';
import { localUserService } from './localUserService';

/**
 * Cargar stream items de una clase (o todas si es admin)
 */
export const loadStreamItemsLocal = async (classId?: string, isAdmin: boolean = false): Promise<StreamItemWithAuthor[]> => {
  try {
    let items: LocalStreamItem[];

    if (isAdmin) {
      // Admin ve todos los items
      items = (await localDB.streamItems.toArray())
        .filter(item => !item.isArchived);
    } else if (classId) {
      // Filtrar por clase
      items = (await localDB.streamItems.toArray())
        .filter(item => item.classId === classId && !item.isArchived);
    } else {
      items = [];
    }

    // Obtener attachments y autores
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const attachments = await localDB.attachments
          .where('streamItemId')
          .equals(item.id)
          .toArray();

        const author = await localUserService.getUserById(item.authorId);
        const className = classId ? undefined : await getClassNameLocal(item.classId || '');

        return {
          id: item.id,
          classId: item.classId || '',
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
      })
    );

    return itemsWithDetails.sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error loading stream items from local DB:', error);
    throw error;
  }
};

/**
 * Obtener nombre de clase
 */
const getClassNameLocal = async (classId: string): Promise<string | undefined> => {
  try {
    const cls = await localDB.classes.get(classId);
    return cls?.title;
  } catch {
    return undefined;
  }
};

/**
 * Guardar un stream item
 */
export const saveStreamItemLocal = async (data: StreamItemData): Promise<StreamItemWithAuthor> => {
  try {
    console.log('💾 saveStreamItemLocal - data.classId:', data.classId, 'type:', data.type, 'title:', data.title);
    const now = new Date().toISOString();
    const itemId = data.id || crypto.randomUUID();

    // Obtener el nombre de la clase si no se proporcionó en data.className
    let className = data.className;
    if (!className && data.classId) {
      className = await getClassNameLocal(data.classId);
    }

    const newItem: LocalStreamItem = {
      id: itemId,
      classId: data.classId,
      type: data.type,
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      topicId: data.topicId,
      className: className, // Guardar el nombre de la clase
      isArchived: false,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    console.log('💾 Saving stream item to localDB:', { id: newItem.id, classId: newItem.classId, type: newItem.type, title: newItem.title });
    await localDB.streamItems.add(newItem);
    console.log('✅ Stream item saved to localDB with classId:', newItem.classId);

    // Guardar attachments si hay
    if (data.attachments && data.attachments.length > 0) {
      const attachmentsData = data.attachments.map((att, index) => ({
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
      }));

      await localDB.attachments.bulkAdd(attachmentsData);
    }

    // Obtener autor y attachments para retornar
    const author = await localUserService.getUserById(data.authorId);
    const attachments = await localDB.attachments
      .where('streamItemId')
      .equals(itemId)
      .toArray();

    return {
      ...newItem,
      classId: newItem.classId || '',
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
    console.error('Error saving stream item to local DB:', error);
    throw error;
  }
};

/**
 * Actualizar un stream item
 */
export const updateStreamItemLocal = async (
  itemId: string,
  data: Partial<StreamItemData>
): Promise<StreamItemWithAuthor> => {
  try {
    const existing = await localDB.streamItems.get(itemId);
    if (!existing) {
      throw new Error('Stream item no encontrado');
    }

    // Si se proporciona className en data, usarlo; si no, preservar el existente o obtenerlo de la clase
    let className = data.className;
    if (!className && existing.classId) {
      // Si no se proporciona className y hay classId, intentar obtenerlo de la clase
      className = await getClassNameLocal(existing.classId);
      // Si la clase no existe, usar el className guardado en el stream item
      if (!className && existing.className) {
        className = existing.className;
      }
    } else if (!className) {
      // Si no hay className nuevo y no hay classId, usar el existente
      className = existing.className;
    }

    const updated: LocalStreamItem = {
      ...existing,
      ...data,
      className: className, // Asegurar que className esté presente
      updatedAt: new Date().toISOString(),
    };

    await localDB.streamItems.put(updated);

    // Actualizar attachments si se proporcionan
    if (data.attachments !== undefined) {
      // Eliminar attachments existentes
      await localDB.attachments
        .where('streamItemId')
        .equals(itemId)
        .delete();

      // Agregar nuevos attachments
      if (data.attachments.length > 0) {
        const now = new Date().toISOString();
        const attachmentsData = data.attachments.map((att, index) => ({
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
        }));

        await localDB.attachments.bulkAdd(attachmentsData);
      }
    }

    // Obtener autor y attachments para retornar
    const author = await localUserService.getUserById(updated.authorId);
    const attachments = await localDB.attachments
      .where('streamItemId')
      .equals(itemId)
      .toArray();

    return {
      ...updated,
      classId: updated.classId || '',
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
    console.error('Error updating stream item in local DB:', error);
    throw error;
  }
};

/**
 * Eliminar un stream item
 */
export const deleteStreamItemLocal = async (itemId: string): Promise<void> => {
  try {
    // Eliminar attachments primero
    await localDB.attachments
      .where('streamItemId')
      .equals(itemId)
      .delete();

    // Eliminar records relacionados en otras tablas para evitar huérfanos
    // Esto asegura que si se borra el stream item, se borre el assignment/quiz/material asociado
    await Promise.all([
      localDB.assignments.where('streamItemId').equals(itemId).delete(),
      localDB.quizzes.where('streamItemId').equals(itemId).delete(),
      localDB.materials.where('streamItemId').equals(itemId).delete(),
    ]);

    // Eliminar el item
    await localDB.streamItems.delete(itemId);
  } catch (error) {
    console.error('Error deleting stream item from local DB:', error);
    throw error;
  }
};

/**
 * Archivar un stream item
 */
export const archiveStreamItemLocal = async (streamItemId: string): Promise<void> => {
  try {
    const existing = await localDB.streamItems.get(streamItemId);
    if (!existing) {
      throw new Error('Stream item no encontrado');
    }

    await localDB.streamItems.put({
      ...existing,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error archiving stream item in local DB:', error);
    throw error;
  }
};

/**
 * Desarchivar un stream item
 */
export const unarchiveStreamItemLocal = async (streamItemId: string, className?: string): Promise<void> => {
  try {
    const streamItem = await localDB.streamItems.get(streamItemId);
    if (!streamItem) {
      throw new Error('Stream item no encontrado');
    }

    // Verificar si la clase existe y está archivada
    if (streamItem.classId) {
      const cls = await localDB.classes.get(streamItem.classId);
      if (cls) {
        if (cls.isArchived) {
          console.log('⚠️ La clase asociada está archivada. Restaurando clase...');
          // Restaurar la clase automáticamente
          await localDB.classes.put({
            ...cls,
            isArchived: false,
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // La clase no existe, crear una clase por defecto
        console.log('⚠️ La clase asociada no existe. Creando clase por defecto...');
        console.log('📝 className recibido:', className);
        const now = new Date().toISOString();
        // Usar el className pasado como parámetro si está disponible y no es "Sin clase", o un nombre por defecto
        const classTitle = className && className !== 'Sin clase' && className.trim() !== '' ? className.trim() : 'Clase Restaurada';
        console.log('📝 classTitle final:', classTitle);
        const defaultClass: LocalClass = {
          id: streamItem.classId, // Usar el mismo ID que tenía originalmente
          title: classTitle, // Usar el nombre original de la clase si está disponible
          description: 'Clase creada automáticamente al restaurar un elemento',
          classCode: `CLASS-${Date.now()}`,
          teacherId: streamItem.authorId, // Usar el autor del stream item como profesor
          isArchived: false,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        // Usar put() en lugar de add() para evitar errores si la clase ya existe
        await localDB.classes.put(defaultClass);
        console.log('✅ Clase por defecto creada:', defaultClass.id, 'con nombre:', classTitle);
      }
    }

    await localDB.streamItems.put({
      ...streamItem,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error unarchiving stream item from local DB:', error);
    throw error;
  }
};


/**
 * Cargar stream items archivados
 */
export const loadArchivedStreamItemsLocal = async (
  type?: 'assignment' | 'quiz' | 'material' | 'announcement'
): Promise<StreamItemWithAuthor[]> => {
  try {
    let items: LocalStreamItem[];

    if (type) {
      console.log('🔍 loadArchivedStreamItemsLocal - buscando type:', type, 'isArchived: true');
      // Filtrar por tipo primero, luego por isArchived en memoria
      // Esto es más confiable que el índice compuesto con booleanos
      const allItemsOfType = await localDB.streamItems
        .where('type')
        .equals(type)
        .toArray();
      console.log('📋 Todos los items de tipo', type, ':', allItemsOfType.length);
      console.log('📋 Estados isArchived:', allItemsOfType.map(item => ({ id: item.id, title: item.title, isArchived: item.isArchived })));
      items = allItemsOfType.filter(item => item.isArchived === true);
      console.log('✅ Items archivados encontrados:', items.length);
    } else {
      // Filtrar en memoria ya que isArchived no está indexado individualmente
      const allItems = await localDB.streamItems.toArray();
      items = allItems.filter(item => item.isArchived === true);
      console.log('✅ Items archivados encontrados (sin tipo):', items.length);
    }

    // Obtener detalles
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const attachments = await localDB.attachments
          .where('streamItemId')
          .equals(item.id)
          .toArray();

        const author = await localUserService.getUserById(item.authorId);
        const className = await getClassNameLocal(item.classId || '');

        return {
          id: item.id,
          classId: item.classId || '',
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
      })
    );

    return itemsWithDetails.sort((a, b) =>
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error loading archived stream items from local DB:', error);
    throw error;
  }
};

