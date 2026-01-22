import { Block, BlockType, HeroBlock, Hero3DBlock, Hero3DSlide, BenefitsBlock, FeaturesBlock, TestimonialsBlock, FAQBlock, PricingBlock, VideoBlock, TextBlock, ImageBlock, CTABlock, GuaranteeBlock, CountdownBlock, DividerBlock, SpacerBlock, ColumnsBlock, GalleryBlock, SocialProofBlock, ComparisonBlock, StepsBlock, TextStyle, LeadFormBlock, CheckoutBlock, OrderBumpBlock, UpsellBlock, PixelBlock } from './types';

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

export function createBlock(type: BlockType, order: number): Block {
  const baseBlock = {
    id: crypto.randomUUID(),
    type,
    visible: true,
    order,
  };

  switch (type) {
    case 'hero':
      return {
        ...baseBlock,
        type: 'hero',
        content: {
          headline: '',
          subheadline: '',
          backgroundImage: '',
          alignment: 'center',
          overlayOpacity: 40,
        },
      } as HeroBlock;

    case 'hero-3d':
      return {
        ...baseBlock,
        type: 'hero-3d',
        content: {
          headline: { ...DEFAULT_TEXT_STYLE, text: 'Título Impactante', fontSize: 56 },
          subheadline: { ...DEFAULT_TEXT_STYLE, text: 'Subtítulo persuasivo que converte', fontSize: 22, fontWeight: 'normal', textShadow: 'soft' },
          effect: 'particles',
          colorScheme: 'purple',
          showCTA: true,
          ctaText: 'COMPRAR AGORA',
          ctaStyle: 'glow',
          backgroundMode: 'effect',
          backgroundImage: '',
          overlayOpacity: 50,
          slides: [],
          slideInterval: 5,
          slideTransition: 'fade',
        },
      } as Hero3DBlock;

    case 'benefits':
      return {
        ...baseBlock,
        type: 'benefits',
        content: {
          title: 'Por que escolher este produto?',
          subtitle: '',
          items: [],
          columns: 3,
          // Layout defaults
          gap: 'medium',
          padding: 'medium',
          verticalAlign: 'top',
          reverseMobile: false,
          backgroundColor: undefined,
        },
      } as BenefitsBlock;

    case 'features':
      return {
        ...baseBlock,
        type: 'features',
        content: {
          title: 'O que você vai receber',
          items: [],
          icon: 'CheckCircle',
        },
      } as FeaturesBlock;

    case 'testimonials':
      return {
        ...baseBlock,
        type: 'testimonials',
        content: {
          title: 'O que nossos clientes dizem',
          items: [],
          layout: 'grid',
        },
      } as TestimonialsBlock;

    case 'faq':
      return {
        ...baseBlock,
        type: 'faq',
        content: {
          title: 'Perguntas Frequentes',
          items: [],
        },
      } as FAQBlock;

    case 'pricing':
      return {
        ...baseBlock,
        type: 'pricing',
        content: {
          showOriginalPrice: true,
          showDiscount: true,
          showInstallments: true,
          highlightText: '',
        },
      } as PricingBlock;

    case 'video':
      return {
        ...baseBlock,
        type: 'video',
        content: {
          url: '',
          title: '',
          autoplay: false,
          controls: true,
        },
      } as VideoBlock;

    case 'text':
      return {
        ...baseBlock,
        type: 'text',
        content: {
          text: '',
          alignment: 'center',
          size: 'medium',
        },
      } as TextBlock;

    case 'image':
      return {
        ...baseBlock,
        type: 'image',
        content: {
          url: '',
          alt: '',
          caption: '',
          fullWidth: false,
        },
      } as ImageBlock;

    case 'cta':
      return {
        ...baseBlock,
        type: 'cta',
        content: {
          text: 'Não perca essa oportunidade!',
          subtext: 'Garanta sua vaga agora com desconto especial',
          buttonText: 'QUERO COMPRAR AGORA',
          style: 'glow',
          stripePriceId: '',
          showSecurityBadges: true,
        },
      } as CTABlock;

    case 'guarantee':
      return {
        ...baseBlock,
        type: 'guarantee',
        content: {
          title: 'Garantia Incondicional',
          text: 'Se você não ficar 100% satisfeito, devolvemos seu dinheiro sem perguntas.',
          days: 7,
          icon: 'Shield',
        },
      } as GuaranteeBlock;

    case 'countdown':
      return {
        ...baseBlock,
        type: 'countdown',
        content: {
          title: 'Oferta termina em:',
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          style: 'boxed',
        },
      } as CountdownBlock;

    case 'divider':
      return {
        ...baseBlock,
        type: 'divider',
        content: {
          style: 'gradient',
        },
      } as DividerBlock;

    case 'spacer':
      return {
        ...baseBlock,
        type: 'spacer',
        content: {
          height: 'medium',
        },
      } as SpacerBlock;

    case 'columns':
      return {
        ...baseBlock,
        type: 'columns',
        content: {
          layout: '50-50',
          gap: 'medium',
          verticalAlign: 'center',
          reverseOnMobile: false,
          padding: 'medium',
          columns: [
            { id: crypto.randomUUID(), type: 'text', content: { text: 'Coluna 1 - Descrição do produto ou texto explicativo aqui.', alignment: 'left' } },
            { id: crypto.randomUUID(), type: 'image', content: { url: '', alt: 'Imagem do produto' } },
          ],
        },
      } as ColumnsBlock;

    case 'gallery':
      return {
        ...baseBlock,
        type: 'gallery',
        content: {
          title: 'Galeria',
          columns: 3,
          gap: 'medium',
          images: [],
        },
      } as GalleryBlock;

    case 'social-proof':
      return {
        ...baseBlock,
        type: 'social-proof',
        content: {
          title: 'Empresas que confiam em nós',
          style: 'logos',
          items: [],
        },
      } as SocialProofBlock;

    case 'comparison':
      return {
        ...baseBlock,
        type: 'comparison',
        content: {
          title: 'Compare os Planos',
          subtitle: 'Escolha o melhor para você',
          columns: [
            { name: 'Básico', isHighlighted: false, price: 'R$ 47', features: [{ text: 'Acesso por 30 dias', included: true }, { text: 'Suporte básico', included: true }, { text: 'Bônus exclusivos', included: false }] },
            { name: 'Premium', isHighlighted: true, price: 'R$ 97', features: [{ text: 'Acesso vitalício', included: true }, { text: 'Suporte prioritário', included: true }, { text: 'Bônus exclusivos', included: true }] },
          ],
        },
      } as ComparisonBlock;

    case 'steps':
      return {
        ...baseBlock,
        type: 'steps',
        content: {
          title: 'Como Funciona',
          subtitle: 'Simples e rápido',
          style: 'numbered',
          steps: [
            { number: 1, title: 'Faça sua inscrição', description: 'Clique no botão e preencha seus dados' },
            { number: 2, title: 'Acesse o conteúdo', description: 'Receba seu acesso imediato por email' },
            { number: 3, title: 'Transforme sua vida', description: 'Aplique o conhecimento e veja resultados' },
          ],
        },
      } as StepsBlock;

    // v3.0 - Funnel blocks
    case 'lead-form':
      return {
        ...baseBlock,
        type: 'lead-form',
        content: {
          title: 'Receba conteúdo exclusivo',
          subtitle: 'Inscreva-se gratuitamente',
          fields: ['name', 'email'],
          integration: 'webhook',
          buttonText: 'QUERO RECEBER',
          buttonStyle: 'glow',
          successMessage: 'Obrigado! Verifique seu e-mail.',
          showPrivacyNote: true,
        },
      } as LeadFormBlock;

    case 'checkout':
      return {
        ...baseBlock,
        type: 'checkout',
        content: {
          provider: 'stripe',
          showBump: false,
          style: 'embedded',
        },
      } as CheckoutBlock;

    case 'order-bump':
      return {
        ...baseBlock,
        type: 'order-bump',
        content: {
          title: 'Oferta Especial!',
          description: 'Adicione este produto complementar por um preço exclusivo.',
          price: 27,
          originalPrice: 47,
          productId: '',
          checkboxText: 'SIM! Eu quero adicionar por apenas R$ 27',
          isCheckedByDefault: false,
          style: 'highlighted',
        },
      } as OrderBumpBlock;

    case 'upsell':
      return {
        ...baseBlock,
        type: 'upsell',
        content: {
          title: 'Espere! Oferta Exclusiva',
          description: 'Aproveite esta oportunidade única para turbinar seus resultados.',
          price: 97,
          originalPrice: 197,
          productId: '',
          oneClick: true,
          acceptButtonText: 'SIM! Eu quero esta oferta',
          declineButtonText: 'Não, obrigado. Continuar sem esta oferta.',
          countdownSeconds: 300,
          style: 'fullpage',
        },
      } as UpsellBlock;

    case 'pixel':
      return {
        ...baseBlock,
        type: 'pixel',
        content: {
          events: ['pageview'],
          customEvents: [],
        },
      } as PixelBlock;

    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}

export function getDefaultLayout(productName: string = '', productDescription: string = ''): Block[] {
  const hero3d = createBlock('hero-3d', 0) as Hero3DBlock;
  hero3d.content.headline.text = productName || 'Seu Título Principal Aqui';
  hero3d.content.subheadline.text = productDescription || 'Uma descrição persuasiva do seu produto';
  
  return [
    hero3d,
    createBlock('video', 1),
    createBlock('columns', 2),
    createBlock('benefits', 3),
    createBlock('features', 4),
    createBlock('pricing', 5),
    createBlock('testimonials', 6),
    createBlock('guarantee', 7),
    createBlock('faq', 8),
    createBlock('cta', 9),
  ];
}

// ============= TEMPLATES PRONTOS =============

export interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'curso' | 'ebook' | 'servico' | 'software' | 'funil';
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { id: 'video-course', name: 'Curso em Vídeo', description: 'Layout ideal para videoaulas com módulos', icon: 'Play', category: 'curso' },
  { id: 'ebook-digital', name: 'E-book / PDF', description: 'Perfeito para produtos digitais como e-books', icon: 'Book', category: 'ebook' },
  { id: 'sales-funnel', name: 'Funil de Vendas', description: 'Página com urgência e escassez para alta conversão', icon: 'TrendingUp', category: 'funil' },
  { id: 'membership', name: 'Área de Membros', description: 'Planos de assinatura e acesso recorrente', icon: 'Users', category: 'curso' },
  { id: 'coaching', name: 'Mentoria / Coaching', description: 'Serviços de consultoria personalizada', icon: 'Target', category: 'servico' },
  { id: 'software-saas', name: 'Software / SaaS', description: 'Apresentação de ferramenta ou aplicativo', icon: 'Laptop', category: 'software' },
  { id: 'workshop', name: 'Workshop / Evento', description: 'Página de inscrição para eventos ao vivo', icon: 'Calendar', category: 'servico' },
  { id: 'minimal', name: 'Minimalista', description: 'Design limpo e direto ao ponto', icon: 'Minus', category: 'ebook' },
];

