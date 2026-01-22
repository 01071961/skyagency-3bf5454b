// Block Editor Types - Wix-like Editor
export type BlockType = 
  | 'hero'
  | 'hero-3d'
  | 'benefits'
  | 'features'
  | 'testimonials'
  | 'faq'
  | 'pricing'
  | 'video'
  | 'text'
  | 'image'
  | 'cta'
  | 'guarantee'
  | 'countdown'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'gallery'
  | 'social-proof'
  | 'comparison'
  | 'steps'
  // v3.0 - Funnel blocks
  | 'lead-form'
  | 'checkout'
  | 'order-bump'
  | 'upsell'
  | 'pixel';

export interface BlockBase {
  id: string;
  type: BlockType;
  visible: boolean;
  order: number;
}

export interface HeroBlock extends BlockBase {
  type: 'hero';
  content: {
    headline: string;
    subheadline: string;
    backgroundImage?: string;
    alignment: 'left' | 'center' | 'right';
    overlayOpacity: number;
  };
}

export interface TextStyle {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontStyle: 'normal' | 'italic';
  alignment: 'left' | 'center' | 'right';
  color: string;
  textShadow: 'none' | 'soft' | 'glow' | 'neon' | 'long';
  letterSpacing: number;
  lineHeight: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  headingType?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body' | 'small' | 'tiny';
  animation: 'none' | 'fadeUp' | 'fadeDown' | 'scaleIn' | 'typewriter' | 'bounce' | 'glow';
  gradient?: { from: string; to: string; direction: string };
}

// Extended typography settings for blocks like text, hero, benefits, etc.
export interface TypographySettings {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  fontStyle: 'normal' | 'italic';
  alignment: 'left' | 'center' | 'right';
  color: string;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  headingType?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body' | 'small' | 'tiny';
}

// Media type for slides and backgrounds
export type MediaType = 'image' | 'video' | 'embed';

export interface Hero3DSlide {
  id: string;
  imageUrl: string;
  alt?: string;
  // Per-slide content
  headline?: string;
  subheadline?: string;
  mediaType?: MediaType;
  // Per-slide typography (optional overrides)
  headlineFontSize?: number;
  headlineFontFamily?: string;
  subheadlineFontSize?: number;
  subheadlineFontFamily?: string;
}

// 3D Effect types
export type Effect3DType = 'particles' | 'space' | 'waves' | 'neon' | 'morphing-sphere' | 'diamond' | 'neon-ring' | 'neon-grid';

export interface Hero3DBlock extends BlockBase {
  type: 'hero-3d';
  content: {
    headline: TextStyle;
    subheadline: TextStyle;
    effect: Effect3DType;
    colorScheme: 'purple' | 'cyan' | 'pink' | 'gold' | 'neon' | 'sunset';
    showCTA: boolean;
    ctaText: string;
    ctaUrl?: string; // FIXED: Added ctaUrl for link support
    ctaStyle: 'primary' | 'glow' | 'outline' | 'neon';
    // Slide/Background options - now supports overlay modes
    backgroundMode: 'effect' | 'image' | 'slideshow' | 'effect-over-image' | 'effect-over-slideshow';
    backgroundImage?: string;
    backgroundMediaType?: MediaType; // Type of background media
    overlayOpacity: number; // 0-100
    overlayColor?: string; // hex color
    slides?: Hero3DSlide[];
    slideInterval?: number; // seconds (1-30)
    slideTransition?: 'fade' | 'slide' | 'zoom';
    // Effect overlay opacity (when effect is over image/slides)
    effectOpacity?: number; // 0-100
    // Global headline typography for slides (fallback)
    slideHeadlineFontSize?: number;
    slideHeadlineFontFamily?: string;
    slideSubheadlineFontSize?: number;
    slideSubheadlineFontFamily?: string;
  };
}

// Layout options for grid blocks
export type GapSize = 'none' | 'small' | 'medium' | 'large';
export type PaddingSize = 'none' | 'small' | 'medium' | 'large';
export type VerticalAlign = 'top' | 'center' | 'bottom';

export interface BenefitsBlock extends BlockBase {
  type: 'benefits';
  content: {
    title: string;
    subtitle?: string;
    // Typography for title
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    titleColor?: string;
    titleAlignment?: 'left' | 'center' | 'right';
    // Typography for subtitle
    subtitleFontFamily?: string;
    subtitleFontSize?: number;
    subtitleFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    subtitleColor?: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    columns: 2 | 3 | 4;
    // Layout options
    gap?: GapSize;
    padding?: PaddingSize;
    verticalAlign?: VerticalAlign;
    reverseMobile?: boolean;
    backgroundColor?: string;
  };
}

export interface FeaturesBlock extends BlockBase {
  type: 'features';
  content: {
    title: string;
    // Typography for title
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    titleColor?: string;
    titleAlignment?: 'left' | 'center' | 'right';
    items: string[];
    icon: string;
  };
}

export interface TestimonialsBlock extends BlockBase {
  type: 'testimonials';
  content: {
    title: string;
    items: Array<{
      name: string;
      role?: string;
      avatar?: string;
      text: string;
      rating?: number;
    }>;
    layout: 'grid' | 'carousel';
  };
}

