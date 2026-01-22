import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text3D, Center } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Streaming metrics data particles flowing upward
const MetricsParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 180;

  const { positions, colors, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      
      // Cyan/Purple metrics colors (SKY BRASIL brand)
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        // Cyan
        colors[i * 3] = 0.1;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.95;
      } else {
        // Purple
        colors[i * 3] = 0.65;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 0.95;
      }
      
      velocities[i] = 0.015 + Math.random() * 0.025;
    }
    
    return { positions, colors, velocities };
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += velocities[i];
        
        if (posArray[i * 3 + 1] > 5) {
          posArray[i * 3 + 1] = -5;
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
};

// Viewership bar chart (streaming analytics)
const ViewershipBars = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bars = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      height: 0.4 + Math.random() * 1.8,
      x: (i - 2.5) * 0.35,
      color: i % 2 === 0 ? "#06b6d4" : "#22d3ee",
      emissive: i % 2 === 0 ? "#0891b2" : "#06b6d4",
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.height / 2 - 0.5, 0]}>
          <boxGeometry args={[0.22, bar.height, 0.22]} />
          <meshStandardMaterial
            color={bar.color}
            metalness={0.7}
            roughness={0.2}
            emissive={bar.emissive}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
      {/* Base platform */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[2.5, 0.08, 0.4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// ROI growth arrow
const GrowthArrow = ({ position }: { position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group ref={groupRef} position={position} rotation={[0, 0, Math.PI / 4]}>
        {/* Arrow shaft */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.15, 1, 0.15]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.5}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        {/* Arrow head */}
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.25, 0.5, 4]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.6}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Engagement ring (representing engagement metrics)
const EngagementRing = ({ position, radius, color }: { position: [number, number, number]; radius: number; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[radius, 0.08, 16, 50]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.15}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
};

// Conversion funnel
const ConversionFunnel = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.8, 1.2, 6]} />
        <meshStandardMaterial
          color="#a855f7"
          metalness={0.7}
          roughness={0.2}
          emissive="#7c3aed"
          emissiveIntensity={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
};

const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#06b6d4" />
      <pointLight position={[-5, -5, 5]} intensity={0.7} color="#a855f7" />
      <pointLight position={[0, 3, 3]} intensity={0.5} color="#10b981" />
      
      <MetricsParticles />
      <ViewershipBars position={[-1.8, 0, 0]} />
      <GrowthArrow position={[2.5, 0.5, 0]} />
      <ConversionFunnel position={[0.5, 1.5, -0.5]} />
      <EngagementRing position={[-2.5, 2, -1]} radius={0.5} color="#ec4899" />
      <EngagementRing position={[2, -1.5, -1]} radius={0.4} color="#06b6d4" />
      <EngagementRing position={[0, -2, -0.5]} radius={0.6} color="#a855f7" />
    </>
  );
};

const BrandsAnalyticsScene = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};

export default BrandsAnalyticsScene;
