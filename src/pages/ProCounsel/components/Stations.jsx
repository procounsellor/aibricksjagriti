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
import { STATIONS, NUM_STATIONS } from '../trackData';
import { STRUCTURE_DARK, NEON_GOLD } from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const _dummy = new THREE.Object3D();
const _v = new THREE.Vector3();

// Shared geometries / materials for the instanced station structure.
const slabGeom = new THREE.BoxGeometry(2.8, 0.5, 7);
const canopyGeom = new THREE.BoxGeometry(2.8, 0.12, 6.4);
const columnGeom = new THREE.CylinderGeometry(0.09, 0.11, 3.6, 6);
const stripGeom = new THREE.BoxGeometry(0.14, 0.08, 7);
const signGeom = new THREE.PlaneGeometry(3.4, 1.7);

const slabMat = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  roughness: 0.85,
  metalness: 0.3,
});
const canopyMat = new THREE.MeshStandardMaterial({
  color: '#181830',
  roughness: 0.7,
  metalness: 0.4,
});
const columnMat = new THREE.MeshStandardMaterial({
  color: '#1c1c34',
  roughness: 0.8,
});
// White-hot base (> 1) — tinted per instance via instanceColor; the platform
// edge strips are among the brightest bloom sources in the scene.
const stripMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ffffff').multiplyScalar(2.2),
  toneMapped: false,
});

