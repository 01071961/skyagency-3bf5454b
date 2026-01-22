import { useState, useEffect, memo } from 'react';
import { Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProxyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  showUrl?: boolean;
}

// List of CORS proxy services to try
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

/**
 * ProxyImage component that handles CORS issues for external images.
 * Tries to load the image directly first, then falls back to CORS proxies.
 */
export const ProxyImage = memo(function ProxyImage({
  src,
  alt,
  className,
  fallbackClassName,
  showUrl = true
}: ProxyImageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [proxyIndex, setProxyIndex] = useState(-1); // -1 means direct load
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset state when src changes
    setStatus('loading');
    setCurrentSrc(src);
    setProxyIndex(-1);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    const nextProxyIndex = proxyIndex + 1;
    
    if (nextProxyIndex < CORS_PROXIES.length) {
      // Try next proxy
      setProxyIndex(nextProxyIndex);
      setCurrentSrc(CORS_PROXIES[nextProxyIndex](src));
      setStatus('loading');
    } else {
      // All proxies failed
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    setProxyIndex(-1);
    setCurrentSrc(src);
    setRetryCount(prev => prev + 1);
  };

  if (status === 'error') {
    return (
      <div className={cn(
        "bg-muted/50 flex flex-col items-center justify-center min-h-[120px] rounded-lg border border-dashed border-muted-foreground/30 p-4",
        fallbackClassName
      )}>
        <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <span className="text-xs text-muted-foreground text-center mb-2">
          Não foi possível carregar a imagem
        </span>
        {showUrl && (
          <span className="text-[10px] text-muted-foreground/50 max-w-[180px] truncate mb-3">
            {src}
          </span>
        )}
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="w-3 h-3" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", status === 'loading' && "min-h-[120px]")}>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse rounded-lg flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
        </div>
      )}
      <img
        key={`${currentSrc}-${retryCount}`}
        src={currentSrc}
        alt={alt}
        className={cn(
          className,
          status === 'loading' && "opacity-0"
        )}
        onLoad={() => setStatus('success')}
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
      />
      {status === 'success' && showUrl && (
        <span className="text-[10px] text-muted-foreground/60 mt-1 max-w-full truncate block">
          {src}
        </span>
      )}
    </div>
  );
});

export default ProxyImage;
