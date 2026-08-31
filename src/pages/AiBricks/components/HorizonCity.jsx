import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cityState } from '../timeOfDay';

/**
 * Horizon silhouette - a ring of distant towers around the city that gives
 * the skyline depth. ONE InstancedMesh (46 boxes), matrices laid out once.
 * The material color tracks the fog color every frame (slightly darker), so
 * the towers always read as a hazy silhouette in any time of day.
 */

const TOWER_COUNT = 46;
const towerGeometry = new THREE.BoxGeometry(1, 1, 1);
const towerMaterial = new THREE.MeshBasicMaterial({ color: '#8a8a9a', fog: true });
const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

function pseudoRandom(i) {
  return Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
}

export function HorizonCity() {
  const meshRef = useRef();

  // Deterministic ring layout, precomputed once
  const layout = useMemo(() => {
    const items = [];
    for (let i = 0; i < TOWER_COUNT; i++) {
      const angle =
        (i / TOWER_COUNT) * Math.PI * 2 + pseudoRandom(i * 3 + 1) * 0.12;
      const radius = 66 + pseudoRandom(i * 5 + 2) * 34;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Keep the main road corridor (front of the camera) a little clearer
      if (z > 30 && Math.abs(x) < 24) continue;
      items.push({
        x,
        z,
        height: 6 + pseudoRandom(i * 7 + 3) * 15,
        width: 2.6 + pseudoRandom(i * 11 + 4) * 2.8,
        depth: 2.6 + pseudoRandom(i * 13 + 5) * 2.8,
        shade: 0.8 + pseudoRandom(i * 17 + 6) * 0.2,
      });
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < layout.length; i++) {
      const t = layout[i];
      tmpObj.position.set(t.x, t.height / 2, t.z);
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.scale.set(t.width, t.height, t.depth);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      tmpColor.setScalar(t.shade);
      mesh.setColorAt(i, tmpColor);
    }
    // Hide any unused slots
    for (let i = layout.length; i < TOWER_COUNT; i++) {
      tmpObj.position.set(0, -50, 0);
      tmpObj.scale.setScalar(0.0001);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout]);

  useFrame(() => {
    // Slightly darker than the fog = always a clean silhouette
    towerMaterial.color.copy(cityState.fog).multiplyScalar(0.82);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[towerGeometry, towerMaterial, TOWER_COUNT]}
      frustumCulled={false}
    />
  );
}
