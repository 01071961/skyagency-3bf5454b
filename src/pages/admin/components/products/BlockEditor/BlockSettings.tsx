import { useState, lazy, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, GripVertical, Video, Image as ImageIcon, Sparkles, Rocket, Waves, Zap, ChevronDown, Type, AlignLeft, AlignCenter, AlignRight, Mail, CreditCard, ArrowUpCircle, BarChart3, Wand2, Palette } from 'lucide-react';
import { Block, BlockType, BLOCK_TEMPLATES, Hero3DBlock, Hero3DSlide, LeadFormBlock, CheckoutBlock, OrderBumpBlock, UpsellBlock, PixelBlock } from './types';
import CloudFileUploader from '@/components/admin/CloudFileUploader';
import VideoPreview from '@/components/admin/VideoPreview';
import Hero3DTextEditor from '@/components/admin/Hero3DTextEditor';
import { cn } from '@/lib/utils';
import { EffectsPanel } from '@/components/editor/EffectsSelector';
import { GradientPreset, ColorScheme, GSAPAnimationPreset, Effect3DPreset } from '@/lib/editor-effects';
import { AISuggestionButton } from '@/components/editor/AISuggestionButton';

// Font families disponíveis
const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'sans-serif' },
  { value: 'Nunito', label: 'Nunito', category: 'sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'sans-serif' },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'sans-serif' },
  { value: 'DM Sans', label: 'DM Sans', category: 'sans-serif' },
  { value: 'Outfit', label: 'Outfit', category: 'sans-serif' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'sans-serif' },
  { value: 'Manrope', label: 'Manrope', category: 'sans-serif' },
  { value: 'Sora', label: 'Sora', category: 'sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'serif' },
  { value: 'Lora', label: 'Lora', category: 'serif' },
  { value: 'Georgia', label: 'Georgia', category: 'serif' },
  { value: 'Bitter', label: 'Bitter', category: 'serif' },
  { value: 'Oswald', label: 'Oswald', category: 'display' },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'display' },
  { value: 'Anton', label: 'Anton', category: 'display' },
  { value: 'Archivo Black', label: 'Archivo Black', category: 'display' },
  { value: 'Lobster', label: 'Lobster', category: 'script' },
  { value: 'Pacifico', label: 'Pacifico', category: 'script' },
  { value: 'Dancing Script', label: 'Dancing Script', category: 'script' },
];

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal (400)' },
  { value: 'medium', label: 'Medium (500)' },
  { value: 'semibold', label: 'Semibold (600)' },
  { value: 'bold', label: 'Bold (700)' },
  { value: 'extrabold', label: 'Extra Bold (800)' },
];

const HEADING_PRESETS = {
  h1: { label: 'H1', size: 48 },
  h2: { label: 'H2', size: 36 },
  h3: { label: 'H3', size: 30 },
  h4: { label: 'H4', size: 24 },
  h5: { label: 'H5', size: 20 },
  h6: { label: 'H6', size: 18 },
  subtitle: { label: 'Subtítulo', size: 22 },
  body: { label: 'Texto', size: 16 },
  small: { label: 'Pequeno', size: 14 },
};

interface BlockSettingsProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

const EFFECT_OPTIONS = [
  { value: 'particles', label: 'Partículas', icon: Sparkles, desc: 'Esferas flutuantes e anéis' },
  { value: 'space', label: 'Espaço', icon: Rocket, desc: 'Estrelas e asteroides' },
  { value: 'waves', label: 'Ondas', icon: Waves, desc: 'Superfícies ondulantes' },
  { value: 'neon', label: 'Neon', icon: Zap, desc: 'Grid neon futurista' },
  { value: 'diamond', label: 'Diamante', icon: Sparkles, desc: 'Diamante 3D rotativo brilhante' },
  { value: 'neon-ring', label: 'Anéis Neon', icon: Zap, desc: 'Anéis concêntricos animados' },
  { value: 'morphing-sphere', label: 'Esfera Morphing', icon: Sparkles, desc: 'Esfera com distorção fluida' },
  { value: 'neon-grid', label: 'Grid Cyberpunk', icon: Zap, desc: 'Grid neon estilo cyberpunk' },
];

const COLOR_SCHEMES = [
  { value: 'purple', label: 'Roxo', color: '#9b87f5' },
  { value: 'cyan', label: 'Ciano', color: '#22d3ee' },
  { value: 'pink', label: 'Rosa', color: '#f472b6' },
  { value: 'gold', label: 'Dourado', color: '#fbbf24' },
  { value: 'neon', label: 'Neon Verde', color: '#00ff88' },
  { value: 'sunset', label: 'Sunset', color: '#ff6b6b' },
];

