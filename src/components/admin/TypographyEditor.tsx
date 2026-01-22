import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Font families disponíveis
export const FONT_FAMILIES = [
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
  { value: 'Crimson Text', label: 'Crimson Text', category: 'serif' },
  { value: 'Source Serif Pro', label: 'Source Serif Pro', category: 'serif' },
  { value: 'Oswald', label: 'Oswald', category: 'display' },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'display' },
  { value: 'Anton', label: 'Anton', category: 'display' },
  { value: 'Archivo Black', label: 'Archivo Black', category: 'display' },
  { value: 'Righteous', label: 'Righteous', category: 'display' },
  { value: 'Lobster', label: 'Lobster', category: 'script' },
  { value: 'Pacifico', label: 'Pacifico', category: 'script' },
  { value: 'Dancing Script', label: 'Dancing Script', category: 'script' },
  { value: 'Great Vibes', label: 'Great Vibes', category: 'script' },
  { value: 'Fira Code', label: 'Fira Code', category: 'monospace' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'monospace' },
  { value: 'Source Code Pro', label: 'Source Code Pro', category: 'monospace' },
];

// Tamanhos predefinidos
export const HEADING_PRESETS = {
  h1: { label: 'H1 - Título Principal', size: 48 },
  h2: { label: 'H2 - Título Secundário', size: 36 },
  h3: { label: 'H3 - Subtítulo', size: 30 },
  h4: { label: 'H4 - Título Menor', size: 24 },
  h5: { label: 'H5 - Título Pequeno', size: 20 },
  h6: { label: 'H6 - Menor Título', size: 18 },
  subtitle: { label: 'Subtítulo', size: 22 },
  body: { label: 'Texto Normal', size: 16 },
  small: { label: 'Texto Pequeno', size: 14 },
  tiny: { label: 'Texto Minúsculo', size: 12 },
};

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
  headingType?: keyof typeof HEADING_PRESETS;
}

interface TypographyEditorProps {
  value: TypographySettings;
  onChange: (value: TypographySettings) => void;
  label?: string;
  multiline?: boolean;
  showPreview?: boolean;
  showHeadingPresets?: boolean;
}

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal (400)' },
  { value: 'medium', label: 'Medium (500)' },
  { value: 'semibold', label: 'Semibold (600)' },
  { value: 'bold', label: 'Bold (700)' },
  { value: 'extrabold', label: 'Extra Bold (800)' },
];

