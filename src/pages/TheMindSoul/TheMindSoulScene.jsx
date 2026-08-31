import React, { useRef, useMemo } from 'react';
import { Sparkles } from '@react-three/drei';
import { FloatingParticle, BreathingSphere } from './components';
import { useOrbitingLight } from './hooks/useLighting';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLContextLoss } from '../../hooks/useWebGLContextLoss';
import {
  ACCENT_BLUE,
  PRIMARY_PINK,
  PRIMARY_LIGHT_BLUE,
  PRIMARY_LIGHT_YELLOW,
  PRIMARY_SKY,
} from './colors';

const PARTICLE_COLORS = [PRIMARY_LIGHT_BLUE, PRIMARY_PINK, PRIMARY_LIGHT_YELLOW, PRIMARY_SKY];

export default function TheMindSoulScene() {
  const lightRef = useRef();
  const innerGlowRef = useRef();
  const prefersReducedMotion = useReducedMotion();

  // Minimal WebGL context-loss handling for this canvas
  useWebGLContextLoss();

  // Custom hook for orbiting light
  useOrbitingLight(lightRef);

  // Generate floating particles
  const floatingParticles = useMemo(() => {
    const count = 30;
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 10,
      ],
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      speed: Math.random() * 0.3 + 0.2,
    }));
  }, []);

  return (
    <>
      <ambientLight intensity={0.8} />
      
      <pointLight
        ref={lightRef}
        position={[0, 5, 5]}
        intensity={3}
        color={ACCENT_BLUE}
        distance={20}
        decay={2}
      />
      
      <pointLight
        position={[-5, -3, -5]}
        intensity={1.5}
        color={PRIMARY_PINK}
        distance={15}
      />

      {/* Main breathing sphere */}
      <BreathingSphere innerGlowRef={innerGlowRef} />

      {/* Floating particles */}
      {floatingParticles.map((particle, i) => (
        <FloatingParticle
          key={i}
          position={particle.position}
          color={particle.color}
          speed={particle.speed}
        />
      ))}

      {/* Enhanced sparkle system */}
      <Sparkles
        count={2000}
        scale={20}
        size={2.5}
        speed={prefersReducedMotion ? 0 : 0.4}
        noise={0.2}
        color={PRIMARY_LIGHT_YELLOW}
        opacity={0.8}
      />

      <Sparkles
        count={800}
        scale={15}
        size={1.5}
        speed={prefersReducedMotion ? 0 : 0.3}
        noise={0.15}
        color={PRIMARY_LIGHT_BLUE}
        opacity={0.6}
      />

      <Sparkles
        count={500}
        scale={18}
        size={1}
        speed={prefersReducedMotion ? 0 : 0.25}
        noise={0.1}
        color={PRIMARY_PINK}
        opacity={0.5}
      />
    </>
  );
}
