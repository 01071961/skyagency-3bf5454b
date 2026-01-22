// Block Templates - 3 layouts prontos para cada categoria
import { Block, BlockType, Hero3DBlock, HeroBlock, BenefitsBlock, FeaturesBlock, TestimonialsBlock, FAQBlock, CTABlock, GuaranteeBlock, CountdownBlock, ComparisonBlock, StepsBlock, PricingBlock, GalleryBlock, ColumnsBlock, TextBlock, ImageBlock, VideoBlock, SocialProofBlock, LeadFormBlock, CheckoutBlock, OrderBumpBlock, UpsellBlock, PixelBlock, TextStyle, DividerBlock, SpacerBlock } from './types';

export interface BlockCategoryTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // Thumbnail/preview description
  category: string;
  blockType: BlockType;
  createBlock: (order: number) => Block;
}

// Default text styles
const DEFAULT_TEXT_STYLE: TextStyle = {
  text: '',
  fontFamily: 'Inter',
  fontSize: 48,
  fontWeight: 'bold',
  fontStyle: 'normal',
  alignment: 'center',
  color: '#ffffff',
  textShadow: 'glow',
  letterSpacing: 0,
  lineHeight: 1.2,
  animation: 'fadeUp',
};

// ========== HERO TEMPLATES ==========
export const HERO_TEMPLATES: BlockCategoryTemplate[] = [
  {
    id: 'hero-minimal',
    name: 'Hero Minimalista',
    description: 'Design limpo e elegante com foco no texto',
    preview: '🎯 Minimalista',
    category: 'hero',
    blockType: 'hero',
    createBlock: (order: number): HeroBlock => ({
      id: crypto.randomUUID(),
      type: 'hero',
      visible: true,
      order,
      content: {
        headline: 'Transforme sua vida hoje',
        subheadline: 'Descubra o método que já ajudou milhares de pessoas',
        alignment: 'center',
        overlayOpacity: 60,
      }
    })
  },
  {
    id: 'hero-3d-particles',
    name: 'Hero 3D Partículas',
    description: 'Efeito 3D com partículas flutuantes vibrantes',
    preview: '✨ Partículas 3D',
    category: 'hero',
    blockType: 'hero-3d',
    createBlock: (order: number): Hero3DBlock => ({
      id: crypto.randomUUID(),
      type: 'hero-3d',
      visible: true,
      order,
      content: {
        headline: { ...DEFAULT_TEXT_STYLE, text: 'O Futuro Começa Agora', fontSize: 60, textShadow: 'neon', animation: 'scaleIn' },
        subheadline: { ...DEFAULT_TEXT_STYLE, text: 'Tecnologia de ponta para resultados extraordinários', fontSize: 24, fontWeight: 'normal', textShadow: 'soft' },
        effect: 'particles',
        colorScheme: 'purple',
        showCTA: true,
        ctaText: 'COMEÇAR AGORA',
        ctaStyle: 'glow',
        backgroundMode: 'effect',
        overlayOpacity: 30,
      }
    })
  },
  {
    id: 'hero-3d-space',
    name: 'Hero 3D Espacial',
    description: 'Efeito espacial com estrelas e planetas',
    preview: '🚀 Espacial',
    category: 'hero',
    blockType: 'hero-3d',
    createBlock: (order: number): Hero3DBlock => ({
      id: crypto.randomUUID(),
      type: 'hero-3d',
      visible: true,
      order,
      content: {
        headline: { ...DEFAULT_TEXT_STYLE, text: 'Explore Novas Possibilidades', fontSize: 56, textShadow: 'glow', animation: 'fadeUp' },
        subheadline: { ...DEFAULT_TEXT_STYLE, text: 'Sua jornada para o sucesso começa aqui', fontSize: 22, fontWeight: 'normal' },
        effect: 'space',
        colorScheme: 'cyan',
        showCTA: true,
        ctaText: 'DECOLAR AGORA',
        ctaStyle: 'glow',
        backgroundMode: 'effect',
        overlayOpacity: 40,
      }
    })
  },
];

