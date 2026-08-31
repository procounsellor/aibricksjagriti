import * as THREE from 'three';

/**
 * Scroll-driven day-to-night cycle.
 *
 * `sampleTimeOfDay(offset)` maps the drei useScroll offset (0..1) onto a set
 * of keyframed palettes (sunrise -> day -> golden dusk -> twilight -> deep
 * night) and writes the result into the shared, preallocated `cityState`
 * object. Every consumer (lights, sky, windows, streams, cars, birds, core)
 * reads from `cityState` inside its own useFrame - zero per-frame allocations.
 *
 * The TimeOfDayController samples at useFrame priority -10 so the state is
 * always fresh before any consumer (default priority 0) reads it.
 */

export const MAX_BUILDINGS = 32;

export const cityState = {
  offset: 0,

  // Sky / atmosphere
  sky: new THREE.Color('#f5b57c'),
  fog: new THREE.Color('#eec9a0'),
  fogNear: 28,
  fogFar: 115,

  // The single shadow-casting directional light (sun by day, moon by night)
  lightColor: new THREE.Color('#ffb36b'),
  lightIntensity: 1.7,
  lightPos: new THREE.Vector3(53, 12, 20),

  // Sky billboards
  sunDiscPos: new THREE.Vector3(140, 32, 53),
  moonDiscPos: new THREE.Vector3(120, 60, -70),
  sunDiscAlpha: 1,
  moonDiscAlpha: 0,

  // Fill lighting
  ambientColor: new THREE.Color('#ffd9b3'),
  ambientIntensity: 0.5,
  hemiIntensity: 0.55,

  // Scalars consumed around the city (all 0..1)
  windowLit: 0.2, // how far the staggered window light-up has progressed
  streamGlow: 0.45, // data-stream brightness (faint at noon, vivid at night)
  starAlpha: 0.1,
  cloudAlpha: 0.85,
  cloudTint: new THREE.Color('#ffd9b6'),
  headlight: 0.35, // car headlights / road-line glow
  birdDay: 0.75, // birds fly by day, land at night
  coreGlow: 0.55, // AI core luminosity

  // Per-building match flare (set to 1 by an arriving pulse, decays ~1.5s)
  matchGlow: new Float32Array(MAX_BUILDINGS),

  // Holographic scan wave (driven by TimeOfDayController, read by the core
  // ring visuals + every building for its edge-glow tick)
  scanRadius: 0, // world-units radius of the expanding wavefront
  scanStrength: 0, // 0..1 intensity of the current wave (0 = no wave)

  // Dusk god-ray / dust-mote intensity - a bell curve peaking at golden dusk
  duskRay: 0,
};

// ---------------------------------------------------------------------------
// Keyframed palettes. Parsed to THREE.Color once at module load.
// ---------------------------------------------------------------------------
const KEYS = [
  {
    t: 0.0, // sunrise - warm low sun, long shadows
    sky: '#f5b57c', fog: '#eec9a0', fogNear: 28, fogFar: 115,
    light: '#ffb36b', lightI: 1.7,
    amb: '#ffd9b3', ambI: 0.5, hemiI: 0.55,
    windowLit: 0.22, streamGlow: 0.45, star: 0.1,
    cloud: 0.85, cloudTint: '#ffd9b6',
    headlight: 0.35, birdDay: 0.75, core: 0.55,
  },
  {
    t: 0.22, // morning - sky clears to blue
    sky: '#a8d8f0', fog: '#c3e0ef', fogNear: 30, fogFar: 125,
    light: '#fff3dd', lightI: 2.5,
    amb: '#e8f0f8', ambI: 0.62, hemiI: 0.7,
    windowLit: 0.02, streamGlow: 0.16, star: 0,
    cloud: 1, cloudTint: '#ffffff',
    headlight: 0.05, birdDay: 1, core: 0.3,
  },
  {
    t: 0.48, // high day - bright, windows dark, streams faint
    sky: '#8ecdf0', fog: '#b5daee', fogNear: 32, fogFar: 130,
    light: '#ffffff', lightI: 2.7,
    amb: '#eef4fa', ambI: 0.66, hemiI: 0.75,
    windowLit: 0, streamGlow: 0.12, star: 0,
    cloud: 1, cloudTint: '#ffffff',
    headlight: 0, birdDay: 1, core: 0.28,
  },
  {
    t: 0.68, // golden dusk - windows begin to glow
    sky: '#f09a5a', fog: '#e0a878', fogNear: 26, fogFar: 110,
    light: '#ff9a4d', lightI: 1.5,
    amb: '#ffc9a0', ambI: 0.48, hemiI: 0.5,
    windowLit: 0.45, streamGlow: 0.55, star: 0.08,
    cloud: 0.8, cloudTint: '#ffb08a',
    headlight: 0.55, birdDay: 0.6, core: 0.6,
  },
  {
    t: 0.745, // sunset moment - the light dips out (sun -> moon handoff)
    sky: '#8a5f88', fog: '#8f6a88', fogNear: 25, fogFar: 105,
    light: '#c07898', lightI: 0.12,
    amb: '#9a7ca0', ambI: 0.36, hemiI: 0.4,
    windowLit: 0.62, streamGlow: 0.68, star: 0.28,
    cloud: 0.55, cloudTint: '#a06a90',
    headlight: 0.75, birdDay: 0.3, core: 0.72,
  },
  {
    t: 0.86, // twilight - moonlight takes over
    sky: '#2f3560', fog: '#333a68', fogNear: 24, fogFar: 100,
    light: '#8fa0d8', lightI: 0.24,
    amb: '#7080b0', ambI: 0.3, hemiI: 0.32,
    windowLit: 0.82, streamGlow: 0.82, star: 0.6,
    cloud: 0.3, cloudTint: '#535a8c',
    headlight: 0.9, birdDay: 0.1, core: 0.85,
  },
  {
    t: 1.0, // deep night finale - city fully lit, streams burn brightest
    sky: '#070b1e', fog: '#0b1026', fogNear: 22, fogFar: 95,
    light: '#aabcf2', lightI: 0.36,
    amb: '#5468a0', ambI: 0.22, hemiI: 0.25,
    windowLit: 1, streamGlow: 1, star: 1,
    cloud: 0.12, cloudTint: '#2a3054',
    headlight: 1, birdDay: 0, core: 1,
  },
].map((k) => ({
  ...k,
  sky: new THREE.Color(k.sky),
  fog: new THREE.Color(k.fog),
  light: new THREE.Color(k.light),
  amb: new THREE.Color(k.amb),
  cloudTint: new THREE.Color(k.cloudTint),
}));

