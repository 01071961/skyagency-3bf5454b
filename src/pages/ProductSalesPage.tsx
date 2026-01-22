import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { 
  Check, ShieldCheck, Clock, Users, Star, Play, 
  BookOpen, Award, ArrowRight, ChevronRight, Share2,
  AlertTriangle, CheckCircle, Zap, Target, Heart
} from 'lucide-react';
import ProductSEOHead from '@/components/ProductSEOHead';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { BlockRenderer, Block } from '@/components/sales/BlockRenderer';

// Helper function to convert video URLs to embed format - ALL formats supported
function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // YouTube - ALL formats: watch?v=, embed/, v/, shorts/, youtu.be/
  const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Wistia
  const wistiaMatch = trimmedUrl.match(/(?:wistia\.(?:com|net)\/(?:medias|embed)\/)([a-zA-Z0-9]+)/);
  if (wistiaMatch) {
    return `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`;
  }
  
  // Loom
  const loomMatch = trimmedUrl.match(/(?:loom\.com\/(?:share|embed)\/)([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  
  // Already an embed URL or direct video
  return trimmedUrl;
}

// Icon mapping for dynamic icons
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle,
  Check,
  Star,
  Award,
  Zap,
  Target,
  Heart,
  ShieldCheck,
  Users,
};

// Types for sales page content
interface SalesPageContent {
  headline?: string;
  subheadline?: string;
  video_url?: string;
  benefits?: Array<{
    icon?: string;
    title: string;
    description?: string;
  }>;
  features?: Array<{
    icon?: string;
    title: string;
    description?: string;
  }>;
  testimonials?: Array<{
    name: string;
    text: string;
    role?: string;
    avatar?: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  cta_text?: string;
  guarantee_text?: string;
  urgency_text?: string;
}

export default function ProductSalesPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const refCode = searchParams.get('ref');

  // Check if this is a preview route (admin viewing draft products)
  const isPreviewMode = location.pathname.startsWith('/preview/');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product-sales-page', slug, isPreviewMode],
    queryFn: async () => {
      console.log('[ProductSalesPage] Fetching product:', slug, 'preview:', isPreviewMode);
      
      let query = supabase
        .from('products')
        .select('*, product_modules(*, product_lessons(*))')
        .eq('slug', slug);
      
      // Only filter by published status if not in preview mode
      if (!isPreviewMode) {
        query = query.eq('status', 'published');
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error('[ProductSalesPage] Query error:', error);
        throw error;
      }
      
      console.log('[ProductSalesPage] Product loaded:', data?.name, 'status:', data?.status);
      console.log('[ProductSalesPage] Sales page content:', data?.sales_page_content);
      return data;
    },
    enabled: !!slug,
    retry: 1
  });

  // Store referral code if present with timestamp for attribution
  useEffect(() => {
    if (refCode) {
      localStorage.setItem('affiliate_ref_code', refCode);
      localStorage.setItem('affiliate_ref_timestamp', Date.now().toString());
    }
  }, [refCode]);

  // Check if product is free (price = 0 or pricing_type = 'free')
  const isFreeProduct = product && (Number(product.price) === 0 || product.pricing_type === 'free');

  const handleBuyNow = async () => {
    if (!product) return;
    
    // If product is free, skip payment and enroll directly
    if (isFreeProduct) {
      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.info('Faça login para acessar o conteúdo gratuito');
          navigate('/auth?redirect=/produto/' + product.slug);
          return;
        }
        
        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .single();
        
        if (existingEnrollment) {
          toast.success('Você já tem acesso a este conteúdo!');
          navigate('/members/courses');
          return;
        }
        
        // Create enrollment for free product
        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert({
            user_id: user.id,
            product_id: product.id,
            status: 'active',
            enrolled_at: new Date().toISOString(),
          });
        
        if (enrollError) {
          console.error('[ProductSalesPage] Enrollment error:', enrollError);
          toast.error('Erro ao acessar o conteúdo. Tente novamente.');
          return;
        }
        
        // Create notification for the user
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'success',
            title: '✅ Acesso Liberado!',
            message: `Você agora tem acesso a "${product.name}". Aproveite!`,
            action_url: '/members/courses',
            data: { product_id: product.id, product_name: product.name, access_type: 'free_product' }
          });
        
        toast.success('Acesso liberado! Bem-vindo ao curso.');
        navigate('/members/courses');
      } catch (err) {
        console.error('[ProductSalesPage] Free access error:', err);
        toast.error('Erro ao processar. Tente novamente.');
      }
      return;
    }
    
    // For paid products, add to cart and go to checkout
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.cover_image_url || undefined
    });
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // For free products, just redirect to buy now (direct enrollment)
    if (isFreeProduct) {
      handleBuyNow();
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.cover_image_url || undefined
    });
    toast.success('Produto adicionado ao carrinho!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Este produto pode não existir, não estar publicado, ou o link pode estar incorreto.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
          <Button variant="outline" onClick={() => navigate('/loja')}>Ver loja</Button>
        </div>
      </div>
    );
  }

  // Parse sales_page_content with fallbacks
  const salesContent: SalesPageContent & { blocks?: Block[] } = (() => {
    try {
      if (typeof product.sales_page_content === 'string') {
        return JSON.parse(product.sales_page_content);
      }
      return (product.sales_page_content as any) || {};
    } catch {
      return {};
    }
  })();
  
  // Check if using advanced block-based editor
  const hasAdvancedBlocks = salesContent.blocks && Array.isArray(salesContent.blocks) && salesContent.blocks.length > 0;
  
  // Use sales_page_content data first, then fallback to product fields
  const headline = salesContent.headline || product.name;
  const subheadline = salesContent.subheadline || product.short_description || product.description;
  const videoUrl = salesContent.video_url || product.trailer_url;
  const benefits = salesContent.benefits || [];
  const features = salesContent.features || [];
  const testimonials = salesContent.testimonials || (product.testimonials as SalesPageContent['testimonials']) || [];
  const faq = salesContent.faq || (product.faq as SalesPageContent['faq']) || [];
  const ctaText = salesContent.cta_text || 'COMPRAR AGORA';
  const guaranteeText = salesContent.guarantee_text || (product.guarantee_days > 0 ? `${product.guarantee_days} dias de garantia` : '');
  const urgencyText = salesContent.urgency_text;
  
  const modules = product.product_modules || [];

  const discount = product.original_price 
    ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)
    : 0;

  // Canonical URL for this product
  const canonicalUrl = `/venda/${product.slug}`;

  const renderIcon = (iconName?: string) => {
    const IconComponent = ICONS[iconName || 'CheckCircle'] || CheckCircle;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <>
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Modo Preview - Este produto está em rascunho e não está visível publicamente</span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-4"
            onClick={() => navigate('/admin')}
          >
            Voltar ao Admin
          </Button>
        </div>
      )}
      
      <ProductSEOHead 
        productName={product.name}
        productDescription={product.short_description || product.description || ''}
        productImage={product.cover_image_url}
        productPrice={Number(product.price)}
        productSlug={product.slug}
        productType={product.product_type}
      />
      <Navbar />
      
      <main className={`min-h-screen bg-background ${isPreviewMode ? 'pt-12' : ''}`}>
        {/* Render Advanced Blocks if available */}
        {hasAdvancedBlocks ? (
          <BlockRenderer
            blocks={salesContent.blocks!}
            productName={product.name}
            productPrice={Number(product.price)}
            productOriginalPrice={product.original_price ? Number(product.original_price) : null}
            productImage={product.cover_image_url || undefined}
            onBuyClick={handleBuyNow}
            ctaText={ctaText}
          />
        ) : (
        <>
        {/* Hero Section */}
        <section className="relative py-8 sm:py-12 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10" />
          
          <div className="container mx-auto px-3 sm:px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="order-2 lg:order-1"
              >
                <Badge className="mb-3 sm:mb-4 bg-primary/20 text-primary text-xs sm:text-sm">
                  {product.product_type === 'course' ? 'Curso Online' : 
                   product.product_type === 'ebook' ? 'E-book' :
                   product.product_type === 'mentoring' ? 'Mentoria' : 'Produto Digital'}
                </Badge>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                  {headline}
                </h1>
                
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 whitespace-pre-line">
                  {subheadline}
                </p>

                {/* Urgency Text */}
                {urgencyText && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      {urgencyText}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {guaranteeText && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                      <span>{guaranteeText}</span>
                    </div>
                  )}
                  {product.access_days ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                      <span>Acesso por {product.access_days} dias</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                      <span>Acesso vitalício</span>
                    </div>
                  )}
                </div>

                {/* Pricing Card */}
                <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur border-primary/20">
                  <div className="flex flex-wrap items-end gap-2 sm:gap-4 mb-3 sm:mb-4">
                    {product.original_price && (
                      <span className="text-lg sm:text-2xl text-muted-foreground line-through">
                        R$ {Number(product.original_price).toFixed(2)}
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                      R$ {Number(product.price).toFixed(2)}
                    </span>
                    {discount > 0 && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        -{discount}% OFF
                      </Badge>
                    )}
                  </div>

                  {product.max_installments > 1 && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                      ou {product.max_installments}x de R$ {(Number(product.price) / product.max_installments).toFixed(2)}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 items-center w-full">
                    <Button 
                      size="lg" 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handleBuyNow}
                    >
                      {ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full"
                      onClick={handleAddToCart}
                    >
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                  
                  {/* Share Button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full mt-2"
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}/produto/${product.slug}`;
                      const shareText = `Confira ${product.name}! ${product.short_description || ''}`;
                      
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: product.name,
                            text: shareText,
                            url: shareUrl,
                          });
                        } catch (err) {
                          // User cancelled
                        }
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Link copiado para compartilhar!');
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative order-1 lg:order-2"
              >
                {videoUrl ? (
                  <div className="aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-black/50 relative">
                    <iframe
                      src={getEmbedUrl(videoUrl)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Vídeo - ${product.name}`}
                    />
                  </div>
                ) : product.cover_image_url ? (
                  <img 
                    src={product.cover_image_url} 
                    alt={product.name}
                    className="w-full rounded-lg sm:rounded-xl shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Section - from sales_page_content */}
        {benefits.length > 0 && (
          <section className="py-10 sm:py-16 bg-muted/30">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
                O que você vai conquistar
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        {renderIcon(benefit.icon)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-1">{benefit.title}</h3>
                        {benefit.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground">{benefit.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section - from sales_page_content */}
        {features.length > 0 && (
          <section className="py-10 sm:py-16">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
                O que está incluído
              </h2>
              
              <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                      {renderIcon(feature.icon)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">{feature.title}</h3>
                      {feature.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{feature.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Course Modules */}
        {modules.length > 0 && (
          <section className="py-10 sm:py-16 bg-muted/30">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
                O que você vai aprender
              </h2>
              
              <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
                {modules.map((module: any, index: number) => (
                  <Card key={module.id} className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm sm:text-base flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg">{module.name}</h3>
                        {module.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{module.description}</p>
                        )}
                        {module.product_lessons?.length > 0 && (
                          <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                            {module.product_lessons.map((lesson: any) => (
                              <div key={lesson.id} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                {lesson.content_type === 'video' ? (
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                ) : (
                                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                )}
                                <span className="truncate">{lesson.name}</span>
                                {lesson.is_free_preview && (
                                  <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">Preview</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Default Benefits (only if no custom benefits) */}
        {benefits.length === 0 && (
          <section className="py-10 sm:py-16">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
                Por que escolher este produto?
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <Card className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Qualidade Premium</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Conteúdo desenvolvido por especialistas
                  </p>
                </Card>
                
                <Card className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Garantia Total</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {product.guarantee_days > 0 
                      ? `${product.guarantee_days} dias de garantia incondicional`
                      : 'Satisfação garantida'}
                  </p>
                </Card>
                
                <Card className="p-4 sm:p-6 text-center sm:col-span-2 md:col-span-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Suporte Dedicado</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Equipe disponível para ajudar
                  </p>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="py-10 sm:py-16 bg-muted/30">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
                O que nossos clientes dizem
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      {testimonial.avatar ? (
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-base sm:text-lg font-bold text-primary">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{testimonial.name}</p>
                        {testimonial.role && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{testimonial.role}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm">"{testimonial.text}"</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="py-10 sm:py-16">
            <div className="container mx-auto px-3 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
                Perguntas Frequentes
              </h2>
              
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                  {faq.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-3 sm:px-4">
                      <AccordionTrigger className="text-left text-sm sm:text-base py-3 sm:py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-xs sm:text-sm">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-10 sm:py-16 bg-gradient-to-br from-primary/20 via-background to-cyan-500/20">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
                Pronto para transformar sua vida?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8">
                Junte-se a milhares de pessoas que já alcançaram seus objetivos com este produto.
              </p>
              
              <div className="flex flex-col gap-4 sm:gap-6 items-center">
                <div className="text-center">
                  {product.original_price && (
                    <p className="text-base sm:text-lg text-muted-foreground line-through">
                      De R$ {Number(product.original_price).toFixed(2)}
                    </p>
                  )}
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                    R$ {Number(product.price).toFixed(2)}
                  </p>
                </div>
                
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
                  onClick={handleBuyNow}
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </div>
              
              {guaranteeText && (
                <p className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {guaranteeText}
                </p>
              )}
            </div>
          </div>
        </section>
        </>
        )}
      </main>
      
      <Footer />
    </>
  );
}
