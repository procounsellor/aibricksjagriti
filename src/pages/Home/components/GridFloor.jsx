import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BACKGROUND_BLACK, GRID_LINE } from '../colors';

/**
 * The reflective dark grid floor of the hub world: a single large plane with
 * a procedural neon-grid CanvasTexture (bright cell borders + faint inner
 * subdivision). The material's color multiplier sits slightly above 1 with
 * toneMapped:false, so the brightest line pixels just kiss the bloom
 * threshold and the grid reads as etched light. Scene fog swallows the far
 * edge. 1 draw call, no network assets.
 */

function makeGridTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = BACKGROUND_BLACK;
  g.fillRect(0, 0, size, size);

  g.strokeStyle = GRID_LINE;
  g.shadowColor = GRID_LINE;
  g.shadowBlur = 6;
  g.lineWidth = 2;
  g.globalAlpha = 0.85;
  g.beginPath();
  g.moveTo(0.5, 0);
  g.lineTo(0.5, size);
  g.moveTo(0, 0.5);
  g.lineTo(size, 0.5);
  g.stroke();
  // Faint inner subdivision
  g.globalAlpha = 0.2;
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
  tex.repeat.set(72, 72);
  tex.anisotropy = 4;
  return tex;
}

export default function GridFloor() {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: makeGridTexture(),
        color: new THREE.Color('#ffffff').multiplyScalar(1.25),
        toneMapped: false,
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
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[360, 360]} />
    </mesh>
  );
}
