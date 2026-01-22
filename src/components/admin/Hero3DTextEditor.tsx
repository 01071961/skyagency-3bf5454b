import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Sparkles, Palette, Droplets, MoveHorizontal, MoveVertical,
  Play, RotateCcw, Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextStyle {
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

interface Hero3DTextEditorProps {
  headline: TextStyle;
  subheadline: TextStyle;
  onHeadlineChange: (style: Partial<TextStyle>) => void;
  onSubheadlineChange: (style: Partial<TextStyle>) => void;
}

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (Moderno)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegante)' },
  { value: 'Bebas Neue', label: 'Bebas Neue (Impactante)' },
  { value: 'Poppins', label: 'Poppins (Clean)' },
  { value: 'Montserrat', label: 'Montserrat (Geométrico)' },
  { value: 'Oswald', label: 'Oswald (Condensado)' },
  { value: 'Roboto Slab', label: 'Roboto Slab (Serif)' },
  { value: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
];

const TEXT_SHADOWS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'soft', label: 'Suave' },
  { value: 'glow', label: 'Brilho' },
  { value: 'neon', label: 'Neon' },
  { value: 'long', label: 'Longa' },
];

const ANIMATIONS = [
  { value: 'none', label: 'Nenhuma', icon: null },
  { value: 'fadeUp', label: 'Surgir de Baixo', icon: MoveVertical },
  { value: 'fadeDown', label: 'Surgir de Cima', icon: MoveVertical },
  { value: 'scaleIn', label: 'Escala', icon: Play },
  { value: 'typewriter', label: 'Máquina de Escrever', icon: Type },
  { value: 'bounce', label: 'Quicar', icon: Play },
  { value: 'glow', label: 'Pulsar Brilho', icon: Sparkles },
];

const GRADIENT_PRESETS = [
  { name: 'Roxo Neon', from: '#9b87f5', to: '#d946ef', direction: 'to right' },
  { name: 'Oceano', from: '#06b6d4', to: '#3b82f6', direction: 'to right' },
  { name: 'Sunset', from: '#f97316', to: '#ec4899', direction: 'to right' },
  { name: 'Ouro', from: '#fbbf24', to: '#f59e0b', direction: 'to right' },
  { name: 'Esmeralda', from: '#10b981', to: '#06b6d4', direction: 'to right' },
  { name: 'Fogo', from: '#ef4444', to: '#fbbf24', direction: 'to right' },
];

const COLOR_PRESETS = ['#ffffff', '#9b87f5', '#22d3ee', '#f472b6', '#fbbf24', '#10b981', '#ef4444', '#000000'];

