import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { hubState, LANDMARKS } from '../hubState';
import { glowTexture } from './textures';
import LandmarkLabel from './LandmarkLabel';
import { AIBRICKS_CYAN, STRUCTURE_DARK } from '../colors';

/**
 * The AiBricks landmark — a miniature Living Data City: a cluster of five
 * dark towers whose windows are one InstancedMesh of glowing cells (cyan,
 * a few pushed past the bloom threshold). When the core's charge pulse
 * arrives (hubState.flare[0]) a bright band RIPPLES UP the towers — window
 * colors are rewritten only while the flare is live, then restored once.
 * A rooftop beacon crowns the tallest tower. 5 draw calls.
 */

const LANDMARK_INDEX = 0;
const POS = LANDMARKS[LANDMARK_INDEX].pos;

const TOWERS = [
  { x: -1.35, z: -0.6, w: 0.85, h: 3.4 },
  { x: 0, z: 0.25, w: 1.0, h: 5.2 },
  { x: 1.3, z: -0.55, w: 0.8, h: 4.2 },
  { x: -0.6, z: 1.05, w: 0.7, h: 2.6 },
  { x: 0.95, z: 1.15, w: 0.75, h: 3.0 },
];

function pseudoRandom(i) {
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

// Window layout baked at module load: local position + yaw per window.
// Faces: 0 = +z, 1 = -z, 2 = +x, 3 = -x
const FACE_YAW = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
const WINDOWS = [];
{
  let n = 0;
  for (let ti = 0; ti < TOWERS.length; ti++) {
    const tower = TOWERS[ti];
    const half = tower.w / 2 + 0.03;
    for (let face = 0; face < 4; face++) {
      for (let y = 0.55; y < tower.h - 0.35; y += 0.55) {
        for (let col = -1; col <= 1; col += 2) {
          if (pseudoRandom(n * 3 + 11) < 0.24) {
            n++;
            continue;
          }
          const lateral = col * tower.w * 0.22;
          let x = tower.x;
          let z = tower.z;
          if (face === 0) {
            x += lateral;
            z += half;
          } else if (face === 1) {
            x += lateral;
            z -= half;
          } else if (face === 2) {
            x += half;
            z += lateral;
          } else {
            x -= half;
            z += lateral;
          }
          WINDOWS.push({
            x,
            y,
            z,
            yaw: FACE_YAW[face],
            baseMul: 0.5 + pseudoRandom(n * 7 + 3) * 1.15,
          });
          n++;
        }
      }
    }
  }
}
const WINDOW_COUNT = WINDOWS.length;

const towerGeometry = new THREE.BoxGeometry(1, 1, 1);
const windowGeometry = new THREE.BoxGeometry(0.16, 0.24, 0.05);
const towerMaterial = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  metalness: 0.7,
  roughness: 0.45,
});
const windowMaterial = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  toneMapped: false,
});
const cyan = new THREE.Color(AIBRICKS_CYAN);
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

export default function AiBricksLandmark({ reducedMotion = false }) {
  const towersRef = useRef();
  const windowsRef = useRef();
  const wasFlaring = useRef(false);

  const beaconMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(AIBRICKS_CYAN).multiplyScalar(1.5),
        toneMapped: false,
      }),
    []
  );
  const poolMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: AIBRICKS_CYAN,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useEffect(
    () => () => {
      beaconMaterial.dispose();
      poolMaterial.dispose();
    },
    [beaconMaterial, poolMaterial]
  );

  // Static matrices + base window colors, written once.
  useLayoutEffect(() => {
    const towers = towersRef.current;
    if (towers) {
      for (let i = 0; i < TOWERS.length; i++) {
        const t = TOWERS[i];
        dummy.position.set(t.x, t.h / 2, t.z);
        dummy.quaternion.set(0, 0, 0, 1);
        dummy.scale.set(t.w, t.h, t.w);
        dummy.updateMatrix();
        towers.setMatrixAt(i, dummy.matrix);
      }
      towers.instanceMatrix.needsUpdate = true;
    }
    const windows = windowsRef.current;
    if (windows) {
      for (let i = 0; i < WINDOW_COUNT; i++) {
        const w = WINDOWS[i];
        dummy.position.set(w.x, w.y, w.z);
        dummy.quaternion.setFromAxisAngle(dummy.up, w.yaw);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        windows.setMatrixAt(i, dummy.matrix);
        tmpColor.copy(cyan).multiplyScalar(w.baseMul);
        windows.setColorAt(i, tmpColor);
      }
      windows.instanceMatrix.needsUpdate = true;
      if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const flare = reducedMotion ? 0 : hubState.flare[LANDMARK_INDEX];

    // Rooftop beacon: slow blink, hard flare on answer
    const blink = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.1);
    beaconMaterial.color
      .copy(cyan)
      .multiplyScalar(1.1 + blink * 0.5 + flare * 2.2);

    poolMaterial.opacity = 0.24 + flare * 0.3;

    // Window ripple: rewrite instance colors ONLY while the flare is live,
    // restore the baked base colors exactly once afterwards.
    const windows = windowsRef.current;
    if (!windows) return;
    if (flare > 0.001) {
      wasFlaring.current = true;
      const bandY = (1 - flare) * 6.2; // band travels bottom -> rooftops
      for (let i = 0; i < WINDOW_COUNT; i++) {
        const w = WINDOWS[i];
        const d = Math.abs(w.y - bandY);
        const boost = d < 0.9 ? (1 - d / 0.9) * 2.4 * flare : 0;
        tmpColor.copy(cyan).multiplyScalar(w.baseMul * (1 + boost));
        windows.setColorAt(i, tmpColor);
      }
      if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
    } else if (wasFlaring.current) {
      wasFlaring.current = false;
      for (let i = 0; i < WINDOW_COUNT; i++) {
        tmpColor.copy(cyan).multiplyScalar(WINDOWS[i].baseMul);
        windows.setColorAt(i, tmpColor);
      }
      if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={POS}>
      <instancedMesh
        ref={towersRef}
        args={[towerGeometry, towerMaterial, TOWERS.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={windowsRef}
        args={[windowGeometry, windowMaterial, WINDOW_COUNT]}
        frustumCulled={false}
      />

      {/* Rooftop beacon on the tallest tower */}
      <mesh position={[0, TOWERS[1].h + 0.3, 0.25]} material={beaconMaterial}>
        <octahedronGeometry args={[0.18, 0]} />
      </mesh>

      {/* Light pool on the grid floor */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolMaterial}>
        <planeGeometry args={[8, 8]} />
      </mesh>

      <LandmarkLabel
        text="AiBricks"
        color={AIBRICKS_CYAN}
        position={[0, TOWERS[1].h + 1.4, 0]}
      />
    </group>
  );
}
