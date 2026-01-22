# 📝 DOCUMENTAÇÃO DO EDITOR DE PÁGINAS DE VENDAS

**Versão:** 2.0.0  
**Última Atualização:** 30 Dezembro 2024  
**Sistema:** SKY BRASIL - Wix-Style Visual Editor

---

## 📑 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Editor](#2-arquitetura-do-editor)
3. [Tipos de Blocos](#3-tipos-de-blocos)
4. [Interface do Usuário](#4-interface-do-usuário)
5. [Modos de Visualização](#5-modos-de-visualização)
6. [Sistema de Blocos](#6-sistema-de-blocos)
7. [Configurações de Blocos](#7-configurações-de-blocos)
8. [Atalhos de Teclado](#8-atalhos-de-teclado)
9. [Auto-Save e Sincronização](#9-auto-save-e-sincronização)
10. [API e Hooks](#10-api-e-hooks)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. VISÃO GERAL

O **Editor de Páginas de Vendas** é um editor visual avançado estilo **Wix** para criação de páginas de venda de produtos digitais. Permite arrastar, soltar e configurar blocos para criar páginas profissionais sem necessidade de código.

### 1.1 Características Principais

| Feature | Descrição |
|---------|-----------|
| **Drag & Drop** | Reordene blocos arrastando-os na página |
| **Live Preview** | Visualização em tempo real das alterações |
| **Responsivo** | Visualize em Desktop, Tablet e Mobile |
| **Undo/Redo** | Histórico completo de ações |
| **Auto-Save** | Salvamento automático a cada 30 segundos |
| **Atalhos** | Ctrl+S, Ctrl+Z, Delete, Escape |
| **Zoom** | Controle de zoom de 50% a 150% |
| **Tela Cheia** | Editor ocupa toda a tela para máxima produtividade |
| **Hero 3D** | Animações 3D interativas no hero |
| **Colunas** | Layouts lado a lado (50-50, 60-40, etc) |
| **Galeria** | Grade de imagens com suporte a URLs externas |
| **Ocultar Blocos** | Mostrar/ocultar blocos individualmente |

### 1.2 Localização

```
src/pages/admin/components/products/
├── AdvancedProductEditor.tsx       # Editor principal
├── SalesPageEditor.tsx             # Container do editor
├── BlockEditor/
│   ├── types.ts                    # Tipos e templates
│   ├── BlockSettings.tsx           # Configurações de bloco
│   ├── BlockItem.tsx               # Item de bloco na lista
│   ├── SortableBlockItem.tsx       # Item arrastável
│   ├── WixStyleEditor.tsx          # Editor estilo Wix
│   ├── FullscreenWixEditor.tsx     # Editor tela cheia
│   └── blockFactory.ts             # Factory para criar blocos
```

---

## 2. ARQUITETURA DO EDITOR

### 2.1 Estrutura de Dados

```typescript
interface Block {
  id: string;           // UUID único
  type: BlockType;      // Tipo do bloco
  visible: boolean;     // Visibilidade
  order: number;        // Posição na página
  content: BlockContent;// Conteúdo específico
}

type BlockType = 
  | 'hero'        // Cabeçalho principal
  | 'hero-3d'     // Hero com animação 3D
  | 'columns'     // Layout em colunas
  | 'gallery'     // Galeria de imagens
  | 'benefits'    // Lista de benefícios
  | 'features'    // Lista de features
  | 'pricing'     // Bloco de preço
  | 'testimonials'// Depoimentos
  | 'faq'         // Perguntas frequentes
  | 'video'       // Embed de vídeo
  | 'text'        // Texto rico
  | 'image'       // Imagem
  | 'cta'         // Call-to-action
  | 'guarantee'   // Garantia
  | 'countdown'   // Contador regressivo
  | 'divider'     // Divisor
  | 'spacer';     // Espaçador
```

### 2.2 Estados do Editor

```typescript
type EditorState = 'editing' | 'preview' | 'syncing';
type ViewMode = 'desktop' | 'tablet' | 'mobile';
```

### 2.3 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                 FullscreenWixEditor (Tela Cheia)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Block Panel │  │   Live Canvas    │  │ Settings Panel │  │
│  │  (Left)     │  │    (Center)      │  │    (Right)     │  │
│  ├─────────────┤  ├─────────────────┤  ├────────────────┤  │
│  │ - Add Block │  │ - Render Blocks │  │ - Block Config │  │
│  │ - Categories│  │ - Drag & Drop   │  │ - Content Edit │  │
│  │ - Templates │  │ - Selection     │  │ - Style Edit   │  │
│  │             │  │ - Responsive    │  │ - URLs Externas│  │
│  └─────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   onSave()   │
                    │   Callback   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Supabase   │
                    │   products   │
                    └─────────────┘
```

---

## 3. TIPOS DE BLOCOS

### 3.1 Blocos Hero

| Bloco | Ícone | Descrição |
|-------|-------|-----------|
| `hero` | ⭐ | Cabeçalho com imagem de fundo |
| `hero-3d` | ✨ | Hero com animação 3D interativa |

### 3.2 Blocos de Layout

| Bloco | Ícone | Descrição |
|-------|-------|-----------|
| `columns` | 📊 | Layout em colunas (50-50, 60-40, etc) |
| `gallery` | 🖼️ | Grade de imagens com URLs externas |
| `divider` | ➖ | Linha divisória |
| `spacer` | ↕️ | Espaço em branco |

### 3.3 Blocos de Conteúdo

| Bloco | Ícone | Descrição |
|-------|-------|-----------|
| `text` | 📝 | Bloco de texto formatado |
| `image` | 🖼️ | Imagem com legenda |
| `video` | ▶️ | Embed YouTube/Vimeo |

### 3.4 Blocos de Conversão

| Bloco | Ícone | Descrição |
|-------|-------|-----------|
| `pricing` | 💰 | Exibição de preço com descontos |
| `cta` | 🖱️ | Botão de chamada para ação |
| `benefits` | ✅ | Lista de benefícios em grid |
| `features` | ⚡ | Lista de funcionalidades |
| `guarantee` | 🛡️ | Garantia do produto |
| `countdown` | ⏰ | Contador regressivo |

### 3.5 Blocos de Prova Social

| Bloco | Ícone | Descrição |
|-------|-------|-----------|
| `testimonials` | 👥 | Depoimentos de clientes |
| `faq` | ❓ | Perguntas frequentes |

---

## 4. INTERFACE DO USUÁRIO

### 4.1 Toolbar Principal

```
┌────────────────────────────────────────────────────────────────┐
│ [☰] [↩️] [↪️] | 8 blocos | Salvo: 14:30                        │
│                                                                 │
│ ────────── [🖥️] [📱] [📲] | [−] ━━━━ [+] 100% ──────────       │
│                                                                 │
│ [🔄 Sync] [👁️ Preview] [↻ Reset] [🔗 Abrir] [💾 Salvar]        │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Painel de Blocos (Esquerda)

- **Adicionar Bloco**: Menu dropdown com categorias
- **Lista de Blocos**: Arraste para reordenar
- **Controles por Bloco**:
  - ⬆️ Mover para cima
  - ⬇️ Mover para baixo
  - 👁️ Alternar visibilidade
  - 📋 Duplicar
  - 🗑️ Excluir

### 4.3 Preview Central

- Renderização em tempo real
- Clique para selecionar blocos
- Escala conforme zoom
- Frame de dispositivo (mobile/tablet)

### 4.4 Painel de Configurações (Direita)

- Aparece quando um bloco é selecionado
- Formulários específicos por tipo de bloco
- Alterações aplicadas em tempo real

---

## 5. MODOS DE VISUALIZAÇÃO

### 5.1 Desktop (1920px)

```
┌──────────────────────────────────────────────────────┐
│                  LAYOUT DESKTOP                       │
│                                                       │
│  Grid: até 4 colunas                                 │
│  Fonte: tamanhos normais                             │
│  Espaçamento: py-10, py-12                           │
└──────────────────────────────────────────────────────┘
```

### 5.2 Tablet (768px)

```
┌────────────────────────────────┐
│         LAYOUT TABLET          │
│                                │
│  Grid: até 2 colunas           │
│  Fonte: ligeiramente menor     │
│  Espaçamento: py-8             │
│  Frame com bordas arredondadas │
└────────────────────────────────┘
```

### 5.3 Mobile (375px)

```
┌──────────────────┐
│  LAYOUT MOBILE   │
│                  │
│  Grid: 1 coluna  │
│  Fonte: menor    │
│  py-6            │
│  Notch visual    │
│  Home bar visual │
└──────────────────┘
```

### 5.4 Código de Responsividade

```typescript
const VIEW_WIDTHS: Record<ViewMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px'
};

// Ajuste automático de colunas
const benefitsCols = isMobile ? 1 : isTablet ? 2 : Math.min(columns, 4);
```

---

## 6. SISTEMA DE BLOCOS

### 6.1 Criação de Blocos

```typescript
import { createBlock } from './BlockEditor/blockFactory';

// Cria um novo bloco do tipo hero na posição 0
const newBlock = createBlock('hero', 0);

// Resultado:
{
  id: 'uuid-gerado',
  type: 'hero',
  visible: true,
  order: 0,
  content: {
    headline: '',
    subheadline: '',
    backgroundImage: '',
    overlayOpacity: 50,
    alignment: 'center'
  }
}
```

### 6.2 Templates de Blocos

```typescript
const BLOCK_TEMPLATES = {
  hero: {
    name: 'Hero',
    description: 'Cabeçalho principal',
    icon: 'Star',
    defaultContent: { ... }
  },
  // ... outros blocos
};
```

### 6.3 Operações de Blocos

```typescript
// Adicionar
addBlock('hero');
addBlock('benefits', afterBlockId);

// Atualizar
updateBlock(blockId, { content: { headline: 'Novo título' } });

// Excluir
deleteBlock(blockId);

// Duplicar
duplicateBlock(blockId);

// Mover
moveBlock(blockId, 'up');
moveBlock(blockId, 'down');

// Visibilidade
toggleVisibility(blockId);

// Reordenar (drag & drop)
handleReorder(newBlocksArray);
```

---

## 7. CONFIGURAÇÕES DE BLOCOS

### 7.1 Hero Block

```typescript
interface HeroContent {
  headline: string;        // Título principal
  subheadline: string;     // Subtítulo
  backgroundImage?: string;// URL da imagem de fundo
  overlayOpacity: number;  // 0-100
  alignment: 'left' | 'center' | 'right';
}
```

### 7.2 Benefits Block

```typescript
interface BenefitsContent {
  title: string;
  subtitle?: string;
  columns: number;         // 1-4
  items: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}
```

### 7.3 Pricing Block

```typescript
interface PricingContent {
  highlightText?: string;  // Badge ex: "MAIS VENDIDO"
  showOriginalPrice: boolean;
  showDiscount: boolean;
  showInstallments: boolean;
}
```

### 7.4 Video Block

```typescript
interface VideoContent {
  url: string;             // YouTube ou Vimeo
  title?: string;
  autoplay?: boolean;
}
```

### 7.5 CTA Block

```typescript
interface CTAContent {
  text: string;            // Título
  subtext?: string;        // Subtítulo
  buttonText: string;      // Texto do botão
  style: 'default' | 'glow' | 'outline';
}
```

---

## 8. ATALHOS DE TECLADO

| Atalho | Ação |
|--------|------|
| `Ctrl + S` | Salvar alterações |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Shift + Z` | Refazer |
| `Delete` | Excluir bloco selecionado |
| `Escape` | Desselecionar bloco |

---

## 9. AUTO-SAVE E SINCRONIZAÇÃO

### 9.1 Auto-Save

O editor salva automaticamente a cada 30 segundos usando o hook `useAutoSave`:

```typescript
import { useAutoSave } from '@/hooks/useAutoSave';

const { 
  lastSaved,        // Data do último save
  isSaving,         // Boolean de estado
  hasUnsavedChanges // Boolean de alterações pendentes
} = useAutoSave({
  data: blocks,
  onSave: async (data) => { /* ... */ },
  interval: 30000,
  enabled: true
});
```

### 9.2 Sincronização Manual

```typescript
// Botão de sync força reload + save
const handleSync = async () => {
  setEditorState('syncing');
  await onSave(blocks);
  setLastSyncTime(new Date());
};
```

### 9.3 Realtime Updates

```typescript
import { useRealtimeProduct } from '@/hooks/useRealtimeProduct';

useRealtimeProduct({
  productId,
  enabled: true,
  onProductChange: (payload) => {
    // Atualiza UI quando produto muda externamente
  }
});
```

---

## 10. API E HOOKS

### 10.1 Props do AdvancedProductEditor

```typescript
interface AdvancedProductEditorProps {
  productId?: string;
  productName?: string;
  productDescription?: string;
  productPrice?: number;
  productOriginalPrice?: number | null;
  productImage?: string;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => Promise<void>;
  isLoading?: boolean;
}
```

### 10.2 Uso Básico

```tsx
import { AdvancedProductEditor } from './AdvancedProductEditor';

<AdvancedProductEditor
  productId={product.id}
  productName={product.name}
  productDescription={product.description}
  productPrice={product.price}
  productOriginalPrice={product.original_price}
  productImage={product.cover_image_url}
  initialBlocks={parsedBlocks}
  onSave={handleSaveBlocks}
  isLoading={isLoading}
/>
```

### 10.3 Handler de Salvamento

```typescript
const handleSaveBlocks = async (blocks: Block[]) => {
  const { error } = await supabase
    .from('products')
    .update({
      sales_page_content: JSON.stringify(blocks),
      updated_at: new Date().toISOString()
    })
    .eq('id', productId);

  if (error) throw error;
};
```

---

## 11. TROUBLESHOOTING

### 11.1 Modo Mobile não funciona

**Causa**: ViewMode não estava sendo passado corretamente.

**Solução**: Use `handleViewModeChange` em vez de `setViewMode` diretamente:

```typescript
const handleViewModeChange = useCallback((mode: ViewMode) => {
  setViewMode(mode);
  // Ajusta zoom automaticamente
  if (mode === 'mobile' && zoom > 100) setZoom(100);
}, [zoom]);
```

### 11.2 Preview não atualiza

**Causa**: Estado não propagando para LivePreview.

**Solução**: Verifique se todas as props estão sendo passadas:

```tsx
<LivePreview 
  blocks={blocks}
  viewMode={viewMode}
  isPreviewMode={editorState === 'preview'}
  // ... outras props
/>
```

### 11.3 Blocos não salvam

**Causa**: Callback `onSave` não configurado.

**Solução**: Implemente o handler no componente pai:

```typescript
const handleSaveBlocks = async (blocks: Block[]) => {
  try {
    await supabase
      .from('products')
      .update({ sales_page_content: JSON.stringify(blocks) })
      .eq('id', productId);
    toast.success('Página salva!');
  } catch (error) {
    toast.error('Erro ao salvar');
    throw error;
  }
};
```

### 11.4 Grid não responsivo

**Causa**: Classes Tailwind dinâmicas não funcionam.

**Solução**: Use style inline para grid-template-columns:

```typescript
<div 
  className="grid gap-4"
  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
>
```

---

## CHANGELOG

### v1.0.0 (28/12/2024)

- ✅ Correção do modo mobile
- ✅ Correção do modo preview
- ✅ Notch e home bar visuais no mobile
- ✅ Frame visual para tablet
- ✅ Ajuste automático de zoom por dispositivo
- ✅ Grid responsivo com style inline
- ✅ Documentação completa criada

---

## LINKS ÚTEIS

- [Documentação Principal](./DOCUMENTACAO_COMPLETA_SKY_BRASIL.md)
- [Roadmap 2025](./ROADMAP_SAAS_2025.md)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Shadcn/UI Docs](https://ui.shadcn.com/)
