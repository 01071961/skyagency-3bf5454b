import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface CubeFace {
  label: string;
  icon: string;
  value: string;
}

interface HolographicCubeProps {
  faces?: CubeFace[];
  onFaceClick?: (face: CubeFace) => void;
}

const defaultFaces: CubeFace[] = [
  { label: 'Analytics', icon: '📊', value: '2.5M' },
  { label: 'Vídeos', icon: '🎬', value: '15K' },
  { label: 'Lives', icon: '🔴', value: '500+' },
  { label: 'Diamantes', icon: '💎', value: '10M' },
  { label: 'Streamers', icon: '🎮', value: '5K+' },
  { label: 'Receita', icon: '💰', value: 'R$2M' },
];

export const HolographicCube = ({ faces = defaultFaces, onFaceClick }: HolographicCubeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [activeFace, setActiveFace] = useState(0);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    if (!hovered) {
      groupRef.current.rotation.y = time * 0.3;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
  });

  const facePositions: [number, number, number][] = [
    [0, 0, 1.01],   // front
    [0, 0, -1.01],  // back
    [1.01, 0, 0],   // right
    [-1.01, 0, 0],  // left
    [0, 1.01, 0],   // top
    [0, -1.01, 0],  // bottom
  ];

  const faceRotations: [number, number, number][] = [
    [0, 0, 0],
    [0, Math.PI, 0],
    [0, Math.PI / 2, 0],
    [0, -Math.PI / 2, 0],
    [-Math.PI / 2, 0, 0],
    [Math.PI / 2, 0, 0],
  ];

  return (
    <group 
      ref={groupRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Main cube */}
      <RoundedBox args={[2, 2, 2]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.7}
          envMapIntensity={1}
        />
      </RoundedBox>
      
      {/* Wireframe */}
      <RoundedBox args={[2.02, 2.02, 2.02]} radius={0.1} smoothness={4}>
        <meshBasicMaterial
          color="#ff4d9d"
          wireframe
          transparent
          opacity={0.5}
        />
      </RoundedBox>

      {/* Face labels */}
      {faces.slice(0, 6).map((face, index) => (
        <group key={index} position={facePositions[index]} rotation={faceRotations[index]}>
          <Html
            transform
            occlude
            distanceFactor={3}
            style={{
              transition: 'all 0.3s',
              opacity: hovered ? 1 : 0.7,
              transform: `scale(${hovered && activeFace === index ? 1.1 : 1})`,
            }}
            onPointerEnter={() => setActiveFace(index)}
            onClick={() => onFaceClick?.(face)}
          >
            <div className="text-center pointer-events-auto cursor-pointer select-none">
              <div className="text-2xl mb-1">{face.icon}</div>
              <div className="text-xs text-primary font-bold">{face.value}</div>
              <div className="text-[10px] text-muted-foreground">{face.label}</div>
            </div>
          </Html>
        </group>
      ))}
      
      {/* Glow effect */}
      <pointLight position={[0, 0, 0]} color="#ff4d9d" intensity={0.5} distance={3} />
    </group>
  );
};
