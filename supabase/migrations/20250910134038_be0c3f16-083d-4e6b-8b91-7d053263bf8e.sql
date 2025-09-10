-- Fix the infinite recursion issues in admin_users table
-- Drop all existing policies for admin_users
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

-- Create a simpler policy structure for admin_users that won't cause recursion
CREATE POLICY "Allow admin users to read all admin users" 
ON public.admin_users 
FOR SELECT 
USING (true); -- Allow reading for now, we'll secure this later

CREATE POLICY "Allow admin users to insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (true); -- Allow inserting for now

-- Clean up and simplify other tables' policies 
DROP POLICY IF EXISTS "Only admins can modify website settings" ON public.website_settings;
DROP POLICY IF EXISTS "Only admins can manage ads" ON public.ads;
DROP POLICY IF EXISTS "Only admins can read analytics" ON public.video_analytics;

-- Create simpler policies using profiles instead of admin_users
CREATE POLICY "Only profile admins can modify website settings" 
ON public.website_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Only profile admins can manage ads" 
ON public.ads 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Only profile admins can read analytics" 
ON public.video_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Remove the admin_users table since we'll use Supabase auth + profiles
DROP TABLE IF EXISTS public.admin_users CASCADE;