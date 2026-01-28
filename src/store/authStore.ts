import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, RegisterData } from '../types';
import { loginWithUsersTable, getUserFromTable } from '../services/authService';
import { supabase } from '../config/supabaseClient';
import bcrypt from 'bcryptjs';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const normalizedEmail = email.toLowerCase();
        console.log('Intentando login con tabla users', normalizedEmail);
        try {
          const { user: userData, token } = await loginWithUsersTable(normalizedEmail, password);

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
          const { email, password, firstName, lastName, role } = userData;

          // Crear el usuario directamente en la tabla users
          const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
              id: crypto.randomUUID(),
              email,
              first_name: firstName,
              last_name: lastName,
              role: role || 'enfermero',
              password_hash: await bcrypt.hash(password, 10),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) throw error;

          // Auto-login después de registrar
          const user: User = {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role as any,
            avatar: newUser.avatar || '',
            createdAt: newUser.created_at
          };

          const token = btoa(JSON.stringify({ userId: user.id, email: user.email, timestamp: Date.now() }));

          set({ user, token, isAuthenticated: true });
          localStorage.setItem('token', token);

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