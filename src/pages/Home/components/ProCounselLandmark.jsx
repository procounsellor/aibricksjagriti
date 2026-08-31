import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { hubState, LANDMARKS } from '../hubState';
import { glowTexture } from './textures';
import LandmarkLabel from './LandmarkLabel';
import {
  PROCOUNSEL_INDIGO,
  PROCOUNSEL_VIOLET,
  PULSE_WHITE,
  STRUCTURE_DARK,
} from '../colors';

/**
 * The ProCounsel landmark — a neon metro station gate: a standing double
 * HDR arch flanked by neon-striped posts, with a tiny light-rail loop
 * circling the platform and a glowing tram forever running it (with a
 * 2-dash trail). When the core's charge pulse arrives (hubState.flare[1])
 * the gate flares, the tram surges, and a white-hot rail pulse laps the
 * arch itself. ~14 draw calls.
 */

const LANDMARK_INDEX = 1;
const POS = LANDMARKS[LANDMARK_INDEX].pos;

const GATE_Y = 2.3;
const GATE_R = 1.85;
const LOOP_A = 3.1; // ellipse semi-axis x
const LOOP_B = 2.0; // ellipse semi-axis z
const TRAM_Y = 0.18;

const structureMaterial = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  metalness: 0.7,
  roughness: 0.45,
});

const indigo = new THREE.Color(PROCOUNSEL_INDIGO);
const violet = new THREE.Color(PROCOUNSEL_VIOLET);
const white = new THREE.Color(PULSE_WHITE);

export default function ProCounselLandmark({ reducedMotion = false }) {
  const tramRefs = useRef([]);
  const gatePulseRef = useRef();
  const tramAngle = useRef(0);

  const gateMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: PROCOUNSEL_INDIGO, toneMapped: false }),
    []
  );
  const gateInnerMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: PROCOUNSEL_VIOLET, toneMapped: false }),
    []
  );
  const stripMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(PROCOUNSEL_VIOLET).multiplyScalar(1.3),
        toneMapped: false,
      }),
    []
  );
  const loopMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(PROCOUNSEL_INDIGO).multiplyScalar(0.85),
        toneMapped: false,
      }),
    []
  );
  const tramMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: PROCOUNSEL_VIOLET, toneMapped: false }),
    []
  );
  const gatePulseMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(PULSE_WHITE).multiplyScalar(3),
        toneMapped: false,
      }),
    []
  );
  const poolMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        color: PROCOUNSEL_INDIGO,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useEffect(
    () => () => {
      gateMaterial.dispose();
      gateInnerMaterial.dispose();
      stripMaterial.dispose();
      loopMaterial.dispose();
      tramMaterial.dispose();
      gatePulseMaterial.dispose();
      poolMaterial.dispose();
    },
    [gateMaterial, gateInnerMaterial, stripMaterial, loopMaterial, tramMaterial, gatePulseMaterial, poolMaterial]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const flare = reducedMotion ? 0 : hubState.flare[LANDMARK_INDEX];

    // Gate glow answers the pulse
    gateMaterial.color.copy(indigo).multiplyScalar(1.15 + flare * 1.3);
    gateInnerMaterial.color.copy(violet).multiplyScalar(1.45 + flare * 1.6);
    tramMaterial.color.copy(violet).multiplyScalar(1.6 + flare * 1.6);
    poolMaterial.opacity = 0.24 + flare * 0.3;

    // The tiny light-rail loop: tram + 2 trail dashes around the ellipse
    if (!reducedMotion) {
      tramAngle.current += dt * (0.55 + flare * 2.6);
      if (tramAngle.current > Math.PI * 2) tramAngle.current -= Math.PI * 2;
    }
    for (let i = 0; i < 3; i++) {
      const mesh = tramRefs.current[i];
      if (!mesh) continue;
      const a = tramAngle.current - i * 0.22;
      mesh.position.set(Math.cos(a) * LOOP_A, TRAM_Y, Math.sin(a) * LOOP_B);
      mesh.rotation.y = Math.atan2(LOOP_A * Math.sin(a), LOOP_B * Math.cos(a));
      const shrink = 1 - i * 0.3;
      mesh.scale.set(0.5 * shrink, 0.13 * shrink, 0.13 * shrink);
    }

    // Rail pulse lapping the standing arch while the flare is live
    const gatePulse = gatePulseRef.current;
    if (gatePulse) {
      const show = flare > 0.02;
      gatePulse.visible = show;
      if (show) {
        const phi = -Math.PI / 2 + (1 - flare) * Math.PI * 2 * 1.5;
        gatePulse.position.set(
          Math.cos(phi) * GATE_R,
          GATE_Y + Math.sin(phi) * GATE_R,
          0
        );
        gatePulseMaterial.color.copy(white).multiplyScalar(2 + flare * 1.8);
      }
    }
  });

  return (
    <group position={POS} rotation={[0, -Math.PI / 2 + 0.35, 0]}>
      {/* Platform */}
      <mesh position={[0, 0.12, 0]} material={structureMaterial}>
        <boxGeometry args={[4.2, 0.24, 2.6]} />
      </mesh>

      {/* Flanking posts with neon strips */}
      <mesh position={[-2.35, 1.3, 0]} material={structureMaterial}>
        <boxGeometry args={[0.26, 2.6, 0.26]} />
      </mesh>
      <mesh position={[2.35, 1.3, 0]} material={structureMaterial}>
        <boxGeometry args={[0.26, 2.6, 0.26]} />
      </mesh>
      <mesh position={[-2.2, 1.3, 0]} material={stripMaterial}>
        <boxGeometry args={[0.05, 2.4, 0.05]} />
      </mesh>
      <mesh position={[2.2, 1.3, 0]} material={stripMaterial}>
        <boxGeometry args={[0.05, 2.4, 0.05]} />
      </mesh>

      {/* The standing metro arch — double HDR ring */}
      <mesh position={[0, GATE_Y, 0]} material={gateMaterial}>
        <torusGeometry args={[GATE_R, 0.07, 10, 56]} />
      </mesh>
      <mesh position={[0, GATE_Y, 0]} material={gateInnerMaterial}>
        <torusGeometry args={[GATE_R - 0.26, 0.045, 8, 48]} />
      </mesh>

      {/* Rail pulse that laps the arch on flare */}
      <mesh ref={gatePulseRef} material={gatePulseMaterial} visible={false}>
        <sphereGeometry args={[0.1, 12, 12]} />
      </mesh>

      {/* The light-rail loop around the platform */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[LOOP_A, LOOP_B, 1]}
        position={[0, 0.06, 0]}
        material={loopMaterial}
      >
        <torusGeometry args={[1, 0.028, 6, 64]} />
      </mesh>

      {/* Tram + trail dashes */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (tramRefs.current[i] = el)}
          material={tramMaterial}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      ))}

      {/* Light pool on the grid floor */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={poolMaterial}>
        <planeGeometry args={[8.5, 8.5]} />
      </mesh>

      <LandmarkLabel
        text="ProCounsel"
        color={PROCOUNSEL_INDIGO}
        position={[0, GATE_Y + GATE_R + 1.1, 0]}
      />
    </group>
  );
}
