import * as THREE from 'three'
import { sceneColors } from './sceneColors'

const vertexShader = /* glsl */ `
attribute vec3 aBary;
attribute vec3 aCenter;
attribute vec3 aAxis;
attribute float aSeed;

uniform float uBuild;
uniform float uTime;
uniform float uSpread;
uniform float uJitter;
uniform float uVelocity;
uniform float uDepthSpan;
uniform float uBuildBias;
uniform float uDrift;
/** 1 = CPU places instances; skip per-shard assemble (avoids fighting JS paths). */
uniform float uCpuPlaced;

varying vec3 vBary;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vWorldY;
varying float vAssembled;

// Axis-angle rotation, written column-major for GLSL.
mat3 rotateAxis(vec3 rawAxis, float angle) {
  vec3 a = normalize(rawAxis);
  float s = sin(angle);
  float c = cos(angle);
  float t = 1.0 - c;
  return mat3(
    t * a.x * a.x + c,       t * a.x * a.y + s * a.z, t * a.x * a.z - s * a.y,
    t * a.x * a.y - s * a.z, t * a.y * a.y + c,       t * a.y * a.z + s * a.x,
    t * a.x * a.z + s * a.y, t * a.y * a.z - s * a.x, t * a.z * a.z + c
  );
}

void main() {
  // Instance (or mesh) places the object; depth is read in world space so the
  // corridor assembles as a wave along the dolly rather than a global fade.
  mat4 instance = mat4(1.0);
  #ifdef USE_INSTANCING
    instance = instanceMatrix;
  #endif

  vec4 worldCenter = modelMatrix * instance * vec4(aCenter, 1.0);
  float depth = clamp((8.0 - worldCenter.z) / 30.0, 0.0, 1.0);

  // Seed + depth wave + optional bay bias. Hard-capped at 0.42 so every shard
  // is settled by build 0.78 — the BEAUTY → LIVE boundary / STILL_BUILD.
  float stagger = min(aSeed * 0.30 + depth * uDepthSpan + uBuildBias, 0.42);
  float assembled = clamp((uBuild - stagger) / 0.36, 0.0, 1.0);
  assembled = assembled * assembled * (3.0 - 2.0 * assembled);
  // Lattice: motion is CPU-driven; keep shards optically "in" so global
  // solid/lit stages carry the wire→solid→lit read without a second settle.
  assembled = mix(assembled, 1.0, uCpuPlaced);

  float loose = 1.0 - assembled;
  float speed = clamp(abs(uVelocity) * 0.012, 0.0, 1.5);

  mat3 spin = rotateAxis(aAxis, loose * (3.2 + aSeed * 5.4) * (1.0 + speed * 0.55) * uDrift);
  vec3 local = mix(position - aCenter, spin * (position - aCenter), uDrift);

  vec3 outward = normalize(aCenter + vec3(0.0, 0.0015, 0.0));
  float breathe = sin(uTime * 0.6 + aSeed * 6.2831) * uJitter * loose * (1.0 + speed * 0.65);
  vec3 drift = (outward * (loose * uSpread * (0.55 + aSeed)) + aAxis * breathe) * uDrift;

  vec4 worldPos = modelMatrix * instance * vec4(aCenter + drift + local, 1.0);

  vBary = aBary;
  vNormalW = normalize(mat3(modelMatrix) * mat3(instance) * mix(normal, spin * normal, uDrift));
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vWorldY = worldPos.y;
  vAssembled = assembled;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const fragmentShader = /* glsl */ `
uniform float uBuild;
uniform float uTime;
uniform float uFocus;
uniform float uLive;
uniform float uOpacity;
uniform vec3 uAccent;
uniform vec3 uInk;

varying vec3 vBary;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vWorldY;
varying float vAssembled;

// GLSL3 has no gl_FragColor; three aliases attribute/varying but not the output.
layout(location = 0) out vec4 fragColor;

