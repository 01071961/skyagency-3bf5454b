import * as React from "react";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Float, MeshDistortMaterial } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Trash2, Copy, Eye, EyeOff, Save, Settings2, 
  Layers, Monitor, Tablet, Smartphone, ChevronDown, ChevronUp,
  Sparkles as SparklesIcon, Image, Type, Layout, Grid3X3,
  Star, CheckCircle, Users, DollarSign, Palette, GripVertical,
  Plus, X, Maximize2, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ================== TYPES ==================
type BackgroundMode = "effect" | "image" | "slideshow" | "effect-over-image" | "effect-over-slideshow";
type MediaType = "image" | "video" | "embed";
type SlideTransition = "fade" | "slide" | "zoom";

interface Hero3DSlide {
  id: string;
  imageUrl: string;
  headline?: string;
  subheadline?: string;
  mediaType?: MediaType; // image, video, or embed
}

interface BlockContent {
  headline?: string;
  subheadline?: string;
  backgroundType: "solid" | "linear" | "radial";
  backgroundColor?: string;
  gradientPreset?: keyof typeof GRADIENT_PRESETS;
  backgroundImage?: string;
  backgroundMediaType?: MediaType; // Tipo da mídia de fundo
  overlayOpacity: number;
  overlayColor?: string;
  gsapAnimationPreset: "neon-pulse" | "particle-float" | "scroll-parallax" | "fade-in" | "none";
  glassmorphism: boolean;
  effect3D?: "particles" | "diamond" | "neon-ring" | "morphing-sphere" | "space" | "waves" | "neon-grid";
  colorScheme?: "purple" | "cyan" | "pink" | "gold" | "neon" | "sunset";
  ctaText?: string;
  ctaUrl?: string;
  showCTA?: boolean;
  text?: string;
  alignment?: "left" | "center" | "right";
  items?: Array<{ icon?: string; title: string; description: string }>;
  columns?: number;
  title?: string;
  subtitle?: string;
  // Background mode for Hero-3D
  backgroundMode?: BackgroundMode;
  slides?: Hero3DSlide[];
  slideInterval?: number;
  slideTransition?: SlideTransition; // fade, slide, zoom
  effectOpacity?: number;
  // Layout options for Benefits block
  gap?: "none" | "small" | "medium" | "large";
  padding?: "none" | "small" | "medium" | "large";
  verticalAlign?: "top" | "center" | "bottom";
  reverseMobile?: boolean;
  // Font options for headlines
  headlineFontSize?: number;
  headlineFontFamily?: string;
  subheadlineFontSize?: number;
  subheadlineFontFamily?: string;
}

interface Block {
  id: string;
  type: "hero" | "hero-3d" | "section" | "grid" | "text" | "image" | "video" | "benefits" | "testimonials" | "faq" | "cta" | "pricing";
  visible: boolean;
  order: number;
  content: BlockContent;
}

type ViewMode = "desktop" | "tablet" | "mobile";
type MobileTab = "preview" | "blocks" | "settings";

// ================== GRADIENT PRESETS ==================
const GRADIENT_PRESETS = {
  "neon-purple-pink": {
    label: "Neon Purple-Pink",
    value: "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f472b6 100%)",
    css: "from-purple-600 via-pink-500 to-pink-400"
  },
  "cyan-orange-glow": {
    label: "Cyan-Orange Glow",
    value: "linear-gradient(135deg, #06b6d4 0%, #f97316 100%)",
    css: "from-cyan-500 to-orange-500"
  },
  "dark-cyber-neon": {
    label: "Dark Cyber Neon",
    value: "linear-gradient(135deg, #0f0f23 0%, #1e1b4b 50%, #06b6d4 100%)",
    css: "from-slate-950 via-indigo-950 to-cyan-500"
  },
  "sunset-fire": {
    label: "Sunset Fire",
    value: "linear-gradient(135deg, #ff0066 0%, #ff7f00 50%, #ffcc00 100%)",
    css: "from-pink-600 via-orange-500 to-yellow-400"
  },
  "ocean-deep": {
    label: "Ocean Deep",
    value: "linear-gradient(135deg, #0c1445 0%, #1e40af 50%, #06b6d4 100%)",
    css: "from-slate-900 via-blue-700 to-cyan-500"
  },
  "forest-glow": {
    label: "Forest Glow",
    value: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)",
    css: "from-emerald-900 via-emerald-600 to-emerald-500"
  }
} as const;

const COLOR_SCHEMES = {
  purple: "#9b87f5",
  cyan: "#00ffff",
  pink: "#ff0066",
  gold: "#fbbf24",
  neon: "#00ff88",
  sunset: "#ff6b6b"
} as const;

// ================== 3D COMPONENTS ==================
function FloatingDiamond({ color = "#ff0066" }: { color?: string }) {
  const meshRef = useRef<any>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          distort={0.2}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

function NeonParticles({ color = "#00ffff" }: { color?: string }) {
  return (
    <Sparkles
      count={100}
      scale={10}
      size={3}
      speed={0.5}
      color={color}
    />
  );
}

function MorphingSphere({ color = "#9b87f5" }: { color?: string }) {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} scale={1.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.7}
          distort={0.4}
          speed={3}
        />
      </mesh>
    </Float>
  );
}

