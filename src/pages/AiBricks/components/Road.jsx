import React, { useLayoutEffect, useRef } from 'react';
import { Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cityState } from '../timeOfDay';
import colors from '../colors';

// One shared material for all 30 lane markings; unlit + toneMapped false so
// at night the lines cross the bloom threshold and glow like neon guides.
const roadLineMaterial = new THREE.MeshBasicMaterial({
  color: colors.roadLine,
  toneMapped: false,
});
const roadLineBase = new THREE.Color(colors.roadLine);

const lineGeometry = new THREE.BoxGeometry(1, 0.03, 0.15);
const tmpObj = new THREE.Object3D();
const LINE_COUNT = 30;

/**
 * Road System - one instanced mesh for all lane markings (1 draw call
 * instead of 30).
 */
export function Road() {
  const linesRef = useRef();

  useLayoutEffect(() => {
    const mesh = linesRef.current;
    if (!mesh) return;
    tmpObj.rotation.set(0, 0, 0);
    tmpObj.scale.set(1, 1, 1);
    for (let i = 0; i < LINE_COUNT; i++) {
      tmpObj.position.set(i * 2 - 30, 0.01, 0);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    roadLineMaterial.color.copy(roadLineBase).multiplyScalar(0.55 + cityState.headlight * 0.9);
  });

  return (
    <group position={[0, 0.01, 8]}>
      {/* Main road */}
      <Box args={[60, 0.02, 4]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color={colors.roadAsphalt} roughness={0.9} />
      </Box>

      {/* Road markings - instanced */}
      <instancedMesh
        ref={linesRef}
        args={[lineGeometry, roadLineMaterial, LINE_COUNT]}
        frustumCulled={false}
      />

      {/* Sidewalks */}
      <Box args={[60, 0.05, 0.5]} position={[0, 0.025, 2.25]} receiveShadow>
        <meshStandardMaterial color={colors.sidewalk} roughness={0.8} />
      </Box>
      <Box args={[60, 0.05, 0.5]} position={[0, 0.025, -2.25]} receiveShadow>
        <meshStandardMaterial color={colors.sidewalk} roughness={0.8} />
      </Box>
    </group>
  );
}
