import React, {
  useMemo,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NEON_GOLD } from '../colors';

const _color = new THREE.Color();

// --- Procedural textures (built once per mount, no network assets) ----------
function makeRingTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.58, 'rgba(255,255,255,0)');
  grad.addColorStop(0.74, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.82, 'rgba(255,255,255,1)');
  grad.addColorStop(0.92, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function makePillarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  // Canvas top row maps to the TOP of the cylinder (flipY default true):
  // transparent at the top, hot at the base.
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0.95)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

const ringGeom = new THREE.PlaneGeometry(1, 1);
const pillarGeom = new THREE.CylinderGeometry(1.15, 0.85, 1, 18, 1, true);

const CONFETTI_COUNT = 140;
const confettiMat = new THREE.PointsMaterial({
  size: 0.26,
  vertexColors: true,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true,
  toneMapped: false,
  fog: false,
});

/**
 * Checkpoint arrivals as events. One pooled set of meshes, retargeted on
 * every `trigger(checkpoint)` call from the scene driver (never triggered
 * under reduced motion — the driver's arrival detection is already gated):
 *
 * - an expanding holographic shockwave ring racing across the platform,
 * - a vertical light pillar erupting beside the path for ~1s,
 * - a flurry of glowing page-flakes raining down in the checkpoint's accent
 *   color (a reduced slice of the pool via drawRange),
 * - and, at the FINAL gold summit, the maximal version: a taller / longer
 *   pillar plus the full golden confetti rain — the "you made it" moment.
 *
 * 3 draw calls while an arrival is playing, all hidden otherwise. All
 * colors are pushed above 1.0 so the whole event blooms hard.
 */
