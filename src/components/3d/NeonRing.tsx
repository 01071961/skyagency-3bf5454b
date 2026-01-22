import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NeonRingProps {
  radius?: number;
  color?: string;
  position?: [number, number, number];
  rotationSpeed?: number;
}

export const NeonRing = ({ 
  radius = 2, 
  color = '#00d4ff', 
  position = [0, 0, 0],
  rotationSpeed = 1 
}: NeonRingProps) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const time = state.clock.elapsedTime;
    ringRef.current.rotation.x = time * rotationSpeed * 0.5;
    ringRef.current.rotation.y = time * rotationSpeed * 0.3;
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Glow mesh */}
      <mesh rotation={ringRef.current?.rotation}>
        <torusGeometry args={[radius, 0.08, 16, 100]} />
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
