import { useState, useEffect, useCallback, Suspense, lazy, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import { 
  Plus, Save, Undo, Redo, Loader2, ExternalLink, Settings2, Sparkles,
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Palette, Eye, Layers, Copy, Trash2, X, Maximize2,
  Minimize2, Monitor, Tablet, Smartphone, ZoomIn, ZoomOut, Pencil,
  Mail, CreditCard, ArrowUpCircle, BarChart3, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Block, BlockType, BLOCK_TEMPLATES, LeadFormBlock, CheckoutBlock, OrderBumpBlock, UpsellBlock, PixelBlock } from './types';
import { BlockSettings } from './BlockSettings';
import { createBlock, getDefaultLayout, getTemplateBlocks, PRODUCT_TEMPLATES } from './blockFactory';
import { ALL_CATEGORY_TEMPLATES, BlockCategoryTemplate } from './blockTemplates';
import { toast } from 'sonner';
import { Book, TrendingUp, Target, Laptop, Calendar } from 'lucide-react';
import { LeadFormBlockRenderer, CheckoutBlockRenderer, OrderBumpBlockRenderer, UpsellBlockRenderer, PixelBlockRenderer } from './blocks';
import { CommandPalette, KeyboardHints } from '@/components/editor/CommandPalette';
import { AnimatedBlockWrapper, type BlockEffectSettings } from '@/components/sales/AnimatedBlockWrapper';

// Lazy load the 3D scene for performance
const Hero3DScenes = lazy(() => import('@/components/3d/Hero3DScenes').then(m => ({ default: m.default })));

// CORS proxy services for external images
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

// Image component with CORS proxy fallback for external URLs
const ImageWithFallback = memo(function ImageWithFallback({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [proxyIndex, setProxyIndex] = useState(-1);
  
  // Reset when src changes
  useEffect(() => {
    setStatus('loading');
    setCurrentSrc(src);
    setProxyIndex(-1);
  }, [src]);

  const handleError = useCallback(() => {
    const nextProxyIndex = proxyIndex + 1;
    if (nextProxyIndex < CORS_PROXIES.length) {
      setProxyIndex(nextProxyIndex);
      setCurrentSrc(CORS_PROXIES[nextProxyIndex](src));
      setStatus('loading');
    } else {
      setStatus('error');
    }
  }, [proxyIndex, src]);

  const handleRetry = useCallback(() => {
    setStatus('loading');
    setProxyIndex(-1);
    setCurrentSrc(src);
  }, [src]);
  
  if (status === 'error') {
    return (
      <div className={cn("bg-muted/50 flex flex-col items-center justify-center min-h-[150px] rounded-lg border border-dashed border-muted-foreground/30 p-4", className)}>
        <Image className="w-8 h-8 text-muted-foreground/50 mb-2" />
        <span className="text-xs text-muted-foreground text-center mb-2">
          Não foi possível carregar a imagem
        </span>
        <span className="text-[10px] text-muted-foreground/50 max-w-[180px] truncate mb-2">
          {src}
        </span>
        <button
          onClick={handleRetry}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Loader2 className="w-3 h-3" />
          Tentar novamente
        </button>
      </div>
    );
  }
  
  return (
    <div className={cn("relative", status === 'loading' && "min-h-[150px]")}>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse rounded-lg flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
        </div>
      )}
      <img 
        src={currentSrc} 
        alt={alt} 
        className={cn(className, status === 'loading' && "opacity-0")}
        onLoad={() => setStatus('success')}
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
      />
    </div>
  );
});

interface FullscreenWixEditorProps {
  productId?: string;
  productName?: string;
  productDescription?: string;
  productPrice?: number;
  productOriginalPrice?: number | null;
  productImage?: string;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  onClose?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const VIEW_WIDTHS: Record<ViewMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px'
};

const BLOCK_CATEGORIES = {
  hero: { label: 'Hero', blocks: ['hero', 'hero-3d'] as BlockType[] },
  layout: { label: 'Layout', blocks: ['columns', 'gallery', 'divider', 'spacer'] as BlockType[] },
  content: { label: 'Conteúdo', blocks: ['text', 'image', 'video'] as BlockType[] },
  conversion: { label: 'Conversão', blocks: ['pricing', 'cta', 'countdown', 'guarantee', 'comparison', 'steps'] as BlockType[] },
  social: { label: 'Prova Social', blocks: ['benefits', 'features', 'testimonials', 'faq', 'social-proof'] as BlockType[] },
  funnel: { label: 'Funil v3.0', blocks: ['lead-form', 'checkout', 'order-bump', 'upsell', 'pixel'] as BlockType[] },
};

const ICONS: Record<string, React.ElementType> = {
  Layout, Star, CheckCircle, Users, HelpCircle, DollarSign,
  Play, Type, Image, MousePointer, Shield, Clock, Minus, MoveVertical,
  Columns, Grid3X3, Sparkles, Book, TrendingUp, Target, Laptop, Calendar,
  Mail, CreditCard, ArrowUpCircle, BarChart3
};

