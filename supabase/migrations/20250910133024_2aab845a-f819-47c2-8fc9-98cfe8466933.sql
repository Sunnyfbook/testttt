-- Create website settings table
CREATE TABLE public.website_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banner', 'popup', 'interstitial', 'vast')),
  content JSONB NOT NULL,
  placement TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video analytics table
CREATE TABLE public.video_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL,
  ip_address INET NOT NULL DEFAULT '0.0.0.0'::inet,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'play', 'pause', 'complete', 'skip')),
  timestamp_seconds INTEGER DEFAULT 0,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_settings
CREATE POLICY "Anyone can read website settings" 
ON public.website_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify website settings" 
ON public.website_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE username = current_setting('request.headers', true)::json->>'admin-user'
  AND is_active = true
));

-- RLS Policies for ads
CREATE POLICY "Anyone can read active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Only admins can manage ads" 
ON public.ads 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE username = current_setting('request.headers', true)::json->>'admin-user'
  AND is_active = true
));

-- RLS Policies for video_analytics
CREATE POLICY "Anyone can insert analytics" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can read analytics" 
ON public.video_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE username = current_setting('request.headers', true)::json->>'admin-user'
  AND is_active = true
));

-- RLS Policies for admin_users
CREATE POLICY "Admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users au 
  WHERE au.username = current_setting('request.headers', true)::json->>'admin-user'
  AND au.is_active = true
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default website settings
INSERT INTO public.website_settings (setting_key, setting_value, description) VALUES
('site_title', '"StreamFlix Pro"', 'Website title displayed in header and browser tab'),
('site_description', '"Experience high-quality video streaming with our modern, fast, and reliable platform"', 'Website meta description for SEO'),
('site_keywords', '"video streaming, online player, HD videos, streaming platform"', 'Website meta keywords for SEO'),
('hero_title', '"StreamFlix Pro"', 'Main hero section title'),
('hero_subtitle', '"Experience high-quality video streaming with our modern, fast, and reliable platform. Enter your video ID to start streaming instantly."', 'Hero section subtitle'),
('contact_email', '"admin@streamflix.com"', 'Contact email for support'),
('analytics_enabled', 'true', 'Enable/disable analytics tracking'),
('ads_enabled', 'true', 'Enable/disable ads display');

-- Create functions for analytics
CREATE OR REPLACE FUNCTION public.track_video_event(
  p_video_id TEXT,
  p_ip_address INET,
  p_event_type TEXT,
  p_timestamp_seconds INTEGER DEFAULT 0,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  analytics_id UUID;
BEGIN
  -- Ensure video exists
  PERFORM ensure_video_exists(p_video_id);
  
  -- Insert analytics event
  INSERT INTO video_analytics (video_id, ip_address, event_type, timestamp_seconds, user_agent, referrer)
  VALUES (p_video_id, p_ip_address, p_event_type, p_timestamp_seconds, p_user_agent, p_referrer)
  RETURNING id INTO analytics_id;
  
  -- Update views count on videos table if it's a view event
  IF p_event_type = 'view' THEN
    UPDATE videos 
    SET views_count = COALESCE(views_count, 0) + 1,
        updated_at = now()
    WHERE file_id = p_video_id;
  END IF;
  
  RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;