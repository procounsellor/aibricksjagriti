// Shared track / station data for the Neon Metro Timeline.
// Everything here is built once at module load and shared by every component,
// so there is no prop drilling and no duplicate curve sampling.
import * as THREE from 'three';
import { STATION_COLORS } from './colors';

// The 9 admission stages (kept from the original scene's PILLAR_DATA).
export const STAGES = [
  { timePeriod: 'Dec–Jan', keyEvent: 'Exam Preps & Pre-Boards' },
  { timePeriod: 'Feb–Mar', keyEvent: 'Board Exams' },
  { timePeriod: 'Mar–Apr', keyEvent: 'Entrance Exams (JEE, NEET, CET, etc.)' },
  { timePeriod: 'May–Jun', keyEvent: 'Registration' },
  { timePeriod: 'Jun–Jul', keyEvent: 'Document Verification' },
  { timePeriod: 'Jul–Aug', keyEvent: 'Seat Allotments / CAP Rounds' },
  { timePeriod: 'Aug–Sep', keyEvent: 'Non-CAP / SPOT / IL Rounds' },
  { timePeriod: 'Sep–Oct', keyEvent: 'Start of Academic Year' },
  {
    timePeriod: 'Oct–Forever',
    keyEvent:
      'Beyond Admission: Hostel, Loans, Internships, Placements & Further Studies',
  },
];

const UP = new THREE.Vector3(0, 1, 0);

// Long sweeping S-curve heading into the city, with gentle elevation changes.
export const TRACK_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 0.6, 46),
    new THREE.Vector3(5, 0.9, 28),
    new THREE.Vector3(-5, 1.5, 8),
    new THREE.Vector3(-9, 2.3, -14),
    new THREE.Vector3(-2, 1.3, -38),
    new THREE.Vector3(8, 2.7, -60),
    new THREE.Vector3(6, 1.9, -86),
    new THREE.Vector3(-6, 3.3, -110),
    new THREE.Vector3(-2, 2.5, -134),
    new THREE.Vector3(4, 3.1, -156),
  ],
  false,
  'catmullrom',
  0.5
);

// How far above the curve centreline the tram floor sits.
export const RAIL_LIFT = 0.55;
// City ground level (track is elevated on pylons above this).
export const GROUND_Y = -2;

export const NUM_STATIONS = 9;
export const STATION_START_T = 0.15;
export const STATION_END_T = 0.95;
export const STATION_STEP =
  (STATION_END_T - STATION_START_T) / (NUM_STATIONS - 1);

// Precomputed station frames: position on curve, tangent, platform side, yaw.
// Platforms alternate left / right of the track for variety; the camera swings
// to the opposite side at each station so the holographic sign faces it.
export const STATIONS = (() => {
  const list = [];
  for (let i = 0; i < NUM_STATIONS; i++) {
    const t = STATION_START_T + i * STATION_STEP;
    const position = TRACK_CURVE.getPointAt(t);
    const tangent = TRACK_CURVE.getTangentAt(t);
    const platformSign = i % 2 === 0 ? 1 : -1;
    // side points from the track centre toward the platform
    const side = new THREE.Vector3()
      .crossVectors(UP, tangent)
      .setY(0)
      .normalize()
      .multiplyScalar(platformSign);
    const yaw = Math.atan2(tangent.x, tangent.z);
    list.push({
      index: i,
      t,
      position,
      tangent,
      side,
      platformSign,
      yaw,
      color: new THREE.Color(STATION_COLORS[i]),
      data: STAGES[i],
      isFinal: i === NUM_STATIONS - 1,
    });
  }
  return list;
})();

// --- Scroll -> curve-t warp -------------------------------------------------
// Piecewise easing with fixed points at every station t, so the tram is at
// station i exactly when raw scroll equals that station's t (this keeps the
// DOM OverlayText card timing aligned with arrivals). Between fixed points the
// motion accelerates mid-segment and glides in/out near stations.
const WARP_KNOTS = [0, ...STATIONS.map((s) => s.t), 1];
const EASE_MIX = 0.85; // 1 = full stop at stations, 0 = linear

export function warpScroll(s) {
  const x = THREE.MathUtils.clamp(s, 0, 1);
  let i = 0;
  while (i < WARP_KNOTS.length - 2 && x > WARP_KNOTS[i + 1]) i++;
  const a = WARP_KNOTS[i];
  const b = WARP_KNOTS[i + 1];
  const u = b > a ? (x - a) / (b - a) : 0;
  const e = u * u * (3 - 2 * u); // smoothstep
  return a + (b - a) * (EASE_MIX * e + (1 - EASE_MIX) * u);
}

// Nearest station index for a given curve t (stations are evenly spaced).
export function nearestStationIndex(t) {
  const i = Math.round((t - STATION_START_T) / STATION_STEP);
  return THREE.MathUtils.clamp(i, 0, NUM_STATIONS - 1);
}

// --- Neon tunnel gate sequences ---------------------------------------------
// Three short runs of glowing gate rings placed mid-segment (clear of the
// platforms), which the tram threads through at hyperspeed. Colors echo the
// neighbouring stations' accents.
export const TUNNELS = [
  { center: 0.3, rings: 6, spacing: 0.008, color: '#38bdf8' },
  { center: 0.5, rings: 6, spacing: 0.008, color: '#a78bfa' },
  { center: 0.795, rings: 6, spacing: 0.008, color: '#f472b6' },
];

// --- Shared per-frame tram motion state ------------------------------------
// Written by the scene driver (runs first, mounted first), read by the tram,
// trail, camera rig, speed-line field and post-fx rig. A plain mutable
// object: no React state, no allocation.
export const tramMotion = {
  t: 0,
  prevT: 0,
  speed: 0, // |dt/dt| estimate in curve-t units per second
  // 0..1 hyperspeed factor: rises when the tram is flying mid-segment,
  // eases out as the warp curve brakes it into a station. Drives the warp
  // speed-lines, FOV kick, trail surge and chromatic-aberration spike.
  hyper: 0,
  // 1 on the frame the tram crosses a station, decaying to 0 over ~1.1s.
  // Drives the arrival "slow-mo" camera punch and CA blip.
  arrivalPulse: 0,
  // Index of the most recently crossed station (-1 before the first).
  arrivalIndex: -1,
};

export function resetTramMotion() {
  tramMotion.t = 0;
  tramMotion.prevT = 0;
  tramMotion.speed = 0;
  tramMotion.hyper = 0;
  tramMotion.arrivalPulse = 0;
  tramMotion.arrivalIndex = -1;
}
