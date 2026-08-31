import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { cityState } from '../timeOfDay';
import { CORE_POSITION, CORE_ORB_Y } from '../cityLayout';
import { glowTexture } from './SkyEffects';
import { columnGeometry, makeColumnMaterial } from './lightColumn';
import colors from '../colors';

/**
 * The AI core - now a full beacon:
 * - obsidian spire + HDR orb (blooms hard at night)
 * - pulsing "volumetric" light column from the orb straight up into the sky
 *   (additive open cylinder with a vertical alpha falloff)
 * - THREE counter-rotating gyroscope rings around the orb
 * - a halo of orbiting glyph particles (one Points cloud)
 * - the periodic 360-degree holographic scan wave: two expanding ground
 *   rings whose radius is driven by cityState.scanRadius (set by the
 *   TimeOfDayController at priority -10, so it is always fresh here)
 * ~14 draw calls, one point light.
 */

const spireMaterial = new THREE.MeshStandardMaterial({
  color: colors.coreSpire,
  metalness: 0.85,
  roughness: 0.3,
});

const baseCyan = new THREE.Color(colors.streamCyan);
const BAND_HEIGHTS = [2.2, 4.2, 6.2];

// Orbiting glyph particles - deterministic ring cloud around the orb
const GLYPH_COUNT = 42;
function buildGlyphGeometry() {
  const positions = new Float32Array(GLYPH_COUNT * 3);
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < GLYPH_COUNT; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 1.5 + rand() * 1.2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (rand() - 0.5) * 1.6;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}
const glyphGeometry = buildGlyphGeometry();

// Scan wave ground rings (unit radius, scaled per frame)
const scanRingGeometry = new THREE.RingGeometry(0.93, 1, 64);
const scanRingGeometryInner = new THREE.RingGeometry(0.965, 1, 64);

