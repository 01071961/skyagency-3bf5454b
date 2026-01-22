/**
 * MediaRenderer - Componente para renderizar diferentes tipos de mídia
 * Suporta imagem, vídeo (MP4, YouTube, Vimeo) e embeds
 */

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Play, Volume2, VolumeX, Loader2, AlertCircle } from "lucide-react";

export type MediaType = 'image' | 'video' | 'embed' | 'auto';

export interface MediaItem {
  id: string;
  url: string;
  type?: MediaType;
  alt?: string;
  headline?: string;
  subheadline?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

interface MediaRendererProps {
  item: MediaItem;
  className?: string;
  showOverlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Detecta o tipo de mídia baseado na URL
 */
export function detectMediaType(url: string): MediaType {
  if (!url) return 'image';
  
  const lowercaseUrl = url.toLowerCase();
  
  // Check for video file extensions
  if (/\.(mp4|webm|ogg|mov|avi)($|\?)/.test(lowercaseUrl)) {
    return 'video';
  }
  
  // Check for YouTube
  if (/youtube\.com|youtu\.be/.test(lowercaseUrl)) {
    return 'embed';
  }
  
  // Check for Vimeo
  if (/vimeo\.com/.test(lowercaseUrl)) {
    return 'embed';
  }
  
  // Check for Google Drive
  if (/drive\.google\.com/.test(lowercaseUrl)) {
    return 'embed';
  }
  
  // Check for OneDrive / SharePoint
  if (/onedrive\.live\.com|1drv\.ms|sharepoint\.com/.test(lowercaseUrl)) {
    return 'embed';
  }
  
  // Check for common embed patterns
  if (/\.(html|htm)($|\?)/.test(lowercaseUrl) || /embed|iframe/.test(lowercaseUrl)) {
    return 'embed';
  }
  
  // Default to image
  return 'image';
}

/**
 * Converte URL para formato embed - ALL formats supported
 * Suporta: YouTube, Vimeo, Google Drive, OneDrive, SharePoint, Wistia, Loom
 */
export function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // YouTube - ALL formats: watch?v=, embed/, v/, shorts/, youtu.be/
  const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1&rel=0`;
  }
  
  // Vimeo
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1`;
  }
  
  // Google Drive - multiple formats
  const googleDriveMatch = trimmedUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    return `https://drive.google.com/file/d/${googleDriveMatch[1]}/preview`;
  }
  
  // OneDrive / SharePoint
  if (trimmedUrl.includes('onedrive.live.com') || trimmedUrl.includes('1drv.ms') || trimmedUrl.includes('sharepoint.com')) {
    // If already an embed URL, use it directly
    if (trimmedUrl.includes('/embed')) {
      return trimmedUrl;
    }
    // Convert 1drv.ms to embed format
    if (trimmedUrl.includes('1drv.ms')) {
      return trimmedUrl.replace('1drv.ms', 'onedrive.live.com/embed');
    }
    // For sharepoint links, add embed action
    if (trimmedUrl.includes('sharepoint.com')) {
      return trimmedUrl.includes('?') 
        ? `${trimmedUrl}&action=embedview` 
        : `${trimmedUrl}?action=embedview`;
    }
    return trimmedUrl;
  }
  
  // Wistia
  const wistiaMatch = trimmedUrl.match(/(?:wistia\.(?:com|net)\/(?:medias|embed)\/)([a-zA-Z0-9]+)/);
  if (wistiaMatch) {
    return `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}?autoplay=1&muted=1`;
  }
  
  // Loom
  const loomMatch = trimmedUrl.match(/(?:loom\.com\/(?:share|embed)\/)([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1&muted=1`;
  }
  
  return trimmedUrl;
}

/**
 * Componente principal de renderização de mídia
 */
export function MediaRenderer({
  item,
  className,
  showOverlay = false,
  overlayOpacity = 30,
  overlayColor = "#000000",
  transition = 'fade',
  onLoad,
  onError
}: MediaRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(item.muted !== false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const mediaType = item.type || detectMediaType(item.url);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((e: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error(`Failed to load media: ${item.url}`));
  }, [item.url, onError]);

  const handlePlayClick = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Reset state when item changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
  }, [item.url]);

  // Get transition variants
  const getTransitionVariants = () => {
    switch (transition) {
      case 'slide':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 }
        };
      case 'zoom':
        return {
          initial: { scale: 1.1, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.9, opacity: 0 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getTransitionVariants();

  // Error state
  if (hasError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted/50 text-muted-foreground",
        className
      )}>
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Erro ao carregar mídia</p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Image */}
      {mediaType === 'image' && (
        <img
          src={item.url}
          alt={item.alt || ''}
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Direct Video (MP4, WebM, etc.) */}
      {mediaType === 'video' && (
        <>
          <video
            ref={videoRef}
            src={item.url}
            className="w-full h-full object-cover"
            autoPlay={item.autoplay !== false}
            muted={isMuted}
            loop={item.loop !== false}
            playsInline
            onLoadedData={handleLoad}
            onError={handleError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            <button
              type="button"
              onClick={handlePlayClick}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <Play className={cn("w-4 h-4", isPlaying && "hidden")} />
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}

      {/* Embed (YouTube, Vimeo, etc.) */}
      {mediaType === 'embed' && (
        <iframe
          src={getEmbedUrl(item.url)}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Content Overlay (Headlines) */}
      {(item.headline || item.subheadline) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-15">
          {item.headline && (
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {item.headline}
            </h2>
          )}
          {item.subheadline && (
            <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
              {item.subheadline}
            </p>
          )}
        </div>
      )}

      {/* Dark Overlay */}
      {showOverlay && (
        <div
          className="absolute inset-0 pointer-events-none z-5"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * Slideshow com suporte a múltiplos tipos de mídia
 */
interface MediaSlideshowProps {
  items: MediaItem[];
  interval?: number;
  transition?: 'fade' | 'slide' | 'zoom';
  showIndicators?: boolean;
  showOverlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  className?: string;
}

export function MediaSlideshow({
  items,
  interval = 5,
  transition = 'fade',
  showIndicators = true,
  showOverlay = false,
  overlayOpacity = 30,
  overlayColor = "#000000",
  className
}: MediaSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, interval * 1000);
    
    return () => clearInterval(timer);
  }, [items.length, interval]);

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        <MediaRenderer
          key={`${currentIndex}-${currentItem.id}`}
          item={currentItem}
          className="absolute inset-0"
          transition={transition}
          showOverlay={showOverlay}
          overlayOpacity={overlayOpacity}
          overlayColor={overlayColor}
        />
      </AnimatePresence>

      {/* Slide Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentIndex
                  ? "w-6 bg-white"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaRenderer;
