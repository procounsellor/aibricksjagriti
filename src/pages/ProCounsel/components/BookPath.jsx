import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { PATH_CURVE } from '../trackData';
import {
  BOOK_COVER_DARK,
  PARCHMENT,
  BOOK_INDIGO,
  BOOK_CYAN,
  NEON_GOLD,
} from '../colors';

const UP = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D();
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _side = new THREE.Vector3();
const _look = new THREE.Vector3();
const _color = new THREE.Color();
const _gold = new THREE.Color(NEON_GOLD);

const BOOK_COUNT = 220;

// One giant closed book = cover slab + inset pages block + a glowing edge
// strip along the step's leading edge (the stair-nosing light).
const coverGeom = new THREE.BoxGeometry(3.4, 0.52, 2.35);
const pagesGeom = new THREE.BoxGeometry(3.14, 0.34, 2.44);
const edgeGeom = new THREE.BoxGeometry(3.3, 0.07, 0.14);

const coverMat = new THREE.MeshStandardMaterial({
  color: BOOK_COVER_DARK,
  roughness: 0.75,
  metalness: 0.25,
});
// White base — per-instance tint carries the parchment / indigo / cyan
// alternation (instanceColor works on standard materials).
const pagesMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.9,
  metalness: 0,
});
// HDR base (> 1) so every step edge feeds the bloom; tinted per instance.
const edgeMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ffffff').multiplyScalar(1.9),
  toneMapped: false,
});

// Deterministic PRNG for stable step jitter across renders.
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

const PAGE_TINTS = [
  new THREE.Color(PARCHMENT),
  new THREE.Color(BOOK_INDIGO).multiplyScalar(1.5),
  new THREE.Color(BOOK_CYAN).multiplyScalar(1.6),
];
const EDGE_TINTS = [
  new THREE.Color('#ffd9a0'),
  new THREE.Color('#818cf8'),
  new THREE.Color('#22d3ee'),
];

/**
 * The ascent itself: a rising, gently spiraling stairway of giant glowing
 * books laid like stepping stones, climbing from darkness at t = 0 toward
 * the golden summit at t = 1. Fully static after mount. Near the summit the
 * page tints and edge lights warm toward gold. 3 instanced draw calls.
 */
export default function BookPath() {
  const coversRef = useRef();
  const pagesRef = useRef();
  const edgesRef = useRef();

  useLayoutEffect(() => {
    const covers = coversRef.current;
    const pages = pagesRef.current;
    const edges = edgesRef.current;
    if (!covers || !pages || !edges) return;
    const rand = mulberry32(20260902);

    for (let i = 0; i < BOOK_COUNT; i++) {
      const t = (i + 0.5) / BOOK_COUNT;
      PATH_CURVE.getPointAt(t, _pos);
      PATH_CURVE.getTangentAt(t, _tan);
      _side.crossVectors(UP, _tan).setY(0).normalize();

      // Step tread: top face just under the walk line, slight lateral and
      // yaw jitter so the stairway reads hand-laid, not extruded.
      const lateral = (rand() - 0.5) * 0.34;
      _dummy.position.set(
        _pos.x + _side.x * lateral,
        _pos.y - 0.3 - rand() * 0.06,
        _pos.z + _side.z * lateral
      );
      _look.copy(_dummy.position).add(_tan);
      _look.y = _dummy.position.y; // keep the treads level
      _dummy.lookAt(_look);
      _dummy.rotateY(Math.PI / 2 + (rand() - 0.5) * 0.14);
      const s = 0.92 + rand() * 0.2;
      _dummy.scale.set(s, 1, s);
      _dummy.updateMatrix();

      covers.setMatrixAt(i, _dummy.matrix);
      pages.setMatrixAt(i, _dummy.matrix);
      edges.setMatrixAt(i, _dummy.matrix);

      // Warm-parchment / indigo / cyan alternation, blending to gold as the
      // path nears the summit.
      const goldMix = THREE.MathUtils.smoothstep(t, 0.82, 1);
      _color.copy(PAGE_TINTS[i % 3]).lerp(_gold, goldMix * 0.75);
      pages.setColorAt(i, _color);
      _color
        .copy(EDGE_TINTS[i % 3])
        .lerp(_gold, goldMix)
        .multiplyScalar(0.9 + rand() * 0.35);
      edges.setColorAt(i, _color);
    }

    covers.instanceMatrix.needsUpdate = true;
    pages.instanceMatrix.needsUpdate = true;
    edges.instanceMatrix.needsUpdate = true;
    if (pages.instanceColor) pages.instanceColor.needsUpdate = true;
    if (edges.instanceColor) edges.instanceColor.needsUpdate = true;
    covers.computeBoundingSphere();
    pages.computeBoundingSphere();
    edges.computeBoundingSphere();
  }, []);

  return (
    <group>
      <instancedMesh
        ref={coversRef}
        args={[coverGeom, coverMat, BOOK_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pagesRef}
        args={[pagesGeom, pagesMat, BOOK_COUNT]}
        frustumCulled={false}
      />
      {/* Glowing leading-edge strip on every step (offset forward + up). */}
      <instancedMesh
        ref={edgesRef}
        args={[edgeGeom, edgeMat, BOOK_COUNT]}
        frustumCulled={false}
        position={[0, 0.28, 0]}
      />
    </group>
  );
}
