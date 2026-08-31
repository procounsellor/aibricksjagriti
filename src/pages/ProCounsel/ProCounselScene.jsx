import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  NeonTrack,
  Stations,
  Tram,
  TramTrail,
  CityBackdrop,
  GridGround,
  ArrivalBursts,
  ArrivalFX,
  LightBeams,
  NeonTunnels,
  HyperspeedStreaks,
  AuroraSky,
  PostFX,
} from './components';
import { useCinematicCamera } from './hooks/useAnimations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLContextLoss } from '../../hooks/useWebGLContextLoss';
import { PRIMARY_INDIGO } from './colors';
import {
  STATIONS,
  NUM_STATIONS,
  warpScroll,
  tramMotion,
  resetTramMotion,
} from './trackData';

/**
 * Neon Metro Timeline — hyperdrive edition.
 *
 * A glowing light-rail line sweeps through a dark neon city under an aurora
 * sky. The 9 admission stages are stations along the track (t = 0.15 -> 0.95,
 * evenly spaced — the same mapping the old scene used, so the DOM OverlayText
 * card timing still lines up with arrivals). A tram carrying the student
 * hyperspeeds between them as the user scrolls, threading neon tunnel gates,
 * and every station arrival detonates a shockwave + light pillar event. A
 * real HDR bloom composer (PostFX) makes all of the neon genuinely bleed.
 *
 * The driver useFrame below (priority -2, so it runs before every other
 * subscriber) converts raw scroll into a smoothed, station-eased curve-t and
 * writes it — plus derived hyperspeed / arrival-pulse factors — into the
 * shared tramMotion object. The tram, trail, speed-lines, tunnels, post
 * effects and cinematic camera all read from that — no React state is touched
 * during scroll.
 */
export default function ProCounselScene({ scrollRef }) {
  const prefersReducedMotion = useReducedMotion();
  const stationsRef = useRef();
  const burstsRef = useRef();
  const arrivalFxRef = useRef();

  // Minimal WebGL context-loss handling for this canvas
  useWebGLContextLoss();

  // tramMotion is a module singleton — reset it when the scene (re)mounts.
  useEffect(() => {
    resetTramMotion();
  }, []);

  // --- Driver: scroll -> tram t, hyperspeed factor, arrival events ----------
  useFrame((_, delta) => {
    const s = THREE.MathUtils.clamp(scrollRef?.current ?? 0, 0, 1);
    const prev = tramMotion.t;
    let t;
    if (prefersReducedMotion) {
      // Snap straight to the scroll position — no easing flourishes.
      t = s;
    } else {
      const target = warpScroll(s);
      const alpha = 1 - Math.pow(1 - 0.16, delta * 60);
      t = prev + (target - prev) * alpha;
    }
    tramMotion.prevT = prev;
    tramMotion.t = t;

    // Smoothed speed estimate (drives the trail, streaks, FOV, CA...).
    const instSpeed = delta > 0 ? Math.abs(t - prev) / delta : 0;
    tramMotion.speed += (instSpeed - tramMotion.speed) * Math.min(1, delta * 8);

    // Hyperspeed factor: kicks in fast when the tram flies mid-segment,
    // eases out more gently as the warp curve brakes it into a station.
    const targetHyper = prefersReducedMotion
      ? 0
      : THREE.MathUtils.smoothstep(tramMotion.speed, 0.1, 0.32);
    tramMotion.hyper +=
      (targetHyper - tramMotion.hyper) *
      Math.min(1, delta * (targetHyper > tramMotion.hyper ? 6 : 3));

    // Arrival pulse decay (set to 1 on station crossings below).
    tramMotion.arrivalPulse = Math.max(
      0,
      tramMotion.arrivalPulse - delta / 1.1
    );

    // Arrival detection: did we cross a station t this frame?
    if (!prefersReducedMotion && Math.abs(t - prev) > 1e-6) {
      for (let i = 0; i < NUM_STATIONS; i++) {
        const stT = STATIONS[i].t;
        if ((prev < stT && t >= stT) || (prev > stT && t <= stT)) {
          if (stationsRef.current) stationsRef.current.boost(i);
          if (burstsRef.current) burstsRef.current.trigger(STATIONS[i]);
          if (arrivalFxRef.current) arrivalFxRef.current.trigger(STATIONS[i]);
          tramMotion.arrivalPulse = 1;
          tramMotion.arrivalIndex = i;
        }
      }
    }
  }, -2);

  useCinematicCamera();

  return (
    <>
      {/* Night-city lighting: low ambient + cool moonlight wash. Neon parts
          use unlit (basic) materials so they stay punchy regardless. */}
      <ambientLight intensity={0.4} color="#5b5b8f" />
      <directionalLight position={[18, 30, 10]} intensity={0.7} color="#7dd3fc" />
      <hemisphereLight args={['#28285a', '#05050c', 0.6]} />

      <AuroraSky />
      <NeonTrack />
      <NeonTunnels />
      <Stations ref={stationsRef} />
      <Tram />
      <TramTrail />
      <HyperspeedStreaks />
      <CityBackdrop />
      <GridGround />
      <ArrivalBursts ref={burstsRef} />
      <ArrivalFX ref={arrivalFxRef} />
      <LightBeams prefersReducedMotion={prefersReducedMotion} />

      {/* Cheap ambient drift spanning the whole line */}
      <Sparkles
        count={110}
        scale={[46, 14, 210]}
        position={[0, 5, -55]}
        size={1.6}
        speed={prefersReducedMotion ? 0 : 0.25}
        color={PRIMARY_INDIGO}
        opacity={0.45}
      />

      {/* Real bloom + CA + vignette — the neon finally bleeds light. */}
      <PostFX prefersReducedMotion={prefersReducedMotion} />
    </>
  );
}
