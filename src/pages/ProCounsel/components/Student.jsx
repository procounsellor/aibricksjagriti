import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PATH_CURVE, WALK_LIFT, climbMotion } from '../trackData';
import { NEON_CYAN, PAGE_GLOW } from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();

// Shared geometries / materials (created once for the app lifetime).
const bodyGeom = new THREE.CapsuleGeometry(0.26, 0.5, 6, 12);
const bodyMat = new THREE.MeshStandardMaterial({
  color: '#272754',
  roughness: 0.6,
  metalness: 0.15,
});
const headGeom = new THREE.SphereGeometry(0.21, 12, 12);
const headMat = new THREE.MeshStandardMaterial({
  color: '#e8c49a',
  roughness: 0.8,
});
const packGeom = new THREE.BoxGeometry(0.36, 0.46, 0.2);
const packMat = new THREE.MeshStandardMaterial({
  color: '#7c3aed',
  roughness: 0.7,
});
// HDR accents (> 1): the backpack strip and the glowing guidebook feed bloom.
const stripGeom = new THREE.BoxGeometry(0.3, 0.05, 0.06);
const stripMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(NEON_CYAN).multiplyScalar(2.2),
  toneMapped: false,
});
const limbGeom = new THREE.CapsuleGeometry(0.075, 0.3, 4, 8);
const limbMat = new THREE.MeshStandardMaterial({
  color: '#1e1e40',
  roughness: 0.7,
});
const bookGeom = new THREE.BoxGeometry(0.24, 0.05, 0.18);
const bookMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(PAGE_GLOW).multiplyScalar(1.9),
  toneMapped: false,
});

/**
 * The student — a stylized little climber built from primitives (capsule
 * body, head, backpack, swinging limbs, a glowing guidebook in one hand)
 * walking the book stairway. Reads the shared climbMotion state written by
 * the scene driver earlier in the frame; a distance-driven walk cycle bobs
 * the body and swings the limbs, and the whole figure leans into the ascent
 * while rushing. Reduced motion: snaps to position, static pose.
 */
export default function Student() {
  const groupRef = useRef();
  const riderRef = useRef(); // bob + lean, inside the oriented group
  const legLRef = useRef();
  const legRRef = useRef();
  const armLRef = useRef();
  const armRRef = useRef();
  const prefersReducedMotion = useReducedMotion();
  const phaseRef = useRef(0);
  const lastT = useRef(-1);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const rider = riderRef.current;
    if (!group || !rider) return;
    const delta = Math.min(rawDelta, 0.05);
    const t = climbMotion.t;

    if (Math.abs(t - lastT.current) > 1e-5 || lastT.current < 0) {
      lastT.current = t;
      PATH_CURVE.getPointAt(t, _pos);
      PATH_CURVE.getTangentAt(t, _tan);
      _pos.y += WALK_LIFT;
      group.position.copy(_pos);
      // Face direction of travel; lookAt also pitches the figure to the
      // slope of the climb (+Z of the model points forward).
      _look.copy(_pos).add(_tan);
      group.lookAt(_look);
    }

    if (prefersReducedMotion) {
      rider.position.y = 0.5;
      rider.rotation.x = 0;
      return;
    }

    // Distance-driven walk cycle (framerate independent): curve speed in
    // t-units/s scaled by an approximate path length.
    const walk = THREE.MathUtils.smoothstep(climbMotion.speed, 0.002, 0.05);
    phaseRef.current += climbMotion.speed * 340 * delta;
    const phase = phaseRef.current;

    // Gentle walk bob + a forward lean that deepens during the rush.
    rider.position.y = 0.5 + Math.abs(Math.sin(phase)) * 0.055 * walk;
    rider.rotation.x = 0.06 + walk * 0.1 + climbMotion.rush * 0.22;

    const swing = Math.sin(phase) * 0.6 * walk;
    if (legLRef.current) legLRef.current.rotation.x = swing;
    if (legRRef.current) legRRef.current.rotation.x = -swing;
    if (armLRef.current) armLRef.current.rotation.x = -swing * 0.8;
    if (armRRef.current) armRRef.current.rotation.x = swing * 0.8;
  });

  return (
    <group ref={groupRef}>
      <group ref={riderRef} position={[0, 0.5, 0]}>
        {/* Torso */}
        <mesh geometry={bodyGeom} material={bodyMat} position={[0, 0.3, 0]} />
        {/* Head */}
        <mesh geometry={headGeom} material={headMat} position={[0, 0.83, 0]} />
        {/* Backpack (behind = -Z) with a glowing reflective strip */}
        <mesh geometry={packGeom} material={packMat} position={[0, 0.38, -0.3]} />
        <mesh
          geometry={stripGeom}
          material={stripMat}
          position={[0, 0.5, -0.42]}
        />
        {/* Legs — pivot groups at the hips */}
        <group ref={legLRef} position={[0.13, 0.02, 0]}>
          <mesh geometry={limbGeom} material={limbMat} position={[0, -0.26, 0]} />
        </group>
        <group ref={legRRef} position={[-0.13, 0.02, 0]}>
          <mesh geometry={limbGeom} material={limbMat} position={[0, -0.26, 0]} />
        </group>
        {/* Arms — pivots at the shoulders */}
        <group ref={armLRef} position={[0.3, 0.55, 0]}>
          <mesh
            geometry={limbGeom}
            material={limbMat}
            position={[0.02, -0.22, 0]}
          />
        </group>
        <group ref={armRRef} position={[-0.3, 0.55, 0]}>
          <mesh
            geometry={limbGeom}
            material={limbMat}
            position={[-0.02, -0.22, 0]}
          />
          {/* The glowing guidebook, held in the right hand */}
          <mesh
            geometry={bookGeom}
            material={bookMat}
            position={[-0.06, -0.42, 0.12]}
            rotation={[0.4, 0, 0]}
          />
        </group>
        {/* Warm lantern glow travelling with the student */}
        <pointLight
          position={[0, 0.5, 0.4]}
          color="#ffd9a0"
          intensity={7}
          distance={9}
          decay={1.9}
        />
      </group>
    </group>
  );
}
