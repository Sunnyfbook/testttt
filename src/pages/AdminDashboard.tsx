import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  BarChart3, 
  FileImage, 
  Users, 
  LogOut,
  Home,
  Monitor,
  Globe,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WebsiteSettings from '@/components/admin/WebsiteSettings';
import AdsManagement from '@/components/admin/AdsManagement';
import Analytics from '@/components/admin/Analytics';
import AdminUsers from '@/components/admin/AdminUsers';
import VideosManagement from '@/components/admin/VideosManagement';

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/admin/login');
          return;
        }

        setUser(session.user);

        // Get user profile to check admin role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!profileData || profileData.role !== 'admin') {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "Admin access required",
            variant: "destructive",
          });
          navigate('/admin/login');
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin/login');
    }
  };

  const goToWebsite = () => {
    navigate('/');
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Monitor className="text-white" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Welcome, {profile.username || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button variant="outline" onClick={goToWebsite} size="sm" className="px-2 sm:px-4">
                <Home className="sm:mr-2" size={16} />
                <span className="hidden sm:inline">Website</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm" className="px-2 sm:px-4">
                <LogOut className="sm:mr-2" size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="videos" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto p-1">
            <TabsTrigger value="videos" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              <Video size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              <Settings size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              <FileImage size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              <BarChart3 size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
              <Users size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <VideosManagement />
          </TabsContent>

          <TabsContent value="settings">
            <WebsiteSettings />
          </TabsContent>

          <TabsContent value="ads">
            <AdsManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;