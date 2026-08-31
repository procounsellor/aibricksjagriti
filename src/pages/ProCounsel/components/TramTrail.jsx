import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_CURVE, tramMotion } from '../trackData';
import { NEON_CYAN } from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const UP = new THREE.Vector3(0, 1, 0);
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _side = new THREE.Vector3();

const SEGS = 22; // ribbon segments
const HALF_W = 0.42;

// Base white material — the vertex colors carry the tint; the material color
// is driven above 1.0 during hyperspeed so the whole ribbon floods the bloom.
const trailMat = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  vertexColors: true,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
  fog: false,
});

/**
 * Light trail behind the tram: a flat additive ribbon hugging the track,
 * rebuilt imperatively from a preallocated buffer. Vertex colors fade from
 * neon cyan at the tram to black at the tail (black contributes nothing under
 * additive blending, giving a clean fade with no alpha sorting issues).
 * The ribbon length follows the tram's recent speed, so it collapses to
 * nothing while the tram idles at a station.
 */
export default function TramTrail() {
  const meshRef = useRef();
  const prefersReducedMotion = useReducedMotion();
  const spanRef = useRef(0);
  const lastT = useRef(-1);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertCount = (SEGS + 1) * 2;
    const positions = new Float32Array(vertCount * 3);
    const colors = new Float32Array(vertCount * 3);
    const base = new THREE.Color(NEON_CYAN);
    for (let i = 0; i <= SEGS; i++) {
      // Quadratic fade toward the tail.
      const fade = Math.pow(1 - i / SEGS, 2);
      for (let k = 0; k < 2; k++) {
        const vi = (i * 2 + k) * 3;
        colors[vi] = base.r * fade;
        colors[vi + 1] = base.g * fade;
        colors[vi + 2] = base.b * fade;
      }
    }
    const indices = [];
    for (let i = 0; i < SEGS; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = i * 2 + 2;
      const d = i * 2 + 3;
      indices.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (prefersReducedMotion) {
      mesh.visible = false;
      return;
    }

    const t = tramMotion.t;
    const hyper = tramMotion.hyper;
    // Trail length in curve-t units, following recent speed — and roughly
    // DOUBLING in reach during hyperspeed.
    const targetSpan = THREE.MathUtils.clamp(
      tramMotion.speed * (0.3 + hyper * 0.35),
      0,
      0.05 + hyper * 0.055
    );
    const prevSpan = spanRef.current;
    const span =
      prevSpan + (targetSpan - prevSpan) * Math.min(1, delta * 5);
    spanRef.current = span;

    // Brightness surge: > 1 material color feeds the bloom hard at warp.
    trailMat.color.setScalar(1.25 + hyper * 1.9);

    const tMoved = Math.abs(t - lastT.current) > 1e-5;
    const spanMoved = Math.abs(span - prevSpan) > 1e-5;
    if (!tMoved && !spanMoved && lastT.current >= 0) return;
    lastT.current = t;

    if (span < 0.0008) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const posAttr = geometry.attributes.position;
    const arr = posAttr.array;
    const halfW = HALF_W * (1 + hyper * 0.55); // widens at warp
    for (let i = 0; i <= SEGS; i++) {
      const tt = Math.max(0, t - (span * i) / SEGS);
      TRACK_CURVE.getPointAt(tt, _pos);
      TRACK_CURVE.getTangentAt(tt, _tan);
      _side.crossVectors(UP, _tan).setY(0).normalize();
      // Just above the rails, below the tram floor.
      const y = _pos.y + 0.18;
      const vi = i * 2 * 3;
      arr[vi] = _pos.x - _side.x * halfW;
      arr[vi + 1] = y;
      arr[vi + 2] = _pos.z - _side.z * halfW;
      arr[vi + 3] = _pos.x + _side.x * halfW;
      arr[vi + 4] = y;
      arr[vi + 5] = _pos.z + _side.z * halfW;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={trailMat}
      frustumCulled={false}
    />
  );
}
