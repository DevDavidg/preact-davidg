import * as THREE from 'three'
import { liveLaw, reactorControl } from '../control/reactorControl'
import { sceneColors } from '../sceneColors'
import { sceneState } from '../sceneState'
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
/** GHOST: releases settled type back toward the cloud it arrived from. */
uniform float uGhost;
/** The swallow's recall: reopens every exit window at once. See GlyphSync. */
uniform float uRecall;

varying vec2 vAtlasUv;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vAccent;
varying float vWeight;
varying float vFog;
varying float vVoxel;
varying float vGlyphFace;
/** How far this glyph is into being locked at home, 0 → 1. */
varying float vLock;

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
  float leaving = clamp((uBuild - aWindow.z - aSeed * exitSpan * 0.4) / exitSpan, 0.0, 1.0);
  leaving = leaving * leaving * (3.0 - 2.0 * leaving);
  leaving *= 1.0 - uRecall;

  // Soft settle in; leave fades in place — no explode cloud.
  float settled = arrive * (1.0 - leaving);
  /*
   * Lock home early, and be finished long before the glyph is fully opaque.
   *
   * This used to be smoothstep(0.18, 0.72, arrive), which meant a letter was
   * still travelling, still rotating and still drifting through the middle of
   * its own fade-in — the visitor was being asked to read a moving target, and
   * on a phone that is most of the time a console is on screen at all. Landing
   * the position first and revealing second is the difference between copy that
   * assembles and copy that flickers.
   *
   * GHOST reopens the lock rather than adding a second motion on top: the type
   * travels back down the exact path it arrived by, so releasing the key puts
   * every letter home again with no snap.
   */
  float lock = smoothstep(0.02, 0.38, arrive) * (1.0 - uGhost * 0.85);
  float loose = (1.0 - lock) * (1.0 - leaving);
  float speed = clamp(abs(uVelocity) * 0.004, 0.0, 0.5) * loose;
  vLock = lock * (1.0 - leaving);

  vec3 local = position * aSize;
  // Flat plates are the readable form, so they tumble far less on the way in:
  // a letter spinning about its own centre is unreadable at any size.
  float spinScale = mix(0.34, 1.0, step(0.5, aStyle.z));
  vec4 spin = quatFromAxisAngle(aAxis, loose * (0.35 + aSeed * 0.55) * (1.0 + speed * 0.2) * spinScale);
  vec4 orient = quatMul(aQuat, spin);
  vec3 rotated = applyQuat(local, orient);
  vec3 rotatedN = applyQuat(normal, orient);

  vec3 centre = mix(aChaos, aHome, lock);
  centre += aAxis * sin(uTime * 0.4 + aSeed * 6.2831) * 0.012 * loose;
  // A slow fall while ghosting, per-letter out of phase — the frequency reads as
  // falling code rather than as one block sliding down.
  centre.y -= uGhost * fract(uTime * (0.16 + aSeed * 0.34) + aSeed) * 0.85;

  vec4 world = modelMatrix * vec4(centre + rotated, 1.0);
  vec4 viewPos = viewMatrix * world;

  vAtlasUv = mix(aRect.xy, aRect.zw, uv);
  vNormalW = normalize(mat3(modelMatrix) * rotatedN);
  vViewDir = normalize(cameraPosition - world.xyz);
  vSettled = settled;
  vAccent = clamp(aStyle.x + uGhost * 0.55, 0.0, 1.0);
  // Kill pre-enter + post-exit fully so other modules never ghost as debris.
  vWeight = aStyle.y * settled * (1.0 - smoothstep(0.0, 0.55, leaving));
  vVoxel = step(0.5, aStyle.z);
  // Local ±Z faces of the unit box — the readable plate for flat glyphs.
  vGlyphFace = step(0.5, abs(normal.z));

  float depth = length(viewPos.xyz);
  vFog = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);

  /*
   * A glyph outside its own scroll window never reaches the rasteriser.
   *
   * The whole corridor's typography is one instanced draw of up to twenty-two
   * thousand boxes, and the material is transparent, double-sided and depth-test
   * free — so there is no early-z and nothing rejects a letter that has not
   * arrived yet or has already left. The fragment shader does kill them, but only
   * at the very bottom, after the atlas fetch, the lighting, the fog and the halo
   * have all run, and after both faces of every box have been rasterised and
   * blended. At any scroll position about one console's worth of glyphs is
   * genuinely on screen; the rest was pure overdraw, several times over the
   * frame.
   *
   * alpha is multiplied by exactly vWeight before its own discard, so
   * clipping here is the same picture — the primitive is pushed outside the clip
   * volume on every axis, which costs one comparison per vertex and saves the
   * entire fragment.
   */
  if (vWeight <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

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
/** Law: 1 under CHAOS, where the room is a schematic and type is pure UI. */
uniform float uLawFlat;
/** Law: colour push toward the accent. */
uniform float uLawHeat;
/** The reactor ground, for the halo that keeps copy readable off a plate. */
uniform vec3 uGround;

varying vec2 vAtlasUv;
varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vSettled;
varying float vAccent;
varying float vWeight;
varying float vFog;
varying float vVoxel;
varying float vGlyphFace;
varying float vLock;

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

  // The law flattens the light here, once, for the same reason the shard material
  // does it: a schematic has no key and no highlight, and every term below wants
  // to stay written the same way across all three laws.
  key = mix(key, 0.5, uLawFlat);
  fill = mix(fill, 0.12, uLawFlat);
  spec *= 1.0 - uLawFlat;
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
    /*
     * Adaptive edge, not a fixed threshold.
     *
     * This was smoothstep(0.36, 0.5, coverage) — a constant band applied to a
     * *bitmap* atlas, and it was the single biggest reason world copy looked
     * broken. Two failures at once:
     *
     * - Magnified, a constant band is narrower than one screen pixel, so the
     *   rasteriser's own antialiasing was thrown away and every curve came back
     *   as stair-steps.
     * - Minified — which is the normal case, since the atlas rasterises at
     *   RASTER px per em and a console em lands well under that — mipmapping
     *   lowers a thin stroke's peak alpha *below* the 0.5 ceiling of the band.
     *   The strokes did not merely soften, they were clipped out of existence:
     *   hairlines in the display face and the thin stems of the mono face simply
     *   vanished at distance.
     *
     * fwidth() is the width of one screen pixel measured in coverage units, so
     * the band below is always exactly as wide as the pixel it is being drawn
     * into: crisp when magnified, smoothly antialiased when minified. Dropping
     * the centre of the band as that pixel gets larger is what gives a minified
     * stroke back the weight mipmapping took off it.
     */
    float edge = fwidth(coverage);
    float band = max(edge, 0.008);
    float centre = mix(0.5, 0.24, clamp(edge * 3.2, 0.0, 1.0));
    float ink = smoothstep(centre - band, centre + band, coverage);
    if (ink < 0.015) discard;
    /*
     * Flat readable ink. vWeight shapes *brightness* here rather than alpha:
     * the row weights are 0.9–1.0 for secondary copy, and multiplying those into
     * alpha made metadata a partly transparent overlay on the plate — a contrast
     * cut applied to the smallest type on screen, which is precisely backwards.
     * Emphasis is a tone; legibility is opacity.
     */
    shade = tint * (0.86 + key * 0.12) * (0.82 + clamp(vWeight, 0.0, 1.2) * 0.18);
    shade = mix(shade, mix(shade, uAccent, 0.5), uLawHeat * 0.55);
    // Revealed only once it is home, so nothing is read while still in flight.
    alpha = ink * smoothstep(0.08, 0.5, vLock);

    /*
     * A halo, but only when the plate stops backing the copy.
     *
     * Under CHAOS the console face is dialled almost to nothing — that is the
     * point of the law, the room becomes its own drawing — which leaves the type
     * sitting directly on the corridor with whatever contrast happens to be
     * behind it. A dilated sample of the same coverage gives every glyph its own
     * dark contour, so "pure UI" stays readable instead of trading legibility
     * for the look. Zero cost under the other two laws: the term is multiplied
     * out entirely.
     */
    float haloAmount = uLawFlat;
    if (haloAmount > 0.01) {
      float halo = smoothstep(centre - band * 4.0, centre - band * 0.5, coverage);
      float haloAlpha = halo * haloAmount * 0.92;
      // Behind the letter, never over it.
      shade = mix(uGround * 0.55, shade, ink);
      alpha = max(alpha, haloAlpha * smoothstep(0.08, 0.5, vLock));
    }
  } else {
    // Relief / stack matter: darken side facets so elongated depth reads like
    // bay columns, not a flat grid of cubes.
    float faceBias = mix(0.55, 1.0, vGlyphFace);
    shade *= faceBias;
    shade += tint * key * vGlyphFace * 0.12 * lit;
  }

  /*
   * Voxel matter still fades by weight; flat type has already spent its weight as
   * tone, so all it takes from vWeight is the envelope — a soft ramp rather than a
   * step, because vWeight is also how a leaving block decays and a hard step would
   * pop the copy off screen mid-exit.
   */
  alpha *= mix(clamp(vWeight, 0.0, 1.0), smoothstep(0.0, 0.3, vWeight), 1.0 - vVoxel) * uOpacity;
  // Fog barely touches locked type — corridor depth used to wash CTA labels.
  alpha *= 1.0 - vFog * mix(0.55, 0.06, smoothstep(0.55, 1.0, vSettled));
  if (alpha < 0.02) discard;

  shade = mix(shade, uFogColor, vFog * mix(0.45, 0.08, smoothstep(0.55, 1.0, vSettled)));
  fragColor = vec4(shade, clamp(alpha, 0.0, 1.0));
}
`

export interface GlyphSync {
  build: number
  live: number
  time: number
  velocity: number
  opacity: number
  /** The swallow's recall — see `uRecall`. */
  recall: number
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
      depthTest: false,
      uniforms: {
        uAtlas: { value: atlas },
        uBuild: { value: 0 },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uLive: { value: 0 },
        uOpacity: { value: 1 },
        uFogDensity: { value: FOG_DENSITY },
        uStaggerRatio: { value: STAGGER_RATIO },
        uGhost: { value: 0 },
        /*
         * The swallow's recall: how much of the copy the corridor has already
         * retired is back in the room to be taken in, 0 → 1.
         *
         * A uniform rather than a second set of windows. Every block leaves
         * against its own `aWindow.z`, and the finale runs at `uBuild === 1` — so
         * by the ending every line on the page has left, and the well was closing
         * on a room with no words in it. Scaling `leaving` by `1 - uRecall`
         * reopens all those exits together, which is also why one float is
         * enough: the type comes back as the page it was, not as a new
         * arrangement, and scrolling up closes them again in lockstep.
         */
        uRecall: { value: 0 },
        uInk: { value: sceneColors.ink.clone() },
        uAccent: { value: sceneColors.accent.clone() },
        uFogColor: { value: sceneColors.base.clone() },
        uLawFlat: { value: 0 },
        uLawHeat: { value: 0 },
        uGround: { value: sceneColors.base.clone() },
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
    uniforms.uRecall.value = state.recall
    uniforms.uGhost.value = reactorControl.modeAmount.ghost
    /*
     * Depth testing, for the swallow only.
     *
     * Type is drawn without it for the whole corridor on purpose — mixed voxels
     * and transparent atlas plates in one instanced call, sorted by nothing —
     * and that is harmless while the only thing behind the copy is the room.
     * The well is not the room: recalled type falling toward the aperture would
     * otherwise draw straight over the event horizon, which is the one object on
     * the page that must never have anything in front of it. Same exception, and
     * the same threshold, as `Lattice` and `ReconstructMaterial`.
     *
     * On the swallow, not on `recall` — which is the threshold this comment always
     * claimed and the code did not have. `recall` is the *room coming back*, and it
     * finishes at drain 0.72, around swallow 0.68; the shadow is at its largest
     * from there to the end of the rail. Keying the depth test to it dropped the
     * protection exactly across the stretch it was written for, and the only reason
     * that was not visible is that `uDepthGuard` has faded by then too, so the pass
     * overwrites the type anyway. Two mistakes cancelling is not a guarantee, and
     * it stops being one the moment either schedule moves.
     */
    this.depthTest = sceneState.swallow >= 0.12
    uniforms.uLawFlat.value = liveLaw.flat
    uniforms.uLawHeat.value = liveLaw.heat
    uniforms.uGround.value.copy(sceneColors.base)
    uniforms.uInk.value.copy(sceneColors.ink)
    uniforms.uAccent.value.copy(sceneColors.accent)
    uniforms.uFogColor.value.copy(sceneColors.base)
    // Mixed voxels + transparent atlas plates — never write depth from this
    // draw call or thin signage punches holes through panels behind it.
  }
}
