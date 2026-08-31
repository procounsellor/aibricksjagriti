import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cityState } from '../timeOfDay';
import { BUILDINGS, CORE_POSITION } from '../cityLayout';
import colors from '../colors';

/**
 * Instanced building floors - Living Data City edition.
 *
 * The buildings are FINISHED from frame one: floor/edge/window matrices are
 * laid out once (static), and the only per-frame work is recoloring window
 * instances when the time of day (cityState.windowLit) or this building's
 * match flare (cityState.matchGlow[buildingIndex]) changes materially.
 *
 * Windows use an unlit MeshBasicMaterial so per-instance colors carry the
 * full "glow" - by day they read as cool sky-tinted glass, and through dusk
 * each window crosses its own random threshold and warms up, so the city
 * lights up in a staggered, organic way. A match pulse arrival flares every
 * window of the target building briefly (HDR color boost, ACES-tonemapped).
 *
 * 3 draw calls per building: floor bodies, floor edges, windows.
 */

// Shared unit geometry + static materials (module scope, reused by every building)
const unitBoxGeometry = new THREE.BoxGeometry(1, 1, 1);

const edgeMaterial = new THREE.MeshStandardMaterial({
  color: colors.floorEdge,
  metalness: 0.8,
  roughness: 0.2,
});

// One unlit window material for the whole city; instance colors do the rest.
// toneMapped: false lets lit windows carry HDR values (> 1) straight into
// the bloom pass - at night the whole city genuinely glows.
const windowMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });

const FLOOR_STYLE = {
  skyscraper: { color: colors.skyscraperBase, metalness: 0.7, roughness: 0.2 },
  apartment: { color: colors.apartmentBase, metalness: 0.3, roughness: 0.6 },
  house: { color: colors.houseBase, metalness: 0.3, roughness: 0.6 },
};

const tmpColor = new THREE.Color();
const tmpNight = new THREE.Color();
const dayGlassColor = new THREE.Color(colors.windowDay);
const nightOffColor = new THREE.Color(colors.windowNightOff);
const nightLitColor = new THREE.Color(colors.windowNightLit);
const flareColor = new THREE.Color(colors.matchFlare);
const scanColor = new THREE.Color('#9ff5ff');
const SCAN_BAND = 2.6; // world-units half-width of the scan wavefront tick

