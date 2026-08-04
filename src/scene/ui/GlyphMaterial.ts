import * as THREE from 'three'
import { sceneColors } from '../sceneColors'
import { FOG_DENSITY } from '../layout'
import { STAGGER_RATIO } from './fragmentSettle'

/**
 * The typography half of the signature. Same three stages as
 * `ReconstructMaterial` — wire → solid → lit — but the "wire" is the fragment's
 * own quad frame and the "solid" is the glyph ink from the atlas. Every fragment
 * flies chaos → home on the GPU, so scrolling the whole page's copy into place
 * costs uniform writes and nothing else on the CPU.
 */

const vertexShader = /* glsl */ `
attribute vec3 aChaos;
attribute vec3 aHome;
attribute vec4 aQuat;
attribute vec3 aAxis;
attribute vec4 aRect;
attribute vec2 aSize;
attribute float aSeed;
/** enter, span, exit, exitSpan — the block's slice of the scroll. */
attribute vec4 aWindow;
attribute vec3 aStyle;

uniform float uBuild;
uniform float uTime;
uniform float uVelocity;
uniform float uFogDensity;
uniform float uStaggerRatio;

varying vec2 vAtlasUv;
varying vec2 vQuadUv;
varying float vSettled;
varying float vAccent;
varying float vWeight;
varying float vFrame;
varying float vFog;

// Spelled out because "half" is a reserved word in GLSL.
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
  // Each block owns a slice of the scroll; each fragment delays inside it.
  float span = max(aWindow.y, 0.0001);
  float stagger = aWindow.x + aSeed * span * uStaggerRatio;
  float arrive = clamp((uBuild - stagger) / span, 0.0, 1.0);
  arrive = arrive * arrive * (3.0 - 2.0 * arrive);

  // Past its moment a block comes apart again and drifts back into the void,
  // which is also what keeps a hero headline from occluding the next section.
  float exitSpan = max(aWindow.w, 0.0001);
  float leaving = clamp((uBuild - aWindow.z - aSeed * exitSpan * 0.5) / exitSpan, 0.0, 1.0);
  leaving = leaving * leaving * (3.0 - 2.0 * leaving);

  float settled = arrive * (1.0 - leaving);
  float loose = 1.0 - settled;
  float speed = clamp(abs(uVelocity) * 0.012, 0.0, 1.5);

  vec3 local = vec3(position.xy * aSize, 0.0);
  vec4 spin = quatFromAxisAngle(aAxis, loose * (2.2 + aSeed * 4.6) * (1.0 + speed * 0.4));
  vec3 rotated = applyQuat(local, quatMul(aQuat, spin));

  vec3 centre = mix(aChaos, aHome, settled);
  centre += aAxis * sin(uTime * 0.75 + aSeed * 6.2831) * 0.14 * loose * (1.0 + speed * 0.5);

  vec4 world = modelMatrix * vec4(centre + rotated, 1.0);
  vec4 viewPos = viewMatrix * world;

  vAtlasUv = mix(aRect.xy, aRect.zw, uv);
  vQuadUv = uv;
  vSettled = settled;
  vAccent = aStyle.x;
  vWeight = aStyle.y * (1.0 - leaving * 0.85);
  vFrame = aStyle.z;

  // Matches THREE.FogExp2 so world copy dissolves into the same void as the room.
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
varying vec2 vQuadUv;
varying float vSettled;
varying float vAccent;
varying float vWeight;
varying float vFrame;
varying float vFog;

layout(location = 0) out vec4 fragColor;

void main() {
  float coverage = texture(uAtlas, vAtlasUv).a;
  float ink = smoothstep(0.40, 0.56, coverage);

  // Wire stage: the fragment's own outline, one pixel wide at any depth.
  vec2 border = min(vQuadUv, 1.0 - vQuadUv);
  float distance = min(border.x, border.y);
  float width = fwidth(distance) * 1.5;
  float frame = (1.0 - smoothstep(0.0, width, distance)) * vFrame;

  float wire = frame * 0.6 + ink * 0.22;
  float alpha = mix(wire, ink, vSettled) * vWeight * uOpacity;
  alpha *= 1.0 - vFog * 0.9;
  if (alpha < 0.004) discard;

  vec3 tint = mix(uInk, uAccent, clamp(vAccent + uLive * 0.3, 0.0, 1.0));
  vec3 color = tint * (0.6 + vSettled * 0.4);
  // The same hint of heat the loose shards carry, so both layers read as one system.
  color += uAccent * (1.0 - vSettled) * 0.24;
  color = mix(color, uFogColor, vFog);

  fragColor = vec4(color, clamp(alpha, 0.0, 1.0));
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
      // Fragments tumble through every orientation before they settle.
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
  }
}
