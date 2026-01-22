import { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle, Star, Shield, Users, ShieldCheck, 
  Play, Clock, Zap, Target, Heart, Award, Check, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  GRID_COLS, 
  TEXT_ALIGN, 
  GAP_SIZES, 
  PADDING_SIZES,
  getResponsiveClass 
} from '@/lib/responsive-classes';
import { AnimatedBlockWrapper, type BlockEffectSettings } from './AnimatedBlockWrapper';
import { getGradientCSS, COLOR_SCHEMES, type GradientPreset, type ColorScheme, type GSAPAnimationPreset } from '@/lib/editor-effects';

// Lazy load 3D scenes
const Hero3DScenes = lazy(() => import('@/components/3d/Hero3DScenes'));

// Import v3.0 Funnel Block Renderers
import { 
  LeadFormBlockRenderer, 
  CheckoutBlockRenderer, 
  OrderBumpBlockRenderer, 
  UpsellBlockRenderer, 
  PixelBlockRenderer 
} from '@/pages/admin/components/products/BlockEditor/blocks';
import type { LeadFormBlock, CheckoutBlock, OrderBumpBlock, UpsellBlock, PixelBlock } from '@/pages/admin/components/products/BlockEditor/types';

// ================== ANIMATED TEXT COMPONENT ==================
// Supports: fadeUp, fadeDown, scaleIn, typewriter, bounce, glow
type TextAnimation = 'none' | 'fadeUp' | 'fadeDown' | 'scaleIn' | 'typewriter' | 'bounce' | 'glow';

interface AnimatedTextProps {
  text: string;
  animation?: TextAnimation;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

const textAnimationVariants: Record<TextAnimation, Variants> = {
  none: {
    hidden: {},
    visible: {},
  },
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  bounce: {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 15 }
    },
  },
  glow: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: [1, 0.7, 1],
      transition: { duration: 2, repeat: Infinity }
    },
  },
  typewriter: {
    hidden: {},
    visible: {},
  },
};

function AnimatedText({ 
  text, 
  animation = 'fadeUp', 
  className, 
  style, 
  delay = 0,
  as = 'h1' 
}: AnimatedTextProps) {
  const Tag = motion[as as keyof typeof motion] as any;
  
  // Typewriter effect - render each letter with stagger
  if (animation === 'typewriter') {
    const letters = text.split('');
    return (
      <Tag className={className} style={style}>
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              delay: delay + i * 0.05,
              duration: 0.1
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        ))}
      </Tag>
    );
  }
  
  const variants = textAnimationVariants[animation] || textAnimationVariants.fadeUp;
  
  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: animation === 'bounce' ? undefined : 'easeOut'
      }}
    >
      {text}
    </Tag>
  );
}

// Block types from the Advanced Editor
export interface Block {
  id: string;
  type: string;
  visible: boolean;
  order: number;
  content: any;
}

interface BlockRendererProps {
  blocks: Block[];
  productName: string;
  productPrice: number;
  productOriginalPrice?: number | null;
  productImage?: string;
  onBuyClick: () => void;
  ctaText?: string;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  Check,
  Star,
  Shield,
  ShieldCheck,
  Users,
  Play,
  Clock,
  Zap,
  Target,
  Heart,
  Award,
};

// Helper to detect media type from URL - supports all video formats including cloud drives
function detectMediaType(url: string): 'image' | 'video' | 'embed' {
  if (!url) return 'image';
  const lowerUrl = url.toLowerCase().trim();
  
  // Video file extensions (including .mov and .avi)
  if (/\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(lowerUrl)) return 'video';
  
  // Supabase storage videos
  if (lowerUrl.includes('supabase.co/storage') && /\.(mp4|webm|ogg|mov)/i.test(lowerUrl)) return 'video';
  
  // Embed platforms - YouTube, Vimeo, Wistia, Loom, Google Drive, OneDrive
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || 
      lowerUrl.includes('vimeo.com') || lowerUrl.includes('wistia.') ||
      lowerUrl.includes('loom.com') || lowerUrl.includes('drive.google.com') ||
      lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('1drv.ms') ||
      lowerUrl.includes('sharepoint.com')) return 'embed';
  
  return 'image';
}

