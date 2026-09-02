import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { climbMotion } from '../trackData';
import { useQualityTier } from '../../../hooks/useAdaptiveQuality';

// Stable Vector2 handed to the ChromaticAberrationEffect constructor. It is
// mutated per frame through the effect ref (NOT through props — the wrapper
// memoizes constructor args on JSON.stringify(props), so a mutating prop
// would rebuild the effect every frame).
const CA_BASE = new THREE.Vector2(0.00028, 0.00016);

/**
 * Per-frame chromatic aberration driver: a whisper at cruise, a hard spike
 * during the page rush, and a short blip on checkpoint arrival. Mounted only
 * when motion is allowed; reduced-motion users get no CA at all.
 */
function DynamicChromaticAberration() {
  const effectRef = useRef();

  useFrame(() => {
    const effect = effectRef.current;
    if (!effect) return;
    const k =
      0.00028 + climbMotion.rush * 0.0038 + climbMotion.arrivalPulse * 0.0012;
    effect.offset.set(k, k * 0.55);
  });

  return (
    <ChromaticAberration
      ref={effectRef}
      offset={CA_BASE}
      radialModulation
      modulationOffset={0.35}
    />
  );
}

/**
 * The post-processing chain — the scene's main weapon.
 *
 * The composer renders the scene un-tonemapped into a half-float buffer, so
 * every toneMapped:false material whose color sits above 1.0 genuinely bleeds
 * light through the mipmap-blurred Bloom (threshold 1: LDR content like the
 * book covers and vignette props stays crisp). ACES filmic tone mapping is
 * reapplied as an
 * explicit effect AFTER bloom (the composer forces the renderer itself to
 * NoToneMapping), then a soft vignette seats the frame.
 *
 * multisampling is disabled and dpr is capped by the Canvas — bloom is the
 * one big cost and this keeps it to a single mipmap chain.
 */
export default function PostFX({ prefersReducedMotion }) {
  // Adaptive quality: at low tiers, shrink the bloom mip chain and drop the
  // chromatic aberration pass entirely. Tier changes are rare (seconds
  // apart), so the one-off effect rebuild is a non-issue.
  const tier = useQualityTier();
  const lowFx = tier <= 1;
  return (
    <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType}>
      <Bloom
        mipmapBlur
        intensity={1.25}
        luminanceThreshold={1}
        luminanceSmoothing={0.25}
        radius={0.82}
        levels={lowFx ? 5 : 7}
      />
      {prefersReducedMotion || lowFx ? null : <DynamicChromaticAberration />}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.22} darkness={0.82} />
    </EffectComposer>
  );
}
