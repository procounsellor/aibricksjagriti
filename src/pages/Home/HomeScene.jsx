import React, { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  PostFX,
  CameraRig,
  SpaceEnvironment,
  GridFloor,
  DevvoCore,
  EnergyStreams,
  AiBricksLandmark,
  ProCounselLandmark,
  MindSoulLandmark,
} from './components';
import { hubState, resetHubState } from './hubState';
import { BACKGROUND_BLACK } from './colors';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLContextLoss } from '../../hooks/useWebGLContextLoss';

/**
 * Home 3D Scene — the Devvo Digital Universe.
 *
 * A dark cosmic-tech hub world: the luminous Devvo core (crystalline HDR
 * heart, counter-rotating gyroscope rings, orbiting glyphs, sky beacon)
 * powers three product landmarks arranged around it — the AiBricks tower
 * cluster (cyan, windows rippling with data), the ProCounsel metro gate
 * (indigo/violet, a tiny light-rail loop forever circling it) and the
 * TheMindSoul wellness orb (teal, breathing slowly). Instanced energy
 * streams flow core <-> landmark; every few seconds the core winds up and
 * fires a white-hot charge pulse down one stream, and the landmark ANSWERS:
 * window ripple / rail pulse lapping the arch / one deep breath — plus a
 * ground shockwave, a sky pillar and a dissolving return beam. Star dome,
 * shooting stars, aurora bands and cosmic dust wrap the tableau; a real
 * HDR Bloom composer (threshold 1, ACES applied AFTER bloom) makes it all
 * genuinely bleed light.
 *
 * Event flow: the driver below (priority -2) decays hubState.flare /
 * coreBoost; the EnergyStreams conductor (priority -1) schedules charges,
 * flies pulses and sets flare[target]=1 on arrival; every consumer (core,
 * landmarks, PostFX) reads hubState at default priority. No React state is
 * ever touched per frame.
 *
 * The core sits low / off screen-center and the camera looks just above it,
 * so the DOM hero text stays readable over a calm center of frame.
 * ~60 draw calls before the composer. Lights: ambient + hemisphere +
 * directional + 1 core point light.
 */
export default function HomeScene() {
  const reducedMotion = useReducedMotion();

  // Minimal WebGL context-loss handling for this canvas
  useWebGLContextLoss();

  // hubState is a module singleton — reset it when the scene (re)mounts.
  useEffect(() => {
    resetHubState();
  }, []);

  // --- Driver (priority -2): decay the shared event state ------------------
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (reducedMotion) {
      hubState.flare[0] = 0;
      hubState.flare[1] = 0;
      hubState.flare[2] = 0;
      hubState.coreCharge = 0;
      hubState.coreBoost = 0;
      return;
    }
    hubState.flare[0] = Math.max(0, hubState.flare[0] - dt / 1.9);
    hubState.flare[1] = Math.max(0, hubState.flare[1] - dt / 1.9);
    hubState.flare[2] = Math.max(0, hubState.flare[2] - dt / 1.9);
    hubState.coreBoost = Math.max(0, hubState.coreBoost - dt / 0.8);
  }, -2);

  return (
    <>
      <fog attach="fog" args={[BACKGROUND_BLACK, 30, 95]} />

      {/* Deep-space lighting (replaces the old CDN Environment preset) */}
      <ambientLight intensity={0.35} color="#3a3f66" />
      <hemisphereLight args={['#25255a', '#050510', 0.5]} />
      <directionalLight position={[14, 22, 8]} intensity={0.4} color="#8fa8ff" />

      {/* Intro sweep -> orbital drift + parallax + breathing FOV */}
      <CameraRig reducedMotion={reducedMotion} />

      {/* Star dome, shooting stars, auroras, cosmic dust */}
      <SpaceEnvironment reducedMotion={reducedMotion} />

      {/* Reflective dark grid floor */}
      <GridFloor />

      {/* The Devvo core — the reactor powering everything */}
      <DevvoCore reducedMotion={reducedMotion} />

      {/* The three product landmarks */}
      <AiBricksLandmark reducedMotion={reducedMotion} />
      <ProCounselLandmark reducedMotion={reducedMotion} />
      <MindSoulLandmark reducedMotion={reducedMotion} />

      {/* Energy streams + the charge-pulse conductor + pooled answer FX */}
      <EnergyStreams reducedMotion={reducedMotion} />

      {/* Real bloom: threshold 1, ACES AFTER bloom, soft vignette */}
      <PostFX />
    </>
  );
}
