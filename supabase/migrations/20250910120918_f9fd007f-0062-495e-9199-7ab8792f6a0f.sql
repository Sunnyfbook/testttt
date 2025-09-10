-- Fix security definer view issue and update implementation

-- Drop the problematic view
DROP VIEW IF EXISTS public.video_reaction_counts;

-- Create a security definer function to get reaction counts (safer approach)
CREATE OR REPLACE FUNCTION public.get_video_reaction_counts(p_video_id text)
RETURNS TABLE(reaction_type text, count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    vr.reaction_type,
    COUNT(*) as count
  FROM video_reactions vr
  WHERE vr.video_id = p_video_id
  GROUP BY vr.reaction_type;
$$;

-- Create a function to get all video reaction counts (for multiple videos)
CREATE OR REPLACE FUNCTION public.get_all_video_reaction_counts()
RETURNS TABLE(video_id text, reaction_type text, count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    vr.video_id,
    vr.reaction_type,
    COUNT(*) as count
  FROM video_reactions vr
  GROUP BY vr.video_id, vr.reaction_type;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_video_reaction_counts(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_video_reaction_counts() TO anon, authenticated;