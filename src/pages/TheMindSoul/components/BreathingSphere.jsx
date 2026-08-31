import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PRIMARY_LIGHT_BLUE, PRIMARY_PINK, PRIMARY_LIGHT_YELLOW } from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export default function BreathingSphere({ innerGlowRef }) {
  const sphereRef = useRef();
  const prefersReducedMotion = useReducedMotion();

  useFrame(({ clock }, delta) => {
    if (prefersReducedMotion) {
      // Hold a calm, static pose
      if (sphereRef.current) sphereRef.current.scale.setScalar(1);
      if (innerGlowRef.current) innerGlowRef.current.scale.setScalar(0.3);
      return;
    }

    const t = clock.getElapsedTime();

    // Breathing animation with more variation
    if (sphereRef.current) {
      const breath = 1 + Math.sin(t * 0.6) * 0.15 + Math.sin(t * 1.2) * 0.05;
      sphereRef.current.scale.setScalar(breath);

      // Gentle rotation - delta-scaled (matches 0.01/0.005 per frame at
      // 60fps), clamped so a background-tab return doesn't lurch.
      const dt = Math.min(delta, 0.05);
      sphereRef.current.rotation.y += dt * 0.6;
      sphereRef.current.rotation.x += dt * 0.3;
    }

    // Inner glow pulse
    if (innerGlowRef.current) {
      const pulse = 0.3 + Math.sin(t * 0.8) * 0.2;
      innerGlowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <Float
      speed={prefersReducedMotion ? 0 : 0.5}
      rotationIntensity={prefersReducedMotion ? 0 : 0.2}
      floatIntensity={prefersReducedMotion ? 0 : 0.3}
    >
      <group>
        {/* Inner glow */}
        <Sphere ref={innerGlowRef} args={[0.8, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={PRIMARY_PINK}
            emissive={PRIMARY_PINK}
            emissiveIntensity={2}
            transparent
            opacity={0.4}
          />
        </Sphere>

        {/* Main distorted sphere */}
        <Sphere ref={sphereRef} args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color={PRIMARY_LIGHT_BLUE}
            distort={0.5}
            speed={2.5}
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.95}
          />
        </Sphere>

        {/* Outer glow ring */}
        <Sphere args={[1.7, 32, 32]}>
          <meshStandardMaterial
            color={PRIMARY_LIGHT_YELLOW}
            emissive={PRIMARY_LIGHT_YELLOW}
            emissiveIntensity={0.5}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </Sphere>
      </group>
    </Float>
  );
}
