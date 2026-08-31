import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cityState } from '../timeOfDay';

/**
 * Aurora ribbons - three huge, slowly undulating translucent bands hanging
 * in the night sky behind the city. Vertex-animated sine waves, additive
 * cyan -> violet gradient with shimmer curtains, HDR (> 1) color so the
 * bright folds feed the bloom pass.
 *
 * Only visible at night (opacity follows cityState.starAlpha); the whole
 * group is culled and the uniforms untouched by day. Under reduced motion
 * the ribbons stay static and dim (uTime frozen at their birth pose).
 */

const auroraGeometry = new THREE.PlaneGeometry(150, 20, 56, 1);

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float w = sin(p.x * 0.045 + uTime * 0.5 + uPhase)
            + 0.6 * sin(p.x * 0.11 - uTime * 0.32 + uPhase * 2.0);
    p.y += w * 2.6;
    p.z += cos(p.x * 0.06 + uTime * 0.4 + uPhase) * 3.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float vert = pow(max(sin(vUv.y * 3.14159), 0.0), 1.5);
    float horiz = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float shimmer = 0.7 + 0.3 * sin(vUv.x * 60.0 - uTime * 1.2);
    vec3 col = mix(vec3(0.15, 0.95, 0.85), vec3(0.5, 0.25, 1.0), vUv.y) * 1.5;
    gl_FragColor = vec4(col, vert * horiz * shimmer * uOpacity);
  }
`;

function makeAuroraMaterial(phase) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: phase * 3.1 },
      uPhase: { value: phase },
      uOpacity: { value: 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

const RIBBONS = [
  { position: [-15, 52, -95], rotationY: 0.15, phase: 0 },
  { position: [22, 61, -108], rotationY: -0.12, phase: 2.4 },
  { position: [2, 45, -86], rotationY: 0.05, phase: 4.9 },
];

export function AuroraRibbons({ reducedMotion = false }) {
  const groupRef = useRef();
  const materials = useMemo(() => RIBBONS.map((r) => makeAuroraMaterial(r.phase)), []);

  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
    },
    [materials]
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const night = cityState.starAlpha;
    if (night < 0.03) {
      group.visible = false;
      return; // day: skip all uniform work
    }
    group.visible = true;
    const opacity = Math.pow(night, 1.5) * (reducedMotion ? 0.3 : 0.62);
    for (let i = 0; i < materials.length; i++) {
      const u = materials[i].uniforms;
      if (!reducedMotion) u.uTime.value += Math.min(delta, 0.05) * 0.9;
      u.uOpacity.value = opacity * (1 - i * 0.14);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {RIBBONS.map((ribbon, i) => (
        <mesh
          key={i}
          position={ribbon.position}
          rotation={[0, ribbon.rotationY, 0]}
          geometry={auroraGeometry}
          material={materials[i]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
