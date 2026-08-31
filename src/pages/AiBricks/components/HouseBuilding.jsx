import React from 'react';
import { Box } from '@react-three/drei';
import { BuildingFloors } from './BuildingFloor';
import colors from '../colors';

/**
 * House Building Component with Roof (fully built)
 */
export function HouseBuilding({ position, buildingIndex }) {
  const dimensions = {
    width: 2,
    depth: 2.5,
    height: 1.2,
    floors: 2,
  };

  return (
    <group position={position}>
      {/* Foundation */}
      <Box
        args={[dimensions.width + 0.5, 0.3, dimensions.depth + 0.5]}
        position={[0, 0.15, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={colors.foundation} roughness={0.9} />
      </Box>

      {/* Building floors (instanced) */}
      <BuildingFloors
        totalFloors={dimensions.floors}
        buildingWidth={dimensions.width}
        buildingDepth={dimensions.depth}
        floorHeight={dimensions.height}
        buildingType="house"
        buildingIndex={buildingIndex}
      />

      {/* Roof */}
      <mesh
        position={[0, dimensions.floors * dimensions.height - 0.3, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[dimensions.width * 0.9, 1.2, 4]} />
        <meshStandardMaterial color={colors.roofShingle} roughness={0.75} />
      </mesh>
    </group>
  );
}
