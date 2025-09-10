import React, { useState } from 'react';
import { Heart, Laugh, Frown, ThumbsUp, Zap, Angry } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoReactionsContext } from '@/context/VideoReactionsContext';

interface Reaction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}

interface VideoReactionsProps {
  videoId: string;
}

const VideoReactions: React.FC<VideoReactionsProps> = ({ videoId }) => {
  const { hasReacted, userReaction, reactionCounts, loading, addReaction } = useVideoReactionsContext();
  
  const reactions: Reaction[] = [
    { id: 'like', icon: <ThumbsUp size={20} />, label: 'Like', color: 'text-blue-500' },
    { id: 'love', icon: <Heart size={20} />, label: 'Love', color: 'text-red-500' },
    { id: 'laugh', icon: <Laugh size={20} />, label: 'Haha', color: 'text-yellow-500' },
    { id: 'wow', icon: <Zap size={20} />, label: 'Wow', color: 'text-orange-500' },
    { id: 'sad', icon: <Frown size={20} />, label: 'Sad', color: 'text-gray-500' },
    { id: 'angry', icon: <Angry size={20} />, label: 'Angry', color: 'text-red-600' },
  ];

  const handleReaction = (reactionId: string) => {
    addReaction(reactionId);
  };

  const getReactionCount = (reactionId: string) => {
    const reactionCount = reactionCounts.find(rc => rc.reaction_type === reactionId);
    return reactionCount?.count || 0;
  };

  const getTotalReactions = () => {
    return reactionCounts.reduce((sum, rc) => sum + rc.count, 0);
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-card via-card/80 to-card/60 border border-border/50 rounded-xl p-4 sm:p-6 animate-fade-in backdrop-blur-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 sm:gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-br from-card via-card/80 to-card/60 border border-border/50 rounded-xl p-4 sm:p-6 animate-fade-in backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
          <Heart className="text-red-500" size={20} />
          Reactions
        </h3>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {getTotalReactions()} people reacted
        </div>
      </div>
      
      {/* Facebook-Style Reaction Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        {reactions.map((reaction) => (
          <Button
            key={reaction.id}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(reaction.id)}
            className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 transform hover:scale-105 md:hover:scale-110 text-xs sm:text-sm ${
              userReaction === reaction.id 
                ? 'bg-primary/20 border-2 border-primary/40 shadow-lg scale-105' 
                : 'bg-muted/30 hover:bg-muted/50 border border-border/30'
            }`}
          >
            <div className={`text-lg sm:text-2xl transition-transform duration-200 ${
              userReaction === reaction.id ? 'scale-110 sm:scale-125' : ''
            }`}>
              <span className={reaction.color}>{reaction.icon}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium text-xs sm:text-sm">{reaction.label}</span>
              <span className="text-xs text-muted-foreground">{getReactionCount(reaction.id)}</span>
            </div>
            {userReaction === reaction.id && (
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
            )}
          </Button>
        ))}
      </div>

      {/* Reaction Bar - Facebook Style */}
      <div className="relative">
        <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border border-border/30">
          <div className="flex -space-x-1">
            {reactions.slice(0, 4).map((reaction, index) => (
              <div
                key={reaction.id}
                className="w-8 h-8 rounded-full bg-background border-2 border-background flex items-center justify-center text-sm"
                style={{ zIndex: 4 - index }}
              >
                <span className={reaction.color}>{reaction.icon}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 text-sm text-muted-foreground">
            <span className="font-medium">
              {reactionCounts.length > 0 ? reactionCounts[0]?.reaction_type : 'No reactions yet'}
            </span>
            {reactionCounts.length > 1 && (
              <span> and {getTotalReactions() - (reactionCounts[0]?.count || 0)} others</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoReactions;