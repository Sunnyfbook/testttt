import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Video, Download, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import AdDisplay from '@/components/AdDisplay';
import TikTokHomepage from '@/components/TikTokHomepage';

const Index = () => {
  const [videoId, setVideoId] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [showTraditionalView, setShowTraditionalView] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('website_settings')
          .select('*');
        
        const settings = (data || []).reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = typeof setting.setting_value === 'string' 
            ? setting.setting_value.replace(/"/g, '') 
            : setting.setting_value;
          return acc;
        }, {});
        
        setSiteSettings(settings);
        
        // Update document title
        if (settings.site_title) {
          document.title = settings.site_title;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();

    // Check if user wants traditional view
    const traditional = searchParams.get('traditional');
    setShowTraditionalView(traditional === 'true');
  }, [searchParams]);

  const handleStream = () => {
    if (videoId.trim()) {
      navigate(`/stream?id=${encodeURIComponent(videoId.trim())}`);
    }
  };

  const handleDemoStream = () => {
    // Using the example ID from the requirements
    navigate('/stream?id=AgADCx_568');
  };

  // Show TikTok-style homepage by default, traditional view with ?traditional=true
  if (!showTraditionalView) {
    return <TikTokHomepage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toggle Button for Traditional View */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="sm"
          className="bg-card/90 backdrop-blur-sm"
        >
          <Video className="mr-2" size={16} />
          TikTok View
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background"></div>
        <div className="relative container mx-auto px-4 py-10 sm:py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-in">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-8 sm:mb-12 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                {siteSettings.hero_title || 'StreamFlix'}
              </h1>
            </div>

            {/* Header Ads */}
            <AdDisplay placement="header" className="mb-4" />

            {/* Stream Input */}
            <div className="animate-slide-up max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Input
                  placeholder="Enter Video ID"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStream()}
                  className="bg-card/50 backdrop-blur-md border-border/50 text-xl py-6 px-6 rounded-2xl text-center shadow-2xl focus:shadow-primary/20 transition-all duration-300"
                />
                <Button 
                  onClick={handleStream} 
                  className="absolute right-2 top-2 bottom-2 hero-button rounded-xl px-8"
                >
                  <Play className="mr-2" size={20} />
                  Watch
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleDemoStream}
                className="mt-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                Try Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        {/* Sidebar Ads */}
        <AdDisplay placement="sidebar" className="float-right ml-4 mb-4 max-w-xs" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group hover:scale-105 transition-all duration-500 gradient-card border-border glow-effect hover:shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Play className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Instant Play</h3>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-500 gradient-card border-border glow-effect hover:shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Video className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">4K Quality</h3>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-500 gradient-card border-border glow-effect hover:shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Download className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Download</h3>
            </CardContent>
          </Card>
        </div>
        
        {/* Bottom Banner Ads */}
        <div className="mt-20">
          <AdDisplay placement="bottom-banner" className="max-w-4xl mx-auto" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              &copy; 2024 StreamFlix. Built with React, TypeScript, and modern web technologies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;