// Directional light switches from the sun arc to the moon arc while its
// intensity is near zero (the 0.745 key), so the jump is invisible.
const HANDOFF = 0.745;

const { lerp, clamp } = THREE.MathUtils;

function smooth01(x) {
  const u = clamp(x, 0, 1);
  return u * u * (3 - 2 * u);
}

export function sampleTimeOfDay(offset) {
  const o = clamp(offset || 0, 0, 1);
  cityState.offset = o;

  // Find the bracketing keyframes
  let i = 0;
  while (i < KEYS.length - 2 && o > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = smooth01((o - a.t) / (b.t - a.t));

  cityState.sky.lerpColors(a.sky, b.sky, u);
  cityState.fog.lerpColors(a.fog, b.fog, u);
  cityState.lightColor.lerpColors(a.light, b.light, u);
  cityState.ambientColor.lerpColors(a.amb, b.amb, u);
  cityState.cloudTint.lerpColors(a.cloudTint, b.cloudTint, u);

  cityState.fogNear = lerp(a.fogNear, b.fogNear, u);
  cityState.fogFar = lerp(a.fogFar, b.fogFar, u);
  cityState.lightIntensity = lerp(a.lightI, b.lightI, u);
  cityState.ambientIntensity = lerp(a.ambI, b.ambI, u);
  cityState.hemiIntensity = lerp(a.hemiI, b.hemiI, u);
  cityState.windowLit = lerp(a.windowLit, b.windowLit, u);
  cityState.streamGlow = lerp(a.streamGlow, b.streamGlow, u);
  cityState.starAlpha = lerp(a.star, b.star, u);
  cityState.cloudAlpha = lerp(a.cloud, b.cloud, u);
  cityState.headlight = lerp(a.headlight, b.headlight, u);
  cityState.birdDay = lerp(a.birdDay, b.birdDay, u);
  cityState.coreGlow = lerp(a.core, b.core, u);

  // Dusk god rays / dust motes: bell curve peaking at golden dusk (o = 0.66)
  const dr = (o - 0.66) / 0.13;
  cityState.duskRay = Math.max(0, 1 - dr * dr);

  // --- celestial arcs -----------------------------------------------------
  // Sun travels east -> west across the front sky over offset 0 -> 0.745
  const sT = Math.min(o / HANDOFF, 1);
  const sunTheta = lerp(0.08, 0.92, sT) * Math.PI;
  const sunX = Math.cos(sunTheta) * 55;
  const sunY = Math.sin(sunTheta) * 48;
  const sunZ = 20;

  // Moon rises in the east behind the city over offset 0.745 -> 1
  const mT = clamp((o - HANDOFF) / (1 - HANDOFF), 0, 1);
  const moonTheta = lerp(0.12, 0.42, mT) * Math.PI;
  const moonX = Math.cos(moonTheta) * 50;
  const moonY = Math.sin(moonTheta) * 42;
  const moonZ = -25;

  if (o < HANDOFF) {
    cityState.lightPos.set(sunX, sunY, sunZ);
  } else {
    cityState.lightPos.set(moonX, moonY, moonZ);
  }

  cityState.sunDiscPos.set(sunX, sunY, sunZ).normalize().multiplyScalar(155);
  cityState.moonDiscPos.set(moonX, moonY, moonZ).normalize().multiplyScalar(150);
  cityState.sunDiscAlpha = clamp(1 - (o - 0.62) / 0.12, 0, 1);
  cityState.moonDiscAlpha = clamp((o - 0.75) / 0.12, 0, 1);
}
