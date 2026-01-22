import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment,
  Float,
  Stars,
  Sparkles
} from '@react-three/drei';
import { ParticleField } from './ParticleField';
import { FloatingDiamond } from './FloatingDiamond';
import { HolographicCube } from './HolographicCube';
import { NeonRing } from './NeonRing';
import * as THREE from 'three';

const CameraRig = () => {
  const { camera, mouse } = useThree();
  
  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.5, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 0.3 + 2, 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

const SceneContent = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} color="#ff4d9d" intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#00d4ff" intensity={0.8} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#ff4d9d"
        castShadow
      />
      
      {/* Stars background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      {/* Sparkles */}
      <Sparkles count={100} scale={10} size={2} speed={0.4} color="#ff4d9d" />
      
      {/* Particles */}
      <ParticleField count={300} color="#ff4d9d" size={0.03} />
      <ParticleField count={200} color="#00d4ff" size={0.02} />
      
      {/* Central holographic cube */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <HolographicCube />
      </Float>
      
      {/* Floating diamonds */}
      <FloatingDiamond position={[-3, 1.5, -2]} color="#ff4d9d" scale={0.4} />
      <FloatingDiamond position={[3, -1, -1]} color="#00d4ff" scale={0.3} />
      <FloatingDiamond position={[-2, -1.5, 1]} color="#ff8c00" scale={0.35} />
      <FloatingDiamond position={[2.5, 2, 0]} color="#a855f7" scale={0.25} />
      
      {/* Neon rings */}
      <NeonRing radius={3} color="#ff4d9d" position={[0, 0, 0]} rotationSpeed={0.5} />
      <NeonRing radius={4} color="#00d4ff" position={[0, 0, 0]} rotationSpeed={-0.3} />
      <NeonRing radius={5} color="#ff8c00" position={[0, 0, 0]} rotationSpeed={0.2} />
    </>
  );
};

interface PlatformSceneProps {
  className?: string;
}

export const PlatformScene = ({ className }: PlatformSceneProps) => {
  return (
    <div className={className}>
      <Canvas
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
        <CameraRig />
        
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
};
