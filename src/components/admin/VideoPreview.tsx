import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, AlertCircle, RefreshCw, Info, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface VideoPreviewProps {
  url: string;
  className?: string;
}

// Validate and extract embed URL - exported for reuse
export function getEmbedUrl(url: string): { embedUrl: string | null; type: 'youtube' | 'vimeo' | 'direct' | 'supabase' | 'googledrive' | 'onedrive' | 'unknown' } {
  if (!url || typeof url !== 'string') {
    return { embedUrl: null, type: 'unknown' };
  }

  const trimmedUrl = url.trim();
  
  // YouTube - multiple formats
  const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return { 
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      type: 'youtube'
    };
  }

  // Vimeo
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      type: 'vimeo'
    };
  }

  // Google Drive - multiple formats
  const googleDriveMatch = trimmedUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${googleDriveMatch[1]}/preview`,
      type: 'googledrive'
    };
  }

  // OneDrive / SharePoint - various URL formats
  if (trimmedUrl.includes('onedrive.live.com') || trimmedUrl.includes('1drv.ms') || trimmedUrl.includes('sharepoint.com')) {
    // Already an embed URL
    if (trimmedUrl.includes('/embed') || trimmedUrl.includes('embed.aspx')) {
      return { embedUrl: trimmedUrl, type: 'onedrive' };
    }
    
    // Short link (1drv.ms) - these need to be opened externally or converted
    // Format: https://1drv.ms/v/c/{userId}/{fileId}
    if (trimmedUrl.includes('1drv.ms')) {
      // 1drv.ms links can't be directly embedded, return original for external viewing
      return { embedUrl: trimmedUrl, type: 'onedrive' };
    }
    
    // OneDrive personal link with resid
    // Format: https://onedrive.live.com/?cid=...&resid=...
    if (trimmedUrl.includes('resid=')) {
      const resIdMatch = trimmedUrl.match(/resid=([^&]+)/);
      const cidMatch = trimmedUrl.match(/cid=([^&]+)/);
      if (resIdMatch && cidMatch) {
        const embedUrl = `https://onedrive.live.com/embed?cid=${cidMatch[1]}&resid=${resIdMatch[1]}&authkey=`;
        return { embedUrl, type: 'onedrive' };
      }
    }
    
    // SharePoint URLs
    if (trimmedUrl.includes('sharepoint.com')) {
      const embedUrl = trimmedUrl.includes('?') 
        ? `${trimmedUrl}&action=embedview` 
        : `${trimmedUrl}?action=embedview`;
      return { embedUrl, type: 'onedrive' };
    }
    
    return { embedUrl: trimmedUrl, type: 'onedrive' };
  }

  // Supabase Storage URLs
  if (trimmedUrl.includes('supabase.co/storage')) {
    return { embedUrl: trimmedUrl, type: 'supabase' };
  }

  // Direct video files - SIMPLIFIED: detect ANY URL containing video extension
  // This matches .mp4, .webm, .ogg, .mov, .m4v, .avi anywhere in the URL (even before query params)
  if (trimmedUrl.match(/\.(?:mp4|webm|ogg|mov|m4v|avi)/i)) {
    return { embedUrl: trimmedUrl, type: 'direct' };
  }

  return { embedUrl: null, type: 'unknown' };
}

// Validate if URL is a valid video URL
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const { type } = getEmbedUrl(url.trim());
  return type !== 'unknown';
}

