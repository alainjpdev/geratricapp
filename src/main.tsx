import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { initJsonDB } from './db/initJsonDB';
import { initLogger } from './utils/logger';

// Inicializar Logger
initLogger();

// Inicializar JSON DB si está habilitado
initJsonDB().catch(console.error);

// Inicializar tema desde localStorage antes de renderizar
// Por defecto: modo dark
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else {
  // Si no hay tema guardado o es 'dark', usar modo dark
  document.documentElement.classList.add('dark');
  if (!savedTheme) {
    localStorage.setItem('theme', 'dark');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
