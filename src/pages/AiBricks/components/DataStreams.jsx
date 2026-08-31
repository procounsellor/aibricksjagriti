import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cityState } from '../timeOfDay';
import { BUILDINGS, CORE_POSITION, CORE_ORB_Y, buildingHeight } from '../cityLayout';
import { columnGeometry, makeColumnMaterial } from './lightColumn';
import colors from '../colors';

/**
 * Data streams + match pulses - Living Data City, escalated.
 *
 * - Ambient streams: glowing dashes flowing along precomputed curves - two
 *   lanes along the main road plus arcs from the AI core orb down to each
 *   neighborhood. ALL dashes live in ONE InstancedMesh. Roughly half of the
 *   dashes are "night extras" that only appear as streamGlow rises, so the
 *   streams visibly thicken after dusk.
 * - Match pulses: every few seconds one brighter, faster dash surges from
 *   the core to a random building's rooftop (pool of 3, extra instances in
 *   the same InstancedMesh). ON ARRIVAL the event goes big:
 *     - the building's windows flare (cityState.matchGlow)
 *     - a vertical light pillar shoots from the building to the sky
 *       (pooled additive shader cylinders)
 *     - a double-ring shockwave expands at its base (pooled ring meshes)
 *     - a beam of dashes lights the whole arc back to the core and
 *       dissolves (extra instances in the same InstancedMesh that shrink
 *       to nothing - zero extra draw calls)
 *
 * Every curve is baked at module load into flat position/quaternion sample
 * arrays, so the per-frame work is pure indexed reads - zero allocations.
 */

const SAMPLES = 64;
const X_AXIS = new THREE.Vector3(1, 0, 0);

function bakeCurve(curve) {
  const pos = new Float32Array(SAMPLES * 3);
  const quat = new Float32Array(SAMPLES * 4);
  const q = new THREE.Quaternion();
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1);
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    q.setFromUnitVectors(X_AXIS, tangent);
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;
    quat[i * 4] = q.x;
    quat[i * 4 + 1] = q.y;
    quat[i * 4 + 2] = q.z;
    quat[i * 4 + 3] = q.w;
  }
  return { pos, quat, length: curve.getLength() };
}

function cat(points) {
  return bakeCurve(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
  );
}

const ORB = new THREE.Vector3(CORE_POSITION[0], CORE_ORB_Y, CORE_POSITION[2]);

// Ambient stream curves: 2 road lanes + arcs core <-> neighborhoods.
// Baked once at module load.
const AMBIENT_CURVES = [
  // Main road, both directions
  cat([[-30, 0.35, 7.35], [-10, 0.35, 7.3], [10, 0.35, 7.4], [30, 0.35, 7.35]]),
  cat([[30, 0.35, 8.65], [10, 0.35, 8.7], [-10, 0.35, 8.6], [-30, 0.35, 8.65]]),
  // Core -> front-left / front-right neighborhoods
  cat([[0, 9.2, -3], [-6, 5.2, -1], [-13, 2, 1.4], [-19, 0.6, 3]]),
  cat([[0, 9.2, -3], [6, 5.2, -1], [13, 2, 1.4], [19, 0.6, 3]]),
  // Core -> mid-left / mid-right rows
  cat([[0, 9.2, -3], [-8, 4.6, -3], [-19, 0.6, -3]]),
  cat([[0, 9.2, -3], [8, 4.6, -3], [19, 0.6, -3]]),
  // Core -> back rows (skirting around the skyscraper cluster)
  cat([[0, 9.2, -3], [-11, 6.5, -9], [-15, 0.7, -17]]),
  cat([[0, 9.2, -3], [11, 6.5, -9], [15, 0.7, -17]]),
  // Core -> far back tower, threading the gap between skyscrapers
  cat([[0, 9.2, -3], [3, 7, -10], [0, 0.8, -20]]),
  // Core -> the road junction
  cat([[0, 9.2, -3], [1.6, 4.6, 2], [0, 0.5, 7.6]]),
];

// One pulse curve per building: a high graceful bezier from the orb to the
// building's rooftop (control point high enough to clear the skyline).
const PULSE_CURVES = BUILDINGS.map((b) => {
  const h = buildingHeight(b);
  const curve = new THREE.QuadraticBezierCurve3(
    ORB.clone(),
    new THREE.Vector3(
      b.pos[0] * 0.5,
      Math.max(14, h + 8),
      (CORE_POSITION[2] + b.pos[2]) * 0.5
    ),
    new THREE.Vector3(b.pos[0], h + 0.6, b.pos[2])
  );
  return bakeCurve(curve);
});

