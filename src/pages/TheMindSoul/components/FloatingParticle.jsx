import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export default function FloatingParticle({ position, color, speed }) {
  const meshRef = useRef();
  const initialPos = useMemo(() => position, []);
  const prefersReducedMotion = useReducedMotion();

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;
    if (prefersReducedMotion) return;
    const t = clock.getElapsedTime() * speed;
    meshRef.current.position.x = initialPos[0] + Math.sin(t) * 2;
    meshRef.current.position.y = initialPos[1] + Math.cos(t * 0.7) * 1.5;
    meshRef.current.position.z = initialPos[2] + Math.cos(t * 0.5) * 2;
    // Delta-scaled rotation (matches 0.01 per frame at 60fps), clamped so
    // a background-tab return doesn't lurch.
    const dt = Math.min(delta, 0.05);
    meshRef.current.rotation.x += dt * 0.6;
    meshRef.current.rotation.y += dt * 0.6;
  });

  return (
    <Sphere ref={meshRef} args={[0.05, 16, 16]} position={position}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
        transparent
        opacity={0.8}
      />
    </Sphere>
  );
}
