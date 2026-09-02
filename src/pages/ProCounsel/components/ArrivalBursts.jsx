import React, {
  useMemo,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WALK_LIFT } from '../trackData';

const COUNT = 80;
const LIFE_SECONDS = 0.9;

const burstMat = new THREE.PointsMaterial({
  size: 0.26,
  vertexColors: true,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true,
  toneMapped: false,
  fog: false,
});

/**
 * A single pre-allocated particle pool for checkpoint-arrival spark bursts.
 * The scene driver calls `trigger(checkpoint)` imperatively when the student
 * crosses a checkpoint t — no setState, no allocation in the frame loop.
 * 1 draw call while active, hidden otherwise.
 */
const ArrivalBursts = forwardRef(function ArrivalBursts(props, ref) {
  const pointsRef = useRef();
  const state = useRef({
    active: false,
    life: 0,
    origin: new THREE.Vector3(),
    // per-particle unit direction * speed
    vel: new Float32Array(COUNT * 3),
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3)
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3)
    );
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useImperativeHandle(
    ref,
    () => ({
      trigger: (checkpoint) => {
        const s = state.current;
        const points = pointsRef.current;
        if (!points) return;
        s.origin.copy(checkpoint.position);
        s.origin.y += WALK_LIFT + 0.9;
        const vel = s.vel;
        const colors = geometry.attributes.color.array;
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < COUNT; i++) {
          // Random direction on a sphere, biased slightly upward.
          const theta = Math.random() * Math.PI * 2;
          const z = Math.random() * 2 - 1;
          const r = Math.sqrt(Math.max(0, 1 - z * z));
          const speed = 0.5 + Math.random() * 1;
          const vi = i * 3;
          vel[vi] = r * Math.cos(theta) * speed;
          vel[vi + 1] = (z * 0.7 + 0.5) * speed;
          vel[vi + 2] = r * Math.sin(theta) * speed;
          // Checkpoint accent color with brightness variation, pushed into
          // HDR so the burst sprays real bloom.
          const bright = 1.3 + Math.random() * 1.1;
          colors[vi] = checkpoint.color.r * bright;
          colors[vi + 1] = checkpoint.color.g * bright;
          colors[vi + 2] = checkpoint.color.b * bright;
          positions[vi] = s.origin.x;
          positions[vi + 1] = s.origin.y;
          positions[vi + 2] = s.origin.z;
        }
        geometry.attributes.color.needsUpdate = true;
        geometry.attributes.position.needsUpdate = true;
        s.life = 1;
        s.active = true;
        points.visible = true;
        burstMat.opacity = 1;
      },
    }),
    [geometry]
  );

  useFrame((_, delta) => {
    const s = state.current;
    const points = pointsRef.current;
    if (!s.active || !points) return;

    s.life -= Math.min(delta, 0.05) / LIFE_SECONDS;
    if (s.life <= 0) {
      s.active = false;
      points.visible = false;
      return;
    }

    const progress = 1 - s.life;
    // Fast expansion that decelerates (ease-out).
    const radius = (1 - Math.pow(1 - progress, 2)) * 3.4;
    const droop = progress * progress * 1.6;
    const positions = geometry.attributes.position.array;
    const vel = s.vel;
    for (let i = 0; i < COUNT; i++) {
      const vi = i * 3;
      positions[vi] = s.origin.x + vel[vi] * radius;
      positions[vi + 1] = s.origin.y + vel[vi + 1] * radius - droop;
      positions[vi + 2] = s.origin.z + vel[vi + 2] * radius;
    }
    geometry.attributes.position.needsUpdate = true;
    burstMat.opacity = s.life;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={burstMat}
      visible={false}
      frustumCulled={false}
    />
  );
});

export default ArrivalBursts;
