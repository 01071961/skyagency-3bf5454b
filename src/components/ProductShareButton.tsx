import { Facebook, Instagram, MessageCircle, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share2 } from "lucide-react";
import { useState } from "react";

interface ProductShareButtonProps {
  productName: string;
  productSlug?: string;
  productUrl?: string;
  price?: number;
  productImage?: string;
  className?: string;
}

// Generate the share URL that has proper OG meta tags for social media crawlers
const getShareableUrl = (slug?: string, directUrl?: string): string => {
  if (slug) {
    // Use the edge function URL which renders proper OG meta tags for crawlers
    return `https://wwxtqujohqsrcgqopthz.supabase.co/functions/v1/product-meta?slug=${slug}&format=html`;
  }
  return directUrl || (typeof window !== "undefined" ? window.location.href : "");
};

// Get the direct product URL for viewing
const getProductUrl = (slug?: string): string => {
  if (slug) {
    return `https://skystreamer.online/produto/${slug}`;
  }
  return typeof window !== "undefined" ? window.location.href : "";
};

export const ProductShareButton = ({
  productName,
  productSlug,
  productUrl,
  price,
  className = "",
}: ProductShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  
  // Use the edge function URL for sharing (has proper OG meta tags)
  const shareUrl = getShareableUrl(productSlug, productUrl);
  const displayUrl = getProductUrl(productSlug);
  
  const shareText = price 
    ? `🔥 ${productName} por apenas R$ ${price.toFixed(2)} na SKY BRASIL!`
    : `🔥 Confira ${productName} na SKY BRASIL!`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'instagram' | 'twitter') => {
    const shareLinks = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      instagram: `https://www.instagram.com/`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    };

    if (platform === 'instagram') {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado! Abra o Instagram e cole nos Stories ou Bio.");
    } else {
      toast.success(`Abrindo ${platform}...`, {
        description: "O link inclui imagem e descrição do produto"
      });
    }

    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado!", {
      description: "Cole em qualquer rede social - a imagem e descrição serão exibidas automaticamente"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={className} title="Compartilhar produto">
          <Share2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-background/95 backdrop-blur-xl border-border/50">
        <p className="text-xs text-muted-foreground mb-2 text-center">
          Compartilhar com preview
        </p>
        <div className="grid grid-cols-5 gap-2">
          {/* Copy Link */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 ${copied ? 'bg-green-500/20 text-green-500' : 'hover:bg-muted'}`}
            onClick={copyLink}
            title="Copiar link"
          >
            {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
          </Button>

          {/* WhatsApp */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-green-500/10 hover:text-green-500"
            onClick={() => handleShare('whatsapp')}
            title="WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>

          {/* Facebook */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-blue-500/10 hover:text-blue-500"
            onClick={() => handleShare('facebook')}
            title="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </Button>

          {/* Instagram */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-pink-500/10 hover:text-pink-500"
            onClick={() => handleShare('instagram')}
            title="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </Button>

          {/* Twitter/X */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-foreground/10"
            onClick={() => handleShare('twitter')}
            title="X/Twitter"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductShareButton;
