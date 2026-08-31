import * as THREE from 'three';

/**
 * Shared "volumetric" light-column building blocks: an open-ended unit
 * cylinder plus a factory for a cheap additive shader material whose alpha
 * falls off toward the top (vertical uv gradient). Used by the AI core's
 * sky beacon and by the pooled match-event pillars.
 *
 * ShaderMaterial skips three's fog + tonemapping chunks entirely, so HDR
 * color values > 1 survive to the composer and feed the bloom pass.
 */

// Unit column: radius flares slightly toward the base, open ended, uv.y = 0
// at the bottom and 1 at the top of the side wall.
export const columnGeometry = new THREE.CylinderGeometry(0.7, 1, 1, 12, 1, true);

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 1.7) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function makeColumnMaterial(hexColor, hdrScale = 2.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(hexColor).multiplyScalar(hdrScale) },
      uOpacity: { value: 0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
