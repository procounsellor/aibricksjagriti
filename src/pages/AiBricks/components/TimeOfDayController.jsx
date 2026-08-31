import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { cityState, sampleTimeOfDay } from '../timeOfDay';
import colors from '../colors';
import { useQualityTier } from '../../../hooks/useAdaptiveQuality';

/**
 * Samples the scroll offset into the shared time-of-day state (priority -10,
 * so it always runs before every consumer's default-priority useFrame), then
 * applies the result to the things it owns directly:
 * - scene background + fog colors
 * - the single shadow-casting directional light (sun by day, moon by night)
 * - ambient + hemisphere fill
 * It also decays the per-building match-glow flares set by arriving pulses,
 * and drives the AI core's periodic 360-degree holographic scan wave
 * (cityState.scanRadius / scanStrength) that sweeps across the whole city.
 */

// Scan wave timing: expands for SCAN_TRAVEL seconds, then rests until PERIOD
const SCAN_PERIOD = 9;
const SCAN_TRAVEL = 4.5;
const SCAN_MAX_RADIUS = 52;

export function TimeOfDayController({ reducedMotion = false }) {
  const scroll = useScroll();
  // The shadow map re-renders every frame (animated sun, moving cars/birds),
  // so halve it on low quality tiers. The `key` remount is required: three
  // only sizes a shadow map when it is first created. Tier flips are rare.
  const tier = useQualityTier();
  const shadowMapSize = tier <= 1 ? 1024 : 2048;
  const scene = useThree((s) => s.scene);
  const sunRef = useRef();
  const ambientRef = useRef();
  const hemiRef = useRef();
  const scanTimer = useRef(SCAN_PERIOD - 1.5); // first scan fires soon after load

  useFrame((state, delta) => {
    sampleTimeOfDay(scroll.offset);

    // Decay match flares (~1.5s from full flare back to zero)
    const glow = cityState.matchGlow;
    for (let i = 0; i < glow.length; i++) {
      if (glow[i] > 0) glow[i] = Math.max(0, glow[i] - Math.min(delta, 0.05) / 1.5);
    }

    // --- holographic scan wave -------------------------------------------
    if (reducedMotion) {
      cityState.scanRadius = 0;
      cityState.scanStrength = 0;
    } else {
      scanTimer.current += Math.min(delta, 0.05);
      if (scanTimer.current >= SCAN_PERIOD) scanTimer.current = 0;
      const t = scanTimer.current / SCAN_TRAVEL;
      if (t < 1) {
        // Ease the wavefront out, fading as it reaches the city edge
        cityState.scanRadius = 1.5 + t * (SCAN_MAX_RADIUS - 1.5);
        cityState.scanStrength = (1 - t * t) * (1 - Math.exp(-t * 14));
      } else {
        cityState.scanRadius = 0;
        cityState.scanStrength = 0;
      }
    }

    if (scene.background && scene.background.isColor) {
      scene.background.copy(cityState.sky);
    }
    if (scene.fog) {
      scene.fog.color.copy(cityState.fog);
      scene.fog.near = cityState.fogNear;
      scene.fog.far = cityState.fogFar;
    }

    const sun = sunRef.current;
    if (sun) {
      sun.position.copy(cityState.lightPos);
      sun.color.copy(cityState.lightColor);
      sun.intensity = cityState.lightIntensity;
    }
    const ambient = ambientRef.current;
    if (ambient) {
      ambient.color.copy(cityState.ambientColor);
      ambient.intensity = cityState.ambientIntensity;
    }
    const hemi = hemiRef.current;
    if (hemi) {
      hemi.color.copy(cityState.sky);
      hemi.intensity = cityState.hemiIntensity;
    }
  }, -10);

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} color={colors.ambientFill} />
      <directionalLight
        key={shadowMapSize}
        ref={sunRef}
        position={[53, 12, 20]}
        intensity={1.7}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={160}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0001}
        color={colors.sunLight}
      />
      <hemisphereLight ref={hemiRef} args={[colors.sky, colors.hemisphereGround, 0.55]} />
    </>
  );
}