void main() {
  // Barycentric wireframe: fwidth keeps the line one pixel wide at any depth.
  vec3 delta = fwidth(vBary);
  vec3 smoothed = smoothstep(vec3(0.0), delta * 1.5, vBary);
  float edge = 1.0 - min(min(smoothed.x, smoothed.y), smoothed.z);

  // Three overlapping stages: faces fill, then shading and rim light arrive.
  float solid = smoothstep(0.10, 0.62, uBuild);
  float lit = smoothstep(0.50, 0.90, uBuild);
  float wire = 1.0 - solid * 0.80;

  // Reconstruction band rides the scroll; time only breathes it slightly.
  float bandY = mix(-1.4, 5.8, uBuild) + sin(uTime * 0.22) * 0.28;
  float band = exp(-pow((vWorldY - bandY) * 2.1, 2.0));

  vec3 normal = normalize(vNormalW);
  vec3 view = normalize(vViewDir);
  vec3 keyLight = normalize(vec3(0.45, 0.82, 0.34));
  vec3 fillLight = normalize(vec3(-0.6, 0.3, -0.5));

  float key = max(dot(normal, keyLight), 0.0);
  float fill = max(dot(normal, fillLight), 0.0) * 0.35;
  float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.6);
  float spec = pow(max(dot(reflect(-keyLight, normal), view), 0.0), 42.0);

  vec3 face = uInk * (0.05 + key * 0.17 + fill * 0.1);
  face += uInk * spec * lit * 0.35;
  face = mix(face, uAccent * 0.4, uLive * fresnel * 0.55);

  vec3 edgeTint = mix(uInk, uAccent, max(uLive, uFocus * 0.75));
  float edgeGlow = edge * (0.26 + wire * 0.6 + uFocus * 0.55 + band * 0.7);

  vec3 rim = uAccent * fresnel * lit * (0.3 + uLive * 0.95 + uFocus * 0.55);

  vec3 color = face * solid + edgeTint * edgeGlow + rim;
  // A hint of heat on shards still in flight. Kept low: the accent is a 10%
  // colour in this system, and loose shards are most of the frame early on.
  color += uAccent * (1.0 - vAssembled) * 0.06;

  float alpha = solid * (0.40 + key * 0.32) + edgeGlow + fresnel * lit * 0.22;
  alpha *= uOpacity * mix(0.35, 1.0, vAssembled);

  if (alpha < 0.004) discard;
  fragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`

export interface ReconstructSync {
  build: number
  live: number
  focus: number
  time: number
  /** Lenis scroll velocity (px/frame scale). */
  velocity?: number
  /** Extra stagger delay for bay waves (0 → ~0.2). */
  buildBias?: number
}

/**
 * The signature material: one `build` value takes a mesh from a cloud of
 * tumbling wireframe shards, through a solid shaded object, to an accent-lit
 * one. Depth and scroll velocity keep the corridor feeling inhabited.
 */
export class ReconstructMaterial extends THREE.ShaderMaterial {
  constructor(
    options: {
      spread?: number
      jitter?: number
      opacity?: number
      /** When false, CPU places the mesh; shader only stages wire→solid→lit. */
      drift?: boolean
      depthSpan?: number
    } = {},
  ) {
    const cpuPlaced = options.drift === false
    super({
      // GLSL3 guarantees derivatives (`fwidth`) without an extension dance.
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uBuild: { value: 0 },
        uTime: { value: 0 },
        uFocus: { value: 0 },
        uLive: { value: 0 },
        uSpread: { value: options.spread ?? 0.7 },
        uJitter: { value: options.jitter ?? 0.2 },
        uOpacity: { value: options.opacity ?? 1 },
        uVelocity: { value: 0 },
        uDepthSpan: { value: options.depthSpan ?? 0.1 },
        uBuildBias: { value: 0 },
        uDrift: { value: cpuPlaced ? 0 : 1 },
        uCpuPlaced: { value: cpuPlaced ? 1 : 0 },
        uAccent: { value: sceneColors.accent.clone() },
        uInk: { value: sceneColors.ink.clone() },
      },
    })
  }

  /** Pushes a frame of state into the shader. */
  sync(state: ReconstructSync) {
    const { uniforms } = this
    uniforms.uBuild.value = state.build
    uniforms.uLive.value = state.live
    uniforms.uFocus.value = state.focus
    uniforms.uTime.value = state.time
    uniforms.uVelocity.value = state.velocity ?? 0
    uniforms.uBuildBias.value = state.buildBias ?? 0
    uniforms.uAccent.value.copy(sceneColors.accent)
    uniforms.uInk.value.copy(sceneColors.ink)
    // Once faces carry the read, real occlusion beats blended transparency.
    this.depthWrite = state.build > 0.55
  }
}
