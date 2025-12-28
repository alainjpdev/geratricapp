import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CheckSquare, Square, RefreshCw, AlertCircle, CheckCircle, Download, Settings, Eye, EyeOff } from 'lucide-react';
import { googleSheetsServiceBrowser, TodoItem } from '../../services/googleSheetsServiceBrowser';

export const TodoReadOnly: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableAssignees, setAvailableAssignees] = useState<string[]>([]);

  // Verificar conexión al cargar el componente
  useEffect(() => {
    checkConnection();
    loadTodos();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await googleSheetsServiceBrowser.testConnection();
      setIsConnected(connected);
      if (connected) {
        setError(null);
      } else {
        setError('No se pudo conectar a Google Sheets. Verifica la configuración de la API Key.');
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setError('Error al verificar la conexión con Google Sheets');
      setIsConnected(false);
    }
  };

  const loadTodos = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const todosData = await googleSheetsServiceBrowser.getTodos();
      setTodos(todosData);
      
      // Actualizar lista de encargados
      const assignees = await googleSheetsServiceBrowser.getAssignees();
      setAvailableAssignees(assignees);
      
      setSuccessMessage(`Cargadas ${todosData.length} tareas`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error loading todos:', err);
      setError('Error al cargar las tareas desde Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar tareas
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && todo.completed) ||
                         (filterStatus === 'pending' && !todo.completed);
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">To Do List (Solo Lectura)</h1>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500">Sin conexión</span>
          </div>
        </div>

        <Card className="p-6 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text mb-2">Configuración Requerida</h2>
          <p className="text-text-secondary mb-4">
            Para ver las tareas, necesitas configurar la Google Sheets API Key.
          </p>
          <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg">
            <p><strong>1.</strong> Ve a Google Cloud Console</p>
            <p><strong>2.</strong> Habilita Google Sheets API</p>
            <p><strong>3.</strong> Crea una API Key</p>
            <p><strong>4.</strong> Configura las variables de entorno:</p>
            <div className="bg-gray-800 text-green-400 p-2 rounded mt-2 font-mono text-xs">
              VITE_GOOGLE_API_KEY=tu_api_key_aqui<br/>
              VITE_TODO_SHEET_ID=tu_sheet_id_aqui
            </div>
            <p><strong>5.</strong> Haz tu Google Sheet público (solo lectura) o compártelo con "Cualquiera con el enlace"</p>
          </div>
          <Button onClick={checkConnection} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Verificar Conexión
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">To Do List (Solo Lectura)</h1>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-500">Conectado</span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <Eye className="w-5 h-5" />
          <span className="font-medium">Modo Solo Lectura</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Esta vista muestra las tareas desde Google Sheets. Para editar, usa la versión completa con Service Account.
        </p>
      </Card>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-2 border border-border rounded bg-panel text-text"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-border rounded bg-panel text-text"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>

          <Button onClick={loadTodos} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Todos List */}
      <div className="space-y-3">
        {isLoading && todos.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-text-secondary">Cargando tareas...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">No hay tareas</h3>
            <p className="text-text-secondary">
              {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                ? 'No se encontraron tareas con los filtros aplicados'
                : 'No hay tareas en el Google Sheet'
              }
            </p>
          </Card>
        ) : (
          filteredTodos.map((todo) => (
            <Card key={todo.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {todo.completed ? (
                    <CheckSquare className="w-5 h-5 text-green-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-text'}`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400' : 'text-text-secondary'}`}>
                          {todo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                        {getPriorityLabel(todo.priority)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                    {todo.dueDate && (
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </div>
                    )}

                    {todo.assignedTo && (
                      <div className="flex items-center gap-1">
                        <span>👤</span>
                        {todo.assignedTo}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <span>🕒</span>
                      {new Date(todo.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {todo.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-text-secondary">
                      {todo.notes}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {todos.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>Total: {todos.length} tareas</span>
            <span>Completadas: {todos.filter(t => t.completed).length}</span>
            <span>Pendientes: {todos.filter(t => !t.completed).length}</span>
          </div>
        </Card>
      )}

      {/* Assignees Info */}
      {availableAssignees.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-text mb-2">Encargados</h3>
          <div className="flex flex-wrap gap-2">
            {availableAssignees.map((assignee) => (
              <span
                key={assignee}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
              >
                {assignee}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
