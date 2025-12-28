// Helper para hacer login con Neon Auth y obtener token JWT
// Basado en la documentación de Neon Auth con Better Auth

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || '';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token?: string;
  token?: string;
  user?: any;
  error?: string;
}

/**
 * Hacer login con Neon Auth
 * Esto obtendrá un token JWT que puede usarse con la Data API
 */
export async function loginWithNeonAuth(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  if (!NEON_AUTH_URL) {
    throw new Error('VITE_NEON_AUTH_URL no está configurado');
  }

  try {
    // Better Auth endpoint para login
    const loginUrl = `${NEON_AUTH_URL}/sign-in/email`;
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante para cookies
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return { error: error.message || 'Error en el login' };
    }

    const data = await response.json();
    
    // Better Auth puede devolver el token de diferentes maneras
    const token = data.access_token || data.token || data.session?.access_token;
    
    if (token) {
      // Guardar en localStorage para uso posterior
      localStorage.setItem('better-auth.session', JSON.stringify({
        access_token: token,
        user: data.user,
        ...data
      }));
    }

    return {
      access_token: token,
      user: data.user,
      ...data
    };
  } catch (error: any) {
    console.error('Error en login con Neon Auth:', error);
    return { error: error.message || 'Error desconocido en el login' };
  }
}

/**
 * Obtener el token actual de la sesión
 */
export function getCurrentToken(): string | null {
  try {
    const session = localStorage.getItem('better-auth.session');
    if (session) {
      const sessionData = JSON.parse(session);
      return sessionData.access_token || sessionData.token || null;
    }
  } catch (error) {
    console.warn('Error obteniendo token:', error);
  }
  return null;
}

/**
 * Cerrar sesión
 */
export function logoutNeonAuth(): void {
  localStorage.removeItem('better-auth.session');
  // También puedes llamar al endpoint de logout si es necesario
}








