import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { hubState } from '../hubState';
import { useQualityTier } from '../../../hooks/useAdaptiveQuality';

/**
 * The post-processing chain — same weapon as the other scenes.
 *
 * The composer renders un-tonemapped into a half-float buffer, so every
 * toneMapped:false material pushed past 1.0 genuinely bleeds through the
 * mipmap-blurred Bloom (threshold 1 keeps LDR content crisp). ACES filmic
 * tone mapping is reapplied as an explicit effect AFTER bloom (the composer
 * forces the renderer to NoToneMapping), then a soft vignette seats the
 * frame. Bloom intensity is nudged per frame from hubState (launch flash /
 * landmark answers) through the effect ref — zero React state.
 *
 * multisampling 0 + Canvas antialias:false + dpr cap — bloom is the one big
 * cost and this keeps it to a single mipmap chain.
 */
export default function PostFX() {
  const bloomRef = useRef();
  // Adaptive quality: shrink the bloom mip chain on low tiers. Tier changes
  // are rare (seconds apart), so the one-off effect rebuild is a non-issue.
  const tier = useQualityTier();
  const lowFx = tier <= 1;

  useFrame(() => {
    const bloom = bloomRef.current;
    if (!bloom) return;
    const flare = Math.max(
      hubState.flare[0],
      hubState.flare[1],
      hubState.flare[2]
    );
    bloom.intensity = 1.05 + hubState.coreBoost * 0.35 + flare * 0.2;
  });

  return (
    <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType}>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        intensity={1.05}
        luminanceThreshold={1}
        luminanceSmoothing={0.22}
        radius={0.8}
        levels={lowFx ? 5 : 7}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
    </EffectComposer>
  );
}
