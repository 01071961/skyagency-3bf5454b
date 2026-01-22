import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface SceneProps {
  colorScheme: 'purple' | 'cyan' | 'pink' | 'gold';
  showParticles: boolean;
  showGlowRings: boolean;
}

const COLOR_SCHEMES = {
  purple: { primary: '#9b87f5', secondary: '#7c3aed', accent: '#d946ef' },
  cyan: { primary: '#22d3ee', secondary: '#06b6d4', accent: '#0ea5e9' },
  pink: { primary: '#f472b6', secondary: '#ec4899', accent: '#f43f5e' },
  gold: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#ea580c' },
};

function NeonParticles({ color, count = 100 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { viewport, pointer } = useThree();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    return { positions, colors };
  }, [count, color]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.05;
    ref.current.position.x = pointer.x * 0.3;
    ref.current.position.y = pointer.y * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function GlowRing({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.2;
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
    ref.current.position.x = pointer.x * 0.5;
    ref.current.position.y = pointer.y * 0.3;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

function FloatingGem({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.3;
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
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

  const scale = Math.min(viewport.width, viewport.height) * 0.15;

  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        distort={0.4}
        speed={2}
        metalness={0.2}
        roughness={0.3}
      />
    </mesh>
  );
}

function SceneContent({ colorScheme, showParticles, showGlowRings }: SceneProps) {
  const colors = COLOR_SCHEMES[colorScheme];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color={colors.primary} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={colors.accent} />

      {showParticles && <NeonParticles color={colors.primary} count={120} />}
      
      <MorphingSphere color={colors.secondary} />

      {showGlowRings && (
        <>
          <GlowRing radius={1.8} color={colors.primary} speed={0.3} />
          <GlowRing radius={2.2} color={colors.accent} speed={0.2} />
          <GlowRing radius={2.6} color={colors.secondary} speed={0.15} />
        </>
      )}

      <FloatingGem position={[-2, 1, 0]} color={colors.accent} />
      <FloatingGem position={[2.5, -0.5, -1]} color={colors.primary} />
      <FloatingGem position={[-1.5, -1.2, 1]} color={colors.secondary} />
    </>
  );
}

interface SalesHero3DSceneProps extends Partial<SceneProps> {
  className?: string;
}

export default function SalesHero3DScene({
  colorScheme = 'purple',
  showParticles = true,
  showGlowRings = true,
  className = '',
}: SalesHero3DSceneProps) {
  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <SceneContent
          colorScheme={colorScheme}
          showParticles={showParticles}
          showGlowRings={showGlowRings}
        />
      </Canvas>
    </div>
  );
}
