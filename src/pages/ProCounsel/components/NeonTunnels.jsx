import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_CURVE, TUNNELS, tramMotion } from '../trackData';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const _dummy = new THREE.Object3D();
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();
const _color = new THREE.Color();

const ringGeom = new THREE.TorusGeometry(3.3, 0.09, 8, 40);
// White base; every ring is tinted (in HDR) through instanceColor.
const ringMat = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  toneMapped: false,
});

// Flattened ring descriptors: one entry per instance.
const RING_DEFS = (() => {
  const defs = [];
  for (let ti = 0; ti < TUNNELS.length; ti++) {
    const tunnel = TUNNELS[ti];
    const start = tunnel.center - ((tunnel.rings - 1) / 2) * tunnel.spacing;
    for (let r = 0; r < tunnel.rings; r++) {
      defs.push({
        t: start + r * tunnel.spacing,
        tunnel: ti,
        frac: tunnel.rings > 1 ? r / (tunnel.rings - 1) : 0,
        color: new THREE.Color(tunnel.color),
      });
    }
  }
  return defs;
})();
const RING_COUNT = RING_DEFS.length;

/**
 * Neon tunnel gates: three short sequences of glowing rings straddling the
 * track mid-segment, threaded by the tram at hyperspeed. A brightness pulse
 * races through each tunnel's rings (per-instance HDR color animation — the
 * pulse peaks well above 1.0 so it streaks through the bloom), surging even
 * harder while the tram is in hyperspeed. One instanced draw call total.
 */
export default function NeonTunnels() {
  const prefersReducedMotion = useReducedMotion();
  const meshRef = useRef();

  // Static placement along the curve, perpendicular to the tangent.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < RING_COUNT; i++) {
      const def = RING_DEFS[i];
      TRACK_CURVE.getPointAt(def.t, _pos);
      TRACK_CURVE.getTangentAt(def.t, _tan);
      _pos.y += 1.1; // centre the gate on the tram's path
      _dummy.position.copy(_pos);
      _look.copy(_pos).add(_tan);
      _dummy.lookAt(_look);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
      // Base tint (static fallback for reduced motion).
      _color.copy(def.color).multiplyScalar(1.4);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  // Racing pulse: per-tunnel bright wave sweeping ring to ring.
  useFrame((state) => {
    if (prefersReducedMotion) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = state.clock.elapsedTime;
    const surge = 1 + tramMotion.hyper * 1.6;
    for (let i = 0; i < RING_COUNT; i++) {
      const def = RING_DEFS[i];
      // Pulse position sweeps 0 -> 1.25 so it fully exits before wrapping.
      const pulsePos = ((time * (0.65 + def.tunnel * 0.09) + def.tunnel * 0.41) % 1) * 1.25;
      const d = def.frac - pulsePos;
      const pulse = Math.exp(-d * d * 55);
      const brightness = (1.15 + pulse * 2.6) * surge;
      _color.copy(def.color).multiplyScalar(brightness);
      mesh.setColorAt(i, _color);
    }
    mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[ringGeom, ringMat, RING_COUNT]}
      frustumCulled={false}
    />
  );
}
