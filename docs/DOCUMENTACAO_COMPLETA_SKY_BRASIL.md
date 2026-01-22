# 📘 DOCUMENTAÇÃO COMPLETA - SKY BRASIL

**Versão:** 4.0.0  
**Última Atualização:** 04 Janeiro 2026  
**Plataforma:** skystreamer.online  
**Ref. Supabase:** wwxtqujohqsrcgqopthz

> 📝 **Nota:** Para documentação específica do Editor de Páginas de Vendas, consulte [EDITOR_PAGINAS_VENDAS.md](./EDITOR_PAGINAS_VENDAS.md)

---

## CHANGELOG v4.0.0 (SaaS Híbrida Completa)

### 🆕 Novidades Principais
- **Sistema de Comunidade Real**: Posts, respostas e likes com dados reais do banco (tabelas `community_posts`, `community_replies`, `community_likes`)
- **Sistema de Streak de Estudos**: Acompanhamento de dias consecutivos e horas estudadas (`study_streaks`, `useStudyStreak`)
- **Saúde do Sistema em Tempo Real**: Monitoramento de serviços com status automático (`system_health_status`, `useSystemHealth`)
- **Publicação Automatizada Real**: Agendamento de posts sociais com banco de dados (`scheduled_posts`, `useScheduledPosts`)
- **Sincronização LinkedIn via Firecrawl**: Importação de perfil público sem OAuth (`useLinkedInSync`)
- **AI Insights para Estudantes**: Análise inteligente de desempenho com plano de estudos (`useAIInsights`)
- **Atividade do Usuário Real**: Dashboard VIP com dados reais de visualizações e ações (`useUserActivity`)

### 🔧 Correções e Melhorias
- **VIPDashboard**: Gráfico de atividade semanal agora usa dados reais
- **VIPProfile/Edit**: Sincronização completa com LinkedIn
- **VIPRanking**: Ranking de afiliados com dados reais do banco
- **VIPAffiliatePanel**: Estatísticas reais de views e vendas semanais
- **AdminOverview**: Status de serviços em tempo real + botão sincronizar
- **AutoPublishing**: Publicações agendadas com persistência
- **Community**: Posts e interações 100% funcionais
- **StudentPerformanceReport**: Insights gerados por IA com recomendações personalizadas

### 📦 Novos Arquivos e Hooks
- `src/hooks/useStudyStreak.ts` - Streak de estudos
- `src/hooks/useCommunity.ts` - Sistema de comunidade
- `src/hooks/useScheduledPosts.ts` - Posts agendados
- `src/hooks/useSystemHealth.ts` - Saúde do sistema
- `src/hooks/useLinkedInSync.ts` - Sincronização LinkedIn
- `src/hooks/useUserActivity.ts` - Atividade do usuário
- `src/hooks/useAIInsights.ts` - Insights com IA

### 🗄️ Novas Tabelas do Banco
- `community_posts` - Posts da comunidade
- `community_replies` - Respostas aos posts
- `community_likes` - Likes em posts/respostas
- `scheduled_posts` - Posts sociais agendados
- `study_streaks` - Streaks de estudo por usuário
- `system_health_status` - Status dos serviços

---

## CHANGELOG v3.5.0

### 🆕 Novidades
- **Auto-Save ao Avançar Etapas**: Ao clicar em "Avançar" ou "Voltar" no wizard de produtos, o sistema salva automaticamente as alterações
- **Grátis para Afiliados VIP**: Nova opção que permite oferecer acesso gratuito a afiliados VIP sem alterar o preço do produto para clientes normais
- **Persistência de Edição**: O wizard não fecha mais automaticamente após salvar - apenas manualmente

### 🔧 Correções
- Corrigido bug que exigia reedição de todas as etapas para alterar qualquer informação
- Melhorada lógica de `affiliate_free` - agora o preço permanece visível para clientes normais
- Auto-save silencioso (sem toasts) durante navegação entre etapas
- Criação automática de produto ao avançar da primeira etapa

### 📦 Arquivos Modificados
- `src/pages/admin/components/products/ProductCreationWizard.tsx` - Auto-save + affiliate_free UI
- `src/pages/admin/components/products/AffiliateSettingsPanel.tsx` - Opção grátis para afiliados
- `src/lib/products.ts` - Lógica atualizada para formatação de preços com affiliate_free

---

