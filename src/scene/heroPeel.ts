/**
 * The peel, as a vertex displacement.
 *
 * Injected into a stock `MeshPhysicalMaterial` (and the matching line material)
 * rather than replacing them, so the shell keeps real PBR — clearcoat, env
 * reflections, tone mapping — while opening from one buffer in one draw call.
 *
 * The displacement is deliberately a pure function of `uOpen`, which is a pure
 * function of scroll. Nothing here damps, springs or overshoots on the opening
 * axis: scrubbing the wheel up and down scrubs the shell open and shut exactly
 * in step. Only `uHoverPush` and `uFirePush` — both pointer-driven, neither part
 * of the scroll story — are smoothed on the CPU before they arrive.
 */
import * as THREE from "three";

export interface PeelUniforms {
  /** Scroll-linear aperture, 0 → 1. The single source of opening truth. */
  uOpen: { value: number };
  /** Metres a fully-opened facet travels along its own normal. */
  uBreak: { value: number };
  /** Late outward throw as the hero hands off to the corridor. */
  uFling: { value: number };
  /** Resting seam between facets. */
  uBase: { value: number };
  /** Idle breathe amplitude — already gated by the master clock. */
  uBreathe: { value: number };
  uTime: { value: number };
  /** How far the iris order spreads the opening across the shell. */
  uStagger: { value: number };
  uHoverPush: { value: number };
  uFirePush: { value: number };
  /** Corridor axis. Facets sweep along this so the break stays collinear with travel. */
  uCorridor: { value: THREE.Vector3 };
  /** Per-facet state: r = hover, g = fire. */
  uState: { value: THREE.DataTexture };
  uShardCount: { value: number };
  uGlowColor: { value: THREE.Color };
  uRimColor: { value: THREE.Color };
  uRimGain: { value: number };
}

export const createPeelUniforms = (
  state: THREE.DataTexture,
  count: number,
): PeelUniforms => ({
  uOpen: { value: 0 },
  uBreak: { value: 1.85 },
  uFling: { value: 0 },
  uBase: { value: 0.022 },
  uBreathe: { value: 0 },
  uTime: { value: 0 },
  uStagger: { value: 0.85 },
  uHoverPush: { value: 0.07 },
  uFirePush: { value: 2.8 },
  uCorridor: { value: new THREE.Vector3() },
  uState: { value: state },
  uShardCount: { value: count },
  uGlowColor: { value: new THREE.Color() },
  uRimColor: { value: new THREE.Color() },
  uRimGain: { value: 0 },
});

const PEEL_HEADER = /* glsl */ `
attribute vec3 aCentroid;
attribute vec3 aFaceNormal;
attribute vec3 aTangent;
attribute float aShard;
attribute float aPhase;
attribute float aRank;

uniform float uOpen;
uniform float uBreak;
uniform float uFling;
uniform float uBase;
uniform float uBreathe;
uniform float uTime;
uniform float uStagger;
uniform float uHoverPush;
uniform float uFirePush;
uniform vec3 uCorridor;
uniform sampler2D uState;
uniform float uShardCount;

varying float vGlow;
varying float vThrow;
varying float vFacet;

vec3 gHeroPos;
vec3 gHeroNormal;

vec3 heroRotate(vec3 v, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}

void heroPeel(vec3 localPos, vec3 localNormal) {
  vec2 st = texture2D(uState, vec2((aShard + 0.5) / uShardCount, 0.5)).rg;
  float hover = st.r;
  float fire = st.g;

  // Iris order: facets square-on to the lens (aRank 0) clear first, the limb last.
  float local = clamp(uOpen * (1.0 + uStagger) - aRank * uStagger, 0.0, 1.0);
  float throwAmt = local * local * (3.0 - 2.0 * local);

  float breathe = sin(uTime * 1.1 + aPhase) * uBreathe;
  float push =
    uBase +
    breathe +
    throwAmt * uBreak +
    uFling * 0.55 +
    hover * uHoverPush +
    fire * uFirePush;

  float spin = throwAmt * (0.7 + aPhase * 0.1) + fire * 1.1;
  float shrink = 1.0 - throwAmt * 0.34 - fire * 0.15;

  gHeroPos =
    heroRotate(localPos * shrink, aTangent, spin) +
    aCentroid +
    aFaceNormal * push +
    uCorridor * (throwAmt + fire * 0.5);
  gHeroNormal = heroRotate(localNormal, aTangent, spin);

  vThrow = throwAmt;
  vGlow = hover * 0.85 + fire * 1.5 + throwAmt * 0.3;
  // A stable per-facet value in [0,1]. Machined panels are cut from the same
  // billet but never finish identically; without this every facet takes exactly
  // the same roughness and the shell reads as one moulded ball rather than as an
  // assembly of parts.
  vFacet = fract(aPhase * 0.15915494 + 0.37);
}
`;

