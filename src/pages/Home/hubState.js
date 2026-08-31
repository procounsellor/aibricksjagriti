import {
  AIBRICKS_CYAN,
  PROCOUNSEL_INDIGO,
  MINDSOUL_TEAL,
} from './colors';

/**
 * Layout constants + the shared mutable state for the Devvo Digital Universe.
 *
 * hubState is a module singleton written by the EnergyStreams conductor
 * (useFrame priority -1) and decayed by the HomeScene driver (priority -2),
 * so every consumer running at the default priority always reads fresh
 * values with zero React state involved.
 */

export const CORE_ORB_Y = 2.35;

// The three product landmarks arranged around the core.
// anchorY = where the energy stream terminates on the landmark.
export const LANDMARKS = [
  { id: 'aibricks', pos: [-9.5, 0, 2.0], anchorY: 1.4, color: AIBRICKS_CYAN },
  { id: 'procounsel', pos: [9.5, 0, 2.0], anchorY: 1.2, color: PROCOUNSEL_INDIGO },
  { id: 'mindsoul', pos: [0, 0, -11.0], anchorY: 2.0, color: MINDSOUL_TEAL },
];

export const hubState = {
  // Per-landmark response strength 0..1. Set to 1 by EnergyStreams when a
  // charge pulse arrives; decayed toward 0 by the HomeScene driver. Each
  // landmark maps this to its own signature answer (window ripple / rail
  // pulse / deep breath).
  flare: [0, 0, 0],
  // Core wind-up glow while a pulse charges (written every frame by the
  // EnergyStreams conductor — it fully owns this value).
  coreCharge: 0,
  // Launch flash: set to 1 the instant a pulse fires, decayed by the driver.
  coreBoost: 0,
};

export function resetHubState() {
  hubState.flare[0] = 0;
  hubState.flare[1] = 0;
  hubState.flare[2] = 0;
  hubState.coreCharge = 0;
  hubState.coreBoost = 0;
}