export interface FAQBlock extends BlockBase {
  type: 'faq';
  content: {
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
}

export interface PricingBlock extends BlockBase {
  type: 'pricing';
  content: {
    showOriginalPrice: boolean;
    showDiscount: boolean;
    showInstallments: boolean;
    highlightText?: string;
  };
}

export interface VideoBlock extends BlockBase {
  type: 'video';
  content: {
    url: string;
    title?: string;
    autoplay: boolean;
    controls: boolean;
  };
}

export interface TextBlock extends BlockBase {
  type: 'text';
  content: {
    text: string;
    alignment: 'left' | 'center' | 'right';
    size: 'small' | 'medium' | 'large';
    // Extended typography options
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    headingType?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body' | 'small' | 'tiny';
  };
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  content: {
    url: string;
    alt: string;
    caption?: string;
    fullWidth: boolean;
  };
}

export interface CTABlock extends BlockBase {
  type: 'cta';
  content: {
    text: string;
    subtext?: string;
    buttonText: string;
    style: 'primary' | 'glow' | 'outline';
    stripePriceId?: string;
    showSecurityBadges: boolean;
  };
}

export interface GuaranteeBlock extends BlockBase {
  type: 'guarantee';
  content: {
    title: string;
    text: string;
    days: number;
    icon: string;
  };
}

export interface CountdownBlock extends BlockBase {
  type: 'countdown';
  content: {
    title: string;
    endDate: string;
    style: 'minimal' | 'boxed';
  };
}

export interface DividerBlock extends BlockBase {
  type: 'divider';
  content: {
    style: 'line' | 'gradient' | 'dots';
  };
}

export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  content: {
    height: 'small' | 'medium' | 'large';
  };
}

// NEW: Columns block for side-by-side layouts with flexible column counts
export interface ColumnsBlock extends BlockBase {
  type: 'columns';
  content: {
    layout: '50-50' | '60-40' | '40-60' | '70-30' | '30-70' | '33-33-33' | '25-50-25' | '25-25-25-25' | 'custom';
    gap: 'none' | 'small' | 'medium' | 'large';
    verticalAlign: 'top' | 'center' | 'bottom';
    reverseOnMobile: boolean;
    backgroundColor?: string;
    padding: 'none' | 'small' | 'medium' | 'large';
    columns: Array<{
      id: string;
      type: 'text' | 'image' | 'video' | 'cta' | 'list' | 'icon-text' | 'form' | 'empty';
      content: any;
    }>;
  };
}

// NEW: Social Proof block for logos and trust badges
export interface SocialProofBlock extends BlockBase {
  type: 'social-proof';
  content: {
    title?: string;
    style: 'logos' | 'badges' | 'stats' | 'trust-bar';
    items: Array<{
      type: 'logo' | 'badge' | 'stat';
      imageUrl?: string;
      text?: string;
      value?: string;
      label?: string;
    }>;
  };
}

// NEW: Comparison Table block
export interface ComparisonBlock extends BlockBase {
  type: 'comparison';
  content: {
    title: string;
    subtitle?: string;
    columns: Array<{
      name: string;
      isHighlighted: boolean;
      price?: string;
      features: Array<{
        text: string;
        included: boolean;
      }>;
    }>;
  };
}

// NEW: Steps/Process block
export interface StepsBlock extends BlockBase {
  type: 'steps';
  content: {
    title: string;
    subtitle?: string;
    style: 'numbered' | 'icons' | 'timeline';
    steps: Array<{
      number?: number;
      icon?: string;
      title: string;
      description: string;
    }>;
  };
}

// NEW: Gallery block for image grids
export interface GalleryBlock extends BlockBase {
  type: 'gallery';
  content: {
    title?: string;
    columns: 2 | 3 | 4;
    gap: 'small' | 'medium' | 'large';
    images: Array<{
      url: string;
      alt: string;
      caption?: string;
    }>;
  };
}

// v3.0 - Lead Form Block
export interface LeadFormBlock extends BlockBase {
  type: 'lead-form';
  content: {
    title?: string;
    subtitle?: string;
    fields: Array<'name' | 'email' | 'phone' | 'whatsapp'>;
    integration: 'activecampaign' | 'convertkit' | 'mautic' | 'mailchimp' | 'brevo' | 'webhook';
    listId?: string;
    webhookUrl?: string;
    buttonText: string;
    buttonStyle: 'primary' | 'glow' | 'outline';
    successMessage: string;
    redirectUrl?: string;
    showPrivacyNote: boolean;
  };
}

// v3.0 - Checkout Block
export interface CheckoutBlock extends BlockBase {
  type: 'checkout';
  content: {
    provider: 'stripe' | 'pagbank' | 'mercadopago' | 'eduzz' | 'hotmart' | 'kiwi';
    priceId?: string;
    productId?: string;
    embedCode?: string;
    showBump: boolean;
    bumpProductId?: string;
    upsellId?: string;
    style: 'embedded' | 'modal' | 'redirect';
  };
}

