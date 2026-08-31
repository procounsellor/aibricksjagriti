import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import {
  TRACK_CURVE,
  RAIL_LIFT,
  STATIONS,
  nearestStationIndex,
  tramMotion,
} from '../trackData';

const UP = new THREE.Vector3(0, 1, 0);
const _tramPos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _side = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _blendPos = new THREE.Vector3();
const _blendLook = new THREE.Vector3();

// Intro establishing shot: wide over the neon city, before diving down
// behind the tram.
const INTRO_POS = new THREE.Vector3(34, 27, 80);
const INTRO_LOOK = new THREE.Vector3(-6, 1, -50);
const INTRO_HOLD = 2.4; // stays wide while the page loader is still up
const INTRO_SWEEP = 2.5; // the dive itself

const BASE_FOV = 60;

/**
 * Cinematic camera rig for the Neon Metro Timeline.
 *
 * Layers, all continuous (no jump cuts), all driven off the shared tramMotion
 * state written by the scene driver earlier in the frame:
 *
 * - scripted intro sweep on load: a wide city establishing shot that dives
 *   down behind the tram over ~2.5s (held during the page loader; skipped
 *   under reduced motion or when the page loads mid-scroll);
 * - smoothed follow with a swing out to the platform's opposite side at each
 *   station — now a LOW-ANGLE hero shot: the camera drops toward platform
 *   level and tilts up at the holographic sign;
 * - hyperspeed FOV kick: +7 degrees at full warp, eased by tramMotion.hyper;
 * - arrival punch: a brief dolly-in + slight FOV tighten as the tram crosses
 *   a station (tramMotion.arrivalPulse), for a beat of slow-motion weight;
 * - mouse parallax: +/-1.5 units of lateral drift, lerped.
 *
 * Reduced motion: plain snap follow, fixed FOV, no intro, no parallax.
 */
export function useCinematicCamera() {
  const { camera } = useThree();
  const prefersReducedMotion = useReducedMotion();
  const lookRef = useRef(new THREE.Vector3(0, 1, 30));
  const initializedRef = useRef(false);
  const introRef = useRef({ decided: false, skip: false, elapsed: 0 });
  const mouseRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  // Mouse-position parallax source (normalized -1..1). Passive listener,
  // writes a ref — never touches React state.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const onPointerMove = (e) => {
      const m = mouseRef.current;
      m.x = (e.clientX / window.innerWidth) * 2 - 1;
      m.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [prefersReducedMotion]);

  useFrame((_, delta) => {
    const t = tramMotion.t;
    TRACK_CURVE.getPointAt(t, _tramPos);
    _tramPos.y += RAIL_LIFT;
    TRACK_CURVE.getTangentAt(t, _tan);
    _side.crossVectors(UP, _tan).setY(0).normalize();

    // Station-proximity swing: 0 between stations, 1 exactly at a station.
    let swing = 0;
    let sideSign = 1;
    if (!prefersReducedMotion) {
      const st = STATIONS[nearestStationIndex(t)];
      const d = Math.abs(t - st.t);
      const prox = 1 - Math.min(d / 0.042, 1);
      swing = prox * prox * (3 - 2 * prox); // smoothstep
      // Swing to the side opposite the platform: the sign faces the track,
      // so this puts it square to the camera.
      sideSign = -st.platformSign;
    }

    const hyper = prefersReducedMotion ? 0 : tramMotion.hyper;
    const pulse = prefersReducedMotion ? 0 : tramMotion.arrivalPulse;
    const punch = pulse * pulse; // sharper attack, soft decay

    // Follow offset. At stations: closer, swung wide and LOW (hero angle).
    // On arrival: an extra dolly-in punch. In hyperspeed: hang back a touch.
    const back = 9.5 - swing * 4.6 - punch * 1.6 + hyper * 1.2;
    _desired
      .copy(_tramPos)
      .addScaledVector(_tan, -back)
      .addScaledVector(_side, sideSign * swing * 6.8);
    _desired.y += 3.4 - swing * 1.9 + hyper * 0.5;

    // Mouse parallax (smoothed, +/-1.5 lateral, +/-0.7 vertical).
    if (!prefersReducedMotion) {
      const m = mouseRef.current;
      const mAlpha = Math.min(1, delta * 3);
      m.sx += (m.x - m.sx) * mAlpha;
      m.sy += (m.y - m.sy) * mAlpha;
      _desired.addScaledVector(_side, m.sx * 1.5);
      _desired.y += -m.sy * 0.7;
    }

    // Look slightly ahead of the tram; at stations, tilt up toward the
    // holographic sign for the low-angle hero framing.
    TRACK_CURVE.getPointAt(Math.min(t + 0.02, 1), _lookTarget);
    _lookTarget.y += RAIL_LIFT + 0.8 + swing * 1.15;

    // --- Intro sweep ---------------------------------------------------------
    const intro = introRef.current;
    if (!intro.decided) {
      intro.decided = true;
      // Skip when motion is reduced or the page loaded mid-scroll.
      intro.skip = prefersReducedMotion || t > 0.03;
      if (intro.skip) intro.elapsed = INTRO_HOLD + INTRO_SWEEP;
    }
    let introBlend = 1;
    if (intro.elapsed < INTRO_HOLD + INTRO_SWEEP) {
      intro.elapsed += delta;
      const raw = THREE.MathUtils.clamp(
        (intro.elapsed - INTRO_HOLD) / INTRO_SWEEP,
        0,
        1
      );
      // Smooth dive: ease-in-out.
      introBlend = raw * raw * (3 - 2 * raw);
      _blendPos.lerpVectors(INTRO_POS, _desired, introBlend);
      _blendLook.lerpVectors(INTRO_LOOK, _lookTarget, introBlend);
      camera.position.copy(_blendPos);
      lookRef.current.copy(_blendLook);
      camera.lookAt(lookRef.current);
      if (introBlend >= 1) initializedRef.current = true;
    } else {
      // --- Normal follow -----------------------------------------------------
      const alpha =
        prefersReducedMotion || !initializedRef.current
          ? 1
          : 1 - Math.pow(1 - 0.085, delta * 60);
      initializedRef.current = true;
      camera.position.lerp(_desired, alpha);
      lookRef.current.lerp(_lookTarget, alpha);
      camera.lookAt(lookRef.current);
    }

    // --- FOV: hyperspeed kick + arrival tighten + wide intro -----------------
    let fov = BASE_FOV;
    if (!prefersReducedMotion) {
      fov = BASE_FOV + hyper * 7 - punch * 4 + (1 - introBlend) * 9;
    }
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
}
