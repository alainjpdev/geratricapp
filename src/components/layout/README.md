# Layout Components

Esta carpeta contiene todos los componentes relacionados con el layout de la aplicación, organizados de manera modular para facilitar el mantenimiento y la reutilización.

## Estructura

```
src/components/layout/
├── BaseLayout.tsx          # Layout base reutilizable
├── Sidebar.tsx            # Componente de barra lateral
├── UserProfile.tsx        # Componente de perfil de usuario
├── NavigationItem.tsx     # Componente de elemento de navegación
├── navigationConfig.ts    # Configuración de navegación por roles
├── index.ts              # Archivo de exportaciones
└── README.md             # Esta documentación
```

## Componentes

### BaseLayout
Layout base que puede ser reutilizado por diferentes roles (admin, teacher, student). Recibe como prop la configuración de navegación específica para cada rol.

### Sidebar
Componente de barra lateral que incluye:
- Logo de la aplicación
- Perfil de usuario
- Navegación principal
- Botón de colapso/expansión
- Botón de logout

### UserProfile
Componente que muestra la información del usuario logueado, incluyendo nombre y rol.

### NavigationItem
Componente reutilizable para elementos de navegación, soporta:
- Enlaces simples
- Submenús desplegables
- Tooltips cuando está colapsado

### navigationConfig.ts
Archivo de configuración que define los elementos de navegación para cada rol:
- `adminNavigationItems`: Navegación para administradores
- `studentNavigationItems`: Navegación para estudiantes
- `teacherNavigationItems`: Navegación para profesores

## Hooks

### useSidebar
Hook personalizado que maneja el estado del sidebar:
- Estado de colapso/expansión
- Estado de menús desplegables
- Funciones para toggle

## Uso

```tsx
import { BaseLayout, adminNavigationItems } from '../components/layout';

export const AdminLayout: React.FC = () => {
  return <BaseLayout navigationItems={adminNavigationItems} />;
};
```

## Beneficios de la estructura modular

1. **Reutilización**: Los componentes pueden ser reutilizados en diferentes contextos
2. **Mantenimiento**: Cada componente tiene una responsabilidad específica
3. **Escalabilidad**: Fácil agregar nuevos roles o modificar la navegación
4. **Testing**: Cada componente puede ser probado de forma independiente
5. **Legibilidad**: El código es más fácil de entender y mantener
