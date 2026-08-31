import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from '../trackData';
import { BACKGROUND_DARK, GRID_LINE } from '../colors';

// Procedural glowing-grid texture for the city floor. No network assets.
function makeGridTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = BACKGROUND_DARK;
  g.fillRect(0, 0, size, size);

  g.strokeStyle = GRID_LINE;
  g.shadowColor = GRID_LINE;
  g.shadowBlur = 6;
  g.lineWidth = 2;
  g.globalAlpha = 0.8;
  g.beginPath();
  // One cell per tile; the texture repeats across the plane.
  g.moveTo(0.5, 0);
  g.lineTo(0.5, size);
  g.moveTo(0, 0.5);
  g.lineTo(size, 0.5);
  g.stroke();
  // Faint inner subdivision
  g.globalAlpha = 0.22;
  g.shadowBlur = 0;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(size / 2, 0);
  g.lineTo(size / 2, size);
  g.moveTo(0, size / 2);
  g.lineTo(size, size / 2);
  g.stroke();
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(64, 64);
  tex.anisotropy = 4;
  return tex;
}

/**
 * The city floor: a single large plane with a subtle procedural neon grid.
 * Scene fog hides the far edge. 1 draw call.
 */
export default function GridGround() {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: makeGridTexture(),
      }),
    []
  );

  useEffect(
    () => () => {
      if (material.map) material.map.dispose();
      material.dispose();
    },
    [material]
  );

  return (
    <mesh
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, GROUND_Y, -55]}
    >
      <planeGeometry args={[520, 520]} />
    </mesh>
  );
}
