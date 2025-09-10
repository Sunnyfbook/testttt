import React from 'react';
import { Download, Link, Share2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { validateFileId } from '@/lib/utils';

interface VideoActionsProps {
  fileId: string;
  apiBaseUrl: string;
  fileTitle?: string;
}

const VideoActions: React.FC<VideoActionsProps> = ({ fileId, apiBaseUrl, fileTitle }) => {
  // Security: Validate fileId to prevent injection attacks
  if (!validateFileId(fileId)) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive" size={20} />
          <span className="text-sm text-destructive">Invalid video ID - actions disabled for security</span>
        </div>
      </div>
    );
  }
  const downloadUrl = `${apiBaseUrl}/dl/${fileId}`;
  const streamUrl = `${window.location.origin}/stream?id=${fileId}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileTitle || `video_${fileId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download started",
      description: "The video download has begun.",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      toast({
        title: "Link copied!",
        description: "Video link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: fileTitle || 'Check out this video',
          text: 'Watch this amazing video!',
          url: streamUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-4">
      {/* Download Button */}
      <div className="flex justify-center">
        <Button onClick={handleDownload} className="hero-button flex items-center justify-center gap-2">
          <Download size={18} />
          <span>Download Video</span>
        </Button>
      </div>
      
      {/* Copy Link Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleCopyLink} 
          variant="outline" 
          className="flex items-center justify-center gap-2 border-border hover:bg-card"
        >
          <Link size={18} />
          <span>Copy Link</span>
        </Button>
      </div>
      
      {/* Share Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleShare} 
          variant="outline" 
          className="flex items-center justify-center gap-2 border-border hover:bg-card"
        >
          <Share2 size={18} />
          Share
        </Button>
      </div>
    </div>
  );
};

export default VideoActions;