// ========== LAYOUT TEMPLATES ==========
export const LAYOUT_TEMPLATES: BlockCategoryTemplate[] = [
  {
    id: 'columns-image-text',
    name: 'Imagem + Texto',
    description: 'Layout clássico com imagem à esquerda e texto à direita',
    preview: '📷 Imagem | Texto',
    category: 'layout',
    blockType: 'columns',
    createBlock: (order: number): ColumnsBlock => ({
      id: crypto.randomUUID(),
      type: 'columns',
      visible: true,
      order,
      content: {
        layout: '50-50',
        gap: 'large',
        verticalAlign: 'center',
        reverseOnMobile: true,
        padding: 'large',
        columns: [
          { id: crypto.randomUUID(), type: 'image', content: { url: '', alt: 'Imagem do produto' } },
          { id: crypto.randomUUID(), type: 'text', content: { text: '## Por que escolher este produto?\n\n✅ Resultados comprovados\n\n✅ Metodologia testada\n\n✅ Suporte especializado\n\n✅ Acesso vitalício' } },
        ],
      }
    })
  },
  {
    id: 'columns-three-features',
    name: '3 Features',
    description: 'Três colunas iguais para destacar recursos',
    preview: '📊 3 Colunas',
    category: 'layout',
    blockType: 'columns',
    createBlock: (order: number): ColumnsBlock => ({
      id: crypto.randomUUID(),
      type: 'columns',
      visible: true,
      order,
      content: {
        layout: '33-33-33',
        gap: 'medium',
        verticalAlign: 'top',
        reverseOnMobile: false,
        padding: 'medium',
        columns: [
          { id: crypto.randomUUID(), type: 'icon-text', content: { icon: 'Zap', title: 'Rápido', description: 'Resultados em 7 dias ou menos' } },
          { id: crypto.randomUUID(), type: 'icon-text', content: { icon: 'Shield', title: 'Seguro', description: 'Garantia de 30 dias' } },
          { id: crypto.randomUUID(), type: 'icon-text', content: { icon: 'Award', title: 'Premium', description: 'Conteúdo exclusivo' } },
        ],
      }
    })
  },
  {
    id: 'gallery-showcase',
    name: 'Galeria Showcase',
    description: 'Grade de imagens para mostrar seu produto',
    preview: '🖼️ Galeria',
    category: 'layout',
    blockType: 'gallery',
    createBlock: (order: number): GalleryBlock => ({
      id: crypto.randomUUID(),
      type: 'gallery',
      visible: true,
      order,
      content: {
        title: 'Veja o Conteúdo',
        columns: 3,
        gap: 'medium',
        images: [
          { url: '', alt: 'Prévia 1', caption: 'Módulo 1' },
          { url: '', alt: 'Prévia 2', caption: 'Módulo 2' },
          { url: '', alt: 'Prévia 3', caption: 'Módulo 3' },
        ],
      }
    })
  },
];

// ========== CONTENT TEMPLATES ==========
export const CONTENT_TEMPLATES: BlockCategoryTemplate[] = [
  {
    id: 'text-storytelling',
    name: 'Texto Storytelling',
    description: 'Texto longo para contar sua história',
    preview: '📝 História',
    category: 'content',
    blockType: 'text',
    createBlock: (order: number): TextBlock => ({
      id: crypto.randomUUID(),
      type: 'text',
      visible: true,
      order,
      content: {
        text: '<h2>Minha História</h2><p>Há alguns anos, eu estava exatamente onde você está agora. Frustrado, sem direção e procurando uma solução...</p><p>Até que descobri o método que mudou tudo. E agora quero compartilhar com você.</p>',
        alignment: 'left',
        size: 'large',
        fontFamily: 'Georgia',
        fontSize: 18,
        lineHeight: 1.8,
      }
    })
  },
  {
    id: 'video-vsl',
    name: 'VSL Principal',
    description: 'Vídeo de vendas centralizado com destaque',
    preview: '🎬 Vídeo VSL',
    category: 'content',
    blockType: 'video',
    createBlock: (order: number): VideoBlock => ({
      id: crypto.randomUUID(),
      type: 'video',
      visible: true,
      order,
      content: {
        url: '',
        title: 'Assista antes que seja tarde!',
        autoplay: false,
        controls: true,
      }
    })
  },
  {
    id: 'image-hero-product',
    name: 'Imagem Produto',
    description: 'Imagem grande do produto em destaque',
    preview: '📸 Produto',
    category: 'content',
    blockType: 'image',
    createBlock: (order: number): ImageBlock => ({
      id: crypto.randomUUID(),
      type: 'image',
      visible: true,
      order,
      content: {
        url: '',
        alt: 'Produto em destaque',
        caption: 'Seu produto aqui',
        fullWidth: true,
      }
    })
  },
];