export function TypographyEditor({ 
  value, 
  onChange, 
  label = 'Texto',
  multiline = false,
  showPreview = true,
  showHeadingPresets = true,
}: TypographyEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateValue = (updates: Partial<TypographySettings>) => {
    console.log('[TypographyEditor] Updating:', updates);
    onChange({ ...value, ...updates });
  };

  const applyPreset = (presetKey: keyof typeof HEADING_PRESETS) => {
    console.log('[TypographyEditor] Applying preset:', presetKey);
    const preset = HEADING_PRESETS[presetKey];
    updateValue({ 
      fontSize: preset.size,
      headingType: presetKey,
    });
  };

  const fontWeightValue = () => {
    switch (value.fontWeight) {
      case 'normal': return 400;
      case 'medium': return 500;
      case 'semibold': return 600;
      case 'bold': return 700;
      case 'extrabold': return 800;
      default: return 400;
    }
  };

  return (
    <div className="space-y-3">
      {/* Campo de texto */}
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {multiline ? (
          <Textarea
            value={value.text}
            onChange={(e) => updateValue({ text: e.target.value })}
            placeholder={`Digite o ${label.toLowerCase()}...`}
            rows={3}
            className="mt-1.5"
          />
        ) : (
          <Input
            value={value.text}
            onChange={(e) => updateValue({ text: e.target.value })}
            placeholder={`Digite o ${label.toLowerCase()}...`}
            className="mt-1.5"
          />
        )}
      </div>

      {/* Preview */}
      {showPreview && value.text && (
        <div 
          className="p-4 rounded-lg border bg-background/50 overflow-hidden"
          style={{
            textAlign: value.alignment,
          }}
        >
          <p
            style={{
              fontFamily: `"${value.fontFamily}", sans-serif`,
              fontSize: `${value.fontSize}px`,
              fontWeight: fontWeightValue(),
              fontStyle: value.fontStyle,
              color: value.color,
              letterSpacing: `${value.letterSpacing}em`,
              lineHeight: value.lineHeight,
              textTransform: value.textTransform,
              wordBreak: 'break-word',
            }}
          >
            {value.text}
          </p>
        </div>
      )}

      {/* Presets de Heading */}
      {showHeadingPresets && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Tipo de Texto</Label>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(HEADING_PRESETS).slice(0, 6).map(([key, preset]) => (
              <Button
                key={key}
                type="button"
                variant={value.headingType === key ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={(e) => {
                  e.preventDefault();
                  applyPreset(key as keyof typeof HEADING_PRESETS);
                }}
              >
                {key.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {Object.entries(HEADING_PRESETS).slice(6).map(([key, preset]) => (
              <Button
                key={key}
                type="button"
                variant={value.headingType === key ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={(e) => {
                  e.preventDefault();
                  applyPreset(key as keyof typeof HEADING_PRESETS);
                }}
              >
                {preset.label.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Configurações Avançadas */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="w-full justify-between text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Configurações de Tipografia
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Fonte e Tamanho */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fonte</Label>
              <Select
                value={value.fontFamily}
                onValueChange={(v) => {
                  console.log('[TypographyEditor] Font changed to:', v);
                  updateValue({ fontFamily: v });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione uma fonte" />
                </SelectTrigger>
                <SelectContent className="max-h-64 z-[100]">
                  <div className="px-2 py-1 text-xs text-muted-foreground font-semibold bg-muted sticky top-0">Sans-Serif</div>
                  {FONT_FAMILIES.filter(f => f.category === 'sans-serif').map(font => (
                    <SelectItem key={font.value} value={font.value} className="cursor-pointer">
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-semibold mt-2 bg-muted sticky top-0">Serif</div>
                  {FONT_FAMILIES.filter(f => f.category === 'serif').map(font => (
                    <SelectItem key={font.value} value={font.value} className="cursor-pointer">
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-semibold mt-2 bg-muted sticky top-0">Display</div>
                  {FONT_FAMILIES.filter(f => f.category === 'display').map(font => (
                    <SelectItem key={font.value} value={font.value} className="cursor-pointer">
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-semibold mt-2 bg-muted sticky top-0">Script</div>
                  {FONT_FAMILIES.filter(f => f.category === 'script').map(font => (
                    <SelectItem key={font.value} value={font.value} className="cursor-pointer">
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-semibold mt-2 bg-muted sticky top-0">Monospace</div>
                  {FONT_FAMILIES.filter(f => f.category === 'monospace').map(font => (
                    <SelectItem key={font.value} value={font.value} className="cursor-pointer">
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
                  value={value.fontSize}
                  onChange={(e) => updateValue({ fontSize: Number(e.target.value) })}
                  min={8}
                  max={200}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          {/* Tamanho com Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Tamanho: {value.fontSize}px</Label>
            </div>
            <Slider
              value={[value.fontSize]}
              onValueChange={([v]) => updateValue({ fontSize: v })}
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
                value={value.fontWeight}
                onValueChange={(v) => updateValue({ fontWeight: v as any })}
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
                value={value.fontStyle}
                onValueChange={(v) => updateValue({ fontStyle: v as any })}
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
                  variant={value.alignment === align.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={(e) => {
                    e.preventDefault();
                    updateValue({ alignment: align.value as any });
                  }}
                >
                  <align.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <Label className="text-xs">Cor do Texto</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="color"
                value={value.color}
                onChange={(e) => updateValue({ color: e.target.value })}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={value.color}
                onChange={(e) => updateValue({ color: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 h-9"
              />
            </div>
          </div>

          {/* Letter Spacing e Line Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Espaçamento entre Letras: {value.letterSpacing}em</Label>
              <Slider
                value={[value.letterSpacing * 100]}
                onValueChange={([v]) => updateValue({ letterSpacing: v / 100 })}
                min={-10}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs">Altura da Linha: {value.lineHeight}</Label>
              <Slider
                value={[value.lineHeight * 100]}
                onValueChange={([v]) => updateValue({ lineHeight: v / 100 })}
                min={80}
                max={300}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          {/* Text Transform */}
          <div>
            <Label className="text-xs mb-2 block">Transformação de Texto</Label>
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
                  variant={value.textTransform === transform.value ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={(e) => {
                    e.preventDefault();
                    updateValue({ textTransform: transform.value as any });
                  }}
                >
                  {transform.label}
                </Button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Default value helper
export const defaultTypographySettings: TypographySettings = {
  text: '',
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  alignment: 'left',
  color: '#ffffff',
  letterSpacing: 0,
  lineHeight: 1.5,
  textTransform: 'none',
  headingType: 'body',
};

export const createTypographySettings = (
  overrides: Partial<TypographySettings> = {}
): TypographySettings => ({
  ...defaultTypographySettings,
  ...overrides,
});
