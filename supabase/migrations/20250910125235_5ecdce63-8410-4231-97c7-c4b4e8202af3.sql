-- Create a function to automatically create video entries when accessed
CREATE OR REPLACE FUNCTION public.ensure_video_exists(p_file_id text, p_title text DEFAULT NULL, p_description text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    video_uuid uuid;
BEGIN
    -- Check if video already exists
    SELECT id INTO video_uuid
    FROM videos
    WHERE file_id = p_file_id;
    
    -- If video doesn't exist, create it
    IF video_uuid IS NULL THEN
        INSERT INTO videos (file_id, title, description, status)
        VALUES (
            p_file_id, 
            COALESCE(p_title, 'Video ' || p_file_id),
            COALESCE(p_description, 'Auto-generated video entry'),
            'active'
        )
        RETURNING id INTO video_uuid;
    END IF;
    
    RETURN video_uuid;
END;
$$;

-- Update the reaction functions to ensure video exists first
CREATE OR REPLACE FUNCTION public.check_ip_has_reacted(p_video_id text, p_ip_address inet)
RETURNS TABLE(has_reacted boolean, reaction_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    video_uuid uuid;
BEGIN
    -- Ensure video exists in database
    SELECT ensure_video_exists(p_video_id) INTO video_uuid;
    
    -- Check if IP has reacted
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM video_reactions WHERE video_id = p_video_id AND ip_address = p_ip_address) as has_reacted,
        (SELECT vr.reaction_type FROM video_reactions vr WHERE video_id = p_video_id AND ip_address = p_ip_address LIMIT 1) as reaction_type;
END;
$$;

-- Update reaction counts function to ensure video exists
CREATE OR REPLACE FUNCTION public.get_video_reaction_counts(p_video_id text)
RETURNS TABLE(reaction_type text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    video_uuid uuid;
BEGIN
    -- Ensure video exists in database
    SELECT ensure_video_exists(p_video_id) INTO video_uuid;
    
    -- Get reaction counts
    RETURN QUERY
    SELECT 
        vr.reaction_type,
        COUNT(*) as count
    FROM video_reactions vr
    WHERE vr.video_id = p_video_id
    GROUP BY vr.reaction_type;
END;
$$;