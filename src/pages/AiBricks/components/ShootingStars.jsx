import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cityState } from '../timeOfDay';

/**
 * Pooled shooting stars - occasional bright streaks across the night sky.
 * Pool of 3 thin stretched boxes with HDR (> 1) unlit color, so with real
 * bloom each one reads as a hot meteor trail. Spawns only while the star
 * field is visible (night), never under reduced motion.
 * Zero per-frame allocations: all vectors preallocated per pool slot.
 */

const STREAK_POOL = 3;
const streakGeometry = new THREE.BoxGeometry(1, 1, 1);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const tmpQuat = new THREE.Quaternion();

export function ShootingStars({ reducedMotion = false }) {
  const groupRef = useRef();
  const meshRefs = useRef([]);
  const spawnTimer = useRef(4);

  const streaks = useMemo(
    () =>
      Array.from({ length: STREAK_POOL }, () => ({
        active: false,
        life: 0,
        speed: 60,
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
      })),
    []
  );

  const materials = useMemo(
    () =>
      Array.from(
        { length: STREAK_POOL },
        () =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color('#eaf4ff').multiplyScalar(2.4),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            fog: false,
          })
      ),
    []
  );

  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
    },
    [materials]
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const night = cityState.starAlpha;

    if (reducedMotion || night < 0.4) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const dt = Math.min(delta, 0.05);

    // Spawn
    spawnTimer.current -= dt;
    if (spawnTimer.current <= 0) {
      spawnTimer.current = 3.5 + Math.random() * 5;
      for (let i = 0; i < STREAK_POOL; i++) {
        const s = streaks[i];
        if (s.active) continue;
        s.active = true;
        s.life = 0;
        s.speed = 48 + Math.random() * 30;
        s.pos.set(
          (Math.random() - 0.5) * 140,
          55 + Math.random() * 28,
          -70 + Math.random() * 45
        );
        s.dir
          .set((Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.4), -0.45, 0.12)
          .normalize();
        const mesh = meshRefs.current[i];
        if (mesh) {
          tmpQuat.setFromUnitVectors(X_AXIS, s.dir);
          mesh.quaternion.copy(tmpQuat);
          mesh.scale.set(7, 0.14, 0.14);
        }
        break;
      }
    }

    // Advance
    for (let i = 0; i < STREAK_POOL; i++) {
      const s = streaks[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      if (!s.active) {
        mesh.visible = false;
        continue;
      }
      s.life += dt / 0.9;
      if (s.life >= 1) {
        s.active = false;
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      s.pos.addScaledVector(s.dir, s.speed * dt);
      mesh.position.copy(s.pos);
      materials[i].opacity = Math.sin(s.life * Math.PI) * night;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {materials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          geometry={streakGeometry}
          material={material}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
