import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Trail } from '@react-three/drei';
import * as THREE from 'three';

interface DiamondNodeProps {
  position: [number, number, number];
  color: string;
  scale: number;
  tier: string;
  value: string;
}

const DiamondNode = ({ position, color, scale, tier, value }: DiamondNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.5;
    meshRef.current.rotation.z = Math.sin(time) * 0.1;
  });

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
      <Trail
        width={1}
        length={5}
        color={color}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef} position={position} scale={scale}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            metalness={1}
            roughness={0}
            transparent
            opacity={0.9}
            envMapIntensity={2}
          />
        </mesh>
      </Trail>
    </Float>
  );
};

const ConnectionLines = () => {
  const points = [
    new THREE.Vector3(-2, 1, 0),
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(2, 1, 0),
    new THREE.Vector3(1, -1, 0),
    new THREE.Vector3(-1, -1, 0),
    new THREE.Vector3(-2, 1, 0),
  ];

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive object={new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: '#ff4d9d', transparent: true, opacity: 0.5 })
    )} />
  );
};

const diamondTiers = [
  { position: [-2, 1, 0] as [number, number, number], color: '#00d4ff', scale: 0.8, tier: 'Bronze', value: '100' },
  { position: [0, 2, 0] as [number, number, number], color: '#a855f7', scale: 1, tier: 'Prata', value: '500' },
  { position: [2, 1, 0] as [number, number, number], color: '#ff4d9d', scale: 1.2, tier: 'Ouro', value: '1000' },
  { position: [1, -1, 0] as [number, number, number], color: '#ff8c00', scale: 1.4, tier: 'Platina', value: '5000' },
  { position: [-1, -1, 0] as [number, number, number], color: '#ffd700', scale: 1.6, tier: 'Diamante', value: '10000' },
];

interface DiamondConstellationProps {
  className?: string;
}

export const DiamondConstellation = ({ className }: DiamondConstellationProps) => {
  return (
    <div className={className}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} color="#ff4d9d" intensity={1} />
        <pointLight position={[-5, -5, 5]} color="#00d4ff" intensity={0.8} />
        
        <Sparkles count={50} scale={6} size={1} speed={0.3} color="#ff4d9d" />
        
        <Suspense fallback={null}>
          <ConnectionLines />
          {diamondTiers.map((diamond, index) => (
            <DiamondNode key={index} {...diamond} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
};
