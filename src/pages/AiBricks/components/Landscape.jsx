import React from 'react';
import colors from '../colors';

/**
 * Landscape with grass areas and dirt patches
 */
export function Landscape() {
  return (
    <>
      {/* Grass areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[700, 250]} />
        <meshStandardMaterial color={colors.grassDark} roughness={0.95} />
      </mesh>
      

      {/* // Not needed now can be added later if required */}
      {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 15]} receiveShadow>
        <planeGeometry args={[700, 250]} />
        <meshStandardMaterial color={colors.grassLight} roughness={0.95} />
      </mesh> */}
      
      {/* Dirt patches near construction */}
      {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10, 0.005, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color={colors.dirtPatch1} roughness={0.98} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, 0.005, -3]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={colors.dirtPatch2} roughness={0.98} />
      </mesh> */}
    </>
  );
}