const FRAGMENT_HEADER = /* glsl */ `
varying float vGlow;
varying float vThrow;
varying float vFacet;
uniform vec3 uGlowColor;
uniform vec3 uRimColor;
uniform float uRimGain;
`;

/**
 * Wires the peel into a lit material.
 *
 * The work happens in `beginnormal_vertex` because that chunk runs before
 * `defaultnormal_vertex`, which is what transforms the normal for lighting —
 * rotating the position without rotating the normal there would leave every
 * tumbling facet lit as though it had never moved.
 */
export const applyLitPeel = (
  material: THREE.Material,
  uniforms: PeelUniforms,
) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace("void main() {", `${PEEL_HEADER}\nvoid main() {`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        vec3 objectNormal = vec3( normal );
        heroPeel( position, objectNormal );
        objectNormal = gHeroNormal;
        `,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = gHeroPos;");

    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${FRAGMENT_HEADER}\nvoid main() {`)
      /*
       * Per-facet finish.
       *
       * Flat facets share one normal, so a punctual highlight lights the *whole*
       * facet at once and clips it to a white triangle — the single blown panel
       * that made the shell look broken. Spreading roughness across the panels
       * both breaks that up (a rougher facet cannot reach the same peak) and
       * gives the assembly the panel-to-panel character machined parts have.
       */
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        roughnessFactor = clamp( roughnessFactor * ( 0.6 + vFacet * 0.85 ), 0.04, 1.0 );
        `,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `
        #include <emissivemap_fragment>
        vec3 heroView = normalize( vViewPosition );
        float heroFresnel = pow( 1.0 - clamp( dot( normal, heroView ), 0.0, 1.0 ), 3.0 );
        totalEmissiveRadiance += uGlowColor * vGlow;
        totalEmissiveRadiance += uRimColor * heroFresnel * uRimGain;
        `,
      )
      /*
       * A ceiling on the highlight.
       *
       * Tone mapping compresses but does not prevent a facet reaching pure
       * white, and one white triangle on an otherwise dark instrument reads as a
       * rendering fault rather than as a glint. This rolls the top end off just
       * below clipping, so a hot facet stays hot and stays metal.
       */
      .replace(
        "#include <tonemapping_fragment>",
        /* glsl */ `
        gl_FragColor.rgb = gl_FragColor.rgb / ( 1.0 + max( gl_FragColor.rgb - 0.85, 0.0 ) * 1.6 );
        #include <tonemapping_fragment>
        `,
      );
  };
  material.needsUpdate = true;
};

/** The same displacement for the unlit wire cage; no normal to carry. */
export const applyLinePeel = (
  material: THREE.Material,
  uniforms: PeelUniforms,
) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace("void main() {", `${PEEL_HEADER}\nvoid main() {`)
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `
        heroPeel( position, vec3( 0.0, 0.0, 1.0 ) );
        vec3 transformed = gHeroPos;
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", `${FRAGMENT_HEADER}\nvoid main() {`)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `
        #include <color_fragment>
        diffuseColor.rgb *= 1.0 + vGlow * 0.8;
        diffuseColor.a *= 1.0 - vThrow * 0.45;
        `,
      );
  };
  material.needsUpdate = true;
};
