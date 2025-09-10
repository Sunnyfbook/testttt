-- Create table for anonymous video reactions
CREATE TABLE public.video_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id text NOT NULL,
  session_id text NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(video_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE public.video_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies - allow everyone to read and insert reactions (no auth required)
CREATE POLICY "Anyone can view video reactions" 
ON public.video_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert video reactions" 
ON public.video_reactions 
FOR INSERT 
WITH CHECK (true);

-- Create function to check if session has reacted to video
CREATE OR REPLACE FUNCTION public.check_session_reaction(video_file_id text, user_session_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_reactions
    WHERE video_id = video_file_id
      AND session_id = user_session_id
  )
$$;

-- Enable real-time for video_reactions table
ALTER TABLE public.video_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_reactions;