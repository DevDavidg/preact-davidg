import * as THREE from 'three'
import { liveLaw, reactorControl } from './control/reactorControl'
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
/** Assembly progress when a mesh owns its own slice of the scroll; -1 follows uBuild. */
uniform float uAssembleAt;
/** 1 = CPU places instances; skip per-shard assemble (avoids fighting JS paths). */
uniform float uCpuPlaced;

varying vec3 vBary;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec2 vUv;
varying float vWorldY;
varying float vAssembled;
varying float vStage;
varying float vViewDistance;

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

  // Seed + depth wave + optional bay bias — soft hermite settle.
  float stagger = min(aSeed * 0.22 + depth * uDepthSpan + uBuildBias, 0.36);
  float assembleBuild = uAssembleAt < 0.0 ? uBuild : uAssembleAt;
  float assembled = clamp((assembleBuild - stagger) / 0.42, 0.0, 1.0);
  assembled = assembled * assembled * (3.0 - 2.0 * assembled);
  // Lattice: CPU places the mesh; shader stages wire→solid without a second settle.
  assembled = mix(assembled, 1.0, uCpuPlaced);

  float loose = 1.0 - assembled;
  float speed = clamp(abs(uVelocity) * 0.008, 0.0, 1.0);

  mat3 spin = rotateAxis(aAxis, loose * (1.6 + aSeed * 2.4) * (1.0 + speed * 0.35) * uDrift);
  vec3 local = mix(position - aCenter, spin * (position - aCenter), uDrift);

  vec3 outward = normalize(aCenter + vec3(0.0, 0.0015, 0.0));
  float breathe = sin(uTime * 0.45 + aSeed * 6.2831) * uJitter * loose * (1.0 + speed * 0.4);
  vec3 drift = (outward * (loose * uSpread * (0.4 + aSeed * 0.55)) + aAxis * breathe) * uDrift;

  vec4 worldPos = modelMatrix * instance * vec4(aCenter + drift + local, 1.0);

  vBary = aBary;
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * mat3(instance) * mix(normal, spin * normal, uDrift));
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vWorldY = worldPos.y;
  vAssembled = assembled;
  vStage = assembleBuild;
  vViewDistance = length(cameraPosition - worldPos.xyz);

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
uniform sampler2D uMap;
/** 1 when the shards carry a project shot rather than a shaded surface. */
uniform float uHasMap;
/** 1 when the mesh is a console plate that has to back world type opaquely. */
uniform float uSolidFill;
/** WIRE mode *or* the CHAOS law: the corridor as a blueprint rather than as matter. */
uniform float uWire;
/** Law: how present the shaded face is. VACUUM densifies it, CHAOS removes it. */
uniform float uLawSolid;
/** Law: flattens lighting toward an unlit UI read. CHAOS is 1. */
uniform float uLawFlat;
/** Law: how visible the object's own triangulation is. VACUUM erases it. */
uniform float uLawEdge;
/** Live loudness, 0 → 1. The room lights on what the visitor is hearing. */
uniform float uAudio;
/** Law heat, 0 → 1. CHAOS runs the whole corridor hotter. */
uniform float uHeat;
/** The shared studio, sampled as a mirror reflection when a mesh opts in. */
uniform sampler2D uEnvMap;
/** 1 when the mesh carries a reflection; unset objects skip the sample cost. */
uniform float uHasEnv;

varying vec3 vBary;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec2 vUv;
varying float vWorldY;
varying float vAssembled;
varying float vStage;
varying float vViewDistance;

// GLSL3 has no gl_FragColor; three aliases attribute/varying but not the output.
layout(location = 0) out vec4 fragColor;

/** A reflection direction onto the shared studio's equirect layout. */
vec2 equirectUv(vec3 dir) {
  float u = atan(dir.z, dir.x) * 0.15915494 + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) * 0.31830989 + 0.5;
  return vec2(u, v);
}

