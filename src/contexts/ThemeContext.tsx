import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ThemeContextType {
  dark: boolean;
  setDark: (dark: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Siempre iniciar en light mode (false)
  const [dark, setDarkState] = useState(false);

  const updateTheme = useCallback((isDark: boolean) => {
    // Forzar siempre modo claro
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Aplicar tema inicial
  useEffect(() => {
    updateTheme(false);
  }, [updateTheme]);

  // Aplicar tema cuando cambia (aunque no debería cambiar a true)
  useEffect(() => {
    if (dark) {
      setDarkState(false); // Corregir si accidentalmente se pone a true
    }
    updateTheme(false);
  }, [dark, updateTheme]);

  // Escuchar cambios en localStorage (para sincronizar entre pestañas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Ignorar cambios externos que intenten poner dark mode
      if (e.key === 'theme' && e.newValue === 'dark') {
        updateTheme(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateTheme]);

  const setDark = useCallback((isDark: boolean) => {
    // No permitir cambiar a dark
    setDarkState(false);
  }, []);

  const toggleTheme = useCallback(() => {
    // No permitir toggle
    setDarkState(false);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