const ArrivalFX = forwardRef(function ArrivalFX(props, ref) {
  const ringRef = useRef();
  const pillarRef = useRef();
  const confettiRef = useRef();

  const fx = useRef({
    active: false,
    life: 0,
    duration: 1,
    pillarHeight: 15,
    ringMax: 13,
    confetti: false,
    confettiLife: 0,
    confettiDuration: 2.6,
    confettiCount: CONFETTI_COUNT,
    origin: new THREE.Vector3(),
    vel: new Float32Array(CONFETTI_COUNT * 3),
  });

  const { ringMat, pillarMat } = useMemo(
    () => ({
      ringMat: new THREE.MeshBasicMaterial({
        map: makeRingTexture(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      }),
      pillarMat: new THREE.MeshBasicMaterial({
        map: makePillarTexture(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      }),
    }),
    []
  );

  const confettiGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(CONFETTI_COUNT * 3), 3)
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(CONFETTI_COUNT * 3), 3)
    );
    return geo;
  }, []);

  useEffect(
    () => () => {
      confettiGeom.dispose();
      if (ringMat.map) ringMat.map.dispose();
      ringMat.dispose();
      if (pillarMat.map) pillarMat.map.dispose();
      pillarMat.dispose();
    },
    [confettiGeom, ringMat, pillarMat]
  );

  useImperativeHandle(
    ref,
    () => ({
      trigger: (checkpoint) => {
        const s = fx.current;
        // Event centre: the middle of the checkpoint platform, off the
        // outward side of the book path.
        s.origin.set(
          checkpoint.position.x + checkpoint.side.x * 3.9,
          checkpoint.position.y - 0.2,
          checkpoint.position.z + checkpoint.side.z * 3.9
        );
        s.life = 1;
        s.active = true;
        s.duration = checkpoint.isFinal ? 1.9 : 1.05;
        s.pillarHeight = checkpoint.isFinal ? 26 : 14;
        s.ringMax = checkpoint.isFinal ? 18 : 12;

        // HDR tint from the checkpoint accent.
        _color.copy(checkpoint.color).multiplyScalar(2.2);
        ringMat.color.copy(_color);
        pillarMat.color.copy(_color);

        // Glowing page-flakes: a short accent-colored flurry at every
        // checkpoint; the full, longer golden rain at the summit.
        s.confetti = true;
        s.confettiLife = 1;
        s.confettiDuration = checkpoint.isFinal ? 2.6 : 1.4;
        s.confettiCount = checkpoint.isFinal ? CONFETTI_COUNT : 64;
        confettiGeom.setDrawRange(0, s.confettiCount);
        const positions = confettiGeom.attributes.position.array;
        const colors = confettiGeom.attributes.color.array;
        const vel = s.vel;
        if (checkpoint.isFinal) {
          _color.set(NEON_GOLD);
        } else {
          _color.copy(checkpoint.color);
        }
        for (let i = 0; i < s.confettiCount; i++) {
          const vi = i * 3;
          positions[vi] = s.origin.x + (Math.random() - 0.5) * 8;
          positions[vi + 1] = s.origin.y + 7 + Math.random() * 7;
          positions[vi + 2] = s.origin.z + (Math.random() - 0.5) * 8;
          vel[vi] = (Math.random() - 0.5) * 1.4;
          vel[vi + 1] = -(1.6 + Math.random() * 2.6);
          vel[vi + 2] = (Math.random() - 0.5) * 1.4;
          // Accent with white-hot sparkle variation, pushed into HDR.
          const bright = 1.2 + Math.random() * 1.4;
          colors[vi] = _color.r * bright;
          colors[vi + 1] = _color.g * bright;
          colors[vi + 2] = (_color.b + Math.random() * 0.3) * bright;
        }
        confettiGeom.attributes.position.needsUpdate = true;
        confettiGeom.attributes.color.needsUpdate = true;
        if (confettiRef.current) confettiRef.current.visible = true;
        confettiMat.opacity = 1;
      },
    }),
    [confettiGeom, ringMat, pillarMat]
  );

  useFrame((_, rawDelta) => {
    // Clamped delta: a background-tab return must not blast the confetti
    // across the scene or skip the shockwave.
    const delta = Math.min(rawDelta, 0.05);
    const s = fx.current;
    const ring = ringRef.current;
    const pillar = pillarRef.current;
    const confetti = confettiRef.current;

    if (s.active && ring && pillar) {
      s.life -= delta / s.duration;
      if (s.life <= 0) {
        s.active = false;
        ring.visible = false;
        pillar.visible = false;
      } else {
        const p = 1 - s.life; // 0 -> 1 over the event
        // Shockwave: fast ease-out expansion, fading as it runs.
        const expand = 1 - Math.pow(1 - p, 3);
        ring.visible = true;
        ring.position.copy(s.origin);
        ring.position.y += 0.15;
        ring.scale.setScalar(0.5 + expand * s.ringMax);
        ringMat.opacity = (1 - p) * (1 - p);

        // Pillar: erupts instantly, holds, then dissolves upward.
        const inA = Math.min(1, p * 7); // fast rise
        const out = 1 - Math.max(0, (p - 0.45) / 0.55); // slow fade
        const h = s.pillarHeight * (0.35 + 0.65 * inA);
        pillar.visible = true;
        pillar.position.copy(s.origin);
        pillar.position.y += h / 2;
        pillar.scale.set(1 + p * 0.6, h, 1 + p * 0.6);
        pillar.rotation.y += delta * 1.5;
        pillarMat.opacity = 0.85 * inA * out * out;
      }
    }

    if (s.confetti && confetti) {
      s.confettiLife -= delta / s.confettiDuration;
      if (s.confettiLife <= 0) {
        s.confetti = false;
        confetti.visible = false;
      } else {
        const positions = confettiGeom.attributes.position.array;
        const vel = s.vel;
        for (let i = 0; i < s.confettiCount; i++) {
          const vi = i * 3;
          positions[vi] += vel[vi] * delta;
          positions[vi + 1] += vel[vi + 1] * delta;
          positions[vi + 2] += vel[vi + 2] * delta;
          // Gentle page-flutter drift.
          vel[vi] += (Math.random() - 0.5) * delta * 2;
          vel[vi + 2] += (Math.random() - 0.5) * delta * 2;
        }
        confettiGeom.attributes.position.needsUpdate = true;
        confettiMat.opacity = Math.min(1, s.confettiLife * 3);
      }
    }
  });

  return (
    <group>
      <mesh
        ref={ringRef}
        geometry={ringGeom}
        material={ringMat}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        frustumCulled={false}
      />
      <mesh
        ref={pillarRef}
        geometry={pillarGeom}
        material={pillarMat}
        visible={false}
        frustumCulled={false}
      />
      <points
        ref={confettiRef}
        geometry={confettiGeom}
        material={confettiMat}
        visible={false}
        frustumCulled={false}
      />
    </group>
  );
});

export default ArrivalFX;
