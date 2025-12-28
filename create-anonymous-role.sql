-- ============================================
-- Script para crear y configurar el rol anonymous
-- Este rol permite acceso sin autenticación cuando RLS está deshabilitado
-- ============================================

-- Crear rol anonymous si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anonymous') THEN
        CREATE ROLE anonymous;
        RAISE NOTICE 'Rol anonymous creado';
    ELSE
        RAISE NOTICE 'Rol anonymous ya existe';
    END IF;
END
$$;

-- Dar permisos necesarios al rol anonymous
GRANT USAGE ON SCHEMA public TO anonymous;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anonymous;

-- Asegurar que las tablas futuras también sean accesibles
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anonymous;

-- Verificar que el rol fue creado
SELECT 
    rolname,
    rolsuper,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles
WHERE rolname = 'anonymous';

-- Verificar permisos en las tablas
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anonymous'
    AND table_schema = 'public'
    AND table_name IN ('User', 'Evento', 'Cotizacion', 'Orden', 'Producto')
ORDER BY table_name, privilege_type;








