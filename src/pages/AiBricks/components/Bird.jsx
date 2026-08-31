import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import { cityState } from '../timeOfDay';
import colors from '../colors';

/**
 * Flying Bird Component - Animated bird with wing flapping.
 * Birds are daytime creatures: they fade away as night falls
 * (cityState.birdDay) and stay parked under prefers-reduced-motion.
 */
export function Bird({ position, scale = 1, reducedMotion = false }) {
  const birdRef = useRef();
  const wingLeftRef = useRef();
  const wingRightRef = useRef();
  // Random start phase + own clock so the bird freezes under prefers-reduced-motion
  const timeRef = useRef(Math.random() * 100);

  useFrame((state, delta) => {
    if (!birdRef.current) return;

    // Day-only: shrink away through dusk, gone at night
    const day = cityState.birdDay;
    birdRef.current.visible = day > 0.02;
    birdRef.current.scale.setScalar(scale * (0.3 + day * 0.7));
    if (!birdRef.current.visible) return;

    // Clamped delta: a background-tab return must not teleport the bird.
    if (!reducedMotion) timeRef.current += Math.min(delta, 0.05);
    const time = timeRef.current;

    // Flying path - offset by the spawn position so each bird flies its own loop
    birdRef.current.position.x = position[0] + Math.sin(time * 0.2) * 15;
    birdRef.current.position.z = position[2] + Math.cos(time * 0.15) * 12;
    birdRef.current.position.y = position[1] + Math.sin(time * 0.3) * 2;

    // Rotation to face direction
    birdRef.current.rotation.y = Math.atan2(
      Math.cos(time * 0.2) * 15 * 0.2,
      -Math.sin(time * 0.15) * 12 * 0.15
    );

    // Wing flapping
    if (wingLeftRef.current && wingRightRef.current) {
      const flap = Math.sin(time * 5) * 0.5;
      wingLeftRef.current.rotation.z = flap;
      wingRightRef.current.rotation.z = -flap;
    }
  });

  return (
    <group ref={birdRef} position={position} scale={scale}>
      {/* Body */}
      <Sphere args={[0.15, 8, 8]}>
        <meshStandardMaterial color={colors.birdBody} />
      </Sphere>

      {/* Wings */}
      <group ref={wingLeftRef} position={[-0.15, 0, 0]}>
        <Box args={[0.4, 0.05, 0.15]}>
          <meshStandardMaterial color={colors.birdWing} />
        </Box>
      </group>
      <group ref={wingRightRef} position={[0.15, 0, 0]}>
        <Box args={[0.4, 0.05, 0.15]}>
          <meshStandardMaterial color={colors.birdWing} />
        </Box>
      </group>
    </group>
  );
}