// ========== CONVERSION TEMPLATES ==========
export const CONVERSION_TEMPLATES: BlockCategoryTemplate[] = [
  {
    id: 'pricing-urgency',
    name: 'Preço com Urgência',
    description: 'Bloco de preço com desconto e urgência',
    preview: '💰 Preço Urgente',
    category: 'conversion',
    blockType: 'pricing',
    createBlock: (order: number): PricingBlock => ({
      id: crypto.randomUUID(),
      type: 'pricing',
      visible: true,
      order,
      content: {
        showOriginalPrice: true,
        showDiscount: true,
        showInstallments: true,
        highlightText: '🔥 ÚLTIMAS VAGAS',
      }
    })
  },
  {
    id: 'cta-high-conversion',
    name: 'CTA Alta Conversão',
    description: 'Botão de compra com selos de segurança',
    preview: '🛒 CTA Premium',
    category: 'conversion',
    blockType: 'cta',
    createBlock: (order: number): CTABlock => ({
      id: crypto.randomUUID(),
      type: 'cta',
      visible: true,
      order,
      content: {
        text: '⚡ Oferta por tempo limitado!',
        subtext: 'Garanta seu acesso agora e transforme sua vida',
        buttonText: 'SIM, QUERO GARANTIR MINHA VAGA!',
        style: 'glow',
        showSecurityBadges: true,
      }
    })
  },
  {
    id: 'countdown-scarcity',
    name: 'Contador Escassez',
    description: 'Timer de urgência para aumentar conversões',
    preview: '⏰ Countdown',
    category: 'conversion',
    blockType: 'countdown',
    createBlock: (order: number): CountdownBlock => ({
      id: crypto.randomUUID(),
      type: 'countdown',
      visible: true,
      order,
      content: {
        title: '⚠️ Oferta expira em:',
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        style: 'boxed',
      }
    })
  },
];

// ========== SOCIAL PROOF TEMPLATES ==========
export const SOCIAL_PROOF_TEMPLATES: BlockCategoryTemplate[] = [
  {
    id: 'benefits-icons',
    name: 'Benefícios com Ícones',
    description: 'Cards de benefícios com ícones coloridos',
    preview: '⭐ Benefícios',
    category: 'social',
    blockType: 'benefits',
    createBlock: (order: number): BenefitsBlock => ({
      id: crypto.randomUUID(),
      type: 'benefits',
      visible: true,
      order,
      content: {
        title: '🎯 Por que este é o melhor investimento?',
        subtitle: 'Veja o que você vai conquistar',
        items: [
          { icon: 'Zap', title: 'Resultados Rápidos', description: 'Veja mudanças em apenas 7 dias' },
          { icon: 'Shield', title: 'Método Comprovado', description: 'Mais de 10.000 alunos satisfeitos' },
          { icon: 'Heart', title: 'Suporte Humanizado', description: 'Equipe pronta para ajudar você' },
        ],
        columns: 3,
      }
    })
  },
  {
    id: 'testimonials-grid',
    name: 'Depoimentos Grid',
    description: 'Grade de depoimentos com fotos e avaliações',
    preview: '💬 Depoimentos',
    category: 'social',
    blockType: 'testimonials',
    createBlock: (order: number): TestimonialsBlock => ({
      id: crypto.randomUUID(),
      type: 'testimonials',
      visible: true,
      order,
      content: {
        title: '❤️ O que nossos alunos dizem',
        items: [
          { name: 'Maria Silva', role: 'Empresária', text: 'Mudou completamente minha forma de trabalhar. Resultados incríveis!', rating: 5 },
          { name: 'João Santos', role: 'Freelancer', text: 'O melhor investimento que já fiz. Vale cada centavo!', rating: 5 },
          { name: 'Ana Costa', role: 'Designer', text: 'Simples, prático e eficiente. Recomendo demais!', rating: 5 },
        ],
        layout: 'grid',
      }
    })
  },
  {
    id: 'faq-objections',
    name: 'FAQ Anti-Objeções',
    description: 'Perguntas que eliminam objeções de compra',
    preview: '❓ FAQ',
    category: 'social',
    blockType: 'faq',
    createBlock: (order: number): FAQBlock => ({
      id: crypto.randomUUID(),
      type: 'faq',
      visible: true,
      order,
      content: {
        title: '🤔 Dúvidas Frequentes',
        items: [
          { question: 'Funciona mesmo para iniciantes?', answer: 'Sim! O método foi criado pensando em quem está começando do zero.' },
          { question: 'Quanto tempo leva para ver resultados?', answer: 'A maioria dos alunos vê resultados nas primeiras 2 semanas.' },
          { question: 'E se eu não gostar?', answer: 'Você tem 7 dias de garantia incondicional. Devolvemos 100% do seu investimento.' },
        ],
      }
    })
  },
];

