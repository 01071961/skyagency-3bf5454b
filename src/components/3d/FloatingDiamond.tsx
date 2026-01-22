import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingDiamondProps {
  position?: [number, number, number];
  color?: string;
  scale?: number;
}

export const FloatingDiamond = ({ 
  position = [0, 0, 0], 
  color = '#ff4d9d',
  scale = 1 
}: FloatingDiamondProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.y = time * 0.5;
    meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.2;
    meshRef.current.position.y = position[1] + Math.sin(time) * 0.2;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.1}
        distort={0.2}
        speed={2}
      />
    </mesh>
  );
};
