import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Neon Particles floating around
const NeonParticles = ({ count = 200 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const neonColors = [
      [1, 0.3, 0.6],   // Pink
      [0, 0.83, 1],    // Cyan
      [0.6, 0.3, 1],   // Purple
    ];
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
      
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
      positions[i * 3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.002;
      positions[i * 3] += Math.cos(time * 0.3 + i * 0.1) * 0.001;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = time * 0.02;
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Glowing rings
const GlowRing = ({ radius = 3, color = '#ff4d9d', position = [0, 0, 0] as [number, number, number] }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const time = state.clock.elapsedTime;
    ringRef.current.rotation.x = Math.sin(time * 0.3) * 0.3;
    ringRef.current.rotation.y = time * 0.2;
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={ringRef.current?.rotation}>
        <torusGeometry args={[radius, 0.1, 16, 100]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Floating diamonds
const FloatingGem = ({ position = [0, 0, 0] as [number, number, number], color = '#ff4d9d', scale = 0.3 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.8;
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.3;
    meshRef.current.position.y = position[1] + Math.sin(time + position[0]) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
};

// Morphing Text with WebGL Distortion
const MorphingText = ({ position = [0, 1, 0] as [number, number, number] }) => {
  const textRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  useFrame((state) => {
    if (!textRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Subtle wave motion
    textRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1;
    textRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
    textRef.current.rotation.y = Math.sin(time * 0.2) * 0.02;
  });

  // Responsive scale based on viewport
  const scale = Math.min(viewport.width / 8, 0.5);

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={textRef} position={position} scale={scale}>
        <sphereGeometry args={[2, 64, 64]} />
        <MeshDistortMaterial
          color="#ff4d9d"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive="#ff4d9d"
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
        />
      </mesh>
    </Float>
  );
};

// Distorted Background Spheres
const DistortedSphere = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#00d4ff',
  scale = 1
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.1;
    meshRef.current.rotation.y = time * 0.15;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={0.6}
        speed={3}
        roughness={0}
        metalness={1}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.1}
      />
    </mesh>
  );
};

// Scene content
const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff4d9d" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[0, 5, 5]} intensity={0.6} color="#a855f7" />
      
      <NeonParticles count={300} />
      
      {/* Morphing elements behind text */}
      <MorphingText position={[0, 0, -4]} />
      <DistortedSphere position={[-3, 2, -5]} color="#ff4d9d" scale={1.5} />
      <DistortedSphere position={[3, -2, -6]} color="#00d4ff" scale={2} />
      <DistortedSphere position={[0, -1, -7]} color="#a855f7" scale={1.8} />
      
      <GlowRing radius={4} color="#ff4d9d" position={[0, 0, -3]} />
      <GlowRing radius={3} color="#00d4ff" position={[0, 0, -2]} />
      <GlowRing radius={2} color="#a855f7" position={[0, 0, -1]} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <FloatingGem position={[-5, 2, -2]} color="#ff4d9d" scale={0.4} />
      </Float>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <FloatingGem position={[5, -1, -3]} color="#00d4ff" scale={0.3} />
      </Float>
      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.6}>
        <FloatingGem position={[-4, -2, -1]} color="#a855f7" scale={0.25} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.4}>
        <FloatingGem position={[4, 2, -2]} color="#ff4d9d" scale={0.35} />
      </Float>
    </>
  );
};

export const HeroScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};