// ========== FUNNEL TEMPLATES ==========
export const FUNNEL_TEMPLATES: BlockCategoryTemplate[] = [
  {
    id: 'lead-form-simple',
    name: 'Captura Simples',
    description: 'Formulário simples para captura de leads',
    preview: '📧 Lead Form',
    category: 'funnel',
    blockType: 'lead-form',
    createBlock: (order: number): LeadFormBlock => ({
      id: crypto.randomUUID(),
      type: 'lead-form',
      visible: true,
      order,
      content: {
        title: '📧 Receba Conteúdo Exclusivo',
        subtitle: 'Cadastre-se gratuitamente',
        fields: ['name', 'email'],
        integration: 'webhook',
        buttonText: 'QUERO RECEBER GRÁTIS',
        buttonStyle: 'glow',
        successMessage: 'Pronto! Verifique seu e-mail.',
        showPrivacyNote: true,
      }
    })
  },
  {
    id: 'checkout-stripe',
    name: 'Checkout Stripe',
    description: 'Checkout integrado com Stripe',
    preview: '💳 Checkout',
    category: 'funnel',
    blockType: 'checkout',
    createBlock: (order: number): CheckoutBlock => ({
      id: crypto.randomUUID(),
      type: 'checkout',
      visible: true,
      order,
      content: {
        provider: 'stripe',
        showBump: true,
        style: 'embedded',
      }
    })
  },
  {
    id: 'upsell-oneclick',
    name: 'Upsell One-Click',
    description: 'Oferta de upsell com compra em um clique',
    preview: '🚀 Upsell',
    category: 'funnel',
    blockType: 'upsell',
    createBlock: (order: number): UpsellBlock => ({
      id: crypto.randomUUID(),
      type: 'upsell',
      visible: true,
      order,
      content: {
        title: '🎁 Espere! Oferta Exclusiva',
        description: 'Aproveite esta oportunidade única para potencializar seus resultados.',
        price: 47,
        originalPrice: 197,
        productId: '',
        oneClick: true,
        acceptButtonText: 'SIM! Quero esta oferta especial',
        declineButtonText: 'Não, vou deixar passar essa oportunidade',
        countdownSeconds: 300,
        style: 'fullpage',
      }
    })
  },
];

// Todos os templates agrupados por categoria
export const ALL_CATEGORY_TEMPLATES = {
  hero: HERO_TEMPLATES,
  layout: LAYOUT_TEMPLATES,
  content: CONTENT_TEMPLATES,
  conversion: CONVERSION_TEMPLATES,
  social: SOCIAL_PROOF_TEMPLATES,
  funnel: FUNNEL_TEMPLATES,
};

// Função para obter templates por categoria
export function getTemplatesByCategory(category: keyof typeof ALL_CATEGORY_TEMPLATES): BlockCategoryTemplate[] {
  return ALL_CATEGORY_TEMPLATES[category] || [];
}

// Função para obter template por ID
export function getTemplateById(templateId: string): BlockCategoryTemplate | undefined {
  for (const templates of Object.values(ALL_CATEGORY_TEMPLATES)) {
    const found = templates.find(t => t.id === templateId);
    if (found) return found;
  }
  return undefined;
}
