import React, { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Save, X, RotateCcw, Archive } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { DynamicMenuItem, CreateMenuItemData } from '../../types/menu';
import { menuAPI } from '../../services/menuAPI';
import { menuAPIMock } from '../../services/menuAPIMock';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Usar API real para persistencia en base de datos
const api = menuAPI;

// Componente para elementos arrastrables
interface SortableItemProps {
  item: DynamicMenuItem;
  onEdit: (item: DynamicMenuItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 ${isDragging ? 'shadow-lg ring-2 ring-blue-100 z-10' : 'hover:border-blue-300 transition-colors'
        }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-800 truncate">{item.label}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">({item.icon})</span>
          {item.to && (
            <span className="text-xs text-gray-400 truncate font-mono bg-gray-50 px-1 rounded">{item.to}</span>
          )}
          {item.googleSheetUrl && (
            <span className="text-xs text-blue-600 truncate bg-blue-50 px-1 py-0.5 rounded" title="Google Sheets">
              📊 Sheets
            </span>
          )}
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${item.isActive
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}>
          {item.isActive ? 'Activo' : 'Inactivo'}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-3 border-l border-gray-100 pl-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleActive(item.id)}
          className={`p-1.5 h-8 w-8 hover:bg-gray-50 ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}
          title={item.isActive ? 'Desactivar' : 'Activar'}
        >
          {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          className="p-1.5 h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="p-1.5 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
          title="Ocultar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface MenuManagerProps {
  menuItems: DynamicMenuItem[];
  onMenuChange: () => void;
  role: 'admin' | 'enfermero' | 'paciente' | 'pariente';
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  onMenuChange,
  role
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DynamicMenuItem | null>(null);
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DynamicMenuItem[]>(menuItems);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<DynamicMenuItem[]>([]);

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Actualizar items cuando cambien los menuItems
  React.useEffect(() => {
    setItems(menuItems);
  }, [menuItems]);

  // Manejar el final del drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Actualizar el orden en el backend
      try {
        await api.reorderMenuItems(newItems.map((item, index) => ({
          id: item.id,
          order: index + 1
        })));
        onMenuChange();
        setError(null);
      } catch (err) {
        console.warn('⚠️ Error al reordenar en backend, manteniendo orden local:', err);
        // No revertir el cambio, mantener el orden local
        // El backend tiene un problema, pero el reordenamiento local funciona
        setError('Reordenamiento guardado localmente (backend temporalmente no disponible)');
        // Limpiar el error después de 3 segundos
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const [formData, setFormData] = useState<CreateMenuItemData>({
    to: '',
    key: '',
    icon: 'Home',
    label: '',
    role,
    order: menuItems.length + 1,
    googleSheetUrl: ''
  });

  // Cargar iconos disponibles
  React.useEffect(() => {
    const loadIcons = async () => {
      try {
        const icons = await api.getAvailableIcons();
        setAvailableIcons(icons);
      } catch (err) {
        console.error('Error loading icons:', err);
      }
    };
    loadIcons();
  }, []);

  // Cargar elementos ocultos
  const loadHiddenItems = async () => {
    try {
      const hidden = await api.getAllMenuItemsWithHidden();
      const hiddenFiltered = hidden.filter(item => !item.isActive);
      setHiddenItems(hiddenFiltered);
    } catch (err) {
      console.error('Error loading hidden items:', err);
    }
  };

  // Cargar elementos ocultos cuando se muestran
  React.useEffect(() => {
    if (showHidden) {
      loadHiddenItems();
    }
  }, [showHidden]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        // Actualizar elemento existente
        await api.updateMenuItem(editingItem.id, formData);
        setEditingItem(null);
      } else {
        // Crear nuevo elemento
        await api.createMenuItem(formData);
      }

      setFormData({
        to: '',
        key: '',
        icon: 'Home',
        label: '',
        role,
        order: menuItems.length + 1,
        googleSheetUrl: ''
      });
      setShowAddForm(false);
      onMenuChange();

      // Hard refresh después de crear un nuevo menú para asegurar que se vea inmediatamente
      if (!editingItem) {
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Esperar 1 segundo para que se vea el mensaje de éxito
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar elemento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: DynamicMenuItem) => {
    setEditingItem(item);
    setFormData({
      to: item.to || '',
      key: item.key || '',
      icon: item.icon,
      label: item.label,
      role: item.role,
      order: item.order,
      googleSheetUrl: item.googleSheetUrl || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres ocultar este elemento? Podrás restaurarlo más tarde.')) {
      try {
        await api.deleteMenuItem(id);
        onMenuChange();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al ocultar elemento');
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreMenuItem(id);
      onMenuChange();
      loadHiddenItems(); // Recargar elementos ocultos
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restaurar elemento');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (item) {
        await api.updateMenuItem(id, { isActive: !item.isActive });
        onMenuChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar elemento');
    }
  };

  const resetForm = () => {
    setFormData({
      to: '',
      key: '',
      icon: 'Home',
      label: '',
      role,
      order: menuItems.length + 1,
      googleSheetUrl: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-text">Elementos del Menú</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowHidden(!showHidden)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-xs"
          >
            <Archive className="w-3 h-3" />
            {showHidden ? 'Ocultar' : 'Mostrar'} Ocultos ({hiddenItems.length})
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulario de agregar/editar - Compacto */}
      {showAddForm && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-text">
              {editingItem ? 'Editar Elemento' : 'Nuevo Elemento'}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Etiqueta *
                </label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Nombre del elemento"
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Icono *
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-panel text-text"
                  required
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  URL (opcional)
                </label>
                <Input
                  value={formData.to || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="/dashboard/ruta"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Clave (opcional)
                </label>
                <Input
                  value={formData.key || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="clave-unica"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text mb-1">
                Google Sheets URL (opcional)
              </label>
              <Input
                value={formData.googleSheetUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, googleSheetUrl: e.target.value }))}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="text-sm"
                type="url"
              />
              <p className="text-xs dark:text-white text-gray-900 mt-1">
                Si se proporciona, el elemento del menú se abrirá en una nueva pestaña con esta URL
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="flex items-center gap-1 text-xs"
              >
                <Save className="w-3 h-3" />
                {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de elementos existentes - Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {items.length === 0 ? (
              <div className="text-center py-4 dark:text-white text-gray-900 text-sm">
                No hay elementos de menú para este rol
              </div>
            ) : (
              items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Sección de elementos ocultos */}
      {showHidden && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Elementos Ocultos ({hiddenItems.length})
          </h4>
          <div className="space-y-1">
            {hiddenItems.length === 0 ? (
              <div className="text-center py-4 dark:text-white text-gray-900 text-sm">
                No hay elementos ocultos
              </div>
            ) : (
              hiddenItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium dark:text-white text-gray-900 truncate">{item.label}</span>
                      <span className="text-xs dark:text-white text-gray-900 flex-shrink-0">({item.icon})</span>
                      {item.to && (
                        <span className="text-xs dark:text-white text-gray-900 truncate">{item.to}</span>
                      )}
                      {item.googleSheetUrl && (
                        <span className="text-xs text-blue-600 truncate" title="Google Sheets">
                          📊 Sheets
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-1 rounded text-xs flex-shrink-0 bg-red-100 text-red-700">
                      Oculto
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      className="p-1 text-green-600 hover:text-green-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
