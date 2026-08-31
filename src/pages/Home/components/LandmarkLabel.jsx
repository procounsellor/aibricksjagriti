import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { makeLabelTexture } from './textures';

/**
 * Floating product name over a landmark — a procedural CanvasTexture on a
 * sprite (always camera-facing). Kept just under the bloom threshold so it
 * reads crisply. 1 draw call.
 */
export default function LandmarkLabel({ text, color, position, scale = 3.4 }) {
  const material = useMemo(() => {
    const map = makeLabelTexture(text, color);
    return new THREE.SpriteMaterial({
      map,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
  }, [text, color]);

  useEffect(
    () => () => {
      if (material.map) material.map.dispose();
      material.dispose();
    },
    [material]
  );

  return (
    <sprite position={position} scale={[scale, scale * 0.25, 1]} material={material} />
  );
}
