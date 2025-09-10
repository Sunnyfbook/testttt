import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  name: string;
  type: 'banner' | 'popup' | 'interstitial' | 'vast';
  content: any;
  placement: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  priority: number;
  created_at: string;
}

const AdsManagement = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    type: 'banner' | 'popup' | 'interstitial' | 'vast';
    placement: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    priority: number;
    content: {
      html: string;
      image_url: string;
      link_url: string;
      alt_text: string;
      vast_url: string;
    };
  }>({
    name: '',
    type: 'banner',
    placement: '',
    is_active: true,
    start_date: '',
    end_date: '',
    priority: 1,
    content: {
      html: '',
      image_url: '',
      link_url: '',
      alt_text: '',
      vast_url: ''
    }
  });

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setAds((data || []) as Ad[]);
    } catch (error) {
      console.error('Error loading ads:', error);
      toast({
        title: "Error",
        description: "Failed to load ads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'banner' as const,
      placement: '',
      is_active: true,
      start_date: '',
      end_date: '',
      priority: 1,
      content: {
        html: '',
        image_url: '',
        link_url: '',
        alt_text: '',
        vast_url: ''
      }
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      name: ad.name,
      type: ad.type,
      placement: ad.placement,
      is_active: ad.is_active,
      start_date: ad.start_date ? new Date(ad.start_date).toISOString().split('T')[0] : '',
      end_date: ad.end_date ? new Date(ad.end_date).toISOString().split('T')[0] : '',
      priority: ad.priority,
      content: ad.content
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.placement) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const adData = {
        name: formData.name,
        type: formData.type,
        placement: formData.placement,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        priority: formData.priority,
        content: formData.content
      };

      if (editingAd) {
        const { error } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editingAd.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ads')
          .insert(adData);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Ad ${editingAd ? 'updated' : 'created'} successfully`,
      });

      loadAds();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: "Failed to save ad",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ad deleted successfully",
      });

      loadAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error",
        description: "Failed to delete ad",
        variant: "destructive",
      });
    }
  };

  const toggleAdStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadAds();
    } catch (error) {
      console.error('Error toggling ad status:', error);
    }
  };

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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle>Ads Management</CardTitle>
              <p className="text-muted-foreground">Manage banner, popup, interstitial, and VAST ads</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="hero-button w-full sm:w-auto">
                  <Plus className="mr-2" size={16} />
                  <span className="hidden xs:inline">Create Ad</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{editingAd ? 'Edit Ad' : 'Create New Ad'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Ad Name*</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Banner Ad - Homepage"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Ad Type*</label>
                        <Select value={formData.type} onValueChange={(value: 'banner' | 'popup' | 'interstitial' | 'vast') => setFormData({...formData, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="banner">Banner</SelectItem>
                            <SelectItem value="popup">Popup</SelectItem>
                            <SelectItem value="interstitial">Interstitial</SelectItem>
                            <SelectItem value="vast">VAST</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Placement*</label>
                    <Select value={formData.placement} onValueChange={(value) => setFormData({...formData, placement: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad placement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Header - Homepage top section</SelectItem>
                        <SelectItem value="sidebar">Sidebar - Homepage side area</SelectItem>
                        <SelectItem value="bottom-banner">Bottom Banner - Homepage bottom</SelectItem>
                        <SelectItem value="stream-player-top">Stream - Top of video player</SelectItem>
                        <SelectItem value="stream-below-reactions">Stream - Below reactions</SelectItem>
                        <SelectItem value="stream-below-download">Stream - Below download button</SelectItem>
                        <SelectItem value="stream-below-copy">Stream - Below copy button</SelectItem>
                        <SelectItem value="stream-below-share">Stream - Below share button</SelectItem>
                        <SelectItem value="stream-interstitial">Stream - Interstitial popup</SelectItem>
                        <SelectItem value="stream-vast">Stream - VAST video overlay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                  </div>

                  {formData.type === 'banner' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">HTML/JavaScript Code</label>
                        <Textarea
                          value={formData.content.html}
                          onChange={(e) => setFormData({
                            ...formData, 
                            content: {...formData.content, html: e.target.value}
                          })}
                          placeholder="Paste your ad code here (Google Ads, Facebook Ads, etc.)&#10;Example:&#10;&lt;script async src=&quot;https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js&quot;&gt;&lt;/script&gt;&#10;&lt;ins class=&quot;adsbygoogle&quot; style=&quot;display:block&quot; data-ad-client=&quot;ca-pub-xxx&quot;&gt;&lt;/ins&gt;&#10;&lt;script&gt;(adsbygoogle = window.adsbygoogle || []).push({});&lt;/script&gt;"
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Supported formats:</strong></p>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Complete Google AdSense code (with script tags)</li>
                          <li>• Custom HTML banners with CSS/JavaScript</li>
                          <li>• Third-party ad network codes</li>
                          <li>• Image-based advertisements</li>
                        </ul>
                        <p className="mt-2 text-amber-600 font-medium">⚠️ Include complete script tags for proper ad rendering</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fallback Image URL (optional)</label>
                        <Input
                          value={formData.content.image_url}
                          onChange={(e) => setFormData({
                            ...formData, 
                            content: {...formData.content, image_url: e.target.value}
                          })}
                          placeholder="https://example.com/fallback-banner.jpg"
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === 'vast' && (
                    <div>
                      <label className="text-sm font-medium">VAST URL</label>
                      <Input
                        value={formData.content.vast_url}
                        onChange={(e) => setFormData({
                          ...formData, 
                          content: {...formData.content, vast_url: e.target.value}
                        })}
                        placeholder="https://example.com/vast.xml"
                      />
                    </div>
                  )}

                  {(formData.type === 'popup' || formData.type === 'interstitial') && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">HTML/JavaScript Code</label>
                        <Textarea
                          value={formData.content.html}
                          onChange={(e) => setFormData({
                            ...formData, 
                            content: {...formData.content, html: e.target.value}
                          })}
                          placeholder="Paste your popup/interstitial ad code here&#10;Example:&#10;&lt;div style=&quot;background: white; padding: 20px; border-radius: 8px; max-width: 400px;&quot;&gt;&#10;  &lt;h3&gt;Special Offer!&lt;/h3&gt;&#10;  &lt;p&gt;Get 50% off today only&lt;/p&gt;&#10;  &lt;button onclick=&quot;window.open('https://example.com')&quot;&gt;Claim Now&lt;/button&gt;&#10;  &lt;button onclick=&quot;this.closest('.ad-overlay').style.display='none'&quot;&gt;Close&lt;/button&gt;&#10;&lt;/div&gt;"
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Tips:</strong></p>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Include a close button for better UX</li>
                          <li>• Use onclick="this.closest('.ad-overlay').style.display='none'" to close</li>
                          <li>• Keep popup content under 400px width</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <label className="text-sm font-medium">Active</label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button onClick={handleSave} className="hero-button w-full sm:w-auto">
                        {editingAd ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                    <h3 className="font-medium truncate">{ad.name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                        ad.type === 'banner' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        ad.type === 'popup' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        ad.type === 'interstitial' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {ad.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-muted-foreground hidden sm:inline">
                        Placement: {ad.placement}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mt-2">
                    <p className="text-sm text-muted-foreground">
                      Priority: {ad.priority}
                    </p>
                    <span className="hidden xs:inline text-sm text-muted-foreground">|</span>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(ad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 sm:hidden truncate">
                    {ad.placement}
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                    className={ad.is_active ? 'text-green-600' : 'text-gray-400'}
                  >
                    {ad.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(ad)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ad.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
            {ads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No ads created yet.</p>
                <p className="text-sm">Click "Create Ad" to add banner, popup, interstitial, or VAST ads to your website.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsManagement;