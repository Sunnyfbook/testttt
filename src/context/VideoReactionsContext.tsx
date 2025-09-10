import React, { createContext, useContext, ReactNode } from 'react';
import { useVideoReactions } from '@/hooks/useVideoReactions';

interface VideoReactionsContextValue {
  hasReacted: boolean;
  userReaction: string | null;
  reactionCounts: { reaction_type: string; count: number }[];
  loading: boolean;
  addReaction: (reactionType: string) => Promise<void>;
  ipAddress: string;
}

const VideoReactionsContext = createContext<VideoReactionsContextValue | undefined>(undefined);

interface ProviderProps {
  videoId: string;
  children: ReactNode;
}

export const VideoReactionsProvider: React.FC<ProviderProps> = ({ videoId, children }) => {
  const value = useVideoReactions(videoId);
  return (
    <VideoReactionsContext.Provider value={value}>
      {children}
    </VideoReactionsContext.Provider>
  );
};

export const useVideoReactionsContext = (): VideoReactionsContextValue => {
  const ctx = useContext(VideoReactionsContext);
  if (!ctx) {
    throw new Error('useVideoReactionsContext must be used within a VideoReactionsProvider');
  }
  return ctx;
};