function TextStyleEditor({ 
  style, 
  onChange, 
  label 
}: { 
  style: TextStyle; 
  onChange: (updates: Partial<TextStyle>) => void;
  label: string;
}) {
  const [activeTab, setActiveTab] = useState('text');

  const getShadowCSS = (shadow: string) => {
    switch (shadow) {
      case 'soft': return '0 4px 8px rgba(0,0,0,0.3)';
      case 'glow': return `0 0 20px ${style.color}, 0 0 40px ${style.color}50`;
      case 'neon': return `0 0 5px ${style.color}, 0 0 10px ${style.color}, 0 0 20px ${style.color}, 0 0 40px ${style.color}`;
      case 'long': return '4px 4px 0 rgba(0,0,0,0.3), 8px 8px 0 rgba(0,0,0,0.2)';
      default: return 'none';
    }
  };

  const getGradientCSS = () => {
    if (!style.gradient) return undefined;
    return `linear-gradient(${style.gradient.direction}, ${style.gradient.from}, ${style.gradient.to})`;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={(e) => { 
          e.preventDefault(); 
          e.stopPropagation();
          onChange({ 
            fontFamily: 'Inter', fontSize: label === 'Título Principal' ? 48 : 20, fontWeight: 'bold', 
            fontStyle: 'normal', alignment: 'center', color: '#ffffff', textShadow: 'none',
            letterSpacing: 0, lineHeight: 1.2, animation: 'fadeUp', gradient: undefined
          });
        }}>
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
      </div>

      {/* Live Preview */}
      <div 
        className="p-6 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 min-h-[80px] flex items-center justify-center overflow-hidden"
        style={{ textAlign: style.alignment }}
      >
        <span 
          style={{
            fontFamily: style.fontFamily,
            fontSize: `${Math.min(style.fontSize * 0.6, 32)}px`,
            fontWeight: style.fontWeight === 'extrabold' ? 800 : style.fontWeight === 'bold' ? 700 : 400,
            fontStyle: style.fontStyle,
            color: style.gradient ? 'transparent' : style.color,
            textShadow: getShadowCSS(style.textShadow),
            letterSpacing: `${style.letterSpacing}px`,
            lineHeight: style.lineHeight,
            background: getGradientCSS(),
            backgroundClip: style.gradient ? 'text' : undefined,
            WebkitBackgroundClip: style.gradient ? 'text' : undefined,
          }}
          className={cn(
            "transition-all duration-300",
            style.animation === 'glow' && "animate-pulse"
          )}
        >
          {style.text || 'Seu texto aqui...'}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="text" className="text-xs"><Type className="w-3 h-3 mr-1" />Texto</TabsTrigger>
          <TabsTrigger value="style" className="text-xs"><Palette className="w-3 h-3 mr-1" />Estilo</TabsTrigger>
          <TabsTrigger value="effects" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Efeitos</TabsTrigger>
          <TabsTrigger value="animation" className="text-xs"><Play className="w-3 h-3 mr-1" />Animação</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-3 mt-3">
          {label === 'Título Principal' ? (
            <Input
              value={style.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Digite o título..."
              className="text-lg font-semibold"
            />
          ) : (
            <Textarea
              value={style.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder="Digite o subtítulo..."
              rows={2}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fonte</Label>
              <Select value={style.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => (
                    <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tamanho: {style.fontSize}px</Label>
              <Slider
                value={[style.fontSize]}
                onValueChange={([v]) => onChange({ fontSize: v })}
                min={12}
                max={120}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button"
              variant={style.fontWeight === 'bold' || style.fontWeight === 'extrabold' ? 'default' : 'outline'} 
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' }); }}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant={style.fontStyle === 'italic' ? 'default' : 'outline'} 
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' }); }}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <div className="flex-1" />
            <Button 
              type="button"
              variant={style.alignment === 'left' ? 'default' : 'outline'} 
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ alignment: 'left' }); }}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant={style.alignment === 'center' ? 'default' : 'outline'} 
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ alignment: 'center' }); }}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant={style.alignment === 'right' ? 'default' : 'outline'} 
              size="sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ alignment: 'right' }); }}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-3 mt-3">
          <div>
            <Label className="text-xs flex items-center gap-2">
              <Palette className="w-3 h-3" /> Cor do Texto
            </Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {COLOR_PRESETS.map(color => (
                <button
                  type="button"
                  key={color}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                    style.color === color ? "border-white ring-2 ring-primary" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ color, gradient: undefined }); }}
                />
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center hover:border-primary">
                    <Wand2 className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <Input 
                    type="color" 
                    value={style.color} 
                    onChange={(e) => onChange({ color: e.target.value, gradient: undefined })}
                    className="w-full h-10"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-2">
              <Droplets className="w-3 h-3" /> Gradiente
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                className={cn(
                  "p-2 rounded border text-xs",
                  !style.gradient && "border-primary bg-primary/10"
                )}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ gradient: undefined }); }}
              >
                Sem
              </button>
              {GRADIENT_PRESETS.map(g => (
                <button
                  type="button"
                  key={g.name}
                  className={cn(
                    "p-2 rounded border text-xs text-white font-medium",
                    style.gradient?.from === g.from && "ring-2 ring-primary"
                  )}
                  style={{ background: `linear-gradient(${g.direction}, ${g.from}, ${g.to})` }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ gradient: g, color: 'transparent' }); }}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Espaçamento: {style.letterSpacing}px</Label>
              <Slider
                value={[style.letterSpacing]}
                onValueChange={([v]) => onChange({ letterSpacing: v })}
                min={-5}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs">Altura Linha: {style.lineHeight.toFixed(1)}</Label>
              <Slider
                value={[style.lineHeight * 10]}
                onValueChange={([v]) => onChange({ lineHeight: v / 10 })}
                min={8}
                max={25}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-3 mt-3">
          <div>
            <Label className="text-xs">Sombra do Texto</Label>
            <Select value={style.textShadow} onValueChange={(v: any) => onChange({ textShadow: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEXT_SHADOWS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {TEXT_SHADOWS.filter(s => s.value !== 'none').map(shadow => (
              <button
                type="button"
                key={shadow.value}
                className={cn(
                  "p-3 rounded-lg bg-gray-900 text-white font-bold text-sm",
                  style.textShadow === shadow.value && "ring-2 ring-primary"
                )}
                style={{ textShadow: getShadowCSS(shadow.value) }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ textShadow: shadow.value as any }); }}
              >
                {shadow.label}
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="animation" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-2">
            {ANIMATIONS.map(anim => (
              <button
                type="button"
                key={anim.value}
                className={cn(
                  "p-3 rounded-lg border text-left flex items-center gap-2 transition-all",
                  style.animation === anim.value 
                    ? "border-primary bg-primary/10" 
                    : "border-muted hover:border-primary/50"
                )}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ animation: anim.value as any }); }}
              >
                {anim.icon && <anim.icon className="w-4 h-4 text-primary" />}
                <span className="text-sm">{anim.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            A animação será exibida quando a página carregar.
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default function Hero3DTextEditor({ 
  headline, 
  subheadline, 
  onHeadlineChange, 
  onSubheadlineChange 
}: Hero3DTextEditorProps) {
  return (
    <div className="space-y-4">
      <TextStyleEditor 
        style={headline} 
        onChange={onHeadlineChange} 
        label="Título Principal" 
      />
      <TextStyleEditor 
        style={subheadline} 
        onChange={onSubheadlineChange} 
        label="Subtítulo" 
      />
    </div>
  );
}

export type { TextStyle };
