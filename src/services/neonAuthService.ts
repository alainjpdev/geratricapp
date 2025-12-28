// Servicio para autenticación con Neon Auth (Better Auth)
// Obtiene tokens JWT para usar con la Data API

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || '';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  access_token: string;
  user: any;
  expires_at?: number;
}

/**
 * Hacer login con Neon Auth usando Better Auth
 * Better Auth usa endpoints REST estándar
 */
export async function loginWithNeonAuth(
  credentials: LoginCredentials
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!NEON_AUTH_URL) {
    return { success: false, error: 'VITE_NEON_AUTH_URL no está configurado' };
  }

  try {
    // Better Auth endpoint para login con email/password
    // El endpoint puede variar, probamos el formato estándar
    const loginUrl = `${NEON_AUTH_URL}/sign-in/email`;
    
    console.log('🔐 Intentando login con Neon Auth...', { email: credentials.email });
    
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

    const responseText = await response.text();
    let data: any;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // Si no es JSON, puede ser HTML o texto plano
      console.warn('Response no es JSON:', responseText.substring(0, 200));
      return { 
        success: false, 
        error: `Error en login: ${response.status} ${response.statusText}` 
      };
    }

    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || `Error ${response.status}: ${response.statusText}` 
      };
    }

    // Better Auth puede devolver el token de diferentes maneras
    const token = data.access_token || data.token || data.session?.access_token || data.data?.access_token;
    
    if (token) {
      // Guardar en localStorage para uso posterior
      const session: AuthSession = {
        access_token: token,
        user: data.user || data.data?.user,
        expires_at: data.expires_at || data.expires_in 
          ? Date.now() + (data.expires_in * 1000)
          : undefined
      };
      
      localStorage.setItem('better-auth.session', JSON.stringify(session));
      console.log('✅ Login exitoso, token guardado');
      
      return { success: true, token };
    } else {
      console.warn('⚠️ Login exitoso pero no se encontró token en la respuesta:', data);
      return { 
        success: false, 
        error: 'Login exitoso pero no se recibió token. Verifica la respuesta del servidor.' 
      };
    }
  } catch (error: any) {
    console.error('❌ Error en login con Neon Auth:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido en el login' 
    };
  }
}

/**
 * Registrar nuevo usuario con Neon Auth
 */
export async function registerWithNeonAuth(
  credentials: LoginCredentials & { name?: string }
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!NEON_AUTH_URL) {
    return { success: false, error: 'VITE_NEON_AUTH_URL no está configurado' };
  }

  try {
    const registerUrl = `${NEON_AUTH_URL}/sign-up/email`;
    
    console.log('📝 Intentando registro con Neon Auth...', { email: credentials.email });
    
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        name: credentials.name || credentials.email.split('@')[0],
      }),
    });

    const responseText = await response.text();
    let data: any;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return { 
        success: false, 
        error: `Error en registro: ${response.status} ${response.statusText}` 
      };
    }

    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || `Error ${response.status}` 
      };
    }

    const token = data.access_token || data.token || data.session?.access_token;
    
    if (token) {
      const session: AuthSession = {
        access_token: token,
        user: data.user || data.data?.user,
      };
      
      localStorage.setItem('better-auth.session', JSON.stringify(session));
      console.log('✅ Registro exitoso, token guardado');
      
      return { success: true, token };
    } else {
      // Después del registro, puede que necesites hacer login
      return { 
        success: false, 
        error: 'Registro exitoso pero no se recibió token. Intenta hacer login.' 
      };
    }
  } catch (error: any) {
    console.error('❌ Error en registro con Neon Auth:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido en el registro' 
    };
  }
}

/**
 * Obtener el token actual de la sesión
 */
export function getCurrentToken(): string | null {
  try {
    const session = localStorage.getItem('better-auth.session');
    if (session) {
      const sessionData: AuthSession = JSON.parse(session);
      return sessionData.access_token || null;
    }
  } catch (error) {
    console.warn('Error obteniendo token:', error);
  }
  return null;
}

/**
 * Verificar si hay una sesión activa
 */
export function hasActiveSession(): boolean {
  return getCurrentToken() !== null;
}

/**
 * Cerrar sesión
 */
export function logoutNeonAuth(): void {
  localStorage.removeItem('better-auth.session');
  console.log('✅ Sesión cerrada');
}








