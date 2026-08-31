import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { hubState, CORE_ORB_Y } from '../hubState';
import { glowTexture } from './textures';
import { columnGeometry, makeColumnMaterial } from './column';
import { CORE_WHITE, CORE_CYAN, STRUCTURE_DARK } from '../colors';

/**
 * The Devvo core — the reactor that powers the three product landmarks:
 * - dark hexagonal pedestal + a crystalline HDR icosahedron heart wrapped
 *   in a counter-rotating wireframe shell
 * - THREE counter-rotating gyroscope rings (HDR, they bloom hard)
 * - a halo of orbiting glyph particles (one Points cloud)
 * - soft billboard halo + a pulsing "volumetric" beacon column to the sky
 * - a light pool on the grid floor beneath it
 *
 * The whole thing breathes; while the EnergyStreams conductor charges a
 * pulse (hubState.coreCharge) the crystal winds up — brighter, rings
 * spinning faster — and on launch (hubState.coreBoost) it flashes.
 * ~10 draw calls, one point light.
 */

const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  metalness: 0.85,
  roughness: 0.35,
});

const baseWhite = new THREE.Color(CORE_WHITE);
const baseCyan = new THREE.Color(CORE_CYAN);

// Orbiting glyph particles — deterministic ring cloud around the crystal
const GLYPH_COUNT = 36;
function buildGlyphGeometry() {
  const positions = new Float32Array(GLYPH_COUNT * 3);
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < GLYPH_COUNT; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 1.55 + rand() * 1.1;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (rand() - 0.5) * 1.5;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}
const glyphGeometry = buildGlyphGeometry();

const RING_TILTS = [
  [1.25, 0, 0],
  [-1.05, 0, 0.45],
  [0.35, 0, -0.7],
];
const RING_RADII = [1.35, 1.7, 2.05];

