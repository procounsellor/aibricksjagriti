import React from 'react';
import { Box } from '@react-three/drei';
import { BuildingFloors } from './BuildingFloor';
import colors from '../colors';

// Cap the number of rendered floors and stretch the floor height instead,
// so the skyline silhouette stays the same with a fraction of the instances.
const MAX_VISIBLE_FLOORS = 14;
const BASE_FLOOR_HEIGHT = 0.5;

/**
 * Skyscraper Building Component (fully built)
 */
export function SkyscraperBuilding({ position, numFloors, buildingIndex }) {
  const visibleFloors = Math.min(numFloors, MAX_VISIBLE_FLOORS);
  const dimensions = {
    width: 3,
    depth: 2.5,
    height: (numFloors * BASE_FLOOR_HEIGHT) / visibleFloors,
    floors: visibleFloors,
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
        buildingType="skyscraper"
        buildingIndex={buildingIndex}
      />
    </group>
  );
}