// Particle allocation: base dash count scales with curve length; extras are
// night-only and fade in as streamGlow crosses their personal threshold.
const BASE_PER_CURVE = AMBIENT_CURVES.map((c) =>
  Math.max(8, Math.min(16, Math.round(c.length / 3.2)))
);
const EXTRA_PER_CURVE = BASE_PER_CURVE.map((n) => Math.round(n * 0.55));
const AMBIENT_COUNT =
  BASE_PER_CURVE.reduce((a, b) => a + b, 0) + EXTRA_PER_CURVE.reduce((a, b) => a + b, 0);

const PULSE_POOL = 3;
const RIPPLE_POOL = 3;
const PILLAR_POOL = 3;
const BEAM_POOL = 3;
const BEAM_DASHES = 18;
const TOTAL_INSTANCES = AMBIENT_COUNT + PULSE_POOL + BEAM_POOL * BEAM_DASHES;

const AMBIENT_SPEED = 3.4; // world units / second
const PULSE_SPEED = 14;

// Shared geometry / materials / scratch (module scope)
const dashGeometry = new THREE.BoxGeometry(1, 1, 1);
const ringGeometry = new THREE.RingGeometry(0.72, 1, 40);
const ring2Geometry = new THREE.RingGeometry(0.85, 1, 40);
const streamMaterial = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
  fog: false, // fog would ADD gray haze on additive blending
});
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const cyan = new THREE.Color(colors.streamCyan);
const pulseWhite = new THREE.Color(colors.pulseWhite);
const HIDDEN_SCALE = 0.0001;

