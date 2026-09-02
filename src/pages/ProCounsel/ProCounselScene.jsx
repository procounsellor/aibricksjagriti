import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  DawnSky,
  StarField,
  CloudSea,
  BookPath,
  FloatingBooks,
  Checkpoints,
  Student,
  SparkleTrail,
  PageRush,
  ArrivalBursts,
  ArrivalFX,
  LibraryLight,
  PostFX,
} from './components';
import { useCinematicCamera } from './hooks/useAnimations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLContextLoss } from '../../hooks/useWebGLContextLoss';
import { PRIMARY_INDIGO } from './colors';
import {
  CHECKPOINTS,
  NUM_CHECKPOINTS,
  SPIRAL_CENTER,
  warpScroll,
  climbMotion,
  resetClimbMotion,
} from './trackData';

/**
 * Ascent to Graduation.
 *
 * A rising, gently spiraling stairway of giant glowing books climbs out of
 * a cloud sea, through a deep-indigo study-cosmos, toward a golden dawn
 * summit. The 9 admission stages are checkpoints along the climb
 * (t = 0.15 -> 0.95, evenly spaced — the same mapping the old scene used,
 * so the DOM OverlayText card timing still lines up with arrivals). A small
 * student walks the books as the user scrolls; between checkpoints the warp
 * curve flings them forward and loose glowing pages rush past the camera,
 * and every arrival detonates a shockwave + light pillar + page flurry. At
 * the summit, a convocation stage waits under a hovering graduation cap
 * that lifts and spins in a golden confetti rain. A real HDR bloom composer
 * (PostFX) makes all of the glow genuinely bleed.
 *
 * The driver useFrame below (priority -2, so it runs before every other
 * subscriber) converts raw scroll into a smoothed, checkpoint-eased curve-t
 * and writes it — plus derived rush / arrival-pulse factors — into the
 * shared climbMotion object. The student, page rush, sparkle wake, post
 * effects and cinematic camera all read from that — no React state is
 * touched during scroll.
 */
export default function ProCounselScene({ scrollRef }) {
  const prefersReducedMotion = useReducedMotion();
  const checkpointsRef = useRef();
  const burstsRef = useRef();
  const arrivalFxRef = useRef();

  // Minimal WebGL context-loss handling for this canvas
  useWebGLContextLoss();

  // climbMotion is a module singleton — reset it when the scene (re)mounts.
  useEffect(() => {
    resetClimbMotion();
  }, []);

  // --- Driver: scroll -> climb t, rush factor, arrival events ---------------
  useFrame((_, delta) => {
    const s = THREE.MathUtils.clamp(scrollRef?.current ?? 0, 0, 1);
    const prev = climbMotion.t;
    let t;
    if (prefersReducedMotion) {
      // Snap straight to the scroll position — no easing flourishes.
      t = s;
    } else {
      const target = warpScroll(s);
      const alpha = 1 - Math.pow(1 - 0.16, delta * 60);
      t = prev + (target - prev) * alpha;
    }
    climbMotion.prevT = prev;
    climbMotion.t = t;

    // Smoothed speed estimate (drives the wake, page rush, FOV, CA...).
    const instSpeed = delta > 0 ? Math.abs(t - prev) / delta : 0;
    climbMotion.speed +=
      (instSpeed - climbMotion.speed) * Math.min(1, delta * 8);

    // Rush factor: kicks in fast when the student flies mid-segment, eases
    // out more gently as the warp curve brakes into a checkpoint.
    const targetRush = prefersReducedMotion
      ? 0
      : THREE.MathUtils.smoothstep(climbMotion.speed, 0.1, 0.32);
    climbMotion.rush +=
      (targetRush - climbMotion.rush) *
      Math.min(1, delta * (targetRush > climbMotion.rush ? 6 : 3));

    // Arrival pulse decay (set to 1 on checkpoint crossings below).
    climbMotion.arrivalPulse = Math.max(
      0,
      climbMotion.arrivalPulse - delta / 1.1
    );

    // Arrival detection: did we cross a checkpoint t this frame?
    if (!prefersReducedMotion && Math.abs(t - prev) > 1e-6) {
      for (let i = 0; i < NUM_CHECKPOINTS; i++) {
        const cpT = CHECKPOINTS[i].t;
        if ((prev < cpT && t >= cpT) || (prev > cpT && t <= cpT)) {
          if (checkpointsRef.current) checkpointsRef.current.boost(i);
          if (burstsRef.current) burstsRef.current.trigger(CHECKPOINTS[i]);
          if (arrivalFxRef.current)
            arrivalFxRef.current.trigger(CHECKPOINTS[i]);
          climbMotion.arrivalPulse = 1;
          climbMotion.arrivalIndex = i;
        }
      }
    }
  }, -2);

  useCinematicCamera();

  return (
    <>
      {/* Study-cosmos lighting: soft indigo ambient + a warm dawn key from
          above the summit. Glowing parts use unlit (basic) HDR materials so
          they stay punchy regardless. */}
      <ambientLight intensity={0.45} color="#6b62a8" />
      <directionalLight
        position={[20, 70, 12]}
        intensity={0.85}
        color="#ffd9b0"
      />
      <hemisphereLight args={['#3a2f6b', '#0a0a18', 0.55]} />

      <DawnSky />
      <StarField />
      <CloudSea />
      <BookPath />
      <FloatingBooks />
      <Checkpoints ref={checkpointsRef} />
      <Student />
      <SparkleTrail />
      <PageRush />
      <ArrivalBursts ref={burstsRef} />
      <ArrivalFX ref={arrivalFxRef} />
      <LibraryLight prefersReducedMotion={prefersReducedMotion} />

      {/* Cheap ambient dust drifting through the whole climb volume */}
      <Sparkles
        count={110}
        scale={[85, 70, 85]}
        position={[SPIRAL_CENTER.x, 26, SPIRAL_CENTER.z]}
        size={1.6}
        speed={prefersReducedMotion ? 0 : 0.25}
        color={PRIMARY_INDIGO}
        opacity={0.45}
      />

      {/* Real bloom + CA + vignette — the glow finally bleeds. */}
      <PostFX prefersReducedMotion={prefersReducedMotion} />
    </>
  );
}
