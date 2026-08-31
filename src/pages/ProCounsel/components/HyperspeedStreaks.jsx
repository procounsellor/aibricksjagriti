import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_CURVE, RAIL_LIFT, tramMotion } from '../trackData';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const COUNT = 90;
const SPAN = 44; // local-z depth of the streak shell around the tram
const Z_BEHIND = 26; // how far behind the tram the shell reaches

const _dummy = new THREE.Object3D();
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();

const streakGeom = new THREE.BoxGeometry(0.035, 0.035, 1);
const streakMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#9be8ff').multiplyScalar(2.4), // HDR — feeds bloom
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
  fog: false,
});

// Deterministic PRNG (same recipe as CityBackdrop) for a stable streak field.
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
 * Radial warp speed-lines for the hyperspeed run: a cylindrical shell of thin
 * additive bars around the track axis, parented to the tram frame and
 * streamed backwards past the camera. Entirely driven by tramMotion.hyper —
 * invisible (and skipped) below a tiny threshold, stretching up to ~3.5x and
 * brightening as hyper approaches 1. One instanced draw call.
 */
export default function HyperspeedStreaks() {
  const prefersReducedMotion = useReducedMotion();
  const groupRef = useRef();
  const meshRef = useRef();
  const phaseRef = useRef(0);

  // Static per-streak parameters: shell angle, radius, z seed, speed, length.
  const params = useMemo(() => {
    const rand = mulberry32(90210);
    const arr = new Float32Array(COUNT * 5);
    for (let i = 0; i < COUNT; i++) {
      const o = i * 5;
      arr[o] = rand() * Math.PI * 2; // angle
      arr[o + 1] = 2.2 + rand() * 4.4; // radius
      arr[o + 2] = rand() * SPAN; // z base
      arr[o + 3] = 0.75 + rand() * 0.6; // speed multiplier
      arr[o + 4] = 1.6 + rand() * 2.6; // base length
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    const hyper = prefersReducedMotion ? 0 : tramMotion.hyper;
    if (hyper < 0.02) {
      if (group.visible) group.visible = false;
      return;
    }
    group.visible = true;
    streakMat.opacity = hyper * 0.85;

    // Follow the tram frame (position + heading along the curve tangent).
    const t = tramMotion.t;
    TRACK_CURVE.getPointAt(t, _pos);
    TRACK_CURVE.getTangentAt(t, _tan);
    _pos.y += RAIL_LIFT;
    group.position.copy(_pos);
    _look.copy(_pos).add(_tan);
    group.lookAt(_look);

    // Stream the shell backwards at (roughly) track speed, scaled up so the
    // lines whip past even harder than the world does.
    phaseRef.current += tramMotion.speed * 260 * Math.min(delta, 0.05);
    const phase = phaseRef.current;
    const stretch = 0.5 + hyper * 3;

    for (let i = 0; i < COUNT; i++) {
      const o = i * 5;
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
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, params[o + 4] * stretch);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} visible={false}>
      <instancedMesh
        ref={meshRef}
        args={[streakGeom, streakMat, COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
