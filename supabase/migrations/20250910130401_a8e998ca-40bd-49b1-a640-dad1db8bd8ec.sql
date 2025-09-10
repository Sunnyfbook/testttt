-- Create a simpler and more reliable INSERT policy for video_reactions
DROP POLICY IF EXISTS "Users can insert video reactions" ON public.video_reactions;

CREATE POLICY "Users can insert video reactions" 
ON public.video_reactions 
FOR INSERT 
WITH CHECK (true);