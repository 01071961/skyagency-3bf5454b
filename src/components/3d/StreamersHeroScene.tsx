import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Trail, Sphere, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Dynamic particle field with color transitions
const DynamicParticleField = ({ count = 400 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const neonColors = [
      [1, 0.1, 0.8],   // Hot magenta
      [0, 0.95, 1],    // Electric cyan
      [0.8, 0.2, 1],   // Vivid purple
      [1, 0.4, 0.1],   // Neon orange
    ];
    
    for (let i = 0; i < count; i++) {
      const radius = 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = (radius * Math.cos(phi)) - 10;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      
      const colorChoice = neonColors[Math.floor(Math.random() * neonColors.length)];
      colors[i * 3] = colorChoice[0];
      colors[i * 3 + 1] = colorChoice[1];
      colors[i * 3 + 2] = colorChoice[2];
    }
    
    return { positions, colors, velocities };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const colors = mesh.current.geometry.attributes.color.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Wave motion
      positions[i3] += Math.sin(time * 0.5 + i * 0.02) * 0.003;
      positions[i3 + 1] += Math.cos(time * 0.4 + i * 0.03) * 0.004;
      positions[i3 + 2] += Math.sin(time * 0.3 + i * 0.015) * 0.002;
      
      // Color pulsing
      const colorPulse = Math.sin(time * 2 + i * 0.1) * 0.3 + 0.7;
      colors[i3] *= colorPulse;
      colors[i3 + 1] *= colorPulse;
      colors[i3 + 2] *= colorPulse;
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.attributes.color.needsUpdate = true;
    mesh.current.rotation.y = time * 0.025;
    mesh.current.rotation.x = Math.sin(time * 0.1) * 0.1;
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
        size={0.09}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Pulsating DNA helix structure
const DNAHelix = ({ 
  position = [0, 0, 0] as [number, number, number],
  color1 = '#ff4d9d',
  color2 = '#00d4ff'
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.rotation.y = time * 0.3;
    groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.4;
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const y = (i - 6) * 0.4;
        return (
          <Float key={i} speed={2 + i * 0.1} rotationIntensity={0.2} floatIntensity={0.3}>
            <Sphere args={[0.15, 16, 16]} position={[Math.cos(angle) * 1.5, y, Math.sin(angle) * 1.5]}>
              <meshStandardMaterial
                color={i % 2 === 0 ? color1 : color2}
                emissive={i % 2 === 0 ? color1 : color2}
                emissiveIntensity={0.8}
                metalness={0.9}
                roughness={0.1}
              />
            </Sphere>
          </Float>
        );
      })}
    </group>
  );
};

// Morphing polyhedron
const MorphingPolyhedron = ({ 
  position = [0, 0, 0] as [number, number, number],
  color = '#ff4d9d',
  scale = 0.8
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.35;
    meshRef.current.rotation.y = time * 0.45;
    meshRef.current.rotation.z = time * 0.25;
    
    const scale = 0.8 + Math.sin(time * 1.5) * 0.15;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <Float speed={2.5} rotationIntensity={0.5} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <dodecahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.7}
          speed={5}
          roughness={0.1}
          metalness={0.9}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
};

// Advanced energy vortex
const EnergyVortex = ({ 
  radius = 4.5, 
  color = '#ff4d9d', 
  position = [0, 0, 0] as [number, number, number],
  speed = 1.2
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    groupRef.current.rotation.x = Math.sin(time * 0.25 * speed) * 0.6;
    groupRef.current.rotation.y = time * 0.2 * speed;
    groupRef.current.rotation.z = Math.cos(time * 0.3 * speed) * 0.4;
    
    const pulse = 1 + Math.sin(time * 3 * speed) * 0.12;
    groupRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main ring */}
      <mesh>
        <torusGeometry args={[radius, 0.05, 28, 100]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={1}
          transparent 
          opacity={0.85}
        />
      </mesh>
      {/* Glow ring */}
      <mesh>
        <torusGeometry args={[radius, 0.18, 28, 100]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Inner sparkles */}
      <Sparkles
        count={50}
        scale={radius * 2}
        size={2}
        speed={0.5}
        color={color}
      />
    </group>
  );
};

