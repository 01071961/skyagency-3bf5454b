'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiDevicePreviewProps {
  slug?: string;
  status?: string;
  className?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICES: Record<DeviceType, { width: number; height: number; icon: React.ElementType; label: string }> = {
  desktop: { width: 1200, height: 800, icon: Monitor, label: 'Desktop' },
  tablet: { width: 768, height: 1024, icon: Tablet, label: 'Tablet' },
  mobile: { width: 375, height: 667, icon: Smartphone, label: 'Mobile' }
};

export function MultiDevicePreview({ slug, status, className }: MultiDevicePreviewProps) {
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const previewUrl = slug 
    ? status === 'published' 
      ? `/produto/${slug}` 
      : `/preview/${slug}`
    : null;

  const device = DEVICES[activeDevice];
  const scale = activeDevice === 'desktop' ? 0.35 : activeDevice === 'tablet' ? 0.4 : 0.5;

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  if (!slug) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-sm">Salve o produto para ver o preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Preview Multi-dispositivo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              asChild
            >
              <a href={previewUrl || '#'} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
                Abrir
              </a>
            </Button>
          </div>
        </div>

        {/* Device Selector */}
        <div className="flex items-center gap-1 mt-2">
          {(Object.keys(DEVICES) as DeviceType[]).map((deviceKey) => {
            const { icon: Icon, label } = DEVICES[deviceKey];
            return (
              <Button
                key={deviceKey}
                variant={activeDevice === deviceKey ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs gap-1 flex-1"
                onClick={() => setActiveDevice(deviceKey)}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDevice}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-muted/50 flex items-center justify-center p-4 overflow-hidden"
            style={{ minHeight: '350px' }}
          >
            {/* Device Frame */}
            <div
              className={cn(
                "relative bg-background rounded-lg shadow-2xl overflow-hidden border-4",
                activeDevice === 'mobile' && "border-8 rounded-[24px]"
              )}
              style={{
                width: device.width * scale,
                height: device.height * scale,
              }}
            >
              {/* Mobile Notch */}
              {activeDevice === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg z-10" />
              )}

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              <iframe
                key={refreshKey}
                src={previewUrl || undefined}
                className="w-full h-full"
                style={{
                  width: device.width,
                  height: device.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                onLoad={() => setIsLoading(false)}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Device Info */}
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 text-[10px]"
            >
              {device.width} × {device.height}
            </Badge>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
