import * as THREE from 'three'
import { sceneColors } from '../sceneColors'
import { FOG_DENSITY } from '../layout'
import { STAGGER_RATIO } from './fragmentSettle'

/**
 * World typography shader. Two forms share one draw call:
 * - voxel (`aStyle.z ≥ 0.5`): opaque lit matter — cubes or relief bricks
 * - flat: thin atlas plates for cheap signage
 */

const vertexShader = /* glsl */ `
attribute vec3 aChaos;
attribute vec3 aHome;
attribute vec4 aQuat;
attribute vec3 aAxis;
attribute vec4 aRect;
attribute vec3 aSize;
attribute float aSeed;
attribute vec4 aWindow;
attribute vec3 aStyle;

uniform float uBuild;
uniform float uTime;
uniform float uVelocity;
uniform float uFogDensity;
uniform float uStaggerRatio;

varying vec2 vAtlasUv;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vAccent;
varying float vWeight;
varying float vFog;
varying float vVoxel;
varying float vGlyphFace;

vec4 quatFromAxisAngle(vec3 axis, float angle) {
  float halfAngle = angle * 0.5;
  return vec4(normalize(axis) * sin(halfAngle), cos(halfAngle));
}

vec4 quatMul(vec4 a, vec4 b) {
  return vec4(
    a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz),
    a.w * b.w - dot(a.xyz, b.xyz)
  );
}

vec3 applyQuat(vec3 v, vec4 q) {
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
  float span = max(aWindow.y, 0.0001);
  float delay = aSeed * span * uStaggerRatio;
  float travel = max(span * (1.0 - uStaggerRatio), 0.0001);
  float arrive = clamp((uBuild - (aWindow.x + delay)) / travel, 0.0, 1.0);
  arrive = arrive * arrive * (3.0 - 2.0 * arrive);

  float exitSpan = max(aWindow.w, 0.0001);
  float leaving = clamp((uBuild - aWindow.z - aSeed * exitSpan * 0.5) / exitSpan, 0.0, 1.0);
  leaving = leaving * leaving * (3.0 - 2.0 * leaving);

  float settled = arrive * (1.0 - leaving);
  // Snap transform home before alpha fully locks — residual spin reads as
  // double-exposed type once the letter is mostly on its plate.
  float lock = smoothstep(0.72, 0.96, settled);
  float loose = 1.0 - lock;
  float speed = clamp(abs(uVelocity) * 0.012, 0.0, 1.5) * loose;

  vec3 local = position * aSize;
  vec4 spin = quatFromAxisAngle(aAxis, loose * (2.2 + aSeed * 4.6) * (1.0 + speed * 0.4));
  vec4 orient = quatMul(aQuat, spin);
  vec3 rotated = applyQuat(local, orient);
  vec3 rotatedN = applyQuat(normal, orient);

  vec3 centre = mix(aChaos, aHome, lock);
  centre += aAxis * sin(uTime * 0.75 + aSeed * 6.2831) * 0.14 * loose * (1.0 + speed * 0.5);

  vec4 world = modelMatrix * vec4(centre + rotated, 1.0);
  vec4 viewPos = viewMatrix * world;

  vAtlasUv = mix(aRect.xy, aRect.zw, uv);
  vNormalW = normalize(mat3(modelMatrix) * rotatedN);
  vViewDir = normalize(cameraPosition - world.xyz);
  vSettled = settled;
  vAccent = aStyle.x;
  vWeight = aStyle.y * (1.0 - leaving * 0.85);
  vVoxel = step(0.5, aStyle.z);
  // Local ±Z faces of the unit box — the readable plate for flat glyphs.
  vGlyphFace = step(0.5, abs(normal.z));

  float depth = length(viewPos.xyz);
  vFog = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);

  gl_Position = projectionMatrix * viewPos;
}
`

const fragmentShader = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec3 uFogColor;
uniform float uLive;
uniform float uOpacity;

