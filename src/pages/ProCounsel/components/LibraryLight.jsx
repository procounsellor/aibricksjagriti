import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SUMMIT, climbMotion } from '../trackData';

const shaftGeom = new THREE.PlaneGeometry(3.2, 42);
const shaftMat = new THREE.MeshBasicMaterial({
  color: '#ffd9a0',
  transparent: true,
  opacity: 0.09,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
  fog: false,
});

const SHAFTS = [
  { x: -4, z: -3, tilt: 0.16, yaw: 0.4 },
  { x: 2, z: 4, tilt: -0.12, yaw: 1.6 },
  { x: 6, z: -5, tilt: 0.09, yaw: 2.7 },
];

/**
 * Three shafts of warm "library light" pouring down over the summit — the
 * reading-room glow the whole climb is heading toward. They sway very
 * slowly and brighten as the student ascends (opacity follows climb
 * progress, so reduced-motion users still see the approach glow; only the
 * sway is frozen for them via the prop). 3 draw calls.
 */
export default function LibraryLight({ prefersReducedMotion }) {
  const refs = useRef([]);

  useFrame((state) => {
    // Brighten with ascent — scroll-linked, active for everyone.
    shaftMat.opacity =
      0.05 + THREE.MathUtils.smoothstep(climbMotion.t, 0.4, 0.95) * 0.11;
    if (prefersReducedMotion) return;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < SHAFTS.length; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      mesh.rotation.z = SHAFTS[i].tilt + Math.sin(time * 0.1 + i * 2.1) * 0.04;
    }
  });

  return (
    <group position={[SUMMIT.x, SUMMIT.y + 18, SUMMIT.z]}>
      {SHAFTS.map((s, i) => (
        <mesh
          key={`shaft-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={shaftGeom}
          material={shaftMat}
          position={[s.x, 0, s.z]}
          rotation={[0, s.yaw, s.tilt]}
        />
      ))}
    </group>
  );
}
