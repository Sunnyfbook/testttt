-- Promote the specified user to admin
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE username = 'sunny.fbook21@gmail.com';