function Scene3D({ effect = "particles", colorScheme = "purple" }: { effect?: string; colorScheme?: string }) {
  const color = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.purple;

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color={color} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#00ffff" intensity={0.5} />
      
      {effect === "diamond" && <FloatingDiamond color={color} />}
      {effect === "particles" && <NeonParticles color={color} />}
      {effect === "morphing-sphere" && <MorphingSphere color={color} />}
      {effect === "neon-ring" && (
        <>
          <NeonParticles color={color} />
          <FloatingDiamond color={color} />
        </>
      )}
      
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

// ================== MEDIA UTILITIES ==================
function detectMediaType(url: string): MediaType {
  if (!url) return 'image';
  const lowerUrl = url.toLowerCase();
  
  // Video files
  if (/\.(mp4|webm|ogg|mov|avi)($|\?)/.test(lowerUrl)) return 'video';
  
  // YouTube/Vimeo embeds
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(lowerUrl)) return 'embed';
  
  return 'image';
}

function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1&loop=1&rel=0`;
  
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`;
  
  return url;
}

// ================== MEDIA RENDERER COMPONENT ==================
function MediaBackground({ url, mediaType, className }: { url: string; mediaType?: MediaType; className?: string }) {
  const type = mediaType || detectMediaType(url);
  
  if (!url) return null;
  
  if (type === 'video') {
    return (
      <video
        src={url}
        className={cn("absolute inset-0 w-full h-full object-cover", className)}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }
  
  if (type === 'embed') {
    return (
      <iframe
        src={getEmbedUrl(url)}
        className={cn("absolute inset-0 w-full h-full border-0", className)}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }
  
  // Default: image via CSS background
  return (
    <div
      className={cn("absolute inset-0 bg-cover bg-center bg-no-repeat", className)}
      style={{ backgroundImage: `url(${url})` }}
    />
  );
}

// ================== SLIDESHOW LAYER COMPONENT ==================
function SlideshowLayer({ 
  slides, 
  interval, 
  transition = 'fade' 
}: { 
  slides: Hero3DSlide[]; 
  interval: number;
  transition?: SlideTransition;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, interval * 1000);
    
    return () => clearInterval(timer);
  }, [slides.length, interval]);

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return null;

  // Get transition variants based on type
  const getVariants = () => {
    switch (transition) {
      case 'slide':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 }
        };
      case 'zoom':
        return {
          initial: { scale: 1.2, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
      default: // fade
        return {
          initial: { opacity: 0, scale: 1.05 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 }
        };
    }
  };

  const variants = getVariants();
  const mediaType = currentSlide.mediaType || detectMediaType(currentSlide.imageUrl);

  return (
    <div className="absolute inset-0" style={{ zIndex: 2 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <MediaBackground 
            url={currentSlide.imageUrl} 
            mediaType={mediaType}
          />
          
          {/* Per-slide headlines */}
          {(currentSlide.headline || currentSlide.subheadline) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
              {currentSlide.headline && (
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg"
                  style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
                >
                  {currentSlide.headline}
                </motion.h2>
              )}
              {currentSlide.subheadline && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg md:text-xl text-white/90 drop-shadow-md"
                >
                  {currentSlide.subheadline}
                </motion.p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentIndex 
                  ? "w-6 bg-white" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}


const BlockPreview = React.memo(function BlockPreview({ block }: { block: Block }) {
  const ref = useRef<HTMLDivElement>(null);
  const content = block.content;
  const gsapTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    
    // Clear previous animations
    if (gsapTimelineRef.current) {
      gsapTimelineRef.current.kill();
    }
    
    // GSAP Animations based on preset
    if (content.gsapAnimationPreset === "fade-in") {
      gsapTimelineRef.current = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });
      gsapTimelineRef.current.from(element, {
        opacity: 0,
        y: 60,
        duration: 0.8,
        ease: "power2.out"
      });
    } else if (content.gsapAnimationPreset === "neon-pulse") {
      gsapTimelineRef.current = gsap.timeline({ repeat: -1 });
      gsapTimelineRef.current.to(element, {
        boxShadow: "0 0 40px rgba(255, 0, 102, 0.6), 0 0 80px rgba(0, 255, 255, 0.3)",
        duration: 1.5,
        ease: "sine.inOut"
      }).to(element, {
        boxShadow: "0 0 20px rgba(255, 0, 102, 0.3), 0 0 40px rgba(0, 255, 255, 0.15)",
        duration: 1.5,
        ease: "sine.inOut"
      });
    } else if (content.gsapAnimationPreset === "scroll-parallax") {
      const parallaxElement = element.querySelector('.parallax-content');
      if (parallaxElement) {
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
      }
    } else if (content.gsapAnimationPreset === "particle-float") {
      gsapTimelineRef.current = gsap.timeline({ repeat: -1, yoyo: true });
      gsapTimelineRef.current.to(element, {
        y: -10,
        duration: 2,
        ease: "sine.inOut"
      });
    }

    return () => {
      if (gsapTimelineRef.current) {
        gsapTimelineRef.current.kill();
      }
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === element) t.kill();
      });
    };
  }, [content.gsapAnimationPreset]);

  // Background style generation
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (content.backgroundType === "linear" && content.gradientPreset) {
      style.background = GRADIENT_PRESETS[content.gradientPreset]?.value;
    } else if (content.backgroundType === "radial" && content.gradientPreset) {
      style.background = GRADIENT_PRESETS[content.gradientPreset]?.value.replace("linear-gradient", "radial-gradient");
    } else if (content.backgroundColor) {
      style.backgroundColor = content.backgroundColor;
    }

    return style;
  };

  if (!block.visible) return null;

  // Get backgroundMode - default to 'effect' for backwards compatibility
  const backgroundMode = content.backgroundMode || 'effect';
  const hasImage = !!content.backgroundImage;
  const hasSlides = (content.slides?.length || 0) > 0;

  // Hero 3D Block - ARQUITECTURE FIX: Single stacking context with isolation
  if (block.type === "hero-3d" || block.type === "hero") {
    // Get color for 3D effects
    const effectColor = COLOR_SCHEMES[content.colorScheme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.purple;
    
    // Determine if we should show 3D effects based on backgroundMode
    const show3DEffects = block.type === "hero-3d" && (
      backgroundMode === 'effect' || 
      backgroundMode === 'effect-over-image' || 
      backgroundMode === 'effect-over-slideshow'
    );

    // Determine if we should show image
    const showImage = hasImage && (
      backgroundMode === 'image' || 
      backgroundMode === 'effect-over-image'
    );

    // Determine if we should show slideshow
    const showSlideshow = hasSlides && (
      backgroundMode === 'slideshow' ||
      backgroundMode === 'effect-over-slideshow'
    );
    
    return (
      <div 
        ref={ref} 
        className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] overflow-hidden"
        style={{ isolation: "isolate" }} // Creates single stacking context
      >
        {/* ===== LAYER 1: GRADIENT BASE (always present as foundation) ===== */}
        <div 
          className="absolute inset-0"
          style={{ 
            ...getBackgroundStyle(),
            zIndex: 1 
          }}
        />

        {/* ===== LAYER 2: BACKGROUND IMAGE OR SLIDESHOW (based on mode) ===== */}
        {showImage && (
          <div 
            className="absolute inset-0"
            style={{
              zIndex: 2,
              backgroundImage: `url(${content.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            }}
          />
        )}

        {/* ===== LAYER 2b: SLIDESHOW (if mode is slideshow or effect-over-slideshow) ===== */}
        {showSlideshow && content.slides && content.slides.length > 0 && (
          <SlideshowLayer 
            slides={content.slides} 
            interval={content.slideInterval || 5}
          />
        )}

        {/* ===== LAYER 3: DARK OVERLAY (adjustable 0-100%) ===== */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 3,
            backgroundColor: content.overlayColor || "#000000",
            opacity: (content.overlayOpacity ?? 50) / 100
          }}
        />

        {/* ===== LAYER 4: 3D CANVAS (based on backgroundMode) ===== */}
        {show3DEffects && (
          <div 
            className="absolute inset-0"
            style={{ 
              zIndex: 4,
              opacity: (content.effectOpacity ?? 100) / 100 
            }}
          >
            <Suspense fallback={
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-500/5" />
            }>
              <Canvas 
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{ alpha: true, antialias: true }}
                style={{ 
                  position: 'absolute',
                  inset: 0,
                  background: 'transparent',
                  pointerEvents: 'auto'
                }}
                dpr={[1, 2]}
              >
                <Scene3D 
                  effect={content.effect3D || "particles"} 
                  colorScheme={content.colorScheme || "purple"} 
                />
              </Canvas>
            </Suspense>
          </div>
        )}

        {/* ===== LAYER 5: CONTENT (TOPMOST, always visible) ===== */}
        <div 
          className={cn(
            "relative flex flex-col items-center justify-center w-full",
            "min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh]",
            "px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 lg:py-20",
            content.glassmorphism && "backdrop-blur-sm"
          )}
          style={{ 
            zIndex: 10,
            background: content.glassmorphism ? 'rgba(0,0,0,0.1)' : 'transparent'
          }}
        >
          <div className="parallax-content text-center max-w-5xl mx-auto w-full">
            <motion.h1 
              className={cn(
                "font-bold mb-3 sm:mb-4 md:mb-6 text-white",
                "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl",
                "leading-tight break-words hyphens-auto"
              )}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                textShadow: `0 0 60px ${effectColor}80, 0 4px 40px rgba(0,0,0,0.9), 0 0 120px ${effectColor}40`
              }}
            >
              {content.headline || "Título Principal"}
            </motion.h1>
            
            {content.subheadline && (
              <motion.p 
                className={cn(
                  "text-white/90 mb-4 sm:mb-6 md:mb-8",
                  "text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl",
                  "max-w-3xl mx-auto leading-relaxed break-words"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  textShadow: "0 2px 20px rgba(0,0,0,0.8)"
                }}
              >
                {content.subheadline}
              </motion.p>
            )}

            {content.showCTA && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Button 
                  size="lg"
                  className={cn(
                    "rounded-full font-bold",
                    "w-full sm:w-auto max-w-xs sm:max-w-none",
                    "px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6",
                    "text-sm sm:text-base md:text-lg",
                    "bg-gradient-to-r from-pink-600 to-orange-500",
                    "hover:from-pink-500 hover:to-orange-400",
                    "shadow-[0_0_30px_rgba(255,0,102,0.5)]",
                    "hover:shadow-[0_0_50px_rgba(255,0,102,0.7)]",
                    "transition-all duration-300 hover:scale-105",
                    "active:scale-100"
                  )}
                >
                  {content.ctaText || "COMEÇAR AGORA"}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Text Block
  if (block.type === "text") {
    return (
      <section ref={ref} className="py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div 
            className={cn(
              "prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert",
              content.alignment === "center" && "text-center",
              content.alignment === "right" && "text-right"
            )}
            dangerouslySetInnerHTML={{ __html: content.text || "<p>Adicione seu texto aqui...</p>" }}
          />
        </div>
      </section>
    );
  }

  // Benefits Block
  if (block.type === "benefits") {
    return (
      <section 
        ref={ref} 
        className={cn(
          "py-10 sm:py-12 md:py-16 lg:py-20",
          content.glassmorphism && "backdrop-blur-md bg-black/10"
        )}
        style={getBackgroundStyle()}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12">
            {content.title || "Benefícios"}
          </h2>
          <div className={cn(
            "grid gap-4 sm:gap-6 md:gap-8",
            content.columns === 2 ? "grid-cols-1 sm:grid-cols-2" : 
            content.columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : 
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {(content.items || []).map((item, i) => (
              <motion.div 
                key={i} 
                className={cn(
                  "text-center p-4 sm:p-5 md:p-6 rounded-xl",
                  "bg-card/50 backdrop-blur-sm border border-border/50",
                  "hover:bg-card/70 transition-colors duration-300"
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">{item.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default section
  return (
    <section ref={ref} className="py-8 sm:py-10 md:py-12" style={getBackgroundStyle()}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className={cn(
          "text-center p-4 sm:p-6 rounded-xl",
          content.glassmorphism && "backdrop-blur-md bg-black/10"
        )}>
          <p className="text-muted-foreground text-sm sm:text-base">Bloco: {block.type}</p>
        </div>
      </div>
    </section>
  );
});

// ================== BLOCK EDITOR PANEL ==================
const BlockEditorPanel = React.memo(function BlockEditorPanel({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  isExpanded,
  onToggleExpand
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const updateContent = useCallback((updates: Partial<BlockContent>) => {
    onUpdate({ content: { ...block.content, ...updates } });
  }, [block.content, onUpdate]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDuplicate();
  }, [onDuplicate]);

  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleVisibility();
  }, [onToggleVisibility]);

  const getBlockIcon = () => {
    switch (block.type) {
      case "hero-3d": return <SparklesIcon className="w-4 h-4 text-primary" />;
      case "hero": return <Layout className="w-4 h-4 text-primary" />;
      case "text": return <Type className="w-4 h-4 text-primary" />;
      case "image": return <Image className="w-4 h-4 text-primary" />;
      case "benefits": return <Star className="w-4 h-4 text-primary" />;
      case "testimonials": return <Users className="w-4 h-4 text-primary" />;
      case "cta": return <DollarSign className="w-4 h-4 text-primary" />;
      default: return <Grid3X3 className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Card className={cn(
      "mb-3 transition-all duration-200 overflow-hidden",
      !block.visible && "opacity-50 bg-muted/30"
    )}>
      {/* Block Header */}
      <CardHeader className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggleExpand}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {getBlockIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate capitalize">{block.type.replace("-", " ")}</p>
              <p className="text-xs text-muted-foreground truncate">
                {block.content.headline || block.content.title || "Sem título"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleToggleVisibility}
              title={block.visible ? "Ocultar" : "Mostrar"}
            >
              {block.visible ? <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleDuplicate}
              title="Duplicar"
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <div className="w-6 flex justify-center">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Settings */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="p-3 pt-0 border-t">
              <div className="space-y-4 pt-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
                {/* Hero Settings */}
                {(block.type === "hero" || block.type === "hero-3d") && (
                  <>
                    {/* Headline */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Título Principal</Label>
                      <Input
                        value={block.content.headline || ""}
                        onChange={(e) => updateContent({ headline: e.target.value })}
                        placeholder="Digite o título..."
                        className="text-sm sm:text-base h-9 sm:h-10"
                      />
                    </div>

                    {/* Subheadline */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Subtítulo</Label>
                      <Textarea
                        value={block.content.subheadline || ""}
                        onChange={(e) => updateContent({ subheadline: e.target.value })}
                        placeholder="Digite o subtítulo..."
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>

                    <Separator />

                    {/* Background Mode (for Hero-3D) */}
                    {block.type === "hero-3d" && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-2 block">Modo de Fundo</Label>
                        <div className="space-y-2">
                          {[
                            { value: "effect", label: "Apenas Efeito 3D", icon: SparklesIcon },
                            { value: "image", label: "Apenas Imagem", icon: Image },
                            { value: "effect-over-image", label: "3D + Imagem", icon: Layers, highlight: true },
                            { value: "slideshow", label: "Apenas Slides", icon: Layout },
                            { value: "effect-over-slideshow", label: "3D + Slides", icon: Grid3X3, highlight: true },
                          ].map(({ value, label, icon: Icon, highlight }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => updateContent({ backgroundMode: value as BackgroundMode })}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                                block.content.backgroundMode === value || (!block.content.backgroundMode && value === "effect")
                                  ? "bg-primary text-primary-foreground ring-2 ring-primary"
                                  : highlight 
                                    ? "bg-primary/10 border border-primary/30 hover:bg-primary/20"
                                    : "bg-muted/50 hover:bg-muted"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{label}</span>
                              {highlight && block.content.backgroundMode !== value && (
                                <Badge variant="outline" className="ml-auto text-[10px]">Combinado</Badge>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Background Type */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Tipo de Fundo</Label>
                      <Select
                        value={block.content.backgroundType}
                        onValueChange={(value: "solid" | "linear" | "radial") => 
                          updateContent({ backgroundType: value })
                        }
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Cor Sólida</SelectItem>
                          <SelectItem value="linear">Degradê Linear</SelectItem>
                          <SelectItem value="radial">Degradê Radial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gradient Presets */}
                    {(block.content.backgroundType === "linear" || block.content.backgroundType === "radial") && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-2 block">Preset de Degradê</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => updateContent({ gradientPreset: key as keyof typeof GRADIENT_PRESETS })}
                              className={cn(
                                "p-2.5 sm:p-3 rounded-lg text-left transition-all text-[10px] sm:text-xs",
                                "min-h-[44px] sm:min-h-[48px]",
                                block.content.gradientPreset === key
                                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                  : "ring-1 ring-border hover:ring-primary/50"
                              )}
                              style={{ background: preset.value }}
                            >
                              <span className="text-white font-medium drop-shadow-lg line-clamp-2">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Background Image */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Imagem de Fundo (URL)</Label>
                      <Input
                        value={block.content.backgroundImage || ""}
                        onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                        placeholder="https://..."
                        className="text-sm h-9 sm:h-10"
                      />
                      {block.content.backgroundImage && (
                        <div className="mt-2 rounded-lg overflow-hidden border aspect-video">
                          <img 
                            src={block.content.backgroundImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Overlay Opacity */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <Label className="text-xs sm:text-sm font-medium">Opacidade do Overlay</Label>
                        <Badge variant="secondary" className="text-xs">{block.content.overlayOpacity}%</Badge>
                      </div>
                      <Slider
                        value={[block.content.overlayOpacity]}
                        onValueChange={([value]) => updateContent({ overlayOpacity: value })}
                        min={0}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                    </div>

                    {/* Overlay Color */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Cor do Overlay</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={block.content.overlayColor || "#000000"}
                          onChange={(e) => updateContent({ overlayColor: e.target.value })}
                          className="w-12 h-9 sm:h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={block.content.overlayColor || "#000000"}
                          onChange={(e) => updateContent({ overlayColor: e.target.value })}
                          className="flex-1 text-sm h-9 sm:h-10"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Slides Editor (for slideshow modes) */}
                    {block.type === "hero-3d" && (block.content.backgroundMode === 'slideshow' || block.content.backgroundMode === 'effect-over-slideshow') && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-xs sm:text-sm font-medium">Slides</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const slides = block.content.slides || [];
                              updateContent({
                                slides: [...slides, { 
                                  id: Date.now().toString(), 
                                  imageUrl: "", 
                                  headline: "" 
                                }]
                              });
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Adicionar
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {(block.content.slides || []).map((slide, i) => (
                            <div key={slide.id} className="p-2 rounded-lg border bg-muted/30 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={slide.imageUrl}
                                  onChange={(e) => {
                                    const slides = [...(block.content.slides || [])];
                                    slides[i] = { ...slides[i], imageUrl: e.target.value };
                                    updateContent({ slides });
                                  }}
                                  placeholder="URL da imagem..."
                                  className="text-xs h-8 flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    const slides = (block.content.slides || []).filter((_, idx) => idx !== i);
                                    updateContent({ slides });
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              {slide.imageUrl && (
                                <img 
                                  src={slide.imageUrl} 
                                  alt={`Slide ${i + 1}`} 
                                  className="w-full h-16 object-cover rounded"
                                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                              )}
                            </div>
                          ))}
                          {(!block.content.slides || block.content.slides.length === 0) && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Adicione slides para criar um carrossel
                            </p>
                          )}
                        </div>
                        <div className="mt-2">
                          <Label className="text-xs font-medium mb-1 block">Intervalo (segundos)</Label>
                          <Input
                            type="number"
                            min={2}
                            max={15}
                            value={block.content.slideInterval || 5}
                            onChange={(e) => updateContent({ slideInterval: parseInt(e.target.value) || 5 })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Effect Opacity (for combined modes) */}
                    {block.type === "hero-3d" && (block.content.backgroundMode === 'effect-over-image' || block.content.backgroundMode === 'effect-over-slideshow') && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <Label className="text-xs sm:text-sm font-medium">Opacidade do Efeito 3D</Label>
                          <Badge variant="secondary" className="text-xs">{block.content.effectOpacity ?? 100}%</Badge>
                        </div>
                        <Slider
                          value={[block.content.effectOpacity ?? 100]}
                          onValueChange={([value]) => updateContent({ effectOpacity: value })}
                          min={10}
                          max={100}
                          step={5}
                          className="py-2"
                        />
                      </div>
                    )}

                    {/* 3D Effect (for hero-3d) */}
                    {block.type === "hero-3d" && (
                      <>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Efeito 3D</Label>
                          <Select
                            value={block.content.effect3D || "particles"}
                            onValueChange={(value: any) => updateContent({ effect3D: value })}
                          >
                            <SelectTrigger className="h-9 sm:h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="particles">Partículas</SelectItem>
                              <SelectItem value="diamond">Diamante Flutuante</SelectItem>
                              <SelectItem value="neon-ring">Anéis Neon + Partículas</SelectItem>
                              <SelectItem value="morphing-sphere">Esfera Morphing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs sm:text-sm font-medium mb-2 block">Esquema de Cores 3D</Label>
                          <div className="grid grid-cols-6 gap-2">
                            {(Object.entries(COLOR_SCHEMES) as [keyof typeof COLOR_SCHEMES, string][]).map(([scheme, color]) => (
                              <button
                                key={scheme}
                                type="button"
                                onClick={() => updateContent({ colorScheme: scheme })}
                                className={cn(
                                  "aspect-square rounded-full transition-all",
                                  "min-w-[32px] min-h-[32px]",
                                  block.content.colorScheme === scheme 
                                    ? "ring-2 ring-offset-2 ring-offset-background ring-white scale-110" 
                                    : "hover:scale-105"
                                )}
                                style={{ background: color }}
                                title={scheme}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* GSAP Animation */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Animação GSAP</Label>
                      <Select
                        value={block.content.gsapAnimationPreset}
                        onValueChange={(value: any) => updateContent({ gsapAnimationPreset: value })}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          <SelectItem value="fade-in">Fade In (Scroll)</SelectItem>
                          <SelectItem value="neon-pulse">Neon Pulse (Loop)</SelectItem>
                          <SelectItem value="particle-float">Float (Loop)</SelectItem>
                          <SelectItem value="scroll-parallax">Parallax (Scroll)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Glassmorphism */}
                    <div className="flex items-center justify-between py-1">
                      <Label className="text-xs sm:text-sm font-medium">Glassmorphism</Label>
                      <Switch
                        checked={block.content.glassmorphism}
                        onCheckedChange={(checked) => updateContent({ glassmorphism: checked })}
                      />
                    </div>

                    <Separator />

                    {/* CTA */}
                    <div className="flex items-center justify-between py-1">
                      <Label className="text-xs sm:text-sm font-medium">Mostrar Botão CTA</Label>
                      <Switch
                        checked={block.content.showCTA}
                        onCheckedChange={(checked) => updateContent({ showCTA: checked })}
                      />
                    </div>

                    {block.content.showCTA && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Texto do Botão</Label>
                        <Input
                          value={block.content.ctaText || ""}
                          onChange={(e) => updateContent({ ctaText: e.target.value })}
                          placeholder="COMEÇAR AGORA"
                          className="text-sm h-9 sm:h-10"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Text Block Settings */}
                {block.type === "text" && (
                  <>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Conteúdo</Label>
                      <Textarea
                        value={block.content.text || ""}
                        onChange={(e) => updateContent({ text: e.target.value })}
                        placeholder="Digite seu texto..."
                        rows={4}
                        className="text-sm resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Alinhamento</Label>
                      <Select
                        value={block.content.alignment || "left"}
                        onValueChange={(value: any) => updateContent({ alignment: value })}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Benefits Block Settings */}
                {block.type === "benefits" && (
                  <>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Título da Seção</Label>
                      <Input
                        value={block.content.title || ""}
                        onChange={(e) => updateContent({ title: e.target.value })}
                        placeholder="Benefícios"
                        className="text-sm h-9 sm:h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Colunas</Label>
                      <Select
                        value={String(block.content.columns || 3)}
                        onValueChange={(value) => updateContent({ columns: parseInt(value) })}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Colunas</SelectItem>
                          <SelectItem value="3">3 Colunas</SelectItem>
                          <SelectItem value="4">4 Colunas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Benefits Items Editor */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-xs sm:text-sm font-medium">Itens</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const items = block.content.items || [];
                            updateContent({
                              items: [...items, { title: "Novo Benefício", description: "Descrição aqui" }]
                            });
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(block.content.items || []).map((item, i) => (
                          <div key={i} className="p-2 rounded-lg border bg-muted/30 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={item.title}
                                onChange={(e) => {
                                  const items = [...(block.content.items || [])];
                                  items[i] = { ...items[i], title: e.target.value };
                                  updateContent({ items });
                                }}
                                placeholder="Título"
                                className="text-sm h-8"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const items = (block.content.items || []).filter((_, idx) => idx !== i);
                                  updateContent({ items });
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <Textarea
                              value={item.description}
                              onChange={(e) => {
                                const items = [...(block.content.items || [])];
                                items[i] = { ...items[i], description: e.target.value };
                                updateContent({ items });
                              }}
                              placeholder="Descrição"
                              rows={2}
                              className="text-xs resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
});

// ================== MAIN COMPONENT ==================
export default function ResponsiveSalesPageEditor() {
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      type: "hero-3d",
      visible: true,
      order: 0,
      content: {
        headline: "Transforme sua Vida Agora",
        subheadline: "Descubra o método que já ajudou milhares de pessoas a alcançarem seus objetivos",
        backgroundType: "linear",
        gradientPreset: "neon-purple-pink",
        backgroundImage: "",
        overlayOpacity: 40,
        overlayColor: "#000000",
        gsapAnimationPreset: "neon-pulse",
        glassmorphism: false,
        effect3D: "particles",
        colorScheme: "purple",
        showCTA: true,
        ctaText: "QUERO COMEÇAR AGORA"
      }
    },
    {
      id: "2",
      type: "benefits",
      visible: true,
      order: 1,
      content: {
        title: "Por que escolher nosso método?",
        backgroundType: "solid",
        overlayOpacity: 0,
        gsapAnimationPreset: "fade-in",
        glassmorphism: false,
        columns: 3,
        items: [
          { title: "Resultados Rápidos", description: "Veja mudanças reais em apenas 7 dias" },
          { title: "Suporte 24/7", description: "Estamos sempre aqui para ajudar você" },
          { title: "Garantia Total", description: "100% de satisfação ou seu dinheiro de volta" }
        ]
      }
    }
  ]);

  const [expandedBlockId, setExpandedBlockId] = useState<string | null>("1");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle block operations with toasts
  const handleUpdateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prev => {
      if (prev.length <= 1) {
        toast.error("Você precisa ter pelo menos um bloco!");
        return prev;
      }
      return prev.filter(b => b.id !== id);
    });
    toast.success("Bloco excluído!");
  }, []);

  const handleDuplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === id);
      if (!block) return prev;
      const newBlock: Block = {
        ...JSON.parse(JSON.stringify(block)),
        id: Date.now().toString(),
        order: prev.length
      };
      toast.success("Bloco duplicado!");
      return [...prev, newBlock];
    });
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => 
      b.id === id ? { ...b, visible: !b.visible } : b
    ));
    toast.success("Visibilidade alterada!");
  }, []);

  const handleAddBlock = useCallback((type: Block["type"]) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      visible: true,
      order: blocks.length,
      content: {
        headline: type.includes("hero") ? "Novo Título" : "",
        subheadline: type.includes("hero") ? "Novo subtítulo aqui" : "",
        backgroundType: "solid",
        overlayOpacity: 50,
        overlayColor: "#000000",
        gsapAnimationPreset: "fade-in",
        glassmorphism: false,
        effect3D: "particles",
        colorScheme: "purple",
        title: type === "benefits" ? "Benefícios" : "",
        columns: 3,
        items: type === "benefits" ? [
          { title: "Benefício 1", description: "Descrição aqui" }
        ] : []
      }
    };
    setBlocks(prev => [...prev, newBlock]);
    setExpandedBlockId(newBlock.id);
    setMobileTab("blocks");
    toast.success("Bloco adicionado!");
  }, [blocks.length]);

  const handleSave = useCallback(() => {
    console.log("Saving blocks:", blocks);
    toast.success("Página salva com sucesso!");
  }, [blocks]);

  // Preview width based on view mode
  const getPreviewStyle = (): React.CSSProperties => {
    switch (viewMode) {
      case "tablet": return { width: "768px", maxWidth: "100%" };
      case "mobile": return { width: "375px", maxWidth: "100%" };
      default: return { width: "100%", maxWidth: "100%" };
    }
  };

  // Block types for adding
  const BLOCK_TYPES = [
    { type: "hero-3d" as const, label: "Hero 3D", icon: SparklesIcon },
    { type: "hero" as const, label: "Hero", icon: Layout },
    { type: "text" as const, label: "Texto", icon: Type },
    { type: "benefits" as const, label: "Benefícios", icon: Star },
    { type: "testimonials" as const, label: "Depoimentos", icon: Users },
    { type: "cta" as const, label: "CTA", icon: DollarSign }
  ];

  return (
    <div className={cn(
      "flex flex-col bg-background",
      isFullscreen ? "fixed inset-0 z-50" : "h-screen"
    )}
    style={{ overflow: "hidden" }}
    >
      {/* ============ TOP BAR ============ */}
      <header className="h-12 sm:h-14 border-b bg-card/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 flex-shrink-0 gap-2 sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h1 className="font-semibold text-sm sm:text-lg truncate">Editor de Página</h1>
          <Badge variant="outline" className="hidden sm:flex text-xs shrink-0">
            {blocks.length} blocos
          </Badge>
        </div>

        {/* Device Preview Toggle - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {[
            { mode: "desktop" as ViewMode, icon: Monitor },
            { mode: "tablet" as ViewMode, icon: Tablet },
            { mode: "mobile" as ViewMode, icon: Smartphone }
          ].map(({ mode, icon: Icon }) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => setViewMode(mode)}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={handleSave} 
            size="sm"
            className="gap-1.5 h-8 sm:h-9 px-3 sm:px-4 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400"
          >
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </div>
      </header>

      {/* ============ MAIN CONTENT - FIXED ARCHITECTURE ============ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* ============ SIDEBAR - DESKTOP (Fluid width with scroll isolation) ============ */}
        <aside className="hidden lg:flex w-[280px] xl:w-[320px] 2xl:w-[360px] min-w-[260px] max-w-[400px] border-r bg-card flex-col shrink-0">
          {/* Add Block Buttons - Fixed */}
          <div className="p-3 border-b shrink-0 bg-card/95">
            <Label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wide">
              Adicionar Bloco
            </Label>
            <div className="grid grid-cols-3 gap-1.5">
              {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="flex-col h-auto py-2 gap-0.5 text-[10px] hover:bg-primary/10 hover:border-primary/50"
                  onClick={() => handleAddBlock(type)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate w-full text-center leading-tight">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Block List - Independent scroll */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
            <Label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wide sticky top-0 bg-card py-1 -mt-1">
              Blocos ({blocks.length})
            </Label>
            <div className="space-y-2">
              {blocks.map((block) => (
                <BlockEditorPanel
                  key={block.id}
                  block={block}
                  onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  onDelete={() => handleDeleteBlock(block.id)}
                  onDuplicate={() => handleDuplicateBlock(block.id)}
                  onToggleVisibility={() => handleToggleVisibility(block.id)}
                  isExpanded={expandedBlockId === block.id}
                  onToggleExpand={() => setExpandedBlockId(
                    expandedBlockId === block.id ? null : block.id
                  )}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ============ PREVIEW PANEL - DESKTOP (Independent scroll) ============ */}
        <main className="hidden lg:flex flex-1 bg-muted/30 flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <div 
              className="mx-auto bg-background rounded-xl shadow-2xl transition-all duration-300 border overflow-hidden"
              style={getPreviewStyle()}
            >
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                {blocks.filter(b => b.visible).map((block) => (
                  <BlockPreview key={block.id} block={block} />
                ))}
                {blocks.filter(b => b.visible).length === 0 && (
                  <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>Nenhum bloco visível</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ============ MOBILE/TABLET CONTENT (Improved architecture) ============ */}
        <div className="flex-1 lg:hidden flex flex-col min-h-0 overflow-hidden">
          {/* Mobile Tab Content - Independent scroll per tab */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Preview Tab */}
            {mobileTab === "preview" && (
              <div className="h-full overflow-y-auto overflow-x-hidden bg-muted/30 pb-4">
                <div className="min-h-full">
                  {blocks.filter(b => b.visible).map((block) => (
                    <BlockPreview key={block.id} block={block} />
                  ))}
                  {blocks.filter(b => b.visible).length === 0 && (
                    <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground p-4 text-center">
                      <div>
                        <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Nenhum bloco visível</p>
                        <p className="text-xs mt-1 opacity-60">Adicione blocos na aba "Blocos"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blocks Tab */}
            {mobileTab === "blocks" && (
              <div className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 pb-6">
                {/* Add Block Grid - Compact for mobile */}
                <div className="mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 -mt-2 z-10">
                  <Label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wide">
                    Adicionar Bloco
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2.5 gap-1 text-[10px] min-h-[60px]"
                        onClick={() => handleAddBlock(type)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate w-full text-center leading-tight">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* Block List */}
                <Label className="text-xs font-medium mb-3 block text-muted-foreground uppercase tracking-wide">
                  Blocos ({blocks.length})
                </Label>
                <div className="space-y-2 pb-4">
                  {blocks.map((block) => (
                    <BlockEditorPanel
                      key={block.id}
                      block={block}
                      onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                      onDelete={() => handleDeleteBlock(block.id)}
                      onDuplicate={() => handleDuplicateBlock(block.id)}
                      onToggleVisibility={() => handleToggleVisibility(block.id)}
                      isExpanded={expandedBlockId === block.id}
                      onToggleExpand={() => setExpandedBlockId(
                        expandedBlockId === block.id ? null : block.id
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {mobileTab === "settings" && (
              <div className="h-full overflow-y-auto p-3 sm:p-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Configurações Globais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Tema de Cores</Label>
                      <Select defaultValue="dark">
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Dark Neon</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="cyber">Cyberpunk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Fonte Principal</Label>
                      <Select defaultValue="inter">
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inter">Inter</SelectItem>
                          <SelectItem value="poppins">Poppins</SelectItem>
                          <SelectItem value="montserrat">Montserrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Device Preview (Mobile) */}
                    <div>
                      <Label className="text-xs sm:text-sm font-medium mb-2 block">Preview por Dispositivo</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { mode: "desktop" as ViewMode, icon: Monitor, label: "Desktop" },
                          { mode: "tablet" as ViewMode, icon: Tablet, label: "Tablet" },
                          { mode: "mobile" as ViewMode, icon: Smartphone, label: "Mobile" }
                        ].map(({ mode, icon: Icon, label }) => (
                          <Button
                            key={mode}
                            variant={viewMode === mode ? "secondary" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-3 gap-1"
                            onClick={() => {
                              setViewMode(mode);
                              setMobileTab("preview");
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ MOBILE TAB BAR ============ */}
      <nav className="h-16 sm:h-20 border-t bg-card flex items-center justify-around lg:hidden flex-shrink-0 px-2 pb-safe">
        {[
          { tab: "preview" as MobileTab, icon: Eye, label: "Preview" },
          { tab: "blocks" as MobileTab, icon: Layers, label: "Blocos" },
          { tab: "settings" as MobileTab, icon: Settings2, label: "Config" }
        ].map(({ tab, icon: Icon, label }) => (
          <Button
            key={tab}
            variant={mobileTab === tab ? "secondary" : "ghost"}
            className={cn(
              "flex-col h-auto py-2 px-3 sm:px-5 gap-1 rounded-xl transition-all",
              mobileTab === tab && "bg-primary/10 text-primary"
            )}
            onClick={() => setMobileTab(tab)}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[10px] sm:text-xs font-medium">{label}</span>
          </Button>
        ))}
        <Button
          className={cn(
            "flex-col h-auto py-2 px-3 sm:px-5 gap-1 rounded-xl",
            "bg-gradient-to-r from-pink-600 to-orange-500",
            "hover:from-pink-500 hover:to-orange-400",
            "shadow-lg shadow-pink-500/25"
          )}
          onClick={handleSave}
        >
          <Save className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-[10px] sm:text-xs font-medium">Salvar</span>
        </Button>
      </nav>
    </div>
  );
}
