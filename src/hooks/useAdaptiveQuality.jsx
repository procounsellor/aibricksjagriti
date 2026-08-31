import React, { useCallback, useMemo, useSyncExternalStore } from "react";
import { PerformanceMonitor } from "@react-three/drei";

/**
 * Shared device-adaptive quality controller for all four 3D pages.
 *
 * Tiers run 3 (full quality) down to 0 (minimum). Sustained low FPS steps
 * the tier down; sustained high FPS steps it back up one notch. The tier
 * drives two things:
 *
 *   - the Canvas dpr cap (per-page step tables, e.g. 1.75 -> 1.4 -> 1.1 -> 1)
 *   - composer cost (PostFX components lower Bloom mip levels / drop
 *     ChromaticAberration at tier <= 1 via useQualityTier)
 *
 * The current tier lives in a module singleton (`qualityState`) so useFrame
 * callbacks can read it with zero React involvement; React consumers use
 * useSyncExternalStore, and changes are rare (many seconds apart), so the
 * occasional re-render is fine.
 *
 * The tier persists across page navigations: a device that proved slow on
 * one scene starts the next scene at the tier it earned. An "oscillation
 * lock" caps the ceiling one notch below any tier that promptly tanked FPS
 * after an incline, so the quality never ping-pongs.
 */

export const NUM_TIERS = 4;

/** dpr caps per tier, lowest -> highest. Pages with a different historical
 *  max pass their own table so top-tier visuals stay exactly as before. */
export const DEFAULT_DPR_STEPS = [1, 1.1, 1.4, 1.75];

// --- module singleton -------------------------------------------------------

/** Read `qualityState.tier` freely inside useFrame — never setState there. */
export const qualityState = { tier: NUM_TIERS - 1 };

let tierCeiling = NUM_TIERS - 1; // oscillation lock
let lastInclineAt = -Infinity;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function declineTier() {
  const now = performance.now();
  // If the last step UP was recent, that step is what tanked the FPS —
  // lock the ceiling below it so we never climb back into the oscillation.
  if (now - lastInclineAt < 15000) {
    tierCeiling = Math.max(0, qualityState.tier - 1);
  }
  const next = Math.max(0, qualityState.tier - 1);
  if (next !== qualityState.tier) {
    qualityState.tier = next;
    emit();
  }
}

function inclineTier() {
  const next = Math.min(tierCeiling, qualityState.tier + 1);
  if (next > qualityState.tier) {
    lastInclineAt = performance.now();
    qualityState.tier = next;
    emit();
  }
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getTier = () => qualityState.tier;

// --- React consumers --------------------------------------------------------

/**
 * Re-render-on-tier-change read of the quality tier. For infrequent React
 * config (composer props). For per-frame reads use `qualityState.tier`.
 */
export function useQualityTier() {
  return useSyncExternalStore(subscribe, getTier);
}

/**
 * Page-level hook. Returns:
 *   - dpr: memoized `[1, cap]` range for the Canvas dpr prop (identity only
 *     changes when the tier flips, so R3F never resizes needlessly)
 *   - tier / onIncline / onDecline for the AdaptiveQualityMonitor
 */
export function useAdaptiveQuality(dprSteps = DEFAULT_DPR_STEPS) {
  const tier = useQualityTier();
  const onDecline = useCallback(() => declineTier(), []);
  const onIncline = useCallback(() => inclineTier(), []);
  const maxDpr = dprSteps[Math.min(tier, dprSteps.length - 1)];
  const dpr = useMemo(() => [1, maxDpr], [maxDpr]);
  return { tier, dpr, onIncline, onDecline };
}

// ~2.5s sampling rounds (drei defaults: 10 iterations x >=250ms), verdicts
// need 75% of windows past a bound. Wide hysteresis band = no ping-pong:
// decline only under ~37fps sustained, incline only above ~55fps sustained
// (45/90 on high-refresh displays).
const BOUNDS = (refreshrate) => (refreshrate > 100 ? [45, 90] : [37, 55]);

/**
 * Mount INSIDE the Canvas. Thin wrapper over drei's PerformanceMonitor with
 * tuned bounds. flipflops stays Infinity: drei counts every verdict (not
 * just direction changes) toward the fallback, and our ceiling lock already
 * prevents real oscillation.
 */
export function AdaptiveQualityMonitor({ onIncline, onDecline }) {
  return (
    <PerformanceMonitor
      ms={250}
      iterations={10}
      bounds={BOUNDS}
      onIncline={onIncline}
      onDecline={onDecline}
    />
  );
}
