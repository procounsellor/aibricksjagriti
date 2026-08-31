import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Minimal WebGL context-loss handling.
 * Must be called from a component rendered inside a <Canvas>.
 * preventDefault() on `webglcontextlost` allows the browser to
 * restore the context instead of permanently losing the canvas.
 */
export function useWebGLContextLoss() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event) => {
      event.preventDefault();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, [gl]);
}
