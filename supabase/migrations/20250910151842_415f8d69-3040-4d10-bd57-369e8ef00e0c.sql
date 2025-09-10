-- Add video_url column to videos table for TikTok-style homepage
ALTER TABLE public.videos 
ADD COLUMN video_url text;

-- Add is_featured column to mark videos for homepage display
ALTER TABLE public.videos 
ADD COLUMN is_featured boolean DEFAULT false;

-- Create index for faster queries on featured videos
CREATE INDEX idx_videos_featured ON public.videos(is_featured, created_at DESC) WHERE is_featured = true;