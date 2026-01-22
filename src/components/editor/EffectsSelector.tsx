// ================== EFFECTS SELECTOR ==================
// Seletor visual de efeitos GSAP e 3D para o editor Wix-like

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  Sparkles, Zap, Wind, ArrowDown, ArrowLeftRight, 
  Palette, Gem, CircleDot, Waves, Rocket, Grid3X3, Globe
} from 'lucide-react';
import {
  GRADIENT_PRESETS,
  COLOR_SCHEMES,
  GSAP_PRESETS,
  EFFECT_3D_PRESETS,
  GradientPreset,
  ColorScheme,
  GSAPAnimationPreset,
  Effect3DPreset
} from '@/lib/editor-effects';

// ================== GRADIENT PRESET SELECTOR ==================
interface GradientSelectorProps {
  value?: GradientPreset;
  onChange: (value: GradientPreset) => void;
}

export const GradientSelector = memo(function GradientSelector({
  value,
  onChange
}: GradientSelectorProps) {
  const handleClick = (key: GradientPreset) => {
    console.log('[GradientSelector] Selected:', key);
    onChange(key);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Gradiente Neon
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick(key as GradientPreset);
            }}
            className={cn(
              "relative h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer active:scale-95",
              value === key 
                ? "border-primary ring-2 ring-primary/50 shadow-lg" 
                : "border-muted hover:border-primary/50 hover:shadow-md"
            )}
            style={{ background: preset.value }}
          >
            <div className="absolute inset-0 flex items-end p-2">
              <span className="text-[10px] font-medium text-white drop-shadow-lg truncate">
                {preset.label}
              </span>
            </div>
            {value === key && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

// ================== COLOR SCHEME SELECTOR ==================
interface ColorSchemeSelectorProps {
  value?: ColorScheme;
  onChange: (value: ColorScheme) => void;
}

export const ColorSchemeSelector = memo(function ColorSchemeSelector({
  value = 'purple',
  onChange
}: ColorSchemeSelectorProps) {
  const schemeLabels: Record<ColorScheme, string> = {
    purple: 'Roxo',
    cyan: 'Ciano',
    pink: 'Rosa',
    gold: 'Dourado',
    neon: 'Neon',
    sunset: 'Sunset'
  };

  const handleClick = (key: ColorScheme) => {
    console.log('[ColorSchemeSelector] Selected:', key);
    onChange(key);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <CircleDot className="w-4 h-4" />
        Esquema de Cores
      </Label>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {Object.entries(COLOR_SCHEMES).map(([key, colors]) => (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick(key as ColorScheme);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer active:scale-95",
              value === key
                ? "border-primary bg-primary/10 shadow-md"
                : "border-muted hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full transition-shadow",
                value === key && "ring-2 ring-white"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${colors.main}, ${colors.accent})`,
                boxShadow: value === key ? `0 0 12px ${colors.glow}` : 'none'
              }}
            />
            <span className="text-xs font-medium">{schemeLabels[key as ColorScheme]}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ================== GSAP ANIMATION SELECTOR ==================
interface GSAPAnimationSelectorProps {
  value?: GSAPAnimationPreset;
  onChange: (value: GSAPAnimationPreset) => void;
}

const GSAP_ICONS: Record<GSAPAnimationPreset, React.ElementType> = {
  'none': Grid3X3,
  'neon-pulse': Zap,
  'fade-in': ArrowDown,
  'scroll-parallax': Wind,
  'particle-float': Sparkles,
  'scale-bounce': Globe,
  'slide-in': ArrowLeftRight,
  'glow-cycle': Palette
};

export const GSAPAnimationSelector = memo(function GSAPAnimationSelector({
  value = 'none',
  onChange
}: GSAPAnimationSelectorProps) {
  const handleClick = (key: GSAPAnimationPreset) => {
    console.log('[GSAPAnimationSelector] Selected:', key);
    onChange(key);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Zap className="w-4 h-4" />
        Animação GSAP
      </Label>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {Object.entries(GSAP_PRESETS).map(([key, preset]) => {
          const Icon = GSAP_ICONS[key as GSAPAnimationPreset];
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClick(key as GSAPAnimationPreset);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer active:scale-95",
                value === key
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-muted hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                value === key ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-[10px] font-medium text-center">{preset.label}</span>
            </button>
          );
        })}
      </div>
      {value !== 'none' && (
        <p className="text-[10px] text-muted-foreground italic bg-primary/5 p-2 rounded">
          ✨ {GSAP_PRESETS[value].description}
        </p>
      )}
    </div>
  );
});

// ================== 3D EFFECT SELECTOR ==================
interface Effect3DSelectorProps {
  value?: Effect3DPreset;
  onChange: (value: Effect3DPreset) => void;
}

const EFFECT_3D_ICONS: Record<Effect3DPreset, React.ElementType> = {
  'particles': Sparkles,
  'diamond': Gem,
  'neon-ring': CircleDot,
  'morphing-sphere': Globe,
  'space': Rocket,
  'waves': Waves,
  'neon': Zap,
  'neon-grid': Zap
};

export const Effect3DSelector = memo(function Effect3DSelector({
  value = 'particles',
  onChange
}: Effect3DSelectorProps) {
  const handleClick = (key: Effect3DPreset) => {
    console.log('[Effect3DSelector] Selected:', key);
    onChange(key);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Efeito 3D
      </Label>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {Object.entries(EFFECT_3D_PRESETS).map(([key, preset]) => {
          const Icon = EFFECT_3D_ICONS[key as Effect3DPreset];
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClick(key as Effect3DPreset);
              }}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left cursor-pointer active:scale-95",
                value === key
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-muted hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                value === key ? "bg-primary/20" : "bg-muted"
              )}>
                <span className="text-lg">{preset.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium block">{preset.label}</span>
                <span className="text-[9px] text-muted-foreground truncate block">
                  {preset.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ================== EFFECT OPACITY SLIDER ==================
interface EffectOpacitySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ElementType;
}

export const EffectOpacitySlider = memo(function EffectOpacitySlider({
  label,
  value,
  onChange,
  icon: Icon = Sparkles
}: EffectOpacitySliderProps) {
  const handleChange = (newValue: number) => {
    console.log(`[EffectOpacitySlider] ${label} changed to:`, newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {label}
        </Label>
        <Badge variant="secondary" className="text-xs font-bold bg-primary/10 text-primary">
          {value}%
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => handleChange(v)}
        min={0}
        max={100}
        step={5}
        className="w-full cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
});

// ================== COMBINED EFFECTS PANEL ==================
interface EffectsPanelProps {
  gradientPreset?: GradientPreset;
  colorScheme?: ColorScheme;
  gsapAnimation?: GSAPAnimationPreset;
  effect3D?: Effect3DPreset;
  overlayOpacity?: number;
  effectOpacity?: number;
  onGradientChange?: (value: GradientPreset) => void;
  onColorSchemeChange?: (value: ColorScheme) => void;
  onGSAPAnimationChange?: (value: GSAPAnimationPreset) => void;
  onEffect3DChange?: (value: Effect3DPreset) => void;
  onOverlayOpacityChange?: (value: number) => void;
  onEffectOpacityChange?: (value: number) => void;
  show3DEffects?: boolean;
  showGradients?: boolean;
  showAnimations?: boolean;
}

export const EffectsPanel = memo(function EffectsPanel({
  gradientPreset,
  colorScheme = 'purple',
  gsapAnimation = 'none',
  effect3D = 'particles',
  overlayOpacity = 50,
  effectOpacity = 100,
  onGradientChange,
  onColorSchemeChange,
  onGSAPAnimationChange,
  onEffect3DChange,
  onOverlayOpacityChange,
  onEffectOpacityChange,
  show3DEffects = true,
  showGradients = true,
  showAnimations = true
}: EffectsPanelProps) {
  return (
    <Card className="p-3 sm:p-4 space-y-4 sm:space-y-5 bg-muted/30">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Efeitos Visuais</span>
        <Badge variant="outline" className="text-[10px] ml-auto">
          Pro
        </Badge>
      </div>

      {showGradients && onGradientChange && (
        <GradientSelector value={gradientPreset} onChange={onGradientChange} />
      )}

      {onColorSchemeChange && (
        <ColorSchemeSelector value={colorScheme} onChange={onColorSchemeChange} />
      )}

      {show3DEffects && onEffect3DChange && (
        <>
          <Effect3DSelector value={effect3D} onChange={onEffect3DChange} />
          {onEffectOpacityChange && (
            <EffectOpacitySlider
              label="Opacidade do Efeito 3D"
              value={effectOpacity}
              onChange={onEffectOpacityChange}
            />
          )}
        </>
      )}

      {showAnimations && onGSAPAnimationChange && (
        <GSAPAnimationSelector value={gsapAnimation} onChange={onGSAPAnimationChange} />
      )}

      {onOverlayOpacityChange && (
        <EffectOpacitySlider
          label="Opacidade do Overlay"
          value={overlayOpacity}
          onChange={onOverlayOpacityChange}
          icon={Palette}
        />
      )}
    </Card>
  );
});

export default EffectsPanel;
