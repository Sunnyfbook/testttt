import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Eye, PlayCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalViews: number;
  totalReactions: number;
  totalVideos: number;
  topVideos: Array<{
    video_id: string;
    title: string;
    views_count: number;
    reaction_count: number;
  }>;
  recentActivity: Array<{
    video_id: string;
    event_type: string;
    created_at: string;
  }>;
}

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalReactions: 0,
    totalVideos: 0,
    topVideos: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      // Get total videos
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      // Get total views from analytics
      const { count: totalViews } = await supabase
        .from('video_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'view');

      // Get total reactions
      const { count: totalReactions } = await supabase
        .from('video_reactions')
        .select('*', { count: 'exact', head: true });

      // Get top videos with view counts
      const { data: topVideos } = await supabase
        .from('videos')
        .select(`
          file_id,
          title,
          views_count
        `)
        .order('views_count', { ascending: false })
        .limit(5);

      // Get reaction counts for top videos
      const topVideosWithReactions = await Promise.all(
        (topVideos || []).map(async (video) => {
          const { count } = await supabase
            .from('video_reactions')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', video.file_id);
          
          return {
            video_id: video.file_id,
            title: video.title || 'Untitled',
            views_count: video.views_count || 0,
            reaction_count: count || 0
          };
        })
      );

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('video_analytics')
        .select('video_id, event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      setAnalytics({
        totalViews: totalViews || 0,
        totalReactions: totalReactions || 0,
        totalVideos: videoCount || 0,
        topVideos: topVideosWithReactions,
        recentActivity: recentActivity || []
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.totalVideos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.totalReactions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analytics.totalViews > 0 
                ? ((analytics.totalReactions / analytics.totalViews) * 100).toFixed(1) + '%'
                : '0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topVideos.map((video, index) => (
              <div key={video.video_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{video.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">ID: {video.video_id}</p>
                  </div>
                </div>
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye size={16} className="text-muted-foreground" />
                    <span>{video.views_count.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-muted-foreground" />
                    <span>{video.reaction_count} reactions</span>
                  </div>
                </div>
              </div>
            ))}
            {analytics.topVideos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No video data available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex flex-col xs:flex-row xs:items-center justify-between p-3 border border-border rounded-lg space-y-2 xs:space-y-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.event_type === 'view' ? 'bg-green-500' :
                    activity.event_type === 'play' ? 'bg-blue-500' :
                    activity.event_type === 'pause' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="min-w-0">
                    <span className="text-sm">
                      {activity.event_type.charAt(0).toUpperCase() + activity.event_type.slice(1)} event
                    </span>
                    <p className="text-xs text-muted-foreground truncate">Video: {activity.video_id}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {analytics.recentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;