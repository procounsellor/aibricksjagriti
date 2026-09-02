import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { CHECKPOINTS, NUM_CHECKPOINTS } from '../trackData';
import {
  STRUCTURE_DARK,
  WOOD_DARK,
  PARCHMENT,
  PAGE_GLOW,
  NEON_GOLD,
  CHECKPOINT_COLORS,
} from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const _dummy = new THREE.Object3D();

// --- Shared primitive geometries (module scope, created once) ---------------
const boxG = new THREE.BoxGeometry(1, 1, 1);
const cylG = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
const coneG = new THREE.ConeGeometry(0.5, 1, 10);
const sphereG = new THREE.SphereGeometry(0.5, 10, 10);
const planeG = new THREE.PlaneGeometry(1, 1);
const archG = new THREE.TorusGeometry(1, 0.09, 8, 28, Math.PI);
const platformG = new THREE.CylinderGeometry(1, 1.15, 1, 20);
const rimG = new THREE.TorusGeometry(1, 0.05, 6, 36);
const signG = new THREE.PlaneGeometry(3.4, 1.7);
const seatG = new THREE.BoxGeometry(0.34, 0.28, 0.34);
const seatBackG = new THREE.BoxGeometry(0.34, 0.34, 0.07);

// --- Shared materials -------------------------------------------------------
const darkMat = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  roughness: 0.85,
  metalness: 0.25,
});
const woodMat = new THREE.MeshStandardMaterial({
  color: WOOD_DARK,
  roughness: 0.8,
});
const parchmentMat = new THREE.MeshStandardMaterial({
  color: PARCHMENT,
  roughness: 0.9,
});
const pencilMat = new THREE.MeshStandardMaterial({
  color: '#d97706',
  roughness: 0.6,
});
const graphiteMat = new THREE.MeshBasicMaterial({ color: '#1f2430' });
// HDR page glow (open books, the registration form).
const pageGlowMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(PAGE_GLOW).multiplyScalar(1.6),
  toneMapped: false,
  side: THREE.DoubleSide,
});
const goldHotMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(NEON_GOLD).multiplyScalar(2.4),
  toneMapped: false,
});
const seatMat = new THREE.MeshStandardMaterial({
  color: '#2a2450',
  roughness: 0.7,
});
// White-hot base (> 1) tinted per instance — the platform glow rims are
// among the brightest bloom sources on the climb.
const rimMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ffffff').multiplyScalar(1.8),
  toneMapped: false,
});

// Per-checkpoint accents: a hot HDR emissive and a soft lit version.
const accentHotMats = CHECKPOINT_COLORS.map(
  (c) =>
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(c).multiplyScalar(2.1),
      toneMapped: false,
    })
);
const accentSoftMats = CHECKPOINT_COLORS.map(
  (c) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.5,
      metalness: 0.2,
    })
);