// Deterministic pseudo-random in [0, 1) so per-window variation is stable
function pseudoRandom(i) {
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

function smooth01(x) {
  const u = THREE.MathUtils.clamp(x, 0, 1);
  return u * u * (3 - 2 * u);
}

export function BuildingFloors({
  totalFloors,
  buildingWidth,
  buildingDepth,
  floorHeight,
  buildingType = 'skyscraper',
  buildingIndex = 0,
}) {
  const floorsRef = useRef();
  const edgesRef = useRef();
  const windowsRef = useRef();
  const lastLit = useRef(-1);
  const lastGlow = useRef(-1);
  const lastScan = useRef(-1);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Distance from this building to the AI core (for the scan wave tick)
  const coreDistance = useMemo(() => {
    const b = BUILDINGS[buildingIndex];
    if (!b) return 0;
    const dx = b.pos[0] - CORE_POSITION[0];
    const dz = b.pos[2] - CORE_POSITION[2];
    return Math.sqrt(dx * dx + dz * dz);
  }, [buildingIndex]);

  // Window layout for one floor (same math as the construction-era layout)
  const windows = useMemo(() => {
    const positions = [];

    if (buildingType === 'skyscraper') {
      const cols = 6;

      // Front and back faces
      for (let face = 0; face < 2; face++) {
        for (let col = 0; col < cols; col++) {
          positions.push({
            x: (col - cols / 2 + 0.5) * (buildingWidth / cols),
            z: face === 0 ? buildingDepth / 2 + 0.01 : -buildingDepth / 2 - 0.01,
            rotY: 0,
            width: buildingWidth / (cols + 2),
            height: floorHeight * 0.5,
          });
        }
      }

      // Left and right faces
      const sideCols = Math.floor(cols * (buildingDepth / buildingWidth));
      for (let face = 0; face < 2; face++) {
        for (let col = 0; col < sideCols; col++) {
          positions.push({
            x: face === 0 ? buildingWidth / 2 + 0.01 : -buildingWidth / 2 - 0.01,
            z: (col - sideCols / 2 + 0.5) * (buildingDepth / sideCols),
            rotY: Math.PI / 2,
            width: buildingDepth / (sideCols + 2),
            height: floorHeight * 0.5,
          });
        }
      }
    } else if (buildingType === 'apartment') {
      const cols = 4;
      for (let face = 0; face < 2; face++) {
        for (let col = 0; col < cols; col++) {
          positions.push({
            x: (col - cols / 2 + 0.5) * (buildingWidth / cols),
            z: face === 0 ? buildingDepth / 2 + 0.01 : -buildingDepth / 2 - 0.01,
            rotY: 0,
            width: buildingWidth / (cols + 1),
            height: floorHeight * 0.6,
          });
        }
      }
    } else if (buildingType === 'house') {
      positions.push(
        { x: buildingWidth * 0.25, z: buildingDepth / 2 + 0.01, rotY: 0, width: 0.4, height: 0.4 },
        { x: -buildingWidth * 0.25, z: buildingDepth / 2 + 0.01, rotY: 0, width: 0.4, height: 0.4 }
      );
    }

    return positions;
  }, [buildingWidth, buildingDepth, floorHeight, buildingType]);

  const windowsPerFloor = windows.length;
  const windowCount = totalFloors * windowsPerFloor;

  // Per-window stagger thresholds + warmth variation, stable per building
  const thresholds = useMemo(() => {
    const arr = new Float32Array(windowCount);
    for (let i = 0; i < windowCount; i++) {
      arr[i] = 0.05 + pseudoRandom(buildingIndex * 997 + i * 13 + 1) * 0.85;
    }
    return arr;
  }, [windowCount, buildingIndex]);

  const warmth = useMemo(() => {
    const arr = new Float32Array(windowCount);
    for (let i = 0; i < windowCount; i++) {
      arr[i] = 0.8 + pseudoRandom(buildingIndex * 131 + i * 7 + 5) * 0.45;
    }
    return arr;
  }, [windowCount, buildingIndex]);

  const style = FLOOR_STYLE[buildingType] || FLOOR_STYLE.skyscraper;
  const baseColor = useMemo(() => new THREE.Color(style.color), [style]);

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff', // per-instance colors carry the real floor color
        metalness: style.metalness,
        roughness: style.roughness,
      }),
    [style]
  );

  useEffect(
    () => () => {
      floorMaterial.dispose();
    },
    [floorMaterial]
  );

  // Static one-time layout: the city is finished
  useLayoutEffect(() => {
    const floors = floorsRef.current;
    const edges = edgesRef.current;
    const winMesh = windowsRef.current;
    if (!floors || !edges || !winMesh) return;

    for (let i = 0; i < totalFloors; i++) {
      const y = i * floorHeight;

      // Floor body
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(0, y, 0);
      dummy.scale.set(buildingWidth, floorHeight * 0.85, buildingDepth);
      dummy.updateMatrix();
      floors.setMatrixAt(i, dummy.matrix);

      // Subtle per-floor shade variation
      tmpColor
        .copy(baseColor)
        .multiplyScalar(0.95 + pseudoRandom(buildingIndex * 51 + i) * 0.09);
      floors.setColorAt(i, tmpColor);

      // Floor separator/edge
      dummy.position.set(0, y - floorHeight * 0.425, 0);
      dummy.scale.set(buildingWidth * 1.01, 0.05, buildingDepth * 1.01);
      dummy.updateMatrix();
      edges.setMatrixAt(i, dummy.matrix);

      // Windows, full size
      for (let j = 0; j < windowsPerFloor; j++) {
        const win = windows[j];
        dummy.position.set(win.x, y, win.z);
        dummy.rotation.set(0, win.rotY, 0);
        dummy.scale.set(win.width, win.height, 0.05);
        dummy.updateMatrix();
        winMesh.setMatrixAt(i * windowsPerFloor + j, dummy.matrix);
      }
      dummy.rotation.set(0, 0, 0);
    }

    floors.instanceMatrix.needsUpdate = true;
    if (floors.instanceColor) floors.instanceColor.needsUpdate = true;
    edges.instanceMatrix.needsUpdate = true;
    winMesh.instanceMatrix.needsUpdate = true;

    lastLit.current = -1; // force a window recolor on the next frame
    lastGlow.current = -1;
    lastScan.current = -1;
  }, [
    dummy,
    totalFloors,
    floorHeight,
    buildingWidth,
    buildingDepth,
    windows,
    windowsPerFloor,
    baseColor,
    buildingIndex,
  ]);

  // Per-frame: recolor windows only when time-of-day, match flare or the
  // passing scan wavefront moved materially
  useFrame(() => {
    const winMesh = windowsRef.current;
    if (!winMesh) return;

    const lit = cityState.windowLit;
    const glow = cityState.matchGlow[buildingIndex] || 0;

    // Holographic scan tick: brief cyan edge-glow as the wavefront crosses
    const scanD = Math.abs(cityState.scanRadius - coreDistance);
    const scanHit =
      cityState.scanStrength > 0.01 && scanD < SCAN_BAND
        ? (1 - scanD / SCAN_BAND) * cityState.scanStrength
        : 0;

    if (
      Math.abs(lit - lastLit.current) < 0.003 &&
      Math.abs(glow - lastGlow.current) < 0.01 &&
      Math.abs(scanHit - lastScan.current) < 0.015
    ) {
      return;
    }
    lastLit.current = lit;
    lastGlow.current = glow;
    lastScan.current = scanHit;

    const nightBlend = smooth01(lit * 1.25);
    for (let i = 0; i < windowCount; i++) {
      // Each window switches on as `lit` crosses its own threshold
      const on = smooth01((lit * 1.15 - thresholds[i]) / 0.25);
      tmpNight.copy(nightOffColor).lerp(nightLitColor, on);
      if (on > 0) {
        tmpNight.multiplyScalar(1 + (warmth[i] - 1) * on);
        // HDR push at night: lit windows cross the bloom threshold
        tmpNight.multiplyScalar(1 + on * lit * 0.55);
      }
      tmpColor.copy(dayGlassColor).lerp(tmpNight, nightBlend);
      if (glow > 0.01) {
        tmpColor.lerp(flareColor, glow * 0.6);
        tmpColor.multiplyScalar(1 + glow * 2.4);
      }
      if (scanHit > 0.015) {
        tmpColor.lerp(scanColor, scanHit * 0.4);
        tmpColor.multiplyScalar(1 + scanHit * 1.1);
      }
      winMesh.setColorAt(i, tmpColor);
    }
    if (winMesh.instanceColor) winMesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Floor bodies - the building hull keeps shadows */}
      <instancedMesh
        ref={floorsRef}
        args={[unitBoxGeometry, floorMaterial, totalFloors]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      {/* Floor separators/edges */}
      <instancedMesh
        ref={edgesRef}
        args={[unitBoxGeometry, edgeMaterial, totalFloors]}
        frustumCulled={false}
      />
      {/* Windows */}
      <instancedMesh
        ref={windowsRef}
        args={[unitBoxGeometry, windowMaterial, windowCount]}
        frustumCulled={false}
      />
    </group>
  );
}
