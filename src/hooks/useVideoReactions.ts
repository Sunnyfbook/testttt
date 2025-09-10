import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';


interface VideoReaction {
  id: string;
  video_id: string;
  ip_address: string;
  reaction_type: string;
  created_at: string;
}

interface ReactionCount {
  reaction_type: string;
  count: number;
}

export const useVideoReactions = (videoId: string) => {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [hasReacted, setHasReacted] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch client IP via Edge Function
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-client-ip');
        if (error) throw error;
        const ip = (data as any)?.ip || (data as any)?.clientIp || (data as any);
        if (ip) {
          setIpAddress(ip);
        } else {
          // Fallback to a default IP if no IP is returned
          setIpAddress('127.0.0.1');
        }
      } catch (error) {
        console.error('Failed to fetch IP address:', error);
        // Fallback to a default IP if fetching fails
        setIpAddress('127.0.0.1');
      }
    };
    fetchIp();
  }, []);

  // Ensure video exists in database first
  const ensureVideoExists = useCallback(async () => {
    if (!videoId) return null;
    
    try {
      // Input validation for videoId
      const sanitizedVideoId = videoId.replace(/[^\w-_.]/g, '');
      if (!sanitizedVideoId || sanitizedVideoId !== videoId) {
        console.error('Invalid video ID format');
        return null;
      }

      const { data, error } = await supabase.rpc('ensure_video_exists', {
        p_file_id: videoId,
        p_title: `Video ${videoId}`,
        p_description: 'Auto-generated video entry'
      });
      
      if (error) {
        console.error('Error ensuring video exists:', error);
        return null;
      }
      
      console.log('Video ensured in database:', videoId);
      return data;
    } catch (error) {
      console.error('Error ensuring video exists:', error);
      return null;
    }
  }, [videoId]);

  // Check if current IP has reacted using secure function
  const checkReactionStatus = useCallback(async () => {
    if (!ipAddress || !videoId) return;
    
    // First ensure the video exists in the database
    await ensureVideoExists();
    
    try {
      // Input validation for videoId
      const sanitizedVideoId = videoId.replace(/[^\w-_.]/g, '');
      if (!sanitizedVideoId || sanitizedVideoId !== videoId) {
        console.error('Invalid video ID format');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('check_ip_has_reacted', {
        p_video_id: videoId,
        p_ip_address: ipAddress
      });
      if (error) throw error;
      
      const result = data?.[0];
      if (result?.has_reacted) {
        setHasReacted(true);
        setUserReaction(result.reaction_type);
      } else {
        setHasReacted(false);
        setUserReaction(null);
      }
    } catch (error) {
      console.error('Error checking reaction status:', error);
      setHasReacted(false);
      setUserReaction(null);
    } finally {
      setLoading(false);
    }
  }, [ipAddress, videoId, ensureVideoExists]);

  // Get reaction counts for this video using secure function
  const fetchReactionCounts = useCallback(async () => {
    if (!videoId) return;
    
    // First ensure the video exists in the database
    await ensureVideoExists();
    
    try {
      // Input validation for videoId
      const sanitizedVideoId = videoId.replace(/[^\w-_.]/g, '');
      if (!sanitizedVideoId || sanitizedVideoId !== videoId) {
        console.error('Invalid video ID format');
        return;
      }

      const { data, error } = await supabase.rpc('get_video_reaction_counts', {
        p_video_id: videoId
      });

      if (error) throw error;

      const reactionCountsArray = (data || []).map((row: any) => ({
        reaction_type: row.reaction_type,
        count: parseInt(row.count)
      }));

      setReactionCounts(reactionCountsArray);
    } catch (error) {
      console.error('Error fetching reaction counts:', error);
      setReactionCounts([]);
    }
  }, [videoId, ensureVideoExists]);

  // Add or update reaction (by IP) with validation
  const addReaction = useCallback(async (reactionType: string) => {
    console.log('addReaction called with:', { reactionType, ipAddress, videoId, hasReacted });
    
    if (!ipAddress || !videoId) {
      console.log('Missing ipAddress or videoId');
      return;
    }
    
    // First ensure the video exists in the database
    await ensureVideoExists();
    
    try {
      // Input validation
      const sanitizedVideoId = videoId.replace(/[^\w-_.]/g, '');
      const sanitizedReactionType = reactionType.replace(/[^\w]/g, '');
      
      if (!sanitizedVideoId || sanitizedVideoId !== videoId) {
        console.error('Invalid video ID format');
        return;
      }
      
      if (!sanitizedReactionType || sanitizedReactionType !== reactionType) {
        console.error('Invalid reaction type format');
        return;
      }

      console.log('About to insert reaction:', { videoId, ipAddress, reactionType });

      // Remove existing reaction for this IP if any
      const { error: deleteError } = await supabase
        .from('video_reactions')
        .delete()
        .eq('video_id', videoId)
        .eq('ip_address', ipAddress);

      if (deleteError) {
        console.warn('Could not remove existing reaction:', deleteError.message);
      }

      // Add new reaction
      const { error, data } = await supabase
        .from('video_reactions')
        .insert({
          video_id: videoId,
          ip_address: ipAddress,
          reaction_type: reactionType
        })
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Reaction inserted successfully:', data);

      // Immediately update local state to unlock video
      console.log('Setting hasReacted to true and userReaction to:', reactionType);
      setHasReacted(true);
      setUserReaction(reactionType);
      
      // Force re-fetch of data
      setTimeout(() => {
        console.log('Refetching reaction counts and status');
        fetchReactionCounts();
        checkReactionStatus();
      }, 100);
      
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [ipAddress, videoId, fetchReactionCounts, checkReactionStatus, ensureVideoExists]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!videoId || !ipAddress) return;

    // Reset state when videoId changes
    setHasReacted(false);
    setUserReaction(null);
    setReactionCounts([]);
    setLoading(true);

    checkReactionStatus();
    fetchReactionCounts();

    // Subscribe to real-time updates for this video's reactions
    const channel = supabase
      .channel(`video-reactions-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_reactions',
          filter: `video_id=eq.${videoId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh reaction counts when any reaction changes for this video
          fetchReactionCounts();
          checkReactionStatus();
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from channel:', `video-reactions-${videoId}`);
      supabase.removeChannel(channel);
    };
  }, [videoId, ipAddress, checkReactionStatus, fetchReactionCounts]);

  return {
    hasReacted,
    userReaction,
    reactionCounts,
    loading,
    addReaction,
    ipAddress
  };
};