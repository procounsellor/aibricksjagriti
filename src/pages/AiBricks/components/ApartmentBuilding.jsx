import React from 'react';
import { Box } from '@react-three/drei';
import { BuildingFloors } from './BuildingFloor';
import colors from '../colors';

/**
 * Apartment Building Component (fully built)
 */
export function ApartmentBuilding({ position, numFloors, buildingIndex }) {
  const dimensions = {
    width: 4,
    depth: 3,
    height: 0.6,
    floors: Math.min(numFloors, 8),
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
        buildingType="apartment"
        buildingIndex={buildingIndex}
      />
    </group>
  );
}