export function getTemplateBlocks(templateId: string, productName: string = '', productDescription: string = ''): Block[] {
  const hero3d = createBlock('hero-3d', 0) as Hero3DBlock;
  hero3d.content.headline.text = productName || 'Seu Título Principal Aqui';
  hero3d.content.subheadline.text = productDescription || 'Uma descrição persuasiva do seu produto';

  switch (templateId) {
    case 'video-course':
      return [
        hero3d,
        createBlock('video', 1),
        { ...createBlock('columns', 2), content: { 
          layout: '60-40',
          gap: 'medium',
          verticalAlign: 'center',
          reverseOnMobile: false,
          padding: 'medium',
          columns: [
            { id: crypto.randomUUID(), type: 'text', content: { text: 'Aprenda de forma prática com aulas em vídeo de alta qualidade. Acesse de qualquer dispositivo, no seu ritmo.' } },
            { id: crypto.randomUUID(), type: 'image', content: { url: '', alt: 'Preview do curso' } },
          ],
        }} as ColumnsBlock,
        { ...createBlock('features', 3), content: { title: 'O que você vai aprender', items: ['Módulo 1: Fundamentos', 'Módulo 2: Estratégias Avançadas', 'Módulo 3: Casos Práticos', 'Bônus: Templates Exclusivos'], icon: 'Play' }} as FeaturesBlock,
        { ...createBlock('benefits', 4), content: { title: 'Por que este curso?', subtitle: 'Transforme sua carreira', items: [{ icon: 'Clock', title: 'Acesso Vitalício', description: 'Estude no seu ritmo' }, { icon: 'Award', title: 'Certificado', description: 'Ao concluir o curso' }, { icon: 'Users', title: 'Comunidade', description: 'Grupo exclusivo de alunos' }], columns: 3 }} as BenefitsBlock,
        createBlock('testimonials', 5),
        createBlock('pricing', 6),
        createBlock('guarantee', 7),
        createBlock('faq', 8),
        createBlock('cta', 9),
      ];

    case 'ebook-digital':
      return [
        hero3d,
        { ...createBlock('columns', 1), content: { 
          layout: '40-60',
          gap: 'large',
          verticalAlign: 'center',
          reverseOnMobile: true,
          padding: 'large',
          columns: [
            { id: crypto.randomUUID(), type: 'image', content: { url: '', alt: 'Capa do E-book' } },
            { id: crypto.randomUUID(), type: 'text', content: { text: '📚 Mais de 100 páginas de conteúdo exclusivo\n\n✅ Estratégias testadas e comprovadas\n\n🎯 Passo a passo prático\n\n💡 Exemplos reais e cases de sucesso' } },
          ],
        }} as ColumnsBlock,
        { ...createBlock('features', 2), content: { title: 'O que você vai encontrar neste e-book', items: ['Capítulo 1: Introdução Completa', 'Capítulo 2: Fundamentos Essenciais', 'Capítulo 3: Técnicas Avançadas', 'Capítulo 4: Casos de Estudo', 'Bônus: Checklist e Templates'], icon: 'Book' }} as FeaturesBlock,
        createBlock('benefits', 3),
        createBlock('pricing', 4),
        createBlock('testimonials', 5),
        createBlock('guarantee', 6),
        createBlock('cta', 7),
      ];

    case 'sales-funnel':
      hero3d.content.showCTA = true;
      hero3d.content.ctaStyle = 'glow';
      return [
        hero3d,
        createBlock('countdown', 1),
        createBlock('video', 2),
        { ...createBlock('benefits', 3), content: { title: '🔥 O que você vai conquistar', subtitle: 'Resultados garantidos', items: [{ icon: 'Zap', title: 'Resultado Rápido', description: 'Veja mudanças em 7 dias' }, { icon: 'Target', title: 'Método Comprovado', description: 'Mais de 10.000 alunos' }, { icon: 'Shield', title: 'Garantia Total', description: '7 dias para testar' }], columns: 3 }} as BenefitsBlock,
        createBlock('features', 4),
        createBlock('comparison', 5),
        createBlock('testimonials', 6),
        createBlock('pricing', 7),
        { ...createBlock('steps', 8), content: { title: 'Como Funciona', subtitle: '3 passos simples', style: 'numbered', steps: [{ number: 1, title: 'Clique no Botão', description: 'Faça sua inscrição agora' }, { number: 2, title: 'Receba o Acesso', description: 'Imediato por email' }, { number: 3, title: 'Comece Hoje', description: 'Transforme sua vida' }] }} as StepsBlock,
        createBlock('guarantee', 9),
        createBlock('faq', 10),
        createBlock('cta', 11),
        createBlock('countdown', 12),
      ];

    case 'membership':
      return [
        hero3d,
        { ...createBlock('columns', 1), content: { 
          layout: '50-50',
          gap: 'medium',
          verticalAlign: 'center',
          reverseOnMobile: false,
          padding: 'medium',
          columns: [
            { id: crypto.randomUUID(), type: 'video', content: { url: '' } },
            { id: crypto.randomUUID(), type: 'text', content: { text: '🎯 Acesso a todo conteúdo exclusivo\n\n📺 Aulas novas toda semana\n\n👥 Comunidade de membros\n\n🎁 Bônus mensais' } },
          ],
        }} as ColumnsBlock,
        createBlock('benefits', 2),
        createBlock('comparison', 3),
        createBlock('testimonials', 4),
        createBlock('guarantee', 5),
        createBlock('faq', 6),
        createBlock('cta', 7),
      ];

    case 'coaching':
      return [
        hero3d,
        createBlock('video', 1),
        { ...createBlock('steps', 2), content: { title: 'Como a Mentoria Funciona', subtitle: 'Processo estruturado', style: 'timeline', steps: [{ number: 1, title: 'Diagnóstico Inicial', description: 'Análise completa da sua situação atual' }, { number: 2, title: 'Plano Personalizado', description: 'Estratégia sob medida para seus objetivos' }, { number: 3, title: 'Acompanhamento Semanal', description: 'Calls e suporte para garantir seu progresso' }, { number: 4, title: 'Resultados', description: 'Celebrar conquistas e ajustar o caminho' }] }} as StepsBlock,
        createBlock('benefits', 3),
        createBlock('testimonials', 4),
        createBlock('pricing', 5),
        createBlock('guarantee', 6),
        createBlock('faq', 7),
        createBlock('cta', 8),
      ];

    case 'software-saas':
      return [
        hero3d,
        { ...createBlock('columns', 1), content: { 
          layout: '50-50',
          gap: 'medium',
          verticalAlign: 'center',
          reverseOnMobile: false,
          padding: 'large',
          columns: [
            { id: crypto.randomUUID(), type: 'text', content: { text: '🚀 Interface intuitiva e fácil de usar\n\n⚡ Automatize tarefas repetitivas\n\n📊 Relatórios em tempo real\n\n🔒 Segurança de nível empresarial' } },
            { id: crypto.randomUUID(), type: 'image', content: { url: '', alt: 'Screenshot do software' } },
          ],
        }} as ColumnsBlock,
        createBlock('video', 2),
        { ...createBlock('features', 3), content: { title: 'Funcionalidades Principais', items: ['Dashboard completo', 'Integrações com APIs', 'Relatórios avançados', 'Suporte 24/7', 'Atualizações gratuitas'], icon: 'Settings' }} as FeaturesBlock,
        createBlock('comparison', 4),
        createBlock('testimonials', 5),
        createBlock('pricing', 6),
        createBlock('faq', 7),
        createBlock('cta', 8),
      ];

    case 'workshop':
      return [
        hero3d,
        createBlock('countdown', 1),
        createBlock('video', 2),
        { ...createBlock('benefits', 3), content: { title: 'O que você vai aprender', subtitle: 'Evento ao vivo exclusivo', items: [{ icon: 'Calendar', title: 'Data Exclusiva', description: 'Evento único e limitado' }, { icon: 'Users', title: 'Interação ao Vivo', description: 'Tire dúvidas em tempo real' }, { icon: 'Gift', title: 'Material Bônus', description: 'Gravação + slides' }], columns: 3 }} as BenefitsBlock,
        createBlock('steps', 4),
        createBlock('testimonials', 5),
        createBlock('pricing', 6),
        createBlock('guarantee', 7),
        createBlock('cta', 8),
      ];

    case 'minimal':
      return [
        hero3d,
        { ...createBlock('columns', 1), content: { 
          layout: '50-50',
          gap: 'large',
          verticalAlign: 'center',
          reverseOnMobile: false,
          padding: 'large',
          columns: [
            { id: crypto.randomUUID(), type: 'text', content: { text: 'Uma solução simples e direta para seu problema. Sem complicação, sem enrolação.' } },
            { id: crypto.randomUUID(), type: 'image', content: { url: '', alt: 'Imagem do produto' } },
          ],
        }} as ColumnsBlock,
        createBlock('features', 2),
        createBlock('pricing', 3),
        createBlock('guarantee', 4),
        createBlock('cta', 5),
      ];

    default:
      return getDefaultLayout(productName, productDescription);
  }
}
