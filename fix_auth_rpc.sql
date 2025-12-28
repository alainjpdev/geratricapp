-- Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable pgcrypto in extensions schema (it's fine if it's already in public)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Update the function to look in both public and extensions schemas
CREATE OR REPLACE FUNCTION public.verify_password(user_password_hash text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN user_password_hash = crypt(input_password, user_password_hash);
END;
$$;