export function BlockSettings({ block, onUpdate }: BlockSettingsProps) {
  const template = BLOCK_TEMPLATES[block.type];

  const updateContent = (updates: any) => {
    onUpdate({ content: { ...(block as any).content, ...updates } });
  };

  const renderSettings = () => {
    switch (block.type) {
      case 'hero-3d':
        const hero3d = block as Hero3DBlock;
        const slides = hero3d.content.slides || [];
        return (
          <div className="space-y-5">
            {/* Background Mode Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold block">Modo de Fundo</Label>
              <div className="space-y-2">
                {[
                  { value: 'effect', label: 'Apenas Efeito 3D', icon: Sparkles },
                  { value: 'image', label: 'Apenas Imagem', icon: ImageIcon },
                  { value: 'slideshow', label: 'Apenas Slides', icon: Video },
                ].map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateContent({ backgroundMode: mode.value });
                    }}
                    className={cn(
                      "w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                      (hero3d.content.backgroundMode || 'effect') === mode.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    <mode.icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Combined modes - Effect over Image/Slides (like Home page) */}
              <div className="pt-2">
                <Label className="text-xs mb-2 block text-muted-foreground">Combinado (como página inicial)</Label>
                <div className="space-y-2">
                  {[
                    { value: 'effect-over-image', label: '3D + Imagem', icon: Sparkles, desc: 'Efeito 3D sobre imagem de fundo' },
                    { value: 'effect-over-slideshow', label: '3D + Slides', icon: Video, desc: 'Efeito 3D sobre carousel' },
                  ].map(mode => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateContent({ backgroundMode: mode.value });
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all",
                        hero3d.content.backgroundMode === mode.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <mode.icon className="w-5 h-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{mode.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{mode.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Effect Options - show when effect mode OR combined modes */}
            {(hero3d.content.backgroundMode === 'effect' || 
              hero3d.content.backgroundMode === 'effect-over-image' || 
              hero3d.content.backgroundMode === 'effect-over-slideshow' || 
              !hero3d.content.backgroundMode) && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-medium block">Efeito 3D</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EFFECT_OPTIONS.map(effect => (
                      <button
                        key={effect.value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateContent({ effect: effect.value });
                        }}
                        className={cn(
                          "p-2.5 rounded-lg border-2 text-left transition-all",
                          hero3d.content.effect === effect.value 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-primary/50'
                        )}
                      >
                        <effect.icon className="w-4 h-4 mb-1 text-primary" />
                        <div className="font-medium text-xs">{effect.label}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{effect.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium block">Esquema de Cores</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_SCHEMES.map(scheme => (
                      <button
                        key={scheme.value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateContent({ colorScheme: scheme.value });
                        }}
                        className={cn(
                          "w-full aspect-square rounded-full border-2 transition-all hover:scale-110",
                          hero3d.content.colorScheme === scheme.value 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: scheme.color }}
                        title={scheme.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Overlay Color for Effect Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium block">Cor do Overlay</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={hero3d.content.overlayColor || '#000000'}
                      onChange={(e) => updateContent({ overlayColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-2 border-muted shrink-0"
                    />
                    <Input
                      value={hero3d.content.overlayColor || '#000000'}
                      onChange={(e) => updateContent({ overlayColor: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>

                {/* Overlay Opacity for Effect Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-medium">Opacidade</Label>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {hero3d.content.overlayOpacity ?? 30}%
                    </span>
                  </div>
                  <Slider
                    value={[hero3d.content.overlayOpacity ?? 30]}
                    onValueChange={([value]) => updateContent({ overlayOpacity: value })}
                    min={0}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Intensidade do overlay sobre o efeito 3D
                  </p>
                </div>
              </>
            )}

            {/* Background Image - show when image mode OR effect-over-image */}
            {(hero3d.content.backgroundMode === 'image' || hero3d.content.backgroundMode === 'effect-over-image') && (
              <div className="space-y-3">
                <CloudFileUploader
                  value={hero3d.content.backgroundImage || ''}
                  onChange={(url) => updateContent({ backgroundImage: url })}
                  accept="image/*"
                  label="Imagem de Fundo"
                  folder="hero-backgrounds"
                />
              </div>
            )}

            {/* Slideshow - show when slideshow mode OR effect-over-slideshow */}
            {(hero3d.content.backgroundMode === 'slideshow' || hero3d.content.backgroundMode === 'effect-over-slideshow') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Slides ({slides.length})</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newSlide: Hero3DSlide = {
                        id: crypto.randomUUID(),
                        imageUrl: '',
                        alt: `Slide ${slides.length + 1}`,
                      };
                      updateContent({ slides: [...slides, newSlide] });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Slide
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {slides.map((slide, index) => (
                    <Card key={slide.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Slide {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newSlides = slides.filter((_, i) => i !== index);
                            updateContent({ slides: newSlides });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CloudFileUploader
                        value={slide.imageUrl}
                        onChange={(url) => {
                          const newSlides = [...slides];
                          newSlides[index] = { ...slide, imageUrl: url };
                          updateContent({ slides: newSlides });
                        }}
                        accept="image/*"
                        label=""
                        folder="hero-slides"
                      />
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Intervalo (seg)</Label>
                    <Select
                      value={String(hero3d.content.slideInterval || 5)}
                      onValueChange={(v) => {
                        console.log('[BlockSettings] Slide interval changed to:', v);
                        updateContent({ slideInterval: Number(v) });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 segundos</SelectItem>
                        <SelectItem value="5">5 segundos</SelectItem>
                        <SelectItem value="7">7 segundos</SelectItem>
                        <SelectItem value="10">10 segundos</SelectItem>
                        <SelectItem value="15">15 segundos</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tempo entre cada slide
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Transição</Label>
                    <Select
                      value={hero3d.content.slideTransition || 'fade'}
                      onValueChange={(v) => {
                        console.log('[BlockSettings] Slide transition changed to:', v);
                        updateContent({ slideTransition: v });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Overlay Controls - show for image/slideshow modes (not combined, those use effect opacity) */}
            {(hero3d.content.backgroundMode === 'image' || hero3d.content.backgroundMode === 'slideshow') && (
              <>
                {/* Overlay Color */}
                <div className="space-y-3">
                  <Label className="text-sm block">Cor do Overlay</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={hero3d.content.overlayColor || '#000000'}
                      onChange={(e) => updateContent({ overlayColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-2 border-muted"
                    />
                    <Input
                      value={hero3d.content.overlayColor || '#000000'}
                      onChange={(e) => updateContent({ overlayColor: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Overlay Opacity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Opacidade do Overlay</Label>
                    <span className="text-sm font-medium text-primary">{hero3d.content.overlayOpacity ?? 50}%</span>
                  </div>
                  <Slider
                    value={[hero3d.content.overlayOpacity ?? 50]}
                    onValueChange={([value]) => updateContent({ overlayOpacity: value })}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a escuridão do overlay sobre a imagem/slides
                  </p>
                </div>
              </>
            )}

            {/* Overlay Controls for Combined modes (effect over image/slides) */}
            {(hero3d.content.backgroundMode === 'effect-over-image' || hero3d.content.backgroundMode === 'effect-over-slideshow') && (
              <>
                {/* Overlay for image/slides beneath effect */}
                <div className="space-y-3">
                  <Label className="text-sm block">Overlay da Imagem/Slides</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Escurecimento do fundo</span>
                    <span className="text-sm font-medium text-primary">{hero3d.content.overlayOpacity ?? 60}%</span>
                  </div>
                  <Slider
                    value={[hero3d.content.overlayOpacity ?? 60]}
                    onValueChange={([value]) => updateContent({ overlayOpacity: value })}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Como na página inicial: gradiente escuro sobre a imagem
                  </p>
                </div>
              </>
            )}

            {/* Text Editor */}
            <Hero3DTextEditor
              headline={hero3d.content.headline}
              subheadline={hero3d.content.subheadline}
              onHeadlineChange={(updates) => updateContent({ headline: { ...hero3d.content.headline, ...updates } })}
              onSubheadlineChange={(updates) => updateContent({ subheadline: { ...hero3d.content.subheadline, ...updates } })}
            />

            {/* CTA Settings */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label>Botão CTA no Hero</Label>
                <Switch checked={hero3d.content.showCTA} onCheckedChange={(v) => updateContent({ showCTA: v })} />
              </div>
              {hero3d.content.showCTA && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Texto do Botão</Label>
                    <Input 
                      value={hero3d.content.ctaText || ''} 
                      onChange={(e) => updateContent({ ctaText: e.target.value })} 
                      placeholder="COMPRAR AGORA" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">URL do Botão (opcional)</Label>
                    <Input 
                      value={hero3d.content.ctaUrl || ''} 
                      onChange={(e) => updateContent({ ctaUrl: e.target.value })} 
                      placeholder="https://exemplo.com ou #checkout" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Deixe vazio para usar o botão de compra padrão
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Estilo do Botão</Label>
                    <Select 
                      value={hero3d.content.ctaStyle || 'primary'} 
                      onValueChange={(v) => updateContent({ ctaStyle: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primário</SelectItem>
                        <SelectItem value="glow">Brilhante (Glow)</SelectItem>
                        <SelectItem value="outline">Contorno</SelectItem>
                        <SelectItem value="neon">Neon Cyberpunk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </Card>
          </div>
        );

      case 'columns':
        const columnsContent = (block as any).content;
        const columns = columnsContent.columns || [];
        
        const getLayoutPreset = (layout: string) => {
          switch (layout) {
            case '50-50': return 2;
            case '60-40': case '40-60': case '70-30': case '30-70': return 2;
            case '33-33-33': case '25-50-25': return 3;
            case '25-25-25-25': return 4;
            default: return 2;
          }
        };
        
        const adjustColumnsForLayout = (layout: string) => {
          const targetCount = getLayoutPreset(layout);
          let newColumns = [...columns];
          
          while (newColumns.length < targetCount) {
            newColumns.push({ 
              id: crypto.randomUUID(), 
              type: 'text', 
              content: { text: `Coluna ${newColumns.length + 1}` } 
            });
          }
          while (newColumns.length > targetCount) {
            newColumns.pop();
          }
          
          return newColumns;
        };
        
        return (
          <div className="space-y-4">
            <div>
              <Label>Layout das Colunas</Label>
              <Select
                value={columnsContent.layout || '50-50'}
                onValueChange={(value) => {
                  const newColumns = adjustColumnsForLayout(value);
                  updateContent({ layout: value, columns: newColumns });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50-50">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-4 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-4 h-3 bg-primary/60 rounded-sm" />
                      </span>
                      50% / 50%
                    </span>
                  </SelectItem>
                  <SelectItem value="60-40">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-5 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-3 h-3 bg-primary/40 rounded-sm" />
                      </span>
                      60% / 40%
                    </span>
                  </SelectItem>
                  <SelectItem value="40-60">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-3 h-3 bg-primary/40 rounded-sm" />
                        <span className="w-5 h-3 bg-primary/60 rounded-sm" />
                      </span>
                      40% / 60%
                    </span>
                  </SelectItem>
                  <SelectItem value="70-30">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-6 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-2 h-3 bg-primary/40 rounded-sm" />
                      </span>
                      70% / 30%
                    </span>
                  </SelectItem>
                  <SelectItem value="30-70">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-2 h-3 bg-primary/40 rounded-sm" />
                        <span className="w-6 h-3 bg-primary/60 rounded-sm" />
                      </span>
                      30% / 70%
                    </span>
                  </SelectItem>
                  <SelectItem value="33-33-33">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-3 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-3 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-3 h-3 bg-primary/60 rounded-sm" />
                      </span>
                      3 Colunas Iguais
                    </span>
                  </SelectItem>
                  <SelectItem value="25-50-25">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-2 h-3 bg-primary/40 rounded-sm" />
                        <span className="w-4 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-2 h-3 bg-primary/40 rounded-sm" />
                      </span>
                      25% / 50% / 25%
                    </span>
                  </SelectItem>
                  <SelectItem value="25-25-25-25">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-2 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-2 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-2 h-3 bg-primary/60 rounded-sm" />
                        <span className="w-2 h-3 bg-primary/60 rounded-sm" />
                      </span>
                      4 Colunas Iguais
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Espaçamento</Label>
                <Select
                  value={columnsContent.gap || 'medium'}
                  onValueChange={(value) => updateContent({ gap: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Padding</Label>
                <Select
                  value={columnsContent.padding || 'medium'}
                  onValueChange={(value) => updateContent({ padding: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Alinhamento Vertical</Label>
              <Select
                value={columnsContent.verticalAlign || 'center'}
                onValueChange={(value) => updateContent({ verticalAlign: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Topo</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="bottom">Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Inverter no Mobile</Label>
              <Switch
                checked={columnsContent.reverseOnMobile || false}
                onCheckedChange={(checked) => updateContent({ reverseOnMobile: checked })}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Conteúdo das Colunas ({columns.length})</Label>
              {columns.map((col: any, index: number) => (
                <Card key={col.id || index} className="p-3 space-y-2 border-l-4 border-l-primary/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      Coluna {index + 1}
                    </span>
                    <Select
                      value={col.type || 'text'}
                      onValueChange={(value) => {
                        const newColumns = [...columns];
                        newColumns[index] = { 
                          ...col, 
                          type: value,
                          content: value === 'text' ? { text: '' } : 
                                   value === 'image' ? { url: '', alt: '' } :
                                   value === 'video' ? { url: '' } :
                                   value === 'cta' ? { text: 'Comprar Agora', style: 'primary' } :
                                   value === 'list' ? { items: ['Item 1', 'Item 2', 'Item 3'] } :
                                   value === 'icon-text' ? { icon: 'Star', title: 'Título', description: 'Descrição' } : {}
                        };
                        updateContent({ columns: newColumns });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="cta">Botão CTA</SelectItem>
                        <SelectItem value="list">Lista</SelectItem>
                        <SelectItem value="icon-text">Ícone + Texto</SelectItem>
                        <SelectItem value="empty">Vazio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {col.type === 'text' && (
                    <Textarea
                      value={col.content?.text || ''}
                      onChange={(e) => {
                        const newColumns = [...columns];
                        newColumns[index] = { ...col, content: { ...col.content, text: e.target.value } };
                        updateContent({ columns: newColumns });
                      }}
                      placeholder="Digite o texto..."
                      rows={3}
                    />
                  )}
                  
                  {col.type === 'image' && (
                    <div className="space-y-2">
                      <Input
                        value={col.content?.url || ''}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, url: e.target.value } };
                          updateContent({ columns: newColumns });
                        }}
                        placeholder="URL da imagem (sua nuvem)"
                      />
                      {col.content?.url && (
                        <img 
                          src={col.content.url} 
                          alt={col.content?.alt || ''} 
                          className="w-full h-24 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/200x100?text=Erro';
                          }}
                        />
                      )}
                      <Input
                        value={col.content?.alt || ''}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, alt: e.target.value } };
                          updateContent({ columns: newColumns });
                        }}
                        placeholder="Texto alternativo"
                      />
                    </div>
                  )}
                  
                  {col.type === 'video' && (
                    <Input
                      value={col.content?.url || ''}
                      onChange={(e) => {
                        const newColumns = [...columns];
                        newColumns[index] = { ...col, content: { ...col.content, url: e.target.value } };
                        updateContent({ columns: newColumns });
                      }}
                      placeholder="URL do vídeo (YouTube/Vimeo)"
                    />
                  )}
                  
                  {col.type === 'cta' && (
                    <div className="space-y-2">
                      <Input
                        value={col.content?.text || 'Comprar Agora'}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, text: e.target.value } };
                          updateContent({ columns: newColumns });
                        }}
                        placeholder="Texto do botão"
                      />
                      <Select
                        value={col.content?.style || 'primary'}
                        onValueChange={(value) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, style: value } };
                          updateContent({ columns: newColumns });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estilo do botão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primário</SelectItem>
                          <SelectItem value="secondary">Secundário</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="glow">Glow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {col.type === 'list' && (
                    <div className="space-y-2">
                      {(col.content?.items || []).map((item: string, itemIdx: number) => (
                        <div key={itemIdx} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => {
                              const newColumns = [...columns];
                              const newItems = [...(col.content?.items || [])];
                              newItems[itemIdx] = e.target.value;
                              newColumns[index] = { ...col, content: { ...col.content, items: newItems } };
                              updateContent({ columns: newColumns });
                            }}
                            placeholder={`Item ${itemIdx + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive shrink-0"
                            onClick={() => {
                              const newColumns = [...columns];
                              const newItems = (col.content?.items || []).filter((_: any, i: number) => i !== itemIdx);
                              newColumns[index] = { ...col, content: { ...col.content, items: newItems } };
                              updateContent({ columns: newColumns });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newColumns = [...columns];
                          const newItems = [...(col.content?.items || []), 'Novo item'];
                          newColumns[index] = { ...col, content: { ...col.content, items: newItems } };
                          updateContent({ columns: newColumns });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Item
                      </Button>
                    </div>
                  )}
                  
                  {col.type === 'icon-text' && (
                    <div className="space-y-2">
                      <Select
                        value={col.content?.icon || 'Star'}
                        onValueChange={(value) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, icon: value } };
                          updateContent({ columns: newColumns });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ícone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Star">Estrela</SelectItem>
                          <SelectItem value="CheckCircle">Check</SelectItem>
                          <SelectItem value="Shield">Escudo</SelectItem>
                          <SelectItem value="Zap">Raio</SelectItem>
                          <SelectItem value="Heart">Coração</SelectItem>
                          <SelectItem value="Award">Prêmio</SelectItem>
                          <SelectItem value="Clock">Relógio</SelectItem>
                          <SelectItem value="Target">Alvo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={col.content?.title || ''}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, title: e.target.value } };
                          updateContent({ columns: newColumns });
                        }}
                        placeholder="Título"
                      />
                      <Textarea
                        value={col.content?.description || ''}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[index] = { ...col, content: { ...col.content, description: e.target.value } };
                          updateContent({ columns: newColumns });
                        }}
                        placeholder="Descrição"
                        rows={2}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 As colunas permitem layouts profissionais como descrição + vídeo, cards lado a lado, etc. No mobile, elas empilham automaticamente.
            </p>
          </div>
        );

      case 'gallery':
        const galleryContent = (block as any).content;
        const galleryImages = galleryContent.images || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={galleryContent.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Galeria de Imagens"
              />
            </div>
            <div>
              <Label>Colunas</Label>
              <Select
                value={String(galleryContent.columns || 3)}
                onValueChange={(value) => updateContent({ columns: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Colunas</SelectItem>
                  <SelectItem value="3">3 Colunas</SelectItem>
                  <SelectItem value="4">4 Colunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Espaçamento</Label>
              <Select
                value={galleryContent.gap || 'medium'}
                onValueChange={(value) => updateContent({ gap: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Imagens ({galleryImages.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateContent({
                    images: [...galleryImages, { url: '', alt: '', caption: '' }]
                  }); }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole URLs de imagens da sua nuvem (Google Drive, Dropbox, etc)
              </p>
              {galleryImages.map((img: any, index: number) => (
                <Card key={index} className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    {img.url && (
                      <img 
                        src={img.url} 
                        alt={img.alt || ''} 
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/64x64?text=Erro';
                        }}
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        value={img.url || ''}
                        onChange={(e) => {
                          const newImages = [...galleryImages];
                          newImages[index] = { ...img, url: e.target.value };
                          updateContent({ images: newImages });
                        }}
                        placeholder="https://sua-nuvem.com/imagem.jpg"
                      />
                      <Input
                        value={img.alt || ''}
                        onChange={(e) => {
                          const newImages = [...galleryImages];
                          newImages[index] = { ...img, alt: e.target.value };
                          updateContent({ images: newImages });
                        }}
                        placeholder="Texto alternativo"
                      />
                      <Input
                        value={img.caption || ''}
                        onChange={(e) => {
                          const newImages = [...galleryImages];
                          newImages[index] = { ...img, caption: e.target.value };
                          updateContent({ images: newImages });
                        }}
                        placeholder="Legenda (opcional)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation();
                        const newImages = galleryImages.filter((_: any, i: number) => i !== index);
                        updateContent({ images: newImages });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input
                value={block.content.headline}
                onChange={(e) => updateContent({ headline: e.target.value })}
                placeholder="Seu título principal"
                className="text-lg font-semibold"
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Textarea
                value={block.content.subheadline}
                onChange={(e) => updateContent({ subheadline: e.target.value })}
                placeholder="Descrição complementar"
                rows={2}
              />
            </div>
            <div>
              <Label>Imagem de Fundo</Label>
              <CloudFileUploader
                value={block.content.backgroundImage || ''}
                onChange={(url) => updateContent({ backgroundImage: url })}
                accept="image/*"
                bucket="product-content"
                folder="hero-backgrounds"
                placeholder="Cole URL ou faça upload"
                showUrlInput={true}
              />
            </div>
            <div>
              <Label>Alinhamento</Label>
              <Select
                value={block.content.alignment}
                onValueChange={(value) => updateContent({ alignment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opacidade do Overlay ({block.content.overlayOpacity}%)</Label>
              <Slider
                value={[block.content.overlayOpacity]}
                onValueChange={([value]) => updateContent({ overlayOpacity: value })}
                max={100}
                step={5}
              />
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-4">
            {/* AI Generate All Benefits */}
            <Card className="p-3 bg-gradient-to-r from-primary/10 to-pink-500/10 border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Gerar com IA</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // AI default content for benefits
                    updateContent({
                      title: 'O que você recebe',
                      subtitle: 'Benefícios exclusivos para transformar seus resultados',
                      items: [
                        { icon: 'CheckCircle', title: 'Acesso Vitalício', description: 'Tenha acesso ao conteúdo para sempre, sem mensalidades.' },
                        { icon: 'Zap', title: 'Resultados Rápidos', description: 'Metodologia comprovada para resultados em semanas.' },
                        { icon: 'Shield', title: 'Suporte Premium', description: 'Tire suas dúvidas diretamente com nossa equipe.' },
                        { icon: 'Star', title: 'Bônus Exclusivos', description: 'Materiais complementares para acelerar seu aprendizado.' },
                      ]
                    });
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Preencher Automaticamente
                </Button>
              </div>
            </Card>
            
            {/* Title with AI Suggestion */}
            <div>
              <Label>Título da Seção</Label>
              <div className="flex gap-2">
                <Input
                  value={block.content.title}
                  onChange={(e) => updateContent({ title: e.target.value })}
                  placeholder="Por que escolher este produto?"
                  className="flex-1"
                />
                <AISuggestionButton
                  fieldType="title"
                  context={block.content.title || 'Benefícios do produto'}
                  onSelect={(text) => updateContent({ title: text })}
                />
              </div>
            </div>
            
            {/* Subtitle with AI Suggestion */}
            <div>
              <Label>Subtítulo</Label>
              <div className="flex gap-2">
                <Input
                  value={block.content.subtitle || ''}
                  onChange={(e) => updateContent({ subtitle: e.target.value })}
                  placeholder="Opcional"
                  className="flex-1"
                />
                <AISuggestionButton
                  fieldType="subtitle"
                  context={block.content.title || 'Benefícios'}
                  onSelect={(text) => updateContent({ subtitle: text })}
                />
              </div>
            </div>
            
            {/* Layout Controls */}
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted">
                <span className="text-sm font-medium">Layout e Estilo</span>
                <ChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {/* Columns */}
                <div>
                  <Label className="text-xs">Colunas</Label>
                  <Select
                    value={String(block.content.columns)}
                    onValueChange={(value) => updateContent({ columns: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Colunas</SelectItem>
                      <SelectItem value="3">3 Colunas</SelectItem>
                      <SelectItem value="4">4 Colunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Gap */}
                <div>
                  <Label className="text-xs">Espaçamento</Label>
                  <Select
                    value={block.content.gap || 'medium'}
                    onValueChange={(value) => updateContent({ gap: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Padding */}
                <div>
                  <Label className="text-xs">Padding</Label>
                  <Select
                    value={block.content.padding || 'medium'}
                    onValueChange={(value) => updateContent({ padding: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Vertical Align */}
                <div>
                  <Label className="text-xs">Alinhamento Vertical</Label>
                  <Select
                    value={block.content.verticalAlign || 'top'}
                    onValueChange={(value) => updateContent({ verticalAlign: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Topo</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="bottom">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Background Color */}
                <div>
                  <Label className="text-xs">Cor de Fundo</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={block.content.backgroundColor || '#ffffff'}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-muted shrink-0"
                    />
                    <Input
                      value={block.content.backgroundColor || ''}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      placeholder="Transparente"
                      className="flex-1"
                    />
                    {block.content.backgroundColor && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateContent({ backgroundColor: undefined })}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Reverse Mobile */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs">Inverter no Mobile</Label>
                    <p className="text-[10px] text-muted-foreground">Inverte a ordem dos itens em telas pequenas</p>
                  </div>
                  <Switch
                    checked={block.content.reverseMobile || false}
                    onCheckedChange={(checked) => updateContent({ reverseMobile: checked })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Benefits Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Benefícios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateContent({
                    items: [...block.content.items, { icon: 'CheckCircle', title: '', description: '' }]
                  }); }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {block.content.items.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newItems = [...block.content.items];
                          newItems[index] = { ...item, title: e.target.value };
                          updateContent({ items: newItems });
                        }}
                        placeholder="Título do benefício"
                        className="flex-1"
                      />
                      <AISuggestionButton
                        fieldType="benefit"
                        context={block.content.title || 'Benefício do produto'}
                        onSelect={(text) => {
                          const newItems = [...block.content.items];
                          newItems[index] = { ...item, title: text };
                          updateContent({ items: newItems });
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...block.content.items];
                          newItems[index] = { ...item, description: e.target.value };
                          updateContent({ items: newItems });
                        }}
                        placeholder="Descrição"
                        rows={2}
                        className="flex-1"
                      />
                      <AISuggestionButton
                        fieldType="description"
                        context={item.title || 'Descrição do benefício'}
                        onSelect={(text) => {
                          const newItems = [...block.content.items];
                          newItems[index] = { ...item, description: text };
                          updateContent({ items: newItems });
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation();
                        const newItems = block.content.items.filter((_, i) => i !== index);
                        updateContent({ items: newItems });
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="O que você vai receber"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateContent({ items: [...block.content.items, ''] }); }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {block.content.items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = e.target.value;
                      updateContent({ items: newItems });
                    }}
                    placeholder="Item incluído"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation();
                      const newItems = block.content.items.filter((_, i) => i !== index);
                      updateContent({ items: newItems });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="O que nossos alunos dizem"
              />
            </div>
            <div>
              <Label>Layout</Label>
              <Select
                value={block.content.layout}
                onValueChange={(value: 'grid' | 'carousel') => updateContent({ layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Depoimentos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateContent({
                    items: [...block.content.items, { name: '', text: '', role: '', rating: 5 }]
                  }); }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {block.content.items.map((item, index) => (
                <Card key={index} className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...block.content.items];
                        newItems[index] = { ...item, name: e.target.value };
                        updateContent({ items: newItems });
                      }}
                      placeholder="Nome"
                    />
                    <Input
                      value={item.role || ''}
                      onChange={(e) => {
                        const newItems = [...block.content.items];
                        newItems[index] = { ...item, role: e.target.value };
                        updateContent({ items: newItems });
                      }}
                      placeholder="Cargo/Profissão"
                    />
                  </div>
                  <Textarea
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, text: e.target.value };
                      updateContent({ items: newItems });
                    }}
                    placeholder="Depoimento"
                    rows={2}
                  />
                  <Input
                    value={item.avatar || ''}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, avatar: e.target.value };
                      updateContent({ items: newItems });
                    }}
                    placeholder="URL da foto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation();
                      const newItems = block.content.items.filter((_, i) => i !== index);
                      updateContent({ items: newItems });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Perguntas Frequentes"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Perguntas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateContent({
                    items: [...block.content.items, { question: '', answer: '' }]
                  }); }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              {block.content.items.map((item, index) => (
                <Card key={index} className="p-3 space-y-2">
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, question: e.target.value };
                      updateContent({ items: newItems });
                    }}
                    placeholder="Pergunta"
                  />
                  <Textarea
                    value={item.answer}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, answer: e.target.value };
                      updateContent({ items: newItems });
                    }}
                    placeholder="Resposta"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation();
                      const newItems = block.content.items.filter((_, i) => i !== index);
                      updateContent({ items: newItems });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Mostrar preço original</Label>
              <Switch
                checked={block.content.showOriginalPrice}
                onCheckedChange={(checked) => updateContent({ showOriginalPrice: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar desconto</Label>
              <Switch
                checked={block.content.showDiscount}
                onCheckedChange={(checked) => updateContent({ showDiscount: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar parcelamento</Label>
              <Switch
                checked={block.content.showInstallments}
                onCheckedChange={(checked) => updateContent({ showInstallments: checked })}
              />
            </div>
            <div>
              <Label>Texto de destaque</Label>
              <Input
                value={block.content.highlightText || ''}
                onChange={(e) => updateContent({ highlightText: e.target.value })}
                placeholder="🔥 Oferta por tempo limitado"
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL do Vídeo (YouTube/Vimeo)</Label>
              <Input
                value={block.content.url}
                onChange={(e) => updateContent({ url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... ou https://youtu.be/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole o link do YouTube ou Vimeo
              </p>
            </div>
            {block.content.url && (
              <div>
                <Label>Preview</Label>
                <VideoPreview url={block.content.url} className="mt-2" />
              </div>
            )}
            <div>
              <Label>Título (opcional)</Label>
              <Input
                value={block.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Veja o vídeo de apresentação"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay</Label>
              <Switch
                checked={block.content.autoplay}
                onCheckedChange={(checked) => updateContent({ autoplay: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar controles</Label>
              <Switch
                checked={block.content.controls}
                onCheckedChange={(checked) => updateContent({ controls: checked })}
              />
            </div>
          </div>
        );

      case 'text':
        const textContent = block.content;
        const [textTypoOpen, setTextTypoOpen] = useState(false);
        return (
          <div className="space-y-4">
            <div>
              <Label>Texto</Label>
              <Textarea
                value={textContent.text}
                onChange={(e) => updateContent({ text: e.target.value })}
                placeholder="Seu texto aqui..."
                rows={4}
              />
            </div>

            {/* Presets de Heading */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Tipo de Texto</Label>
              <div className="grid grid-cols-6 gap-1">
                {Object.entries(HEADING_PRESETS).slice(0, 6).map(([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={textContent.headingType === key ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={(e) => {
                      e.preventDefault();
                      updateContent({ 
                        headingType: key as any,
                        fontSize: preset.size,
                      });
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {Object.entries(HEADING_PRESETS).slice(6).map(([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={textContent.headingType === key ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={(e) => {
                      e.preventDefault();
                      updateContent({ 
                        headingType: key as any,
                        fontSize: preset.size,
                      });
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Alinhamento */}
            <div>
              <Label className="text-xs mb-2 block">Alinhamento</Label>
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft, label: 'Esquerda' },
                  { value: 'center', icon: AlignCenter, label: 'Centro' },
                  { value: 'right', icon: AlignRight, label: 'Direita' },
                ].map((align) => (
                  <Button
                    key={align.value}
                    type="button"
                    variant={textContent.alignment === align.value ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-9"
                    onClick={(e) => {
                      e.preventDefault();
                      updateContent({ alignment: align.value as any });
                    }}
                  >
                    <align.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Configurações Avançadas de Tipografia */}
            <Collapsible open={textTypoOpen} onOpenChange={setTextTypoOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Tipografia Avançada
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    textTypoOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                {/* Fonte e Tamanho */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fonte</Label>
                    <Select
                      value={textContent.fontFamily || 'Inter'}
                      onValueChange={(v) => updateContent({ fontFamily: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {FONT_FAMILIES.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tamanho (px)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={textContent.fontSize || 16}
                        onChange={(e) => updateContent({ fontSize: Number(e.target.value) })}
                        min={8}
                        max={200}
                        className="h-9"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>

                {/* Slider de Tamanho */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Tamanho: {textContent.fontSize || 16}px</Label>
                  </div>
                  <Slider
                    value={[textContent.fontSize || 16]}
                    onValueChange={([v]) => updateContent({ fontSize: v })}
                    min={8}
                    max={120}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>8px</span>
                    <span>120px</span>
                  </div>
                </div>

                {/* Peso e Estilo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Peso da Fonte</Label>
                    <Select
                      value={textContent.fontWeight || 'normal'}
                      onValueChange={(v) => updateContent({ fontWeight: v as any })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map(weight => (
                          <SelectItem key={weight.value} value={weight.value}>
                            {weight.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Estilo</Label>
                    <Select
                      value={textContent.fontStyle || 'normal'}
                      onValueChange={(v) => updateContent({ fontStyle: v as any })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Itálico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cor */}
                <div>
                  <Label className="text-xs">Cor do Texto</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      type="color"
                      value={textContent.color || '#ffffff'}
                      onChange={(e) => updateContent({ color: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={textContent.color || '#ffffff'}
                      onChange={(e) => updateContent({ color: e.target.value })}
                      placeholder="#ffffff"
                      className="flex-1 h-9"
                    />
                  </div>
                </div>

                {/* Letter Spacing e Line Height */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Espaçamento: {(textContent.letterSpacing || 0).toFixed(2)}em</Label>
                    <Slider
                      value={[(textContent.letterSpacing || 0) * 100]}
                      onValueChange={([v]) => updateContent({ letterSpacing: v / 100 })}
                      min={-10}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Altura Linha: {(textContent.lineHeight || 1.5).toFixed(2)}</Label>
                    <Slider
                      value={[(textContent.lineHeight || 1.5) * 100]}
                      onValueChange={([v]) => updateContent({ lineHeight: v / 100 })}
                      min={80}
                      max={300}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Text Transform */}
                <div>
                  <Label className="text-xs mb-2 block">Transformação</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { value: 'none', label: 'Normal' },
                      { value: 'uppercase', label: 'MAIÚSC' },
                      { value: 'lowercase', label: 'minúsc' },
                      { value: 'capitalize', label: 'Título' },
                    ].map((transform) => (
                      <Button
                        key={transform.value}
                        type="button"
                        variant={textContent.textTransform === transform.value ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-8"
                        onClick={(e) => {
                          e.preventDefault();
                          updateContent({ textTransform: transform.value as any });
                        }}
                      >
                        {transform.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Preview */}
            {textContent.text && (
              <div className="p-4 rounded-lg border bg-background/50 overflow-hidden">
                <p
                  style={{
                    fontFamily: `"${textContent.fontFamily || 'Inter'}", sans-serif`,
                    fontSize: `${textContent.fontSize || 16}px`,
                    fontWeight: textContent.fontWeight === 'normal' ? 400 : 
                               textContent.fontWeight === 'medium' ? 500 :
                               textContent.fontWeight === 'semibold' ? 600 :
                               textContent.fontWeight === 'bold' ? 700 : 800,
                    fontStyle: textContent.fontStyle || 'normal',
                    color: textContent.color || '#ffffff',
                    letterSpacing: `${textContent.letterSpacing || 0}em`,
                    lineHeight: textContent.lineHeight || 1.5,
                    textTransform: textContent.textTransform || 'none',
                    textAlign: textContent.alignment,
                    wordBreak: 'break-word',
                  }}
                >
                  {textContent.text.substring(0, 100)}{textContent.text.length > 100 ? '...' : ''}
                </p>
              </div>
            )}

            {/* Legacy size selector for compatibility */}
            <div>
              <Label className="text-xs text-muted-foreground">Tamanho Predefinido (legado)</Label>
              <Select
                value={textContent.size}
                onValueChange={(value) => updateContent({ size: value })}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>Texto Principal</Label>
              <Input
                value={block.content.text}
                onChange={(e) => updateContent({ text: e.target.value })}
                placeholder="Não perca essa oportunidade!"
              />
            </div>
            <div>
              <Label>Texto Secundário</Label>
              <Input
                value={block.content.subtext || ''}
                onChange={(e) => updateContent({ subtext: e.target.value })}
                placeholder="Apenas hoje com 50% de desconto"
              />
            </div>
            <div>
              <Label>Texto do Botão</Label>
              <Input
                value={block.content.buttonText}
                onChange={(e) => updateContent({ buttonText: e.target.value })}
                placeholder="COMPRAR AGORA"
              />
            </div>
            <div>
              <Label>Estilo do Botão</Label>
              <Select
                value={block.content.style}
                onValueChange={(value) => updateContent({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primário</SelectItem>
                  <SelectItem value="glow">Com Brilho (Pulsante)</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stripe Price ID (para checkout)</Label>
              <Input
                value={block.content.stripePriceId || ''}
                onChange={(e) => updateContent({ stripePriceId: e.target.value })}
                placeholder="price_xxxxx (deixe vazio para usar preço do produto)"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se vazio, usará o preço configurado no produto
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar selos de segurança</Label>
              <Switch
                checked={block.content.showSecurityBadges !== false}
                onCheckedChange={(checked) => updateContent({ showSecurityBadges: checked })}
              />
            </div>
          </div>
        );

      case 'guarantee':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Garantia Incondicional"
              />
            </div>
            <div>
              <Label>Dias de Garantia</Label>
              <Input
                type="number"
                value={block.content.days}
                onChange={(e) => updateContent({ days: Number(e.target.value) })}
                placeholder="7"
              />
            </div>
            <div>
              <Label>Texto</Label>
              <Textarea
                value={block.content.text}
                onChange={(e) => updateContent({ text: e.target.value })}
                placeholder="Se você não gostar..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={block.content.title}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Oferta termina em:"
              />
            </div>
            <div>
              <Label>Data de Término</Label>
              <Input
                type="datetime-local"
                value={block.content.endDate}
                onChange={(e) => updateContent({ endDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Estilo</Label>
              <Select
                value={block.content.style}
                onValueChange={(value) => updateContent({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                  <SelectItem value="boxed">Em Caixas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-4">
            <div>
              <Label>Estilo</Label>
              <Select
                value={block.content.style}
                onValueChange={(value) => updateContent({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linha</SelectItem>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="dots">Pontos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Altura</Label>
              <Select
                value={block.content.height}
                onValueChange={(value) => updateContent({ height: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno (24px)</SelectItem>
                  <SelectItem value="medium">Médio (48px)</SelectItem>
                  <SelectItem value="large">Grande (96px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>Imagem</Label>
              <CloudFileUploader
                value={block.content.url}
                onChange={(url) => updateContent({ url })}
                accept="image/*"
                bucket="product-content"
                folder="block-images"
                placeholder="Cole URL ou faça upload"
                showUrlInput={true}
              />
            </div>
            <div>
              <Label>Texto Alternativo</Label>
              <Input
                value={block.content.alt}
                onChange={(e) => updateContent({ alt: e.target.value })}
                placeholder="Descrição da imagem"
              />
            </div>
            <div>
              <Label>Legenda (opcional)</Label>
              <Input
                value={block.content.caption || ''}
                onChange={(e) => updateContent({ caption: e.target.value })}
                placeholder="Legenda"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Largura Total</Label>
              <Switch
                checked={block.content.fullWidth}
                onCheckedChange={(checked) => updateContent({ fullWidth: checked })}
              />
            </div>
          </div>
        );

      // ================ v3.0 Funnel Blocks ================
      case 'lead-form':
        const leadForm = block as LeadFormBlock;
        return (
          <div className="space-y-4">
            <div>
              <Label>Título do Formulário</Label>
              <Input
                value={leadForm.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Receba conteúdo exclusivo"
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Textarea
                value={leadForm.content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Cadastre-se para receber..."
                rows={2}
              />
            </div>
            <div>
              <Label className="mb-2 block">Campos do Formulário</Label>
              <div className="space-y-2">
                {['name', 'email', 'phone', 'whatsapp'].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <Checkbox
                      id={`field-${field}`}
                      checked={(leadForm.content.fields || ['email']).includes(field as any)}
                      onCheckedChange={(checked) => {
                        const currentFields = leadForm.content.fields || ['email'];
                        if (checked) {
                          updateContent({ fields: [...currentFields, field] });
                        } else {
                          updateContent({ fields: currentFields.filter((f: string) => f !== field) });
                        }
                      }}
                    />
                    <Label htmlFor={`field-${field}`} className="capitalize cursor-pointer">
                      {field === 'whatsapp' ? 'WhatsApp' : field === 'phone' ? 'Telefone' : field === 'name' ? 'Nome' : 'E-mail'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Integração</Label>
              <Select
                value={leadForm.content.integration || 'webhook'}
                onValueChange={(value) => updateContent({ integration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="activecampaign">ActiveCampaign</SelectItem>
                  <SelectItem value="convertkit">ConvertKit</SelectItem>
                  <SelectItem value="mautic">Mautic</SelectItem>
                  <SelectItem value="mailchimp">Mailchimp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {leadForm.content.integration === 'webhook' && (
              <div>
                <Label>URL do Webhook</Label>
                <Input
                  value={leadForm.content.webhookUrl || ''}
                  onChange={(e) => updateContent({ webhookUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            {leadForm.content.integration !== 'webhook' && (
              <div>
                <Label>ID da Lista</Label>
                <Input
                  value={leadForm.content.listId || ''}
                  onChange={(e) => updateContent({ listId: e.target.value })}
                  placeholder="ID da lista de e-mails"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure a API Key nas integrações do painel
                </p>
              </div>
            )}
            <div>
              <Label>Texto do Botão</Label>
              <Input
                value={leadForm.content.buttonText || 'Cadastrar'}
                onChange={(e) => updateContent({ buttonText: e.target.value })}
                placeholder="Cadastrar"
              />
            </div>
            <div>
              <Label>Mensagem de Sucesso</Label>
              <Textarea
                value={leadForm.content.successMessage || ''}
                onChange={(e) => updateContent({ successMessage: e.target.value })}
                placeholder="Obrigado! Você receberá nossas atualizações."
                rows={2}
              />
            </div>
            <div>
              <Label>URL de Redirecionamento (opcional)</Label>
              <Input
                value={leadForm.content.redirectUrl || ''}
                onChange={(e) => updateContent({ redirectUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        );

      case 'checkout':
        const checkout = block as CheckoutBlock;
        return (
          <div className="space-y-4">
            <div>
              <Label>Provedor de Pagamento</Label>
              <Select
                value={checkout.content.provider || 'stripe'}
                onValueChange={(value) => updateContent({ provider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="pagbank">PagBank</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="kiwi">Kiwify</SelectItem>
                  <SelectItem value="eduzz">Eduzz</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID do Produto no Provedor</Label>
              <Input
                value={checkout.content.productId || ''}
                onChange={(e) => updateContent({ productId: e.target.value })}
                placeholder="prod_xxx ou ID do produto"
              />
            </div>
            <div>
              <Label>Código Embed (opcional)</Label>
              <Textarea
                value={checkout.content.embedCode || ''}
                onChange={(e) => updateContent({ embedCode: e.target.value })}
                placeholder="<script>...</script> ou iframe"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole o código embed do checkout se o provedor fornecer
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostrar Order Bump</Label>
              <Switch
                checked={checkout.content.showBump || false}
                onCheckedChange={(checked) => updateContent({ showBump: checked })}
              />
            </div>
            {checkout.content.showBump && (
              <div>
                <Label>ID do Produto Bump</Label>
                <Input
                  value={checkout.content.bumpProductId || ''}
                  onChange={(e) => updateContent({ bumpProductId: e.target.value })}
                  placeholder="ID do produto adicional"
                />
              </div>
            )}
            <div>
              <Label>ID do Upsell (após compra)</Label>
              <Input
                value={checkout.content.upsellId || ''}
                onChange={(e) => updateContent({ upsellId: e.target.value })}
                placeholder="ID do produto upsell"
              />
            </div>
          </div>
        );

      case 'order-bump':
        const orderBump = block as OrderBumpBlock;
        return (
          <div className="space-y-4">
            <div>
              <Label>Título da Oferta</Label>
              <Input
                value={orderBump.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Oferta Especial!"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={orderBump.content.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                placeholder="Adicione este produto complementar..."
                rows={3}
              />
            </div>
            <div>
              <Label>ID do Produto</Label>
              <Input
                value={orderBump.content.productId || ''}
                onChange={(e) => updateContent({ productId: e.target.value })}
                placeholder="ID do produto bump"
              />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                value={orderBump.content.price || 0}
                onChange={(e) => updateContent({ price: Number(e.target.value) })}
                placeholder="47"
              />
            </div>
            <div>
              <Label>Texto do Checkbox</Label>
              <Input
                value={orderBump.content.checkboxText || ''}
                onChange={(e) => updateContent({ checkboxText: e.target.value })}
                placeholder="Sim! Quero adicionar por apenas R$47"
              />
            </div>
            <div>
              <Label>Imagem do Produto (opcional)</Label>
              <CloudFileUploader
                value={orderBump.content.imageUrl || ''}
                onChange={(url) => updateContent({ imageUrl: url })}
                accept="image/*"
                bucket="product-content"
                folder="order-bumps"
                placeholder="URL da imagem"
                showUrlInput={true}
              />
            </div>
          </div>
        );

      case 'upsell':
        const upsell = block as UpsellBlock;
        return (
          <div className="space-y-4">
            <div>
              <Label>Título do Upsell</Label>
              <Input
                value={upsell.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Espere! Temos uma oferta especial"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={upsell.content.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                placeholder="Aproveite esta oferta exclusiva..."
                rows={3}
              />
            </div>
            <div>
              <Label>ID do Produto</Label>
              <Input
                value={upsell.content.productId || ''}
                onChange={(e) => updateContent({ productId: e.target.value })}
                placeholder="ID do produto upsell"
              />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                value={upsell.content.price || 0}
                onChange={(e) => updateContent({ price: Number(e.target.value) })}
                placeholder="197"
              />
            </div>
            <div>
              <Label>Preço Original (riscado)</Label>
              <Input
                type="number"
                value={upsell.content.originalPrice || 0}
                onChange={(e) => updateContent({ originalPrice: Number(e.target.value) })}
                placeholder="297"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>One-Click (pós-compra)</Label>
              <Switch
                checked={upsell.content.oneClick || false}
                onCheckedChange={(checked) => updateContent({ oneClick: checked })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              One-click permite compra sem re-digitar dados do cartão
            </p>
            <div>
              <Label>Texto do Botão Aceitar</Label>
              <Input
                value={upsell.content.acceptButtonText || 'Sim, quero!'}
                onChange={(e) => updateContent({ acceptButtonText: e.target.value })}
                placeholder="Sim, quero!"
              />
            </div>
            <div>
              <Label>Texto do Botão Recusar</Label>
              <Input
                value={upsell.content.declineButtonText || 'Não, obrigado'}
                onChange={(e) => updateContent({ declineButtonText: e.target.value })}
                placeholder="Não, obrigado"
              />
            </div>
            <div>
              <Label>URL ao Aceitar</Label>
              <Input
                value={upsell.content.redirectOnAccept || ''}
                onChange={(e) => updateContent({ redirectOnAccept: e.target.value })}
                placeholder="/obrigado ou URL externa"
              />
            </div>
            <div>
              <Label>URL ao Recusar</Label>
              <Input
                value={upsell.content.redirectOnDecline || ''}
                onChange={(e) => updateContent({ redirectOnDecline: e.target.value })}
                placeholder="/obrigado ou URL externa"
              />
            </div>
            <div>
              <Label>Imagem do Produto</Label>
              <CloudFileUploader
                value={upsell.content.imageUrl || ''}
                onChange={(url) => updateContent({ imageUrl: url })}
                accept="image/*"
                bucket="product-content"
                folder="upsells"
                placeholder="URL da imagem"
                showUrlInput={true}
              />
            </div>
          </div>
        );

      case 'pixel':
        const pixel = block as PixelBlock;
        return (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Configure os pixels de rastreamento para remarketing e analytics.
                Eles serão carregados automaticamente na página.
              </p>
            </div>
            <div>
              <Label>Facebook Pixel ID</Label>
              <Input
                value={pixel.content.facebookPixelId || ''}
                onChange={(e) => updateContent({ facebookPixelId: e.target.value })}
                placeholder="123456789012345"
              />
            </div>
            <div>
              <Label>Google Tag Manager ID</Label>
              <Input
                value={pixel.content.googleTagId || ''}
                onChange={(e) => updateContent({ googleTagId: e.target.value })}
                placeholder="GTM-XXXXXXX"
              />
            </div>
            <div>
              <Label>TikTok Pixel ID</Label>
              <Input
                value={pixel.content.tiktokPixelId || ''}
                onChange={(e) => updateContent({ tiktokPixelId: e.target.value })}
                placeholder="CXXXXXXXXXXXXXXX"
              />
            </div>
            <div>
              <Label>Google Ads ID</Label>
              <Input
                value={pixel.content.googleAdsId || ''}
                onChange={(e) => updateContent({ googleAdsId: e.target.value })}
                placeholder="AW-XXXXXXXXX"
              />
            </div>
            <div>
              <Label className="mb-2 block">Eventos a Rastrear</Label>
              <div className="space-y-2">
                {['pageview', 'lead', 'purchase', 'add_to_cart', 'initiate_checkout'].map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox
                      id={`event-${event}`}
                      checked={(pixel.content.events || ['pageview']).includes(event as any)}
                      onCheckedChange={(checked) => {
                        const currentEvents = pixel.content.events || ['pageview'];
                        if (checked) {
                          updateContent({ events: [...currentEvents, event] });
                        } else {
                          updateContent({ events: currentEvents.filter((e: string) => e !== event) });
                        }
                      }}
                    />
                    <Label htmlFor={`event-${event}`} className="capitalize cursor-pointer">
                      {event === 'pageview' ? 'PageView' : 
                       event === 'add_to_cart' ? 'Add to Cart' :
                       event === 'initiate_checkout' ? 'Initiate Checkout' :
                       event.charAt(0).toUpperCase() + event.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ================ Social Proof Block ================
      case 'social-proof':
        const socialProof = block as any;
        const socialItems = socialProof.content.items || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Título (opcional)</Label>
              <Input
                value={socialProof.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Empresas que confiam em nós"
              />
            </div>
            <div>
              <Label>Estilo</Label>
              <Select
                value={socialProof.content.style || 'logos'}
                onValueChange={(value) => updateContent({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logos">Logos de Empresas</SelectItem>
                  <SelectItem value="badges">Badges de Confiança</SelectItem>
                  <SelectItem value="stats">Estatísticas</SelectItem>
                  <SelectItem value="trust-bar">Barra de Confiança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens ({socialItems.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newItem = {
                      type: socialProof.content.style === 'stats' ? 'stat' : 'logo',
                      imageUrl: '',
                      text: '',
                      value: socialProof.content.style === 'stats' ? '0' : '',
                      label: '',
                    };
                    updateContent({ items: [...socialItems, newItem] });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-3">
                {socialItems.map((item: any, index: number) => (
                  <Card key={index} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newItems = socialItems.filter((_: any, i: number) => i !== index);
                          updateContent({ items: newItems });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {(socialProof.content.style === 'logos' || socialProof.content.style === 'badges') && (
                      <>
                        <CloudFileUploader
                          value={item.imageUrl || ''}
                          onChange={(url) => {
                            const newItems = [...socialItems];
                            newItems[index] = { ...item, imageUrl: url };
                            updateContent({ items: newItems });
                          }}
                          accept="image/*"
                          label=""
                          folder="social-proof"
                        />
                        <Input
                          value={item.text || ''}
                          onChange={(e) => {
                            const newItems = [...socialItems];
                            newItems[index] = { ...item, text: e.target.value };
                            updateContent({ items: newItems });
                          }}
                          placeholder="Nome da empresa/badge"
                        />
                      </>
                    )}
                    
                    {socialProof.content.style === 'stats' && (
                      <>
                        <Input
                          value={item.value || ''}
                          onChange={(e) => {
                            const newItems = [...socialItems];
                            newItems[index] = { ...item, value: e.target.value };
                            updateContent({ items: newItems });
                          }}
                          placeholder="Ex: 10.000+"
                        />
                        <Input
                          value={item.label || ''}
                          onChange={(e) => {
                            const newItems = [...socialItems];
                            newItems[index] = { ...item, label: e.target.value };
                            updateContent({ items: newItems });
                          }}
                          placeholder="Ex: Clientes Satisfeitos"
                        />
                      </>
                    )}
                    
                    {socialProof.content.style === 'trust-bar' && (
                      <Input
                        value={item.text || ''}
                        onChange={(e) => {
                          const newItems = [...socialItems];
                          newItems[index] = { ...item, text: e.target.value };
                          updateContent({ items: newItems });
                        }}
                        placeholder="Ex: Pagamento Seguro"
                      />
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      // ================ Comparison Block ================
      case 'comparison':
        const comparison = block as any;
        const compColumns = comparison.content.columns || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={comparison.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Compare os planos"
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input
                value={comparison.content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Escolha o melhor para você"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Colunas ({compColumns.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newColumn = {
                      name: `Plano ${compColumns.length + 1}`,
                      isHighlighted: false,
                      price: '',
                      features: [{ text: 'Feature 1', included: true }],
                    };
                    updateContent({ columns: [...compColumns, newColumn] });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Plano
                </Button>
              </div>
              
              <div className="space-y-4">
                {compColumns.map((col: any, colIndex: number) => (
                  <Card key={colIndex} className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={col.name || ''}
                        onChange={(e) => {
                          const newCols = [...compColumns];
                          newCols[colIndex] = { ...col, name: e.target.value };
                          updateContent({ columns: newCols });
                        }}
                        placeholder="Nome do plano"
                        className="font-semibold"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newCols = compColumns.filter((_: any, i: number) => i !== colIndex);
                          updateContent({ columns: newCols });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`highlight-${colIndex}`}
                        checked={col.isHighlighted || false}
                        onCheckedChange={(checked) => {
                          const newCols = [...compColumns];
                          newCols[colIndex] = { ...col, isHighlighted: checked };
                          updateContent({ columns: newCols });
                        }}
                      />
                      <Label htmlFor={`highlight-${colIndex}`} className="text-sm cursor-pointer">
                        Destacar este plano
                      </Label>
                    </div>
                    
                    <Input
                      value={col.price || ''}
                      onChange={(e) => {
                        const newCols = [...compColumns];
                        newCols[colIndex] = { ...col, price: e.target.value };
                        updateContent({ columns: newCols });
                      }}
                      placeholder="R$ 97/mês"
                    />
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Features</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newCols = [...compColumns];
                            newCols[colIndex] = {
                              ...col,
                              features: [...(col.features || []), { text: '', included: true }]
                            };
                            updateContent({ columns: newCols });
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Feature
                        </Button>
                      </div>
                      {(col.features || []).map((feat: any, featIndex: number) => (
                        <div key={featIndex} className="flex items-center gap-2 mb-1">
                          <Checkbox
                            checked={feat.included}
                            onCheckedChange={(checked) => {
                              const newCols = [...compColumns];
                              const newFeats = [...(col.features || [])];
                              newFeats[featIndex] = { ...feat, included: checked };
                              newCols[colIndex] = { ...col, features: newFeats };
                              updateContent({ columns: newCols });
                            }}
                          />
                          <Input
                            value={feat.text || ''}
                            onChange={(e) => {
                              const newCols = [...compColumns];
                              const newFeats = [...(col.features || [])];
                              newFeats[featIndex] = { ...feat, text: e.target.value };
                              newCols[colIndex] = { ...col, features: newFeats };
                              updateContent({ columns: newCols });
                            }}
                            placeholder="Feature"
                            className="flex-1 h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newCols = [...compColumns];
                              const newFeats = (col.features || []).filter((_: any, i: number) => i !== featIndex);
                              newCols[colIndex] = { ...col, features: newFeats };
                              updateContent({ columns: newCols });
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      // ================ Steps Block ================
      case 'steps':
        const stepsBlock = block as any;
        const stepItems = stepsBlock.content.steps || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={stepsBlock.content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Como Funciona"
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input
                value={stepsBlock.content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Em apenas 3 passos simples"
              />
            </div>
            <div>
              <Label>Estilo</Label>
              <Select
                value={stepsBlock.content.style || 'numbered'}
                onValueChange={(value) => updateContent({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numbered">Numerado</SelectItem>
                  <SelectItem value="icons">Com Ícones</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Passos ({stepItems.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newStep = {
                      number: stepItems.length + 1,
                      icon: 'CheckCircle',
                      title: `Passo ${stepItems.length + 1}`,
                      description: 'Descrição do passo',
                    };
                    updateContent({ steps: [...stepItems, newStep] });
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Passo
                </Button>
              </div>
              
              <div className="space-y-3">
                {stepItems.map((step: any, index: number) => (
                  <Card key={index} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Passo {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newSteps = stepItems.filter((_: any, i: number) => i !== index);
                          updateContent({ steps: newSteps });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {stepsBlock.content.style === 'icons' && (
                      <Select
                        value={step.icon || 'CheckCircle'}
                        onValueChange={(value) => {
                          const newSteps = [...stepItems];
                          newSteps[index] = { ...step, icon: value };
                          updateContent({ steps: newSteps });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CheckCircle">CheckCircle</SelectItem>
                          <SelectItem value="Star">Star</SelectItem>
                          <SelectItem value="Zap">Zap</SelectItem>
                          <SelectItem value="Shield">Shield</SelectItem>
                          <SelectItem value="Target">Target</SelectItem>
                          <SelectItem value="Rocket">Rocket</SelectItem>
                          <SelectItem value="Gift">Gift</SelectItem>
                          <SelectItem value="Heart">Heart</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Input
                      value={step.title || ''}
                      onChange={(e) => {
                        const newSteps = [...stepItems];
                        newSteps[index] = { ...step, title: e.target.value };
                        updateContent({ steps: newSteps });
                      }}
                      placeholder="Título do passo"
                    />
                    
                    <Textarea
                      value={step.description || ''}
                      onChange={(e) => {
                        const newSteps = [...stepItems];
                        newSteps[index] = { ...step, description: e.target.value };
                        updateContent({ steps: newSteps });
                      }}
                      placeholder="Descrição do passo"
                      rows={2}
                    />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Sem configurações disponíveis para este bloco</p>;
    }
  };

  return (
    <Card className="p-2 sm:p-3 md:p-4">
      <CardHeader className="p-0 pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <span className="truncate">{template.name}</span>
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-2 sm:mb-4 h-8 sm:h-10">
            <TabsTrigger value="content" className="text-[10px] sm:text-xs h-full">
              <Type className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="effects" className="text-[10px] sm:text-xs h-full">
              <Wand2 className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">Efeitos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-0">
            {renderSettings()}
          </TabsContent>
          
          <TabsContent value="effects" className="mt-0">
            <EffectsPanel
              gradientPreset={(block.content as any)?.gradientPreset as GradientPreset}
              colorScheme={(block.content as any)?.colorScheme as ColorScheme || 'purple'}
              gsapAnimation={(block.content as any)?.gsapAnimation as GSAPAnimationPreset || 'none'}
              effect3D={((block.content as any)?.effect || (block.content as any)?.effect3D || 'particles') as Effect3DPreset}
              overlayOpacity={(block.content as any)?.overlayOpacity ?? 50}
              effectOpacity={(block.content as any)?.effectOpacity ?? 100}
              onGradientChange={(gradientPreset) => updateContent({ gradientPreset })}
              onColorSchemeChange={(colorScheme) => updateContent({ colorScheme })}
              onGSAPAnimationChange={(gsapAnimation) => updateContent({ gsapAnimation })}
              onEffect3DChange={(effect3D) => {
                // Sync both effect and effect3D for compatibility
                updateContent({ effect: effect3D, effect3D });
              }}
              onOverlayOpacityChange={(overlayOpacity) => updateContent({ overlayOpacity })}
              onEffectOpacityChange={(effectOpacity) => updateContent({ effectOpacity })}
              show3DEffects={block.type === 'hero-3d'}
              showGradients={true}
              showAnimations={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
