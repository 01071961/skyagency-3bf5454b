import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Component to handle WebGL context lost/restored events
 * Prevents console errors and visual glitches on mobile/tab switching
 */
export const WebGLContextHandler = () => {
  const { gl } = useThree();
  const [isContextLost, setIsContextLost] = useState(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setIsContextLost(true);
      console.log('[WebGL] Context lost – pausing animation');
    };

    const handleContextRestored = () => {
      setIsContextLost(false);
      console.log('[WebGL] Context restored – resuming');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return null;
};

/**
 * Hook to check if WebGL context is available
 */
export const useWebGLContext = () => {
  const { gl } = useThree();
  
  const isContextValid = () => {
    try {
      const context = gl.getContext();
      return context && !context.isContextLost();
    } catch {
      return false;
    }
  };

  return { isContextValid };
};