// Ultra morphing sphere
const UltraSphere = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#ff4d9d',
  scale = 1.8
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.18;
    meshRef.current.rotation.y = time * 0.25;
    meshRef.current.rotation.z = time * 0.12;
  });

  const adjustedScale = Math.min(viewport.width / 4.5, scale);

  return (
    <mesh ref={meshRef} position={position} scale={adjustedScale}>
      <icosahedronGeometry args={[1, 5]} />
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={1}
        speed={5}
        roughness={0}
        metalness={1}
        emissive={color}
        emissiveIntensity={0.45}
        transparent
        opacity={0.18}
      />
    </mesh>
  );
};

// Neon crystal with advanced trail
const NeonCrystal = ({ 
  position = [0, 0, 0] as [number, number, number], 
  color = '#ff4d9d',
  scale = 0.45
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 1.4;
    meshRef.current.rotation.x = Math.sin(time * 0.8) * 0.5;
    meshRef.current.position.x = position[0] + Math.sin(time * 0.6 + position[0]) * 0.6;
    meshRef.current.position.y = position[1] + Math.sin(time * 0.9 + position[1]) * 0.5;
    meshRef.current.position.z = position[2] + Math.cos(time * 0.7 + position[2]) * 0.4;
  });

  return (
    <Trail
      width={0.6}
      length={10}
      color={new THREE.Color(color)}
      attenuation={(t) => t * t * t}
    >
      <mesh ref={meshRef} position={position} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          metalness={1}
          roughness={0}
          toneMapped={false}
        />
      </mesh>
    </Trail>
  );
};

// Scene content
const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[18, 12, 10]} intensity={2.5} color="#ff4d9d" />
      <pointLight position={[-15, -12, -10]} intensity={2} color="#00d4ff" />
      <pointLight position={[0, 10, 10]} intensity={1.5} color="#a855f7" />
      <pointLight position={[12, -8, 8]} intensity={1.8} color="#ff8800" />
      <spotLight position={[0, 15, 0]} intensity={2} angle={0.3} penumbra={1} color="#ffffff" />
      
      <DynamicParticleField count={400} />
      
      {/* Ultra morphing spheres */}
      <UltraSphere position={[-6, 2, -8]} color="#ff4d9d" scale={2.2} />
      <UltraSphere position={[6, -1, -10]} color="#00d4ff" scale={2.6} />
      <UltraSphere position={[0, 3, -11]} color="#a855f7" scale={2.4} />
      
      {/* DNA helix structures */}
      <DNAHelix position={[-4, 0, -6]} color1="#ff4d9d" color2="#00d4ff" />
      <DNAHelix position={[4, 1, -7]} color1="#a855f7" color2="#ff8800" />
      
      <MorphingPolyhedron position={[-3, 2, -5]} color="#ff4d9d" scale={0.9} />
      <MorphingPolyhedron position={[3, -1, -6]} color="#00d4ff" scale={0.85} />
      <MorphingPolyhedron position={[0, 2, -4]} color="#ff8800" scale={0.8} />
      
      <EnergyVortex radius={5.5} color="#ff4d9d" position={[0, 0, -6]} speed={1.1} />
      <EnergyVortex radius={4} color="#00d4ff" position={[0, 0, -5]} speed={1.3} />
      <EnergyVortex radius={3} color="#a855f7" position={[0, 0, -4]} speed={0.9} />
      <EnergyVortex radius={7} color="#ff8800" position={[0, 0, -7]} speed={1} />
      
      <Float speed={2.8} rotationIntensity={0.6} floatIntensity={0.8}>
        <NeonCrystal position={[-7, 3, -3]} color="#ff4d9d" scale={0.5} />
      </Float>
      <Float speed={2.4} rotationIntensity={0.5} floatIntensity={0.9}>
        <NeonCrystal position={[7, -2, -4]} color="#00d4ff" scale={0.45} />
      </Float>
      <Float speed={3} rotationIntensity={0.7} floatIntensity={0.7}>
        <NeonCrystal position={[-6, -3, -2]} color="#a855f7" scale={0.4} />
      </Float>
      <Float speed={2.6} rotationIntensity={0.6} floatIntensity={1}>
        <NeonCrystal position={[6, 3, -3]} color="#ff8800" scale={0.48} />
      </Float>
      <Float speed={2.2} rotationIntensity={0.4} floatIntensity={0.75}>
        <NeonCrystal position={[0, 4, -4]} color="#ff4d9d" scale={0.42} />
      </Float>
    </>
  );
};

export const StreamersHeroScene = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};
