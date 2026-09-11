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
/** The probe, already transformed into this mesh's local space on the CPU. */
uniform vec3 uProbe;
uniform float uProbeAmount;

varying vec3 vColor;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vFog;
varying float vNear;

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

  // The portrait answers the pointer.
  //
  // A settled face that ignores the cursor is a photograph; one whose voxels
  // lift toward it is a sensor, and the About beat is the one place in the room
  // where the subject should look back. The falloff is a tight gaussian so the
  // effect is a local swell under the cursor rather than the whole head leaning.
  vec3 toward = uProbe - centre;
  float reach = length(toward);
  float pull = uProbeAmount * exp(-reach * reach * 3.4) * lock;
  centre += toward / max(reach, 0.001) * pull * 0.14;

  vec4 world = modelMatrix * vec4(centre + rotated, 1.0);
  vec4 viewPos = viewMatrix * world;

  vColor = aColor;
  vec3 normalW = mat3(modelMatrix) * rotatedN;
  vNormalW = normalW / max(length(normalW), 1e-5);
  // Guarded rather than normalize()d: the corridor camera scrolls *through* the
  // depth this face occupies, so a mid-flight shard can land on the eye itself,
  // and normalize(vec3(0.0)) is a NaN that bloom then smears over the frame.
  vec3 toEye = cameraPosition - world.xyz;
  vViewDir = toEye / max(length(toEye), 1e-4);
  vSettled = settled;

  /*
   * Fade the last half-metre in front of the lens.
   *
   * Debris sprays toward the camera, and the camera is travelling toward the
   * portrait's plane, so during assemble/disassemble a shard can cross the near
   * plane (0.1 m). A clipped cube straddling the eye covers most of the frame in
   * a single dark quad, and it is also where the view vector degenerates. Dying
   * off smoothly before it gets there keeps the assembly intact — at the
   * portrait's reading distance this term is a constant 1.0 — and costs the
   * effect nothing anybody can see.
   */
  float eyeDepth = -viewPos.z;
  vNear = smoothstep(0.16, 0.75, eyeDepth);

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
varying float vNear;

layout(location = 0) out vec4 fragColor;

void main() {
  // Interpolated vectors are only *nearly* unit, and a degenerate one must not
  // become a NaN: this material renders into the cinema composer's half-float
  // target, where one bad fragment is enough for bloom's downsample chain to
  // hand the whole frame to the tone mapper as black.
  vec3 normal = vNormalW / max(length(vNormalW), 1e-5);
  if (!gl_FrontFacing) normal = -normal;
  vec3 view = vViewDir / max(length(vViewDir), 1e-5);
  vec3 keyLight = normalize(vec3(0.45, 0.82, 0.34));
  vec3 fillLight = normalize(vec3(-0.6, 0.3, -0.5));

  float key = max(dot(normal, keyLight), 0.0);
  float fill = max(dot(normal, fillLight), 0.0) * 0.35;
  // clamp, not max: renormalised interpolants put dot() a hair over 1.0, and
  // pow() of a negative base by a fractional exponent is a NaN.
  float fresnel = pow(clamp(1.0 - dot(normal, view), 0.0, 1.0), 2.6);
  float spec = pow(clamp(dot(reflect(-keyLight, normal), view), 0.0, 1.0), 40.0);
  float lit = mix(0.4, 1.0, vSettled);

  // Lift midtones so skin/hair survive corridor fog instead of washing to grey.
  vec3 albedo = pow(max(vColor, vec3(0.0)), vec3(0.85)) * 1.22;
  vec3 shade = albedo * (0.42 + key * 0.58 + fill * 0.3);
  shade += albedo * spec * lit * 0.22;
  shade += uAccent * fresnel * lit * (0.06 + uLive * 0.22);
  shade += uAccent * (1.0 - vSettled) * 0.08;

  // Settled face is nearly opaque — transparency made skin look hollow.
  float alpha = mix(0.75, 1.0, smoothstep(0.55, 0.95, vSettled)) * uOpacity;
  alpha *= 1.0 - vFog * 0.22;
  alpha *= vNear;
  // Written as a failed >= so a nonfinite alpha discards too. alpha < 0.02
  // is false for NaN, which is precisely the fragment that must not be drawn.
  if (!(alpha >= 0.02)) discard;

  shade = mix(shade, uFogColor, vFog * 0.18);
  // Ordered clamp — the last stop before the composer's half-float target.
  fragColor = vec4(clamp(shade, vec3(0.0), vec3(8.0)), clamp(alpha, 0.0, 1.0));
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

/**
 * Every number that reaches the shader passes through here.
 *
 * `sceneState.velocity` is Lenis' raw velocity — a delta over a frame time that
 * can arrive as `Infinity` or `NaN` on the first frame after a tab wakes, or on
 * a hard fling — and one nonfinite uniform turns five thousand instances into
 * NaN geometry and NaN colour at once.
 */
const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback

export class PortraitVoxelMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      // Starts off and is earned — see the hysteresis in `sync`.
      depthWrite: false,
      uniforms: {
        uBuild: { value: 0 },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uLive: { value: 0 },
        uOpacity: { value: 0 },
        uFogDensity: { value: FOG_DENSITY },
        uStaggerRatio: { value: STAGGER_RATIO },
        uWindow: { value: new THREE.Vector4(0, 1, 1, 0.05) },
        uProbe: { value: new THREE.Vector3(0, 0, 99) },
        uProbeAmount: { value: 0 },
        uAccent: { value: sceneColors.accent.clone() },
        uFogColor: { value: sceneColors.base.clone() },
      },
    })
  }

  sync(state: PortraitVoxelSync) {
    const { uniforms } = this
    const opacity = THREE.MathUtils.clamp(finite(state.opacity, 0), 0, 1)
    uniforms.uBuild.value = finite(state.build, 0)
    uniforms.uLive.value = finite(state.live, 0)
    uniforms.uTime.value = finite(state.time, 0)
    // Clamped as well as sanitised: the shader only reads velocity up to ~125,
    // and a wheel spike beyond that is jitter nobody asked for.
    uniforms.uVelocity.value = THREE.MathUtils.clamp(
      finite(state.velocity, 0),
      -200,
      200,
    )
    uniforms.uOpacity.value = opacity
    uniforms.uWindow.value.set(
      finite(state.enter, 0),
      Math.max(finite(state.span, 1), 1e-4),
      finite(state.exit, 1),
      Math.max(finite(state.exitSpan, 0.05), 1e-4),
    )
    uniforms.uAccent.value.copy(sceneColors.accent)
    uniforms.uFogColor.value.copy(sceneColors.base)
    /*
     * Hysteresis, not a threshold.
     *
     * The opacity that feeds this is damped, so a single cut-off sat right in the
     * band it spends every assemble and every retire crossing — and flipping
     * depth writes on a transparent double-sided mesh frame to frame makes the
     * face alternately occlude and reveal everything else in the transparent
     * pass. Two edges mean it commits once on the way in and once on the way out.
     */
    if (this.depthWrite ? opacity < 0.7 : opacity > 0.9) {
      this.depthWrite = !this.depthWrite
    }
  }
}
