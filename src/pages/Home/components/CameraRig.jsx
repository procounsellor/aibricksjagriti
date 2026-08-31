import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Camera drama for the hub world:
 * - a ~2.5s establishing sweep on load: wide and high over the tableau,
 *   descending onto the resting orbit pose (a quadratic bezier in position
 *   + an eased look-target handoff that lands EXACTLY on the Canvas'
 *   default camera pose, so there is zero pop at the end)
 * - after the sweep: an endless slow orbital drift around the whole
 *   tableau + mouse parallax (±1.5, critically damped, applied on the
 *   orbit's own angle/height so it stays correct at any azimuth) + a
 *   gentle breathing FOV, all ramped in over 1.5s
 *
 * The look target sits above the core, keeping the bright core low on
 * screen and the center clear for the DOM hero text.
 *
 * Under prefers-reduced-motion: one static pleasant angle, nothing moves.
 */

const REST_RADIUS = 16.5;
const REST_HEIGHT = 6.4;
const BASE_FOV = 62;

// Intro sweep bezier (P0 wide overview -> P2 = the Canvas default pose)
const P0 = new THREE.Vector3(14, 15, 27);
const P1 = new THREE.Vector3(-7, 10, 24);
const P2 = new THREE.Vector3(0, REST_HEIGHT, REST_RADIUS);

// Look target: sweep starts on the whole tableau, lands above the core
const L0 = new THREE.Vector3(0, 5.5, -3);
const L1 = new THREE.Vector3(0, 2.7, 0);

const INTRO_DURATION = 2.5;
const RAMP_DURATION = 1.5;

// Preallocated scratch
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

function smootherstep(x) {
  const u = THREE.MathUtils.clamp(x, 0, 1);
  return u * u * u * (u * (u * 6 - 15) + 10);
}

export default function CameraRig({ reducedMotion = false }) {
  const camera = useThree((s) => s.camera);
  const elapsed = useRef(0);
  const parallaxX = useRef(0);
  const parallaxY = useRef(0);
  const staticSet = useRef(false);

  useFrame((state, delta) => {
    if (reducedMotion) {
      // One static pleasant angle — set once, then leave the camera alone.
      if (!staticSet.current) {
        staticSet.current = true;
        camera.position.copy(P2);
        camera.lookAt(L1);
        if (camera.fov !== BASE_FOV) {
          camera.fov = BASE_FOV;
          camera.updateProjectionMatrix();
        }
      }
      return;
    }
    staticSet.current = false;

    elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;

    if (t < INTRO_DURATION) {
      // --- establishing sweep ---------------------------------------------
      const u = smootherstep(t / INTRO_DURATION);
      tmpA.lerpVectors(P0, P1, u);
      tmpB.lerpVectors(P1, P2, u);
      tmpPos.lerpVectors(tmpA, tmpB, u);
      camera.position.copy(tmpPos);
      tmpLook.lerpVectors(L0, L1, Math.pow(u, 1.3));
      camera.lookAt(tmpLook);
      return;
    }

    // --- resting orbit: drift + parallax + breathing FOV ------------------
    const cruise = Math.min((t - INTRO_DURATION) / RAMP_DURATION, 1);

    // Smoothed pointer (critically damped, zero allocation)
    parallaxX.current = THREE.MathUtils.damp(parallaxX.current, state.pointer.x, 2.2, delta);
    parallaxY.current = THREE.MathUtils.damp(parallaxY.current, state.pointer.y, 2.2, delta);

    // Slow full orbit around the tableau; parallax bends the orbit angle so
    // the ±1.5-unit sway stays correct at every azimuth.
    const angle =
      (t - INTRO_DURATION) * 0.032 * cruise +
      parallaxX.current * 0.09 * cruise;
    const height =
      REST_HEIGHT +
      (Math.sin(t * 0.13) * 0.5 + parallaxY.current * 1.5) * cruise;
    const radius = REST_RADIUS + Math.sin(t * 0.09 + 2.1) * 0.6 * cruise;

    camera.position.set(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius
    );
    tmpLook.set(L1.x, L1.y + parallaxY.current * 0.6 * cruise, L1.z);
    camera.lookAt(tmpLook);

    // Gentle breathing FOV
    camera.fov = BASE_FOV + Math.sin(t * 0.4) * 1.1 * cruise;
    camera.updateProjectionMatrix();
  });

  return null;
}
