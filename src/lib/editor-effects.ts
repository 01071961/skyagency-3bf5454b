// ================== EDITOR EFFECTS - GSAP & 3D ==================
// Animações e efeitos inspirados na homepage Sky Brasil

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ================== GRADIENT PRESETS (6 Neon) ==================
export const GRADIENT_PRESETS = {
  "neon-purple-pink": {
    label: "Neon Purple-Pink",
    value: "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f472b6 100%)",
    css: "from-purple-600 via-pink-500 to-pink-400",
    colors: ['#7c3aed', '#ec4899', '#f472b6']
  },
  "cyan-orange-glow": {
    label: "Cyan-Orange Glow",
    value: "linear-gradient(135deg, #06b6d4 0%, #f97316 100%)",
    css: "from-cyan-500 to-orange-500",
    colors: ['#06b6d4', '#f97316']
  },
  "dark-cyber-neon": {
    label: "Dark Cyber Neon",
    value: "linear-gradient(135deg, #0f0f23 0%, #1e1b4b 50%, #06b6d4 100%)",
    css: "from-slate-950 via-indigo-950 to-cyan-500",
    colors: ['#0f0f23', '#1e1b4b', '#06b6d4']
  },
  "sunset-fire": {
    label: "Sunset Fire",
    value: "linear-gradient(135deg, #ff0066 0%, #ff7f00 50%, #ffcc00 100%)",
    css: "from-pink-600 via-orange-500 to-yellow-400",
    colors: ['#ff0066', '#ff7f00', '#ffcc00']
  },
  "ocean-deep": {
    label: "Ocean Deep",
    value: "linear-gradient(135deg, #0c1445 0%, #1e40af 50%, #06b6d4 100%)",
    css: "from-slate-900 via-blue-700 to-cyan-500",
    colors: ['#0c1445', '#1e40af', '#06b6d4']
  },
  "forest-glow": {
    label: "Forest Glow",
    value: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)",
    css: "from-emerald-900 via-emerald-600 to-emerald-500",
    colors: ['#064e3b', '#059669', '#10b981']
  }
} as const;

export type GradientPreset = keyof typeof GRADIENT_PRESETS;

// ================== COLOR SCHEMES (3D Effects) ==================
export const COLOR_SCHEMES = {
  purple: { main: "#9b87f5", accent: "#7c3aed", glow: "rgba(155, 135, 245, 0.6)" },
  cyan: { main: "#00ffff", accent: "#06b6d4", glow: "rgba(0, 255, 255, 0.6)" },
  pink: { main: "#ff0066", accent: "#ec4899", glow: "rgba(255, 0, 102, 0.6)" },
  gold: { main: "#fbbf24", accent: "#f59e0b", glow: "rgba(251, 191, 36, 0.6)" },
  neon: { main: "#00ff88", accent: "#10b981", glow: "rgba(0, 255, 136, 0.6)" },
  sunset: { main: "#ff6b6b", accent: "#f97316", glow: "rgba(255, 107, 107, 0.6)" }
} as const;

export type ColorScheme = keyof typeof COLOR_SCHEMES;

// ================== GSAP ANIMATION PRESETS ==================
export type GSAPAnimationPreset = 'none' | 'neon-pulse' | 'fade-in' | 'scroll-parallax' | 'particle-float' | 'scale-bounce' | 'slide-in' | 'glow-cycle';

export const GSAP_PRESETS = {
  'none': {
    label: 'Nenhuma',
    description: 'Sem animação'
  },
  'neon-pulse': {
    label: 'Neon Pulse',
    description: 'Pulsação brilhante neon'
  },
  'fade-in': {
    label: 'Fade In',
    description: 'Surgimento suave com deslize'
  },
  'scroll-parallax': {
    label: 'Scroll Parallax',
    description: 'Movimento ao rolar a página'
  },
  'particle-float': {
    label: 'Float',
    description: 'Flutuação suave contínua'
  },
  'scale-bounce': {
    label: 'Scale Bounce',
    description: 'Entrada com escala e bounce'
  },
  'slide-in': {
    label: 'Slide In',
    description: 'Desliza da esquerda ou direita'
  },
  'glow-cycle': {
    label: 'Glow Cycle',
    description: 'Ciclo de cores brilhantes'
  }
} as const;

// ================== 3D EFFECT PRESETS ==================
export type Effect3DPreset = 'particles' | 'diamond' | 'neon-ring' | 'morphing-sphere' | 'space' | 'waves' | 'neon' | 'neon-grid';

export const EFFECT_3D_PRESETS = {
  'particles': {
    label: 'Partículas',
    description: 'Partículas flutuantes brilhantes',
    icon: '✨'
  },
  'diamond': {
    label: 'Diamante',
    description: 'Diamante 3D rotativo',
    icon: '💎'
  },
  'neon-ring': {
    label: 'Anéis Neon',
    description: 'Anéis com partículas',
    icon: '🔮'
  },
  'morphing-sphere': {
    label: 'Esfera Morphing',
    description: 'Esfera com distorção',
    icon: '🌐'
  },
  'space': {
    label: 'Espacial',
    description: 'Estrelas e planetas',
    icon: '🚀'
  },
  'waves': {
    label: 'Ondas',
    description: 'Ondas fluidas',
    icon: '🌊'
  },
  'neon': {
    label: 'Neon',
    description: 'Efeito neon futurista',
    icon: '💫'
  },
  'neon-grid': {
    label: 'Neon Grid',
    description: 'Grade neon cyberpunk',
    icon: '🎮'
  }
} as const;

