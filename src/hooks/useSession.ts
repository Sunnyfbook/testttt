import { useState, useEffect } from 'react';

export const useSession = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Get existing session ID from localStorage or create new one
    let existingSessionId = localStorage.getItem('video_session_id');
    
    if (!existingSessionId) {
      // Generate a unique session ID
      existingSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('video_session_id', existingSessionId);
    }
    
    setSessionId(existingSessionId);
  }, []);

  return sessionId;
};