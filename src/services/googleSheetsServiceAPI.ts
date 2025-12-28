// Servicio de Google Sheets que usa el backend como proxy
// El backend maneja la autenticación con Service Account

interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

class GoogleSheetsServiceAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'https://colorland-app-ff3fdd79ac35.herokuapp.com';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Leer todas las tareas del Google Sheet
  async getTodos(): Promise<TodoItem[]> {
    try {
      const data = await this.request<{ todos: TodoItem[] }>('/api/todos');
      return data.todos;
    } catch (error) {
      console.error('Error reading todos from API:', error);
      throw error;
    }
  }

  // Crear una nueva tarea
  async createTodo(todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoItem> {
    try {
      const data = await this.request<TodoItem>('/api/todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      });
      return data;
    } catch (error) {
      console.error('Error creating todo via API:', error);
      throw error;
    }
  }

  // Actualizar una tarea existente
  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<TodoItem> {
    try {
      const data = await this.request<TodoItem>(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data;
    } catch (error) {
      console.error('Error updating todo via API:', error);
      throw error;
    }
  }

  // Eliminar una tarea
  async deleteTodo(id: string): Promise<void> {
    try {
      await this.request<void>(`/api/todos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting todo via API:', error);
      throw error;
    }
  }

  // Obtener encargados únicos
  async getAssignees(): Promise<string[]> {
    try {
      const data = await this.request<{ assignees: string[] }>('/api/todos/assignees');
      return data.assignees;
    } catch (error) {
      console.error('Error getting assignees via API:', error);
      throw error;
    }
  }

  // Verificar conexión
  async testConnection(): Promise<boolean> {
    try {
      await this.request<{ connected: boolean }>('/api/todos/health');
      return true;
    } catch (error) {
      console.error('Error testing connection via API:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const googleSheetsServiceAPI = new GoogleSheetsServiceAPI();
export type { TodoItem };
