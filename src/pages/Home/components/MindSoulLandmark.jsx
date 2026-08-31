import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { hubState, LANDMARKS } from '../hubState';
import { glowTexture } from './textures';
import LandmarkLabel from './LandmarkLabel';
import { MINDSOUL_TEAL, MINDSOUL_GREEN, STRUCTURE_DARK } from '../colors';

/**
 * The TheMindSoul landmark — a serene breathing wellness orb: a floating
 * teal sphere with a white-hot heart, slow ~7s breathing, a halo, and a
 * ring of calm particles orbiting on a tilted plane. When the core's
 * charge pulse arrives (hubState.flare[2]) the orb takes one DEEP breath
 * and exhales an expanding ring ripple while the particles briefly swirl
 * faster. ~9 draw calls.
 */

const LANDMARK_INDEX = 2;
const POS = LANDMARKS[LANDMARK_INDEX].pos;
const ORB_Y = 2.0;

const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  metalness: 0.7,
  roughness: 0.4,
});

const teal = new THREE.Color(MINDSOUL_TEAL);
const green = new THREE.Color(MINDSOUL_GREEN);

// Calm particle ring — deterministic, module scope
const PARTICLE_COUNT = 26;
function buildParticleGeometry() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  let seed = 77;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const radius = 1.15 + rand() * 0.5;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (rand() - 0.5) * 0.5;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}
const particleGeometry = buildParticleGeometry();

export default function MindSoulLandmark({ reducedMotion = false }) {
  const camera = useThree((s) => s.camera);
  const orbRef = useRef();
  const haloRef = useRef();
  const particlesRef = useRef();
  const rippleRef = useRef();

  const orbMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: MINDSOUL_TEAL, toneMapped: false }),
    []
  );
  const heartMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#eafff8').multiplyScalar(1.8),
        toneMapped: false,
      }),
    []
  );
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: MINDSOUL_TEAL,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );
  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: green,
        size: 0.22,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    []
  );
  const rippleMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(MINDSOUL_TEAL).multiplyScalar(1.5),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    []
  );
  const poolMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: MINDSOUL_TEAL,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );
  const baseRingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(MINDSOUL_TEAL).multiplyScalar(1.1),
        toneMapped: false,
      }),
    []
  );

  useEffect(
    () => () => {
      orbMaterial.dispose();
      heartMaterial.dispose();
      haloMaterial.dispose();
      particleMaterial.dispose();
      rippleMaterial.dispose();
      poolMaterial.dispose();
      baseRingMaterial.dispose();
    },
    [orbMaterial, heartMaterial, haloMaterial, particleMaterial, rippleMaterial, poolMaterial, baseRingMaterial]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const flare = reducedMotion ? 0 : hubState.flare[LANDMARK_INDEX];
    // One deep-breath arc over the flare's decay (0 -> 1 -> 0)
    const deepBreath = Math.sin(flare * Math.PI);
    const calm = reducedMotion ? 0 : Math.sin(t * 0.85); // ~7s cycle

    orbMaterial.color
      .copy(teal)
      .multiplyScalar(1.15 + calm * 0.18 + deepBreath * 1.1);
    haloMaterial.opacity = 0.28 + calm * 0.07 + deepBreath * 0.3;
    poolMaterial.opacity = 0.22 + deepBreath * 0.28;

    const orb = orbRef.current;
    if (orb) {
      const scale = 1 + calm * 0.05 + deepBreath * 0.3;
      orb.scale.setScalar(scale);
      if (!reducedMotion) orb.position.y = ORB_Y + Math.sin(t * 0.5) * 0.12;
    }
    const halo = haloRef.current;
    if (halo) {
      halo.lookAt(camera.position);
      if (!reducedMotion) halo.position.y = ORB_Y + Math.sin(t * 0.5) * 0.12;
    }

    const particles = particlesRef.current;
    if (particles && !reducedMotion) {
      particles.rotation.y += Math.min(delta, 0.05) * (0.45 + flare * 1.6);
    }

    // Exhale ring ripple driven directly by the flare's decay
    const ripple = rippleRef.current;
    if (ripple) {
      const show = flare > 0.02;
      ripple.visible = show;
      if (show) {
        const spread = 1 + (1 - flare) * 2.6;
        ripple.scale.set(spread, spread, spread);
        rippleMaterial.opacity = flare * 0.7;
      }
    }
  });

  return (
    <group position={POS}>
      {/* Pedestal + luminous base ring */}
      <mesh position={[0, 0.16, 0]} material={pedestalMaterial}>
        <cylinderGeometry args={[0.8, 1.1, 0.32, 24]} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} material={baseRingMaterial}>
        <torusGeometry args={[0.82, 0.03, 6, 40]} />
      </mesh>

      {/* The breathing orb with its white-hot heart */}
      <group ref={orbRef} position={[0, ORB_Y, 0]}>
        <mesh material={orbMaterial}>
          <sphereGeometry args={[0.68, 28, 28]} />
        </mesh>
        <mesh material={heartMaterial}>
          <sphereGeometry args={[0.3, 16, 16]} />
        </mesh>
      </group>

      {/* Halo billboard */}
      <mesh ref={haloRef} position={[0, ORB_Y, 0]} material={haloMaterial} frustumCulled={false}>
        <planeGeometry args={[5, 5]} />
      </mesh>

      {/* Calm orbiting particles, tilted plane */}
      <group rotation={[0.35, 0, 0.18]} position={[0, ORB_Y, 0]}>
        <points
          ref={particlesRef}
          geometry={particleGeometry}
          material={particleMaterial}
          frustumCulled={false}
        />
      </group>

      {/* Exhale ring ripple */}
      <mesh
        ref={rippleRef}
        position={[0, ORB_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={rippleMaterial}
        visible={false}
        frustumCulled={false}
      >
        <torusGeometry args={[1, 0.02, 6, 48]} />
      </mesh>

      {/* Light pool on the grid floor */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolMaterial}>
        <planeGeometry args={[7.5, 7.5]} />
      </mesh>

      <LandmarkLabel
        text="TheMindSoul"
        color={MINDSOUL_TEAL}
        position={[0, ORB_Y + 2.2, 0]}
      />
    </group>
  );
}
