import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { glowTexture } from './textures';
import { STAR_BLUE } from '../colors';

/**
 * The cosmic backdrop — all procedural, zero network assets:
 * - a deterministic star dome (base layer + a brighter twinkling layer)
 * - pooled shooting stars (3 thin HDR streaks; night-sky spice)
 * - two slowly undulating aurora bands behind the tableau (vertex-animated
 *   sine waves, additive cyan -> violet HDR gradient feeding the bloom)
 * - one Points cloud of slow cosmic dust drifting through the hub
 *
 * Under reduced motion: stars static (no twinkle modulation), no shooting
 * stars, auroras frozen dim, dust frozen. 8 draw calls total.
 */

// --- star dome -------------------------------------------------------------

const STAR_COUNT = 380;
const TWINKLE_COUNT = 130;

function buildStarGeometry(count, startSeed) {
  const positions = new Float32Array(count * 3);
  let seed = startSeed;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    const az = rand() * Math.PI * 2;
    const el = Math.asin(0.04 + rand() * 0.94);
    const r = 130 + rand() * 20;
    positions[i * 3] = Math.cos(el) * Math.cos(az) * r;
    positions[i * 3 + 1] = Math.sin(el) * r;
    positions[i * 3 + 2] = Math.cos(el) * Math.sin(az) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

const starGeometry = buildStarGeometry(STAR_COUNT, 1);
const twinkleGeometry = buildStarGeometry(TWINKLE_COUNT, 999);
const starMaterial = new THREE.PointsMaterial({
  color: STAR_BLUE,
  size: 1.15,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.75,
  fog: false,
  depthWrite: false,
});
const twinkleMaterial = new THREE.PointsMaterial({
  color: '#f2f6ff',
  size: 1.8,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.6,
  fog: false,
  depthWrite: false,
});

// --- aurora bands ----------------------------------------------------------

const auroraGeometry = new THREE.PlaneGeometry(140, 16, 56, 1);

const AURORA_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float w = sin(p.x * 0.045 + uTime * 0.5 + uPhase)
            + 0.6 * sin(p.x * 0.11 - uTime * 0.32 + uPhase * 2.0);
    p.y += w * 2.2;
    p.z += cos(p.x * 0.06 + uTime * 0.4 + uPhase) * 2.6;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float vert = pow(max(sin(vUv.y * 3.14159), 0.0), 1.5);
    float horiz = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
    float shimmer = 0.7 + 0.3 * sin(vUv.x * 60.0 - uTime * 1.2);
    vec3 col = mix(vec3(0.13, 0.85, 0.8), vec3(0.5, 0.3, 1.0), vUv.y) * 1.45;
    gl_FragColor = vec4(col, vert * horiz * shimmer * uOpacity);
  }
