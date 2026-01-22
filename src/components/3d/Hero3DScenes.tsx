import { useRef, useMemo, Suspense, useState, useEffect, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Trail, Stars, Sparkles, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { WebGLContextHandler } from './WebGLContextHandler';

// ============ COLOR SCHEMES ============
const COLOR_SCHEMES = {
  purple: { primary: '#9b87f5', secondary: '#7c3aed', accent: '#d946ef', bg: 'from-purple-900/40 to-violet-950/60' },
  cyan: { primary: '#22d3ee', secondary: '#06b6d4', accent: '#0ea5e9', bg: 'from-cyan-900/40 to-blue-950/60' },
  pink: { primary: '#f472b6', secondary: '#ec4899', accent: '#f43f5e', bg: 'from-pink-900/40 to-rose-950/60' },
  gold: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#ea580c', bg: 'from-amber-900/40 to-orange-950/60' },
  neon: { primary: '#00ff88', secondary: '#00ffff', accent: '#ff00ff', bg: 'from-emerald-900/40 to-teal-950/60' },
  sunset: { primary: '#ff6b6b', secondary: '#feca57', accent: '#ff9ff3', bg: 'from-red-900/40 to-orange-950/60' },
};

// Extended effect types to match types.ts
export type Hero3DEffect = 'particles' | 'space' | 'waves' | 'neon' | 'diamond' | 'neon-ring' | 'morphing-sphere' | 'neon-grid';
export type ColorScheme = keyof typeof COLOR_SCHEMES;

// ============ ERROR BOUNDARY FOR WEBGL ============
interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[Hero3DScenes] WebGL error caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Mobile detection helper
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}

// ============ EFFECT 1: PARTICLES (Similar to Homepage) ============
function NeonParticles({ color, count = 150, isMobile = false }: { color: string; count?: number; isMobile?: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { pointer } = useThree();
  // Reduce particles on mobile for better performance
  const actualCount = isMobile ? Math.min(count, 80) : count;

  const particles = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const colors = new Float32Array(actualCount * 3);
    const sizes = new Float32Array(actualCount);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < actualCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
      sizes[i] = Math.random() * 0.08 + 0.02;
    }
    return { positions, colors, sizes };
  }, [actualCount, color]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.03;
    ref.current.rotation.x += delta * 0.01;
    ref.current.position.x = pointer.x * 0.4;
    ref.current.position.y = pointer.y * 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

function GlowRings({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
      if (!ref.current) return;
      ref.current.rotation.x = Math.sin(t * (0.3 - i * 0.05)) * 0.3;
      ref.current.rotation.y = t * (0.2 - i * 0.03);
      ref.current.position.x = pointer.x * (0.5 - i * 0.1);
      ref.current.position.y = pointer.y * (0.3 - i * 0.05);
    });
  });

  return (
    <>
      <mesh ref={ring1Ref}><torusGeometry args={[2, 0.02, 16, 100]} /><meshBasicMaterial color={colors.primary} transparent opacity={0.7} /></mesh>
      <mesh ref={ring2Ref}><torusGeometry args={[2.5, 0.015, 16, 100]} /><meshBasicMaterial color={colors.secondary} transparent opacity={0.5} /></mesh>
      <mesh ref={ring3Ref}><torusGeometry args={[3, 0.01, 16, 100]} /><meshBasicMaterial color={colors.accent} transparent opacity={0.4} /></mesh>
    </>
  );
}

function MorphingSphere({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.1;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });

  const scale = Math.min(viewport.width, viewport.height) * 0.12;

  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.4} distort={0.5} speed={2} metalness={0.3} roughness={0.2} />
    </mesh>
  );
}

function FloatingGems({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.6}>
        <mesh position={[-2.5, 1.2, 0]}>
          <octahedronGeometry args={[0.35]} />
          <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.6} metalness={0.9} roughness={0.1} />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.5}>
        <mesh position={[2.8, -0.8, -1]}>
          <octahedronGeometry args={[0.25]} />
          <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.4}>
        <mesh position={[-1.8, -1.5, 1]}>
          <octahedronGeometry args={[0.3]} />
          <meshStandardMaterial color={colors.secondary} emissive={colors.secondary} emissiveIntensity={0.5} metalness={0.85} roughness={0.15} />
        </mesh>
      </Float>
    </>
  );
}

function ParticlesScene({ colorScheme, isMobile = false }: { colorScheme: ColorScheme; isMobile?: boolean }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color={colors.primary} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={colors.accent} />
      <NeonParticles color={colors.primary} count={isMobile ? 100 : 180} isMobile={isMobile} />
      <MorphingSphere color={colors.secondary} />
      <GlowRings colors={colors} />
      {!isMobile && <FloatingGems colors={colors} />}
    </>
  );
}