// --- Procedural holographic sign texture (no network fonts / assets) --------
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
  if (truncated || (line && lines.length === maxLines && line !== lines[maxLines - 1])) {
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

function makeSignTexture(station) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  const accent = `#${station.color.getHexString()}`;

  g.clearRect(0, 0, 512, 256);

  // Panel
  g.fillStyle = 'rgba(6, 8, 22, 0.78)';
  tracePanel(g, 10, 10, 492, 236, 18);
  g.fill();

  // Neon frame with glow
  g.save();
  g.strokeStyle = accent;
  g.lineWidth = 5;
  g.shadowColor = accent;
  g.shadowBlur = 22;
  tracePanel(g, 10, 10, 492, 236, 18);
  g.stroke();
  g.restore();

  const font = (size, weight = 'bold') =>
    `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;

  // Station ordinal
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = font(22, '600');
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(
    station.isFinal
      ? `★ FINAL STATION ${station.index + 1}/${NUM_STATIONS}`
      : `STATION ${station.index + 1}/${NUM_STATIONS}`,
    34,
    46
  );

  // Time period — big neon headline
  g.save();
  g.fillStyle = '#ffffff';
  g.shadowColor = accent;
  g.shadowBlur = 18;
  g.font = font(58);
  g.textAlign = 'center';
  g.fillText(station.data.timePeriod, 256, 106);
  g.restore();

  // Key event — short wrapped lines in the accent color
  const lines = wrapKeyEvent(station.data.keyEvent);
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

/**
 * All nine metro stations. Structure (slab / canopy / columns / edge strip)
 * is instanced: 4 draw calls for every station combined. Each station adds a
 * unique holographic sign plane (9 draws). Final station gets gold sparkles
 * and a celebratory point light.
 *
 * Exposes `boost(i)` via ref — the scene driver calls it on tram arrival to
 * flare that station's sign.
 */
const Stations = forwardRef(function Stations(props, ref) {
  const prefersReducedMotion = useReducedMotion();
  const slabsRef = useRef();
  const canopiesRef = useRef();
  const columnsRef = useRef();
  const stripsRef = useRef();
  const signRefs = useRef([]);
  const finalLightRef = useRef();
  const boostRef = useRef(new Float32Array(NUM_STATIONS));

  useImperativeHandle(
    ref,
    () => ({
      boost: (i) => {
        if (i >= 0 && i < NUM_STATIONS) boostRef.current[i] = 1;
      },
    }),
    []
  );

  // Unique sign materials (one CanvasTexture each).
  const signMaterials = useMemo(
    () =>
      STATIONS.map(
        (station) =>
          new THREE.MeshBasicMaterial({
            map: makeSignTexture(station),
            transparent: true,
            toneMapped: false,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
      ),
    []
  );

  useEffect(
    () => () => {
      signMaterials.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    },
    [signMaterials]
  );

  // Static frames for the sign planes (position + facing the track).
  const signFrames = useMemo(
    () =>
      STATIONS.map((st) => {
        const pos = _v
          .copy(st.position)
          .addScaledVector(st.side, 2.5)
          .clone();
        pos.y = st.position.y + 4.35;
        // Plane normal (+Z) should point from the platform toward the track.
        const rotY = Math.atan2(-st.side.x, -st.side.z);
        return { position: pos, rotY, baseY: pos.y };
      }),
    []
  );

  // Place all instanced structure once.
  useLayoutEffect(() => {
    const slabs = slabsRef.current;
    const canopies = canopiesRef.current;
    const columns = columnsRef.current;
    const strips = stripsRef.current;
    if (!slabs || !canopies || !columns || !strips) return;

    for (let i = 0; i < NUM_STATIONS; i++) {
      const st = STATIONS[i];
      const p = st.position;
      const side = st.side;
      const tan = st.tangent;

      // Platform slab
      _dummy.position.set(
        p.x + side.x * 2.3,
        p.y - 0.55,
        p.z + side.z * 2.3
      );
      _dummy.rotation.set(0, st.yaw, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      slabs.setMatrixAt(i, _dummy.matrix);

      // Canopy
      _dummy.position.set(p.x + side.x * 2.5, p.y + 3.3, p.z + side.z * 2.5);
      _dummy.updateMatrix();
      canopies.setMatrixAt(i, _dummy.matrix);

      // Two columns per station
      for (let c = 0; c < 2; c++) {
        const dir = c === 0 ? 2.6 : -2.6;
        _dummy.position.set(
          p.x + side.x * 3.1 + tan.x * dir,
          p.y + 1.45,
          p.z + side.z * 3.1 + tan.z * dir
        );
        _dummy.updateMatrix();
        columns.setMatrixAt(i * 2 + c, _dummy.matrix);
      }

      // Glowing platform edge strip (accent colored per instance)
      _dummy.position.set(p.x + side.x * 1.05, p.y - 0.26, p.z + side.z * 1.05);
      _dummy.updateMatrix();
      strips.setMatrixAt(i, _dummy.matrix);
      strips.setColorAt(i, st.color);
    }

    slabs.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    columns.instanceMatrix.needsUpdate = true;
    strips.instanceMatrix.needsUpdate = true;
    if (strips.instanceColor) strips.instanceColor.needsUpdate = true;
    slabs.computeBoundingSphere();
    canopies.computeBoundingSphere();
    columns.computeBoundingSphere();
    strips.computeBoundingSphere();
  }, []);

  // Sign float / flicker + arrival boost decay. Imperative only — no setState.
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const boosts = boostRef.current;
    for (let i = 0; i < NUM_STATIONS; i++) {
      const mesh = signRefs.current[i];
      if (!mesh) continue;
      let b = boosts[i];
      if (b > 0) {
        b = Math.max(0, b - delta * 1.1);
        boosts[i] = b;
      }
      if (prefersReducedMotion) {
        // Frozen: no float, no flicker, no boost flare. A gentle static HDR
        // lift keeps the sign whites glowing under the (static) bloom.
        mesh.position.y = signFrames[i].baseY;
        mesh.scale.set(1, 1, 1);
        mesh.material.opacity = 0.95;
        mesh.material.color.setScalar(1.3);
        continue;
      }
      mesh.position.y =
        signFrames[i].baseY + Math.sin(time * 1.2 + i * 1.7) * 0.07;
      const flick =
        0.9 + 0.1 * Math.sin(time * 19 + i * 7) * Math.sin(time * 7.3 + i * 3);
      mesh.material.opacity = Math.min(1, 0.92 * flick + b * 0.7);
      // HDR flare: on arrival the sign whites blast past the bloom threshold.
      mesh.material.color.setScalar(1.35 + b * 1.9);
      const s = 1 + b * 0.22;
      mesh.scale.set(s, s, 1);
    }

    // Final gold station: the celebration light surges on arrival.
    const finalLight = finalLightRef.current;
    if (finalLight) {
      finalLight.intensity = 14 + boosts[NUM_STATIONS - 1] * 42;
    }
  });

  const finalStation = STATIONS[NUM_STATIONS - 1];

  return (
    <group>
      <instancedMesh
        ref={slabsRef}
        args={[slabGeom, slabMat, NUM_STATIONS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={canopiesRef}
        args={[canopyGeom, canopyMat, NUM_STATIONS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={columnsRef}
        args={[columnGeom, columnMat, NUM_STATIONS * 2]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={stripsRef}
        args={[stripGeom, stripMat, NUM_STATIONS]}
        frustumCulled={false}
      />

      {signFrames.map((frame, i) => (
        <mesh
          key={`sign-${i}`}
          ref={(el) => {
            signRefs.current[i] = el;
          }}
          geometry={signGeom}
          material={signMaterials[i]}
          position={frame.position}
          rotation={[0, frame.rotY, 0]}
        />
      ))}

      {/* Final station: celebratory gold glow + sparkles */}
      <group
        position={[
          finalStation.position.x + finalStation.side.x * 2,
          finalStation.position.y + 2.2,
          finalStation.position.z + finalStation.side.z * 2,
        ]}
      >
        <pointLight
          ref={finalLightRef}
          color={NEON_GOLD}
          intensity={14}
          distance={22}
          decay={1.8}
        />
        <Sparkles
          count={60}
          scale={[9, 7, 9]}
          size={3}
          speed={prefersReducedMotion ? 0 : 0.5}
          color={NEON_GOLD}
          opacity={0.9}
        />
      </group>
    </group>
  );
});

export default Stations;
