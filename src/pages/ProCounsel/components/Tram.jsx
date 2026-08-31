import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_CURVE, RAIL_LIFT, tramMotion } from '../trackData';
import { NEON_CYAN, STUDENT_CYAN } from '../colors';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const UP = new THREE.Vector3(0, 1, 0);
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _tanAhead = new THREE.Vector3();
const _side = new THREE.Vector3();
const _look = new THREE.Vector3();

// Shared geometries / materials (created once).
const bodyGeom = new THREE.CapsuleGeometry(0.55, 2.3, 6, 12);
const bodyMat = new THREE.MeshStandardMaterial({
  color: '#141830',
  roughness: 0.35,
  metalness: 0.75,
});
const windowGeom = new THREE.BoxGeometry(1.14, 0.34, 2.1);
// HDR emissives (> 1): the windows and roof strip genuinely glow under bloom.
const windowMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#c9f7ff').multiplyScalar(2.1),
  toneMapped: false,
});
const roofStripGeom = new THREE.BoxGeometry(0.16, 0.05, 2.4);
const roofStripMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(NEON_CYAN).multiplyScalar(2.6),
  toneMapped: false,
});
const beamGeom = new THREE.ConeGeometry(0.65, 3.2, 12, 1, true);
const beamMat = new THREE.MeshBasicMaterial({
  color: '#aef4ff',
  transparent: true,
  opacity: 0.16,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  toneMapped: false,
  fog: false,
});
const tailGeom = new THREE.SphereGeometry(0.09, 8, 8);
const tailMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#fb7185').multiplyScalar(2.4),
  toneMapped: false,
});
// The student silhouette, seen against the lit windows.
const silhouetteBodyGeom = new THREE.CapsuleGeometry(0.09, 0.16, 4, 8);
const silhouetteHeadGeom = new THREE.SphereGeometry(0.075, 8, 8);
const silhouetteMat = new THREE.MeshBasicMaterial({
  color: '#050810',
  toneMapped: false,
});
const seatGlowGeom = new THREE.SphereGeometry(0.05, 6, 6);
const seatGlowMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(STUDENT_CYAN).multiplyScalar(2),
  toneMapped: false,
});

/**
 * The glowing metro tram. Reads the shared tramMotion state (written by the
 * scene driver earlier in the frame), places itself on the curve, orients
 * along the tangent and banks slightly into curves. Matrix work is skipped
 * when the scroll position hasn't materially changed.
 */
export default function Tram() {
  const groupRef = useRef();
  const prefersReducedMotion = useReducedMotion();
  const lastT = useRef(-1);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const t = tramMotion.t;
    if (Math.abs(t - lastT.current) < 1e-5 && lastT.current >= 0) return;
    lastT.current = t;

    TRACK_CURVE.getPointAt(t, _pos);
    TRACK_CURVE.getTangentAt(t, _tan);
    _pos.y += RAIL_LIFT;
    group.position.copy(_pos);

    // Face direction of travel (+Z of the model points forward).
    _look.copy(_pos).add(_tan);
    group.lookAt(_look);

    if (!prefersReducedMotion) {
      // Bank into curves: compare the tangent slightly ahead with the current
      // one, projected on the lateral axis.
      TRACK_CURVE.getTangentAt(Math.min(t + 0.015, 1), _tanAhead);
      _side.crossVectors(UP, _tan).setY(0).normalize();
      const lateral =
        (_tanAhead.x - _tan.x) * _side.x + (_tanAhead.z - _tan.z) * _side.z;
      const bank = THREE.MathUtils.clamp(lateral * 5, -0.3, 0.3);
      group.rotateZ(bank);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body: capsule laid along the direction of travel, resting just
          above the rails (group origin is RAIL_LIFT above the curve). */}
      <mesh
        geometry={bodyGeom}
        material={bodyMat}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.2, 0]}
      />
      {/* Emissive window band (pokes out both flanks) */}
      <mesh geometry={windowGeom} material={windowMat} position={[0, 0.34, 0]} />
      {/* Roof light strip */}
      <mesh
        geometry={roofStripGeom}
        material={roofStripMat}
        position={[0, 0.79, 0]}
      />
      {/* Student silhouette in the window, one on each flank */}
      <group position={[0.585, 0.32, 0.25]}>
        <mesh geometry={silhouetteBodyGeom} material={silhouetteMat} />
        <mesh
          geometry={silhouetteHeadGeom}
          material={silhouetteMat}
          position={[0, 0.21, 0]}
        />
        <mesh
          geometry={seatGlowGeom}
          material={seatGlowMat}
          position={[0, -0.14, 0.16]}
        />
      </group>
      <group position={[-0.585, 0.32, 0.25]}>
        <mesh geometry={silhouetteBodyGeom} material={silhouetteMat} />
        <mesh
          geometry={silhouetteHeadGeom}
          material={silhouetteMat}
          position={[0, 0.21, 0]}
        />
      </group>
      {/* Headlight: point light + additive beam cone */}
      <pointLight
        position={[0, 0.2, 1.9]}
        color="#bff3ff"
        intensity={10}
        distance={16}
        decay={1.8}
      />
      <mesh
        geometry={beamGeom}
        material={beamMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.2, 3.2]}
      />
      {/* Tail lights */}
      <mesh
        geometry={tailGeom}
        material={tailMat}
        position={[0.3, 0.2, -1.85]}
      />
      <mesh
        geometry={tailGeom}
        material={tailMat}
        position={[-0.3, 0.2, -1.85]}
      />
    </group>
  );
}
