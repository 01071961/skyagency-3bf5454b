import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, RoundedBox } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Streaming-themed corporate particles
const StreamingParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 120;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      
      // SKY BRASIL brand colors - cyan/pink
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        // Cyan
        colors[i * 3] = 0.1;
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else {
        // Pink/Magenta
        colors[i * 3] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      }
    }
    
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

// Streaming screen/monitor representation
const StreamingScreen = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position}>
        {/* Screen frame */}
        <RoundedBox ref={meshRef} args={[2.2, 1.4, 0.1]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.9}
            roughness={0.1}
          />
        </RoundedBox>
        {/* Screen glow */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2, 1.2]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Play button - representing live streaming
const PlayButton = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={0.6}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      {/* Triangle play icon */}
      <mesh position={[position[0] + 0.08, position[1], position[2] + 0.1]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.25, 0.4, 3]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
};

// Brand logo diamond shape
const BrandDiamond = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[0.5, 0]} />
        <MeshDistortMaterial
          color="#22d3ee"
          metalness={0.8}
          roughness={0.1}
          distort={0.2}
          speed={3}
        />
      </mesh>
    </Float>
  );
};

// Corporate building blocks representing brands
const CorporateBlock = ({ position, color }: { position: [number, number, number]; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
    }
  });

  return (
    <RoundedBox ref={meshRef} position={position} args={[0.6, 0.8, 0.6]} radius={0.08} smoothness={4}>
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </RoundedBox>
  );
};

const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#06b6d4" />
      <pointLight position={[-5, -5, 5]} intensity={0.8} color="#ec4899" />
      <pointLight position={[0, 3, 3]} intensity={0.6} color="#a855f7" />
      
      <StreamingParticles />
      <StreamingScreen position={[0, 0.5, -1]} />
      <PlayButton position={[-2.5, 1, 0]} />
      <BrandDiamond position={[2.5, 1.5, 0]} />
      <BrandDiamond position={[-2, -1.5, -1]} />
      
      {/* Corporate blocks representing partnering brands */}
      <CorporateBlock position={[3, -1, -0.5]} color="#06b6d4" />
      <CorporateBlock position={[-3, 0, -0.5]} color="#ec4899" />
      <CorporateBlock position={[2, -2, -1]} color="#a855f7" />
    </>
  );
};

const BrandsCorporateScene = () => {
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

export default BrandsCorporateScene;
