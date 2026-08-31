import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { cityState } from '../timeOfDay';
import colors from '../colors';

// Shared window glass - plain transparent material. The old transmission
// material forced three to render the whole scene into a transmission
// target every frame.
const windowGlassMaterial = new THREE.MeshStandardMaterial({
  color: colors.carWindowGlass,
  transparent: true,
  opacity: 0.55,
  metalness: 0.2,
  roughness: 0.05,
});

// Shared light materials - both cars write the same time-of-day-driven
// color, so sharing one material per light type is free. Unlit + toneMapped
// false: at night the color is pushed past 1 and the real bloom pass turns
// the headlights into streaking hot points.
const headlightMaterial = new THREE.MeshBasicMaterial({
  color: '#ffeecc',
  toneMapped: false,
});
const taillightMaterial = new THREE.MeshBasicMaterial({
  color: '#ff3322',
  toneMapped: false,
});
const headlightBase = new THREE.Color('#ffeecc');
const taillightBase = new THREE.Color('#ff3322');

/**
 * Moving Car Component - Realistic modern car with proper proportions
 */
export function Car({ position, speed = 0.02, color = colors.carRed, reducedMotion = false }) {
  const carRef = useRef();
  const wheelsRef = useRef([]);
  const timeRef = useRef(0);

  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.95,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    reflectivity: 1,
  }), [color]);

  useFrame((state, delta) => {
    if (!carRef.current) return;

    // Own clock (delta-accumulated) so the car parks under prefers-reduced-motion.
    // Clamped so a background-tab return doesn't teleport the car.
    if (!reducedMotion) timeRef.current += Math.min(delta, 0.05);

    const distance = (timeRef.current * speed) % 40;
    carRef.current.position.x = distance - 20;

    // Headlights matter at night - brighten after dusk (shared materials,
    // both cars write the same value). > 1 luminance feeds the bloom pass.
    headlightMaterial.color.copy(headlightBase).multiplyScalar(0.55 + cityState.headlight * 2.6);
    taillightMaterial.color.copy(taillightBase).multiplyScalar(0.45 + cityState.headlight * 1.6);

    // Rotate wheels based on distance traveled (proper rolling)
    // Wheel circumference = 2 * PI * radius = 2 * PI * 0.25 ≈ 1.57
    const wheelRotation = (distance / 1.57) * Math.PI * 2;
    wheelsRef.current.forEach(wheel => {
      if (wheel) wheel.rotation.y = wheelRotation;
    });
  });

  return (
    <group ref={carRef} position={position}>
      {/* Main body - lower chassis */}
      <RoundedBox args={[2.2, 0.6, 1.2]} radius={0.08} position={[0, 0.4, 0]} castShadow receiveShadow material={bodyMaterial} />

      {/* Car cabin/roof */}
      <RoundedBox args={[1.3, 0.7, 1.1]} radius={0.1} position={[-0.1, 1.05, 0]} castShadow receiveShadow material={bodyMaterial} />

      {/* Front windshield */}
      <Box args={[0.65, 0.55, 1.05]} position={[0.5, 1.05, 0]} rotation={[0, 0, 0.15]} material={windowGlassMaterial} />

      {/* Rear windshield */}
      <Box args={[0.5, 0.55, 1.05]} position={[-0.7, 1.05, 0]} rotation={[0, 0, -0.1]} material={windowGlassMaterial} />

      {/* Side windows */}
      <Box args={[1.25, 0.5, 0.02]} position={[-0.1, 1.05, 0.55]} material={windowGlassMaterial} />
      <Box args={[1.25, 0.5, 0.02]} position={[-0.1, 1.05, -0.55]} material={windowGlassMaterial} />

      {/* Headlights - brighten after dusk via the shared material */}
      <Box args={[0.15, 0.2, 0.3]} position={[1.1, 0.45, 0.45]} material={headlightMaterial} />
      <Box args={[0.15, 0.2, 0.3]} position={[1.1, 0.45, -0.45]} material={headlightMaterial} />

      {/* Taillights */}
      <Box args={[0.1, 0.15, 0.25]} position={[-1.1, 0.4, 0.45]} material={taillightMaterial} />
      <Box args={[0.1, 0.15, 0.25]} position={[-1.1, 0.4, -0.45]} material={taillightMaterial} />

      {/* Wheels with proper tire details */}
      {[
        [-0.7, 0.65],  // Front left
        [0.6, 0.65],   // Front right
        [-0.7, -0.65], // Rear left
        [0.6, -0.65]   // Rear right
      ].map((pos, i) => (
        <group key={i} position={[pos[0], 0.25, pos[1]]} rotation={[Math.PI / 2, 0, 0]} ref={(el) => wheelsRef.current[i] = el}>
          {/* Tire */}
          <Cylinder
            args={[0.25, 0.25, 0.2, 32]}
            castShadow
          >
            <meshStandardMaterial
              color={colors.carTire}
              metalness={0.2}
              roughness={0.95}
            />
          </Cylinder>

          {/* Rim/Hub */}
          <Cylinder
            args={[0.15, 0.15, 0.22, 32]}
          >
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.95}
              roughness={0.15}
            />
          </Cylinder>
        </group>
      ))}

      {/* Undercarriage */}
      <Box args={[2, 0.1, 1]} position={[0, 0.05, 0]} receiveShadow>
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.5}
          roughness={0.8}
        />
      </Box>
    </group>
  );
}
