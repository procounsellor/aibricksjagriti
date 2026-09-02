import React, { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

// --- Dawn-sky dome shader ---------------------------------------------------
// A single inward-facing sphere wrapping the whole climb: deep indigo night
// at the base, warming through violet into soft dawn-glow bands (gold /
// rose) near the top — the summit the student is climbing toward. Slow
// drift on the bands; frozen under reduced motion.
const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vDir;

  void main() {
    float h = vDir.y; // -1 (below) .. 1 (zenith)
    float az = atan(vDir.z, vDir.x);

    // Base vertical gradient: abyss -> deep indigo -> violet dusk.
    vec3 cAbyss  = vec3(0.012, 0.010, 0.05);
    vec3 cIndigo = vec3(0.055, 0.05, 0.16);
    vec3 cViolet = vec3(0.16, 0.11, 0.30);
    vec3 col = mix(cAbyss, cIndigo, smoothstep(-0.6, 0.05, h));
    col = mix(col, cViolet, smoothstep(0.05, 0.55, h));

    // Dawn glow bands near the top of the sky — the golden summit light.
    float wave = sin(az * 3.0 + uTime * 0.05) * 0.06
      + sin(az * 7.0 - uTime * 0.03) * 0.03;
    float band1 = smoothstep(0.38, 0.62, h + wave) * (1.0 - smoothstep(0.62, 0.9, h + wave));
    float band2 = smoothstep(0.6, 0.8, h - wave * 1.4) * (1.0 - smoothstep(0.8, 1.0, h - wave * 1.4));
    float crown = smoothstep(0.82, 1.0, h);

    vec3 cRose = vec3(0.45, 0.16, 0.24);
    vec3 cAmber = vec3(0.85, 0.55, 0.18);
    vec3 cGold = vec3(1.05, 0.82, 0.38);
    col += cRose * band1 * 0.55;
    col += cAmber * band2 * 0.7;
    col += cGold * crown * 0.85;

    // Faint violet shimmer curtains low in the sky (echo of the old aurora).
    float curtain = smoothstep(0.3, 1.0,
      sin(az * 9.0 + uTime * 0.11 + sin(az * 3.5 - uTime * 0.07) * 1.8));
    col += vec3(0.20, 0.13, 0.36) * curtain
      * smoothstep(-0.1, 0.25, h) * (1.0 - smoothstep(0.3, 0.6, h)) * 0.5;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * The study-cosmos sky: one inward-facing gradient dome, deep indigo below
 * warming to a dawn crown above. depthWrite off + renderOrder -10 so the
 * whole world draws over it. 1 draw call.
 */
export default function DawnSky() {
  const prefersReducedMotion = useReducedMotion();

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: { uTime: { value: 5 } },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useEffect(() => () => skyMat.dispose(), [skyMat]);

  useFrame((_, delta) => {
    if (prefersReducedMotion) return;
    skyMat.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <mesh
      material={skyMat}
      position={[0, 26, -16]}
      renderOrder={-10}
      frustumCulled={false}
    >
      <sphereGeometry args={[240, 24, 18]} />
    </mesh>
  );
}
