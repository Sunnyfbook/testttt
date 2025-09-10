import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoReactionsContext } from '@/context/VideoReactionsContext';
import { validateFileId } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import AdDisplay from '@/components/AdDisplay';

interface VideoPlayerProps {
  fileId: string;
  apiBaseUrl: string;
}

interface FileInfo {
  title?: string;
  duration?: number;
  size?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ fileId, apiBaseUrl }) => {
  // Security: Validate fileId to prevent injection attacks
  if (!validateFileId(fileId)) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px] bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 text-destructive" size={48} />
            <h3 className="text-xl font-bold text-destructive mb-2">Invalid Video ID</h3>
            <p className="text-muted-foreground">
              The provided video ID contains invalid characters and cannot be loaded for security reasons.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fileInfo, setFileInfo] = useState<FileInfo>({});
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showVastAd, setShowVastAd] = useState(false);
  const [vastAdEnded, setVastAdEnded] = useState(false);
  
  // Use reaction gating hook
  const { hasReacted, loading: reactionsLoading } = useVideoReactionsContext();
  
  console.log('VideoPlayer render:', { hasReacted, reactionsLoading, fileId });

  const streamUrl = `${apiBaseUrl}/watch/${fileId}`;
  const infoUrl = `${apiBaseUrl}/api/file/${fileId}`;

  useEffect(() => {
    fetchFileInfo();
    // Check for VAST ads when user has reacted
    if (hasReacted && !reactionsLoading && !vastAdEnded) {
      // Check if there are any stream-vast ads configured
      const checkVastAds = async () => {
        try {
          const { data } = await supabase
            .from('ads')
            .select('*')
            .eq('placement', 'stream-vast')
            .eq('is_active', true)
            .order('priority', { ascending: false })
            .limit(1);
          
          if (data && data.length > 0) {
            setShowVastAd(true);
          }
        } catch (error) {
          console.error('Error checking VAST ads:', error);
        }
      };
      
      checkVastAds();
    }
  }, [fileId, hasReacted, reactionsLoading, vastAdEnded]);

  const fetchFileInfo = async () => {
    try {
      const response = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout and security headers
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }
      
      const info = await response.json();
      setFileInfo(info);
    } catch (error) {
      console.error('Failed to fetch file info:', error);
      // Set empty file info on error
      setFileInfo({});
    }
  };

  const togglePlay = () => {
    // Prevent playing if user hasn't reacted (but allow if reactions are still loading)
    if (!hasReacted && !reactionsLoading) {
      return;
    }
    
    // If VAST ad is showing, don't allow play
    if (showVastAd && !vastAdEnded) {
      return;
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVastAdEnd = () => {
    setVastAdEnded(true);
    setShowVastAd(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Video Info */}
      {fileInfo.title && (
        <div className="mb-4 sm:mb-6 animate-fade-in px-4 sm:px-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">{fileInfo.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground text-sm sm:text-base">
            {fileInfo.duration && (
              <span>Duration: {Math.floor(fileInfo.duration / 60)}m {Math.floor(fileInfo.duration % 60)}s</span>
            )}
            {fileInfo.size && (
              <span>Size: {(fileInfo.size / (1024 * 1024)).toFixed(1)} MB</span>
            )}
          </div>
        </div>
      )}

      {/* Video Container - Fixed Size Like YouTube */}
      <div 
        className="youtube-video-container animate-slide-up"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={streamUrl}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onClick={togglePlay}
        />

        {/* VAST Ad Overlay */}
        {showVastAd && !vastAdEnded && (
          <div className="absolute inset-0 bg-black z-30">
            <AdDisplay placement="stream-vast" />
            <button 
              onClick={handleVastAdEnd}
              className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded hover:bg-black/70 transition-colors"
            >
              Skip Ad
            </button>
          </div>
        )}

        {/* Reaction Gate Overlay */}
        {!hasReacted && !reactionsLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
            <div className="text-center p-6 max-w-md mx-4">
              <Lock className="mx-auto mb-4 text-primary" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">React to Unlock Video</h3>
              <p className="text-white/80 text-sm">
                Please react to this video using one of the reactions below to start watching.
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        )}

        {/* Video Controls */}
        <div className={`video-controls transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={togglePlay}
                className={`video-button p-2 ${(!hasReacted && !reactionsLoading) || (showVastAd && !vastAdEnded) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={(!hasReacted && !reactionsLoading) || (showVastAd && !vastAdEnded)}
              >
                {(!hasReacted && !reactionsLoading) || (showVastAd && !vastAdEnded) ? <Lock size={20} /> : isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleMute}
                className="video-button p-2"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>

              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullscreen}
                className="video-button p-2"
              >
                <Maximize size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;