import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { hubState, LANDMARKS, CORE_ORB_Y } from '../hubState';
import { columnGeometry, makeColumnMaterial } from './column';
import { PULSE_WHITE } from '../colors';

/**
 * Energy streams + the charge-pulse conductor of the whole hub world.
 *
 * - Ambient streams: glowing dashes flowing along baked bezier arcs between
 *   the Devvo core and each product landmark — an OUT lane and an IN lane
 *   per landmark (6 curves), ALL dashes in ONE InstancedMesh, tinted per
 *   product.
 * - The conductor (this component's useFrame, priority -1 so it runs before
 *   every consumer): every few seconds it winds the core up
 *   (hubState.coreCharge ramps over ~0.75s), then FIRES a white-hot charge
 *   pulse (head + 3 trail dashes) down the OUT lane to the next landmark in
 *   round-robin order. On arrival the event goes big:
 *     - hubState.flare[target] = 1 (each landmark answers in its own way:
 *       window ripple / rail pulse around the gate / deep orb breath)
 *     - a ground shockwave ring expands at the landmark's base (pool of 3)
 *     - a vertical light pillar flares to the sky (pool of 3)
 *     - a return beam of dashes lights the IN lane back to the core and
 *       dissolves (extra instances in the same InstancedMesh — zero extra
 *       draw calls)
 *
 * Every curve is baked at module load into flat position/quaternion sample
 * arrays; per-frame work is pure indexed reads — zero allocations.
 * 1 instanced draw + 6 pooled meshes.
 */

const SAMPLES = 48;
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

// Two lanes per landmark: OUT (core -> landmark) and IN (landmark -> core),
// separated sideways so they read as a circuit. Baked once at module load.
const CURVES = [];
for (let i = 0; i < LANDMARKS.length; i++) {
  const [lx, , lz] = LANDMARKS[i].pos;
  const ay = LANDMARKS[i].anchorY;
  const len = Math.hypot(lx, lz);
  const px = (-lz / len) * 0.8;
  const pz = (lx / len) * 0.8;
  const orb = new THREE.Vector3(px * 0.3, CORE_ORB_Y, pz * 0.3);
  const orbIn = new THREE.Vector3(-px * 0.3, CORE_ORB_Y, -pz * 0.3);
  const anchor = new THREE.Vector3(lx + px * 0.4, ay, lz + pz * 0.4);
  const anchorIn = new THREE.Vector3(lx - px * 0.4, ay, lz - pz * 0.4);
  const midOut = new THREE.Vector3(lx * 0.5 + px * 1.6, 5, lz * 0.5 + pz * 1.6);
  const midIn = new THREE.Vector3(lx * 0.5 - px * 1.6, 5, lz * 0.5 - pz * 1.6);
  CURVES.push(bakeCurve(new THREE.QuadraticBezierCurve3(orb, midOut, anchor)));
  CURVES.push(bakeCurve(new THREE.QuadraticBezierCurve3(anchorIn, midIn, orbIn)));
}

const DASHES_PER_CURVE = 10;
const AMBIENT_COUNT = CURVES.length * DASHES_PER_CURVE; // 60

const PULSE_POOL = 2;
const PULSE_PARTS = 4; // head + 3 trail dashes
const BEAM_POOL = 2;
const BEAM_DASHES = 12;
const RIPPLE_POOL = 3;
const PILLAR_POOL = 3;

const PULSE_BASE = AMBIENT_COUNT;
const BEAM_BASE = PULSE_BASE + PULSE_POOL * PULSE_PARTS;
const TOTAL_INSTANCES = BEAM_BASE + BEAM_POOL * BEAM_DASHES; // 92

const AMBIENT_SPEED = 2.6; // world units / second
const PULSE_SPEED = 11;
const CHARGE_TIME = 0.75;

// Shared geometry / material / scratch (module scope)
const dashGeometry = new THREE.BoxGeometry(1, 1, 1);
const rippleGeometry = new THREE.RingGeometry(0.72, 1, 40);
const streamMaterial = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
  fog: false, // fog would ADD gray haze on additive blending
});
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const pulseWhite = new THREE.Color(PULSE_WHITE);
const landmarkColors = LANDMARKS.map((l) => new THREE.Color(l.color));
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

function placeOnCurve(curve, t, sx, sy) {
  const s = Math.min(SAMPLES - 1, (t * (SAMPLES - 1)) | 0);
  dummy.position.set(curve.pos[s * 3], curve.pos[s * 3 + 1], curve.pos[s * 3 + 2]);
  dummy.quaternion.set(
    curve.quat[s * 4],
    curve.quat[s * 4 + 1],
    curve.quat[s * 4 + 2],
    curve.quat[s * 4 + 3]
  );
  dummy.scale.set(sx, sy, sy);
  dummy.updateMatrix();
}

