import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GROUND_Y } from '../trackData';
import { NEON_VIOLET, NEON_CYAN } from '../colors';

const beamGeom = new THREE.PlaneGeometry(2.4, 46);

const beamMatViolet = new THREE.MeshBasicMaterial({
  color: NEON_VIOLET,
  transparent: true,
  opacity: 0.1,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
});
const beamMatCyan = new THREE.MeshBasicMaterial({
  color: NEON_CYAN,
  transparent: true,
  opacity: 0.08,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
});

/**
 * Two slow searchlight-style beams sweeping over the city skyline.
 * Frozen (static tilt) under reduced motion via the prop. 2 draw calls.
 */
export default function LightBeams({ prefersReducedMotion }) {
  const beamA = useRef();
  const beamB = useRef();

  useFrame((state) => {
    if (prefersReducedMotion) return;
    const time = state.clock.elapsedTime;
    if (beamA.current) beamA.current.rotation.y = time * 0.12;
    if (beamB.current) beamB.current.rotation.y = -time * 0.09 + 1.4;
  });

  return (
    <group>
      <group ref={beamA} position={[-26, GROUND_Y + 23, -48]}>
        <mesh
          geometry={beamGeom}
          material={beamMatViolet}
          rotation={[0, 0, 0.28]}
        />
      </group>
      <group ref={beamB} position={[30, GROUND_Y + 23, -95]}>
        <mesh
          geometry={beamGeom}
          material={beamMatCyan}
          rotation={[0, 0, -0.22]}
        />
      </group>
    </group>
  );
}
