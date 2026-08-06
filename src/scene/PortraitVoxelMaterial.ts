import * as THREE from 'three'
import { FOG_DENSITY } from './layout'
import { sceneColors } from './sceneColors'
import { STAGGER_RATIO } from './ui/fragmentSettle'

/**
 * Coloured voxel shards for the About headshot. Same settle contract as world
 * typography (STAGGER_RATIO + hermite), but each instance carries RGB instead
 * of an atlas rect.
 */

const vertexShader = /* glsl */ `
attribute vec3 aChaos;
attribute vec3 aHome;
attribute vec3 aColor;
attribute vec3 aAxis;
attribute float aSeed;
attribute float aSize;

uniform float uBuild;
uniform float uTime;
uniform float uVelocity;
uniform float uFogDensity;
uniform float uStaggerRatio;
uniform vec4 uWindow;

varying vec3 vColor;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vFog;

vec4 quatFromAxisAngle(vec3 axis, float angle) {
  float halfAngle = angle * 0.5;
  return vec4(normalize(axis) * sin(halfAngle), cos(halfAngle));
}

vec3 applyQuat(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  float span = max(uWindow.y, 0.0001);
  float delay = aSeed * span * uStaggerRatio;
  float travel = max(span * (1.0 - uStaggerRatio), 0.0001);
  float arrive = clamp((uBuild - (uWindow.x + delay)) / travel, 0.0, 1.0);
  arrive = arrive * arrive * (3.0 - 2.0 * arrive);

  float exitSpan = max(uWindow.w, 0.0001);
  float leaving = clamp((uBuild - uWindow.z - aSeed * exitSpan * 0.5) / exitSpan, 0.0, 1.0);
  leaving = leaving * leaving * (3.0 - 2.0 * leaving);

  float settled = arrive * (1.0 - leaving);
  // Snap home early so the face locks as a readable plate, not tumbling gravel.
  float lock = smoothstep(0.7, 0.95, settled);
  float loose = 1.0 - lock;
  float speed = clamp(abs(uVelocity) * 0.012, 0.0, 1.5) * loose;

  vec3 local = position * aSize;
  vec4 spin = quatFromAxisAngle(aAxis, loose * (2.0 + aSeed * 4.2) * (1.0 + speed * 0.35));
  vec3 rotated = applyQuat(local, spin);
  vec3 rotatedN = applyQuat(normal, spin);

  vec3 centre = mix(aChaos, aHome, lock);
  centre += aAxis * sin(uTime * 0.7 + aSeed * 6.2831) * 0.08 * loose * (1.0 + speed * 0.4);

  vec4 world = modelMatrix * vec4(centre + rotated, 1.0);
  vec4 viewPos = viewMatrix * world;

  vColor = aColor;
  vNormalW = normalize(mat3(modelMatrix) * rotatedN);
  vViewDir = normalize(cameraPosition - world.xyz);
  vSettled = settled;

  float depth = length(viewPos.xyz);
  vFog = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);

  gl_Position = projectionMatrix * viewPos;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uFogColor;
uniform float uLive;
uniform float uOpacity;

varying vec3 vColor;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vFog;

layout(location = 0) out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormalW);
  if (!gl_FrontFacing) normal = -normal;
  vec3 view = normalize(vViewDir);
  vec3 keyLight = normalize(vec3(0.45, 0.82, 0.34));
  vec3 fillLight = normalize(vec3(-0.6, 0.3, -0.5));

  float key = max(dot(normal, keyLight), 0.0);
  float fill = max(dot(normal, fillLight), 0.0) * 0.35;
  float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.6);
  float spec = pow(max(dot(reflect(-keyLight, normal), view), 0.0), 40.0);
  float lit = mix(0.4, 1.0, vSettled);

  // Lift midtones so skin/hair survive corridor fog instead of washing to grey.
  vec3 albedo = pow(max(vColor, vec3(0.0)), vec3(0.85)) * 1.22;
  vec3 shade = albedo * (0.42 + key * 0.58 + fill * 0.3);
  shade += albedo * spec * lit * 0.22;
  shade += uAccent * fresnel * lit * (0.06 + uLive * 0.22);
  shade += uAccent * (1.0 - vSettled) * 0.08;

  float alpha = (0.82 + vSettled * 0.18) * uOpacity;
  alpha *= 1.0 - vFog * 0.28;
  if (alpha < 0.02) discard;

  shade = mix(shade, uFogColor, vFog * 0.22);
  fragColor = vec4(shade, clamp(alpha, 0.0, 1.0));
}
`

export interface PortraitVoxelSync {
  build: number
  live: number
  time: number
  velocity: number
  opacity: number
  enter: number
  span: number
  exit: number
  exitSpan: number
}

export class PortraitVoxelMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      uniforms: {
        uBuild: { value: 0 },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uLive: { value: 0 },
        uOpacity: { value: 0 },
        uFogDensity: { value: FOG_DENSITY },
        uStaggerRatio: { value: STAGGER_RATIO },
        uWindow: { value: new THREE.Vector4(0, 1, 1, 0.05) },
        uAccent: { value: sceneColors.accent.clone() },
        uFogColor: { value: sceneColors.base.clone() },
      },
    })
  }

  sync(state: PortraitVoxelSync) {
    const { uniforms } = this
    uniforms.uBuild.value = state.build
    uniforms.uLive.value = state.live
    uniforms.uTime.value = state.time
    uniforms.uVelocity.value = state.velocity
    uniforms.uOpacity.value = state.opacity
    uniforms.uWindow.value.set(
      state.enter,
      state.span,
      state.exit,
      state.exitSpan,
    )
    uniforms.uAccent.value.copy(sceneColors.accent)
    uniforms.uFogColor.value.copy(sceneColors.base)
    this.depthWrite = state.opacity > 0.85
  }
}
