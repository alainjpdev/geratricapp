// Configuración de la API
const API_BASE_URL = '/api';

// Headers por defecto
const getDefaultHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Cliente HTTP base
const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: getDefaultHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Si la respuesta es HTML (404), no intentar parsear como JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Endpoint ${endpoint} not found (404)`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }
      
      return data;
    } catch (error) {
      // Solo mostrar errores para endpoints que deberían funcionar
      const workingEndpoints = [];
      if (workingEndpoints.some(ep => endpoint.includes(ep))) {
        console.error('API Error:', error);
      }
      throw error;
    }
  }
};

export default apiClient;
