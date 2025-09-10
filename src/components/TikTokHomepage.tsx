import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Heart, Share2, MessageCircle, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  views_count: number;
}

const TikTokHomepage = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadFeaturedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_featured', true)
        .not('video_url', 'is', null)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedVideos();
  }, []);

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevVideo();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNextVideo();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (e.deltaY < 0 && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentVideoIndex, videos.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md px-4">
          <h2 className="text-2xl font-bold mb-4">No Featured Videos</h2>
          <p className="text-gray-300 mb-6">
            No featured videos available. Add some videos in the admin panel to get started.
          </p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black overflow-hidden relative flex items-center justify-center"
    >
      {/* Video Container with 9:16 aspect ratio */}
      <div className="relative h-full w-full max-w-md mx-auto">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            key={currentVideo.id}
            className="w-full h-full object-cover rounded-none"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            poster={currentVideo.thumbnail_url}
          >
            <source src={currentVideo.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Navigation Controls - Left Side */}
          <div className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevVideo}
              disabled={currentVideoIndex === 0}
              className="bg-black/30 text-white hover:bg-black/50 border border-white/20 backdrop-blur-sm disabled:opacity-30 w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full"
            >
              <ChevronUp size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextVideo}
              disabled={currentVideoIndex === videos.length - 1}
              className="bg-black/30 text-white hover:bg-black/50 border border-white/20 backdrop-blur-sm disabled:opacity-30 w-10 h-10 sm:w-12 sm:h-12 p-0 rounded-full"
            >
              <ChevronDown size={18} />
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="absolute right-2 sm:right-4 bottom-20 flex flex-col gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/30 text-white hover:bg-black/50 border border-white/20 backdrop-blur-sm rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
            >
              <Heart size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/30 text-white hover:bg-black/50 border border-white/20 backdrop-blur-sm rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
            >
              <MessageCircle size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: currentVideo.title,
                      text: currentVideo.description,
                      url: window.location.href,
                    });
                  } catch (err) {
                    console.log('Share cancelled');
                  }
                } else {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                  } catch (err) {
                    console.error('Copy failed');
                  }
                }
              }}
              className="bg-black/30 text-white hover:bg-black/50 border border-white/20 backdrop-blur-sm rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
            >
              <Share2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black/30 text-white hover:bg-black/50 border border-white/20 backdrop-blur-sm rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>
          </div>

          {/* Progress Indicators */}
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
            {videos.map((_, index) => (
              <div
                key={index}
                className={`w-0.5 h-4 sm:h-6 rounded-full transition-all duration-300 ${
                  index === currentVideoIndex 
                    ? 'bg-white' 
                    : index < currentVideoIndex 
                    ? 'bg-white/60' 
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Side panels for larger screens */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  );
};

export default TikTokHomepage;