`;

function makeAuroraMaterial(phase) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: phase * 3.1 },
      uPhase: { value: phase },
      uOpacity: { value: 0.4 },
    },
    vertexShader: AURORA_VERT,
    fragmentShader: AURORA_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

const RIBBONS = [
  { position: [-14, 34, -70], rotationY: 0.14, phase: 0 },
  { position: [16, 41, -82], rotationY: -0.1, phase: 2.7 },
];

// --- cosmic dust -----------------------------------------------------------

const DUST_COUNT = 150;

function buildDustGeometry() {
  const positions = new Float32Array(DUST_COUNT * 3);
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < DUST_COUNT; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 3 + rand() * 24;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.4 + rand() * 11;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

const dustGeometry = buildDustGeometry();

// --- shooting stars --------------------------------------------------------

const STREAK_POOL = 3;
const streakGeometry = new THREE.BoxGeometry(1, 1, 1);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const tmpQuat = new THREE.Quaternion();

export default function SpaceEnvironment({ reducedMotion = false }) {
  const streakRefs = useRef([]);
  const spawnTimer = useRef(4);
  const dustRef = useRef();

  const streaks = useMemo(
    () =>
      Array.from({ length: STREAK_POOL }, () => ({
        active: false,
        life: 0,
        speed: 55,
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
      })),
    []
  );

  const streakMaterials = useMemo(
    () =>
      Array.from(
        { length: STREAK_POOL },
        () =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color('#eaf4ff').multiplyScalar(2.4),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            fog: false,
          })
      ),
    []
  );

  const auroraMaterials = useMemo(
    () => RIBBONS.map((r) => makeAuroraMaterial(r.phase)),
    []
  );

  const dustMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: '#9fd8e8',
        size: 0.28,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useEffect(
    () => () => {
      streakMaterials.forEach((m) => m.dispose());
      auroraMaterials.forEach((m) => m.dispose());
      dustMaterial.dispose();
    },
    [streakMaterials, auroraMaterials, dustMaterial]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Star twinkle (static under reduced motion)
    if (!reducedMotion) {
      const tw = Math.sin(t * 2.3) * Math.sin(t * 0.7 + 1.3);
      twinkleMaterial.opacity = 0.35 + 0.45 * Math.abs(tw);
    }

    // Aurora undulation
    for (let i = 0; i < auroraMaterials.length; i++) {
      const u = auroraMaterials[i].uniforms;
      if (!reducedMotion) u.uTime.value += dt * 0.9;
      u.uOpacity.value = (reducedMotion ? 0.24 : 0.4) * (1 - i * 0.15);
    }

    // Cosmic dust drift
    const dust = dustRef.current;
    if (dust && !reducedMotion) {
      dust.rotation.y += dt * 0.014;
      dust.position.y = Math.sin(t * 0.24) * 0.35;
    }

    // Shooting stars — pooled, never under reduced motion
    if (reducedMotion) return;

    spawnTimer.current -= dt;
    if (spawnTimer.current <= 0) {
      spawnTimer.current = 4 + Math.random() * 5;
      for (let i = 0; i < STREAK_POOL; i++) {
        const s = streaks[i];
        if (s.active) continue;
        s.active = true;
        s.life = 0;
        s.speed = 42 + Math.random() * 26;
        s.pos.set(
          (Math.random() - 0.5) * 110,
          42 + Math.random() * 22,
          -55 + Math.random() * 40
        );
        s.dir
          .set((Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.4), -0.45, 0.12)
          .normalize();
        const mesh = streakRefs.current[i];
        if (mesh) {
          tmpQuat.setFromUnitVectors(X_AXIS, s.dir);
          mesh.quaternion.copy(tmpQuat);
          mesh.scale.set(6, 0.12, 0.12);
        }
        break;
      }
    }

    for (let i = 0; i < STREAK_POOL; i++) {
      const s = streaks[i];
      const mesh = streakRefs.current[i];
      if (!mesh) continue;
      if (!s.active) {
        mesh.visible = false;
        continue;
      }
      s.life += dt / 0.9;
      if (s.life >= 1) {
        s.active = false;
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      s.pos.addScaledVector(s.dir, s.speed * dt);
      mesh.position.copy(s.pos);
      streakMaterials[i].opacity = Math.sin(s.life * Math.PI) * 0.9;
    }
  });

  return (
    <group>
      <points geometry={starGeometry} material={starMaterial} frustumCulled={false} />
      <points geometry={twinkleGeometry} material={twinkleMaterial} frustumCulled={false} />

      {RIBBONS.map((ribbon, i) => (
        <mesh
          key={i}
          position={ribbon.position}
          rotation={[0, ribbon.rotationY, 0]}
          geometry={auroraGeometry}
          material={auroraMaterials[i]}
          frustumCulled={false}
        />
      ))}

      <points
        ref={dustRef}
        geometry={dustGeometry}
        material={dustMaterial}
        frustumCulled={false}
      />

      {streakMaterials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => (streakRefs.current[i] = el)}
          geometry={streakGeometry}
          material={material}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
