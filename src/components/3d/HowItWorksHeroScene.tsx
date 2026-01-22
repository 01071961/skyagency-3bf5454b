import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Trail, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Advanced particle system with trails
const AdvancedParticles = ({ count = 350 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const neonColors = [
      [1, 0.2, 0.9],   // Hot pink
      [0, 1, 0.9],     // Cyan
      [0.5, 0.2, 1],   // Purple
      [1, 0.6, 0],     // Orange
    ];
    
    for (let i = 0; i < count; i++) {
      const radius = 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = (radius * Math.cos(phi)) - 8;
      
      const colorChoice = neonColors[Math.floor(Math.random() * neonColors.length)];
      colors[i * 3] = colorChoice[0];
      colors[i * 3 + 1] = colorChoice[1];
      colors[i * 3 + 2] = colorChoice[2];
      
      scales[i] = Math.random() * 0.5 + 0.5;
    }
    
    return { positions, colors, scales };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Spiral motion
      const angle = time * 0.2 + i * 0.05;
      positions[i3] = x * Math.cos(angle * 0.01) - y * Math.sin(angle * 0.01);
      positions[i3 + 1] = x * Math.sin(angle * 0.01) + y * Math.cos(angle * 0.01);
      positions[i3 + 2] = z + Math.sin(time * 0.3 + i * 0.1) * 0.005;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = time * 0.03;
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
        <bufferAttribute
          attach="attributes-scale"
          count={count}
          array={particles.scales}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Morphing torus knot
const MorphingTorusKnot = ({ 
  position = [0, 0, 0] as [number, number, number],
  color = '#ff4d9d'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.3;
    meshRef.current.rotation.y = time * 0.4;
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={0.6}>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.8}
          speed={4}
          roughness={0}
          metalness={1}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.25}
        />
      </mesh>
    </Float>
  );
};

// Pulsing energy rings with advanced effects
const EnergyRing = ({ 
  radius = 4, 
  color = '#00d4ff', 
  position = [0, 0, 0] as [number, number, number],
  speed = 1
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ringRef.current || !glowRef.current) return;
    const time = state.clock.elapsedTime;
    
    ringRef.current.rotation.x = Math.sin(time * 0.2 * speed) * 0.5;
    ringRef.current.rotation.y = time * 0.15 * speed;
    ringRef.current.rotation.z = Math.cos(time * 0.25 * speed) * 0.3;
    
    const pulse = 1 + Math.sin(time * 2 * speed) * 0.1;
    ringRef.current.scale.set(pulse, pulse, pulse);
    glowRef.current.scale.set(pulse * 1.2, pulse * 1.2, pulse * 1.2);
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, 0.04, 24, 100]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.8}
          transparent 
          opacity={0.8}
        />
      </mesh>
      <mesh ref={glowRef}>
        <torusGeometry args={[radius, 0.15, 24, 100]} />
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

// Advanced morphing sphere with complex distortion
const HyperSphere = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#ff4d9d',
  scale = 1.5
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.15;
    meshRef.current.rotation.y = time * 0.2;
    meshRef.current.rotation.z = time * 0.1;
  });

  const adjustedScale = Math.min(viewport.width / 5, scale);

  return (
    <mesh ref={meshRef} position={position} scale={adjustedScale}>
      <icosahedronGeometry args={[1, 4]} />
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={0.9}
        speed={4}
        roughness={0}
        metalness={1}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.15}
      />
    </mesh>
  );
};

// Floating crystal with trail
const TrailedCrystal = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#ff4d9d',
  scale = 0.4
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 1.2;
    meshRef.current.rotation.x = Math.sin(time * 0.7) * 0.4;
    meshRef.current.position.x = position[0] + Math.sin(time * 0.5) * 0.5;
    meshRef.current.position.y = position[1] + Math.sin(time * 0.8 + position[0]) * 0.4;
    meshRef.current.position.z = position[2] + Math.cos(time * 0.6) * 0.3;
  });

  return (
    <Trail
      width={0.5}
      length={8}
      color={new THREE.Color(color)}
      attenuation={(t) => t * t}
    >
      <mesh ref={meshRef} position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          metalness={1}
          roughness={0}
        />
      </mesh>
    </Trail>
  );
};

// Orbiting light spheres
const OrbitingSphere = ({
  radius = 5,
  speed = 1,
  color = '#ff4d9d',
  offset = 0
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime * speed + offset;
    meshRef.current.position.x = Math.cos(time) * radius;
    meshRef.current.position.z = Math.sin(time) * radius - 5;
    meshRef.current.position.y = Math.sin(time * 2) * 2;
  });
  
  return (
    <Sphere ref={meshRef} args={[0.15, 16, 16]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </Sphere>
  );
};

// Main scene content
const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[15, 10, 10]} intensity={2} color="#ff4d9d" />
      <pointLight position={[-12, -10, -8]} intensity={1.5} color="#00d4ff" />
      <pointLight position={[0, 8, 8]} intensity={1} color="#a855f7" />
      <pointLight position={[10, -5, 5]} intensity={1.2} color="#ff8800" />
      
      <AdvancedParticles count={350} />
      
      {/* Advanced morphing background elements */}
      <HyperSphere position={[-5, 1, -7]} color="#ff4d9d" scale={2} />
      <HyperSphere position={[5, -2, -9]} color="#00d4ff" scale={2.5} />
      <HyperSphere position={[0, 3, -10]} color="#a855f7" scale={2.2} />
      
      <MorphingTorusKnot position={[-3, 1, -5]} color="#ff4d9d" />
      <MorphingTorusKnot position={[3, -1, -6]} color="#00d4ff" />
      <MorphingTorusKnot position={[0, 2, -4]} color="#ff8800" />
      
      <EnergyRing radius={5} color="#ff4d9d" position={[0, 0, -5]} speed={1} />
      <EnergyRing radius={3.5} color="#00d4ff" position={[0, 0, -4]} speed={1.2} />
      <EnergyRing radius={2.8} color="#a855f7" position={[0, 0, -3]} speed={0.8} />
      <EnergyRing radius={6.5} color="#ff8800" position={[0, 0, -6]} speed={0.9} />
      
      <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.7}>
        <TrailedCrystal position={[-6, 2, -3]} color="#ff4d9d" scale={0.45} />
      </Float>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
        <TrailedCrystal position={[6, -1, -4]} color="#00d4ff" scale={0.4} />
      </Float>
      <Float speed={2.8} rotationIntensity={0.6} floatIntensity={0.6}>
        <TrailedCrystal position={[-5, -2, -2]} color="#a855f7" scale={0.35} />
      </Float>
      <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.9}>
        <TrailedCrystal position={[5, 2, -3]} color="#ff8800" scale={0.42} />
      </Float>
      
      {/* Orbiting spheres */}
      <OrbitingSphere radius={6} speed={0.5} color="#ff4d9d" offset={0} />
      <OrbitingSphere radius={6} speed={0.5} color="#00d4ff" offset={Math.PI / 2} />
      <OrbitingSphere radius={6} speed={0.5} color="#a855f7" offset={Math.PI} />
      <OrbitingSphere radius={6} speed={0.5} color="#ff8800" offset={3 * Math.PI / 2} />
      
      <OrbitingSphere radius={4} speed={0.8} color="#ff4d9d" offset={0} />
      <OrbitingSphere radius={4} speed={0.8} color="#00d4ff" offset={Math.PI} />
    </>
  );
};

export const HowItWorksHeroScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};