// --- Procedural CanvasTextures (no network fonts / assets) ------------------
function wrapKeyEvent(text, maxChars = 26, maxLines = 2) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  let truncated = false;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (test.length > maxChars && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines) {
        truncated = true;
        line = '';
        break;
      }
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (
    truncated ||
    (line && lines.length === maxLines && line !== lines[maxLines - 1])
  ) {
    let last = lines[lines.length - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function tracePanel(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const font = (size, weight = 'bold') =>
  `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;

function makeSignTexture(cp) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  const accent = `#${cp.color.getHexString()}`;

  g.clearRect(0, 0, 512, 256);
  g.fillStyle = 'rgba(8, 8, 24, 0.78)';
  tracePanel(g, 10, 10, 492, 236, 18);
  g.fill();

  g.save();
  g.strokeStyle = accent;
  g.lineWidth = 5;
  g.shadowColor = accent;
  g.shadowBlur = 22;
  tracePanel(g, 10, 10, 492, 236, 18);
  g.stroke();
  g.restore();

  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = font(22, '600');
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(
    cp.isFinal
      ? `★ SUMMIT ${cp.index + 1}/${NUM_CHECKPOINTS}`
      : `CHECKPOINT ${cp.index + 1}/${NUM_CHECKPOINTS}`,
    34,
    46
  );

  g.save();
  g.fillStyle = '#ffffff';
  g.shadowColor = accent;
  g.shadowBlur = 18;
  g.font = font(58);
  g.textAlign = 'center';
  g.fillText(cp.data.timePeriod, 256, 106);
  g.restore();

  const lines = wrapKeyEvent(cp.data.keyEvent);
  g.save();
  g.fillStyle = accent;
  g.shadowColor = accent;
  g.shadowBlur = 10;
  g.font = font(30, '600');
  g.textAlign = 'center';
  const startY = lines.length === 1 ? 178 : 162;
  for (let i = 0; i < lines.length; i++) {
    g.fillText(lines[i], 256, startY + i * 38);
  }
  g.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeEntranceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 512, 96);
  g.fillStyle = 'rgba(8,8,24,0.7)';
  tracePanel(g, 4, 4, 504, 88, 14);
  g.fill();
  g.save();
  g.strokeStyle = '#60a5fa';
  g.lineWidth = 4;
  g.shadowColor = '#60a5fa';
  g.shadowBlur = 16;
  tracePanel(g, 4, 4, 504, 88, 14);
  g.stroke();
  g.fillStyle = '#ffffff';
  g.shadowBlur = 14;
  g.font = font(52);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('E N T R A N C E', 256, 50);
  g.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFormTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 160;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fdf6e3';
  g.fillRect(0, 0, 128, 160);
  g.fillStyle = '#818cf8';
  g.fillRect(0, 0, 128, 22);
  g.strokeStyle = '#94a3b8';
  g.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const y = 40 + i * 24;
    g.strokeRect(10, y - 7, 14, 14);
    g.beginPath();
    g.moveTo(34, y);
    g.lineTo(118, y);
    g.stroke();
    if (i < 3) {
      g.save();
      g.strokeStyle = '#10b981';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(12, y);
      g.lineTo(16, y + 4);
      g.lineTo(23, y - 6);
      g.stroke();
      g.restore();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCheckTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.save();
  g.strokeStyle = '#a5f3d0';
  g.lineWidth = 14;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.shadowColor = '#34d399';
  g.shadowBlur = 22;
  g.beginPath();
  g.moveTo(28, 66);
  g.lineTo(54, 94);
  g.lineTo(102, 34);
  g.stroke();
  g.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeDocTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  g.fillStyle = '#f6f1df';
  g.fillRect(0, 0, 96, 128);
  g.strokeStyle = '#a8a29e';
  g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = 22 + i * 14;
    g.beginPath();
    g.moveTo(12, y);
    g.lineTo(i % 3 === 2 ? 60 : 84, y);
    g.stroke();
  }
  // Seal
  g.strokeStyle = '#a78bfa';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(70, 104, 14, 0, Math.PI * 2);
  g.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeClockTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = '#fdf1cf';
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#2b1d3a';
  g.lineWidth = 6;
  g.stroke();
  g.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.beginPath();
    g.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
    g.lineTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50);
    g.stroke();
  }
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(64, 64);
  g.lineTo(64, 30);
  g.moveTo(64, 64);
  g.lineTo(88, 74);
  g.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFacadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext('2d');
  g.fillStyle = '#1a1636';
  g.fillRect(0, 0, 64, 64);
  const lit = ['#ffe9b8', '#c4b5fd', '#8be9ff'];
  let n = 0;
  for (let y = 8; y < 56; y += 12) {
    for (let x = 6; x < 58; x += 10) {
      g.fillStyle = n % 3 === 0 ? '#241d44' : lit[n % lit.length];
      g.globalAlpha = n % 3 === 0 ? 1 : 0.85;
      g.fillRect(x, y, 5, 7);
      n++;
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- Floating prop bob definitions ------------------------------------------
// Index-keyed: JSX below registers refs at these slots; useFrame drives a
// gentle sine bob around baseY. Zero allocation per frame.
const FLOAT_DEFS = [
  { baseY: 1.75, amp: 0.12, speed: 1.1, phase: 0.0 }, // 0 open book A
  { baseY: 2.15, amp: 0.1, speed: 0.9, phase: 2.1 }, // 1 open book B
  { baseY: 2.7, amp: 0.16, speed: 1.2, phase: 0.7 }, // 2 checkmark
  { baseY: 1.6, amp: 0.12, speed: 1.0, phase: 1.3 }, // 3 document 0
  { baseY: 2.2, amp: 0.1, speed: 1.3, phase: 3.1 }, // 4 document 1
  { baseY: 1.9, amp: 0.13, speed: 0.8, phase: 4.4 }, // 5 document 2
];

const SEAT_ROWS = 3;
const SEAT_COLS = 8;
const SEAT_COUNT = SEAT_ROWS * SEAT_COLS;

// A giant pencil: painted body + parchment tip + graphite point.
function Pencil({ position, rotation, height = 3, radius = 0.36 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={cylG}
        material={pencilMat}
        position={[0, height / 2, 0]}
        scale={[radius * 2, height, radius * 2]}
      />
      <mesh
        geometry={coneG}
        material={parchmentMat}
        position={[0, height + 0.26, 0]}
        scale={[radius * 2, 0.55, radius * 2]}
      />
      <mesh
        geometry={coneG}
        material={graphiteMat}
        position={[0, height + 0.48, 0]}
        scale={[radius * 0.7, 0.22, radius * 0.7]}
      />
    </group>
  );
}

/**
 * The nine education checkpoints of the ascent — themed vignettes ringing
 * the outside of the book spiral at the existing station t's, each with a
 * floating holographic sign (procedural CanvasTexture). Platform discs and
 * glow rims are instanced across all nine (2 draw calls); vignette props are
 * simple stylized primitives sharing module-scope geometry and materials.
 *
 * Exposes `boost(i)` via ref — the scene driver calls it on arrival to
 * flare that checkpoint's sign (and, at the summit, to launch the
 * graduation-cap celebration).
 */
const Checkpoints = forwardRef(function Checkpoints(props, ref) {
  const prefersReducedMotion = useReducedMotion();
  const platformsRef = useRef();
  const rimsRef = useRef();
  const seatsRef = useRef();
  const seatBacksRef = useRef();
  const signRefs = useRef([]);
  const floatRefs = useRef([]);
  const capRef = useRef();
  const goldLightRef = useRef();
  const boostRef = useRef(new Float32Array(NUM_CHECKPOINTS));

  useImperativeHandle(
    ref,
    () => ({
      boost: (i) => {
        if (i >= 0 && i < NUM_CHECKPOINTS) boostRef.current[i] = 1;
      },
    }),
    []
  );

  // Unique sign materials (one CanvasTexture each) + the themed textures.
  const { signMaterials, texMats } = useMemo(() => {
    const signMats = CHECKPOINTS.map(
      (cp) =>
        new THREE.MeshBasicMaterial({
          map: makeSignTexture(cp),
          transparent: true,
          toneMapped: false,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
    );
    const mk = (tex, opts = {}) =>
      new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        ...opts,
      });
    const tm = {
      entrance: mk(makeEntranceTexture(), {
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
      form: mk(makeFormTexture()),
      check: mk(makeCheckTexture(), {
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
      doc: mk(makeDocTexture()),
      clock: mk(makeClockTexture(), { transparent: true }),
      facade: mk(makeFacadeTexture()),
    };
    return { signMaterials: signMats, texMats: tm };
  }, []);

  useEffect(
    () => () => {
      signMaterials.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
      Object.values(texMats).forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    },
    [signMaterials, texMats]
  );

  // Static frames: vignette centres (outward of the path), sign poses.
  const frames = useMemo(
    () =>
      CHECKPOINTS.map((cp) => {
        const center = cp.position.clone().addScaledVector(cp.side, 3.9);
        // Local +Z faces back toward the path (and the hero camera).
        const rotY = Math.atan2(-cp.side.x, -cp.side.z);
        return {
          center,
          rotY,
          groundY: cp.position.y - 0.25,
          signY: cp.position.y + 4.2,
        };
      }),
    []
  );

  // Place the instanced platforms + rims (and the seat rows) once.
  useLayoutEffect(() => {
    const platforms = platformsRef.current;
    const rims = rimsRef.current;
    if (platforms && rims) {
      for (let i = 0; i < NUM_CHECKPOINTS; i++) {
        const f = frames[i];
        _dummy.position.set(f.center.x, f.groundY - 0.25, f.center.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(4.3, 0.5, 4.3);
        _dummy.updateMatrix();
        platforms.setMatrixAt(i, _dummy.matrix);

        _dummy.position.set(f.center.x, f.groundY + 0.02, f.center.z);
        _dummy.rotation.set(-Math.PI / 2, 0, 0);
        _dummy.scale.set(4.3, 4.3, 1);
        _dummy.updateMatrix();
        rims.setMatrixAt(i, _dummy.matrix);
        rims.setColorAt(i, CHECKPOINTS[i].color);
      }
      platforms.instanceMatrix.needsUpdate = true;
      rims.instanceMatrix.needsUpdate = true;
      if (rims.instanceColor) rims.instanceColor.needsUpdate = true;
      platforms.computeBoundingSphere();
      rims.computeBoundingSphere();
    }

    // Seat rows for the Seat Allotment vignette (local coordinates — the
    // instanced meshes live inside that vignette's oriented group).
    const seats = seatsRef.current;
    const backs = seatBacksRef.current;
    if (seats && backs) {
      let i = 0;
      for (let r = 0; r < SEAT_ROWS; r++) {
        for (let c = 0; c < SEAT_COLS; c++) {
          const x = (c - (SEAT_COLS - 1) / 2) * 0.48;
          const z = 0.6 - r * 0.75;
          _dummy.position.set(x, 0.16, z);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.set(1, 1, 1);
          _dummy.updateMatrix();
          seats.setMatrixAt(i, _dummy.matrix);
          _dummy.position.set(x, 0.44, z - 0.15);
          _dummy.updateMatrix();
          backs.setMatrixAt(i, _dummy.matrix);
          i++;
        }
      }
      seats.instanceMatrix.needsUpdate = true;
      backs.instanceMatrix.needsUpdate = true;
      seats.computeBoundingSphere();
      backs.computeBoundingSphere();
    }
  }, [frames]);

  // Sign float / flicker, floating-prop bob, cap celebration. No setState.
  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const time = state.clock.elapsedTime;
    const boosts = boostRef.current;

    for (let i = 0; i < NUM_CHECKPOINTS; i++) {
      const mesh = signRefs.current[i];
      if (!mesh) continue;
      let b = boosts[i];
      if (b > 0) {
        b = Math.max(0, b - delta * 1.1);
        boosts[i] = b;
      }
      if (prefersReducedMotion) {
        mesh.position.y = frames[i].signY;
        mesh.scale.set(1, 1, 1);
        mesh.material.opacity = 0.95;
        mesh.material.color.setScalar(1.3);
        continue;
      }
      mesh.position.y = frames[i].signY + Math.sin(time * 1.2 + i * 1.7) * 0.07;
      const flick =
        0.9 + 0.1 * Math.sin(time * 19 + i * 7) * Math.sin(time * 7.3 + i * 3);
      mesh.material.opacity = Math.min(1, 0.92 * flick + b * 0.7);
      // HDR flare: on arrival the sign whites blast past the bloom threshold.
      mesh.material.color.setScalar(1.35 + b * 1.9);
      const s = 1 + b * 0.22;
      mesh.scale.set(s, s, 1);
    }

    if (!prefersReducedMotion) {
      for (let k = 0; k < FLOAT_DEFS.length; k++) {
        const obj = floatRefs.current[k];
        if (!obj) continue;
        const def = FLOAT_DEFS[k];
        obj.position.y =
          def.baseY + Math.sin(time * def.speed + def.phase) * def.amp;
        obj.rotation.z = Math.sin(time * def.speed * 0.7 + def.phase) * 0.08;
      }
    }

    // Summit celebration: the graduation cap hovers and slowly turns; on the
    // final arrival it lifts, spins fast and swells for a beat.
    const cap = capRef.current;
    const finalB = boosts[NUM_CHECKPOINTS - 1];
    if (cap) {
      if (prefersReducedMotion) {
        cap.position.y = 3.1;
      } else {
        cap.position.y =
          3.1 + Math.sin(time * 0.9) * 0.16 + finalB * finalB * 1.8;
        cap.rotation.y += delta * (0.45 + finalB * 6);
        const cs = 1 + finalB * 0.3;
        cap.scale.set(cs, cs, cs);
      }
    }
    const goldLight = goldLightRef.current;
    if (goldLight) goldLight.intensity = 13 + finalB * 46;
  });

  const setFloatRef = (k) => (el) => {
    floatRefs.current[k] = el;
  };

  const f = frames;

  return (
    <group>
      {/* Instanced platform discs + glow rims for all nine checkpoints */}
      <instancedMesh
        ref={platformsRef}
        args={[platformG, darkMat, NUM_CHECKPOINTS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={rimsRef}
        args={[rimG, rimMat, NUM_CHECKPOINTS]}
        frustumCulled={false}
      />

      {/* Holographic signs */}
      {f.map((frame, i) => (
        <mesh
          key={`sign-${i}`}
          ref={(el) => {
            signRefs.current[i] = el;
          }}
          geometry={signG}
          material={signMaterials[i]}
          position={[frame.center.x, frame.signY, frame.center.z]}
          rotation={[0, frame.rotY, 0]}
        />
      ))}

      {/* --- 1. Exam Preps: study desk, lamp, floating open books --------- */}
      <group
        position={[f[0].center.x, f[0].groundY, f[0].center.z]}
        rotation={[0, f[0].rotY, 0]}
      >
        <mesh geometry={boxG} material={woodMat} position={[0, 0.86, 0]} scale={[1.9, 0.12, 0.95]} />
        <mesh geometry={boxG} material={woodMat} position={[-0.8, 0.42, 0]} scale={[0.12, 0.8, 0.8]} />
        <mesh geometry={boxG} material={woodMat} position={[0.8, 0.42, 0]} scale={[0.12, 0.8, 0.8]} />
        <mesh geometry={cylG} material={darkMat} position={[-0.6, 1.14, -0.2]} scale={[0.07, 0.45, 0.07]} />
        <mesh geometry={coneG} material={accentSoftMats[0]} position={[-0.6, 1.4, -0.05]} rotation={[0.5, 0, 0]} scale={[0.4, 0.3, 0.4]} />
        <mesh geometry={sphereG} material={accentHotMats[0]} position={[-0.6, 1.32, 0.02]} scale={[0.14, 0.14, 0.14]} />
        <group ref={setFloatRef(0)} position={[0.95, FLOAT_DEFS[0].baseY, 0.35]} rotation={[0.3, 0.5, 0]}>
          <mesh geometry={planeG} material={pageGlowMat} position={[-0.26, 0, 0]} rotation={[-0.9, 0.4, 0]} scale={[0.55, 0.4, 1]} />
          <mesh geometry={planeG} material={pageGlowMat} position={[0.26, 0, 0]} rotation={[-0.9, -0.4, 0]} scale={[0.55, 0.4, 1]} />
        </group>
        <group ref={setFloatRef(1)} position={[-1.2, FLOAT_DEFS[1].baseY, -0.25]} rotation={[0.2, -0.6, 0]}>
          <mesh geometry={planeG} material={pageGlowMat} position={[-0.22, 0, 0]} rotation={[-0.9, 0.4, 0]} scale={[0.48, 0.36, 1]} />
          <mesh geometry={planeG} material={pageGlowMat} position={[0.22, 0, 0]} rotation={[-0.9, -0.4, 0]} scale={[0.48, 0.36, 1]} />
        </group>
      </group>

      {/* --- 2. Board Exams: exam-hall gate with giant pencil pillars ----- */}
      <group
        position={[f[1].center.x, f[1].groundY, f[1].center.z]}
        rotation={[0, f[1].rotY, 0]}
      >
        <Pencil position={[-1.35, 0, 0]} height={2.9} />
        <Pencil position={[1.35, 0, 0]} height={2.9} />
        <mesh geometry={boxG} material={darkMat} position={[0, 3.62, 0]} scale={[3.5, 0.28, 0.5]} />
        <mesh geometry={boxG} material={accentHotMats[1]} position={[0, 3.62, 0.27]} scale={[3.2, 0.09, 0.04]} />
      </group>

      {/* --- 3. Entrance Exams: twin gates + crossed-pencil arch ----------- */}
      <group
        position={[f[2].center.x, f[2].groundY, f[2].center.z]}
        rotation={[0, f[2].rotY, 0]}
      >
        <mesh geometry={boxG} material={darkMat} position={[-1.55, 1.25, 0]} scale={[0.4, 2.5, 0.4]} />
        <mesh geometry={boxG} material={darkMat} position={[1.55, 1.25, 0]} scale={[0.4, 2.5, 0.4]} />
        <Pencil position={[-1.0, 0.3, -0.1]} rotation={[0, 0, -0.55]} height={3.4} radius={0.24} />
        <Pencil position={[1.0, 0.3, -0.1]} rotation={[0, 0, 0.55]} height={3.4} radius={0.24} />
        <mesh geometry={planeG} material={texMats.entrance} position={[0, 2.75, 0.12]} scale={[2.7, 0.52, 1]} />
      </group>

      {/* --- 4. Registration: form podium + floating checkmark ------------ */}
      <group
        position={[f[3].center.x, f[3].groundY, f[3].center.z]}
        rotation={[0, f[3].rotY, 0]}
      >
        <mesh geometry={boxG} material={darkMat} position={[0, 0.55, 0]} scale={[1.15, 1.1, 0.85]} />
        <mesh geometry={boxG} material={woodMat} position={[0, 1.16, 0.05]} rotation={[-0.3, 0, 0]} scale={[1.25, 0.09, 0.95]} />
        <mesh geometry={planeG} material={texMats.form} position={[0, 1.28, 0.13]} rotation={[-1.25, 0, 0]} scale={[0.78, 0.95, 1]} />
        <mesh ref={setFloatRef(2)} geometry={planeG} material={texMats.check} position={[0, FLOAT_DEFS[2].baseY, 0.2]} scale={[0.95, 0.95, 1]} />
      </group>

      {/* --- 5. Doc Verification: floating documents + stamp seal ---------- */}
      <group
        position={[f[4].center.x, f[4].groundY, f[4].center.z]}
        rotation={[0, f[4].rotY, 0]}
      >
        <mesh ref={setFloatRef(3)} geometry={planeG} material={texMats.doc} position={[-1.0, FLOAT_DEFS[3].baseY, 0.15]} rotation={[0, 0.4, 0]} scale={[0.72, 0.96, 1]} />
        <mesh ref={setFloatRef(4)} geometry={planeG} material={texMats.doc} position={[0.15, FLOAT_DEFS[4].baseY, -0.1]} rotation={[0, -0.15, 0]} scale={[0.72, 0.96, 1]} />
        <mesh ref={setFloatRef(5)} geometry={planeG} material={texMats.doc} position={[1.15, FLOAT_DEFS[5].baseY, 0.25]} rotation={[0, -0.5, 0]} scale={[0.72, 0.96, 1]} />
        <mesh geometry={cylG} material={woodMat} position={[0, 0.62, 0.75]} scale={[0.22, 0.5, 0.22]} />
        <mesh geometry={cylG} material={darkMat} position={[0, 0.32, 0.75]} scale={[0.52, 0.24, 0.52]} />
        <mesh geometry={rimG} material={accentHotMats[4]} position={[0, 0.2, 0.75]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.42, 0.42, 1]} />
      </group>

      {/* --- 6. Seat Allotment: rows of seats, one lit gold --------------- */}
      <group
        position={[f[5].center.x, f[5].groundY, f[5].center.z]}
        rotation={[0, f[5].rotY, 0]}
      >
        <instancedMesh ref={seatsRef} args={[seatG, seatMat, SEAT_COUNT]} frustumCulled={false} />
        <instancedMesh ref={seatBacksRef} args={[seatBackG, seatMat, SEAT_COUNT]} frustumCulled={false} />
        <mesh geometry={seatG} material={goldHotMat} position={[0, 0.18, 1.35]} scale={[1.2, 1.2, 1.2]} />
        <mesh geometry={seatBackG} material={goldHotMat} position={[0, 0.52, 1.17]} scale={[1.2, 1.2, 1.2]} />
        <mesh geometry={sphereG} material={goldHotMat} position={[0, 0.95, 1.3]} scale={[0.12, 0.12, 0.12]} />
      </group>

      {/* --- 7. SPOT rounds: signpost with branching arrows ---------------- */}
      <group
        position={[f[6].center.x, f[6].groundY, f[6].center.z]}
        rotation={[0, f[6].rotY, 0]}
      >
        <mesh geometry={cylG} material={woodMat} position={[0, 1.5, 0]} scale={[0.18, 3, 0.18]} />
        <mesh geometry={boxG} material={accentSoftMats[6]} position={[0.42, 2.55, 0]} rotation={[0, 0.35, 0]} scale={[0.85, 0.24, 0.08]} />
        <mesh geometry={coneG} material={accentHotMats[6]} position={[0.88, 2.55, -0.15]} rotation={[0, 0.35, -Math.PI / 2]} scale={[0.24, 0.28, 0.1]} />
        <mesh geometry={boxG} material={accentSoftMats[6]} position={[-0.42, 2.1, 0]} rotation={[0, -0.5, 0]} scale={[0.85, 0.24, 0.08]} />
        <mesh geometry={coneG} material={accentHotMats[6]} position={[-0.87, 2.1, -0.22]} rotation={[0, -0.5, Math.PI / 2]} scale={[0.24, 0.28, 0.1]} />
        <mesh geometry={boxG} material={accentSoftMats[6]} position={[0.4, 1.65, 0.1]} rotation={[0, -0.15, 0]} scale={[0.8, 0.22, 0.08]} />
        <mesh geometry={coneG} material={accentHotMats[6]} position={[0.84, 1.65, 0.16]} rotation={[0, -0.15, -Math.PI / 2]} scale={[0.22, 0.26, 0.1]} />
      </group>

      {/* --- 8. Academic Year: mini college facade + clock tower ----------- */}
      <group
        position={[f[7].center.x, f[7].groundY, f[7].center.z]}
        rotation={[0, f[7].rotY, 0]}
      >
        <mesh geometry={boxG} material={texMats.facade} position={[0, 1.1, -0.5]} scale={[3.1, 2.2, 1]} />
        <mesh geometry={boxG} material={darkMat} position={[0, 2.9, -0.5]} scale={[0.85, 1.4, 0.85]} />
        <mesh geometry={planeG} material={texMats.clock} position={[0, 3.05, 0.02]} scale={[0.62, 0.62, 1]} />
        <mesh geometry={coneG} material={accentSoftMats[7]} position={[0, 3.95, -0.5]} scale={[1.05, 0.7, 1.05]} />
        <mesh geometry={boxG} material={accentHotMats[7]} position={[0, 0.35, 0.05]} scale={[0.7, 0.7, 0.12]} />
      </group>

      {/* --- 9. Beyond (GOLD): convocation stage + graduation cap ---------- */}
      <group
        position={[f[8].center.x, f[8].groundY, f[8].center.z]}
        rotation={[0, f[8].rotY, 0]}
      >
        <mesh geometry={platformG} material={darkMat} position={[0, 0.3, -0.3]} scale={[2.6, 0.6, 2.6]} />
        <mesh geometry={archG} material={goldHotMat} position={[0, 0.6, -0.3]} scale={[2.35, 2.35, 1]} />
        <mesh geometry={boxG} material={woodMat} position={[0, 1.05, 0.9]} scale={[0.8, 0.9, 0.55]} />
        <mesh geometry={boxG} material={goldHotMat} position={[0, 1.52, 1.06]} rotation={[-0.25, 0, 0]} scale={[0.85, 0.1, 0.5]} />
        {/* The giant hovering graduation cap */}
        <group ref={capRef} position={[0, 3.1, -0.3]}>
          <mesh geometry={boxG} material={darkMat} scale={[1.55, 0.09, 1.55]} rotation={[0, Math.PI / 4, 0]} />
          <mesh geometry={cylG} material={darkMat} position={[0, -0.28, 0]} scale={[0.95, 0.5, 0.95]} />
          <mesh geometry={sphereG} material={goldHotMat} position={[0, 0.09, 0]} scale={[0.16, 0.16, 0.16]} />
          <mesh geometry={boxG} material={goldHotMat} position={[0.78, -0.28, 0.78]} scale={[0.05, 0.65, 0.05]} />
        </group>
        <pointLight
          ref={goldLightRef}
          color={NEON_GOLD}
          position={[0, 2.6, 0]}
          intensity={13}
          distance={24}
          decay={1.8}
        />
        <Sparkles
          count={60}
          position={[0, 2.4, 0]}
          scale={[8, 6, 8]}
          size={3}
          speed={prefersReducedMotion ? 0 : 0.5}
          color={NEON_GOLD}
          opacity={0.9}
        />
      </group>
    </group>
  );
});

export default Checkpoints;
