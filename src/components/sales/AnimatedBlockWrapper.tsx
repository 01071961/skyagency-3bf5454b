// ================== ANIMATED BLOCK WRAPPER ==================
// Wrapper component that applies visual effects to any block
// Supports: Gradient backgrounds, GSAP animations, opacity controls, color scheme borders

import { useRef, useEffect, ReactNode, memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  applyGSAPAnimation, 
  cleanupGSAPAnimations,
  getGradientCSS,
  COLOR_SCHEMES,
  type GradientPreset,
  type ColorScheme,
  type GSAPAnimationPreset
} from '@/lib/editor-effects';

export interface BlockEffectSettings {
  gradientPreset?: GradientPreset;
  colorScheme?: ColorScheme;
  gsapAnimation?: GSAPAnimationPreset;
  overlayOpacity?: number;
  effectOpacity?: number;
}

interface AnimatedBlockWrapperProps {
  children: ReactNode;
  effects?: BlockEffectSettings;
  className?: string;
  as?: 'section' | 'div' | 'article';
  id?: string;
}

export const AnimatedBlockWrapper = memo(function AnimatedBlockWrapper({
  children,
  effects,
  className,
  as: Tag = 'section',
  id
}: AnimatedBlockWrapperProps) {
  const containerRef = useRef<HTMLElement>(null);
  
  // Apply GSAP animation when effects change
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    // Always cleanup first
    cleanupGSAPAnimations(element);
    
    if (!effects?.gsapAnimation || effects.gsapAnimation === 'none') {
      return;
    }
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const timeline = applyGSAPAnimation(
        element, 
        effects.gsapAnimation!, 
        effects.colorScheme || 'purple'
      );
      
      return () => {
        if (timeline) {
          timeline.kill();
        }
      };
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (element) {
        cleanupGSAPAnimations(element);
      }
    };
  }, [effects?.gsapAnimation, effects?.colorScheme]);
  
  // Build inline styles for effects
  const effectStyles: React.CSSProperties = {};
  
  // Apply gradient background
  if (effects?.gradientPreset) {
    const gradientCSS = getGradientCSS(effects.gradientPreset);
    if (gradientCSS) {
      effectStyles.background = gradientCSS;
    }
  }
  
  // Apply color scheme glow and border when animation is active
  if (effects?.colorScheme && effects.gsapAnimation && effects.gsapAnimation !== 'none') {
    const colors = COLOR_SCHEMES[effects.colorScheme];
    if (colors) {
      effectStyles.borderColor = colors.main;
      effectStyles.borderWidth = '2px';
      effectStyles.borderStyle = 'solid';
      effectStyles.borderRadius = '8px';
    }
  }
  
  // Apply overlay opacity for background blending
  const overlayOpacity = effects?.overlayOpacity ?? 0;
  
  // Check if any effect is active
  const hasActiveEffects = (effects?.gradientPreset || 
    (effects?.gsapAnimation && effects.gsapAnimation !== 'none') || 
    overlayOpacity > 0);
  
  // Build className
  const wrapperClassName = cn(
    'relative',
    effects?.gsapAnimation && effects.gsapAnimation !== 'none' && 'transition-all duration-300',
    hasActiveEffects && 'overflow-hidden',
    className
  );
  
  // We need to cast because React doesn't know about our dynamic Tag
  const Container = Tag as any;
  
  return (
    <Container
      ref={containerRef}
      id={id}
      className={wrapperClassName}
      style={effectStyles}
    >
      {/* Overlay for gradient/color effects */}
      {overlayOpacity > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 rounded-inherit"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`,
          }}
        />
      )}
      
      {/* Color scheme glow effect layer */}
      {effects?.colorScheme && effects.gsapAnimation && effects.gsapAnimation !== 'none' && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-20 blur-xl"
          style={{
            background: COLOR_SCHEMES[effects.colorScheme]?.glow,
          }}
        />
      )}
      
      {/* Content - no wrapper div to avoid blocking events */}
      {children}
    </Container>
  );
});

export default AnimatedBlockWrapper;
