import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cityState } from '../timeOfDay';
import { glowTexture } from './SkyEffects';

/**
 * Floating dust motes - one Points cloud drifting low over the city,
 * catching the golden dusk light (opacity follows cityState.duskRay, so
 * they only exist around sunset). One draw call; the drift is a slow
 * rotation + bob of the whole cloud, so per-frame cost is near zero.
 */

const MOTE_COUNT = 180;

function buildMoteGeometry() {
  const positions = new Float32Array(MOTE_COUNT * 3);
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < MOTE_COUNT; i++) {
    positions[i * 3] = (rand() - 0.5) * 64;
    positions[i * 3 + 1] = 0.4 + rand() * 13;
    positions[i * 3 + 2] = -26 + rand() * 42;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

const moteGeometry = buildMoteGeometry();

export function DustMotes({ reducedMotion = false }) {
  const pointsRef = useRef();

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: '#ffd9a0',
        size: 0.34,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    []
  );

  useEffect(
    () => () => {
      material.dispose();
    },
    [material]
  );

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const dusk = cityState.duskRay;
    if (dusk < 0.02) {
      points.visible = false;
      return; // outside golden hour: no work at all
    }
    points.visible = true;
    material.opacity = dusk * 0.5;
    if (!reducedMotion) {
      points.rotation.y += Math.min(delta, 0.05) * 0.018;
      points.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.4;
    }
  });

  return (
    <points
      ref={pointsRef}
      geometry={moteGeometry}
      material={material}
      visible={false}
      frustumCulled={false}
    />
  );
}