export function AICore({ reducedMotion = false }) {
  const camera = useThree((s) => s.camera);
  const ringRef = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const orbRef = useRef();
  const haloRef = useRef();
  const lightRef = useRef();
  const glyphsRef = useRef();
  const scanRef = useRef();
  const scan2Ref = useRef();

  const orbMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: colors.streamCyan, toneMapped: false }),
    []
  );
  const bandMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: colors.streamCyan, toneMapped: false }),
    []
  );
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: colors.streamCyan,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );
  const beaconMaterial = useMemo(() => makeColumnMaterial(colors.streamCyan, 1.9), []);
  const glyphMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: baseCyan,
        size: 0.34,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    []
  );
  const scanMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: colors.streamCyan,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      }),
    []
  );
  const scan2Material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: colors.pulseWhite,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      }),
    []
  );

  useEffect(
    () => () => {
      orbMaterial.dispose();
      bandMaterial.dispose();
      haloMaterial.dispose();
      beaconMaterial.dispose();
      glyphMaterial.dispose();
      scanMaterial.dispose();
      scan2Material.dispose();
    },
    [orbMaterial, bandMaterial, haloMaterial, beaconMaterial, glyphMaterial, scanMaterial, scan2Material]
  );

  useFrame((state, delta) => {
    const glow = cityState.coreGlow;
    const t = state.clock.elapsedTime;
    const breathe = reducedMotion ? 0 : Math.sin(t * 1.3) * 0.05;

    // HDR push: at deep night the orb crosses the bloom threshold hard
    orbMaterial.color.copy(baseCyan).multiplyScalar(0.6 + glow * 1.8 + breathe);
    bandMaterial.color.copy(baseCyan).multiplyScalar(0.45 + glow * 1.15 + breathe * 0.5);
    haloMaterial.opacity = 0.15 + glow * 0.5 + breathe;
    glyphMaterial.color.copy(baseCyan).multiplyScalar(0.7 + glow * 1.1);
    glyphMaterial.opacity = 0.35 + glow * 0.55;

    // Beacon column: pulses gently, burns brighter as night falls
    const pulse = reducedMotion ? 1 : 0.78 + 0.22 * Math.sin(t * 1.7);
    beaconMaterial.uniforms.uOpacity.value = (0.16 + glow * 0.62) * pulse;

    if (!reducedMotion) {
      // Clamped delta: a background-tab return must not lurch the rings.
      const dt = Math.min(delta, 0.05);
      if (ringRef.current) ringRef.current.rotation.y += dt * 0.45;
      if (ring2Ref.current) ring2Ref.current.rotation.y -= dt * 0.62;
      if (ring3Ref.current) ring3Ref.current.rotation.y += dt * 0.28;
      if (glyphsRef.current) {
        glyphsRef.current.rotation.y -= dt * 0.5;
        glyphsRef.current.rotation.x = Math.sin(t * 0.4) * 0.12;
      }
      if (orbRef.current) orbRef.current.scale.setScalar(1 + breathe);
    }
    if (haloRef.current) haloRef.current.lookAt(camera.position);
    if (lightRef.current) lightRef.current.intensity = 0.4 + glow * 1.8;

    // --- holographic scan wave: expanding ground rings --------------------
    const scanR = cityState.scanRadius;
    const scanS = cityState.scanStrength;
    const scanMesh = scanRef.current;
    const scan2Mesh = scan2Ref.current;
    const scanActive = scanS > 0.01 && scanR > 0.1;
    if (scanMesh) {
      scanMesh.visible = scanActive;
      if (scanActive) {
        scanMesh.scale.set(scanR, scanR, 1);
        scanMaterial.opacity = scanS * (0.22 + 0.55 * cityState.streamGlow);
      }
    }
    if (scan2Mesh) {
      // Trailing fainter echo ring
      const r2 = scanR * 0.86;
      scan2Mesh.visible = scanActive && r2 > 0.5;
      if (scan2Mesh.visible) {
        scan2Mesh.scale.set(r2, r2, 1);
        scan2Material.opacity = scanS * (0.1 + 0.28 * cityState.streamGlow);
      }
    }
  });

  return (
    <group position={CORE_POSITION}>
      {/* Pedestal */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={spireMaterial}>
        <cylinderGeometry args={[1.4, 1.8, 0.5, 6]} />
      </mesh>

      {/* Slim tapered spire */}
      <mesh position={[0, 4.4, 0]} castShadow material={spireMaterial}>
        <cylinderGeometry args={[0.28, 0.62, 8.2, 6]} />
      </mesh>

      {/* Luminous bands along the spire */}
      {BAND_HEIGHTS.map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={bandMaterial}>
          <torusGeometry args={[0.62 - y * 0.038, 0.035, 6, 32]} />
        </mesh>
      ))}

      {/* Orb */}
      <mesh ref={orbRef} position={[0, CORE_ORB_Y, 0]} material={orbMaterial}>
        <sphereGeometry args={[0.65, 24, 24]} />
      </mesh>

      {/* Pulsing beacon column from the orb up into the sky */}
      <mesh
        position={[0, CORE_ORB_Y + 14.5, 0]}
        scale={[1.1, 29, 1.1]}
        geometry={columnGeometry}
        material={beaconMaterial}
        frustumCulled={false}
      />

      {/* Counter-rotating gyroscope rings around the orb */}
      <group ref={ringRef} position={[0, CORE_ORB_Y, 0]}>
        <mesh rotation={[1.25, 0, 0]} material={bandMaterial}>
          <torusGeometry args={[1.3, 0.045, 8, 48]} />
        </mesh>
      </group>
      <group ref={ring2Ref} position={[0, CORE_ORB_Y, 0]}>
        <mesh rotation={[-1.05, 0, 0.45]} material={bandMaterial}>
          <torusGeometry args={[1.65, 0.038, 8, 48]} />
        </mesh>
      </group>
      <group ref={ring3Ref} position={[0, CORE_ORB_Y, 0]}>
        <mesh rotation={[0.35, 0, -0.7]} material={bandMaterial}>
          <torusGeometry args={[2.05, 0.03, 8, 48]} />
        </mesh>
      </group>

      {/* Orbiting glyph particles */}
      <points
        ref={glyphsRef}
        position={[0, CORE_ORB_Y, 0]}
        geometry={glyphGeometry}
        material={glyphMaterial}
        frustumCulled={false}
      />

      {/* Soft halo billboard behind the orb */}
      <mesh ref={haloRef} position={[0, CORE_ORB_Y, 0]} material={haloMaterial} frustumCulled={false}>
        <planeGeometry args={[6, 6]} />
      </mesh>

      {/* Holographic scan wave - expanding ground rings across the city */}
      <mesh
        ref={scanRef}
        position={[0, 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={scanRingGeometry}
        material={scanMaterial}
        visible={false}
        frustumCulled={false}
      />
      <mesh
        ref={scan2Ref}
        position={[0, 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={scanRingGeometryInner}
        material={scan2Material}
        visible={false}
        frustumCulled={false}
      />

      {/* The core's own glow - one of the scene's 4 lights */}
      <pointLight
        ref={lightRef}
        position={[0, CORE_ORB_Y, 0]}
        intensity={1}
        color={colors.streamCyan}
        distance={45}
        decay={1.8}
      />
    </group>
  );
}