// ============ EFFECT 2: SPACE ============
function Asteroid({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * speed;
    meshRef.current.rotation.y = time * speed * 0.7;
    meshRef.current.position.x = position[0] + Math.sin(time * speed * 0.5) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#5a5a6a" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function Planet({ position, color, size }: { position: [number, number, number]; color: string; size: number }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <Float speed={0.5} floatIntensity={0.3}>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.2} distort={0.2} speed={1} />
      </mesh>
    </Float>
  );
}

function SpaceScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  const asteroids = useMemo(() => {
    const items = [];
    for (let i = 0; i < 20; i++) {
      items.push({
        position: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10 - 5] as [number, number, number],
        scale: Math.random() * 0.2 + 0.08,
        speed: Math.random() * 0.4 + 0.15,
      });
    }
    return items;
  }, []);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color={colors.primary} />
      <Stars radius={50} depth={50} count={2000} factor={4} fade speed={0.5} />
      <Sparkles count={100} scale={15} size={3} speed={0.3} color={colors.accent} />
      {asteroids.map((asteroid, i) => <Asteroid key={i} {...asteroid} />)}
      <Planet position={[-3, 1, -3]} color={colors.primary} size={0.8} />
      <Planet position={[4, -1, -5]} color={colors.secondary} size={0.5} />
    </>
  );
}

// ============ EFFECT 3: WAVES ============
function WaveMesh({ color, offset = 0 }: { color: string; offset?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = -0.5 + pointer.y * 0.1;
    ref.current.rotation.z = pointer.x * 0.1;
    (ref.current.material as any).uniforms && ((ref.current.material as any).time = state.clock.elapsedTime);
  });

  return (
    <mesh ref={ref} position={[0, offset, 0]} rotation={[-0.5, 0, 0]}>
      <planeGeometry args={[12, 12, 64, 64]} />
      <MeshWobbleMaterial color={color} factor={0.4} speed={2} transparent opacity={0.6} />
    </mesh>
  );
}

function WavesScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 5]} intensity={1} color={colors.primary} />
      <WaveMesh color={colors.primary} offset={-1} />
      <WaveMesh color={colors.secondary} offset={-1.5} />
      <WaveMesh color={colors.accent} offset={-2} />
      <Sparkles count={50} scale={10} size={2} speed={0.2} color={colors.accent} opacity={0.5} />
    </>
  );
}

// ============ EFFECT 4: NEON ============
function NeonLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 2 + start[0]) * 0.1;
  });

  const midpoint: [number, number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
  const length = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

  return (
    <mesh ref={ref} position={midpoint} rotation={[0, 0, angle]}>
      <boxGeometry args={[length, 0.05, 0.05]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

function NeonGrid({ color }: { color: string }) {
  const lines = useMemo(() => {
    const result = [];
    for (let i = -5; i <= 5; i++) {
      result.push({ start: [i, -3, 0] as [number, number, number], end: [i, 3, 0] as [number, number, number] });
      result.push({ start: [-5, i * 0.6, 0] as [number, number, number], end: [5, i * 0.6, 0] as [number, number, number] });
    }
    return result;
  }, []);

  return (
    <group rotation={[-0.5, 0, 0]} position={[0, -2, -3]}>
      {lines.map((line, i) => <NeonLine key={i} {...line} color={color} />)}
    </group>
  );
}

function NeonCube({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.3 + pointer.y * 0.5;
    ref.current.rotation.y = state.clock.elapsedTime * 0.4 + pointer.x * 0.5;
  });

  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <mesh ref={ref}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
      </mesh>
    </Float>
  );
}

function NeonScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 3, 3]} intensity={1} color={colors.primary} />
      <pointLight position={[-3, -2, 2]} intensity={0.5} color={colors.accent} />
      <NeonGrid color={colors.primary} />
      <NeonCube color={colors.accent} />
      <Sparkles count={60} scale={12} size={2} speed={0.3} color={colors.secondary} />
    </>
  );
}

// ============ EFFECT 5: DIAMOND (NEW) ============
function DiamondGem({ color, position = [0, 0, 0] }: { color: string; position?: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.5 + pointer.x * 0.3;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
  });
  
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={ref} position={position}>
        <octahedronGeometry args={[1.2, 0]} />
        <MeshDistortMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.6}
          distort={0.15}
          speed={2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function DiamondScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color={colors.primary} />
      <pointLight position={[-5, -5, -5]} intensity={0.6} color={colors.accent} />
      <DiamondGem color={colors.primary} position={[0, 0, 0]} />
      <NeonParticles color={colors.secondary} count={100} />
      <Sparkles count={80} scale={10} size={3} speed={0.4} color={colors.accent} />
    </>
  );
}

// ============ EFFECT 6: NEON RING (NEW) ============
function NeonRingEffect({ colors }: { colors: { primary: string; secondary: string; accent: string } }) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = Math.sin(t * 0.4) * 0.5;
      ring1.current.rotation.y = t * 0.3;
    }
    if (ring2.current) {
      ring2.current.rotation.x = Math.cos(t * 0.3) * 0.4;
      ring2.current.rotation.z = t * 0.25;
    }
    if (ring3.current) {
      ring3.current.rotation.y = Math.sin(t * 0.5) * 0.6;
      ring3.current.rotation.x = t * 0.2;
    }
  });
  
  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[2, 0.05, 16, 100]} />
        <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.5, 0.04, 16, 100]} />
        <meshStandardMaterial color={colors.secondary} emissive={colors.secondary} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[3, 0.03, 16, 100]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}

function NeonRingScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 5]} intensity={1} color={colors.primary} />
      <NeonRingEffect colors={colors} />
      <MorphingSphere color={colors.accent} />
      <Sparkles count={100} scale={12} size={2} speed={0.3} color={colors.secondary} />
    </>
  );
}

// ============ EFFECT 7: MORPHING SPHERE SCENE (NEW) ============
function MorphingSphereScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color={colors.primary} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={colors.accent} />
      <Float speed={1} rotationIntensity={0.2}>
        <mesh scale={1.8}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial 
            color={colors.primary} 
            emissive={colors.primary} 
            emissiveIntensity={0.5}
            distort={0.6}
            speed={3}
            metalness={0.4}
            roughness={0.2}
          />
        </mesh>
      </Float>
      <NeonParticles color={colors.secondary} count={120} />
      <FloatingGems colors={colors} />
    </>
  );
}

// ============ EFFECT 8: NEON GRID SCENE (Enhanced) ============
function NeonGridScene({ colorScheme }: { colorScheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[colorScheme];
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 5, 5]} intensity={1.2} color={colors.primary} />
      <pointLight position={[-5, -3, 3]} intensity={0.6} color={colors.accent} />
      <NeonGrid color={colors.primary} />
      <NeonCube color={colors.accent} />
      <Float speed={2} floatIntensity={0.3}>
        <mesh position={[2, 1, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={colors.secondary} emissive={colors.secondary} emissiveIntensity={0.6} wireframe />
        </mesh>
      </Float>
      <Sparkles count={80} scale={15} size={2} speed={0.4} color={colors.secondary} />
    </>
  );
}

// ============ MAIN COMPONENT ============
interface Hero3DScenesProps {
  effect: Hero3DEffect;
  colorScheme: ColorScheme;
  className?: string;
  transparentBackground?: boolean;
}

function SceneContent({ effect, colorScheme, isMobile }: { effect: Hero3DEffect; colorScheme: ColorScheme; isMobile: boolean }) {
  switch (effect) {
    case 'particles':
      return <ParticlesScene colorScheme={colorScheme} isMobile={isMobile} />;
    case 'space':
      return <SpaceScene colorScheme={colorScheme} />;
    case 'waves':
      return <WavesScene colorScheme={colorScheme} />;
    case 'neon':
      return <NeonScene colorScheme={colorScheme} />;
    case 'diamond':
      return <DiamondScene colorScheme={colorScheme} />;
    case 'neon-ring':
      return <NeonRingScene colorScheme={colorScheme} />;
    case 'morphing-sphere':
      return <MorphingSphereScene colorScheme={colorScheme} />;
    case 'neon-grid':
      return <NeonGridScene colorScheme={colorScheme} />;
    default:
      return <ParticlesScene colorScheme={colorScheme} isMobile={isMobile} />;
  }
}

// Animated fallback gradient for when WebGL fails
function AnimatedFallback({ colorScheme }: { colorScheme: ColorScheme }) {
  const bgGradient = COLOR_SCHEMES[colorScheme]?.bg || COLOR_SCHEMES.purple.bg;
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} animate-pulse`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(155,135,245,0.3)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.2)_0%,transparent_50%)]" />
    </div>
  );
}

export default function Hero3DScenes({ 
  effect = 'particles', 
  colorScheme = 'purple', 
  className = '',
  transparentBackground = false 
}: Hero3DScenesProps) {
  const bgGradient = COLOR_SCHEMES[colorScheme]?.bg || COLOR_SCHEMES.purple.bg;
  const [webglSupported, setWebglSupported] = useState(true);
  const isMobile = useIsMobile();
  
  // Check WebGL support on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);
  
  // Background class - no gradient when transparent, remove -z-10 for proper stacking
  const bgClass = transparentBackground ? '' : `bg-gradient-to-br ${bgGradient}`;
  
  // If WebGL not supported, show animated fallback
  if (!webglSupported) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        {!transparentBackground && <AnimatedFallback colorScheme={colorScheme} />}
      </div>
    );
  }
  
  return (
    <div className={`absolute inset-0 ${bgClass} ${className}`}>
      <WebGLErrorBoundary fallback={!transparentBackground ? <AnimatedFallback colorScheme={colorScheme} /> : null}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ 
            antialias: !isMobile, // Disable antialiasing on mobile for performance
            alpha: true, 
            powerPreference: isMobile ? 'low-power' : 'high-performance' 
          }}
          style={{ background: 'transparent' }}
          dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower DPR on mobile
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <WebGLContextHandler />
          <Suspense fallback={null}>
            <SceneContent effect={effect} colorScheme={colorScheme} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

export { COLOR_SCHEMES };
