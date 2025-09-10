import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Component to handle script-based ads
const ScriptAdRenderer: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && html) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Extract and execute scripts
      const scripts = tempDiv.querySelectorAll('script');
      const nonScriptContent = tempDiv.innerHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Add non-script content first
      if (nonScriptContent.trim()) {
        containerRef.current.innerHTML = nonScriptContent;
      }
      
      // Execute scripts
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
          newScript.async = true;
        } else {
          newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
      });
    }
  }, [html]);

  return <div ref={containerRef} className={className} style={{ minHeight: '100px' }} />;
};

// Component to handle VAST ads
const VastAdPlayer: React.FC<{ vastUrl: string }> = ({ vastUrl }) => {
  return (
    <div className="vast-player bg-black text-white p-4 text-center">
      <p>VAST Ad Player</p>
      <p className="text-sm opacity-75">URL: {vastUrl}</p>
      <div className="mt-2">
        <button className="bg-white text-black px-4 py-2 rounded">
          Play VAST Ad
        </button>
      </div>
    </div>
  );
};

interface Ad {
  id: string;
  name: string;
  type: 'banner' | 'popup' | 'interstitial' | 'vast';
  content: any;
  placement: string;
  priority: number;
}

interface AdDisplayProps {
  placement: string;
  className?: string;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ placement, className = '' }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);

  useEffect(() => {
    const loadAds = async () => {
      try {
        console.log('Loading ads for placement:', placement);
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('placement', placement)
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (error) throw error;
        
        const validAds = (data || []) as Ad[];
        console.log('Loaded ads:', validAds);
        setAds(validAds);
        if (validAds.length > 0) {
          setCurrentAd(validAds[0]);
          console.log('Set current ad:', validAds[0]);
        } else {
          console.log('No ads found for placement:', placement);
        }
      } catch (error) {
        console.error('Error loading ads:', error);
      }
    };

    loadAds();
  }, [placement]);

  if (!currentAd) return null;

  const renderAd = () => {
    switch (currentAd.type) {
      case 'banner':
        return (
          <div className={`ad-banner ${className}`}>
            {currentAd.content.html ? (
              <ScriptAdRenderer 
                html={currentAd.content.html}
                className="w-full"
              />
            ) : currentAd.content.image_url ? (
              <a href={currentAd.content.link_url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={currentAd.content.image_url} 
                  alt={currentAd.content.alt_text || 'Advertisement'}
                  className="w-full h-auto"
                />
              </a>
            ) : (
              <div className="p-4 bg-muted/20 border border-border rounded text-center">
                <p className="text-sm text-muted-foreground">No ads configured for {placement}</p>
              </div>
            )}
          </div>
        );
      
      case 'popup':
      case 'interstitial':
        return (
          <div className="ad-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-lg w-full max-h-[80vh] overflow-auto bg-white rounded-lg p-4">
              {currentAd.content.html ? (
                <ScriptAdRenderer 
                  html={currentAd.content.html}
                  className="w-full"
                />
              ) : (
                <p>No ad content available</p>
              )}
              <button 
                onClick={() => setCurrentAd(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        );
      
      case 'vast':
        return (
          <div className={`vast-ad ${className}`}>
            {currentAd.content.vast_url ? (
              <VastAdPlayer vastUrl={currentAd.content.vast_url} />
            ) : currentAd.content.html ? (
              <ScriptAdRenderer 
                html={currentAd.content.html}
                className="w-full h-full"
              />
            ) : (
              <div className="p-4 bg-black text-white text-center">
                <p>VAST Ad Player - No content configured</p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return renderAd();
};

export default AdDisplay;