## 📑 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Site Público](#3-site-público)
4. [Sistema de Autenticação](#4-sistema-de-autenticação)
5. [Painel Administrativo](#5-painel-administrativo)
6. [Área VIP (Afiliados)](#6-área-vip-afiliados)
7. [Sistema de Afiliados](#7-sistema-de-afiliados)
8. [Sistema de Pagamentos](#8-sistema-de-pagamentos)
9. [Sistema de Assinaturas](#9-sistema-de-assinaturas)
10. [Sistema de Chat com IA](#10-sistema-de-chat-com-ia)
11. [Sistema de E-mail](#11-sistema-de-e-mail)
12. [Integrações de Redes Sociais](#12-integrações-de-redes-sociais)
13. [Sistema de Gamificação](#13-sistema-de-gamificação)
14. [Produtos Digitais e Infoprodutos](#14-produtos-digitais-e-infoprodutos)
15. [Editor de Página de Vendas](#15-editor-de-página-de-vendas)
16. [Gerenciador de Módulos e Aulas](#16-gerenciador-de-módulos-e-aulas)
17. [Painel de Configuração de Afiliados](#17-painel-de-configuração-de-afiliados)
18. [Automações](#18-automações)
19. [Segurança e Compliance](#19-segurança-e-compliance)
20. [Edge Functions](#20-edge-functions)
21. [Banco de Dados](#21-banco-de-dados)
22. [Sistema de Notificações](#22-sistema-de-notificações)
23. [Onboarding Wizard](#23-onboarding-wizard)
24. [Analytics e Métricas](#24-analytics-e-métricas)
25. [SaaS Multi-Tenancy](#25-saas-multi-tenancy)
26. [Stripe Connect (Marketplace)](#26-stripe-connect-marketplace)

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Descrição
SKY BRASIL é uma plataforma completa de infoprodutos e agência de streaming que inclui:
- **SKY BRASIL AGENCY**: Site institucional para streamers e empresas
- **SKY PLATFORM**: Área de membros para cursos e produtos digitais
- **Sistema de Afiliados VIP**: Programa de afiliados com gamificação e comissões configuráveis
- **Loja Digital**: Venda de cursos, e-books e serviços com checkout integrado
- **Marketplace**: Stripe Connect para vendedores independentes

### 1.2 Público-Alvo
- Streamers iniciantes e profissionais
- Empresas que buscam parcerias com influenciadores
- Afiliados que desejam promover produtos digitais
- Produtores de infoprodutos
- Criadores de conteúdo em geral

### 1.3 URLs Principais
- **Site Público**: https://skystreamer.online
- **Área VIP**: https://skystreamer.online/vip/dashboard
- **Painel Admin**: https://skystreamer.online/admin
- **Loja**: https://skystreamer.online/vendas
- **Academy**: https://skystreamer.online/academy
- **Checkout**: https://skystreamer.online/checkout

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React + TypeScript + Vite | React 18.3 |
| Estilização | Tailwind CSS + Shadcn/UI | Tailwind 4.x |
| 3D/WebGL | Three.js + @react-three/fiber | Three 0.160 |
| Animações | Framer Motion | 12.x |
| Backend | Supabase (Lovable Cloud) | - |
| Edge Functions | Deno (Supabase Functions) | - |
| Pagamentos | Stripe (Live + Connect) | API 2024-12 |
| E-mail | Resend API | - |
| IA | Lovable AI (Google Gemini) | - |
| Hospedagem | Lovable + Vercel (proxy) | - |
| Validação | Zod | 3.25 |
| State | TanStack React Query | 5.x |

### 2.2 Estrutura de Pastas Completa

```
src/
├── api/                        # Serviços de API
│   ├── services/              # Serviços específicos
│   │   ├── contact.service.ts
│   │   └── payment.service.ts
│   └── types/                 # Tipos de API
│       ├── contact.types.ts
│       └── payment.types.ts
├── assets/                     # Imagens e recursos estáticos
├── auth/                       # Sistema de autenticação
│   ├── context/               # AuthContext
│   ├── guards/                # ProtectedRoute
│   ├── hooks/                 # useAuth
│   └── types/                 # Tipos de auth
├── components/                 # Componentes reutilizáveis
│   ├── 3d/                    # Cenas 3D WebGL
│   │   ├── HeroScene.tsx
│   │   ├── FloatingDiamond.tsx
│   │   ├── ParticleField.tsx
│   │   └── ...
│   ├── chat/                  # Componentes do chat
│   │   ├── ChatMessage.tsx
│   │   ├── PreChatForm.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── RatingModal.tsx
│   ├── landing/               # Componentes da landing
│   │   ├── FAQ.tsx
│   │   ├── Partners.tsx
│   │   └── Testimonials.tsx
│   └── ui/                    # Componentes Shadcn
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (40+ componentes)
├── config/                     # Configurações
│   ├── api.ts
│   ├── constants.ts
│   └── payment.ts
├── contexts/                   # Contextos React
│   └── CartContext.tsx
├── hooks/                      # Hooks customizados
│   ├── api/                   # Hooks de API
│   ├── ui/                    # Hooks de UI
│   ├── useAnalytics.ts
│   ├── useNotifications.ts
│   ├── useStripeCheckout.ts
│   ├── useSubscription.ts
│   └── ...
├── integrations/               # Integrações
│   └── supabase/
│       ├── client.ts          # Cliente Supabase (auto-gerado)
│       └── types.ts           # Tipos (auto-gerado)
├── lib/                        # Utilitários
│   ├── stripe.ts
│   ├── utils.ts
│   ├── validation.ts
│   └── validators/            # Schemas Zod
│       ├── checkout.schema.ts
│       ├── contact.schema.ts
│       └── payment.schema.ts
├── pages/                      # Páginas da aplicação
│   ├── admin/                 # Painel administrativo
│   │   ├── AdminDashboard.tsx
│   │   ├── index.tsx
│   │   └── components/        # Componentes do admin
│   │       ├── products/      # 🆕 Gestão de produtos
│   │       │   ├── ProductCreationWizard.tsx
│   │       │   ├── CourseModulesManager.tsx
│   │       │   ├── SalesPageEditor.tsx
│   │       │   └── AffiliateSettingsPanel.tsx
│   │       ├── ai/            # Componentes de IA
│   │       ├── campaigns/     # Componentes de campanhas
│   │       └── ...
│   ├── connect/               # Stripe Connect
│   │   ├── ConnectOnboarding.tsx
│   │   ├── ConnectProducts.tsx
│   │   └── Storefront.tsx
│   └── vip/                   # Área VIP afiliados
│       ├── VIPDashboard.tsx
│       ├── VIPLayout.tsx
│       └── ...
└── types/                      # Tipos TypeScript globais
    ├── api.types.ts
    ├── global.d.ts
    └── index.ts

supabase/
├── config.toml                # Configuração do Supabase
├── functions/                 # Edge Functions
│   ├── _shared/              # Utilitários compartilhados
│   │   ├── cors.ts
│   │   ├── email-templates.ts
│   │   ├── rate-limit.ts
│   │   ├── response.ts
│   │   └── validation.ts
│   ├── stripe-checkout/       # Checkout Stripe
│   ├── stripe-webhook/        # Webhook Stripe
│   ├── create-subscription-checkout/  # 🆕 Checkout de assinatura
│   ├── check-subscription/    # 🆕 Verificação de assinatura
│   ├── customer-portal/       # 🆕 Portal do cliente
│   ├── chat-assistant/        # IA do chat
│   └── ... (30+ functions)
└── migrations/                # Migrações do banco

docs/                          # Documentação
├── DOCUMENTACAO_COMPLETA_SKY_BRASIL.md
├── IA_EVOLUTIVA_SPEC.md
├── LGPD_COMPLIANCE.md
├── PITCH_COMERCIAL_B2B.md
└── ROADMAP_SAAS_2025.md
```

### 2.3 Variáveis de Ambiente

```env
# Supabase (auto-configurado pelo Lovable Cloud)
VITE_SUPABASE_URL              # URL do Supabase
VITE_SUPABASE_PUBLISHABLE_KEY  # Chave pública Supabase
VITE_SUPABASE_PROJECT_ID       # ID do projeto
```

### 2.4 Secrets do Supabase (Edge Functions)

| Secret | Descrição | Onde Usar |
|--------|-----------|-----------|
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | Todas funções de pagamento |
| `STRIPE_PUBLISHABLE_KEY` | Chave pública Stripe | Frontend via config |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | stripe-webhook |
| `RESEND_API_KEY` | API Key do Resend | Funções de email |
| `LOVABLE_API_KEY` | API Key Lovable AI | chat-assistant, admin-ai |
| `ADMIN_EMAIL` | Email do administrador | Notificações |
| `META_SYSTEM_USER_TOKEN` | Token Meta API | Publicação social |
| `FACEBOOK_PAGE_ID` | ID da página Facebook | publish-social |
| `INSTAGRAM_ACCOUNT_ID` | ID conta Instagram | publish-social |
| `WHATSAPP_ACCESS_TOKEN` | Token WhatsApp Business | send-whatsapp |
| `WHATSAPP_PHONE_NUMBER_ID` | ID telefone WhatsApp | send-whatsapp |
| `ELEVENLABS_API_KEY` | API ElevenLabs TTS | elevenlabs-tts |
| `BREVO_API_KEY` | API Brevo (Sendinblue) | Email alternativo |

---

## 3. SITE PÚBLICO

### 3.1 Páginas Disponíveis

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | Home.tsx | Página inicial com hero 3D interativo |
| `/sobre` | About.tsx | Sobre a SKY BRASIL |
| `/streamers` | ForStreamers.tsx | Página para streamers |
| `/empresas` | ForBrands.tsx | Página para empresas |
| `/como-funciona` | HowItWorks.tsx | Como funciona a plataforma |
| `/blog` | Blog.tsx | Blog com artigos |
| `/blog/:slug` | BlogPost.tsx | Artigo individual |
| `/contato` | Contact.tsx | Formulário de contato |
| `/vendas` | Sales.tsx | Loja pública |
| `/loja` | Shop.tsx | Shop alternativo |
| `/academy` | Academy.tsx | Cursos digitais |
| `/checkout` | Checkout.tsx | Checkout interno |
| `/afiliados` | Affiliates.tsx | Landing de afiliados |
| `/plataforma` | Platform.tsx | Documentação da plataforma |
| `/auth` | Auth.tsx | Login/Registro |
| `/venda/:slug` | ProductSalesPage.tsx | Página de venda de produto |
| `/payment-success` | PaymentSuccess.tsx | Sucesso no pagamento |
| `/payment-canceled` | PaymentCanceled.tsx | Pagamento cancelado |

### 3.2 Componentes Principais

#### Navbar (`src/components/Navbar.tsx`)
- Menu responsivo com hamburger mobile
- Links condicionais baseados em autenticação
- Botão de login/logout dinâmico
- **NotificationCenter** integrado para usuários autenticados
- CartSheet para carrinho de compras

#### Footer (`src/components/Footer.tsx`)
- Links para todas as seções
- Redes sociais
- Informações de contato

#### LiveChat (`src/components/LiveChat.tsx`)
- Widget de chat flutuante
- Integração com IA Lovable
- Suporte em tempo real
- Pre-chat form para coleta de dados

### 3.3 Design System

- **Tema**: Dark mode com acentos neon (pink, cyan, orange)
- **Glassmorphism**: backdrop-blur, translucent backgrounds
- **Tipografia Fluida**: clamp() para responsividade
- **Animações**: Framer Motion com spring physics
- **3D**: Cenas WebGL com Three.js
- **Componentes**: Shadcn/UI customizados

---

## 4. SISTEMA DE AUTENTICAÇÃO

### 4.1 Fluxo de Autenticação

```
┌─────────────────┐
│   Portal Select │
│  (Afiliado/Admin)│
└────────┬────────┘
         │
    ┌────▼────┐
    │  Login  │
    │ Signup  │
    └────┬────┘
         │
    ┌────▼────┐
    │ Supabase │
    │   Auth   │
    └────┬────┘
         │
    ┌────▼────┐
    │  Profile │
    │  Created │
    └────┬────┘
         │
    ┌────▼────┐
    │  Role   │
    │  Assign │
    └────┬────┘
         │
   ┌─────┴─────┐
   │           │
┌──▼──┐    ┌──▼──┐
│Admin│    │ VIP │
│Panel│    │Area │
└─────┘    └─────┘
```

### 4.2 Roles de Usuário

| Role | Permissões | Atribuição |
|------|------------|------------|
| `user` | Acesso básico, compras | Padrão para novos usuários |
| `editor` | Edição de conteúdo | Manual pelo admin |
| `moderator` | Moderação de chat | Manual pelo admin |
| `admin` | Acesso total ao painel | Via `admin_emails` |
| `owner` | Super admin | Manual no banco |

### 4.3 Arquivos Relacionados

- `src/auth/context/AuthContext.tsx` - Contexto de autenticação
- `src/auth/hooks/useAuth.ts` - Hook de autenticação
- `src/auth/guards/ProtectedRoute.tsx` - Proteção de rotas
- `src/hooks/useAdminRole.ts` - Verificação de role admin

### 4.4 Funcionalidades

- Login com email/senha
- Registro de novos usuários
- Reset de senha via email
- Sessão persistente
- **Auto-confirm de email habilitado**
- Criação automática de perfil via trigger

### 4.5 Trigger de Novo Usuário

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Cria perfil
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(...));
  
  -- Atribui role baseado em admin_emails
  IF public.is_admin_email(NEW.email) THEN
    _role := 'admin';
  ELSE
    _role := 'user';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;
```

---

## 5. PAINEL ADMINISTRATIVO

### 5.1 Acesso
- **Rota**: `/admin`
- **Requisito**: Role `admin` no banco
- **Redirecionamento**: Portal de seleção em `/auth`

### 5.2 Abas Disponíveis

| Tab | Componente | Funcionalidade |
|-----|------------|----------------|
| overview | AdminOverview | KPIs e métricas gerais |
| contacts | ContactMessages | Mensagens de contato |
| database | DatabaseManager | Gestão de dados |
| chat | ChatManager | Conversas do chat |
| products | ProductCatalogManager | 🆕 Catálogo completo de produtos |
| affiliates | VIPAffiliatesManager | Gestão de afiliados |
| programs | AffiliateProgramManager | Programas de afiliação |
| commissions | CommissionTracking | Comissões |
| payouts | PayoutsManager | Saques |
| rewards | RewardsManager | Recompensas |
| gamification | GamificationManager | Gamificação |
| esp | ESPManager | Configuração de email |
| templates | EmailTemplateLibrary | Templates de email |
| campaigns | CampaignManagerNew | Campanhas |
| social | SocialConnections | Conexões sociais |
| publishing | SocialPublishing | Publicação social |
| auto-publish | AutoPublishing | Auto-publicação |
| automation | AutomationManager | Regras de automação |
| ai | AIAssistantControl | Controle da IA |
| ai-modes | AIModeManager | Modos da IA |
| audit | AuditLogs | Logs de auditoria |
| system | SystemStatus | Status do sistema |
| stripe-health | StripeHealthDashboard | Saúde do Stripe |
| invite | AdminInvite | Convites de admin |
| settings | AccountSettings | Configurações |

### 5.3 ProductCreationWizard (🆕 v3.3.0 - Enhanced)

**Arquivo:** `src/pages/admin/components/products/ProductCreationWizard.tsx`

Wizard de criação de produtos com 6 etapas e funcionalidades avançadas:

#### Funcionalidades Principais

| Feature | Descrição |
|---------|-----------|
| **Auto-Save** | Salva automaticamente a cada 30 segundos com indicador visual |
| **Realtime Sync** | Atualizações em tempo real via Supabase Realtime |
| **Preview ao Vivo** | Iframe responsivo embutido para visualizar a página de vendas |
| **Edição Persistente** | Wizard não fecha ao salvar - apenas manualmente |
| **Retry Logic** | Queries com retry automático para conexões instáveis |

#### Hook: useRealtimeProduct

**Arquivo:** `src/hooks/useRealtimeProduct.ts`

```typescript
import { useRealtimeProduct } from '@/hooks/useRealtimeProduct';

const { forceRefresh } = useRealtimeProduct({
  productId: 'uuid',
  enabled: true,
  showNotifications: true,
  onProductChange: (payload) => console.log('Product updated'),
  onModuleChange: (payload) => console.log('Module updated'),
  onLessonChange: (payload) => console.log('Lesson updated'),
});
```

#### Etapas do Wizard

1. **Informações Básicas**
   - Nome, slug, descrição
   - Tipo de produto (curso, ebook, mentoria, evento, arquivos, combo)
   - Categoria e idioma
   - Imagem de capa com upload

2. **Preços e Ofertas**
   - Preço único, assinatura ou gratuito
   - Preço original (riscado) para oferta
   - Parcelamento configurável (até 12x)
   - Dias de garantia

3. **Conteúdo** (específico por tipo)
   - **Curso:** Gerenciador de módulos e aulas com drag-and-drop
   - **Ebook:** Upload de arquivos PDF/EPUB, preview e capítulos
   - **Mentoria:** Sessões, duração e calendário
   - **Evento:** Data, plataforma e link
   - **Arquivos:** Downloads e licenças
   - **Combo:** Seleção de produtos inclusos

4. **Página de Vendas**
   - Editor visual com modo clássico e avançado
   - Headline, benefícios e features
   - Depoimentos e FAQ
   - CTA e elementos de urgência

5. **Afiliados**
   - Habilitar/desabilitar afiliação
   - Taxa de comissão personalizável
   - Tiers de comissão por volume
   - Materiais de marketing

6. **Publicar**
   - Revisão final de todas as configurações
   - Preview ao vivo integrado
   - Publicar ou salvar como rascunho

---

## 6. ÁREA VIP (AFILIADOS)

### 6.1 Acesso
- **Rota**: `/vip/dashboard`
- **Requisito**: Usuário autenticado com perfil de afiliado
- **Layout**: VIPLayout com sidebar

### 6.2 Páginas Disponíveis

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/vip/dashboard` | VIPDashboard | Dashboard principal |
| `/vip/shop` | VIPShop | Loja VIP |
| `/vip/rewards` | VIPRewards | Resgate de recompensas |
| `/vip/history` | VIPHistory | Histórico de transações |
| `/vip/referrals` | VIPReferrals | Indicações |
| `/vip/profile` | VIPProfile | Perfil do afiliado |
| `/vip/performance` | VIPPerformance | Métricas de performance |
| `/vip/invites` | VIPInvites | Convites |
| `/vip/affiliate-products` | VIPAffiliateProducts | Produtos para promover |
| `/vip/my-products` | VIPMyProducts | Produtos comprados (área de membros) |
| `/vip/materials` | VIPMaterials | Materiais de marketing |
| `/vip/checkout` | VIPCheckout | Checkout VIP |
| `/vip/cart` | VIPCart | Carrinho VIP |
| `/vip/affiliate-payment` | VIPAffiliatePayment | Pagamento de afiliação |
| `/vip/affiliate-register` | VIPAffiliateRegister | Registro de afiliado |

### 6.3 Dashboard VIP

**Métricas Exibidas:**
- Pontos disponíveis
- Total ganho (lifetime)
- Indicações ativas
- Saldo disponível para saque
- Tier atual (Bronze → Platinum)
- Progresso para próximo tier

**Funcionalidades:**
- Link de afiliado personalizado (`?ref=SKY-XXXXXX`)
- Compartilhamento em redes sociais
- Histórico de comissões
- Resgate de recompensas

---

## 7. SISTEMA DE AFILIADOS

### 7.1 Modelo de Comissão por Tier

| Tier | Comissão Base | Pontos Necessários | Cor |
|------|---------------|--------------------|-----|
| Bronze | 10% | 0 | 🥉 |
| Silver | 15% | 500 | 🥈 |
| Gold | 20% | 2.000 | 🥇 |
| Diamond | 25% | 5.000 | 💎 |
| Platinum | 30% | 10.000 | 👑 |

**Bônus por Volume:** +5% após 10 indicações/mês

### 7.2 Sistema de Pontos
- **Acúmulo**: 1 ponto por R$1 comissionado
- **Cálculo de Tier**: Automático via função `calculate_user_tier()`
- **Resgate**: Pontos podem ser trocados por recompensas

### 7.3 Fluxo de Afiliação

```
┌──────────────┐
│  Cadastro    │
│  Gratuito    │
└──────┬───────┘
       │
┌──────▼───────┐
│ Auto-Aprovação│
│   (Bronze)   │
└──────┬───────┘
       │
┌──────▼───────┐
│  Gera Link   │
│ Personalizado│
└──────┬───────┘
       │
┌──────▼───────┐
│ Compartilha  │
│   Produtos   │
└──────┬───────┘
       │
┌──────▼───────┐
│   Cliente    │
│   Clica      │
└──────┬───────┘
       │
┌──────▼───────┐
│   Venda      │
│  Convertida  │
└──────┬───────┘
       │
┌──────▼───────┐
│  Comissão    │
│  Creditada   │
└──────────────┘
```

### 7.4 Materiais de Marketing

Gerenciados via `AffiliateSettingsPanel`:
- Banners em diversos tamanhos
- Templates de posts prontos
- Guia de equipamentos
- Dicas de promoção
- Links de afiliado personalizados

### 7.5 Sistema de Referral

- Afiliado compartilha link: `?ref=SKY-XXXXXX`
- Cliente clicou → registrado em `localStorage`
- Cliente cadastra → recebe 10 pontos de bônus
- Cliente compra → afiliado recebe pontos + comissão

---

## 8. SISTEMA DE PAGAMENTOS

### 8.1 Gateway Principal: Stripe

**Configuração:**
- **Modo**: Live (Produção)
- **Secret Key**: `sk_live_...` (Secret do Supabase)
- **Publishable Key**: `pk_live_...` (Frontend)
- **Webhook Secret**: `whsec_...` (Secret do Supabase)

### 8.2 Métodos de Pagamento

| Método | Suporte |
|--------|---------|
| Cartão de Crédito | Até 12x |
| Cartão de Débito | À vista |
| PIX via Stripe | Instantâneo |
| Boleto (opcional) | 3 dias úteis |

### 8.3 Fluxo de Pagamento

```
┌─────────────┐
│  Checkout   │
│   Page      │
└──────┬──────┘
       │
┌──────▼──────┐
│ Stripe      │
│ Elements    │
└──────┬──────┘
       │
┌──────▼──────┐
│ Edge Func   │
│ create-*    │
└──────┬──────┘
       │
┌──────▼──────┐
│ Payment     │
│ Intent      │
└──────┬──────┘
       │
┌──────▼──────┐
│  Webhook    │
│ stripe-webhook│
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│Order│ │Comm.│
│Paid │ │Criada│
└─────┘ └─────┘
```

### 8.4 Edge Functions de Pagamento

| Função | Descrição | JWT |
|--------|-----------|-----|
| `create-payment-intent` | Cria intent de pagamento | Sim |
| `stripe-checkout` | Sessão de checkout | Não |
| `stripe-checkout-brl` | Checkout em BRL | Não |
| `stripe-checkout-enhanced` | Checkout avançado | Sim |
| `stripe-webhook` | Processa eventos Stripe | Não |
| `process-payment` | Processa pagamento genérico | Sim |
| `stripe-health-check` | Verifica saúde do Stripe | Sim |
| `stripe-invoice-preview` | Preview de fatura | Sim |

### 8.5 Webhook Events Tratados

```typescript
// stripe-webhook/index.ts
switch (event.type) {
  case 'checkout.session.completed':
    // Cria order, processa afiliado, envia email
  case 'payment_intent.succeeded':
    // Atualiza order para 'paid'
  case 'customer.subscription.created':
    // Cria/atualiza assinatura
  case 'customer.subscription.updated':
    // Atualiza status da assinatura
  case 'customer.subscription.deleted':
    // Cancela assinatura, envia email
  case 'invoice.paid':
    // Processa renovação de assinatura
}
```

---

## 9. SISTEMA DE ASSINATURAS (🆕 Novo)

### 9.1 Arquitetura

**Edge Functions:**
- `create-subscription-checkout` - Cria sessão de checkout para assinatura
- `check-subscription` - Verifica status da assinatura do usuário
- `customer-portal` - Portal de gestão do cliente Stripe

**Hook Frontend:**
- `src/hooks/useSubscription.ts`

**Componentes:**
- `src/components/SubscriptionPlans.tsx`
- `src/components/SubscriptionButtons.tsx`

### 9.2 Fluxo de Assinatura

```
┌────────────────┐
│ SubscriptionPlans │
│   Component      │
└───────┬──────────┘
        │
┌───────▼──────────┐
│ createCheckout() │
│  (useSubscription)│
└───────┬──────────┘
        │
┌───────▼──────────┐
│ create-subscription│
│    -checkout      │
│   (Edge Function) │
└───────┬──────────┘
        │
┌───────▼──────────┐
│ Stripe Checkout  │
│  Hosted Page     │
└───────┬──────────┘
        │
┌───────▼──────────┐
│ stripe-webhook   │
│ subscription.*   │
└───────┬──────────┘
        │
┌───────▼──────────┐
│ Profile Updated  │
│ (subscription_*) │
└──────────────────┘
```

### 9.3 Campos no Profile

```sql
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT;
ALTER TABLE profiles ADD COLUMN subscription_end TIMESTAMPTZ;
```

### 9.4 Tabela saas_plans

```sql
CREATE TABLE saas_plans (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL,
  price_yearly DECIMAL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]',
  max_users INT,
  max_affiliates INT,
  is_active BOOLEAN DEFAULT true
);
```

### 9.5 Customer Portal

Permite aos clientes:
- Ver/atualizar método de pagamento
- Cancelar assinatura
- Ver histórico de faturas
- Upgrade/downgrade de plano

---

## 10. SISTEMA DE CHAT COM IA

### 10.1 Arquitetura

```
┌─────────────┐
│  Visitante  │
└──────┬──────┘
       │
┌──────▼──────┐
│  LiveChat   │
│   Widget    │
└──────┬──────┘
       │
┌──────▼──────┐
│  PreChat    │
│    Form     │
└──────┬──────┘
       │
┌──────▼──────┐
│ chat-       │
│ assistant   │
│ (Edge Func) │
└──────┬──────┘
       │
┌──────▼──────┐
│ Lovable AI  │
│  (Gemini)   │
└──────┬──────┘
       │
┌──────▼──────┐
│  Resposta   │
│   do Chat   │
└─────────────┘
```

### 10.2 Modos de Operação

| Modo | Trigger Keywords | Confiança Mín. |
|------|-----------------|----------------|
| SUPPORT | erro, problema, ajuda | 70% |
| SALES | preço, plano, comprar | 75% |
| MARKETING | novidades, promoção | 65% |
| HANDOFF_HUMAN | humano, atendente | 50% |

### 10.3 Componentes do Chat

- `LiveChat.tsx` - Widget principal
- `PreChatForm.tsx` - Formulário inicial
- `ChatMessage.tsx` - Mensagens individuais
- `TypingIndicator.tsx` - Indicador de digitação
- `FileUpload.tsx` - Upload de arquivos
- `RatingModal.tsx` - Avaliação do atendimento
- `AIFeedback.tsx` - Feedback da resposta IA
- `ChatEndedPrompt.tsx` - Prompt de encerramento
- `ChatResumePrompt.tsx` - Retomar conversa

### 10.4 Funcionalidades

- Respostas automáticas via IA
- Escalação para humano
- Upload de arquivos (Storage: `chat-attachments`)
- Histórico de conversas
- Avaliação do atendimento
- Anti-duplicação de mensagens
- Resumo de conversas anteriores
- Indicador de digitação em tempo real

### 10.5 IA Evolutiva

**Fases de Evolução:**
1. **Support** (Atual) - FAQ e erros comuns
2. **Adaptive** - Aprende com feedback
3. **Conversion** - Detecta intenção de compra
4. **Strategic** - Campanhas personalizadas

**Tabelas de Aprendizado:**
- `ai_feedback` - Avaliações dos usuários
- `ai_learnings` - Padrões aprendidos
- `ai_mode_config` - Configuração de modos
- `ai_assistant_settings` - Configurações gerais

---

## 11. SISTEMA DE E-MAIL

### 11.1 Provider: Resend

**Configuração:**
- **API Key**: `RESEND_API_KEY` (Secret Supabase)
- **Domínio**: skystreamer.online
- **Remetente**: noreply@skystreamer.online

### 11.2 DNS Necessário

```
DKIM: resend._domainkey → [public key]
MX: send.skystreamer.online → feedback-smtp.sa-east-1.amazonses.com
SPF: send.skystreamer.online → v=spf1 include:amazonses.com ~all
```

### 11.3 Tipos de Email e Edge Functions

| Tipo | Edge Function | Trigger |
|------|--------------|---------|
| Contato | submit-contact | Formulário enviado |
| Reset de senha | send-password-reset | Solicitação de reset |
| Convite admin | send-admin-invite | Admin cria convite |
| Resposta admin | send-admin-reply | Admin responde mensagem |
| Confirmação pedido | send-order-confirmation | Pedido pago |
| Campanha | send-campaign-email | Admin dispara |
| Teste | send-test-email | Admin testa |
| Convite afiliado | send-affiliate-invite | Admin convida |
| Notificação comissão | notify-affiliate-commission | Venda convertida |
| Convite role | send-role-invite | Convite com role específico |

### 11.4 Templates de Email

Armazenados na tabela `email_templates`:
- HTML customizável com variáveis
- Preview no admin
- Versionamento
- Ativação/desativação

---

## 12. INTEGRAÇÕES DE REDES SOCIAIS

### 12.1 Meta (Facebook/Instagram)

**Tokens Necessários:**
- `META_SYSTEM_USER_TOKEN` - Token de sistema (não expira)
- `FACEBOOK_PAGE_ID` - ID da página Facebook
- `INSTAGRAM_ACCOUNT_ID` - ID da conta Instagram
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`

**Funcionalidades:**
- Publicação automática de posts
- Imagens e vídeos
- Agendamento de posts
- Conexão direta (sem OAuth)

### 12.2 WhatsApp Business

**Tokens Necessários:**
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ID`

**Funcionalidades:**
- Envio de mensagens
- Templates aprovados pela Meta
- Mensagens de texto, imagem, documento

**Restrição:** Mensagens iniciais requerem templates pré-aprovados

### 12.3 Edge Functions Sociais

| Função | Descrição |
|--------|-----------|
| `publish-social` | Publica em Facebook/Instagram |
| `send-whatsapp` | Envia mensagem WhatsApp |
| `social-oauth` | OAuth de plataformas |
| `process-scheduled-posts` | Processa posts agendados |
| `test-social-integrations` | Testa integrações |

### 12.4 Tabela social_connections

```sql
CREATE TABLE social_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  page_id TEXT,
  permissions JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. SISTEMA DE GAMIFICAÇÃO

### 13.1 Tiers

| Tier | Pontos | Cor | Benefícios |
|------|--------|-----|------------|
| Bronze | 0-499 | 🥉 | 10% comissão |
| Silver | 500-1999 | 🥈 | 15% comissão |
| Gold | 2000-4999 | 🥇 | 20% comissão |
| Diamond | 5000-9999 | 💎 | 25% comissão |
| Platinum | 10000+ | 👑 | 30% comissão |

### 13.2 Sistema de Pontos

**Ganho de Pontos:**
- 1 ponto por R$1 comissionado
- 5 pontos por indicação que converte
- Bônus por metas mensais

**Uso de Pontos:**
- Resgate de recompensas
- Upgrade de benefícios
- Acesso a conteúdos exclusivos

### 13.3 Função de Cálculo de Tier

```sql
CREATE FUNCTION calculate_user_tier(total_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF total_points >= 10000 THEN RETURN 'platinum';
  ELSIF total_points >= 5000 THEN RETURN 'diamond';
  ELSIF total_points >= 2000 THEN RETURN 'gold';
  ELSIF total_points >= 500 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 13.4 Recompensas

Tabela `rewards`:
- Tipo: cash, discount, product, service
- Pontos necessários
- Tier mínimo
- Estoque (opcional)

---

## 14. PRODUTOS DIGITAIS E INFOPRODUTOS

### 14.1 Tipos de Produto

| Tipo | Descrição | Entrega |
|------|-----------|---------|
| course | Curso online | Área de membros |
| ebook | E-book/PDF | Download URL |
| files | Arquivos/Software | Download URL |
| subscription | SaaS/Assinatura | URL de acesso |
| mentoring | Mentoria | Agendamento |
| live_event | Evento ao vivo | Link do evento |

### 14.2 Estrutura de Curso

```
Produto (course)
└── Módulos (product_modules)
    ├── position
    ├── name
    ├── description
    └── Lições (product_lessons)
        ├── position
        ├── name
        ├── content_type (video, text, download)
        ├── video_url
        ├── content_text
        ├── file_url
        ├── is_free_preview
        └── video_duration
```

### 14.3 Entrega de Conteúdo

**Cursos:**
- Área de membros em `/vip/my-products`
- Progresso por lição (lesson_progress)
- Certificado ao completar
- Preview de aulas gratuitas

**E-books/Software:**
- Link de download direto
- Contador de downloads

**SaaS:**
- Redirecionamento para URL externa
- Gestão de assinaturas

### 14.4 Preços e Parcelamento

- Preço único ou recorrente
- Parcelamento até 12x
- Cupons de desconto
- Preço original vs promocional
- Garantia configurável (dias)

---

## 15. EDITOR DE PÁGINA DE VENDAS (🆕 Atualizado v3.2.0)

**Arquivo:** `src/pages/admin/components/products/SalesPageEditor.tsx`

### 15.1 Estrutura do Editor

Editor visual profissional com **5 abas** e funcionalidades avançadas:

#### Aba 1: Headlines
- Headline principal (H1) com validação
- Sub-headline
- Headline de urgência
- URL de vídeo de vendas (opcional)
- Texto de garantia

#### Aba 2: Benefícios
- Lista de benefícios com **seletor visual de ícones**
- Título e descrição para cada benefício
- **Drag-and-drop** para reordenação via `@dnd-kit`
- Adicionar/remover benefícios com confirmação

#### Aba 3: Depoimentos
- Nome do cliente e cargo/função
- Avatar URL com preview
- Texto do depoimento com validação (mín. 10, máx. 1000 caracteres)
- **Rating visual com estrelas clicáveis** (1-5)
- **Drag-and-drop** para reordenação
- Confirmação de exclusão via AlertDialog

#### Aba 4: FAQ
- Pergunta (máx. 300 caracteres)
- Resposta (máx. 2000 caracteres)
- **Drag-and-drop** para reordenação
- Adicionar/remover com confirmação

#### Aba 5: CTA & Urgência
- Texto do botão CTA (validação obrigatória)
- Data/hora de urgência com timer
- Mensagem de escassez
- Quantidade restante em estoque
- Lista de features com **drag-and-drop**

### 15.2 Tecnologias Utilizadas

| Tecnologia | Uso |
|------------|-----|
| **React Hook Form** | Gerenciamento de formulário |
| **Zod** | Validação em tempo real |
| **@dnd-kit** | Drag-and-drop de itens |
| **TanStack Query** | Cache e sincronização |
| **Shadcn/UI** | Componentes UI |

### 15.3 Funcionalidades Avançadas

- ✅ **Validação em tempo real** com mensagens de erro visíveis
- ✅ **Indicador de alterações não salvas** com aviso ao sair
- ✅ **Tooltips** em todos os botões de ação
- ✅ **AlertDialog** para confirmação de exclusões
- ✅ **Seletor visual de ícones** (CheckCircle, Star, Shield, etc.)
- ✅ **Contagem de erros de validação** no footer
- ✅ **Botão de publicar/despublicar** página de vendas

### 15.4 Armazenamento

Os dados são salvos na tabela `products`:
- `sales_page_content` (JSONB) - Conteúdo completo da página
- `testimonials` (JSONB) - Array de depoimentos
- `faq` (JSONB) - Array de perguntas frequentes
- `sales_page_template` - Template selecionado
- `sales_page_published` - Status de publicação (boolean)

### 15.5 Schema Zod

```typescript
const salesPageSchema = z.object({
  headline: z.string().min(1, 'Headline obrigatória').max(200),
  subheadline: z.string().max(500).optional(),
  urgencyHeadline: z.string().max(200).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  benefits: z.array(z.object({
    id: z.string(),
    icon: z.string().min(1, 'Escolha um ícone'),
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  })),
  features: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(200),
  })),
  testimonials: z.array(z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    text: z.string().min(10).max(1000),
    avatar: z.string().url().optional(),
    role: z.string().max(100).optional(),
    rating: z.number().min(1).max(5).optional(),
  })),
  faq: z.array(z.object({
    id: z.string(),
    question: z.string().min(1).max(300),
    answer: z.string().min(1).max(2000),
  })),
  cta_text: z.string().min(1).max(50),
  guarantee_text: z.string().max(300).optional(),
  urgency_text: z.string().max(200).optional(),
  urgency_date: z.string().optional(),
  scarcity_message: z.string().max(200).optional(),
  stock_left: z.number().min(0).optional(),
});
  urgencyDate: string;
  scarcityMessage: string;
  stockLeft: number;
}

interface Testimonial {
  name: string;
  avatar: string;
  text: string;
  rating: number;
}

interface FAQ {
  question: string;
  answer: string;
}
```

---

## 16. GERENCIADOR DE MÓDULOS E AULAS (🆕 Atualizado v3.2.0)

**Arquivo:** `src/pages/admin/components/products/CourseModulesManager.tsx`

### 16.1 Visão Geral

Gerenciador completo de cursos com **drag-and-drop avançado** usando `@dnd-kit`, suporte a 3 tipos de conteúdo, e editor TipTap integrado para aulas de texto.

### 16.2 Funcionalidades de Módulos

| Funcionalidade | Descrição |
|----------------|-----------|
| **Criar** | Modal com nome, descrição e preview |
| **Editar** | Inline editing com salvamento |
| **Reordenar** | Drag-and-drop com `@dnd-kit` |
| **Expandir** | Accordion para visualizar aulas |
| **Excluir** | AlertDialog com confirmação |
| **Preview** | Toggle para módulo gratuito |

### 16.3 Funcionalidades de Aulas

| Funcionalidade | Descrição |
|----------------|-----------|
| **Criar** | Modal com tipo selecionável |
| **Editar** | Modal completo com todos os campos |
| **Reordenar** | Drag-and-drop dentro do módulo |
| **Preview** | Toggle para aula gratuita |
| **Excluir** | AlertDialog com confirmação |

### 16.4 Tipos de Aula

| Tipo | Ícone | Campos |
|------|-------|--------|
| **video** | 🎬 | URL do vídeo, duração (minutos) |
| **text** | 📝 | Editor TipTap com toolbar |
| **download** | 📥 | FileUploader, nome do arquivo |

### 16.5 Componentes Auxiliares

#### LessonTextEditor (`src/components/admin/LessonTextEditor.tsx`)
Editor TipTap com toolbar completa:
- **Formatação**: Bold, Italic, Strike
- **Títulos**: H2, H3
- **Listas**: Bullet list, Numbered list
- **Blocos**: Blockquote
- **Links**: Adicionar/remover links
- **Ações**: Undo/Redo

```typescript
interface LessonTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
```

#### SortableItem (`src/components/admin/SortableItem.tsx`)
Componente reutilizável para drag-and-drop:
```typescript
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  showHandle?: boolean;
  isDragging?: boolean;
}
```

### 16.6 Tecnologias Utilizadas

| Tecnologia | Uso |
|------------|-----|
| **@dnd-kit/core** | Core do drag-and-drop |
| **@dnd-kit/sortable** | Listas sortáveis |
| **@dnd-kit/modifiers** | Restrição de movimento |
| **@tiptap/react** | Editor rich text |
| **TanStack Query** | Cache e sincronização |

### 16.7 Estrutura de Dados

```typescript
interface Module {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  position: number;
  is_free_preview: boolean;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  content_type: 'video' | 'text' | 'download' | 'quiz';
  video_url: string | null;
  video_duration: number | null;
  content_text: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
  is_free_preview: boolean;
}
```

### 16.8 Funcionalidades Avançadas

- ✅ **Drag-and-drop de módulos** com indicador visual
- ✅ **Drag-and-drop de aulas** dentro de cada módulo
- ✅ **Editor TipTap** com toolbar para aulas de texto
- ✅ **FileUploader** integrado para downloads
- ✅ **VideoPreview** para pré-visualização de vídeos
- ✅ **Tooltips** em todos os botões de ação
- ✅ **AlertDialog** para confirmação de exclusões
- ✅ **Loading states** em todas as operações
- ✅ **Contagem de aulas** por módulo
- ✅ **Badge de tipo** em cada aula

### 16.9 Queries Utilizadas

```typescript
// Buscar módulos com aulas
const { data: modules } = useQuery({
  queryKey: ['product-modules', productId],
  queryFn: async () => {
    const { data } = await supabase
      .from('product_modules')
      .select('*, product_lessons(*)')
      .eq('product_id', productId)
      .order('position');
    return data;
  },
});

// Criar módulo
const createModule = useMutation({
  mutationFn: async (module) => {
    await supabase.from('product_modules').insert(module);
  },
  onSuccess: () => queryClient.invalidateQueries(['product-modules', productId]),
});

// Atualizar posições após drag-and-drop
const updatePositions = useMutation({
  mutationFn: async (items) => {
    await Promise.all(items.map((item, index) =>
      supabase
        .from('product_modules')
        .update({ position: index })
        .eq('id', item.id)
    ));
  },
});
```

---

## 17. PAINEL DE CONFIGURAÇÃO DE AFILIADOS (🆕 Novo)

**Arquivo:** `src/pages/admin/components/products/AffiliateSettingsPanel.tsx`

### 17.1 Configurações Disponíveis

#### Configurações Gerais
- Habilitar/desabilitar afiliação para o produto
- Taxa de comissão padrão (%)

#### Tiers de Comissão
Configuração de comissões diferenciadas por tier:
- Bronze: X%
- Silver: X%
- Gold: X%
- Diamond: X%
- Platinum: X%

#### Materiais de Marketing
- Tipo: banner, video, text, link
- Título
- Descrição/Conteúdo
- URL do arquivo
- Dimensões (para banners)
- Ativo/Inativo

### 17.2 Tabelas Utilizadas

```sql
-- Configuração no produto
products.affiliate_enabled BOOLEAN
products.affiliate_commission_rate DECIMAL

-- Materiais de marketing
CREATE TABLE affiliate_materials (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  type TEXT, -- banner, video, text, link
  title TEXT,
  content TEXT,
  file_url TEXT,
  dimensions TEXT,
  is_active BOOLEAN DEFAULT true
);
```

### 17.3 Exemplo de Uso

```typescript
// Atualizar configurações de afiliado
const updateAffiliateSettings = async () => {
  await supabase
    .from('products')
    .update({
      affiliate_enabled: true,
      affiliate_commission_rate: 30
    })
    .eq('id', productId);
};

// Adicionar material de marketing
const addMaterial = async (material: Material) => {
  await supabase
    .from('affiliate_materials')
    .insert({
      product_id: productId,
      type: material.type,
      title: material.title,
      content: material.content,
      file_url: material.fileUrl,
      dimensions: material.dimensions
    });
};
```

---

## 18. AUTOMAÇÕES

### 18.1 Tipos de Trigger

| Trigger | Descrição |
|---------|-----------|
| vip_lead | Novo lead VIP |
| new_conversation | Nova conversa no chat |
| abandoned_form | Formulário abandonado |
| low_rating | Avaliação baixa |
| inactivity | Inatividade do usuário |
| keyword | Palavra-chave detectada |
| purchase | Compra realizada |
| subscription_canceled | Assinatura cancelada |

### 18.2 Tipos de Ação

| Ação | Descrição |
|------|-----------|
| send_email | Enviar email |
| assign_admin | Atribuir admin |
| add_tag | Adicionar tag |
| notify_slack | Notificar Slack |
| create_task | Criar tarefa |
| webhook | Chamar webhook externo |
| send_whatsapp | Enviar WhatsApp |
| add_points | Adicionar pontos |

### 18.3 Webhooks Suportados

- Slack
- Discord
- Twitch
- Zapier
- Make (Integromat)
- Custom URL

### 18.4 Tabelas

- `automation_rules` - Regras configuradas
- `automation_logs` - Histórico de execuções

---

## 19. SEGURANÇA E COMPLIANCE

### 19.1 Autenticação

- Supabase Auth com Anonymous Auth para chat
- JWT tokens com refresh automático
- Sessões persistentes
- Role-based access control (RBAC)
- Auto-confirm de email habilitado

### 19.2 RLS (Row Level Security)

Todas as tabelas têm políticas RLS:
- Admins: acesso total via `has_role()`
- Users: apenas próprios dados via `auth.uid()`
- Public: apenas dados públicos

### 19.3 Secrets Management

Secrets armazenados no Supabase (nunca em código):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `LOVABLE_API_KEY`
- E outros...

### 19.4 Proteção de Dados

- Honeypot em formulários
- Rate limiting em endpoints
- XSS protection (DOMPurify)
- Validação de entrada (Zod)
- Audit logging
- CORS configurado

### 19.5 LGPD Compliance

- Consentimento de cookies
- Direito ao esquecimento
- Exportação de dados
- Logs de auditoria
- Política de privacidade

---

## 20. EDGE FUNCTIONS

### 20.1 Lista Completa

| Função | Descrição | JWT |
|--------|-----------|-----|
| `accept-invite` | Aceitar convite | Sim |
| `admin-ai-assistant` | IA do painel admin | Sim |
| `affiliate-actions` | Ações de afiliados | Sim |
| `chat-assistant` | IA do chat público | Não |
| `chat-notifications` | Notificações do chat | Sim |
| `check-subscription` | Verificar assinatura | Sim |
| `create-payment-intent` | Intent Stripe | Sim |
| `create-subscription-checkout` | Checkout assinatura | Sim |
| `customer-portal` | Portal do cliente | Sim |
| `elevenlabs-tts` | Text-to-speech | Sim |
| `error-monitor` | Monitor de erros | Não |
| `firecrawl-scrape` | Web scraping | Sim |
| `firecrawl-search` | Busca web | Sim |
| `gumroad-webhook` | Webhook Gumroad | Não |
| `notify-affiliate-commission` | Notifica comissão | Sim |
| `pix-webhook` | Webhook PIX | Não |
| `points-actions` | Ações de pontos | Sim |
| `process-payment` | Processa pagamento | Sim |
| `process-scheduled-posts` | Posts agendados | Sim |
| `publish-social` | Publicar social | Sim |
| `referral-notifications` | Notificações referral | Sim |
| `send-admin-invite` | Convite admin | Sim |
| `send-admin-reply` | Resposta admin | Sim |
| `send-affiliate-invite` | Convite afiliado | Sim |
| `send-campaign-email` | Email campanha | Sim |
| `send-order-confirmation` | Confirmação pedido | Sim |
| `send-password-reset` | Reset senha | Sim |
| `send-role-invite` | Convite com role | Sim |
| `send-test-email` | Email teste | Sim |
| `send-whatsapp` | Enviar WhatsApp | Sim |
| `social-oauth` | OAuth social | Sim |
| `stripe-checkout` | Checkout Stripe | Não |
| `stripe-checkout-brl` | Checkout BRL | Não |
| `stripe-checkout-enhanced` | Checkout avançado | Sim |
| `stripe-config` | Config Stripe | Sim |
| `stripe-connect-*` | Funções Connect | Sim |
| `stripe-health-check` | Saúde Stripe | Sim |
| `stripe-invoice-preview` | Preview fatura | Sim |
| `stripe-webhook` | Webhook Stripe | Não |
| `submit-contact` | Submit contato | Não |
| `test-esp` | Testar ESP | Sim |
| `test-social-integrations` | Testar social | Sim |

### 20.2 Headers CORS

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
    "authorization, x-client-info, apikey, content-type",
};
```

### 20.3 Configuração em config.toml

```toml
[functions.stripe-webhook]
verify_jwt = false

[functions.stripe-checkout]
verify_jwt = false

[functions.create-subscription-checkout]
verify_jwt = true

[functions.check-subscription]
verify_jwt = true

[functions.customer-portal]
verify_jwt = true
```

---

## 21. BANCO DE DADOS

### 21.1 Tabelas Principais

#### Usuários e Auth
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário + dados Stripe |
| `user_roles` | Roles (admin/user/editor) |
| `admin_emails` | Emails de admin (auto-role) |
| `user_points` | Pontos do usuário |
| `user_badges` | Badges conquistados |
| `admin_invitations` | Convites de admin |
| `admin_availability` | Disponibilidade admin |
| `admin_audit_log` | Auditoria |

#### Afiliados
| Tabela | Descrição |
|--------|-----------|
| `vip_affiliates` | Perfis de afiliados |
| `affiliate_programs` | Programas |
| `affiliate_program_products` | Produtos por programa |
| `affiliate_commissions` | Comissões |
| `affiliate_invites` | Convites |
| `affiliate_referrals` | Indicações |
| `affiliate_materials` | Materiais marketing |

#### Produtos e Vendas
| Tabela | Descrição |
|--------|-----------|
| `products` | Catálogo de produtos |
| `product_categories` | Categorias |
| `product_modules` | Módulos de curso |
| `product_lessons` | Lições |
| `product_content` | Conteúdo adicional |
| `orders` | Pedidos |
| `order_items` | Itens do pedido |
| `coupons` | Cupons de desconto |
| `enrollments` | Matrículas |
| `subscriptions` | Assinaturas |
| `lesson_progress` | Progresso de lições |

#### Chat
| Tabela | Descrição |
|--------|-----------|
| `chat_conversations` | Conversas |
| `chat_messages` | Mensagens |
| `abandoned_forms` | Formulários abandonados |

#### IA
| Tabela | Descrição |
|--------|-----------|
| `ai_feedback` | Feedback da IA |
| `ai_learnings` | Aprendizados |
| `ai_mode_config` | Configuração de modos |
| `ai_assistant_settings` | Configurações gerais |

#### Email
| Tabela | Descrição |
|--------|-----------|
| `email_templates` | Templates |
| `email_campaigns` | Campanhas |
| `email_logs` | Logs de envio |
| `email_events` | Eventos (open, click) |
| `esp_configurations` | Config. de ESP |
| `contact_submissions` | Contatos recebidos |

#### Pagamentos
| Tabela | Descrição |
|--------|-----------|
| `pix_transactions` | Transações PIX |
| `pix_split_configs` | Split de PIX |
| `withdrawals` | Saques |
| `reward_redemptions` | Resgates |

#### Social
| Tabela | Descrição |
|--------|-----------|
| `social_connections` | Conexões sociais |

#### Sistema
| Tabela | Descrição |
|--------|-----------|
| `automation_rules` | Regras de automação |
| `automation_logs` | Logs de automação |
| `notifications` | Notificações |
| `onboarding_progress` | Progresso onboarding |
| `point_transactions` | Transações de pontos |
| `rewards` | Recompensas disponíveis |
| `analytics_events` | Eventos de analytics |
| `tenants` | Multi-tenancy |
| `tenant_members` | Membros de tenants |
| `saas_plans` | Planos SaaS |

### 21.2 Funções do Banco

| Função | Descrição |
|--------|-----------|
| `has_role(user_id, role)` | Verifica role do usuário |
| `has_role_or_higher(user_id, min_role)` | Verifica role mínima |
| `get_user_role(user_id)` | Retorna role do usuário |
| `is_admin_email(email)` | Verifica se é admin |
| `is_tenant_member(user_id, tenant_id)` | Verifica membro tenant |
| `generate_referral_code()` | Gera código SKY-XXXXXX |
| `handle_new_user()` | Trigger de novo usuário |
| `calculate_user_tier(points)` | Calcula tier |
| `generate_order_number()` | Gera número do pedido |
| `activate_enrollment_on_payment()` | Ativa matrícula |
| `award_points_on_purchase()` | Dá pontos na compra |
| `create_enrollments_on_payment()` | Cria enrollments |
| `update_updated_at_column()` | Atualiza timestamp |

---

## 22. SISTEMA DE NOTIFICAÇÕES

### 22.1 Componente NotificationCenter
**Arquivo:** `src/components/NotificationCenter.tsx`

Funcionalidades:
- Sino com badge de contagem de não lidas
- Popover com lista de notificações
- Ícones por tipo (success, warning, error, commission, referral, promotion)
- Marcar como lida individual/todas
- Deletar notificação
- Limpar todas
- Formatação de tempo em português

### 22.2 Hook useNotifications
**Arquivo:** `src/hooks/useNotifications.ts`

```typescript
const { 
  notifications, 
  unreadCount, 
  isLoading, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearAll,
  refresh 
} = useNotifications();
```

Features:
- Fetch de notificações do usuário
- Realtime via Supabase Channel
- Toast automático em nova notificação
- Helper `createNotification()` para criar notificações

### 22.3 Tipos de Notificação
| Tipo | Ícone | Uso |
|------|-------|-----|
| info | ℹ️ | Informações gerais |
| success | ✅ | Operações bem-sucedidas |
| warning | ⚠️ | Alertas |
| error | ❌ | Erros |
| commission | 💰 | Comissões creditadas |
| referral | 👥 | Indicações convertidas |
| promotion | 📣 | Promoções |

---

## 23. ONBOARDING WIZARD

### 23.1 Componente OnboardingWizard
**Arquivo:** `src/components/OnboardingWizard.tsx`

Wizard de 5 passos para novos usuários:
1. **Bem-vindo** - Apresentação da plataforma
2. **Perfil** - Nome, empresa, função
3. **Objetivo** - Afiliado, Agência ou Cliente
4. **Configurações** - Nível de experiência e metas
5. **Conclusão** - Próximos passos

### 23.2 Funcionalidades
- Progress bar visual
- Animações com Framer Motion
- Persistência de progresso no banco
- Opção de pular onboarding
- Atualização automática do perfil

### 23.3 Tabela onboarding_progress
```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  current_step INT DEFAULT 1,
  completed_steps JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  onboarding_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 24. ANALYTICS E MÉTRICAS

### 24.1 Hook useAnalytics
**Arquivo:** `src/hooks/useAnalytics.ts`

```typescript
const { 
  trackPageView, 
  trackEvent, 
  identify, 
  trackConversion, 
  trackAffiliateEvent,
  trackError,
  trackTiming
} = useAnalytics();
```

### 24.2 Eventos Disponíveis

| Método | Uso |
|--------|-----|
| `trackPageView(page, props)` | Visualização de página |
| `trackEvent(name, props, userProps)` | Evento customizado |
| `identify(userProps)` | Identificar usuário |
| `trackConversion(type, value, props)` | Conversões |
| `trackAffiliateEvent(action, props)` | Eventos de afiliado |
| `trackError(type, message, props)` | Rastrear erros |
| `trackTiming(category, variable, timeMs, label)` | Métricas de performance |

### 24.3 Tipos de Conversão
- `signup` - Cadastro
- `purchase` - Compra
- `subscription` - Assinatura
- `referral` - Indicação
- `affiliate_click` - Clique de afiliado

### 24.4 Features Avançadas
- **Session ID**: Rastreamento único por sessão via sessionStorage
- **Retry Logic**: Retry automático com backoff exponencial para falhas
- **Country Detection**: Detecção de país via timezone
- **Queue Processing**: Fila de eventos para processamento offline

### 24.5 Tabela analytics_events
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  tenant_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_properties JSONB,
  user_properties JSONB,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 25. SAAS MULTI-TENANCY

### 25.1 Arquitetura
Suporte a múltiplos tenants (organizações/agências) com isolamento de dados.

### 25.2 Tabela tenants
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'basic',
  max_users INT DEFAULT 5,
  max_affiliates INT DEFAULT 50,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 25.3 Tabela tenant_members
```sql
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 25.4 Planos SaaS

| Plano | Preço | Usuários | Afiliados | Features |
|-------|-------|----------|-----------|----------|
| Basic | R$49/mês | 1 | 10 | Ferramentas básicas |
| Pro | R$99/mês | 5 | 100 | IA custom, analytics |
| Enterprise | Custom | Ilimitado | Ilimitado | White-label, API |

---

## 26. STRIPE CONNECT (MARKETPLACE)

### 26.1 Funcionalidades
- Onboarding de vendedores independentes
- Storefronts individuais
- Taxa de 10% da plataforma
- Direct Charges
- Split de pagamentos

### 26.2 Rotas
- `/connect/onboarding` - Cadastro de vendedor
- `/connect/products` - Dashboard do vendedor
- `/store/:accountId` - Loja do vendedor

### 26.3 Edge Functions

| Função | Descrição |
|--------|-----------|
| `stripe-connect-account` | Criar conta Connect |
| `stripe-connect-account-status` | Status da conta |
| `stripe-connect-checkout` | Checkout do vendedor |
| `stripe-connect-onboarding` | Link de onboarding |
| `stripe-connect-products` | Produtos do vendedor |

---

## 📝 CHANGELOG

### v3.4.0 (28 Dezembro 2024)
- **🔧 Editor Avançado - Modo Mobile**: Correção completa do modo mobile com frame visual realista (notch, home bar)
- **🔧 Editor Avançado - Preview**: Correção do modo preview que não estava funcionando
- **🔧 Editor Avançado - Responsividade**: Grid responsivo usando style inline para evitar problemas com classes Tailwind dinâmicas
- **🆕 Frame de Dispositivo**: Visual realista de iPhone no mobile e iPad no tablet
- **🆕 Ajuste Automático de Zoom**: Zoom ajusta automaticamente ao mudar para mobile/tablet
- **📄 Nova Documentação**: Criada documentação especializada do Editor de Páginas de Vendas (`EDITOR_PAGINAS_VENDAS.md`)

### v3.3.0 (28 Dezembro 2024)
- **🆕 Realtime Sync**: Hook `useRealtimeProduct` para sincronização em tempo real de produtos, módulos e aulas
- **🆕 Auto-Save**: Salvamento automático a cada 30 segundos com indicador visual no Wizard
- **🆕 Preview ao Vivo**: Iframe responsivo embutido no Wizard para visualizar página de vendas
- **🆕 Edição Persistente**: Wizard não fecha automaticamente ao salvar - apenas manualmente
- **🔧 Retry Logic**: Todas as queries com retry automático para conexões instáveis
- **🔧 RLS Expandido**: Permissões completas para admin/editor/owner em products/modules/lessons
- **📄 Documentação**: Atualização completa v3.3.0 com novas funcionalidades

### v3.2.0 (28 Dezembro 2024)
- **🔧 CourseModulesManager**: Correção do botão Adicionar Aula com prevenção de propagação
- **🔧 AdminPage**: Refatoração para evitar flicker com estado persistente
- **🔧 useAdminRole**: Cache expandido para 5 minutos com verificação global

### v3.1.0 (26 Dezembro 2024)
- **🔧 Auditoria Completa**: Todas as Edge Functions atualizadas para Deno std@0.190.0 e Supabase JS 2.57.2
- **🔧 Stripe API**: Todas as funções usando API version 2025-12-15.clover
- **🔧 Segurança RLS**: Correção da recursão infinita em tenant_members (is_tenant_member function)
- **🔧 Affiliate Actions**: Adicionada ação admin_suspend para suspender afiliados
- **🔧 VIPAffiliatesManager**: Botões de Reintegrar/Reaprovar para afiliados suspensos/rejeitados
- **🔧 Payment Intent**: Lógica robusta com validação de valores mínimos BRL
- **📄 Documentação**: Atualização completa de todos os docs

### v3.0.0 (23 Dezembro 2024)
- **🆕 Sistema de Assinaturas**: Edge functions completas (create-subscription-checkout, check-subscription, customer-portal)
- **🆕 ProductCreationWizard**: Wizard de 6 etapas para criar produtos
- **🆕 CourseModulesManager**: Gerenciador completo de módulos e aulas
- **🆕 SalesPageEditor**: Editor visual de página de vendas
- **🆕 AffiliateSettingsPanel**: Painel de configuração de afiliados com tiers e materiais
- **Profiles Update**: Campos Stripe (stripe_customer_id, subscription_status, subscription_tier, subscription_end)
- **useSubscription Hook**: Hook completo para gestão de assinaturas
- **SubscriptionPlans Component**: Componente de planos com checkout integrado
- **Webhook Enhancement**: Tratamento de eventos de assinatura no stripe-webhook

### v2.1.1 (17 Dezembro 2024)
- **Analytics Upgrade**: Session tracking, retry logic, country detection, error/timing tracking
- **Notifications Upgrade**: Delete individual, clear all, realtime sync DELETE events, batch creation
- **NotificationCenter**: Refresh button, delete buttons, error states, improved UX

### v2.1 (17 Dezembro 2024)
- Sistema de Notificações em tempo real
- Onboarding Wizard para novos usuários
- Analytics avançado

### v2.0 (Dezembro 2024)
- Sistema completo de afiliados
- Stripe Connect marketplace
- Chat com IA evolutiva

### v1.0 (Novembro 2024)
- Lançamento inicial
- Site público
- Checkout Stripe

---

## 📧 SUPORTE

**Email Admin:** Configurado via secret `ADMIN_EMAIL`  
**Site:** https://skystreamer.online  
**Documentação:** `/docs`

---

## 📊 HOOKS DISPONÍVEIS

### Hooks de Sistema
| Hook | Descrição |
|------|-----------|
| `useStudyStreak` | Gerencia streak de estudos e horas assistidas |
| `useCommunity` | CRUD completo para posts, respostas e likes |
| `useScheduledPosts` | Agendamento e publicação de posts sociais |
| `useSystemHealth` | Monitoramento de saúde dos serviços |
| `useLinkedInSync` | Sincronização de perfil LinkedIn via scraping |
| `useUserActivity` | Atividades do usuário (aulas, exames, views) |
| `useAIInsights` | Geração de insights com IA para estudantes |
| `useSubscription` | Gestão de assinaturas Stripe |
| `useAdminRole` | Verificação de papel de admin |
| `useNotifications` | Notificações em tempo real |

---

*Documento gerado automaticamente - SKY BRASIL Agency v4.0.0*
*Última atualização: 04 Janeiro 2026*
