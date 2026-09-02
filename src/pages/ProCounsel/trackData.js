// Shared path / checkpoint data for "Ascent to Graduation".
// Everything here is built once at module load and shared by every component,
// so there is no prop drilling and no duplicate curve sampling.
import * as THREE from 'three';
import { CHECKPOINT_COLORS } from './colors';

// The 9 admission stages (same content as the metro scene's STAGES).
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

// --- The ascent: a gently tightening spiral of giant books ------------------
// Rises from darkness (t = 0, near the camera) about two turns up to a
// golden summit at t = 1. Built from helix samples through a centripetal
// Catmull-Rom so every consumer (path, camera, FX) shares one smooth curve.
export const SPIRAL_CENTER = new THREE.Vector3(0, 0, -16);
export const SUMMIT_HEIGHT = 54;
const TURNS = 2.05;
const START_ANGLE = Math.PI / 2;

export const PATH_CURVE = (() => {
  const pts = [];
  const N = 20;
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const angle = START_ANGLE + f * TURNS * Math.PI * 2;
    const radius = 34 - f * 16; // spiral tightens toward the summit
    const y = Math.pow(f, 1.06) * SUMMIT_HEIGHT;
    pts.push(
      new THREE.Vector3(
        SPIRAL_CENTER.x + Math.cos(angle) * radius,
        y,
        SPIRAL_CENTER.z + Math.sin(angle) * radius
      )
    );
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
})();

// The summit point — the convocation stage and the library light live here.
export const SUMMIT = PATH_CURVE.getPointAt(1).clone();

// How far above the curve centreline the student's feet sit (the book steps
// are laid with their tops just under the curve).
export const WALK_LIFT = 0.1;
// Cloud sea level, far below the first book.
export const CLOUD_Y = -10;

export const NUM_CHECKPOINTS = 9;
export const CHECKPOINT_START_T = 0.15;
export const CHECKPOINT_END_T = 0.95;
export const CHECKPOINT_STEP =
  (CHECKPOINT_END_T - CHECKPOINT_START_T) / (NUM_CHECKPOINTS - 1);

// Precomputed checkpoint frames: position on the curve, tangent, the side
// vector pointing OUTWARD from the spiral (vignettes ring the outside of the
// climb like exhibits), and yaw. The camera swings to the inside at each
// checkpoint so the holographic sign + vignette face the lens.
export const CHECKPOINTS = (() => {
  const list = [];
  const outward = new THREE.Vector3();
  for (let i = 0; i < NUM_CHECKPOINTS; i++) {
    const t = CHECKPOINT_START_T + i * CHECKPOINT_STEP;
    const position = PATH_CURVE.getPointAt(t);
    const tangent = PATH_CURVE.getTangentAt(t);
    outward
      .set(position.x - SPIRAL_CENTER.x, 0, position.z - SPIRAL_CENTER.z)
      .normalize();
    const raw = new THREE.Vector3()
      .crossVectors(UP, tangent)
      .setY(0)
      .normalize();
    // platformSign flips `raw` so `side` always points outward.
    const platformSign = raw.dot(outward) >= 0 ? 1 : -1;
    const side = raw.multiplyScalar(platformSign).clone();
    const yaw = Math.atan2(tangent.x, tangent.z);
    list.push({
      index: i,
      t,
      position,
      tangent,
      side,
      platformSign,
      yaw,
      color: new THREE.Color(CHECKPOINT_COLORS[i]),
      data: STAGES[i],
      isFinal: i === NUM_CHECKPOINTS - 1,
    });
  }
  return list;
})();

// --- Scroll -> curve-t warp -------------------------------------------------
// Piecewise easing with fixed points at every checkpoint t, so the student is
// at checkpoint i exactly when raw scroll equals that checkpoint's t (this
// keeps the DOM OverlayText card timing aligned with arrivals). Between fixed
// points the motion accelerates mid-segment and glides in/out near
// checkpoints.
const WARP_KNOTS = [0, ...CHECKPOINTS.map((c) => c.t), 1];
const EASE_MIX = 0.85; // 1 = full stop at checkpoints, 0 = linear

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

// Nearest checkpoint index for a given curve t (evenly spaced).
export function nearestCheckpointIndex(t) {
  const i = Math.round((t - CHECKPOINT_START_T) / CHECKPOINT_STEP);
  return THREE.MathUtils.clamp(i, 0, NUM_CHECKPOINTS - 1);
}

// --- Shared per-frame climb motion state ------------------------------------
// Written by the scene driver (useFrame priority -2, so it runs before every
// other subscriber), read by the student, page rush, sparkle wake, camera rig
// and post-fx. A plain mutable object: no React state, no allocation.
export const climbMotion = {
  t: 0,
  prevT: 0,
  speed: 0, // |dt/dt| estimate in curve-t units per second
  // 0..1 rush factor: rises when the student is flying mid-segment, eases
  // out as the warp curve brakes into a checkpoint. Drives the flying-page
  // rush, FOV kick, sparkle-wake surge and chromatic-aberration spike.
  rush: 0,
  // 1 on the frame the student crosses a checkpoint, decaying to 0 over
  // ~1.1s. Drives the arrival "slow-mo" camera punch and CA blip.
  arrivalPulse: 0,
  // Index of the most recently crossed checkpoint (-1 before the first).
  arrivalIndex: -1,
};

export function resetClimbMotion() {
  climbMotion.t = 0;
  climbMotion.prevT = 0;
  climbMotion.speed = 0;
  climbMotion.rush = 0;
  climbMotion.arrivalPulse = 0;
  climbMotion.arrivalIndex = -1;
}