// v3.0 - Order Bump Block
export interface OrderBumpBlock extends BlockBase {
  type: 'order-bump';
  content: {
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    productId: string;
    imageUrl?: string;
    checkboxText: string;
    isCheckedByDefault: boolean;
    style: 'card' | 'minimal' | 'highlighted';
  };
}

// v3.0 - Upsell Block
export interface UpsellBlock extends BlockBase {
  type: 'upsell';
  content: {
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    productId: string;
    imageUrl?: string;
    oneClick: boolean;
    acceptButtonText: string;
    declineButtonText: string;
    redirectOnAccept?: string;
    redirectOnDecline?: string;
    countdownSeconds?: number;
    style: 'fullpage' | 'modal' | 'inline';
  };
}

// v3.0 - Pixel Tracking Block
export interface PixelBlock extends BlockBase {
  type: 'pixel';
  content: {
    facebookPixelId?: string;
    googleTagId?: string;
    googleAdsId?: string;
    tiktokPixelId?: string;
    events: Array<'pageview' | 'lead' | 'purchase' | 'add_to_cart' | 'initiate_checkout'>;
    customEvents?: Array<{
      name: string;
      trigger: 'on_load' | 'on_scroll' | 'on_click' | 'on_form_submit';
      selector?: string;
    }>;
  };
}

export type Block = 
  | HeroBlock 
  | Hero3DBlock
  | BenefitsBlock 
  | FeaturesBlock 
  | TestimonialsBlock 
  | FAQBlock 
  | PricingBlock 
  | VideoBlock 
  | TextBlock 
  | ImageBlock 
  | CTABlock 
  | GuaranteeBlock 
  | CountdownBlock 
  | DividerBlock 
  | SpacerBlock
  | ColumnsBlock
  | GalleryBlock
  | SocialProofBlock
  | ComparisonBlock
  | StepsBlock
  // v3.0 Blocks
  | LeadFormBlock
  | CheckoutBlock
  | OrderBumpBlock
  | UpsellBlock
  | PixelBlock;

export interface PageLayout {
  blocks: Block[];
  globalStyles: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: 'none' | 'small' | 'medium' | 'large';
  };
}

export const BLOCK_TEMPLATES: Record<BlockType, { name: string; icon: string; description: string }> = {
  hero: { name: 'Hero', icon: 'Layout', description: 'Seção de destaque com imagem' },
  'hero-3d': { name: 'Hero 3D', icon: 'Sparkles', description: 'Hero com animação 3D interativo' },
  benefits: { name: 'Benefícios', icon: 'Star', description: 'Lista de benefícios em cards' },
  features: { name: 'O que você recebe', icon: 'CheckCircle', description: 'Lista de itens inclusos' },
  testimonials: { name: 'Depoimentos', icon: 'Users', description: 'Avaliações de clientes' },
  faq: { name: 'FAQ', icon: 'HelpCircle', description: 'Perguntas frequentes' },
  pricing: { name: 'Preço', icon: 'DollarSign', description: 'Bloco de preço dinâmico' },
  video: { name: 'Vídeo', icon: 'Play', description: 'Player de vídeo incorporado' },
  text: { name: 'Texto', icon: 'Type', description: 'Bloco de texto livre' },
  image: { name: 'Imagem', icon: 'Image', description: 'Imagem com legenda' },
  cta: { name: 'Chamada para Ação', icon: 'MousePointer', description: 'Botão de compra' },
  guarantee: { name: 'Garantia', icon: 'Shield', description: 'Selo de garantia' },
  countdown: { name: 'Contador', icon: 'Clock', description: 'Timer de urgência' },
  divider: { name: 'Divisor', icon: 'Minus', description: 'Linha divisória' },
  spacer: { name: 'Espaçador', icon: 'MoveVertical', description: 'Espaço em branco' },
  columns: { name: 'Colunas', icon: 'Columns', description: 'Layout flexível de 2 a 4 colunas' },
  gallery: { name: 'Galeria', icon: 'Grid3X3', description: 'Grade de imagens externas' },
  'social-proof': { name: 'Prova Social', icon: 'BadgeCheck', description: 'Logos, badges e estatísticas' },
  comparison: { name: 'Comparação', icon: 'GitCompare', description: 'Tabela comparativa de planos' },
  steps: { name: 'Passo a Passo', icon: 'ListOrdered', description: 'Processo ou jornada do cliente' },
  // v3.0 - Funnel blocks
  'lead-form': { name: 'Captura de Lead', icon: 'Mail', description: 'Formulário de captura com integração' },
  checkout: { name: 'Checkout', icon: 'CreditCard', description: 'Checkout embed para pagamentos' },
  'order-bump': { name: 'Order Bump', icon: 'TrendingUp', description: 'Oferta adicional no checkout' },
  upsell: { name: 'Upsell', icon: 'ArrowUpCircle', description: 'Oferta pós-compra one-click' },
  pixel: { name: 'Pixels', icon: 'BarChart3', description: 'Configuração de tracking pixels' },
};