// ================== GSAP ANIMATION FUNCTIONS ==================

/**
 * Aplica animação GSAP a um elemento
 */
export function applyGSAPAnimation(
  element: HTMLElement,
  preset: GSAPAnimationPreset,
  colorScheme: ColorScheme = 'purple'
): gsap.core.Timeline | null {
  if (!element || preset === 'none') return null;

  const color = COLOR_SCHEMES[colorScheme];
  let timeline: gsap.core.Timeline | null = null;

  // Kill any existing animations on this element
  gsap.killTweensOf(element);

  switch (preset) {
    case 'neon-pulse':
      timeline = gsap.timeline({ repeat: -1 });
      timeline
        .to(element, {
          boxShadow: `0 0 40px ${color.glow}, 0 0 80px ${color.glow.replace('0.6', '0.3')}`,
          duration: 1.5,
          ease: "sine.inOut"
        })
        .to(element, {
          boxShadow: `0 0 20px ${color.glow.replace('0.6', '0.3')}, 0 0 40px ${color.glow.replace('0.6', '0.15')}`,
          duration: 1.5,
          ease: "sine.inOut"
        });
      break;

    case 'fade-in':
      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });
      timeline.from(element, {
        opacity: 0,
        y: 60,
        duration: 0.8,
        ease: "power2.out"
      });
      break;

    case 'scroll-parallax':
      const parallaxElement = element.querySelector('.parallax-content') || element;
      gsap.to(parallaxElement, {
        y: "-15%",
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
      break;

    case 'particle-float':
      timeline = gsap.timeline({ repeat: -1, yoyo: true });
      timeline.to(element, {
        y: -15,
        duration: 2.5,
        ease: "sine.inOut"
      });
      break;

    case 'scale-bounce':
      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });
      timeline.from(element, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      });
      break;

    case 'slide-in':
      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });
      timeline.from(element, {
        x: -100,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out"
      });
      break;

    case 'glow-cycle':
      const colors = [color.main, color.accent, '#00ffff', '#ff0066'];
      timeline = gsap.timeline({ repeat: -1 });
      colors.forEach((c, i) => {
        timeline!.to(element, {
          boxShadow: `0 0 30px ${c}60, 0 0 60px ${c}30`,
          duration: 1,
          ease: "sine.inOut"
        });
      });
      break;
  }

  return timeline;
}

/**
 * Limpa animações GSAP de um elemento
 */
export function cleanupGSAPAnimations(element: HTMLElement) {
  if (!element) return;
  
  gsap.killTweensOf(element);
  ScrollTrigger.getAll().forEach(t => {
    if (t.trigger === element) t.kill();
  });
}

// ================== TEXT SHADOW HELPERS ==================
export function getTextShadowCSS(type: string, color: string = '#ffffff'): string {
  switch (type) {
    case 'soft':
      return '0 4px 8px rgba(0,0,0,0.3)';
    case 'glow':
      return `0 0 20px ${color}, 0 0 40px ${color}50`;
    case 'neon':
      return `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`;
    case 'long':
      return '4px 4px 0 rgba(0,0,0,0.3), 8px 8px 0 rgba(0,0,0,0.2)';
    case 'outline':
      return `1px 1px 0 ${color}, -1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}`;
    default:
      return 'none';
  }
}

// ================== BACKGROUND STYLE HELPERS ==================
export function getGradientCSS(gradientPreset?: GradientPreset | string): string | undefined {
  if (!gradientPreset) return undefined;
  const preset = GRADIENT_PRESETS[gradientPreset as GradientPreset];
  return preset?.value;
}

export function getRadialGradientCSS(gradientPreset?: GradientPreset | string): string | undefined {
  if (!gradientPreset) return undefined;
  const preset = GRADIENT_PRESETS[gradientPreset as GradientPreset];
  return preset?.value.replace('linear-gradient', 'radial-gradient');
}

// ================== CTA BUTTON STYLES ==================
export const CTA_BUTTON_STYLES = {
  primary: {
    base: "bg-primary hover:bg-primary/90 text-primary-foreground",
    glow: ""
  },
  glow: {
    base: "relative bg-gradient-to-r from-primary to-pink-500 text-white font-bold",
    glow: "shadow-[0_0_30px_rgba(155,135,245,0.5),0_0_60px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(155,135,245,0.7),0_0_80px_rgba(236,72,153,0.4)]"
  },
  outline: {
    base: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
    glow: ""
  },
  neon: {
    base: "bg-black border border-cyan-400 text-cyan-400 font-bold",
    glow: "shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] hover:bg-cyan-400/10"
  }
} as const;

export type CTAButtonStyle = keyof typeof CTA_BUTTON_STYLES;
