-- Enable pgcrypto for password hashing/verification
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create RPC function to verify password
CREATE OR REPLACE FUNCTION verify_password(user_password_hash text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the password against the hash
  RETURN user_password_hash = crypt(input_password, user_password_hash);
END;
$$;
