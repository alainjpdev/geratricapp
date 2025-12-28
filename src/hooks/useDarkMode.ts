import { useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Hook de compatibilidad que usa el contexto de tema
export function useDarkMode() {
  try {
    const { dark, setDark } = useTheme();
    return [dark, setDark] as const;
  } catch {
    // Fallback si no hay ThemeProvider (no debería pasar, pero por seguridad)
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : true;
    return [dark, () => { }] as const;
  }
} 