import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPIRAL_CENTER, SUMMIT_HEIGHT } from '../trackData';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

const BOOK_COUNT = 26;
const PAPER_COUNT = 44;

const bookGeom = new THREE.BoxGeometry(3, 0.5, 2.1);
const paperGeom = new THREE.PlaneGeometry(0.9, 1.25);

// Dim per-instance tints; these live in the mid-distance so they stay LDR
// and let the fog seat them into the sky.
const bookMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.85,
  metalness: 0.15,
});
const paperMat = new THREE.MeshBasicMaterial({
  color: '#cfd4f5',
  transparent: true,
  opacity: 0.55,
  side: THREE.DoubleSide,
  depthWrite: false,
});

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
 * Ambience: large slow background books drifting like islands around the
 * spiral, plus loose sheets of paper tumbling in the void. Per-instance
 * parameters are baked once; the frame loop only rewrites matrices from a
 * module-scope dummy (zero allocation). Reduced motion: everything placed
 * once, frozen. 2 instanced draw calls.
 */
export default function FloatingBooks() {
  const prefersReducedMotion = useReducedMotion();
  const booksRef = useRef();
  const papersRef = useRef();
  const placedRef = useRef(false);

  // Static per-instance parameters: base position, bob phase/amp, spin rates.
  const { bookParams, paperParams } = useMemo(() => {
    const rand = mulberry32(777001);
    const bp = new Float32Array(BOOK_COUNT * 8);
    for (let i = 0; i < BOOK_COUNT; i++) {
      const o = i * 8;
      const angle = rand() * Math.PI * 2;
      const radius = 48 + rand() * 70;
      bp[o] = SPIRAL_CENTER.x + Math.cos(angle) * radius; // x
      bp[o + 1] = -6 + rand() * (SUMMIT_HEIGHT + 8); // y
      bp[o + 2] = SPIRAL_CENTER.z + Math.sin(angle) * radius; // z
      bp[o + 3] = rand() * Math.PI * 2; // bob phase
      bp[o + 4] = 0.5 + rand() * 1.1; // bob amplitude
      bp[o + 5] = (rand() - 0.5) * 0.16; // yaw spin rate
      bp[o + 6] = rand() * Math.PI * 2; // base yaw
      bp[o + 7] = 1.4 + rand() * 2.6; // scale
    }
    const pp = new Float32Array(PAPER_COUNT * 8);
    for (let i = 0; i < PAPER_COUNT; i++) {
      const o = i * 8;
      const angle = rand() * Math.PI * 2;
      const radius = 30 + rand() * 80;
      pp[o] = SPIRAL_CENTER.x + Math.cos(angle) * radius;
      pp[o + 1] = -8 + rand() * (SUMMIT_HEIGHT + 12);
      pp[o + 2] = SPIRAL_CENTER.z + Math.sin(angle) * radius;
      pp[o + 3] = rand() * Math.PI * 2; // flutter phase
      pp[o + 4] = 0.8 + rand() * 1.6; // flutter amp
      pp[o + 5] = 0.25 + rand() * 0.5; // tumble rate
      pp[o + 6] = rand() * Math.PI * 2; // tumble offset
      pp[o + 7] = 0.7 + rand() * 0.9; // scale
    }
    return { bookParams: bp, paperParams: pp };
  }, []);

  useFrame((state) => {
    const books = booksRef.current;
    const papers = papersRef.current;
    if (!books || !papers) return;
    // Reduced motion: place everything once at phase 0, then never move.
    if (prefersReducedMotion && placedRef.current) return;
    const time = prefersReducedMotion ? 0 : state.clock.elapsedTime;
    const firstPass = !placedRef.current;
    placedRef.current = true;

    for (let i = 0; i < BOOK_COUNT; i++) {
      const o = i * 8;
      _dummy.position.set(
        bookParams[o],
        bookParams[o + 1] +
          Math.sin(time * 0.22 + bookParams[o + 3]) * bookParams[o + 4],
        bookParams[o + 2]
      );
      _dummy.rotation.set(
        Math.sin(time * 0.1 + bookParams[o + 3]) * 0.1,
        bookParams[o + 6] + time * bookParams[o + 5],
        0
      );
      _dummy.scale.setScalar(bookParams[o + 7]);
      _dummy.updateMatrix();
      books.setMatrixAt(i, _dummy.matrix);
      if (firstPass) {
        // Dusky indigo/violet island tints (baked on the first pass).
        _color.setHSL(0.68 + (i % 5) * 0.02, 0.4, 0.32 + (i % 3) * 0.08);
        books.setColorAt(i, _color);
      }
    }
    for (let i = 0; i < PAPER_COUNT; i++) {
      const o = i * 8;
      _dummy.position.set(
        paperParams[o] + Math.sin(time * 0.3 + paperParams[o + 3]) * 1.2,
        paperParams[o + 1] +
          Math.sin(time * 0.4 + paperParams[o + 6]) * paperParams[o + 4],
        paperParams[o + 2]
      );
      _dummy.rotation.set(
        time * paperParams[o + 5] + paperParams[o + 6],
        paperParams[o + 3] + time * paperParams[o + 5] * 0.7,
        0
      );
      _dummy.scale.setScalar(paperParams[o + 7]);
      _dummy.updateMatrix();
      papers.setMatrixAt(i, _dummy.matrix);
    }
    books.instanceMatrix.needsUpdate = true;
    papers.instanceMatrix.needsUpdate = true;
    if (firstPass && books.instanceColor) books.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={booksRef}
        args={[bookGeom, bookMat, BOOK_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={papersRef}
        args={[paperGeom, paperMat, PAPER_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
