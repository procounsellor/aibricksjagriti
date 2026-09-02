import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PATH_CURVE, WALK_LIFT, climbMotion } from '../trackData';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const COUNT = 80;
const SPAN = 40; // local-z depth of the page shell around the student
const Z_BEHIND = 24; // how far behind the student the shell reaches

const _dummy = new THREE.Object3D();
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();

const pageGeom = new THREE.PlaneGeometry(0.42, 0.58);
const pageMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#fff6df').multiplyScalar(1.7), // HDR — feeds bloom
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
  fog: false,
});

// Deterministic PRNG for a stable page field.
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
 * The rush effect: when the student flies between checkpoints, a shell of
 * glowing loose pages tumbles past the camera — the education-world answer
 * to hyperspeed streaks. Pages stream backwards through a cylindrical shell
 * parented to the student's path frame, each fluttering around its own spin
 * rates. Entirely driven by climbMotion.rush — invisible (and skipped)
 * below a tiny threshold. One instanced draw call, zero per-frame
 * allocation.
 */
export default function PageRush() {
  const prefersReducedMotion = useReducedMotion();
  const groupRef = useRef();
  const meshRef = useRef();
  const phaseRef = useRef(0);

  // Static per-page parameters: shell angle, radius, z seed, stream speed,
  // tumble rates and phase offsets.
  const params = useMemo(() => {
    const rand = mulberry32(11902);
    const arr = new Float32Array(COUNT * 8);
    for (let i = 0; i < COUNT; i++) {
      const o = i * 8;
      arr[o] = rand() * Math.PI * 2; // shell angle
      arr[o + 1] = 2 + rand() * 4.5; // radius
      arr[o + 2] = rand() * SPAN; // z base
      arr[o + 3] = 0.75 + rand() * 0.6; // stream speed multiplier
      arr[o + 4] = 2 + rand() * 5; // tumble rate x
      arr[o + 5] = 1.5 + rand() * 4; // tumble rate y
      arr[o + 6] = rand() * Math.PI * 2; // tumble offset
      arr[o + 7] = 0.7 + rand() * 0.8; // scale
    }
    return arr;
  }, []);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    const rush = prefersReducedMotion ? 0 : climbMotion.rush;
    if (rush < 0.02) {
      if (group.visible) group.visible = false;
      return;
    }
    const delta = Math.min(rawDelta, 0.05);
    group.visible = true;
    pageMat.opacity = rush * 0.8;

    // Follow the student's path frame (position + heading along the tangent).
    const t = climbMotion.t;
    PATH_CURVE.getPointAt(t, _pos);
    PATH_CURVE.getTangentAt(t, _tan);
    _pos.y += WALK_LIFT + 1;
    group.position.copy(_pos);
    _look.copy(_pos).add(_tan);
    group.lookAt(_look);

    // Stream the shell backwards at (roughly) climb speed; the tumble phase
    // advances with the same clock so pages flutter harder while rushing.
    phaseRef.current += climbMotion.speed * 240 * delta;
    const phase = phaseRef.current;

    for (let i = 0; i < COUNT; i++) {
      const o = i * 8;
      const angle = params[o];
      const radius = params[o + 1];
      const zWrapped =
        ((((params[o + 2] - phase * params[o + 3]) % SPAN) + SPAN) % SPAN) -
        Z_BEHIND;
      _dummy.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        zWrapped
      );
      const tumble = phase * 0.35 + params[o + 6];
      _dummy.rotation.set(
        tumble * params[o + 4] * 0.3,
        tumble * params[o + 5] * 0.3,
        params[o + 6]
      );
      const s = params[o + 7];
      _dummy.scale.set(s, s, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} visible={false}>
      <instancedMesh
        ref={meshRef}
        args={[pageGeom, pageMat, COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