void main() {
  // Barycentric wireframe: fwidth keeps the line one pixel wide at any depth.
  vec3 delta = fwidth(vBary);
  vec3 smoothed = smoothstep(vec3(0.0), delta * 1.5, vBary);
  float edge = 1.0 - min(min(smoothed.x, smoothed.y), smoothed.z);

  // Four-stage read: wire dominates SCANNING, matter locks during ASSEMBLING,
  // light opens through BEAUTY, then accent is reserved for LIVE.
  float solidArch = smoothstep(0.16, 0.48, vStage);
  // Textured panels keep a readable face while tumbling, so a project enters as
  // photo-debris rather than an empty wireframe.
  float solidShot = mix(0.42, 1.0, smoothstep(0.04, 0.68, vAssembled));
  // VACUUM densifies matter, CHAOS removes it entirely.
  float solid = clamp(mix(solidArch, solidShot, uHasMap) * uLawSolid, 0.0, 1.0);
  float lit = smoothstep(0.48, 0.78, uBuild);
  float liveAccent = smoothstep(0.72, 0.84, uBuild) * uLive;
  // Photo shards keep triangulation until they nearly lock; then bury the mesh.
  float wire = 1.0 - solid * mix(0.80, smoothstep(0.55, 0.98, vAssembled) * 0.98, uHasMap);

  // Reconstruction band rides the scroll; time only breathes it slightly.
  float bandY = mix(-1.4, 5.8, smoothstep(0.1, 0.54, uBuild)) + sin(uTime * 0.22) * 0.28;
  float band = exp(-pow((vWorldY - bandY) * 2.1, 2.0));

  vec3 normal = normalize(vNormalW);
  vec3 view = normalize(vViewDir);
  vec3 keyLight = normalize(vec3(0.45, 0.82, 0.34));
  vec3 fillLight = normalize(vec3(-0.6, 0.3, -0.5));

  float key = max(dot(normal, keyLight), 0.0);
  float fill = max(dot(normal, fillLight), 0.0) * 0.35;
  float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.6);
  float spec = pow(max(dot(reflect(-keyLight, normal), view), 0.0), 42.0);

  /*
   * The law decides what this object is made of.
   *
   * Flattening is done here, once, on the light itself rather than at each of the
   * dozen places light is used below: under CHAOS the room is a schematic, and a
   * schematic has no key light, no fill and no specular — every surface reads at
   * one value. Holding the terms and flattening them keeps every downstream
   * expression identical across the three laws.
   */
  key = mix(key, 0.5, uLawFlat);
  fill = mix(fill, 0.12, uLawFlat);
  spec *= 1.0 - uLawFlat;

  vec3 face = uInk * (0.05 + key * 0.17 + fill * 0.1);
  // A console surface needs to sit a little above pure black or the plate reads
  // as a hole cut in the corridor rather than as a panel the type is mounted on.
  face += uInk * uSolidFill * 0.035;
  face += uInk * spec * lit * 0.35;
  face = mix(face, uAccent * 0.4, liveAccent * fresnel * 0.55);

  // Optional mirror term: the shared studio, held to structural surfaces only —
  // a project photo panel keeps its own shot rather than picking up the room.
  vec3 envColor = texture(uEnvMap, equirectUv(reflect(-view, normal))).rgb;
  face = mix(face, envColor, uHasEnv * (1.0 - uHasMap) * fresnel * (0.4 + lit * 0.4));

  // Full plate photo fills as shards lock. Loose debris keeps colour via edge
  // tint only — painting the map at uHasMap alone doubled the dossier JPEG
  // until per-card DOM void (~assemble 0.58+).
  vec3 shot = texture(uMap, vUv).rgb;
  float shotExposure = mix(0.48, 0.78, vAssembled);
  vec3 litShot = shot * (shotExposure + key * 0.38 + fill * 0.2) + uInk * spec * lit * 0.14;
  litShot = mix(litShot, litShot * uAccent * 1.12, uFocus * 0.1);
  float shotMix = uHasMap * smoothstep(0.52, 0.9, vAssembled);
  face = mix(face, litShot, shotMix);

  // Focus is a brighter neutral rim during Work; gold is held for LIVE.
  vec3 edgeTint = mix(uInk * (1.0 + uFocus * 0.18), uAccent, liveAccent);
  // Loose photo shards outline in their own colour so debris matches the lattice
  // language without waiting for a solid plate.
  edgeTint = mix(edgeTint, mix(shot, uAccent, 0.22), uHasMap * (0.55 + 0.35 * (1.0 - vAssembled)));
  // The law decides whether this object shows how it was made.
  float edgeGlow = edge * (0.26 + wire * 0.6 + uFocus * 0.55 + band * 0.7) * uLawEdge;
  // Keep a thin accent rim on settled shots; bury the interior triangulation.
  edgeGlow *= mix(1.0, 0.18 + uFocus * 0.5, shotMix * smoothstep(0.5, 0.95, vAssembled));

  vec3 rim = uAccent * fresnel * lit * liveAccent * (0.28 + uFocus * 0.55);
  rim += envColor * uHasEnv * fresnel * lit * 0.32;

  // Controlled depth without a full-screen DOF pass: distant, unfocused matter
  // loses contrast in BEAUTY, while the active bay/panel stays optically crisp.
  float depthFocus =
    smoothstep(7.0, 20.0, vViewDistance) *
    smoothstep(0.48, 0.72, uBuild) *
    (1.0 - uFocus * 0.65);
  face = mix(face, uInk * 0.035, depthFocus * 0.45);
  edgeGlow *= 1.0 - depthFocus * 0.55;
  rim *= 1.0 - depthFocus * 0.35;

  vec3 color = face * solid + edgeTint * edgeGlow + rim;
  // Heat on shards still in flight — hotter on photo debris so it reads as
  // project matter before it locks into a plate.
  color += uAccent * (1.0 - vAssembled) * mix(0.06, 0.2, uHasMap);
  // The law's heat, and the sound the visitor is actually hearing. Both are
  // deliberately additive rim terms: they change how the room *feels* without
  // ever repainting a surface, so a photo shot still reads as the photo.
  color += uAccent * fresnel * (uHeat * 0.35 + uAudio * 0.18);

  float alpha = solid * (0.40 + key * 0.32) + edgeGlow + fresnel * lit * 0.22;
  // Textured panels need presence while flying and hold against the lattice when home.
  alpha += shotMix * mix(0.55, 0.92, vAssembled);
  // Loose shards stay translucent so debris still reads as debris; a settled
  // console plate goes fully opaque, which is what gives its copy real contrast.
  alpha = max(alpha, uSolidFill * smoothstep(0.2, 0.9, vAssembled));
  alpha *= 1.0 - depthFocus * 0.18;
  alpha *= uOpacity * mix(mix(0.35, 0.82, uHasMap), 1.0, vAssembled);

  // WIRE: the same object, drawn as the drawing of itself.
  //
  // Not a second shader, and not THREE's own wireframe flag — both would lose
  // the per-shard settle and the photo tint that make this readable. The
  // barycentric edge term is already exact at any depth, so blueprint mode is
  // just that term promoted to the whole read while the shaded face and the
  // photo fill are dialled out under it.
  if (uWire > 0.001) {
    vec3 lineTint = mix(uInk, uAccent, 0.35 + uHeat * 0.4);
    float line = edge * (0.85 + band * 0.5 + uFocus * 0.4);
    vec3 wireColor = lineTint * (0.55 + line * 1.4);
    float wireAlpha = clamp(line * 1.15 + 0.02, 0.0, 1.0) * uOpacity;
    color = mix(color, wireColor, uWire);
    alpha = mix(alpha, wireAlpha, uWire);
  }

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
  /**
   * Assembly progress for meshes that own a slice of the scroll rather than the
   * whole page. `0 → 0.78` covers scattered → fully settled; omit to follow
   * `build`.
   */
  assembleAt?: number
}

