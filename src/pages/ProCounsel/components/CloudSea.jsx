import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPIRAL_CENTER, CLOUD_Y } from '../trackData';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const _dummy = new THREE.Object3D();

const COUNT = 40;
const cloudGeom = new THREE.PlaneGeometry(1, 1);

// Procedural soft cloud-puff texture (no network assets).
function makeCloudTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, size, size);
  const blobs = [
    [128, 140, 80],
    [78, 150, 55],
    [180, 152, 58],
    [110, 118, 48],
    [158, 120, 44],
  ];
  for (let i = 0; i < blobs.length; i++) {
    const [x, y, r] = blobs[i];
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.22)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The soft cloud sea beneath the book spiral: instanced billboard puffs
 * (camera-facing quads with a procedural radial texture) drifting very
 * slowly. Billboarding copies the camera quaternion into each instance
 * every frame (orientation correctness — kept under reduced motion, where
 * only the drift is frozen). 1 instanced draw call, zero per-frame
 * allocation.
 */
export default function CloudSea() {
  const prefersReducedMotion = useReducedMotion();
  const meshRef = useRef();

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: makeCloudTexture(),
        color: '#9d9ccf',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  React.useEffect(
    () => () => {
      if (material.map) material.map.dispose();
      material.dispose();
    },
    [material]
  );

  // Static per-puff parameters: base position, drift phase/amp, scale.
  const params = useMemo(() => {
    const rand = mulberry32(424242);
    const arr = new Float32Array(COUNT * 6);
    for (let i = 0; i < COUNT; i++) {
      const o = i * 6;
      const angle = rand() * Math.PI * 2;
      const radius = 14 + rand() * 115;
      arr[o] = SPIRAL_CENTER.x + Math.cos(angle) * radius; // x
      arr[o + 1] = CLOUD_Y + (rand() - 0.5) * 5; // y
      arr[o + 2] = SPIRAL_CENTER.z + Math.sin(angle) * radius; // z
      arr[o + 3] = rand() * Math.PI * 2; // drift phase
      arr[o + 4] = 1.5 + rand() * 3; // drift amplitude
      arr[o + 5] = 13 + rand() * 20; // scale
    }
    return arr;
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = prefersReducedMotion ? 0 : state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const o = i * 6;
      _dummy.position.set(
        params[o] + Math.sin(time * 0.05 + params[o + 3]) * params[o + 4],
        params[o + 1] + Math.sin(time * 0.08 + params[o + 3] * 1.7) * 0.8,
        params[o + 2]
      );
      // Billboard: face the camera.
      _dummy.quaternion.copy(state.camera.quaternion);
      _dummy.scale.set(params[o + 5], params[o + 5] * 0.55, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[cloudGeom, material, COUNT]}
      frustumCulled={false}
      renderOrder={-5}
    />
  );
}
