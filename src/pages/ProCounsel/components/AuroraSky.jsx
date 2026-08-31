import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

// --- Aurora backdrop shader -------------------------------------------------
const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float x = vUv.x;
    float y = vUv.y;

    // Two slow, wavy aurora curtains drifting across the sky.
    float w1 = sin(x * 9.0 + uTime * 0.11 + sin(x * 3.5 - uTime * 0.07) * 1.8);
    float w2 = sin(x * 14.0 - uTime * 0.08 + 2.1 + sin(x * 5.0 + uTime * 0.05) * 1.2);
    float band1 = smoothstep(0.25, 1.0, w1)
      * smoothstep(0.08, 0.45, y) * (1.0 - smoothstep(0.55, 0.95, y));
    float band2 = smoothstep(0.4, 1.0, w2)
      * smoothstep(0.18, 0.55, y) * (1.0 - smoothstep(0.5, 0.85, y));

    vec3 cCyan = vec3(0.13, 0.55, 0.75);
    vec3 cViolet = vec3(0.45, 0.30, 0.85);
    vec3 cMagenta = vec3(0.80, 0.35, 0.75);
    vec3 curtain2 = mix(cViolet, cMagenta, 0.5 + 0.5 * sin(uTime * 0.05 + x * 4.0));
    vec3 aurora = cCyan * band1 + curtain2 * band2;

    // Dense city-glow bleed hugging the horizon.
    float horizon = pow(1.0 - smoothstep(0.0, 0.30, y), 2.0);
    vec3 glow = vec3(0.38, 0.22, 0.58) * horizon * 1.5
      + vec3(0.10, 0.32, 0.48) * horizon;

    vec3 col = aurora * 0.9 + glow;
    float alpha = clamp(max(max(band1, band2) * 0.7, horizon * 0.9), 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

// --- Shooting stars ---------------------------------------------------------
const STAR_DEFS = [
  { period: 7.3, offset: 0.13 },
  { period: 11.7, offset: 0.61 },
];
const starGeom = new THREE.PlaneGeometry(1, 1);
const starMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#cfeaff').multiplyScalar(2.6), // HDR streak
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
  fog: false,
});

// Deterministic scalar hash — a fresh pseudo-random per streak cycle.
function hash(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Ambience layer: one big aurora shader plane far behind the city (slow
 * gradient curtains + a dense horizon glow baked into the same fragment
 * shader — 1 draw call), plus two occasional shooting-star streaks arcing
 * across the high sky. Reduced motion: the aurora freezes (time uniform
 * stops advancing) and the streaks stay hidden.
 */
export default function AuroraSky() {
  const prefersReducedMotion = useReducedMotion();
  const starRefs = useRef([]);

  const auroraMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: AURORA_VERT,
        fragmentShader: AURORA_FRAG,
        uniforms: { uTime: { value: 8 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    []
  );

  useEffect(() => () => auroraMat.dispose(), [auroraMat]);

  useFrame((state, delta) => {
    if (prefersReducedMotion) return;
    auroraMat.uniforms.uTime.value += Math.min(delta, 0.05);

    // Shooting stars: each star follows a fixed period; within each cycle it
    // is visible for a short window, on a straight diagonal path seeded from
    // the cycle index (deterministic — zero allocation, no state).
    const time = state.clock.elapsedTime;
    for (let k = 0; k < STAR_DEFS.length; k++) {
      const mesh = starRefs.current[k];
      if (!mesh) continue;
      const def = STAR_DEFS[k];
      const phase = time / def.period + def.offset;
      const cycle = Math.floor(phase);
      const prog = (phase - cycle) / 0.11; // visible for 11% of the period
      if (prog >= 1) {
        mesh.visible = false;
        continue;
      }
      const seed = cycle * 7.13 + k * 91.7;
      const startX = -160 + hash(seed) * 320;
      const startY = 42 + hash(seed + 1.7) * 30;
      const z = -140 - hash(seed + 3.1) * 90;
      const dirX = 30 + hash(seed + 5.9) * 40;
      const dirY = -(8 + hash(seed + 7.3) * 10);
      mesh.visible = true;
      mesh.position.set(startX + dirX * prog, startY + dirY * prog, z);
      mesh.rotation.z = Math.atan2(dirY, dirX);
      mesh.scale.set(11 + hash(seed + 9.2) * 8, 0.09, 1);
      // Quick flare in, longer tail out.
      starMat.opacity = Math.min(1, prog * 6) * (1 - prog) * 0.9;
    }
  });

  return (
    <group>
      {/* Aurora + horizon glow backdrop, far behind the last station. */}
      <mesh material={auroraMat} position={[0, 62, -250]} frustumCulled={false}>
        <planeGeometry args={[760, 240]} />
      </mesh>

      {STAR_DEFS.map((_, k) => (
        <mesh
          key={`star-${k}`}
          ref={(el) => {
            starRefs.current[k] = el;
          }}
          geometry={starGeom}
          material={starMat}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
