-- Reset password for ark2784@gmail.com
-- This ensures the hash is generated correctly by the database itself

UPDATE public.users 
SET password_hash = crypt('ark2784@2025!', gen_salt('bf')) 
WHERE email = 'ark2784@gmail.com';
