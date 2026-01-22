import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Shopping-themed neon particles
const ShopParticles = ({ count = 250 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const neonColors = [
      [1, 0.3, 0.8],   // Pink
      [0, 0.9, 1],     // Cyan
      [1, 0.5, 0],     // Orange
    ];
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 5;
      
      const colorChoice = neonColors[Math.floor(Math.random() * neonColors.length)];
      colors[i * 3] = colorChoice[0];
      colors[i * 3 + 1] = colorChoice[1];
      colors[i * 3 + 2] = colorChoice[2];
    }
    
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(time * 0.4 + i * 0.15) * 0.003;
      positions[i * 3] += Math.cos(time * 0.25 + i * 0.12) * 0.002;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = time * 0.015;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Product Box with morphing effect
const MorphingProductBox = ({ 
  position = [0, 0, 0] as [number, number, number],
  color = '#ff4d9d'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = Math.sin(time * 0.4) * 0.2;
    meshRef.current.rotation.y = time * 0.3;
    meshRef.current.position.y = position[1] + Math.sin(time * 0.6 + position[0]) * 0.2;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={0.8}>
        <boxGeometry args={[1, 1, 1]} />
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.5}
          speed={2.5}
          roughness={0.1}
          metalness={0.9}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.2}
        />
      </mesh>
    </Float>
  );
};

// Pulsing shopping ring
const ShoppingRing = ({ 
  radius = 3, 
  color = '#ff4d9d', 
  position = [0, 0, 0] as [number, number, number] 
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const time = state.clock.elapsedTime;
    ringRef.current.rotation.x = Math.sin(time * 0.25) * 0.4;
    ringRef.current.rotation.y = time * 0.15;
    
    const scale = 1 + Math.sin(time * 2) * 0.05;
    ringRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, 0.03, 20, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={ringRef.current?.rotation}>
        <torusGeometry args={[radius, 0.12, 20, 100]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Undulating sphere with shader distortion
const WavySphere = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#00d4ff',
  scale = 1.2
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.12;
    meshRef.current.rotation.y = time * 0.18;
  });

  const adjustedScale = Math.min(viewport.width / 6, scale);

  return (
    <mesh ref={meshRef} position={position} scale={adjustedScale}>
      <sphereGeometry args={[1, 48, 48]} />
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={0.7}
        speed={3.5}
        roughness={0}
        metalness={1}
        emissive={color}
        emissiveIntensity={0.35}
        transparent
        opacity={0.12}
      />
    </mesh>
  );
};

// Floating product gems
const ProductGem = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#ff4d9d', 
  scale = 0.35 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.9;
    meshRef.current.rotation.x = Math.sin(time * 0.6) * 0.25;
    meshRef.current.position.y = position[1] + Math.sin(time * 1.2 + position[0]) * 0.25;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.95}
        roughness={0.05}
      />
    </mesh>
  );
};

// Main scene content
const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[12, 10, 8]} intensity={1.8} color="#ff4d9d" />
      <pointLight position={[-10, -8, -10]} intensity={1} color="#00d4ff" />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#ff8800" />
      
      <ShopParticles count={280} />
      
      {/* Morphing background elements */}
      <WavySphere position={[-4, 1, -6]} color="#ff4d9d" scale={1.8} />
      <WavySphere position={[4, -1, -7]} color="#00d4ff" scale={2.2} />
      <WavySphere position={[0, 2, -8]} color="#ff8800" scale={2} />
      
      <MorphingProductBox position={[-2, 0, -4]} color="#ff4d9d" />
      <MorphingProductBox position={[2, 1, -5]} color="#00d4ff" />
      <MorphingProductBox position={[0, -1, -3]} color="#ff8800" />
      
      <ShoppingRing radius={4.5} color="#ff4d9d" position={[0, 0, -4]} />
      <ShoppingRing radius={3.2} color="#00d4ff" position={[0, 0, -3]} />
      <ShoppingRing radius={2.5} color="#ff8800" position={[0, 0, -2]} />
      
      <Float speed={2.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <ProductGem position={[-5, 2, -2]} color="#ff4d9d" scale={0.4} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.7}>
        <ProductGem position={[5, -1, -3]} color="#00d4ff" scale={0.35} />
      </Float>
      <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <ProductGem position={[-4, -2, -1]} color="#ff8800" scale={0.3} />
      </Float>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
        <ProductGem position={[4, 2, -2]} color="#ff4d9d" scale={0.38} />
      </Float>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.6}>
        <ProductGem position={[0, 3, -3]} color="#00d4ff" scale={0.32} />
      </Float>
    </>
  );
};

export const ShopHeroScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};
