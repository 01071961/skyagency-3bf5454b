import { useState } from 'react';
import { 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Copy, 
  CheckCircle, 
  Share2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ShareProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  affiliateLink: string;
  productImage?: string;
  productSlug?: string;
}

export default function ShareProductDialog({
  isOpen,
  onClose,
  productName,
  affiliateLink,
  productImage,
  productSlug
}: ShareProductDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate shareable URL with OG meta tags for social media crawlers
  const getShareableUrl = (): string => {
    if (productSlug) {
      // Use edge function URL which returns proper HTML with OG meta tags
      return `https://wwxtqujohqsrcgqopthz.supabase.co/functions/v1/product-meta?slug=${productSlug}&format=html`;
    }
    return affiliateLink;
  };

  const shareUrl = getShareableUrl();
  const shareText = `🔥 Confira ${productName}!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    instagram: `https://www.instagram.com/`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedText}`
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    toast({
      title: 'Link aberto!',
      description: `Compartilhando no ${platform.charAt(0).toUpperCase() + platform.slice(1)} com imagem e descrição`,
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: 'Link copiado!',
      description: 'Cole em qualquer rede social - imagem e descrição serão exibidas automaticamente.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: affiliateLink,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartilhar Produto
          </DialogTitle>
          <DialogDescription>
            Compartilhe seu link de afiliado e ganhe comissão!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Preview with Image */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {productImage ? (
                <img 
                  src={productImage} 
                  alt={productName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm line-clamp-2">{productName}</p>
                <p className="text-xs text-green-500 mt-1 font-medium">
                  ✓ Link otimizado para redes sociais
                </p>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Seu link de compartilhamento:</p>
            <div className="flex items-center gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="text-xs"
              />
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                onClick={copyLink}
                className="shrink-0"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Compartilhar em:</p>
            
            <div className="grid grid-cols-3 gap-3">
              {/* WhatsApp */}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500"
                onClick={() => handleShare('whatsapp')}
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs">WhatsApp</span>
              </Button>

              {/* Facebook */}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-500"
                onClick={() => handleShare('facebook')}
              >
                <Facebook className="w-6 h-6" />
                <span className="text-xs">Facebook</span>
              </Button>

              {/* Instagram - Copy for Stories */}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-pink-500/10 hover:border-pink-500/50 hover:text-pink-500"
                onClick={() => {
                  copyLink();
                  toast({
                    title: 'Link copiado!',
                    description: 'Abra o Instagram e cole nos Stories ou Bio.',
                  });
                  window.open('https://www.instagram.com/', '_blank');
                }}
              >
                <Instagram className="w-6 h-6" />
                <span className="text-xs">Instagram</span>
              </Button>

              {/* Telegram */}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-sky-500/10 hover:border-sky-500/50 hover:text-sky-500"
                onClick={() => handleShare('telegram')}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span className="text-xs">Telegram</span>
              </Button>

              {/* Twitter/X */}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-foreground/10 hover:border-foreground/50"
                onClick={() => handleShare('twitter')}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-xs">X/Twitter</span>
              </Button>

              {/* LinkedIn */}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-blue-600/10 hover:border-blue-600/50 hover:text-blue-600"
                onClick={() => handleShare('linkedin')}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-xs">LinkedIn</span>
              </Button>
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button onClick={handleNativeShare} className="w-full" variant="default">
              <ExternalLink className="w-4 h-4 mr-2" />
              Mais opções de compartilhamento
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
