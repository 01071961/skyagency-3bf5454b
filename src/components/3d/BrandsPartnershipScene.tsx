import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Network of streamers and brands
const ConnectionNetwork = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const particleCount = 60;

  const { positions, colors, linePositions } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const nodes: THREE.Vector3[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 4;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      nodes.push(new THREE.Vector3(x, y, z));
      
      // Alternating pink and cyan - streamer/brand connection colors
      const colorChoice = Math.random();
      if (colorChoice < 0.5) {
        // Pink (streamers)
        colors[i * 3] = 0.93;
        colors[i * 3 + 1] = 0.28;
        colors[i * 3 + 2] = 0.6;
      } else {
        // Cyan (brands)
        colors[i * 3] = 0.02;
        colors[i * 3 + 1] = 0.83;
        colors[i * 3 + 2] = 0.93;
      }
    }
    
    // Create connections between nearby nodes (streamer-brand connections)
    const linePoints: number[] = [];
    const connectionDistance = 2.8;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < connectionDistance) {
          linePoints.push(nodes[i].x, nodes[i].y, nodes[i].z);
          linePoints.push(nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }
    
    return { 
      positions, 
      colors, 
      linePositions: new Float32Array(linePoints) 
    };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent opacity={0.9} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#a855f7" transparent opacity={0.25} />
      </lineSegments>
    </>
  );
};

// Streamer sphere (pink/magenta)
const StreamerSphere = ({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + delay;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial
          color="#ec4899"
          metalness={0.6}
          roughness={0.3}
          distort={0.25}
          speed={2}
        />
      </mesh>
    </Float>
  );
};

// Brand sphere (cyan)
const BrandSphere = ({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + delay;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial
          color="#06b6d4"
          metalness={0.6}
          roughness={0.3}
          distort={0.25}
          speed={2}
        />
      </mesh>
    </Float>
  );
};

// Central partnership handshake representation
const PartnershipCore = () => {
  const streamerRef = useRef<THREE.Mesh>(null);
  const brandRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (streamerRef.current && brandRef.current) {
      // Spheres move towards each other and back
      streamerRef.current.position.x = -0.9 + Math.sin(t * 0.8) * 0.4;
      brandRef.current.position.x = 0.9 - Math.sin(t * 0.8) * 0.4;
    }
  });

  return (
    <>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh ref={streamerRef} position={[-0.9, 0, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <MeshDistortMaterial
            color="#ec4899"
            metalness={0.5}
            roughness={0.4}
            distort={0.15}
            speed={2}
          />
        </mesh>
      </Float>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh ref={brandRef} position={[0.9, 0, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <MeshDistortMaterial
            color="#06b6d4"
            metalness={0.5}
            roughness={0.4}
            distort={0.15}
            speed={2}
          />
        </mesh>
      </Float>
      {/* Connection glow between them */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  );
};

// Partnership orbiting rings
const PartnershipRing = ({ radius, speed, color, tilt }: { radius: number; speed: number; color: string; tilt: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.04, 16, 80]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.15}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

// Live indicator - showing active partnership/campaign
const LiveIndicator = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      glowRef.current.scale.setScalar(1 + pulse * 0.5);
      (glowRef.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + pulse * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={position}>
        {/* Glow effect */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.8}
            transparent
            opacity={0.4}
          />
        </mesh>
        {/* Core */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1}
          />
        </mesh>
      </group>
    </Float>
  );
};

const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#ec4899" />
      <pointLight position={[-5, -5, 5]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#a855f7" />
      
      <ConnectionNetwork />
      <PartnershipCore />
      <PartnershipRing radius={2.2} speed={0.25} color="#ec4899" tilt={Math.PI / 6} />
      <PartnershipRing radius={2.6} speed={-0.18} color="#06b6d4" tilt={-Math.PI / 8} />
      <PartnershipRing radius={3} speed={0.12} color="#a855f7" tilt={Math.PI / 4} />
      
      {/* Additional streamers and brands around the scene */}
      <StreamerSphere position={[-3, 1.5, -1]} delay={0} />
      <BrandSphere position={[3, -1.5, -1]} delay={0.5} />
      <StreamerSphere position={[2.5, 2, -0.5]} delay={1} />
      <BrandSphere position={[-2.5, -2, -0.5]} delay={1.5} />
      
      {/* Live campaign indicator */}
      <LiveIndicator position={[0, 2.5, 0]} />
    </>
  );
};

const BrandsPartnershipScene = () => {
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

export default BrandsPartnershipScene;