// Component for Google Drive video player - uses direct playback
function GoogleDrivePlayer({ fileId, originalUrl, className }: { fileId: string; originalUrl: string; className?: string }) {
  const [useDirectLink, setUseDirectLink] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Direct download/stream URL that bypasses iframe restrictions
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  
  const copyUrl = () => {
    navigator.clipboard.writeText(originalUrl);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openInNewTab = () => {
    window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
  };

  // Try direct video playback first
  if (useDirectLink || hasError) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="relative">
          <video 
            src={directUrl}
            controls 
            className="w-full aspect-video bg-black"
            playsInline
            onError={() => setHasError(true)}
          >
            Seu navegador não suporta o elemento de vídeo.
          </video>
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
              <p className="text-lg font-medium mb-2">Vídeo bloqueado pelo Google Drive</p>
              <p className="text-sm text-gray-300 text-center mb-4 max-w-md">
                O Google Drive restringe reprodução embutida em sites externos, mesmo com compartilhamento público.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={openInNewTab} variant="default">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Assistir no Google Drive
                </Button>
                <Button onClick={copyUrl} variant="outline">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copiar Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Try iframe first, with fallback option
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative">
        <iframe
          src={previewUrl}
          className="w-full aspect-video"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Google Drive Video"
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button 
            variant="secondary" 
            size="sm" 
            className="opacity-90 hover:opacity-100"
            onClick={() => setUseDirectLink(true)}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Não carrega?
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="opacity-90 hover:opacity-100"
            onClick={openInNewTab}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Component for Google Drive permission help (fallback)
function GoogleDriveHelp({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const fileIdMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
  const viewUrl = fileIdMatch ? `https://drive.google.com/file/d/${fileIdMatch[1]}/view` : url;

  return (
    <Card className="p-4 bg-amber-500/10 border-amber-500/30">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Reprodução externa bloqueada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              O Google Drive não permite reprodução embutida em sites externos. Use o botão abaixo para assistir.
            </p>
          </div>
          
          <div className="flex gap-2">
            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="default" size="sm" className="w-full">
                <ExternalLink className="w-4 h-4 mr-1" />
                Assistir no Google Drive
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={copyUrl}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function VideoPreview({ url, className }: VideoPreviewProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showDriveHelp, setShowDriveHelp] = useState(false);
  const { embedUrl, type } = getEmbedUrl(url);

  const handleError = useCallback(() => {
    if (type === 'googledrive' || type === 'onedrive') {
      setShowDriveHelp(true);
    }
    setHasError(true);
  }, [type]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setShowDriveHelp(false);
    setShowPlayer(true);
  }, []);

  // Handle iframe load to detect blocked content
  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    // For Google Drive, we can't directly detect blocked content via load event
    // But we provide the help button for users to troubleshoot
  }, []);

  if (!url) return null;

  // Show Google Drive specific help
  if (showDriveHelp && (type === 'googledrive' || type === 'onedrive')) {
    return (
      <div className={className}>
        <GoogleDriveHelp url={url} />
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 w-full" 
          onClick={handleRetry}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium">Erro ao carregar vídeo</p>
            <p className="text-xs">Verifique se a URL está correta</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  // Unknown/invalid URL format
  if (!embedUrl) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">URL não reconhecida</p>
            <p className="text-xs">Use YouTube, Vimeo, Google Drive, OneDrive ou link direto MP4</p>
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              Abrir
            </Button>
          </a>
        </div>
      </Card>
    );
  }

  // Preview placeholder - click to load
  if (!showPlayer) {
    return (
      <Card 
        className={`relative aspect-video bg-muted/50 flex items-center justify-center cursor-pointer hover:bg-muted transition-colors ${className}`}
        onClick={() => setShowPlayer(true)}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Play className="w-8 h-8 text-primary ml-1" />
          </div>
          <p className="text-sm text-muted-foreground">Clique para visualizar</p>
          <p className="text-xs text-muted-foreground mt-1">
            {type === 'youtube' && 'YouTube'}
            {type === 'vimeo' && 'Vimeo'}
            {type === 'googledrive' && 'Google Drive'}
            {type === 'onedrive' && 'OneDrive / SharePoint'}
            {type === 'direct' && 'Vídeo direto'}
            {type === 'supabase' && 'Supabase Storage'}
          </p>
          {(type === 'googledrive' || type === 'onedrive') && (
            <p className="text-xs text-amber-500 mt-2">
              ⚠️ Arquivo deve estar compartilhado publicamente
            </p>
          )}
        </div>
      </Card>
    );
  }

  // Direct video or Supabase storage
  if (type === 'direct' || type === 'supabase') {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <video 
          src={embedUrl} 
          controls 
          className="w-full aspect-video bg-black"
          playsInline
          crossOrigin="anonymous"
          onError={(e) => {
            // Try again without crossOrigin attribute (some servers don't support CORS headers)
            const video = e.currentTarget;
            if (video.getAttribute('crossorigin')) {
              video.removeAttribute('crossorigin');
              video.load();
            } else {
              handleError();
            }
          }}
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
      </Card>
    );
  }

  // Google Drive - use custom player component
  if (type === 'googledrive') {
    const fileIdMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return <GoogleDrivePlayer fileId={fileIdMatch[1]} originalUrl={url} className={className} />;
    }
  }

  // OneDrive - check if it's a short link that can't be embedded
  if (type === 'onedrive') {
    const isShortLink = url.includes('1drv.ms');
    
    // Short links can't be embedded, show direct open option
    if (isShortLink) {
      return (
        <Card className={`overflow-hidden ${className}`}>
          <div className="relative aspect-video bg-black flex flex-col items-center justify-center p-4 text-white">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <p className="text-lg font-medium mb-2 text-center">Vídeo do OneDrive</p>
            <p className="text-sm text-gray-300 text-center mb-4 max-w-md">
              Links curtos do OneDrive não podem ser reproduzidos diretamente. Use o código de incorporação do OneDrive ou abra o vídeo no navegador.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => window.open(url, '_blank')} variant="default">
                <ExternalLink className="w-4 h-4 mr-2" />
                Assistir no OneDrive
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center max-w-sm">
              💡 Dica: No OneDrive, clique em "Incorporar" e cole a URL do iframe aqui para reprodução embutida.
            </p>
          </div>
        </Card>
      );
    }
    
    // Try to embed
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="relative">
          <iframe
            src={embedUrl}
            className="w-full aspect-video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="OneDrive Video Preview"
            onLoad={handleIframeLoad}
          />
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute bottom-2 right-2 opacity-80 hover:opacity-100"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Abrir no OneDrive
          </Button>
        </div>
      </Card>
    );
  }

  // YouTube/Vimeo iframe
  return (
    <Card className={`overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video Preview"
        onError={handleError}
      />
    </Card>
  );
}