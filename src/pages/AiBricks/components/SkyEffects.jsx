import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { cityState } from '../timeOfDay';

/**
 * Procedural sky - no CDN assets:
 * - one Points cloud of 400 stars that fades in at night, plus a second
 *   smaller layer of 140 brighter stars that TWINKLE (sine-modulated
 *   opacity, out of phase with the base layer)
 * - soft sun / moon billboards traveling their arcs
 * - a fan of 3 additive god-ray shafts hanging from the sun disc at golden
 *   dusk (cityState.duskRay bell curve)
 * - three procedural billboard cloud planes (canvas radial-gradient texture)
 *   tinted by time-of-day and faded out at night.
 */

const STAR_COUNT = 400;
const TWINKLE_COUNT = 140;

// Deterministic star dome (module scope, built once)
function buildStarGeometry(count, startSeed) {
  const positions = new Float32Array(count * 3);
  let seed = startSeed;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    const az = rand() * Math.PI * 2;
    const el = Math.asin(0.06 + rand() * 0.92); // keep above the horizon
    const r = 165 + rand() * 20;
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
  color: '#dbe6ff',
  size: 1.4,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0,
  fog: false,
  depthWrite: false,
});
const twinkleMaterial = new THREE.PointsMaterial({
  color: '#f2f6ff',
  size: 2.1,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0,
  fog: false,
  depthWrite: false,
});

// God-ray fan: [zRotation, length, width]
const RAY_SHAFTS = [
  [-0.42, 64, 6.5],
  [-0.08, 74, 9],
  [0.3, 58, 5],
];

// Soft radial glow texture - procedural, reused by clouds / sun / AI core halo
function makeGlowTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const glowTexture = makeGlowTexture();

const CLOUDS = [
  { position: [10, 26, -28], scale: [26, 10, 1], baseOpacity: 0.4, drift: 0.5 },
  { position: [-15, 29, -32], scale: [32, 12, 1], baseOpacity: 0.32, drift: 0.35 },
  { position: [20, 32, -38], scale: [24, 9, 1], baseOpacity: 0.26, drift: 0.65 },
];

export function SkyEffects({ reducedMotion = false }) {
  const camera = useThree((s) => s.camera);
  const sunRef = useRef();
  const moonRef = useRef();
  const raysRef = useRef();
  const cloudRefs = useRef([]);

  const sunMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: '#ffe9b0',
        transparent: true,
        opacity: 1,
        fog: false,
        depthWrite: false,
      }),
    []
  );
  const moonMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#e8eeff',
        transparent: true,
        opacity: 0,
        fog: false,
        depthWrite: false,
      }),
    []
  );
  const rayMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: '#ffca7a',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );
  const cloudMaterials = useMemo(
    () =>
      CLOUDS.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: glowTexture,
            color: '#ffffff',
            transparent: true,
            opacity: 0.4,
            fog: false,
            depthWrite: false,
          })
      ),
    []
  );

  useEffect(
    () => () => {
      sunMaterial.dispose();
      moonMaterial.dispose();
      rayMaterial.dispose();
      cloudMaterials.forEach((m) => m.dispose());
    },
    [sunMaterial, moonMaterial, rayMaterial, cloudMaterials]
  );

  useFrame((state, delta) => {
    starMaterial.opacity = cityState.starAlpha;

    // Twinkle layer: base layer's alpha, sine-modulated (static when reduced)
    const tw = reducedMotion
      ? 0.55
      : 0.45 + 0.4 * Math.sin(state.clock.elapsedTime * 2.3) * Math.sin(state.clock.elapsedTime * 0.7 + 1.3);
    twinkleMaterial.opacity = cityState.starAlpha * (0.35 + 0.65 * Math.abs(tw));

    const sun = sunRef.current;
    if (sun) {
      sun.position.copy(cityState.sunDiscPos);
      sun.lookAt(camera.position);
      sunMaterial.opacity = cityState.sunDiscAlpha;
      sun.visible = cityState.sunDiscAlpha > 0.01;
    }

    // Dusk god-ray fan: billboarded at the sun, shafts angled toward the city
    const rays = raysRef.current;
    if (rays) {
      const strength = cityState.duskRay * cityState.sunDiscAlpha;
      rays.visible = strength > 0.02;
      if (rays.visible) {
        rays.position.copy(cityState.sunDiscPos).multiplyScalar(0.72);
        rays.lookAt(camera.position);
        rayMaterial.opacity = strength * 0.34;
      }
    }
    const moon = moonRef.current;
    if (moon) {
      moon.position.copy(cityState.moonDiscPos);
      moon.lookAt(camera.position);
      moonMaterial.opacity = cityState.moonDiscAlpha;
      moon.visible = cityState.moonDiscAlpha > 0.01;
    }

    for (let i = 0; i < CLOUDS.length; i++) {
      const mat = cloudMaterials[i];
      mat.opacity = cityState.cloudAlpha * CLOUDS[i].baseOpacity;
      mat.color.copy(cityState.cloudTint);
      const mesh = cloudRefs.current[i];
      if (mesh) {
        mesh.visible = mat.opacity > 0.01;
        if (!reducedMotion) {
          mesh.position.x += delta * CLOUDS[i].drift;
          if (mesh.position.x > 60) mesh.position.x = -60;
        }
      }
    }
  });

  return (
    <group>
      <points geometry={starGeometry} material={starMaterial} frustumCulled={false} />
      <points geometry={twinkleGeometry} material={twinkleMaterial} frustumCulled={false} />

      {/* Sun - soft glow billboard */}
      <mesh ref={sunRef} material={sunMaterial} frustumCulled={false}>
        <planeGeometry args={[34, 34]} />
      </mesh>

      {/* Dusk god-ray shafts - a billboarded fan hanging from the sun disc */}
      <group ref={raysRef} visible={false}>
        {RAY_SHAFTS.map(([angle, len, width], i) => (
          <mesh
            key={i}
            rotation={[0, 0, angle]}
            position={[Math.sin(angle) * len * 0.5, -Math.cos(angle) * len * 0.5, 0]}
            scale={[width, len, 1]}
            material={rayMaterial}
            frustumCulled={false}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
        ))}
      </group>

      {/* Moon - crisp disc */}
      <mesh ref={moonRef} material={moonMaterial} visible={false} frustumCulled={false}>
        <circleGeometry args={[5, 32]} />
      </mesh>

      {/* Procedural billboard clouds */}
      {CLOUDS.map((cloud, i) => (
        <mesh
          key={i}
          ref={(el) => (cloudRefs.current[i] = el)}
          position={cloud.position}
          scale={cloud.scale}
          material={cloudMaterials[i]}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
