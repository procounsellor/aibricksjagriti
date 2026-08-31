import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Camera drama:
 * - a ~2.5s scripted establishing sweep on load: high orbit over the city
 *   descending toward the street-level hero framing (a quadratic bezier in
 *   position + an eased look-target handoff that lands EXACTLY on the
 *   Canvas' default camera pose, so there is zero pop at the end)
 * - after the sweep: continuous subtle drone drift + mouse parallax
 *   (±1.5 units, critically damped), ramped in over 1.5s so the sweep
 *   blends seamlessly into the cruise
 *
 * ScrollControls only drives DOM scrolling + the time-of-day offset here -
 * it never touches the camera - so this rig owns the camera outright.
 * Under prefers-reduced-motion the rig does nothing at all.
 */

// Intro sweep bezier (P0 high orbit -> P2 = the Canvas default camera pose)
const P0 = new THREE.Vector3(36, 46, 60);
const P1 = new THREE.Vector3(-28, 30, 54);
const P2 = new THREE.Vector3(0, 20, 28);

// Look target: city heart -> straight-ahead point that yields the default
// identity orientation (camera at y=20 looking horizontally down -z)
const L0 = new THREE.Vector3(0, 7, -4);
const L1 = new THREE.Vector3(0, 20, -72);

const INTRO_DURATION = 2.5;
const RAMP_DURATION = 1.5;

// Preallocated scratch
const tmpPos = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

function smootherstep(x) {
  const u = THREE.MathUtils.clamp(x, 0, 1);
  return u * u * u * (u * (u * 6 - 15) + 10);
}

export function CameraRig({ reducedMotion = false }) {
  const camera = useThree((s) => s.camera);
  const elapsed = useRef(0);
  const parallaxX = useRef(0);
  const parallaxY = useRef(0);

  useFrame((state, delta) => {
    if (reducedMotion) return; // leave the default static camera untouched

    elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;

    if (t < INTRO_DURATION) {
      // --- establishing sweep ---------------------------------------------
      const u = smootherstep(t / INTRO_DURATION);
      // Quadratic bezier: lerp(lerp(P0,P1,u), lerp(P1,P2,u), u)
      tmpA.lerpVectors(P0, P1, u);
      tmpB.lerpVectors(P1, P2, u);
      tmpPos.lerpVectors(tmpA, tmpB, u);
      camera.position.copy(tmpPos);
      tmpLook.lerpVectors(L0, L1, Math.pow(u, 1.35));
      camera.lookAt(tmpLook);
      return;
    }

    // --- drone cruise: drift + mouse parallax -----------------------------
    const cruise = Math.min((t - INTRO_DURATION) / RAMP_DURATION, 1);

    // Smoothed pointer (critically damped, zero allocation)
    parallaxX.current = THREE.MathUtils.damp(parallaxX.current, state.pointer.x, 2.2, delta);
    parallaxY.current = THREE.MathUtils.damp(parallaxY.current, state.pointer.y, 2.2, delta);

    const driftX = Math.sin(t * 0.11) * 0.9;
    const driftY = Math.sin(t * 0.07 + 1.7) * 0.5;
    const driftZ = Math.cos(t * 0.09) * 0.7;

    camera.position.set(
      P2.x + (driftX + parallaxX.current * 1.5) * cruise,
      P2.y + (driftY + parallaxY.current * 0.8) * cruise,
      P2.z + driftZ * cruise
    );
    tmpLook.set(
      L1.x + parallaxX.current * 2.4 * cruise,
      L1.y + parallaxY.current * 1.4 * cruise,
      L1.z
    );
    camera.lookAt(tmpLook);
  });

  return null;
}
