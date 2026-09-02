import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PATH_CURVE, WALK_LIFT, climbMotion } from '../trackData';
import { NEON_GOLD, NEON_CYAN } from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const COUNT = 130;
const LIFE_SECONDS = 1.25;

const _pos = new THREE.Vector3();
const _gold = new THREE.Color(NEON_GOLD);
const _cyan = new THREE.Color(NEON_CYAN);
const _c = new THREE.Color();

const trailMat = new THREE.PointsMaterial({
  size: 0.2,
  vertexColors: true,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true,
  toneMapped: false,
  fog: false,
});

/**
 * The student's wake: a ribbon of glowing sparkle-dust shed along the book
 * path. One pre-allocated ring-buffer particle pool — particles are emitted
 * behind the student while moving (emission rate follows speed, surging
 * during the rush), drift gently upward and fade gold->cyan over their
 * short life. Dead particles are colored black, which is invisible under
 * additive blending, so the pool never needs resizing or sorting. 1 draw
 * call, zero per-frame allocation. Hidden under reduced motion.
 */
export default function SparkleTrail() {
  const prefersReducedMotion = useReducedMotion();
  const pointsRef = useRef();
  const state = useRef({
    head: 0,
    emitAcc: 0,
    life: new Float32Array(COUNT), // 0 = dead
    vel: new Float32Array(COUNT * 3),
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3)
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3)
    );
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, rawDelta) => {
    const points = pointsRef.current;
    if (!points) return;
    if (prefersReducedMotion) {
      points.visible = false;
      return;
    }
    points.visible = true;
    const delta = Math.min(rawDelta, 0.05);
    const s = state.current;
    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color.array;
    const life = s.life;
    const vel = s.vel;

    // --- Emit new sparkles at the student's heels while moving ------------
    const speed = climbMotion.speed;
    if (speed > 0.0015) {
      PATH_CURVE.getPointAt(climbMotion.t, _pos);
      _pos.y += WALK_LIFT + 0.25;
      const rate = Math.min(90, speed * 1500 * (1 + climbMotion.rush * 1.5));
      s.emitAcc += rate * delta;
      while (s.emitAcc >= 1) {
        s.emitAcc -= 1;
        const i = s.head;
        s.head = (s.head + 1) % COUNT;
        const vi = i * 3;
        positions[vi] = _pos.x + (Math.random() - 0.5) * 0.5;
        positions[vi + 1] = _pos.y + Math.random() * 0.4;
        positions[vi + 2] = _pos.z + (Math.random() - 0.5) * 0.5;
        vel[vi] = (Math.random() - 0.5) * 0.5;
        vel[vi + 1] = 0.3 + Math.random() * 0.7;
        vel[vi + 2] = (Math.random() - 0.5) * 0.5;
        life[i] = 1;
      }
    }

    // --- Age, drift and tint every particle -------------------------------
    const surge = 1.4 + climbMotion.rush * 1.6; // HDR brightness at warp
    for (let i = 0; i < COUNT; i++) {
      const vi = i * 3;
      let l = life[i];
      if (l <= 0) {
        // Dead: black = invisible under additive blending.
        colors[vi] = 0;
        colors[vi + 1] = 0;
        colors[vi + 2] = 0;
        continue;
      }
      l = Math.max(0, l - delta / LIFE_SECONDS);
      life[i] = l;
      positions[vi] += vel[vi] * delta;
      positions[vi + 1] += vel[vi + 1] * delta;
      positions[vi + 2] += vel[vi + 2] * delta;
      // Gold at birth cooling toward cyan, fading out as it dies.
      _c.copy(_gold).lerp(_cyan, 1 - l);
      const b = l * l * surge;
      colors[vi] = _c.r * b;
      colors[vi + 1] = _c.g * b;
      colors[vi + 2] = _c.b * b;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={trailMat}
      visible={false}
      frustumCulled={false}
    />
  );
}