function pseudoRandom(i) {
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

function hideInstance(mesh, idx) {
  dummy.position.set(0, -10, 0);
  dummy.quaternion.set(0, 0, 0, 1);
  dummy.scale.setScalar(HIDDEN_SCALE);
  dummy.updateMatrix();
  mesh.setMatrixAt(idx, dummy.matrix);
}

export function DataStreams({ reducedMotion = false }) {
  const meshRef = useRef();
  const rippleRefs = useRef([]);
  const ripple2Refs = useRef([]);
  const pillarRefs = useRef([]);
  const fireTimer = useRef(3);

  // Per-particle state, preallocated once. night = streamGlow threshold at
  // which a night-extra dash becomes visible (0 = always visible).
  const particles = useMemo(() => {
    const list = [];
    for (let c = 0; c < AMBIENT_CURVES.length; c++) {
      const total = BASE_PER_CURVE[c] + EXTRA_PER_CURVE[c];
      for (let k = 0; k < total; k++) {
        list.push({
          curve: c,
          t: (k / total + pseudoRandom(c * 31 + k) * 0.5) % 1,
          speed: AMBIENT_SPEED / AMBIENT_CURVES[c].length,
          night:
            k < BASE_PER_CURVE[c]
              ? 0
              : 0.5 + pseudoRandom(c * 57 + k * 3 + 2) * 0.35,
        });
      }
    }
    return list;
  }, []);

  const pulses = useMemo(
    () => Array.from({ length: PULSE_POOL }, () => ({ active: false, t: 0, building: 0 })),
    []
  );
  const ripples = useMemo(
    () => Array.from({ length: RIPPLE_POOL }, () => ({ active: false, life: 0 })),
    []
  );
  const pillars = useMemo(
    () => Array.from({ length: PILLAR_POOL }, () => ({ active: false, life: 0 })),
    []
  );
  const beams = useMemo(
    () => Array.from({ length: BEAM_POOL }, () => ({ active: false, life: 0, building: 0 })),
    []
  );

  const rippleMaterials = useMemo(
    () =>
      Array.from(
        { length: RIPPLE_POOL },
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
          })
      ),
    []
  );
  const ripple2Materials = useMemo(
    () =>
      Array.from(
        { length: RIPPLE_POOL },
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
          })
      ),
    []
  );
  const pillarMaterials = useMemo(
    () =>
      Array.from({ length: PILLAR_POOL }, () => makeColumnMaterial(colors.matchFlare, 2.2)),
    []
  );

  useEffect(
    () => () => {
      rippleMaterials.forEach((m) => m.dispose());
      ripple2Materials.forEach((m) => m.dispose());
      pillarMaterials.forEach((m) => m.dispose());
    },
    [rippleMaterials, ripple2Materials, pillarMaterials]
  );

  // Bake the static per-instance colors once; park beam/pulse slots hidden
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      tmpColor.copy(cyan).multiplyScalar(0.55 + pseudoRandom(i * 7 + 1) * 0.95);
      mesh.setColorAt(i, tmpColor);
    }
    for (let k = 0; k < PULSE_POOL; k++) {
      tmpColor.copy(pulseWhite).multiplyScalar(2.6);
      mesh.setColorAt(AMBIENT_COUNT + k, tmpColor);
    }
    // Beam dashes: gradient from hot white (building end) back to cyan (core)
    for (let b = 0; b < BEAM_POOL; b++) {
      for (let d = 0; d < BEAM_DASHES; d++) {
        const idx = AMBIENT_COUNT + PULSE_POOL + b * BEAM_DASHES + d;
        tmpColor.copy(cyan).lerp(pulseWhite, d / (BEAM_DASHES - 1)).multiplyScalar(2.1);
        mesh.setColorAt(idx, tmpColor);
        hideInstance(mesh, idx);
      }
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = Math.min(delta, 0.05);
    const glow = cityState.streamGlow;

    // Brightness follows time of day (constant dim glow in reduced motion)
    streamMaterial.opacity = reducedMotion ? 0.4 : 0.22 + glow * 0.78;

    // --- ambient dashes ---------------------------------------------------
    const dashLen = 0.55 + glow * 0.45;
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const p = particles[i];
      // Night extras stay hidden by day (and always in reduced motion)
      if (p.night > 0 && (reducedMotion || glow < p.night)) {
        hideInstance(mesh, i);
        continue;
      }
      if (!reducedMotion) {
        p.t += dt * p.speed;
        if (p.t >= 1) p.t -= 1;
      }
      const c = AMBIENT_CURVES[p.curve];
      const s = Math.min(SAMPLES - 1, (p.t * (SAMPLES - 1)) | 0);
      dummy.position.set(c.pos[s * 3], c.pos[s * 3 + 1], c.pos[s * 3 + 2]);
      dummy.quaternion.set(c.quat[s * 4], c.quat[s * 4 + 1], c.quat[s * 4 + 2], c.quat[s * 4 + 3]);
      dummy.scale.set(dashLen, 0.075, 0.075);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    // --- match pulses -----------------------------------------------------
    if (!reducedMotion) {
      fireTimer.current -= dt;
      if (fireTimer.current <= 0) {
        fireTimer.current = 2.2 + Math.random() * 2;
        for (let k = 0; k < PULSE_POOL; k++) {
          if (!pulses[k].active) {
            pulses[k].active = true;
            pulses[k].t = 0;
            pulses[k].building = (Math.random() * BUILDINGS.length) | 0;
            break;
          }
        }
      }
    }

    for (let k = 0; k < PULSE_POOL; k++) {
      const pulse = pulses[k];
      const idx = AMBIENT_COUNT + k;
      let visible = false;

      if (pulse.active && !reducedMotion) {
        const c = PULSE_CURVES[pulse.building];
        pulse.t += dt * (PULSE_SPEED / c.length);
        if (pulse.t >= 1) {
          // ARRIVAL - the match event goes big:
          pulse.active = false;
          const b = BUILDINGS[pulse.building];

          // 1. window flare
          cityState.matchGlow[pulse.building] = 1;

          // 2. double-ring shockwave at the base
          for (let r = 0; r < RIPPLE_POOL; r++) {
            if (!ripples[r].active) {
              ripples[r].active = true;
              ripples[r].life = 0;
              const rippleMesh = rippleRefs.current[r];
              const ripple2Mesh = ripple2Refs.current[r];
              if (rippleMesh) rippleMesh.position.set(b.pos[0], 0.08, b.pos[2]);
              if (ripple2Mesh) ripple2Mesh.position.set(b.pos[0], 0.06, b.pos[2]);
              break;
            }
          }

          // 3. vertical light pillar from the building up to the sky
          for (let p = 0; p < PILLAR_POOL; p++) {
            if (!pillars[p].active) {
              pillars[p].active = true;
              pillars[p].life = 0;
              const pillarMesh = pillarRefs.current[p];
              if (pillarMesh) pillarMesh.position.set(b.pos[0], 14, b.pos[2]);
              break;
            }
          }

          // 4. beam back to the core: lay dashes along the whole arc; they
          //    shrink to nothing over ~0.8s (matrices written here once,
          //    then rescaled while active)
          for (let bm = 0; bm < BEAM_POOL; bm++) {
            if (!beams[bm].active) {
              beams[bm].active = true;
              beams[bm].life = 0;
              beams[bm].building = pulse.building;
              break;
            }
          }
        } else {
          visible = true;
          const s = Math.min(SAMPLES - 1, (pulse.t * (SAMPLES - 1)) | 0);
          dummy.position.set(c.pos[s * 3], c.pos[s * 3 + 1], c.pos[s * 3 + 2]);
          dummy.quaternion.set(
            c.quat[s * 4],
            c.quat[s * 4 + 1],
            c.quat[s * 4 + 2],
            c.quat[s * 4 + 3]
          );
          dummy.scale.set(1.5, 0.16, 0.16);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
        }
      }

      if (!visible) hideInstance(mesh, idx);
    }

    // --- beams back to the core (dissolving dash trails) ------------------
    for (let bm = 0; bm < BEAM_POOL; bm++) {
      const beam = beams[bm];
      if (!beam.active) continue;
      beam.life += dt / 0.85;
      const c = PULSE_CURVES[beam.building];
      const baseIdx = AMBIENT_COUNT + PULSE_POOL + bm * BEAM_DASHES;
      if (beam.life >= 1) {
        beam.active = false;
        for (let d = 0; d < BEAM_DASHES; d++) hideInstance(mesh, baseIdx + d);
        continue;
      }
      const shrink = 1 - beam.life;
      for (let d = 0; d < BEAM_DASHES; d++) {
        const s = Math.min(
          SAMPLES - 1,
          ((d / (BEAM_DASHES - 1)) * (SAMPLES - 1)) | 0
        );
        dummy.position.set(c.pos[s * 3], c.pos[s * 3 + 1], c.pos[s * 3 + 2]);
        dummy.quaternion.set(
          c.quat[s * 4],
          c.quat[s * 4 + 1],
          c.quat[s * 4 + 2],
          c.quat[s * 4 + 3]
        );
        dummy.scale.set(1.6 * shrink, 0.14 * shrink, 0.14 * shrink);
        dummy.updateMatrix();
        mesh.setMatrixAt(baseIdx + d, dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;

    // --- base shockwaves (double ring) ------------------------------------
    for (let r = 0; r < RIPPLE_POOL; r++) {
      const ripple = ripples[r];
      const rippleMesh = rippleRefs.current[r];
      const ripple2Mesh = ripple2Refs.current[r];
      if (!rippleMesh || !ripple2Mesh) continue;
      if (!ripple.active) {
        rippleMesh.visible = false;
        ripple2Mesh.visible = false;
        continue;
      }
      ripple.life += dt / 1.1;
      if (ripple.life >= 1) {
        ripple.active = false;
        rippleMesh.visible = false;
        ripple2Mesh.visible = false;
        continue;
      }
      rippleMesh.visible = true;
      const scale = 0.8 + ripple.life * 7;
      rippleMesh.scale.set(scale, scale, 1);
      rippleMaterials[r].opacity = (1 - ripple.life) * 0.85;

      // Second ring lags behind the first
      const life2 = Math.max(0, ripple.life - 0.16) / 0.84;
      ripple2Mesh.visible = life2 > 0;
      if (ripple2Mesh.visible) {
        const scale2 = 0.6 + life2 * 5.5;
        ripple2Mesh.scale.set(scale2, scale2, 1);
        ripple2Materials[r].opacity = (1 - life2) * 0.55;
      }
    }

    // --- match pillars ----------------------------------------------------
    const pillarBoost = 0.35 + glow * 0.65;
    for (let p = 0; p < PILLAR_POOL; p++) {
      const pillar = pillars[p];
      const pillarMesh = pillarRefs.current[p];
      if (!pillarMesh) continue;
      if (!pillar.active) {
        pillarMesh.visible = false;
        continue;
      }
      pillar.life += dt / 1.35;
      if (pillar.life >= 1) {
        pillar.active = false;
        pillarMesh.visible = false;
        continue;
      }
      pillarMesh.visible = true;
      const spread = 0.5 + pillar.life * 0.65;
      pillarMesh.scale.set(spread, 28, spread);
      const fade = (1 - pillar.life) * (1 - pillar.life);
      pillarMaterials[p].uniforms.uOpacity.value = fade * pillarBoost;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[dashGeometry, streamMaterial, TOTAL_INSTANCES]}
        frustumCulled={false}
      />
      {rippleMaterials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => (rippleRefs.current[i] = el)}
          geometry={ringGeometry}
          material={material}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        />
      ))}
      {ripple2Materials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => (ripple2Refs.current[i] = el)}
          geometry={ring2Geometry}
          material={material}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        />
      ))}
      {pillarMaterials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => (pillarRefs.current[i] = el)}
          geometry={columnGeometry}
          material={material}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
