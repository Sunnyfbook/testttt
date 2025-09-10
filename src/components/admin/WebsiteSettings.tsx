import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WebsiteSetting {
  setting_key: string;
  setting_value: any;
  description: string;
}

const WebsiteSettings = () => {
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load website settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = settings.map(setting => ({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        description: setting.description
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('website_settings')
          .upsert(update, { onConflict: 'setting_key' });
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Website settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.setting_key === key 
        ? { ...setting, setting_value: value }
        : setting
    ));
  };

  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? (typeof setting.setting_value === 'string' ? setting.setting_value.replace(/"/g, '') : setting.setting_value) : '';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin mr-2" size={24} />
          Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website Settings</CardTitle>
          <p className="text-muted-foreground">Manage your website content and metadata</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site Title</label>
              <Input
                value={getSettingValue('site_title')}
                onChange={(e) => updateSetting('site_title', JSON.stringify(e.target.value))}
                placeholder="StreamFlix Pro"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Email</label>
              <Input
                value={getSettingValue('contact_email')}
                onChange={(e) => updateSetting('contact_email', JSON.stringify(e.target.value))}
                placeholder="admin@streamflix.com"
                type="email"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Site Description</label>
              <Textarea
                value={getSettingValue('site_description')}
                onChange={(e) => updateSetting('site_description', JSON.stringify(e.target.value))}
                placeholder="Website description for SEO"
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Meta Keywords</label>
              <Input
                value={getSettingValue('site_keywords')}
                onChange={(e) => updateSetting('site_keywords', JSON.stringify(e.target.value))}
                placeholder="video streaming, online player, HD videos"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Hero Title</label>
              <Input
                value={getSettingValue('hero_title')}
                onChange={(e) => updateSetting('hero_title', JSON.stringify(e.target.value))}
                placeholder="StreamFlix Pro"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Hero Subtitle</label>
              <Textarea
                value={getSettingValue('hero_subtitle')}
                onChange={(e) => updateSetting('hero_subtitle', JSON.stringify(e.target.value))}
                placeholder="Hero section subtitle"
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={loadSettings} className="w-full sm:w-auto">
              <RefreshCw className="mr-2" size={16} />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving} className="hero-button w-full sm:w-auto">
              <Save className="mr-2" size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteSettings;