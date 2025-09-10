-- Update video_reactions table to use IP address instead of session ID
ALTER TABLE public.video_reactions 
DROP COLUMN session_id,
ADD COLUMN ip_address INET NOT NULL DEFAULT '0.0.0.0';

-- Update the check_session_reaction function to check IP address
DROP FUNCTION IF EXISTS public.check_session_reaction(text, text);

CREATE OR REPLACE FUNCTION public.check_ip_reaction(video_file_id text, user_ip_address inet)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_reactions
    WHERE video_id = video_file_id
      AND ip_address = user_ip_address
  )
$$;