export default function EnergyStreams({ reducedMotion = false }) {
  const meshRef = useRef();
  const rippleRefs = useRef([]);
  const pillarRefs = useRef([]);
  const staticDone = useRef(false);

  // Conductor state — plain mutable refs, no React state ever.
  const conductor = useRef({ mode: 'idle', timer: 2.2, chargeT: 0, nextTarget: 0 });

  const particles = useMemo(() => {
    const list = [];
    for (let c = 0; c < CURVES.length; c++) {
      for (let k = 0; k < DASHES_PER_CURVE; k++) {
        list.push({
          curve: c,
          t: (k / DASHES_PER_CURVE + pseudoRandom(c * 31 + k) * 0.6) % 1,
          speed: (AMBIENT_SPEED * (0.8 + pseudoRandom(c * 13 + k * 7) * 0.5)) / CURVES[c].length,
        });
      }
    }
    return list;
  }, []);

  const pulses = useMemo(
    () => Array.from({ length: PULSE_POOL }, () => ({ active: false, t: 0, target: 0 })),
    []
  );
  const beams = useMemo(
    () => Array.from({ length: BEAM_POOL }, () => ({ active: false, life: 0, target: 0 })),
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

  const rippleMaterials = useMemo(
    () =>
      Array.from(
        { length: RIPPLE_POOL },
        () =>
          new THREE.MeshBasicMaterial({
            color: '#ffffff',
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
    () => Array.from({ length: PILLAR_POOL }, () => makeColumnMaterial('#ffffff', 1)),
    []
  );

  useEffect(
    () => () => {
      rippleMaterials.forEach((m) => m.dispose());
      pillarMaterials.forEach((m) => m.dispose());
    },
    [rippleMaterials, pillarMaterials]
  );

  // Bake static per-instance colors; park pulse/beam slots hidden.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let c = 0; c < CURVES.length; c++) {
      const landmark = (c / 2) | 0;
      for (let k = 0; k < DASHES_PER_CURVE; k++) {
        const idx = c * DASHES_PER_CURVE + k;
        tmpColor
          .copy(landmarkColors[landmark])
          .multiplyScalar(0.6 + pseudoRandom(idx * 7 + 1) * 0.9);
        mesh.setColorAt(idx, tmpColor);
      }
    }
    for (let p = 0; p < PULSE_POOL; p++) {
      for (let d = 0; d < PULSE_PARTS; d++) {
        const idx = PULSE_BASE + p * PULSE_PARTS + d;
        tmpColor.copy(pulseWhite).multiplyScalar(3.2 - d * 0.6);
        mesh.setColorAt(idx, tmpColor);
        hideInstance(mesh, idx);
      }
    }
    for (let b = 0; b < BEAM_POOL; b++) {
      for (let d = 0; d < BEAM_DASHES; d++) {
        const idx = BEAM_BASE + b * BEAM_DASHES + d;
        tmpColor.copy(pulseWhite).multiplyScalar(2);
        mesh.setColorAt(idx, tmpColor);
        hideInstance(mesh, idx);
      }
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  // Priority -1: the conductor runs after the HomeScene driver (-2) and
  // before every default-priority consumer, so hubState is always fresh.
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);

    // --- reduced motion: dim static circuit, no pulses --------------------
    if (reducedMotion) {
      if (!staticDone.current) {
        staticDone.current = true;
        streamMaterial.opacity = 0.3;
        for (let i = 0; i < AMBIENT_COUNT; i++) {
          const p = particles[i];
          placeOnCurve(CURVES[p.curve], p.t, 0.5, 0.06);
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    staticDone.current = false;
    streamMaterial.opacity = 0.55;

    // --- ambient circuit dashes -------------------------------------------
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const p = particles[i];
      p.t += dt * p.speed;
      if (p.t >= 1) p.t -= 1;
      // Dashes swell as they leave/approach the endpoints' glow
      placeOnCurve(CURVES[p.curve], p.t, 0.6, 0.07);
      mesh.setMatrixAt(i, dummy.matrix);
    }

    // --- conductor: wind up, then fire ------------------------------------
    const c = conductor.current;
    if (c.mode === 'idle') {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.mode = 'charge';
        c.chargeT = 0;
      }
    } else {
      // charging
      c.chargeT += dt / CHARGE_TIME;
      if (c.chargeT >= 1) {
        hubState.coreCharge = 0;
        c.mode = 'idle';
        let fired = false;
        for (let p = 0; p < PULSE_POOL; p++) {
          if (!pulses[p].active) {
            pulses[p].active = true;
            pulses[p].t = 0;
            pulses[p].target = c.nextTarget;
            c.nextTarget = (c.nextTarget + 1) % LANDMARKS.length;
            hubState.coreBoost = 1;
            fired = true;
            break;
          }
        }
        c.timer = fired ? 3.4 + Math.random() * 2.2 : 0.6;
      } else {
        const u = THREE.MathUtils.clamp(c.chargeT, 0, 1);
        hubState.coreCharge = u * u * (3 - 2 * u); // smoothstep wind-up
      }
    }

    // --- charge pulses in flight ------------------------------------------
    for (let p = 0; p < PULSE_POOL; p++) {
      const pulse = pulses[p];
      const baseIdx = PULSE_BASE + p * PULSE_PARTS;
      if (!pulse.active) {
        for (let d = 0; d < PULSE_PARTS; d++) hideInstance(mesh, baseIdx + d);
        continue;
      }
      const curve = CURVES[pulse.target * 2];
      pulse.t += dt * (PULSE_SPEED / curve.length);
      if (pulse.t >= 1) {
        // ARRIVAL — the landmark answers.
        pulse.active = false;
        for (let d = 0; d < PULSE_PARTS; d++) hideInstance(mesh, baseIdx + d);
        const target = pulse.target;
        const [lx, , lz] = LANDMARKS[target].pos;
        hubState.flare[target] = 1;

        // Ground shockwave ring
        for (let r = 0; r < RIPPLE_POOL; r++) {
          if (!ripples[r].active) {
            ripples[r].active = true;
            ripples[r].life = 0;
            const rm = rippleRefs.current[r];
            if (rm) rm.position.set(lx, 0.06, lz);
            rippleMaterials[r].color
              .copy(landmarkColors[target])
              .multiplyScalar(1.4);
            break;
          }
        }
        // Sky pillar
        for (let q = 0; q < PILLAR_POOL; q++) {
          if (!pillars[q].active) {
            pillars[q].active = true;
            pillars[q].life = 0;
            const pm = pillarRefs.current[q];
            if (pm) pm.position.set(lx, 8, lz);
            pillarMaterials[q].uniforms.uColor.value
              .copy(landmarkColors[target])
              .multiplyScalar(2.2);
            break;
          }
        }
        // Return beam along the IN lane, recolored to the landmark
        for (let b = 0; b < BEAM_POOL; b++) {
          if (!beams[b].active) {
            beams[b].active = true;
            beams[b].life = 0;
            beams[b].target = target;
            for (let d = 0; d < BEAM_DASHES; d++) {
              const idx = BEAM_BASE + b * BEAM_DASHES + d;
              tmpColor
                .copy(landmarkColors[target])
                .lerp(pulseWhite, 1 - d / (BEAM_DASHES - 1))
                .multiplyScalar(2);
              mesh.setColorAt(idx, tmpColor);
            }
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            break;
          }
        }
        continue;
      }
      // head + shrinking trail
      for (let d = 0; d < PULSE_PARTS; d++) {
        const tt = Math.max(0, pulse.t - d * 0.045);
        placeOnCurve(curve, tt, 1.3 - d * 0.24, 0.15 - d * 0.026);
        mesh.setMatrixAt(baseIdx + d, dummy.matrix);
      }
    }

    // --- return beams (dissolving dash trails) ----------------------------
    for (let b = 0; b < BEAM_POOL; b++) {
      const beam = beams[b];
      const baseIdx = BEAM_BASE + b * BEAM_DASHES;
      if (!beam.active) continue;
      beam.life += dt / 0.8;
      if (beam.life >= 1) {
        beam.active = false;
        for (let d = 0; d < BEAM_DASHES; d++) hideInstance(mesh, baseIdx + d);
        continue;
      }
      const curve = CURVES[beam.target * 2 + 1];
      const shrink = 1 - beam.life;
      for (let d = 0; d < BEAM_DASHES; d++) {
        placeOnCurve(curve, d / (BEAM_DASHES - 1), 1.3 * shrink, 0.12 * shrink);
        mesh.setMatrixAt(baseIdx + d, dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;

    // --- pooled shockwave rings -------------------------------------------
    for (let r = 0; r < RIPPLE_POOL; r++) {
      const ripple = ripples[r];
      const rm = rippleRefs.current[r];
      if (!rm) continue;
      if (!ripple.active) {
        rm.visible = false;
        continue;
      }
      ripple.life += dt / 1.05;
      if (ripple.life >= 1) {
        ripple.active = false;
        rm.visible = false;
        continue;
      }
      rm.visible = true;
      const scale = 0.7 + ripple.life * 5.5;
      rm.scale.set(scale, scale, 1);
      rippleMaterials[r].opacity = (1 - ripple.life) * 0.8;
    }

    // --- pooled sky pillars -----------------------------------------------
    for (let q = 0; q < PILLAR_POOL; q++) {
      const pillar = pillars[q];
      const pm = pillarRefs.current[q];
      if (!pm) continue;
      if (!pillar.active) {
        pm.visible = false;
        continue;
      }
      pillar.life += dt / 1.25;
      if (pillar.life >= 1) {
        pillar.active = false;
        pm.visible = false;
        continue;
      }
      pm.visible = true;
      const spread = 0.4 + pillar.life * 0.5;
      pm.scale.set(spread, 16, spread);
      const fade = (1 - pillar.life) * (1 - pillar.life);
      pillarMaterials[q].uniforms.uOpacity.value = fade * 0.8;
    }
  }, -1);

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
          geometry={rippleGeometry}
          material={material}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          frustumCulled={false}
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
