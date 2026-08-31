import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { TRACK_CURVE, GROUND_Y } from '../trackData';
import { TRACK_GLOW, RAIL_DIM, TIE_DARK, STRUCTURE_DARK } from '../colors';

const UP = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D();
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();

// Shared static materials (module-level: created once for the app lifetime).
// The centre glow tube runs HOT (color > 1) so it bleeds through the bloom.
const glowMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(TRACK_GLOW).multiplyScalar(1.9),
  toneMapped: false,
  transparent: true,
  opacity: 0.9,
});
const railMat = new THREE.MeshBasicMaterial({
  color: RAIL_DIM,
  toneMapped: false,
});
const tieMat = new THREE.MeshStandardMaterial({
  color: TIE_DARK,
  roughness: 0.9,
  metalness: 0.2,
});
const pylonMat = new THREE.MeshStandardMaterial({
  color: STRUCTURE_DARK,
  roughness: 0.95,
});

const tieGeom = new THREE.BoxGeometry(1.5, 0.07, 0.24);
const pylonGeom = new THREE.CylinderGeometry(0.12, 0.2, 1, 6);

const TIE_COUNT = 170;
const PYLON_COUNT = 56;

// Build an offset copy of the track curve (for the two parallel rails).
function buildOffsetCurve(offset) {
  const pts = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = TRACK_CURVE.getPointAt(t);
    const tan = TRACK_CURVE.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(UP, tan).setY(0).normalize();
    pts.push(p.clone().addScaledVector(side, offset));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

/**
 * The glowing metro line: one emissive centre tube, two dim parallel rails,
 * instanced cross-ties and instanced support pylons down to the city ground.
 * Fully static — everything is positioned once on mount.
 * Draw calls: 3 tubes + 2 instanced meshes = 5.
 */
export default function NeonTrack() {
  const tiesRef = useRef();
  const pylonsRef = useRef();

  const { glowGeom, railGeomL, railGeomR } = useMemo(() => {
    const glow = new THREE.TubeGeometry(TRACK_CURVE, 260, 0.055, 6, false);
    const left = new THREE.TubeGeometry(
      buildOffsetCurve(-0.55),
      200,
      0.035,
      4,
      false
    );
    const right = new THREE.TubeGeometry(
      buildOffsetCurve(0.55),
      200,
      0.035,
      4,
      false
    );
    return { glowGeom: glow, railGeomL: left, railGeomR: right };
  }, []);

  useLayoutEffect(() => {
    // Cross-ties: flat bars under the rails, oriented along the curve.
    if (tiesRef.current) {
      for (let i = 0; i < TIE_COUNT; i++) {
        const t = (i + 0.5) / TIE_COUNT;
        TRACK_CURVE.getPointAt(t, _pos);
        TRACK_CURVE.getTangentAt(t, _tan);
        _dummy.position.set(_pos.x, _pos.y - 0.09, _pos.z);
        _look.copy(_pos).add(_tan);
        _dummy.lookAt(_look);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        tiesRef.current.setMatrixAt(i, _dummy.matrix);
      }
      tiesRef.current.instanceMatrix.needsUpdate = true;
      tiesRef.current.computeBoundingSphere();
    }

    // Support pylons: stretched from the ground up to the elevated track.
    if (pylonsRef.current) {
      for (let i = 0; i < PYLON_COUNT; i++) {
        const t = (i + 0.5) / PYLON_COUNT;
        TRACK_CURVE.getPointAt(t, _pos);
        const height = _pos.y - 0.1 - GROUND_Y;
        _dummy.position.set(_pos.x, GROUND_Y + height / 2, _pos.z);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, height, 1);
        _dummy.updateMatrix();
        pylonsRef.current.setMatrixAt(i, _dummy.matrix);
      }
      pylonsRef.current.instanceMatrix.needsUpdate = true;
      pylonsRef.current.computeBoundingSphere();
    }
  }, []);

  useLayoutEffect(
    () => () => {
      glowGeom.dispose();
      railGeomL.dispose();
      railGeomR.dispose();
    },
    [glowGeom, railGeomL, railGeomR]
  );

  return (
    <group>
      <mesh geometry={glowGeom} material={glowMat} />
      <mesh geometry={railGeomL} material={railMat} />
      <mesh geometry={railGeomR} material={railMat} />
      <instancedMesh
        ref={tiesRef}
        args={[tieGeom, tieMat, TIE_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pylonsRef}
        args={[pylonGeom, pylonMat, PYLON_COUNT]}
        frustumCulled={false}
      />
    </group>
  );
}
