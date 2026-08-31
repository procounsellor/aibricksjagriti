import React, { useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { TRACK_CURVE, GROUND_Y } from '../trackData';

const UP = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D();
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _side = new THREE.Vector3();
const _color = new THREE.Color();

const COUNT = 160;

// Deterministic PRNG so the skyline is stable across renders.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Procedural emissive-window texture: dark facade with lit window dots.
function makeWindowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const g = canvas.getContext('2d');
  g.fillStyle = '#0b0b1a';
  g.fillRect(0, 0, 64, 128);
  const rand = mulberry32(1337);
  const litColors = ['#8be9ff', '#c4b5fd', '#f9a8d4', '#fde68a', '#e0f2fe'];
  for (let y = 6; y < 124; y += 8) {
    for (let x = 5; x < 60; x += 9) {
      const r = rand();
      if (r < 0.42) {
        g.fillStyle = litColors[Math.floor(rand() * litColors.length)];
        g.globalAlpha = 0.55 + rand() * 0.45;
        g.fillRect(x, y, 4, 3);
      } else if (r < 0.55) {
        g.fillStyle = '#1d1d38';
        g.globalAlpha = 1;
        g.fillRect(x, y, 4, 3);
      }
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const buildingGeom = new THREE.BoxGeometry(1, 1, 1);

/**
 * Neon-city skyline: ONE InstancedMesh of dark towers flanking the track,
 * facades textured with a small procedural window CanvasTexture (no network
 * assets), tinted per instance. Fog swallows the far end. 1 draw call.
 */
export default function CityBackdrop() {
  const meshRef = useRef();

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: makeWindowTexture(),
      }),
    []
  );

  useEffect(
    () => () => {
      if (material.map) material.map.dispose();
      material.dispose();
    },
    [material]
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rand = mulberry32(20260831);

    for (let i = 0; i < COUNT; i++) {
      const t = rand();
      TRACK_CURVE.getPointAt(t, _pos);
      TRACK_CURVE.getTangentAt(t, _tan);
      _side.crossVectors(UP, _tan).setY(0).normalize();

      const sideSign = i % 2 === 0 ? 1 : -1;
      const lateral = (13 + rand() * 30) * sideSign;
      const along = (rand() - 0.5) * 16;

      const h = 5 + Math.pow(rand(), 1.6) * 26;
      const sx = 3 + rand() * 5.5;
      const sz = 3 + rand() * 5.5;

      _dummy.position.set(
        _pos.x + _side.x * lateral + _tan.x * along,
        GROUND_Y + h / 2,
        _pos.z + _side.z * lateral + _tan.z * along
      );
      _dummy.rotation.set(0, Math.atan2(_tan.x, _tan.z) + (rand() - 0.5) * 0.5, 0);
      _dummy.scale.set(sx, h, sz);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      // Mostly cool dark tints, occasionally a warmer neon-washed tower.
      const warm = rand() < 0.18;
      _color.setHSL(
        warm ? 0.85 + rand() * 0.08 : 0.58 + rand() * 0.12,
        0.35 + rand() * 0.3,
        0.55 + rand() * 0.3
      );
      mesh.setColorAt(i, _color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[buildingGeom, material, COUNT]}
      frustumCulled={false}
    />
  );
}
