-- Create the first admin user
-- Password: admin123 (you should change this after first login)
-- The password is hashed using SHA-256 with salt 'salt'
INSERT INTO public.admin_users (username, password_hash, email, role, is_active) 
VALUES (
  'admin', 
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- SHA-256 hash of 'admin123salt'
  'admin@streamflix.com',
  'admin',
  true
);