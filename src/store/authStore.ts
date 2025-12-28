import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, RegisterData } from '../types';
import { loginWithUsersTable, getUserFromTable } from '../services/authService';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        console.log('Intentando login con tabla users', email);
        try {
          const { user: userData, token } = await loginWithUsersTable(email, password);
          
          set({ 
            user: userData, 
            token, 
            isAuthenticated: true 
          });
          localStorage.setItem('token', token);
          
          console.log('✅ Login exitoso', { email: userData.email, role: userData.role });
        } catch (error: any) {
          console.error('Error en login:', error);
          throw new Error(error.message || 'Error al iniciar sesión');
        }
      },

      register: async (userData: RegisterData) => {
        try {
          // Por ahora, el registro debe hacerse manualmente o a través de un script
          // porque requiere hashear la contraseña en el servidor
          throw new Error('El registro debe hacerse a través de un administrador. Contacta al administrador del sistema.');
        } catch (error: any) {
          console.error('Error en registro:', error);
          throw new Error(error.message || 'Error al registrar usuario');
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        localStorage.removeItem('token');
      },

      checkAuth: () => {
        const state = get();
        // Si ya hay usuario y token en el estado persistido, verificar que el usuario aún existe
        if (state.user && state.token) {
          // Verificar que el usuario aún existe en la base de datos
          void (async () => {
            try {
              const userFromDb = await getUserFromTable(state.user!.id);
              if (userFromDb) {
                set({ isAuthenticated: true, user: userFromDb });
              } else {
                // Usuario no existe
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false
                });
                localStorage.removeItem('token');
              }
            } catch (err) {
              console.error('Error verificando usuario:', err);
              set({
                user: null,
                token: null,
                isAuthenticated: false
              });
              localStorage.removeItem('token');
            }
          })();
          return;
        }

        // Si no hay usuario, limpiar estado
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);