// Memoized Block Preview Component
const BlockPreviewRenderer = memo(function BlockPreviewRenderer({ 
  block, 
  productName,
  productPrice = 0
}: { 
  block: Block; 
  productName: string;
  productPrice?: number;
}) {
  const content = block.content as any;
  
  // Extract visual effects from block content
  const blockEffects: BlockEffectSettings = {
    gradientPreset: content?.gradientPreset,
    colorScheme: content?.colorScheme,
    gsapAnimation: content?.gsapAnimation,
    overlayOpacity: content?.overlayOpacity,
  };
  
  // Check if block has any visual effects
  const hasEffects = blockEffects.gradientPreset || 
    (blockEffects.gsapAnimation && blockEffects.gsapAnimation !== 'none') ||
    blockEffects.colorScheme;
  
  // Render block content and wrap with effects if needed
  const renderContent = () => {
    switch (block.type) {
    case 'hero-3d':
      const headline = content.headline;
      const subheadline = content.subheadline;
      const headlineText = typeof headline === 'string' ? headline : headline?.text;
      const subheadlineText = typeof subheadline === 'string' ? subheadline : subheadline?.text;
      const headlineStyle = typeof headline === 'object' ? headline : null;
      const subheadlineStyle = typeof subheadline === 'object' ? subheadline : null;
      const backgroundMode = content.backgroundMode || 'effect';
      const slides = content.slides || [];
      
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
      
      // Render background based on mode
      const renderHeroBackground = () => {
        const hasImage = content.backgroundImage;
        const hasSlides = slides.length > 0;
        
        // Combined modes: render image/slides as base layer
        if (backgroundMode === 'effect-over-image' && hasImage) {
          return (
            <>
              {/* Background Image Layer */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${content.backgroundImage})` }}
              />
              {/* Gradient Overlay (like Home page) */}
              <div 
                className="absolute inset-0"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    hsl(var(--background) / ${(content.overlayOpacity ?? 60) / 100}) 0%, 
                    hsl(var(--background) / ${((content.overlayOpacity ?? 60) + 10) / 100}) 50%, 
                    hsl(var(--background)) 100%)`
                }}
              />
              {/* 3D Effect Layer on top */}
              <Suspense fallback={null}>
                <Hero3DScenes 
                  effect={content.effect || 'particles'}
                  colorScheme={content.colorScheme || 'purple'}
                  transparentBackground
                />
              </Suspense>
            </>
          );
        }
        
        if (backgroundMode === 'effect-over-slideshow' && hasSlides) {
          const firstSlide = slides[0];
          return (
            <>
              {/* Slideshow Layer */}
              <div className="absolute inset-0">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                  style={{ backgroundImage: firstSlide.imageUrl ? `url(${firstSlide.imageUrl})` : undefined }}
                />
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `linear-gradient(to bottom, 
                      hsl(var(--background) / ${(content.overlayOpacity ?? 60) / 100}) 0%, 
                      hsl(var(--background) / ${((content.overlayOpacity ?? 60) + 10) / 100}) 50%, 
                      hsl(var(--background)) 100%)`
                  }}
                />
                {slides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {slides.map((slide: any, idx: number) => (
                      <div
                        key={slide.id || idx}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          idx === 0 ? "bg-white scale-125" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
              {/* 3D Effect Layer on top */}
              <Suspense fallback={null}>
                <Hero3DScenes 
                  effect={content.effect || 'particles'}
                  colorScheme={content.colorScheme || 'purple'}
                  transparentBackground
                />
              </Suspense>
            </>
          );
        }
        
        // Single image mode
        if (backgroundMode === 'image' && hasImage) {
          return (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${content.backgroundImage})` }}
            />
          );
        }
        
        // Single slideshow mode
        if (backgroundMode === 'slideshow' && hasSlides) {
          const firstSlide = slides[0];
          return (
            <div className="absolute inset-0">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: firstSlide.imageUrl ? `url(${firstSlide.imageUrl})` : undefined }}
              />
              {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {slides.map((slide: any, idx: number) => (
                    <div
                      key={slide.id || idx}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        idx === 0 ? "bg-white scale-125" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        }
        
        // Default: 3D Effect only
        return (
          <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-cyan-500/20 animate-pulse" />}>
            <Hero3DScenes 
              effect={content.effect || 'particles'}
              colorScheme={content.colorScheme || 'purple'}
            />
          </Suspense>
        );
      };
      
      return (
        <div className="relative min-h-[400px] overflow-hidden">
          {renderHeroBackground()}
          
          {/* Overlay - only for pure image/slideshow modes (combined modes handle overlay internally) */}
          {(backgroundMode === 'image' || backgroundMode === 'slideshow') && (
            <div 
              className="absolute inset-0 z-10"
              style={{ 
                backgroundColor: content.overlayColor || '#000000',
                opacity: (content.overlayOpacity ?? 50) / 100
              }}
            />
          )}
          
          <div className={cn(
            "relative z-20 container mx-auto px-4 py-20",
            headlineStyle?.alignment === 'left' && "text-left",
            headlineStyle?.alignment === 'right' && "text-right",
            (!headlineStyle?.alignment || headlineStyle?.alignment === 'center') && "text-center"
          )}>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg"
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
            >
              {headlineText || productName || 'Título do Produto'}
            </h1>
            {subheadlineText && (
              <p 
                className="text-xl md:text-2xl text-white/80 mb-8"
                style={subheadlineStyle ? {
                  fontFamily: subheadlineStyle.fontFamily || 'Inter',
                  fontSize: subheadlineStyle.fontSize ? `${subheadlineStyle.fontSize}px` : undefined,
                  fontWeight: subheadlineStyle.fontWeight === 'bold' ? 700 : 400,
                  color: subheadlineStyle.color || 'rgba(255,255,255,0.8)',
                  letterSpacing: subheadlineStyle.letterSpacing ? `${subheadlineStyle.letterSpacing}px` : undefined,
                  textShadow: getShadowCSS(subheadlineStyle.textShadow || 'none', subheadlineStyle.color),
                } : undefined}
              >
                {subheadlineText}
              </p>
            )}
            {content.showCTA && (
              <button 
                className={cn(
                  "px-8 py-4 text-lg font-bold rounded-lg transition-all hover:scale-105",
                  content.ctaStyle === 'glow' && "animate-pulse shadow-lg shadow-primary/50",
                  content.ctaStyle === 'outline' && "border-2 border-white bg-transparent"
                )}
                style={{
                  backgroundColor: content.ctaStyle === 'outline' ? 'transparent' : 'hsl(var(--primary))',
                  color: 'white',
                }}
              >
                {content.ctaText || 'COMPRAR AGORA'}
              </button>
            )}
          </div>
        </div>
      );

    case 'hero':
      return (
        <div 
          className="relative min-h-[400px] flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)' }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{content.headline || productName}</h1>
            {content.subheadline && <p className="text-xl mb-8 opacity-90">{content.subheadline}</p>}
          </div>
        </div>
      );

    case 'text':
      const textStyle: React.CSSProperties = {
        fontFamily: content.fontFamily ? `"${content.fontFamily}", sans-serif` : undefined,
        fontSize: content.fontSize ? `${content.fontSize}px` : undefined,
        fontWeight: content.fontWeight === 'normal' ? 400 : 
                   content.fontWeight === 'medium' ? 500 :
                   content.fontWeight === 'semibold' ? 600 :
                   content.fontWeight === 'bold' ? 700 : 
                   content.fontWeight === 'extrabold' ? 800 : undefined,
        fontStyle: content.fontStyle || undefined,
        color: content.color || undefined,
        letterSpacing: content.letterSpacing ? `${content.letterSpacing}em` : undefined,
        lineHeight: content.lineHeight || undefined,
        textTransform: content.textTransform || undefined,
        textAlign: content.alignment || undefined,
      };
      
      return (
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <motion.div 
              className={cn(
                'max-w-4xl mx-auto',
                content.alignment === 'center' && 'text-center',
                content.alignment === 'right' && 'text-right',
                content.alignment === 'left' && 'text-left'
              )}
              style={textStyle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {content.text || 'Adicione seu texto aqui...'}
            </motion.div>
          </div>
        </section>
      );

    case 'image':
      return (
        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className={cn('flex flex-col', content.alignment === 'center' ? 'items-center' : content.alignment === 'right' ? 'items-end' : 'items-start')}>
              {content.url ? (
                  <ImageWithFallback 
                    src={content.url} 
                    alt={content.alt || ''} 
                    className={cn('rounded-lg shadow-lg max-w-full inline-block', content.fullWidth && 'w-full')}
                  />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-muted/50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-all">
                  <Image className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mb-2" />
                  <span className="text-xs sm:text-sm text-muted-foreground text-center px-4">Adicione uma URL de imagem nas configurações</span>
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case 'video':
      // Helper function for video embed URLs
      const getVideoEmbedUrl = (url: string): string => {
        if (!url) return '';
        const trimmedUrl = url.trim();
        
        // YouTube - ALL formats
        const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (youtubeMatch) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
        }
        
        // Vimeo
        const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)(\d+)/);
        if (vimeoMatch) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        
        return trimmedUrl;
      };
      
      return (
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center max-w-4xl mx-auto">
              <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center w-full">
                {content.url ? (
                  <iframe 
                    src={getVideoEmbedUrl(content.url)} 
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/50">
                    <Play className="w-12 h-12 sm:w-16 sm:h-16 mb-2" />
                    <span className="text-xs sm:text-sm">Adicione uma URL de vídeo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case 'benefits':
      return (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">{content.title || 'Benefícios'}</h2>
            <div className={cn('grid gap-8', content.columns === 2 ? 'md:grid-cols-2' : content.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
              {(content.items || []).map((item: any, i: number) => (
                <div key={i} className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'pricing':
      return (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block p-8 bg-card rounded-2xl shadow-xl border">
              {content.originalPrice && (
                <p className="text-lg text-muted-foreground line-through">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(content.originalPrice)}
                </p>
              )}
              <p className="text-5xl font-bold text-primary mb-4">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(content.price || 0)}
              </p>
              {content.installments && (
                <p className="text-muted-foreground mb-6">
                  ou {content.installments}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((content.price || 0) / content.installments)}
                </p>
              )}
            </div>
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="py-12 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">{content.headline || 'Aproveite Agora!'}</h2>
            <button className="px-8 py-4 bg-background text-foreground font-bold text-lg rounded-lg hover:opacity-90 transition-all">
              {content.buttonText || 'COMPRAR AGORA'}
            </button>
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">{content.title || 'O que dizem nossos clientes'}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {(content.items || []).slice(0, 3).map((item: any, i: number) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20" />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{item.text}"</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">{content.title || 'Perguntas Frequentes'}</h2>
            <div className="space-y-4">
              {(content.items || []).map((item: any, i: number) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );

    case 'guarantee':
      return (
        <section className="py-12 bg-green-50 dark:bg-green-950/20">
          <div className="container mx-auto px-4 text-center">
            <Shield className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-4">{content.title || 'Garantia de 7 Dias'}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{content.description || 'Se não ficar satisfeito, devolvemos 100% do seu dinheiro.'}</p>
          </div>
        </section>
      );

    case 'divider':
      return (
        <div className="container mx-auto px-4 py-4">
          <hr className={cn('border-t', content.style === 'dashed' && 'border-dashed', content.style === 'dotted' && 'border-dotted')} />
        </div>
      );

    case 'spacer':
      return <div style={{ height: content.height === 'small' ? 30 : content.height === 'large' ? 120 : 60 }} />;

    case 'features':
      return (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">{content.title || 'O que você recebe'}</h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {(content.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-lg border">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium">{item.title || item}</h4>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'columns':
      const colLayout = content.layout || '50-50';
      const layoutClasses: Record<string, string> = {
        '50-50': 'grid-cols-1 md:grid-cols-2',
        '60-40': 'grid-cols-1 md:grid-cols-[3fr_2fr]',
        '40-60': 'grid-cols-1 md:grid-cols-[2fr_3fr]',
        '70-30': 'grid-cols-1 md:grid-cols-[7fr_3fr]',
        '30-70': 'grid-cols-1 md:grid-cols-[3fr_7fr]',
        '33-33-33': 'grid-cols-1 md:grid-cols-3',
        '25-50-25': 'grid-cols-1 md:grid-cols-[1fr_2fr_1fr]',
        '25-25-25-25': 'grid-cols-2 md:grid-cols-4',
      };
      const gapClasses: Record<string, string> = {
        none: 'gap-0',
        small: 'gap-2 md:gap-3',
        medium: 'gap-4 md:gap-6',
        large: 'gap-6 md:gap-8',
      };
      const paddingClasses: Record<string, string> = {
        none: 'py-2',
        small: 'py-4 md:py-6',
        medium: 'py-8 md:py-12',
        large: 'py-12 md:py-16',
      };
      
      return (
        <section className={paddingClasses[content.padding || 'medium']}>
          <div className="container mx-auto px-4">
            <div className={cn(
              'grid',
              layoutClasses[colLayout],
              gapClasses[content.gap || 'medium'],
              content.reverseOnMobile && 'flex flex-col-reverse md:grid'
            )}>
              {(content.columns || []).map((col: any, i: number) => (
                <div key={col.id || i} className="p-4 bg-muted/30 rounded-lg min-h-[100px] flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  {col.type === 'empty' ? (
                    <span className="text-muted-foreground text-sm">Coluna {i + 1}</span>
                  ) : col.type === 'text' ? (
                    <p className="text-sm">{col.content?.text || 'Texto aqui'}</p>
                  ) : col.type === 'image' ? (
                    col.content?.url ? <img src={col.content.url} alt="" className="max-h-40 rounded" /> : <Image className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <span className="text-muted-foreground text-sm capitalize">{col.type}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'gallery':
      const galleryColsMap: Record<number, string> = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-2 lg:grid-cols-4',
      };
      const galleryGapMap: Record<string, string> = {
        small: 'gap-2',
        medium: 'gap-4',
        large: 'gap-6',
      };
      return (
        <section className="py-12">
          <div className="container mx-auto px-4">
            {content.title && <h2 className="text-2xl font-bold text-center mb-8">{content.title}</h2>}
            <div className={cn('grid', galleryColsMap[content.columns || 3], galleryGapMap[content.gap || 'medium'])}>
              {(content.images || []).map((img: any, i: number) => (
                <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {img.url ? (
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {(!content.images || content.images.length === 0) && (
                <>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center"><Image className="w-8 h-8 text-muted-foreground" /></div>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center"><Image className="w-8 h-8 text-muted-foreground" /></div>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center"><Image className="w-8 h-8 text-muted-foreground" /></div>
                </>
              )}
            </div>
          </div>
        </section>
      );

    case 'social-proof':
      return (
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            {content.title && <p className="text-center text-sm text-muted-foreground mb-4">{content.title}</p>}
            <div className="flex flex-wrap items-center justify-center gap-8">
              {(content.items || []).map((item: any, i: number) => (
                <div key={i} className="text-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.text || ''} className="h-10 object-contain mx-auto grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                  ) : item.type === 'stat' ? (
                    <div>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </div>
                  ) : (
                    <div className="w-24 h-10 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Logo</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'comparison':
      return (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">{content.title || 'Compare os Planos'}</h2>
            {content.subtitle && <p className="text-center text-muted-foreground mb-12">{content.subtitle}</p>}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {(content.columns || []).map((col: any, i: number) => (
                <Card key={i} className={cn("p-6", col.isHighlighted && "ring-2 ring-primary scale-105")}>
                  <h3 className="text-xl font-bold text-center mb-2">{col.name}</h3>
                  {col.price && <p className="text-3xl font-bold text-center text-primary mb-6">{col.price}</p>}
                  <ul className="space-y-2">
                    {(col.features || []).map((feat: any, j: number) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        {feat.included ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-muted-foreground" />}
                        <span className={!feat.included ? 'text-muted-foreground line-through' : ''}>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );

    case 'steps':
      return (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">{content.title || 'Como Funciona'}</h2>
            {content.subtitle && <p className="text-center text-muted-foreground mb-12">{content.subtitle}</p>}
            <div className={cn("max-w-3xl mx-auto", content.style === 'timeline' ? 'relative pl-8 border-l-2 border-primary/30' : 'grid md:grid-cols-3 gap-8')}>
              {(content.steps || []).map((step: any, i: number) => (
                content.style === 'timeline' ? (
                  <div key={i} className="relative pb-8 pl-6">
                    <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-primary" />
                    <h4 className="font-semibold mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ) : (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{step.number || i + 1}</span>
                    </div>
                    <h4 className="font-semibold mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      );

    case 'countdown':
      return (
        <section className="py-8 bg-destructive/10">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-lg font-semibold mb-4">{content.title || 'Oferta por tempo limitado!'}</h3>
            <div className="flex justify-center gap-4">
              {['Dias', 'Horas', 'Min', 'Seg'].map((label, i) => (
                <div key={label} className={cn("text-center", content.style === 'boxed' && 'bg-background p-3 rounded-lg')}>
                  <div className="text-3xl font-bold">{[0, 12, 34, 56][i]}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    // v3.0 Funnel blocks
    case 'lead-form':
      return <LeadFormBlockRenderer block={block as LeadFormBlock} isPreview />;

    case 'checkout':
      return <CheckoutBlockRenderer block={block as CheckoutBlock} isPreview productPrice={productPrice} productName={productName} />;

    case 'order-bump':
      return <OrderBumpBlockRenderer block={block as OrderBumpBlock} isPreview />;

    case 'upsell':
      return <UpsellBlockRenderer block={block as UpsellBlock} isPreview />;

    case 'pixel':
      return <PixelBlockRenderer block={block as PixelBlock} isPreview />;

    default:
      return (
        <div className="py-8 bg-muted/50">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>Bloco: {(block as any).type}</p>
          </div>
        </div>
      );
    }
  };
  
  // Wrap content with effects if any are applied
  const blockContent = renderContent();
  
  if (hasEffects) {
    return (
      <AnimatedBlockWrapper effects={blockEffects} id={block.id}>
        {blockContent}
      </AnimatedBlockWrapper>
    );
  }
  
  return blockContent;
});

export function FullscreenWixEditor({
  productId,
  productName = '',
  productDescription = '',
  productPrice = 0,
  productOriginalPrice = null,
  productImage = '',
  initialBlocks,
  onSave,
  onClose,
  isLoading,
  isSaving,
}: FullscreenWixEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showBlockPanel, setShowBlockPanel] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [zoom, setZoom] = useState(100);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const lastInitialBlocksRef = useRef<string>('');
  const lastSavedBlocksRef = useRef<string>('');
  
  // CRITICAL: Keep a ref to the latest blocks for saving
  // This prevents stale closure issues in handleSave
  const blocksRef = useRef<Block[]>(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
    // Track unsaved changes
    const currentBlocksJson = JSON.stringify(blocks);
    if (lastSavedBlocksRef.current && currentBlocksJson !== lastSavedBlocksRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Initialize blocks on mount or when initialBlocks changes
  useEffect(() => {
    const initialBlocksJson = JSON.stringify(initialBlocks || []);
    
    // Only update if blocks actually changed
    if (initialBlocksJson !== lastInitialBlocksRef.current) {
      lastInitialBlocksRef.current = initialBlocksJson;
      
      const blocksToUse = initialBlocks && initialBlocks.length > 0 
        ? [...initialBlocks]
        : getDefaultLayout(productName, productDescription);
      
      console.log('[FullscreenWixEditor] Initializing with', blocksToUse.length, 'blocks');
      
      setBlocks(blocksToUse);
      setHistory([blocksToUse]);
      setHistoryIndex(0);
      isInitialized.current = true;
    }
  }, [initialBlocks, productName, productDescription]);

  // Lock body scroll when editor is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette shortcut (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }
      
      // Ignore other shortcuts if inside input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        if (selectedBlockId) {
          setSelectedBlockId(null);
        }
      }
      if (e.key === 'Delete' && selectedBlockId) {
        deleteBlock(selectedBlockId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, historyIndex, history]);


  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const pushHistory = useCallback((newBlocks: Block[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newBlocks);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setBlocks(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setBlocks(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const addBlock = useCallback((type: BlockType) => {
    const newBlock = createBlock(type, blocks.length);
    const newBlocks = [...blocks, newBlock];
    newBlocks.forEach((b, i) => b.order = i);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
    toast.success(`Bloco "${BLOCK_TEMPLATES[type].name}" adicionado`);
  }, [blocks, pushHistory]);

  // CRITICAL FIX: Use functional update to ensure we always have the latest blocks state
  // This prevents stale closure issues when BlockSettings calls onUpdate rapidly
  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    console.log('[FullscreenWixEditor] updateBlock called:', blockId, JSON.stringify(updates).substring(0, 200));
    
    setBlocks(prevBlocks => {
      const blockToUpdate = prevBlocks.find(b => b.id === blockId);
      if (!blockToUpdate) {
        console.warn('[FullscreenWixEditor] Block not found:', blockId);
        return prevBlocks;
      }
      
      // Deep merge content if it's being updated
      const mergedUpdates = updates.content 
        ? { ...updates, content: { ...blockToUpdate.content, ...updates.content } }
        : updates;
      
      const newBlocks = prevBlocks.map(block =>
        block.id === blockId ? { ...block, ...mergedUpdates } : block
      ) as Block[];
      
      console.log('[FullscreenWixEditor] Block updated, new content:', JSON.stringify(newBlocks.find(b => b.id === blockId)?.content).substring(0, 200));
      
      // Push to history - debounced to avoid too many entries
      setTimeout(() => {
        setHistory(prev => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && JSON.stringify(lastEntry) === JSON.stringify(newBlocks)) {
            return prev;
          }
          // Limit history size
          const newHistory = [...prev, newBlocks];
          if (newHistory.length > 50) newHistory.shift();
          return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
      }, 100);
      
      return newBlocks;
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    const newBlocks = blocks.filter(b => b.id !== blockId);
    newBlocks.forEach((b, i) => b.order = i);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    if (block) toast.success(`Bloco "${BLOCK_TEMPLATES[block.type].name}" removido`);
  }, [blocks, selectedBlockId, pushHistory]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const block = blocks[blockIndex];
    const newBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: crypto.randomUUID(),
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    newBlocks.forEach((b, i) => b.order = i);
    
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
    toast.success('Bloco duplicado');
  }, [blocks, pushHistory]);

  const toggleVisibility = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      updateBlock(blockId, { visible: !block.visible });
    }
  }, [blocks, updateBlock]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      newBlocks.forEach((b, i) => b.order = i);
      
      setBlocks(newBlocks);
      pushHistory(newBlocks);
    }
  }, [blocks, pushHistory]);

  const [localSaving, setLocalSaving] = useState(false);
  
  // CRITICAL FIX: Use blocksRef to always get the latest blocks state
  // This prevents saving stale/outdated blocks due to closure issues
  const handleSave = useCallback(async () => {
    if (!onSave) {
      toast.error('Função de salvamento não configurada');
      return;
    }
    
    // Use ref to get the LATEST blocks state
    const currentBlocks = blocksRef.current;
    
    setLocalSaving(true);
    console.log('[FullscreenWixEditor] Saving', currentBlocks.length, 'blocks');
    console.log('[FullscreenWixEditor] Blocks content:', JSON.stringify(currentBlocks).substring(0, 500));
    
    try {
      await onSave(currentBlocks);
      console.log('[FullscreenWixEditor] Save completed successfully');
      lastSavedBlocksRef.current = JSON.stringify(currentBlocks);
      setHasUnsavedChanges(false);
      toast.success('Alterações salvas com sucesso!');
    } catch (error: any) {
      console.error('[FullscreenWixEditor] Save error:', error);
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLocalSaving(false);
    }
  }, [onSave]);

  // Sync function - same as save but with different feedback
  const handleSync = useCallback(async () => {
    if (!onSave) {
      toast.error('Função de sincronização não configurada');
      return;
    }
    
    const currentBlocks = blocksRef.current;
    
    setIsSyncing(true);
    console.log('[FullscreenWixEditor] Syncing', currentBlocks.length, 'blocks');
    
    try {
      await onSave(currentBlocks);
      lastSavedBlocksRef.current = JSON.stringify(currentBlocks);
      setHasUnsavedChanges(false);
      toast.success('Sincronizado com sucesso!');
    } catch (error: any) {
      console.error('[FullscreenWixEditor] Sync error:', error);
      toast.error('Erro ao sincronizar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSyncing(false);
    }
  }, [onSave]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else if (onClose) {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const handleForceClose = useCallback(() => {
    setShowCloseConfirm(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleMaximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const { data: productData } = useQuery({
    queryKey: ['product-slug-fullscreen', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data } = await supabase
        .from('products')
        .select('slug, status')
        .eq('id', productId)
        .maybeSingle();
      return data;
    },
    enabled: !!productId,
    staleTime: 60000,
  });

  const productUrl = productData?.slug 
    ? productData.status === 'published' 
      ? `${window.location.origin}/produto/${productData.slug}` 
      : `${window.location.origin}/preview/${productData.slug}`
    : '';

  // Command palette action handler
  const handleCommandAction = useCallback((action: 'save' | 'undo' | 'redo' | 'preview' | 'settings') => {
    switch (action) {
      case 'save':
        handleSave();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'preview':
        if (productData?.slug) {
          window.open(`${window.location.origin}/produto/${productData.slug}`, '_blank');
        }
        break;
      case 'settings':
        toast.info('Configurações em breve');
        break;
    }
  }, [handleSave, undo, redo, productData]);

  // Prevent event propagation helper
  const stopPropagation = useCallback((handler?: () => void) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (handler) handler();
    };
  }, []);

  const editorContent = (
    <div 
      ref={editorRef}
      className="fixed inset-0 z-[9999] bg-background flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        onAddBlock={addBlock}
        onAction={handleCommandAction}
      />
      
      <TooltipProvider>
        {/* Top Toolbar */}
        <div className="h-12 sm:h-14 border-b bg-card/95 backdrop-blur-sm flex items-center justify-between px-2 sm:px-4 gap-2 shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={stopPropagation(handleClose)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={stopPropagation(undo)}
                    disabled={historyIndex <= 0}
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={stopPropagation(redo)}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refazer (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </div>
            
            {/* Search Button - Command Palette Trigger */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 hidden sm:flex"
                  onClick={stopPropagation(() => setShowCommandPalette(true))}
                >
                  <Search className="w-4 h-4" />
                  <span className="text-muted-foreground text-xs">Buscar...</span>
                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5">⌘K</Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Buscar blocos e ações (Ctrl+K)</TooltipContent>
            </Tooltip>
          </div>

          {/* Center - View Mode - Desktop only */}
          <div className="hidden md:flex items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
            {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((mode) => {
              const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
              return (
                <Tooltip key={mode}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={viewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={stopPropagation(() => setViewMode(mode))}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {mode === 'desktop' ? 'Desktop' : mode === 'tablet' ? 'Tablet' : 'Mobile'}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom - Desktop only */}
            <div className="hidden lg:flex items-center gap-2 px-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={stopPropagation(() => setZoom(Math.max(50, zoom - 10)))}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs w-10 text-center">{zoom}%</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={stopPropagation(() => setZoom(Math.min(150, zoom + 10)))}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
            {/* Sync Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={stopPropagation(handleSync)}
                  disabled={isSyncing || localSaving}
                >
                  <Loader2 className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sincronizar</TooltipContent>
            </Tooltip>

            {/* Minimize Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={stopPropagation(handleMinimize)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Minimizar</TooltipContent>
            </Tooltip>
            
            {productUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 hidden sm:flex"
                onClick={stopPropagation(() => window.open(productUrl, '_blank'))}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            
            {/* Save Button */}
            <Button
              type="button"
              size="sm"
              className={cn("h-8", hasUnsavedChanges && "ring-2 ring-orange-500")}
              onClick={stopPropagation(handleSave)}
              disabled={isSaving || localSaving}
            >
              {(isSaving || localSaving) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              <span className="hidden sm:inline">{(isSaving || localSaving) ? 'Salvando...' : 'Salvar'}</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Panel - Block Palette */}
          <AnimatePresence>
            {showBlockPanel && (
              <>
                {/* Mobile backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 z-20 lg:hidden"
                  onClick={stopPropagation(() => setShowBlockPanel(false))}
                />
                
                <motion.div
                  initial={{ x: -280, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -280, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={cn(
                    "absolute lg:relative inset-y-0 left-0 z-30",
                    "w-[85vw] max-w-[280px] sm:w-[280px] md:w-[300px] lg:w-[280px]",
                    "border-r bg-card flex flex-col shadow-2xl lg:shadow-none",
                    "touch-pan-y overscroll-contain"
                  )}
                  style={{ 
                    height: '100dvh',
                    maxHeight: '-webkit-fill-available'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 sm:p-3 border-b flex items-center justify-between shrink-0 bg-card/95 backdrop-blur-sm sticky top-0 z-10 safe-area-inset-top">
                    <div className="flex items-center gap-2 min-w-0">
                      <Plus className="w-4 h-4 shrink-0" />
                      <h3 className="font-semibold text-xs sm:text-sm truncate">Adicionar Bloco</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{blocks.length}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 lg:hidden"
                        onClick={stopPropagation(() => setShowBlockPanel(false))}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain"
                    style={{ 
                      WebkitOverflowScrolling: 'touch',
                      maxHeight: 'calc(100dvh - 56px)',
                    }}
                  >
                    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 pb-32">
                      {/* Block Categories with Templates */}
                      {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => {
                        const categoryKey = key === 'social' ? 'social' : 
                                            key === 'funnel' ? 'funnel' : 
                                            key === 'hero' ? 'hero' :
                                            key === 'layout' ? 'layout' :
                                            key === 'content' ? 'content' :
                                            key === 'conversion' ? 'conversion' : null;
                        
                        const categoryTemplates = categoryKey ? ALL_CATEGORY_TEMPLATES[categoryKey as keyof typeof ALL_CATEGORY_TEMPLATES] : [];
                        
                        return (
                          <div key={key}>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary">
                                {category.label.charAt(0)}
                              </span>
                              {category.label}
                            </h4>
                            
                            {/* Category Templates - Professional Design */}
                            {categoryTemplates.length > 0 && (
                              <div className="mb-3 space-y-1.5">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                  Templates prontos
                                </span>
                                {categoryTemplates.map((template) => {
                                  const Icon = ICONS[BLOCK_TEMPLATES[template.blockType]?.icon] || Layout;
                                  return (
                                    <button
                                      key={template.id}
                                      type="button"
                                      onClick={stopPropagation(() => {
                                        const newBlock = template.createBlock(blocks.length);
                                        const newBlocks = [...blocks, newBlock];
                                        newBlocks.forEach((b, i) => b.order = i);
                                        setBlocks(newBlocks);
                                        pushHistory(newBlocks);
                                        setSelectedBlockId(newBlock.id);
                                        toast.success(`Template "${template.name}" adicionado!`);
                                        if (window.innerWidth < 1024) {
                                          setShowBlockPanel(false);
                                        }
                                      })}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/50 hover:from-primary/10 hover:to-primary/20 transition-all text-left group"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-xs font-medium block truncate">{template.name}</span>
                                        <span className="text-[10px] text-muted-foreground block truncate">{template.preview}</span>
                                      </div>
                                      <Plus className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Individual Blocks */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {category.blocks.map((type) => {
                                const template = BLOCK_TEMPLATES[type];
                                if (!template) return null;
                                const Icon = ICONS[template.icon] || Layout;
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={stopPropagation(() => {
                                      addBlock(type);
                                      if (window.innerWidth < 1024) {
                                        setShowBlockPanel(false);
                                      }
                                    })}
                                    className="flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                                  >
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary" />
                                    <span className="text-[10px] sm:text-xs font-medium">{template.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                            
                            <Separator className="mt-4" />
                          </div>
                        );
                      })}
                      
                      {/* Page Templates Section */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                            📦
                          </span>
                          Templates de Página
                        </h4>
                        <div className="space-y-1.5">
                          {PRODUCT_TEMPLATES.map((template) => {
                            const Icon = ICONS[template.icon] || Layout;
                            return (
                              <button
                                key={template.id}
                                type="button"
                                onClick={stopPropagation(() => {
                                  const templateBlocks = getTemplateBlocks(template.id, productName, productDescription);
                                  setBlocks(templateBlocks);
                                  pushHistory(templateBlocks);
                                  toast.success(`Template "${template.name}" aplicado!`);
                                  if (window.innerWidth < 1024) {
                                    setShowBlockPanel(false);
                                  }
                                })}
                                className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-muted hover:border-primary hover:bg-primary/5 transition-all text-left group"
                              >
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-medium block truncate">{template.name}</span>
                                  <span className="text-[10px] text-muted-foreground block truncate">{template.description}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Center - Canvas with Drag & Drop */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
            <div className="p-2 border-b bg-background/50 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm"
                onClick={stopPropagation(() => setShowBlockPanel(!showBlockPanel))}
              >
                <Layers className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{showBlockPanel ? 'Ocultar' : 'Mostrar'} Blocos</span>
                <span className="sm:hidden">{showBlockPanel ? 'Ocultar' : 'Blocos'}</span>
              </Button>
              
              {/* Mobile view mode selector */}
              <div className="flex md:hidden items-center gap-1 rounded-lg border bg-muted/50 p-0.5">
                {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((mode) => {
                  const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
                  return (
                    <Button
                      key={mode}
                      type="button"
                      variant={viewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={stopPropagation(() => setViewMode(mode))}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {/* Device Frame */}
              <div 
                className={cn(
                  "mx-auto bg-background rounded-xl shadow-2xl overflow-hidden transition-all",
                  viewMode !== 'desktop' && "border-8 border-gray-800 rounded-3xl"
                )}
                style={{
                  width: VIEW_WIDTHS[viewMode],
                  maxWidth: '100%',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* Mobile Notch */}
                {viewMode === 'mobile' && (
                  <div className="bg-gray-800 h-6 flex justify-center items-center">
                    <div className="w-20 h-4 bg-black rounded-full" />
                  </div>
                )}
                
                {/* Content */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-[400px]">
                      {blocks
                        .sort((a, b) => a.order - b.order)
                        .map(block => (
                          <SortableBlock
                            key={block.id}
                            id={block.id}
                            isSelected={selectedBlockId === block.id}
                            className="group"
                          >
                            <div
                              onClick={stopPropagation(() => setSelectedBlockId(block.id))}
                              className={cn(
                                "relative cursor-pointer transition-all",
                                selectedBlockId === block.id && "ring-2 ring-primary ring-offset-2",
                                !block.visible && "opacity-30 grayscale"
                              )}
                            >
                              {/* Hidden indicator */}
                              {!block.visible && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                  <Badge variant="secondary" className="text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Bloco Oculto
                                  </Badge>
                                </div>
                              )}
                              
                              <BlockPreviewRenderer block={block} productName={productName} productPrice={productPrice} />
                              
                              {/* Block Actions Overlay */}
                              <div className={cn(
                                "absolute top-2 right-2 flex gap-1 bg-background/95 rounded-lg p-1 shadow-lg border transition-opacity",
                                selectedBlockId === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7" 
                                      onClick={stopPropagation(() => setSelectedBlockId(block.id))}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7" 
                                      onClick={stopPropagation(() => duplicateBlock(block.id))}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Duplicar</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant={block.visible ? "ghost" : "secondary"}
                                      size="icon" 
                                      className="h-7 w-7" 
                                      onClick={stopPropagation(() => toggleVisibility(block.id))}
                                    >
                                      <Eye className={cn("w-3.5 h-3.5", !block.visible && "text-muted-foreground")} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{block.visible ? 'Ocultar Bloco' : 'Mostrar Bloco'}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-destructive hover:text-destructive" 
                                      onClick={stopPropagation(() => deleteBlock(block.id))}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Excluir Bloco</TooltipContent>
                                </Tooltip>
                              </div>
                              
                              {/* Block type label */}
                              <div className={cn(
                                "absolute top-2 left-12 transition-opacity",
                                selectedBlockId === block.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                <Badge variant="secondary" className="text-xs">
                                  {BLOCK_TEMPLATES[block.type]?.name || block.type}
                                </Badge>
                              </div>
                            </div>
                          </SortableBlock>
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
                
                {/* Mobile Home Bar */}
                {viewMode === 'mobile' && (
                  <div className="bg-gray-800 h-6 flex justify-center items-center">
                    <div className="w-32 h-1 bg-gray-600 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Block Settings */}
          <AnimatePresence>
            {selectedBlock && (
              <>
                {/* Mobile backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 z-20 lg:hidden"
                  onClick={stopPropagation(() => setSelectedBlockId(null))}
                />
                
                <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={cn(
                    "absolute lg:relative inset-y-0 right-0 z-30",
                    "w-[90vw] max-w-[380px] sm:w-[380px] md:w-[400px] lg:w-[400px]",
                    "border-l bg-card flex flex-col shadow-2xl lg:shadow-none",
                    "touch-pan-y overscroll-contain"
                  )}
                  style={{ 
                    height: '100dvh',
                    maxHeight: '-webkit-fill-available'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 sm:p-3 border-b flex items-center justify-between shrink-0 bg-card/95 backdrop-blur-sm sticky top-0 z-10 safe-area-inset-top">
                    <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-primary" />
                      <span className="truncate">Configurações</span>
                    </h3>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive shrink-0" 
                      onClick={stopPropagation(() => setSelectedBlockId(null))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div 
                    className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y overscroll-contain"
                    style={{ 
                      WebkitOverflowScrolling: 'touch',
                      maxHeight: 'calc(100dvh - 56px)',
                    }}
                  >
                    <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 pb-40 safe-area-inset-bottom">
                      <BlockSettings
                        block={selectedBlock}
                        onUpdate={(updates) => {
                          console.log('[BlockSettings] Update triggered for block:', selectedBlock.id, updates);
                          updateBlock(selectedBlock.id, updates);
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </div>
  );

  // Minimized floating bar
  if (isMinimized) {
    return createPortal(
      <div className="fixed bottom-4 right-4 z-[9999] bg-card border rounded-lg shadow-xl p-3 flex items-center gap-3">
        <span className="text-sm font-medium">Editor de Página</span>
        {hasUnsavedChanges && <Badge variant="outline" className="text-orange-500 border-orange-500">Não salvo</Badge>}
        <Button size="sm" variant="outline" onClick={handleMaximize}>
          <Maximize2 className="w-4 h-4 mr-1" /> Maximizar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={localSaving}>
          {localSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>,
      document.body
    );
  }

  // Close confirmation dialog
  const closeConfirmDialog = showCloseConfirm && createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center" onClick={() => setShowCloseConfirm(false)}>
      <div className="bg-card p-6 rounded-lg shadow-xl max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">Alterações não salvas</h3>
        <p className="text-muted-foreground mb-4">Você tem alterações não salvas. Deseja descartar?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleForceClose}>Descartar</Button>
        </div>
      </div>
    </div>,
    document.body
  );

  // Use React Portal to render editor at document body level
  return (
    <>
      {closeConfirmDialog}
      {createPortal(editorContent, document.body)}
    </>
  );
}
