import { useState, useEffect, useCallback } from 'react';
import { DynamicMenuItem, CreateMenuItemData, UpdateMenuItemData } from '../types/menu';
import { menuAPI } from '../services/menuAPI';

// Sin backend, usar menuAPI que ahora usa localStorage
const api = menuAPI;

export const useDynamicMenu = (role: 'admin' | 'enfermero' | 'paciente' | 'pariente') => {
  // Sin autenticación, no necesitamos user
  const [menuItems, setMenuItems] = useState<DynamicMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar elementos de menú
  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.getMenuItems(role);
      setMenuItems(items.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar menú');
    } finally {
      setLoading(false);
    }
  }, [role]);

  // Crear nuevo elemento de menú
  const createMenuItem = useCallback(async (data: CreateMenuItemData) => {
    try {
      setError(null);
      const newItem = await api.createMenuItem(data);
      setMenuItems(prev => [...prev, newItem].sort((a, b) => a.order - b.order));
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear elemento');
      throw err;
    }
  }, []);

  // Actualizar elemento de menú
  const updateMenuItem = useCallback(async (id: string, data: UpdateMenuItemData) => {
    try {
      setError(null);
      const updatedItem = await api.updateMenuItem(id, data);
      setMenuItems(prev =>
        prev.map(item => item.id === id ? updatedItem : item)
          .sort((a, b) => a.order - b.order)
      );
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar elemento');
      throw err;
    }
  }, []);

  // Eliminar elemento de menú
  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.deleteMenuItem(id);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar elemento');
      throw err;
    }
  }, []);

  // Reordenar elementos
  const reorderMenuItems = useCallback(async (itemIds: string[]) => {
    try {
      setError(null);
      const reorderData = itemIds.map((id, index) => ({
        id,
        order: index + 1
      }));

      await api.reorderMenuItems(reorderData);
      setMenuItems(prev => {
        const reorderedItems = itemIds.map(id =>
          prev.find(item => item.id === id)
        ).filter(Boolean) as DynamicMenuItem[];

        const remainingItems = prev.filter(item => !itemIds.includes(item.id));
        return [...reorderedItems, ...remainingItems];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar elementos');
      throw err;
    }
  }, []);

  // Toggle activar/desactivar elemento
  const toggleMenuItem = useCallback(async (id: string) => {
    try {
      setError(null);
      const updatedItem = await api.toggleMenuItem(id);
      setMenuItems(prev =>
        prev.map(item => item.id === id ? updatedItem : item)
          .sort((a, b) => a.order - b.order)
      );
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado del elemento');
      throw err;
    }
  }, []);

  // Cargar elementos al montar el componente
  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  return {
    menuItems: menuItems.filter(item => item.isActive),
    allMenuItems: menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems,
    toggleMenuItem,
    refreshMenu: loadMenuItems
  };
};
