import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPIRAL_CENTER, climbMotion } from '../trackData';

const COUNT = 420;

const starMat = new THREE.PointsMaterial({
  size: 0.55,
  color: new THREE.Color('#cdd9ff'),
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true,
  toneMapped: false,
  fog: false,
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
 * The star field below the horizon: a static shell of points filling the
 * dark void under and around the base of the climb. Its opacity is tied to
 * the climb progress — the stars fade away as the student ascends toward
 * dawn (scroll-linked, so it works identically under reduced motion).
 * 1 draw call, fully static geometry.
 */
export default function StarField() {
  const pointsRef = useRef();

  const geometry = useMemo(() => {
    const rand = mulberry32(31337);
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const vi = i * 3;
      const angle = rand() * Math.PI * 2;
      const radius = 35 + rand() * 165;
      positions[vi] = SPIRAL_CENTER.x + Math.cos(angle) * radius;
      // Mostly below the base of the spiral, thinning upward.
      positions[vi + 1] = -55 + Math.pow(rand(), 0.6) * 75;
      positions[vi + 2] = SPIRAL_CENTER.z + Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    // Fade with ascent: bright at the dark base, gone by the golden summit.
    const target = 0.85 * (1 - THREE.MathUtils.smoothstep(climbMotion.t, 0.35, 0.9));
    if (Math.abs(starMat.opacity - target) > 0.002) starMat.opacity = target;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={starMat}
      frustumCulled={false}
    />
  );
}