// Helper function to convert video URLs to embed format - ALL platforms including cloud drives
function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // YouTube - ALL formats: watch?v=, embed/, v/, shorts/, youtu.be/
  const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1`;
  }
  
  // Vimeo
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`;
  }
  
  // Google Drive - multiple formats
  const googleDriveMatch = trimmedUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|uc\?export=view&id=)([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    return `https://drive.google.com/file/d/${googleDriveMatch[1]}/preview`;
  }
  
  // OneDrive / SharePoint
  if (trimmedUrl.includes('onedrive.live.com') || trimmedUrl.includes('1drv.ms') || trimmedUrl.includes('sharepoint.com')) {
    if (trimmedUrl.includes('/embed')) {
      return trimmedUrl;
    }
    if (trimmedUrl.includes('1drv.ms')) {
      return trimmedUrl.replace('1drv.ms', 'onedrive.live.com/embed');
    }
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

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function BlockRenderer({ 
  blocks, 
  productName, 
  productPrice, 
  productOriginalPrice,
  productImage,
  onBuyClick,
  ctaText = 'COMPRAR AGORA'
}: BlockRendererProps) {
  const sortedBlocks = blocks
    .filter(b => b.visible)
    .sort((a, b) => a.order - b.order);

  const discount = productOriginalPrice 
    ? Math.round((1 - productPrice / productOriginalPrice) * 100)
    : 0;

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'hero-3d':
        return <Hero3DBlockRenderer 
          key={block.id} 
          block={block} 
          productName={productName}
          onBuyClick={onBuyClick}
          ctaText={ctaText}
        />;

      case 'columns':
        const layoutClasses: Record<string, string> = {
          '50-50': 'grid-cols-1 md:grid-cols-2',
          '60-40': 'grid-cols-1 md:grid-cols-[60fr_40fr]',
          '40-60': 'grid-cols-1 md:grid-cols-[40fr_60fr]',
          '70-30': 'grid-cols-1 md:grid-cols-[70fr_30fr]',
          '30-70': 'grid-cols-1 md:grid-cols-[30fr_70fr]',
          '33-33-33': 'grid-cols-1 md:grid-cols-3',
          '25-50-25': 'grid-cols-1 md:grid-cols-[1fr_2fr_1fr]',
          '25-25-25-25': 'grid-cols-2 md:grid-cols-4',
        };
        const gapClasses: Record<string, string> = {
          none: 'gap-0',
          small: 'gap-2 md:gap-4',
          medium: 'gap-4 md:gap-6',
          large: 'gap-6 md:gap-10',
        };
        const alignClasses: Record<string, string> = {
          top: 'items-start',
          center: 'items-center',
          bottom: 'items-end',
        };
        const paddingClasses: Record<string, string> = {
          none: 'py-4',
          small: 'py-8',
          medium: 'py-12 md:py-16',
          large: 'py-16 md:py-24',
        };
        
        const renderColumnContent = (col: any) => {
          switch (col.type) {
            case 'text':
              return (
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{col.content?.text || ''}</p>
                </div>
              );
            case 'image':
              return col.content?.url ? (
                <img 
                  src={col.content.url} 
                  alt={col.content.alt || ''} 
                  className="w-full rounded-xl shadow-lg"
                />
              ) : null;
            case 'video':
              return col.content?.url ? (
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    src={getEmbedUrl(col.content.url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                  />
                </div>
              ) : null;
            case 'cta':
              return (
                <Button 
                  size="lg" 
                  variant={col.content?.style === 'outline' ? 'outline' : 'default'}
                  className={cn(
                    "w-full text-lg py-6",
                    col.content?.style === 'glow' && "animate-pulse shadow-lg shadow-primary/50"
                  )}
                  onClick={onBuyClick}
                >
                  {col.content?.text || ctaText}
                </Button>
              );
            case 'list':
              return (
                <ul className="space-y-3">
                  {(col.content?.items || []).map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            case 'icon-text':
              const IconComp = ICONS[col.content?.icon] || Star;
              return (
                <div className="text-center md:text-left">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto md:mx-0 mb-4">
                    <IconComp className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{col.content?.title}</h3>
                  <p className="text-muted-foreground">{col.content?.description}</p>
                </div>
              );
            default:
              return null;
          }
        };
        
        // Extract effects from block content
        const columnsEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={columnsEffects}
            className={paddingClasses[block.content.padding || 'medium']}
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <div className={cn(
                'grid',
                layoutClasses[block.content.layout || '50-50'],
                gapClasses[block.content.gap || 'medium'],
                alignClasses[block.content.verticalAlign || 'center'],
                block.content.reverseOnMobile && 'flex-col-reverse md:flex-row'
              )}>
                {block.content.columns?.map((col: any, idx: number) => (
                  <div key={col.id || idx} className="min-h-[50px]">
                    {renderColumnContent(col)}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'gallery':
        const galleryCols: Record<number, string> = {
          2: 'grid-cols-1 sm:grid-cols-2',
          3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          4: 'grid-cols-2 lg:grid-cols-4',
        };
        const galleryGaps: Record<string, string> = {
          small: 'gap-2',
          medium: 'gap-4',
          large: 'gap-6',
        };
        
        // Extract effects from block content
        const galleryEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={galleryEffects}
            className="py-12 md:py-16"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              {block.content.title && (
                <h2 className="text-3xl font-bold text-center mb-10">{block.content.title}</h2>
              )}
              <div className={cn(
                'grid',
                galleryCols[block.content.columns || 3],
                galleryGaps[block.content.gap || 'medium']
              )}>
                {block.content.images?.map((img: any, idx: number) => (
                  <motion.div 
                    key={idx} 
                    className="aspect-square overflow-hidden rounded-xl shadow-lg group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img 
                      src={img.url} 
                      alt={img.alt || ''} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-white text-sm">{img.caption}</p>
                      </div>
                    )}
                  </motion.div>
                )) || (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Adicione imagens à galeria</p>
                  </div>
                )}
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'hero':
        // Extract effects from block content
        const heroEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={heroEffects}
            className="relative py-16 md:py-24 overflow-hidden"
            id={block.id}
          >
            {block.content.backgroundImage && (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${block.content.backgroundImage})` }}
                />
                <div 
                  className="absolute inset-0 bg-black" 
                  style={{ opacity: (block.content.overlayOpacity || 40) / 100 }} 
                />
              </>
            )}
            <div className="container mx-auto px-4 relative z-10">
              <div className={cn(TEXT_ALIGN[block.content.alignment || 'center'], "max-w-4xl mx-auto")}>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                >
                  {block.content.headline || productName}
                </motion.h1>
                {block.content.subheadline && (
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl md:text-2xl text-muted-foreground mb-8"
                  >
                    {block.content.subheadline}
                  </motion.p>
                )}
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'video':
        if (!block.content.url) return null;
        
        // Extract effects from block content
        const videoEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={videoEffects}
            className="py-12"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              {block.content.title && (
                <h2 className="text-2xl font-bold text-center mb-8">{block.content.title}</h2>
              )}
              <div className="max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={getEmbedUrl(block.content.url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen"
                />
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'benefits':
        return <BenefitsBlockRenderer key={block.id} block={block} />;

      case 'features':
        if (!block.content.items?.length) return null;
        
        // Extract effects from block content
        const featuresEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={featuresEffects}
            className="py-16"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                {block.content.title || 'O que está incluído'}
              </h2>
              <div className="max-w-3xl mx-auto space-y-4">
                {block.content.items.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'pricing':
        // Extract effects from block content
        const pricingEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={pricingEffects}
            className="py-16"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <Card className="max-w-md mx-auto p-8 text-center border-2 border-primary/50">
                {block.content.highlightText && (
                  <Badge className="mb-4 bg-primary">{block.content.highlightText}</Badge>
                )}
                
                {block.content.showOriginalPrice && productOriginalPrice && (
                  <p className="text-lg text-muted-foreground line-through mb-2">
                    {formatPrice(productOriginalPrice)}
                  </p>
                )}
                
                <p className="text-5xl font-bold text-primary mb-4">
                  {formatPrice(productPrice)}
                </p>
                
                {block.content.showDiscount && discount > 0 && (
                  <Badge variant="destructive" className="mb-4">
                    {discount}% OFF
                  </Badge>
                )}
                
                {block.content.showInstallments && productPrice > 10 && (
                  <p className="text-muted-foreground mb-6">
                    ou 12x de {formatPrice(productPrice / 12)}
                  </p>
                )}
                
                <Button size="lg" className="w-full text-lg py-6" onClick={onBuyClick}>
                  {ctaText}
                </Button>
              </Card>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'testimonials':
        if (!block.content.items?.length) return null;
        
        // Extract effects from block content
        const testimonialsEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={testimonialsEffects}
            className="py-16 bg-muted/30"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                {block.content.title || 'O que nossos clientes dizem'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {block.content.items.map((item: any, index: number) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {item.avatar ? (
                        <img 
                          src={item.avatar} 
                          alt={item.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {item.name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        {item.role && (
                          <p className="text-sm text-muted-foreground">{item.role}</p>
                        )}
                      </div>
                    </div>
                    {item.rating && (
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                    <p className="text-muted-foreground italic">"{item.text}"</p>
                  </Card>
                ))}
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'faq':
        if (!block.content.items?.length) return null;
        
        // Extract effects from block content
        const faqEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={faqEffects}
            className="py-16"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                {block.content.title || 'Perguntas Frequentes'}
              </h2>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {block.content.items.map((item: any, index: number) => (
                    <AccordionItem 
                      key={index} 
                      value={`faq-${index}`}
                      className="bg-muted/30 rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left font-semibold hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'guarantee':
        // Extract effects from block content
        const guaranteeEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={guaranteeEffects}
            className="py-16 bg-muted/30"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto p-8 text-center border-2 border-green-500/30">
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-2xl font-bold mb-4">
                  {block.content.title || 'Garantia Incondicional'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {block.content.text || `${block.content.days || 7} dias de garantia incondicional`}
                </p>
                {block.content.days && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    {block.content.days} dias
                  </Badge>
                )}
              </Card>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'cta':
        // Extract effects from block content
        const ctaEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={ctaEffects}
            className="py-16 bg-gradient-to-r from-primary/20 to-cyan-500/20"
            id={block.id}
          >
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {block.content.text || 'Não perca essa oportunidade!'}
              </h2>
              {block.content.subtext && (
                <p className="text-xl text-muted-foreground mb-8">{block.content.subtext}</p>
              )}
              <Button 
                size="lg" 
                className="text-lg px-12 py-6 animate-pulse" 
                onClick={onBuyClick}
              >
                {block.content.buttonText || ctaText}
              </Button>
              {block.content.showSecurityBadges && (
                <div className="flex items-center justify-center gap-6 mt-8 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm">Compra Segura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Garantia de Satisfação</span>
                  </div>
                </div>
              )}
            </div>
          </AnimatedBlockWrapper>
        );

      case 'text':
        // Extract effects from block content
        const textEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={textEffects}
            className="py-12"
            id={block.id}
          >
            <div className="container mx-auto px-4">
              <div 
                className={cn(
                  "max-w-3xl mx-auto",
                  TEXT_ALIGN[block.content.alignment || 'center'],
                  block.content.size === 'large' && 'text-lg',
                  block.content.size === 'small' && 'text-sm',
                  (!block.content.size || block.content.size === 'medium') && 'text-base'
                )}
              >
                <p className="text-muted-foreground whitespace-pre-wrap">{block.content.text}</p>
              </div>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'image':
        if (!block.content.url) return null;
        
        // Extract effects from block content
        const imageEffects: BlockEffectSettings = {
          gradientPreset: block.content.gradientPreset,
          colorScheme: block.content.colorScheme,
          gsapAnimation: block.content.gsapAnimation,
          overlayOpacity: block.content.overlayOpacity,
        };
        
        return (
          <AnimatedBlockWrapper 
            key={block.id} 
            effects={imageEffects}
            className="py-12"
            id={block.id}
          >
            <div className={block.content.fullWidth ? '' : 'container mx-auto px-4'}>
              <figure className="max-w-4xl mx-auto">
                <img 
                  src={block.content.url} 
                  alt={block.content.alt || ''} 
                  className="w-full rounded-xl shadow-lg"
                />
                {block.content.caption && (
                  <figcaption className="text-center text-muted-foreground mt-4">
                    {block.content.caption}
                  </figcaption>
                )}
              </figure>
            </div>
          </AnimatedBlockWrapper>
        );

      case 'divider':
        return (
          <div key={block.id} className="container mx-auto px-4 py-8">
            <hr className={`border-0 h-px ${
              block.content.style === 'gradient' 
                ? 'bg-gradient-to-r from-transparent via-primary/50 to-transparent' 
                : 'bg-border'
            }`} />
          </div>
        );

      case 'spacer':
        const heights = { small: 'py-4', medium: 'py-8', large: 'py-16' };
        return <div key={block.id} className={heights[block.content.height as keyof typeof heights] || 'py-8'} />;

      case 'countdown':
        // Skip if no valid endDate
        if (!block.content?.endDate) return null;
        return (
          <section key={block.id} className="py-8 bg-destructive/10">
            <div className="container mx-auto px-4 text-center">
              <h3 className="text-xl font-bold mb-4 text-destructive">
                {block.content.title || 'Oferta termina em:'}
              </h3>
              <CountdownTimer endDate={block.content.endDate} style={block.content.style} />
            </div>
          </section>
        );

      // v3.0 Funnel blocks
      case 'lead-form':
        return (
          <LeadFormBlockRenderer 
            key={block.id} 
            block={block as unknown as LeadFormBlock} 
            isPreview={false} 
          />
        );

      case 'checkout':
        return (
          <CheckoutBlockRenderer 
            key={block.id} 
            block={block as unknown as CheckoutBlock} 
            isPreview={false}
            productPrice={productPrice}
            productName={productName}
          />
        );

      case 'order-bump':
        return (
          <OrderBumpBlockRenderer 
            key={block.id} 
            block={block as unknown as OrderBumpBlock} 
            isPreview={false} 
          />
        );

      case 'upsell':
        return (
          <UpsellBlockRenderer 
            key={block.id} 
            block={block as unknown as UpsellBlock} 
            isPreview={false} 
          />
        );

      case 'pixel':
        return (
          <PixelBlockRenderer 
            key={block.id} 
            block={block as unknown as PixelBlock} 
            isPreview={false} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {sortedBlocks.map(renderBlock)}
    </div>
  );
}

// =============================================
// Hero3D Block Renderer with full support for:
// - All backgroundMode options
// - Video and embed support
// - Per-slide headlines
// - GSAP animations with cleanup
// =============================================
interface Hero3DBlockRendererProps {
  block: Block;
  productName: string;
  onBuyClick: () => void;
  ctaText: string;
}

function Hero3DBlockRenderer({ block, productName, onBuyClick, ctaText }: Hero3DBlockRendererProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const content = block.content;
  
  const headline = content.headline;
  const subheadline = content.subheadline;
  const headlineText = typeof headline === 'string' ? headline : headline?.text;
  const subheadlineText = typeof subheadline === 'string' ? subheadline : subheadline?.text;
  const headlineStyle = typeof headline === 'object' ? headline : null;
  const subheadlineStyle = typeof subheadline === 'object' ? subheadline : null;
  
  const backgroundMode = content.backgroundMode || 'effect';
  const slides = content.slides || [];
  const slideInterval = (content.slideInterval || 5) * 1000;
  const slideTransition = content.slideTransition || 'fade';
  
  // GSAP animations with cleanup
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Animate headline
      gsap.fromTo('.hero-headline', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      
      // Animate subheadline
      gsap.fromTo('.hero-subheadline',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 }
      );
      
      // Animate CTA
      gsap.fromTo('.hero-cta',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.8 }
      );
    }, containerRef);
    
    return () => ctx.revert(); // GSAP cleanup
  }, []);
  
  // Auto-slide interval - FIXED: Added slideInterval to dependency array so changes take effect
  useEffect(() => {
    if (backgroundMode !== 'slideshow' && backgroundMode !== 'effect-over-slideshow') return;
    if (slides.length <= 1) return;
    
    // Validate interval (min 1, max 30 seconds)
    const validInterval = Math.max(1, Math.min(30, slideInterval / 1000)) * 1000;
    console.log('[Hero3D] Setting slide interval:', validInterval / 1000, 'seconds');
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, validInterval);
    
    return () => clearInterval(timer);
  }, [backgroundMode, slides.length, slideInterval]); // slideInterval in deps ensures re-mount on change
  
  // Helper functions
  const getShadowCSS = (shadow: string, color: string = '#ffffff') => {
    switch (shadow) {
      case 'soft': return '0 4px 8px rgba(0,0,0,0.3)';
      case 'glow': return `0 0 20px ${color}, 0 0 40px ${color}50`;
      case 'neon': return `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`;
      case 'long': return '4px 4px 0 rgba(0,0,0,0.3), 8px 8px 0 rgba(0,0,0,0.2)';
      default: return 'none';
    }
  };
  
  const getGradientCSS = (gradient?: { from: string; to: string; direction: string }) => {
    if (!gradient) return undefined;
    return `linear-gradient(${gradient.direction}, ${gradient.from}, ${gradient.to})`;
  };
  
  // Get transition variants for slides
  const getSlideVariants = () => {
    switch (slideTransition) {
      case 'slide':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 }
        };
      case 'zoom':
        return {
          initial: { scale: 1.2, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
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
  
  // Render background media (image, video, or embed)
  const renderMedia = (url: string, mediaType?: string) => {
    const type = mediaType || detectMediaType(url);
    
    if (type === 'video') {
      return (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      );
    }
    
    if (type === 'embed') {
      const embedUrl = getEmbedUrl(url);
      console.log('[BlockRenderer] Rendering embed video:', { original: url, embed: embedUrl });
      return (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          frameBorder="0"
          title="Video background"
        />
      );
    }
    
    // Default: image
    return (
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${url})` }}
      />
    );
  };
  
  // Get current slide data
  const currentSlideData = slides[currentSlide];
  const displayHeadline = currentSlideData?.headline || headlineText || productName;
  const displaySubheadline = currentSlideData?.subheadline || subheadlineText;
  
  // Show 3D effect?
  const show3DEffect = ['effect', 'effect-over-image', 'effect-over-slideshow'].includes(backgroundMode);
  const effectOpacity = (content.effectOpacity ?? 100) / 100;
  
  return (
    <section ref={containerRef} className="relative min-h-[500px] overflow-hidden">
      {/* Background Layer */}
      {backgroundMode === 'image' && content.backgroundImage && (
        <div className="absolute inset-0">
          {renderMedia(content.backgroundImage, content.backgroundMediaType)}
        </div>
      )}
      
      {/* Slideshow Layer */}
      {(backgroundMode === 'slideshow' || backgroundMode === 'effect-over-slideshow') && slides.length > 0 && (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              {...getSlideVariants()}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {renderMedia(currentSlideData?.imageUrl || '', currentSlideData?.mediaType)}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      
      {/* Effect Over Image Layer */}
      {backgroundMode === 'effect-over-image' && content.backgroundImage && (
        <div className="absolute inset-0">
          {renderMedia(content.backgroundImage, content.backgroundMediaType)}
        </div>
      )}
      
      {/* Dark Overlay */}
      {(backgroundMode !== 'effect') && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            backgroundColor: content.overlayColor || '#000000',
            opacity: (content.overlayOpacity ?? 40) / 100 
          }} 
        />
      )}
      
      {/* 3D Effect Layer */}
      {show3DEffect && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: effectOpacity }}
        >
          <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-cyan-500/20 animate-pulse" />}>
            <Hero3DScenes 
              effect={content.effect || 'particles'}
              colorScheme={content.colorScheme || 'purple'}
              transparentBackground={backgroundMode !== 'effect'}
            />
          </Suspense>
        </div>
      )}
      
      {/* Content Layer - always on top */}
      <div className="container mx-auto px-4 relative z-10 content-layer">
        <div className={cn(
          "py-20 max-w-4xl mx-auto",
          headlineStyle?.alignment === 'left' && "text-left",
          headlineStyle?.alignment === 'right' && "text-right",
          (!headlineStyle?.alignment || headlineStyle?.alignment === 'center') && "text-center"
        )}>
          <AnimatedText
            text={displayHeadline}
            animation={headlineStyle?.animation || 'fadeUp'}
            className="hero-headline text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg"
            style={headlineStyle ? {
              fontFamily: headlineStyle.fontFamily || 'Inter',
              fontSize: headlineStyle.fontSize ? `${headlineStyle.fontSize}px` : undefined,
              fontWeight: headlineStyle.fontWeight === 'extrabold' ? 800 : headlineStyle.fontWeight === 'bold' ? 700 : 400,
              fontStyle: headlineStyle.fontStyle,
              color: headlineStyle.gradient ? 'transparent' : (headlineStyle.color || '#ffffff'),
              textShadow: getShadowCSS(headlineStyle.textShadow || 'none', headlineStyle.color),
              letterSpacing: headlineStyle.letterSpacing ? `${headlineStyle.letterSpacing}px` : undefined,
              lineHeight: headlineStyle.lineHeight || 1.2,
              background: getGradientCSS(headlineStyle.gradient),
              WebkitBackgroundClip: headlineStyle.gradient ? 'text' : undefined,
              WebkitTextFillColor: headlineStyle.gradient ? 'transparent' : undefined,
            } : undefined}
          />
          
          {displaySubheadline && (
            <AnimatedText
              text={displaySubheadline}
              animation={subheadlineStyle?.animation || 'fadeUp'}
              delay={0.3}
              className="hero-subheadline text-xl md:text-2xl text-white/80 mb-8"
              style={subheadlineStyle ? {
                fontFamily: subheadlineStyle.fontFamily || 'Inter',
                fontSize: subheadlineStyle.fontSize ? `${subheadlineStyle.fontSize}px` : undefined,
                fontWeight: subheadlineStyle.fontWeight === 'bold' ? 700 : 400,
                color: subheadlineStyle.color || 'rgba(255,255,255,0.8)',
                letterSpacing: subheadlineStyle.letterSpacing ? `${subheadlineStyle.letterSpacing}px` : undefined,
                textShadow: getShadowCSS(subheadlineStyle.textShadow || 'none', subheadlineStyle.color),
              } : undefined}
            />
          )}
          
          {content.showCTA && (
            <div className="hero-cta">
              {content.ctaUrl ? (
                <a 
                  href={content.ctaUrl} 
                  target={content.ctaUrl.startsWith('http') ? '_blank' : undefined}
                  rel={content.ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <Button 
                    size="lg" 
                    className={cn(
                      "text-lg px-8 py-6 transition-all",
                      content.ctaStyle === 'glow' && "bg-gradient-to-r from-primary to-pink-500 shadow-[0_0_30px_rgba(155,135,245,0.5),0_0_60px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(155,135,245,0.7),0_0_80px_rgba(236,72,153,0.4)]",
                      content.ctaStyle === 'outline' && "border-2 border-white bg-transparent hover:bg-white/10",
                      content.ctaStyle === 'neon' && "bg-black border border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)]"
                    )}
                  >
                    {content.ctaText || ctaText}
                  </Button>
                </a>
              ) : (
                <Button 
                  size="lg" 
                  className={cn(
                    "text-lg px-8 py-6 transition-all",
                    content.ctaStyle === 'glow' && "bg-gradient-to-r from-primary to-pink-500 shadow-[0_0_30px_rgba(155,135,245,0.5),0_0_60px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(155,135,245,0.7),0_0_80px_rgba(236,72,153,0.4)]",
                    content.ctaStyle === 'outline' && "border-2 border-white bg-transparent hover:bg-white/10",
                    content.ctaStyle === 'neon' && "bg-black border border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)]"
                  )}
                  onClick={onBuyClick}
                >
                  {content.ctaText || ctaText}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Slide Indicators */}
      {(backgroundMode === 'slideshow' || backgroundMode === 'effect-over-slideshow') && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                idx === currentSlide 
                  ? "bg-white w-6" 
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// =============================================
// Benefits Block Renderer with layout options
// =============================================
interface BenefitsBlockRendererProps {
  block: Block;
}

function BenefitsBlockRenderer({ block }: BenefitsBlockRendererProps) {
  const content = block.content;
  
  if (!content.items?.length) return null;
  
  // Layout classes
  const gapClasses: Record<string, string> = {
    none: 'gap-0',
    small: 'gap-3',
    medium: 'gap-6',
    large: 'gap-10',
  };
  
  const paddingClasses: Record<string, string> = {
    none: 'py-8',
    small: 'py-12',
    medium: 'py-16',
    large: 'py-24',
  };
  
  const alignClasses: Record<string, string> = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  };
  
  // Extract effects from block content
  const benefitsEffects: BlockEffectSettings = {
    gradientPreset: content.gradientPreset,
    colorScheme: content.colorScheme,
    gsapAnimation: content.gsapAnimation,
    overlayOpacity: content.overlayOpacity,
  };
  
  return (
    <AnimatedBlockWrapper 
      effects={benefitsEffects}
      className={paddingClasses[content.padding || 'medium']}
      id={block.id}
    >
      <div className="container mx-auto px-4">
        {/* Title */}
        <h2 
          className="text-3xl font-bold mb-4"
          style={{
            fontFamily: content.titleFontFamily,
            fontSize: content.titleFontSize ? `${content.titleFontSize}px` : undefined,
            fontWeight: content.titleFontWeight === 'extrabold' ? 800 : 
                       content.titleFontWeight === 'bold' ? 700 : 
                       content.titleFontWeight === 'semibold' ? 600 : 400,
            color: content.titleColor,
            textAlign: content.titleAlignment || 'center',
          }}
        >
          {content.title || 'Por que escolher este produto?'}
        </h2>
        
        {/* Subtitle */}
        {content.subtitle && (
          <p 
            className="text-muted-foreground mb-12"
            style={{
              fontFamily: content.subtitleFontFamily,
              fontSize: content.subtitleFontSize ? `${content.subtitleFontSize}px` : undefined,
              fontWeight: content.subtitleFontWeight === 'bold' ? 700 : 400,
              color: content.subtitleColor,
              textAlign: content.titleAlignment || 'center',
            }}
          >
            {content.subtitle}
          </p>
        )}
        
        {/* Grid */}
        <div className={cn(
          "grid max-w-5xl mx-auto",
          GRID_COLS[content.columns || 3],
          gapClasses[content.gap || 'medium'],
          alignClasses[content.verticalAlign || 'top'],
          content.reverseMobile && "flex flex-col-reverse md:grid"
        )}>
          {content.items.map((item: any, index: number) => {
            const IconComponent = ICONS[item.icon] || CheckCircle;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AnimatedBlockWrapper>
  );
}

// Countdown Timer Component
function CountdownTimer({ endDate, style }: { endDate: string; style?: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;
    
    const calculateTimeLeft = () => {
      try {
        const targetDate = new Date(endDate);
        if (isNaN(targetDate.getTime())) return;
        
        const difference = targetDate.getTime() - new Date().getTime();
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
        }
      } catch (e) {
        console.error('[CountdownTimer] Invalid date:', endDate);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className={`text-center ${style === 'boxed' ? 'bg-destructive/20 rounded-lg p-3' : ''}`}>
      <div className="text-3xl font-bold">{String(value).padStart(2, '0')}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div className="flex justify-center gap-4">
      <TimeBox value={timeLeft.days} label="Dias" />
      <TimeBox value={timeLeft.hours} label="Horas" />
      <TimeBox value={timeLeft.minutes} label="Min" />
      <TimeBox value={timeLeft.seconds} label="Seg" />
    </div>
  );
}
