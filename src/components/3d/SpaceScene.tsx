import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Stars, 
  Sparkles,
  Float,
  Trail,
  useTexture,
  Sphere
} from '@react-three/drei';
import * as THREE from 'three';

// Asteroid component
const Asteroid = ({ position, scale, speed }: { position: [number, number, number], scale: number, speed: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * speed;
    meshRef.current.rotation.y = time * speed * 0.7;
    meshRef.current.position.x = position[0] + Math.sin(time * speed * 0.5) * 0.5;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#4a4a5a"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};

// Asteroid field
const AsteroidField = () => {
  const asteroids = useMemo(() => {
    const items = [];
    for (let i = 0; i < 30; i++) {
      items.push({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20 - 5
        ] as [number, number, number],
        scale: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.5 + 0.2
      });
    }
    return items;
  }, []);

  return (
    <>
      {asteroids.map((asteroid, i) => (
        <Asteroid key={i} {...asteroid} />
      ))}
    </>
  );
};

// Rocket component
const Rocket = () => {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Follow mouse with damping
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      mouse.y * 0.3,
      0.05
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      -mouse.x * 0.3,
      0.05
    );
    
    // Floating animation
    groupRef.current.position.y = Math.sin(time * 2) * 0.2;
    
    // Flame animation
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(time * 20) * 0.2;
      flameRef.current.scale.x = 1 + Math.sin(time * 15) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
      <Trail
        width={2}
        length={8}
        color="#ff4d9d"
        attenuation={(t) => t * t}
      >
        <group ref={groupRef}>
          {/* Rocket body */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 2, 8]} />
            <meshStandardMaterial 
              color="#e0e0e0"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          
          {/* Rocket nose */}
          <mesh position={[0, 1.3, 0]}>
            <coneGeometry args={[0.3, 0.8, 8]} />
            <meshStandardMaterial 
              color="#ff4d9d"
              metalness={0.9}
              roughness={0.1}
              emissive="#ff4d9d"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Window */}
          <mesh position={[0, 0.3, 0.35]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
              color="#00d4ff"
              metalness={1}
              roughness={0}
              emissive="#00d4ff"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Fins */}
          {[0, 120, 240].map((angle, i) => (
            <mesh 
              key={i}
              position={[
                Math.sin(angle * Math.PI / 180) * 0.5,
                -0.8,
                Math.cos(angle * Math.PI / 180) * 0.5
              ]}
              rotation={[0, -angle * Math.PI / 180, 0]}
            >
              <boxGeometry args={[0.1, 0.5, 0.3]} />
              <meshStandardMaterial 
                color="#ff4d9d"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
          
          {/* Flame */}
          <mesh ref={flameRef} position={[0, -1.5, 0]}>
            <coneGeometry args={[0.3, 1, 8]} />
            <meshBasicMaterial 
              color="#ff8c00"
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Inner flame */}
          <mesh position={[0, -1.3, 0]}>
            <coneGeometry args={[0.15, 0.6, 8]} />
            <meshBasicMaterial 
              color="#ffff00"
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Glow */}
          <pointLight position={[0, -1.5, 0]} color="#ff8c00" intensity={2} distance={5} />
        </group>
      </Trail>
    </Float>
  );
};

// Nebula background
const Nebula = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.02;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial 
        color="#1a0a2e"
        transparent
        opacity={0.5}
      />
    </mesh>
  );
};

// Particle trail that follows mouse clicks
const ClickParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return positions;
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    particlesRef.current.position.x = mouse.x * viewport.width / 2;
    particlesRef.current.position.y = mouse.y * viewport.height / 2;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ff4d9d"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const SceneContent = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#ff4d9d" intensity={1} />
      <pointLight position={[-10, -10, 10]} color="#00d4ff" intensity={0.8} />
      <directionalLight position={[0, 5, 5]} intensity={0.5} />
      
      {/* Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
      <Nebula />
      
      {/* Sparkles */}
      <Sparkles count={200} scale={15} size={2} speed={0.3} color="#ff4d9d" />
      <Sparkles count={100} scale={15} size={1.5} speed={0.2} color="#00d4ff" />
      
      {/* Main elements */}
      <Rocket />
      <AsteroidField />
      <ClickParticles />
    </>
  );
};

interface SpaceSceneProps {
  className?: string;
}

export const SpaceScene = ({ className }: SpaceSceneProps) => {
  return (
    <div className={className}>
      <Canvas
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 8], fov: 50 }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
};
