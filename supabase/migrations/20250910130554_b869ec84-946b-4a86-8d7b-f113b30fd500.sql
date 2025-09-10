-- Drop all existing policies and create new working ones
DROP POLICY IF EXISTS "No direct access to video reactions" ON public.video_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.video_reactions;
DROP POLICY IF EXISTS "Users can insert video reactions" ON public.video_reactions;

-- Create working policies for video reactions
CREATE POLICY "Allow all video reaction operations" 
ON public.video_reactions 
FOR ALL 
USING (true) 
WITH CHECK (true);