export default function DevvoCore({ reducedMotion = false }) {
  const camera = useThree((s) => s.camera);
  const crystalRef = useRef();
  const shellRef = useRef();
  const ringRefs = useRef([]);
  const glyphsRef = useRef();
  const haloRef = useRef();
  const lightRef = useRef();

  const crystalMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: CORE_WHITE, toneMapped: false }),
    []
  );
  const shellMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: CORE_CYAN,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
        toneMapped: false,
        fog: false,
      }),
    []
  );
  const ringMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: CORE_CYAN, toneMapped: false }),
    []
  );
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: CORE_CYAN,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );
  const beaconMaterial = useMemo(() => makeColumnMaterial(CORE_CYAN, 1.9), []);
  const glyphMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: baseCyan,
        size: 0.3,
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
  const poolMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: CORE_CYAN,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useEffect(
    () => () => {
      crystalMaterial.dispose();
      shellMaterial.dispose();
      ringMaterial.dispose();
      haloMaterial.dispose();
      beaconMaterial.dispose();
      glyphMaterial.dispose();
      poolMaterial.dispose();
    },
    [crystalMaterial, shellMaterial, ringMaterial, haloMaterial, beaconMaterial, glyphMaterial, poolMaterial]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const charge = hubState.coreCharge;
    const boost = hubState.coreBoost;
    const breathe = reducedMotion ? 0 : Math.sin(t * 1.2) * 0.06;

    // HDR drive: the crystal is always past the bloom threshold; charging
    // and launching push it much harder.
    crystalMaterial.color
      .copy(baseWhite)
      .multiplyScalar(1.35 + charge * 1.5 + boost * 2.2 + breathe);
    ringMaterial.color
      .copy(baseCyan)
      .multiplyScalar(1.25 + charge * 0.9 + boost * 1.1 + breathe * 0.5);
    haloMaterial.opacity = 0.32 + charge * 0.3 + boost * 0.35 + breathe;
    glyphMaterial.color.copy(baseCyan).multiplyScalar(1.1 + charge * 0.8);

    const pulse = reducedMotion ? 1 : 0.78 + 0.22 * Math.sin(t * 1.6);
    beaconMaterial.uniforms.uOpacity.value =
      (0.2 + charge * 0.25 + boost * 0.4) * pulse;

    if (!reducedMotion) {
      // Clamped delta: a background-tab return must not lurch the gyroscope.
      const dt = Math.min(delta, 0.05);
      const spin = 1 + charge * 2.2 + boost * 1.5;
      const crystal = crystalRef.current;
      if (crystal) {
        crystal.rotation.y += dt * 0.45 * spin;
        crystal.rotation.x = Math.sin(t * 0.35) * 0.18;
        crystal.scale.setScalar(1 + breathe + boost * 0.12);
      }
      const shell = shellRef.current;
      if (shell) {
        shell.rotation.y -= dt * 0.3 * spin;
        shell.rotation.z = Math.sin(t * 0.27 + 1) * 0.2;
      }
      const rings = ringRefs.current;
      if (rings[0]) rings[0].rotation.y += dt * 0.5 * spin;
      if (rings[1]) rings[1].rotation.y -= dt * 0.66 * spin;
      if (rings[2]) rings[2].rotation.y += dt * 0.3 * spin;
      const glyphs = glyphsRef.current;
      if (glyphs) {
        glyphs.rotation.y -= dt * 0.45 * (1 + charge);
        glyphs.rotation.x = Math.sin(t * 0.4) * 0.12;
      }
    }
    if (haloRef.current) haloRef.current.lookAt(camera.position);
    if (lightRef.current) {
      lightRef.current.intensity = 1.3 + charge * 1.2 + boost * 2;
    }
  });

  return (
    <group>
      {/* Hexagonal pedestal */}
      <mesh position={[0, 0.22, 0]} material={pedestalMaterial}>
        <cylinderGeometry args={[1.35, 1.75, 0.44, 6]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={pedestalMaterial}>
        <cylinderGeometry args={[0.85, 1.15, 0.28, 6]} />
      </mesh>

      {/* Crystalline heart */}
      <mesh ref={crystalRef} position={[0, CORE_ORB_Y, 0]} material={crystalMaterial}>
        <icosahedronGeometry args={[0.72, 0]} />
      </mesh>

      {/* Counter-rotating wireframe shell */}
      <mesh ref={shellRef} position={[0, CORE_ORB_Y, 0]} material={shellMaterial}>
        <icosahedronGeometry args={[1.05, 1]} />
      </mesh>

      {/* Counter-rotating gyroscope rings */}
      {RING_TILTS.map((tilt, i) => (
        <group
          key={i}
          ref={(el) => (ringRefs.current[i] = el)}
          position={[0, CORE_ORB_Y, 0]}
        >
          <mesh rotation={tilt} material={ringMaterial}>
            <torusGeometry args={[RING_RADII[i], 0.045 - i * 0.007, 8, 48]} />
          </mesh>
        </group>
      ))}

      {/* Orbiting glyph particles */}
      <points
        ref={glyphsRef}
        position={[0, CORE_ORB_Y, 0]}
        geometry={glyphGeometry}
        material={glyphMaterial}
        frustumCulled={false}
      />

      {/* Soft halo billboard */}
      <mesh ref={haloRef} position={[0, CORE_ORB_Y, 0]} material={haloMaterial} frustumCulled={false}>
        <planeGeometry args={[6.5, 6.5]} />
      </mesh>

      {/* Beacon column to the sky */}
      <mesh
        position={[0, CORE_ORB_Y + 11, 0]}
        scale={[0.9, 22, 0.9]}
        geometry={columnGeometry}
        material={beaconMaterial}
        frustumCulled={false}
      />

      {/* Light pool on the grid floor */}
      <mesh
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={poolMaterial}
      >
        <planeGeometry args={[9, 9]} />
      </mesh>

      {/* The core's own glow */}
      <pointLight
        ref={lightRef}
        position={[0, CORE_ORB_Y, 0]}
        intensity={1.3}
        color={CORE_CYAN}
        distance={40}
        decay={1.8}
      />
    </group>
  );
}