varying vec2 vAtlasUv;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vAccent;
varying float vWeight;
varying float vFog;
varying float vVoxel;
varying float vGlyphFace;

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
  float spec = pow(max(dot(reflect(-keyLight, normal), view), 0.0), 36.0);
  float lit = mix(0.35, 1.0, vSettled);
  // Bloom loves hot edges — keep settled type matte enough to stay sharp.
  float bloomGuard = mix(1.0, 0.35, smoothstep(0.7, 1.0, vSettled));

  vec3 tint = mix(uInk, uAccent, clamp(vAccent + uLive * 0.18, 0.0, 1.0));
  vec3 shade = tint * (0.28 + key * 0.5 + fill * 0.2);
  shade += tint * spec * lit * 0.22 * bloomGuard;
  shade += uAccent * fresnel * lit * (0.08 + uLive * 0.28) * bloomGuard;
  shade += uAccent * (1.0 - vSettled) * 0.12;

  float alpha = 1.0;

  if (vVoxel < 0.5) {
    // Plate faces only — side/atlas-on-box sampling stacked mirrored ink.
    if (vGlyphFace < 0.5) discard;
    // Locked letters: drop the back face (DoubleSide + no depthWrite = ghost).
    if (vSettled > 0.8 && !gl_FrontFacing) discard;
    float coverage = texture(uAtlas, vAtlasUv).a;
    float ink = smoothstep(0.36, 0.5, coverage);
    if (ink < 0.02) discard;
    // Flat readable ink — less shade modelling that softens strokes.
    shade = tint * (0.72 + key * 0.28);
    // Dim while flying; full contrast only once home (matches transform lock).
    alpha = ink * mix(0.18, 1.0, smoothstep(0.25, 0.88, vSettled));
  } else {
    // Relief / stack matter: darken side facets so elongated depth reads like
    // bay columns, not a flat grid of cubes.
    float faceBias = mix(0.55, 1.0, vGlyphFace);
    shade *= faceBias;
    shade += tint * key * vGlyphFace * 0.12 * lit;
  }

  alpha *= vWeight * uOpacity;
  // Fog wash was eating contrast on corridor signage and Contact.
  alpha *= 1.0 - vFog * mix(0.85, 0.45, smoothstep(0.65, 1.0, vSettled));
  if (alpha < 0.02) discard;

  shade = mix(shade, uFogColor, vFog * mix(0.75, 0.35, smoothstep(0.65, 1.0, vSettled)));
  fragColor = vec4(shade, clamp(alpha, 0.0, 1.0));
}
`

export interface GlyphSync {
  build: number
  live: number
  time: number
  velocity: number
  opacity: number
}

export class GlyphMaterial extends THREE.ShaderMaterial {
  constructor(atlas: THREE.Texture) {
    super({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uAtlas: { value: atlas },
        uBuild: { value: 0 },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uLive: { value: 0 },
        uOpacity: { value: 1 },
        uFogDensity: { value: FOG_DENSITY },
        uStaggerRatio: { value: STAGGER_RATIO },
        uInk: { value: sceneColors.ink.clone() },
        uAccent: { value: sceneColors.accent.clone() },
        uFogColor: { value: sceneColors.base.clone() },
      },
    })
  }

  sync(state: GlyphSync) {
    const { uniforms } = this
    uniforms.uBuild.value = state.build
    uniforms.uLive.value = state.live
    uniforms.uTime.value = state.time
    uniforms.uVelocity.value = state.velocity
    uniforms.uOpacity.value = state.opacity
    uniforms.uInk.value.copy(sceneColors.ink)
    uniforms.uAccent.value.copy(sceneColors.accent)
    uniforms.uFogColor.value.copy(sceneColors.base)
    // Mixed voxels + transparent atlas plates — never write depth from this
    // draw call or thin signage punches holes through panels behind it.
  }
}
