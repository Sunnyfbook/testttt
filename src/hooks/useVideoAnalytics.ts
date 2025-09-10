import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVideoAnalytics = (videoId: string) => {
  const trackEvent = useCallback(async (eventType: string, timestampSeconds = 0) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-client-ip');
      const ipAddress = data?.ip || '0.0.0.0';
      
      await supabase.rpc('track_video_event', {
        p_video_id: videoId,
        p_ip_address: ipAddress,
        p_event_type: eventType,
        p_timestamp_seconds: timestampSeconds,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [videoId]);

  useEffect(() => {
    // Track view on component mount
    trackEvent('view');
  }, [trackEvent]);

  return { trackEvent };
};