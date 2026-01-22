// ================== ANIMATED BLOCK WRAPPER ==================
// Wrapper que aplica animações GSAP aos blocos do editor

import { useEffect, useRef, memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { 
  applyGSAPAnimation, 
  cleanupGSAPAnimations, 
  GSAPAnimationPreset, 
  ColorScheme,
  COLOR_SCHEMES 
} from '@/lib/editor-effects';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedBlockWrapperProps {
  children: ReactNode;
  animation?: GSAPAnimationPreset;
  colorScheme?: ColorScheme;
  className?: string;
  enableHoverEffect?: boolean;
  glassEffect?: boolean;
  neonBorder?: boolean;
}

/**
 * Wrapper que aplica animações GSAP a qualquer bloco
 */
export const AnimatedBlockWrapper = memo(function AnimatedBlockWrapper({
  children,
  animation = 'none',
  colorScheme = 'purple',
  className,
  enableHoverEffect = false,
  glassEffect = false,
  neonBorder = false
}: AnimatedBlockWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!ref.current || animation === 'none') return;

    // Apply GSAP animation
    timelineRef.current = applyGSAPAnimation(ref.current, animation, colorScheme);

    return () => {
      if (ref.current) {
        cleanupGSAPAnimations(ref.current);
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [animation, colorScheme]);

  const color = COLOR_SCHEMES[colorScheme];

  // Build dynamic styles
  const dynamicStyles: React.CSSProperties = {};
  
  if (neonBorder) {
    dynamicStyles.border = `1px solid ${color.main}40`;
    dynamicStyles.boxShadow = `0 0 15px ${color.glow.replace('0.6', '0.2')}, inset 0 0 30px ${color.glow.replace('0.6', '0.05')}`;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative transition-all duration-300",
        enableHoverEffect && "hover:scale-[1.02] hover:z-10",
        glassEffect && "backdrop-blur-md bg-background/30",
        neonBorder && "rounded-xl",
        className
      )}
      style={dynamicStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated gradient border overlay */}
      {neonBorder && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none opacity-50"
          style={{
            background: `linear-gradient(135deg, ${color.main}20 0%, transparent 50%, ${color.accent}20 100%)`
          }}
        />
      )}
      
      {children}
    </motion.div>
  );
});

// ================== NEON TEXT COMPONENT ==================
interface NeonTextProps {
  children: ReactNode;
  colorScheme?: ColorScheme;
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
  className?: string;
}

export const NeonText = memo(function NeonText({
  children,
  colorScheme = 'purple',
  intensity = 'medium',
  animate = false,
  className
}: NeonTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const color = COLOR_SCHEMES[colorScheme];

  const intensityMap = {
    low: { blur: '10px', spread: '20px' },
    medium: { blur: '20px', spread: '40px' },
    high: { blur: '30px', spread: '60px' }
  };

  const { blur, spread } = intensityMap[intensity];

  useEffect(() => {
    if (!animate || !ref.current) return;

    const tl = gsap.timeline({ repeat: -1 });
    tl.to(ref.current, {
      textShadow: `0 0 ${blur} ${color.main}, 0 0 ${spread} ${color.glow}`,
      duration: 1.5,
      ease: "sine.inOut"
    }).to(ref.current, {
      textShadow: `0 0 5px ${color.main}, 0 0 10px ${color.glow.replace('0.6', '0.3')}`,
      duration: 1.5,
      ease: "sine.inOut"
    });

    return () => {
      tl.kill();
    };
  }, [animate, color, blur, spread]);

  return (
    <span
      ref={ref}
      className={cn("transition-all", className)}
      style={{
        textShadow: `0 0 ${blur} ${color.main}, 0 0 ${spread} ${color.glow}`
      }}
    >
      {children}
    </span>
  );
});

// ================== FLOATING ELEMENT ==================
interface FloatingElementProps {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export const FloatingElement = memo(function FloatingElement({
  children,
  amplitude = 10,
  duration = 3,
  delay = 0,
  className
}: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
});

// ================== PARALLAX CONTAINER ==================
interface ParallaxContainerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxContainer = memo(function ParallaxContainer({
  children,
  speed = 0.5,
  className
}: ParallaxContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.to(ref.current, {
      y: `${-100 * speed}%`,
      ease: "none",
      scrollTrigger: {
        trigger: ref.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === ref.current) t.kill();
      });
    };
  }, [speed]);

  return (
    <div ref={ref} className={cn("parallax-content", className)}>
      {children}
    </div>
  );
});

// ================== GLOW BUTTON ==================
interface GlowButtonProps {
  children: ReactNode;
  colorScheme?: ColorScheme;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
}

export const GlowButton = memo(function GlowButton({
  children,
  colorScheme = 'purple',
  onClick,
  className,
  size = 'md',
  variant = 'solid'
}: GlowButtonProps) {
  const color = COLOR_SCHEMES[colorScheme];

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantStyles = {
    solid: {
      background: `linear-gradient(135deg, ${color.main}, ${color.accent})`,
      color: '#ffffff',
      border: 'none'
    },
    outline: {
      background: 'transparent',
      color: color.main,
      border: `2px solid ${color.main}`
    },
    ghost: {
      background: `${color.main}20`,
      color: color.main,
      border: 'none'
    }
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative font-bold rounded-lg transition-all duration-300",
        sizeClasses[size],
        className
      )}
      style={variantStyles[variant]}
      whileHover={{ 
        scale: 1.05,
        boxShadow: `0 0 30px ${color.glow}, 0 0 60px ${color.glow.replace('0.6', '0.3')}`
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${color.glow} 0%, transparent 70%)`
        }}
        whileHover={{ opacity: 0.5 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
});

export default AnimatedBlockWrapper;
