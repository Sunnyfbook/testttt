-- Security Fix: Protect IP addresses and add proper policies for video_reactions

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view video reactions" ON public.video_reactions;
DROP POLICY IF EXISTS "Anyone can insert video reactions" ON public.video_reactions;

-- Create a secure view for reaction counts that doesn't expose IP addresses
CREATE OR REPLACE VIEW public.video_reaction_counts AS
SELECT 
  video_id,
  reaction_type,
  COUNT(*) as count
FROM public.video_reactions
GROUP BY video_id, reaction_type;

-- Create a function to check if an IP has reacted to a video (secure)
CREATE OR REPLACE FUNCTION public.check_ip_has_reacted(p_video_id text, p_ip_address inet)
RETURNS TABLE(has_reacted boolean, reaction_type text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    EXISTS(SELECT 1 FROM video_reactions WHERE video_id = p_video_id AND ip_address = p_ip_address) as has_reacted,
    (SELECT vr.reaction_type FROM video_reactions vr WHERE video_id = p_video_id AND ip_address = p_ip_address LIMIT 1) as reaction_type;
$$;

-- Create new secure RLS policies for video_reactions
-- Allow users to insert reactions (but they can't see others' IP addresses)
CREATE POLICY "Users can insert video reactions" 
ON public.video_reactions 
FOR INSERT 
WITH CHECK (true);

-- Allow users to delete their own reactions based on IP address
CREATE POLICY "Users can delete their own reactions" 
ON public.video_reactions 
FOR DELETE 
USING (ip_address = (
  SELECT ip FROM (
    SELECT unnest(string_to_array(
      COALESCE(
        split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1),
        current_setting('request.headers', true)::json->>'cf-connecting-ip',
        current_setting('request.headers', true)::json->>'x-real-ip',
        '127.0.0.1'
      ), 
      ','
    )) as ip
  ) as ips
  WHERE trim(ip) != ''
  LIMIT 1
)::inet);

-- Allow users to view reaction counts (but not individual reactions with IP addresses)
-- This policy blocks direct SELECT on video_reactions table
CREATE POLICY "No direct access to video reactions" 
ON public.video_reactions 
FOR SELECT 
USING (false);

-- Grant access to the secure view
GRANT SELECT ON public.video_reaction_counts TO anon, authenticated;

-- Grant execute permission on the check function
GRANT EXECUTE ON FUNCTION public.check_ip_has_reacted(text, inet) TO anon, authenticated;