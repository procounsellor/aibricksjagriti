import * as THREE from 'three';

/**
 * Shared "volumetric" light-column building blocks (same trick as the other
 * scenes): an open-ended unit cylinder + a cheap additive ShaderMaterial
 * whose alpha falls off toward the top. ShaderMaterial skips three's fog and
 * tonemapping chunks, so HDR colors > 1 survive to the composer and feed
 * the Bloom pass directly.
 */

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
