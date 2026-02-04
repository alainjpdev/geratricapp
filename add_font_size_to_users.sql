-- Add font_size column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 16;

-- Optional: Add a check constraint to ensure reasonable font sizes
ALTER TABLE users
ADD CONSTRAINT check_font_size CHECK (font_size >= 10 AND font_size <= 32);

-- Comment on column
COMMENT ON COLUMN users.font_size IS 'User preference for application font size in pixels';