/**
 * The shard shape a mesh wants *before* the law scales it.
 *
 * Objects author what they would do under VISCOUS — a console frame gathers
 * tightly, a five-metre column barely moves — and the law multiplies that. It is
 * what keeps CHAOS from flattening every object into the same amount of noise,
 * and it means a new mesh joins the physics by doing nothing at all.
 */
export interface ReconstructShape {
  spread: number
  jitter: number
  /** Omit on CPU-placed meshes; their drift is pinned to 0 by construction. */
  drift?: number
}

/**
 * Stand-in for `uMap` on the meshes that have no texture: an unbound sampler is
 * undefined behaviour, and one shared 1×1 pixel costs nothing.
 */
const blankMap = (() => {
  const texture = new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1,
    1,
    THREE.RGBAFormat,
  )
  texture.needsUpdate = true
  return texture
})()

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
      /** Project shot painted onto the shards once they solidify. */
      map?: THREE.Texture
      /**
       * Console plates: settled shards become opaque and occlude, so mounted
       * type reads against a surface instead of against the corridor behind it.
       */
      solid?: boolean
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
        uAssembleAt: { value: -1 },
        uCpuPlaced: { value: cpuPlaced ? 1 : 0 },
        uAccent: { value: sceneColors.accent.clone() },
        uInk: { value: sceneColors.ink.clone() },
        uMap: { value: options.map ?? blankMap },
        uHasMap: { value: options.map ? 1 : 0 },
        uSolidFill: { value: options.solid ? 1 : 0 },
        uWire: { value: 0 },
        uLawSolid: { value: 1 },
        uLawFlat: { value: 0 },
        uLawEdge: { value: 1 },
        uAudio: { value: 0 },
        uHeat: { value: 0 },
        uEnvMap: { value: blankMap },
        uHasEnv: { value: 0 },
      },
    })
    this.cpuPlaced = cpuPlaced
  }

  /** True when the mesh places itself and the shader must not add drift. */
  private readonly cpuPlaced: boolean

  /**
   * Sets the authored shard shape, scaled by whatever law is in force.
   *
   * Call this instead of writing `uSpread` / `uJitter` / `uDrift` directly — a
   * direct write is invisible to the law and the object simply stops obeying
   * the room.
   */
  setShape(shape: ReconstructShape) {
    const { uniforms } = this
    uniforms.uSpread.value = shape.spread * liveLaw.spread
    uniforms.uJitter.value = shape.jitter * liveLaw.jitter
    if (shape.drift !== undefined && !this.cpuPlaced) {
      uniforms.uDrift.value = shape.drift * liveLaw.drift
    }
  }

  /**
   * Opts a mesh into the shared studio reflection. Structural surfaces only —
   * a project photo panel (`uHasMap`) ignores this even when set, so a case
   * study never picks up the room over its own shot. Pass `null` to go back
   * to the flat key/fill/fresnel read.
   */
  setEnv(texture: THREE.Texture | null) {
    const { uniforms } = this
    uniforms.uEnvMap.value = texture ?? blankMap
    uniforms.uHasEnv.value = texture ? 1 : 0
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
    uniforms.uAssembleAt.value = state.assembleAt ?? -1
    uniforms.uAccent.value.copy(sceneColors.accent)
    uniforms.uInk.value.copy(sceneColors.ink)
    /*
     * WIRE the mode and CHAOS the law want the same thing — the object drawn as
     * its own drawing — so they share the uniform and whichever is stronger wins.
     * Adding them would double-count when a visitor engages WIRE while CHAOS is
     * already running, which is exactly the combination someone exploring the
     * room will try.
     */
    const wire = Math.max(reactorControl.modeAmount.wire, liveLaw.wire)
    uniforms.uWire.value = wire
    uniforms.uLawSolid.value = liveLaw.solid
    uniforms.uLawFlat.value = liveLaw.flat
    uniforms.uLawEdge.value = liveLaw.edge
    uniforms.uAudio.value = reactorControl.audio
    uniforms.uHeat.value = liveLaw.heat
    // Once faces carry the read, real occlusion beats blended transparency.
    // Textured panels wait until nearly locked (high alpha + stagger). Follow
    // the threshold both ways so scrolling back clears writers mid-flight.
    const stage = state.assembleAt ?? state.build
    const mapped = this.uniforms.uHasMap.value > 0.5
    const solid = this.uniforms.uSolidFill.value > 0.5
    // Console plates occlude a little earlier than shaded backdrop: their whole
    // job is to be behind type, and a plate that is opaque but not yet writing
    // depth lets the corridor show through the copy for a few frames.
    // A blueprint does not occlude: in WIRE the far side of the corridor has to
    // show through the near side, which is the whole point of the mode.
    // A blueprint does not occlude — whether the blueprint came from the mode or
    // from the law.
    this.depthWrite =
      wire < 0.5 && stage > (mapped ? 0.72 : solid ? 0.45 : 0.55)
  }
}
