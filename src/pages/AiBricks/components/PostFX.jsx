import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { cityState } from '../timeOfDay';
import { useQualityTier } from '../../../hooks/useAdaptiveQuality';

/**
 * Real post-processing - the night city's main weapon.
 *
 * - Bloom (mipmap blur, luminanceThreshold 1): the scene already renders
 *   HDR instance colors through toneMapped:false materials (windows, data
 *   streams, pulses, AI core, beacon, pillars, headlights, road lines), so
 *   only values pushed past 1.0 bloom. Intensity ramps with nightfall.
 * - Vignette: subtle by day, heavier at night for the cinematic frame.
 * - Noise: whisper-quiet film grain, night only, free on the same pass.
 *
 * multisampling={0} - MSAA is wasted on a composer target; the Canvas also
 * runs with antialias:false for the same reason. All per-frame retuning
 * goes through effect uniforms (zero allocations, no setState).
 */
export function PostFX({ reducedMotion = false }) {
  const bloomRef = useRef();
  const vignetteRef = useRef();
  const noiseRef = useRef();
  // Adaptive quality: shrink the bloom mip chain on low tiers (8 is the
  // library default when levels is unset). Tier changes are rare (seconds
  // apart), so the one-off effect rebuild is a non-issue.
  const tier = useQualityTier();
  const lowFx = tier <= 1;

  useFrame(() => {
    const night = cityState.starAlpha;
    const bloom = bloomRef.current;
    if (bloom) {
      bloom.intensity = 0.45 + cityState.streamGlow * 0.75 + night * 0.5;
    }
    const vignette = vignetteRef.current;
    if (vignette) {
      vignette.uniforms.get('darkness').value = 0.42 + night * 0.28;
    }
    const noise = noiseRef.current;
    if (noise) {
      noise.blendMode.opacity.value = reducedMotion ? 0 : night * 0.08;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        intensity={0.8}
        radius={0.85}
        luminanceThreshold={1}
        luminanceSmoothing={0.25}
        levels={lowFx ? 5 : 8}
      />
      <Noise ref={noiseRef} premultiply blendFunction={BlendFunction.SCREEN} opacity={0} />
      <Vignette ref={vignetteRef} eskil={false} offset={0.24} darkness={0.42} />
    </EffectComposer>
  );
}
