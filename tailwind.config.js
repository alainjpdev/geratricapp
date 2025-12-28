/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Colores que cambian según el modo - GeriatricApp Brand
        bg: {
          DEFAULT: '#0f172a', // Slate-900 por defecto (dark mode)
          light: '#f8fafc', // Slate-50 en modo claro
        },
        panel: {
          DEFAULT: '#1e293b', // Slate-800
          light: '#FFFFFF', // Blanco
        },
        sidebar: {
          DEFAULT: '#1e293b', // Slate-800
          light: '#FFFFFF', // Blanco
        },
        border: {
          DEFAULT: '#334155', // slate-700 en dark
          light: '#e2e8f0', // slate-200 en light
        },

        // GeriatricApp Brand Colors (Mapped from previous names for compatibility)
        primary: '#0ea5e9', // Sky-500 (Primary Brand Color)
        'primary-light': '#38bdf8', // Sky-400
        'primary-dark': '#0284c7', // Sky-600

        secondary: '#64748b', // Slate-500
        'secondary-light': '#f1f5f9', // Slate-100
        'secondary-dark': '#475569', // Slate-600

        // Colores de estado
        success: '#10b981', // Emerald-500
        warning: '#f59e0b', // Amber-500
        error: '#ef4444', // Red-500

        accent: {
          DEFAULT: '#0ea5e9', // Sky-500
          light: '#0ea5e9', // Sky-500
        },

        // Mantener nombres de variables antiguos mapeados a nuevos colores para evitar roturas
        'logo-brown': '#475569', // Slate-600
        'logo-green-light': '#38bdf8', // Sky-400
        'logo-green-medium': '#0ea5e9', // Sky-500
        'logo-green-dark': '#0284c7', // Sky-600
        'logo-white': '#FFFFFF',

        'brand-brown': '#475569', // Slate-600
        'brand-green-light': '#38bdf8', // Sky-400
        'brand-green-medium': '#0ea5e9', // Sky-500
        'brand-green-dark': '#0284c7', // Sky-600
        'brand-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
};
