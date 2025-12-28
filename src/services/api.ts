import axios from 'axios';

// Configuración base de Axios
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://colorland-app-ff3fdd79ac35.herokuapp.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend no está disponible, no redirigir automáticamente
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.warn('Backend no disponible, continuando sin conexión');
      // No rechazar la promesa para evitar romper la aplicación
      return Promise.reject(new Error('Backend no disponible'));
    }
    
    if (error.response?.status === 401) {
      // Token expirado o inválido - solo si hay respuesta del servidor
      localStorage.removeItem('token');
      // No redirigir automáticamente si el backend no está disponible
      if (error.response) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Servicios de API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/login', { email, password });
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        throw new Error('El servidor no está disponible. Por favor, intenta más tarde.');
      }
      throw error;
    }
  },
  
  register: async (userData: any) => {
    try {
      const response = await apiClient.post('/api/register', userData);
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        throw new Error('El servidor no está disponible. Por favor, intenta más tarde.');
      }
      throw error;
    }
  },
  
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/api/refresh');
      return response.data;
    } catch (error: any) {
      // Silenciar errores de refresh token si el backend no está disponible
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        return null;
      }
      throw error;
    }
  }
};

export const userAPI = {
  getProfile: async () => {
    try {
      const response = await apiClient.get('/api/users/profile');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para getProfile');
        return null;
      }
      throw error;
    }
  },
  
  updateProfile: async (userData: any) => {
    try {
      const response = await apiClient.put('/api/users/profile', userData);
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para updateProfile');
        throw new Error('El servidor no está disponible. Los cambios no se guardaron.');
      }
      throw error;
    }
  },
  
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/api/users');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para getAllUsers');
        return [];
      }
      throw error;
    }
  }
};

export const classAPI = {
  getClasses: async () => {
    try {
      const response = await apiClient.get('/api/classes');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para getClasses');
        return [];
      }
      throw error;
    }
  },
  
  createClass: async (classData: any) => {
    try {
      const response = await apiClient.post('/api/classes', classData);
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        throw new Error('El servidor no está disponible. La clase no se pudo crear.');
      }
      throw error;
    }
  },
  
  updateClass: async (id: string, classData: any) => {
    try {
      const response = await apiClient.put(`/api/classes/${id}`, classData);
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        throw new Error('El servidor no está disponible. Los cambios no se guardaron.');
      }
      throw error;
    }
  },
  
  deleteClass: async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/classes/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        throw new Error('El servidor no está disponible. La clase no se pudo eliminar.');
      }
      throw error;
    }
  }
};

export const dashboardAPI = {
  getStudentData: async () => {
    try {
      const response = await apiClient.get('/api/dashboard/student');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para getStudentData');
        return null;
      }
      throw error;
    }
  },
  
  getTeacherData: async () => {
    try {
      const response = await apiClient.get('/api/dashboard/teacher');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para getTeacherData');
        return null;
      }
      throw error;
    }
  },
  
  getAdminData: async () => {
    try {
      const response = await apiClient.get('/api/dashboard/admin');
      return response.data;
    } catch (error: any) {
      if (error.message === 'Backend no disponible' || error.code === 'ERR_NETWORK') {
        console.warn('Backend no disponible para getAdminData');
        return null;
      }
      throw error;
    }
  }
};

// Servicios de salud y información del sistema
export const quotationAPI = {
  getQuotations: async () => {
    const response = await apiClient.get('/api/quotations');
    return response.data;
  },
  
  getQuotation: async (id: string) => {
    const response = await apiClient.get(`/api/quotations/${id}`);
    return response.data;
  },
  
  createQuotation: async (quotationData: any) => {
    const response = await apiClient.post('/api/quotations', quotationData);
    return response.data;
  },
  
  updateQuotation: async (id: string, quotationData: any) => {
    const response = await apiClient.put(`/api/quotations/${id}`, quotationData);
    return response.data;
  },
  
  deleteQuotation: async (id: string) => {
    const response = await apiClient.delete(`/api/quotations/${id}`);
    return response.data;
  }
};

export const systemAPI = {
  health: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
  
  info: async () => {
    const response = await apiClient.get('/api/info');
    return response.data;
  }
};