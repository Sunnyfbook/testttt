import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Star, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  file_id: string;
}

const VideosManagement = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    is_featured: false
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail_url: '',
      is_featured: false
    });
    setVideoFile(null);
    setEditingId(null);
    setShowAddForm(false);
  };

  const generateThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(3, video.duration / 2); // Capture at 3 seconds or middle
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      });
      
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.title.trim()) {
        toast({
          title: "Error",
          description: "Title is required",
          variant: "destructive",
        });
        return;
      }

      if (!editingId && !videoFile) {
        toast({
          title: "Error",
          description: "Video file is required",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      
      let videoUrl = null;
      let thumbnailUrl = null;
      let fileId = editingId ? videos.find(v => v.id === editingId)?.file_id : `video_${Date.now()}`;

      // Upload video file if provided
      if (videoFile) {
        const fileName = `${fileId}.${videoFile.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        videoUrl = publicUrl;

        // Generate and upload thumbnail
        try {
          const thumbnailDataUrl = await generateThumbnail(videoFile);
          const thumbnailBlob = await (await fetch(thumbnailDataUrl)).blob();
          
          const thumbnailFileName = `${fileId}_thumbnail.jpg`;
          const { error: thumbError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, thumbnailBlob, {
              cacheControl: '3600',
              upsert: true
            });

          if (!thumbError) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbUrl;
          }
        } catch (thumbErr) {
          console.warn('Thumbnail generation failed:', thumbErr);
        }
      }

      const videoData = {
        title: formData.title,
        description: formData.description || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || formData.thumbnail_url || null,
        is_featured: formData.is_featured,
        file_id: fileId,
        status: 'active'
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('videos')
          .insert([videoData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Video ${editingId ? 'updated' : 'added'} successfully`,
      });

      resetForm();
      loadVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "Error",
        description: "Failed to save video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (video: VideoItem) => {
    setFormData({
      title: video.title,
      description: video.description || '',
      thumbnail_url: video.thumbnail_url || '',
      is_featured: video.is_featured
    });
    setVideoFile(null);
    setEditingId(video.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Video ${!currentStatus ? 'featured' : 'unfeatured'} successfully`,
      });

      loadVideos();
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Video className="animate-pulse mr-2" size={24} />
          Loading videos...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Homepage Videos Management</CardTitle>
            <p className="text-muted-foreground">Manage videos for TikTok-style homepage</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="hero-button"
          >
            <Plus className="mr-2" size={16} />
            Add Video
          </Button>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingId ? 'Edit Video' : 'Add New Video'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Video title"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video File {!editingId && '*'}</label>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    {videoFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {videoFile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thumbnail URL (Optional)</label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      placeholder="Auto-generated or custom URL"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to auto-generate from video
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                      />
                      Featured on Homepage
                    </label>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Video description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button onClick={handleSave} className="hero-button" disabled={uploading}>
                    <Save className="mr-2" size={16} />
                    {uploading ? 'Uploading...' : (editingId ? 'Update' : 'Save')} Video
                  </Button>
                  <Button onClick={resetForm} variant="outline">
                    <X className="mr-2" size={16} />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {videos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No videos added yet. Click "Add Video" to get started.
              </div>
            ) : (
              videos.map((video) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{video.title}</h3>
                          {video.is_featured && (
                            <Badge variant="default" className="bg-primary/20 text-primary">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {video.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Views: {video.views_count || 0}</span>
                          <span>Created: {new Date(video.created_at).toLocaleDateString()}</span>
                          {video.video_url && (
                            <span className="text-green-600">Has Video URL</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(video.id, video.is_featured)}
                          className={video.is_featured ? 'text-yellow-600' : 'text-muted-foreground'}
                        >
                          <Star className="w-4 h-4" fill={video.is_featured ? 'currentColor' : 'none'} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(video)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideosManagement;