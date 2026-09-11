import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Quality } from "./capability";
import type { Copy } from "../content";
import { Planets } from "./Planets";
import { CosmicEvents } from "./CosmicEvents";
import { addTick } from "../motion/ticker";
import {
  captureRs,
  HOLE_SPIN,
  holeAxis,
  holeCenter,
  holeRadiusFor,
} from "./blackHole";
import { sceneState, swallowShape, type SwallowShape } from "./sceneState";
import { reactorControl } from "./control/reactorControl";
/*
 * The sky, drawn rather than sampled.
 *
 * Stars are geometry. The dome only holds a faint equatorial glow so the void
 * is not a flat clear-colour.
 */
const skyVertex = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const nebulaFragment = /* glsl */ `
uniform float uFade; uniform float uChaos; uniform float uVacuum;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  vec3 col = vec3(0.014, 0.016, 0.026) * exp(-pow(d.y * 2.9, 2.0));
  col += vec3(0.010, 0.002, 0.001) * uChaos;
  col = mix(col, vec3(dot(col, vec3(0.34))) * vec3(0.5, 0.62, 0.78), uVacuum * 0.85);
  gl_FragColor = vec4(col * uFade, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`;
/*
 * Stars as geometry.
 *
 * These were gl_Points with a Gaussian in the fragment, and no amount of tightening
 * that curve stopped them reading as sprites — a point sprite is a screen-aligned
 * quad, so its brightness profile *is* the shape, and the only two outcomes are a
 * soft ball or an aliased square. Real spheres have a silhouette instead: the disc
 * has an edge because there is an edge, and the rasteriser resolves it the same way
 * it resolves every other object in the scene.
 *
 * The radius is angular, not fixed. A star is unresolved — what varies between them
 * is brightness, not apparent size — so the vertex stage sizes each sphere from its
 * own view depth to land on the same pixel radius wherever it is. That also means
 * the near shell and the deep shell match on screen despite sitting forty metres
 * apart, which a fixed radius could not do.
 *
 * The swallow warp is the same arithmetic the points carried, applied to the
 * instance's own translation before the sphere's vertices are added in view space.
 */
const starVertex = /* glsl */ `
attribute vec3 aTint; attribute float aSize; attribute float aSeed;
uniform vec3 uHole; uniform vec3 uAxis;
uniform float uDrain; uniform float uSuction; uniform float uTide; uniform float uOrbit;
uniform float uSpan; uniform float uHollow; uniform float uOpacity; uniform float uAngular;
uniform float uNear; uniform float uChaos; uniform float uVacuum; uniform float uTime;
varying vec3 vTint; varying float vAlpha;
void main(){
  vec3 base = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 d = base - uHole;
  float h = dot(d, uAxis);
  vec3 plane = d - uAxis * h;
  float r = length(plane);
  vec3 radial = r > 1e-4 ? plane / r : vec3(1.0, 0.0, 0.0);
  vec3 tangent = cross(uAxis, radial);
  float fall = min(0.985, pow(uDrain, 1.0 + r / uSpan));
  float wind = uOrbit * min(5.0, pow(max(0.14, 1.0 - fall), -1.5)) * 0.22 * (0.75 + aSeed * 0.5);
  float rn = r * (1.0 - fall) * (1.0 + uTide * fall * (aSeed - 0.5) * 1.7);
  vec3 p = uHole + (radial * cos(wind) + tangent * sin(wind)) * rn + uAxis * h * (1.0 - min(1.0, fall * 1.4));
  vec4 view = viewMatrix * modelMatrix * vec4(p, 1.0);
  // Angular radius: uAngular is a pixel target divided by the frame, so multiplying
  // by depth holds the star at that many pixels wherever it is.
  float radius = uAngular * max(0.35, -view.z) * aSize * (1.0 + fall * 1.6 + uSuction * 0.3);
  gl_Position = projectionMatrix * (view + vec4(position * radius, 0.0));
  vTint = mix(aTint, vec3(0.72, 0.85, 1.0), fall * fall * 0.92) * (1.0 + fall * fall * 3.2 + uSuction * 0.4);
  float starLum = dot(vTint, vec3(0.34));
  vTint = mix(vTint, vec3(1.3, 0.12, 0.06) * starLum, uChaos * 0.9);
  vTint = mix(vTint, vec3(0.38, 0.52, 0.66) * starLum, uVacuum);
  /*
   * VACUUM, as a sky and not as a dimmer. Two things a vacuum actually does to
   * starlight: scintillation is the air's, not the star's, so every point burns
   * steady; and the dim ones go first, which leaves a sparse field of hard bright
   * points rather than the same field turned down. 'keep' is 1 at uVacuum 0.
   */
  float keep = smoothstep(uVacuum * 1.05, uVacuum * 1.05 + 0.4, aSeed * 0.55 + aSize * 0.30);
  float twinkle = mix(0.84 + 0.16 * sin(uTime * (0.4 + aSeed * 1.4) + aSeed * 97.0), 0.84, uVacuum);
  vAlpha = twinkle * uOpacity * mix(1.0, keep, uVacuum)
    * (1.0 - smoothstep(0.80, 0.975, fall))
    * smoothstep(uHollow * 0.8, uHollow * 1.4, length(p - uHole))
    * smoothstep(uNear * 0.45, uNear, -view.z);
}
`;
const starFragment = /* glsl */ `
varying vec3 vTint; varying float vAlpha;
void main(){
  // No falloff and nothing to discard: the silhouette is the geometry's.
  gl_FragColor = vec4(vTint * vAlpha, vAlpha);
}
`;

const stellarVertex = `
attribute vec3 aTint; attribute float aSize; attribute float aSeed;
uniform vec3 uHole; uniform vec3 uAxis;
uniform float uDrain; uniform float uSuction; uniform float uTide; uniform float uOrbit;
uniform float uSpan; uniform float uHollow; uniform float uOpacity; uniform float uSize; uniform float uPixel; uniform float uNear;
uniform float uChaos; uniform float uVacuum; uniform float uTime;
varying vec3 vTint; varying float vAlpha;
void main(){
  vec3 d=position-uHole;
  float h=dot(d,uAxis);
  vec3 plane=d-uAxis*h;
  float r=length(plane);
  vec3 radial=r>1e-4?plane/r:vec3(1.0,0.0,0.0);
  vec3 tangent=cross(uAxis,radial);
  float fall=min(0.985,pow(uDrain,1.0+r/uSpan));
  float wind=uOrbit*min(5.0,pow(max(0.14,1.0-fall),-1.5))*0.22*(0.75+aSeed*0.5);
  float rn=r*(1.0-fall)*(1.0+uTide*fall*(aSeed-0.5)*1.7);
  vec3 p=uHole+(radial*cos(wind)+tangent*sin(wind))*rn+uAxis*h*(1.0-min(1.0,fall*1.4));
  vec4 view=viewMatrix*modelMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*view;
  gl_PointSize=min(24.0,uPixel*uSize*aSize*(1.0+fall*1.6+uSuction*0.3)/max(0.35,-view.z));
  vTint=mix(aTint,vec3(0.72,0.85,1.0),fall*fall*0.92)*(1.0+fall*fall*3.2+uSuction*0.4);
  float starLum=dot(vTint,vec3(0.34));
  vTint=mix(vTint,vec3(1.3,0.12,0.06)*starLum,uChaos*0.9);
  vTint=mix(vTint,vec3(0.38,0.52,0.66)*starLum,uVacuum);
  /*
   * VACUUM, as a sky and not as a dimmer.
   *
   * Two things a vacuum actually does to starlight. Scintillation is the air's,
   * not the star's — take the medium away and every point burns steady. And the
   * dim ones go first: a fading uniform opacity is VISCOUS with the brightness
   * down, while an extinction that climbs the luminance ladder leaves a sparse
   * field of hard bright points, which is what deep space looks like. 'keep' is
   * 1 for everything at uVacuum 0, so the other laws pay nothing.
   */
  float keep=smoothstep(uVacuum*1.05,uVacuum*1.05+0.4,aSeed*0.55+aSize*0.30);
  float twinkle=mix(0.84+0.16*sin(uTime*(0.4+aSeed*1.4)+aSeed*97.0),0.84,uVacuum);
  vAlpha=twinkle*uOpacity*mix(1.0,keep,uVacuum)*(1.0-smoothstep(0.80,0.975,fall))*smoothstep(uHollow*0.8,uHollow*1.4,length(p-uHole))
    *smoothstep(uNear*0.45,uNear,-view.z);
}
`;
const stellarFragment = /* glsl */ `
varying vec3 vTint; varying float vAlpha;
void main(){
  vec2 q=gl_PointCoord-0.5;
  float d=dot(q,q);
  if(d>0.25)discard;
  /*
   * A point, not a puff.
   *
   * Two things were making these read as fuzz. The falloff was exp(-46 d), whose
   * 1/e radius is nearly a third of the quad — on a sprite four or five device
   * pixels across that is a soft ball, not a star. And there was a second wide term
   * at a tenth strength filling the rest of the quad, which is invisible on one
   * sprite and is haze once a few thousand of them overlap additively.
   *
   * 150 puts the 1/e radius inside a sixth of the quad, so effectively all the light
   * lands in the middle pixel or two and the edge is already black before the
   * discard — which is what stops the quad's own square from showing. The halo is
   * gone. A star is a point source and the honest way to draw one is to make it
   * small and let it be bright.
   */
  float core=exp(-d*150.0);
  gl_FragColor=vec4(vTint*core,vAlpha*core);
}
`;
const random = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const gauss = (seed: number) =>
  (random(seed) + random(seed + 101) + random(seed + 211) - 1.5) / 1.5;
const ARM_PITCH = 0.24;
const ARMS = 2;
const DISK_SCALE = 0.2;
const BULGE_R = 0.33;
const SMOOTH_DISK = 0.3;
const OLD_STARS = new THREE.Color("#ffd2a1");
const YOUNG_STARS = new THREE.Color("#8fb8ff");
const HII_REGION = new THREE.Color("#ff86a8");
interface Stellar {
  position: Float32Array;
  tint: Float32Array;
  size: Float32Array;
  seed: Float32Array;
}
/*
 * One icosahedron, shared by every star.
 *
 * Subdivision zero — twenty triangles. At the pixel and a half these are drawn at,
 * anything rounder is triangles nobody can see; the silhouette is already smoother
 * than the pixel grid it lands on.
 */
const STAR_GEOMETRY = new THREE.IcosahedronGeometry(1, 0);

const swarm = (
  { position, tint, size, seed }: Stellar,
  material: THREE.ShaderMaterial,
): THREE.InstancedMesh => {
  const count = size.length;
  /*
   * Cloned, not shared. The per-instance attributes below live on the geometry, so
   * two swarms pointing at one icosahedron would each overwrite the other's tints
   * and sizes — the second call would silently win and the first field would take
   * the wrong colours. Twenty triangles is a cheap thing to duplicate twice.
   */
  const mesh = new THREE.InstancedMesh(STAR_GEOMETRY.clone(), material, count);
  const at = new THREE.Matrix4();
  for (let i = 0; i < count; i += 1) {
    at.makeTranslation(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]);
    mesh.setMatrixAt(i, at);
  }
  mesh.instanceMatrix.needsUpdate = true;
  const geometry = mesh.geometry;
  geometry.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 3));
  geometry.setAttribute("aSize", new THREE.InstancedBufferAttribute(size, 1));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 1));
  // Every star is somewhere; culling the swarm as one box would drop the lot the
  // moment the lens turns away from its centre.
  mesh.frustumCulled = false;
  return mesh;
};

const starMaterial = (span: number, near: number) =>
  new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uHole: { value: new THREE.Vector3() },
      uAxis: { value: new THREE.Vector3(0, 1, 0) },
      uDrain: { value: 0 },
      uSuction: { value: 0 },
      uTide: { value: 0 },
      uOrbit: { value: 0 },
      uSpan: { value: span },
      uHollow: { value: 0.01 },
      uOpacity: { value: 0 },
      uAngular: { value: 0.0012 },
      uNear: { value: near },
      uChaos: { value: 0 },
      uVacuum: { value: 0 },
      uTime: { value: 0 },
    },
  });

const attach = ({ position, tint, size, seed }: Stellar) =>
  new THREE.BufferGeometry()
    .setAttribute("position", new THREE.BufferAttribute(position, 3))
    .setAttribute("aTint", new THREE.BufferAttribute(tint, 3))
    .setAttribute("aSize", new THREE.BufferAttribute(size, 1))
    .setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
export const galaxyGeometry = (count: number): Stellar => {
  const position = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const color = new THREE.Color();
  let written = 0;
  for (let k = 0; written < count && k < count * 8; k += 1) {
    const s = k * 17;
    const bulge = random(s + 1) < 0.34;
    let r: number;
    let x: number;
    let y: number;
    let z: number;
    if (bulge) {
      r = BULGE_R * random(s + 2) ** 1.2;
      const cosT = random(s + 3) * 2 - 1;
      const phi = random(s + 4) * Math.PI * 2;
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      x = r * sinT * Math.cos(phi);
      z = r * sinT * Math.sin(phi);
      y = r * cosT * 0.6;
    } else {
      r =
        -DISK_SCALE *
        (Math.log(1 - random(s + 2) * 0.999) +
          Math.log(1 - random(s + 3) * 0.999));
      if (r > 1) continue;
      const off = gauss(s + 5);
      const inArm = random(s + 12) >= SMOOTH_DISK;
      if (inArm && Math.abs(off + 0.42) < 0.14 && random(s + 6) < 0.85)
        continue;
      const theta = inArm
        ? Math.floor(random(s + 4) * ARMS) * ((Math.PI * 2) / ARMS) +
          Math.log(Math.max(r, 0.02) / 0.05) / Math.tan(ARM_PITCH) +
          off * (0.35 + 0.45 / (1 + r * 5))
        : random(s + 13) * Math.PI * 2;
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
      y = (0.008 + r * 0.05) * gauss(s + 7);
    }
    position.set([x, y, z], written * 3);
    const hii = !bulge && r > 0.18 && random(s + 8) > 0.982;
    color
      .copy(hii ? HII_REGION : OLD_STARS)
      .lerp(YOUNG_STARS, hii || bulge ? 0 : Math.min(1, (r / 0.45) ** 0.8))
      .multiplyScalar(hii ? 0.55 : 0.26 + random(s + 9) ** 3 * 0.62);
    color.toArray(tint, written * 3);
    size[written] = hii
      ? 2.0
      : bulge
        ? 0.5 + random(s + 10) * 0.5
        : 0.65 + random(s + 10) ** 2.4 * 2.3;
    seed[written] = random(s + 6);
    written += 1;
  }
  return { position, tint, size, seed };
};
/*
 * Field stars, on a shell around the corridor rather than in a slab ahead of it.
 *
 * This used to fill a box — x ±32, y ±20, z from 12 down to −53 — which is exactly
 * the volume a camera pointed down the corridor can see, and nothing else. It was
 * the right shape until the lens started turning: on the far side of Earth's lap the
 * shot faces back up the corridor and out to port, where the box has no stars at
 * all, so the sky went black in the one place the visitor had never looked before.
 *
 * A shell instead, centred on the middle of the rail. Radius rather than extent, so
 * every bearing gets the same density, and the cube root on the radius keeps that
 * density even through the volume instead of piling stars against the inside face.
 */
const FIELD_CENTRE = new THREE.Vector3(0, 2, -14);

/*
 * The deep field: everything out there that is only there to be out there.
 *
 * Separate from the star field on purpose, and the difference is not distance, it is
 * whether the well is allowed to have it. The field drains — it is part of what the
 * ending eats, and its material is driven every frame from the swallow. This layer
 * never is: nothing writes `uDrain` on the material it shares with the far galaxies,
 * so these sit exactly where they are put, through the corridor, through the finale
 * and through every law. Scenery, not matter.
 *
 * A thick shell rather than a sphere, and further out than the field, so it
 * parallaxes barely at all against it — which is what sells the field as *near*
 * stars and these as the rest of the universe behind them.
 *
 * 58 to 88 metres, and the ceiling is not taste: the camera is built with
 * `far: 110` (see `ReactorScene`). The first version of this layer sat at 95 to 150
 * and the sky dome at 150, so the dome was clipped away in its entirety and most of
 * these with it — which is exactly why the background read as empty no matter what
 * was put in it. Anything meant to be seen out here has to fit inside 110 metres of
 * the lens at every point on the rail. Colour runs cool by
 * default with a sixth warm and a scattering of genuinely red ones, because a sky
 * where every star is the same hue reads as noise rather than as distance.
 */
const deepGeometry = (count: number): Stellar => {
  const position = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const cosT = random(i * 3 + 5) * 2 - 1;
    const phi = random(i * 3 + 7) * Math.PI * 2;
    const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
    const radius = 58 + random(i * 3 + 11) ** (1 / 3) * 30;
    position.set(
      [
        FIELD_CENTRE.x + radius * sinT * Math.cos(phi),
        FIELD_CENTRE.y + radius * cosT,
        FIELD_CENTRE.z + radius * sinT * Math.sin(phi),
      ],
      i * 3,
    );
    // Same temperature spread as the near field — see the note there.
    const warm = random(i * 3 + 13);
    color.setHSL(
      warm > 0.94 ? 0.03 : warm > 0.82 ? 0.1 : warm > 0.56 ? 0.14 : 0.6,
      warm > 0.82 ? 0.2 : 0.08,
      0.3 + random(i * 3 + 19) ** 3 * 0.65,
    );
    color.toArray(tint, i * 3);
    /*
     * Nearly all the same size, and that is the point.
     *
     * A star is a point source: at eighty metres none of these is resolved, so what
     * separates one from another is how bright it is, not how wide. The first pass
     * spread the size over eight to one and the bright ones came out twelve pixels
     * across — which does not read as a bright star, it reads as an out-of-focus
     * smudge. The variety moved to lightness above, where it belongs.
     */
    size[i] = 0.9 + random(i * 3 + 23) ** 2 * 0.85;
    seed[i] = random(i * 3 + 29);
  }
  return { position, tint, size, seed };
};

const fieldGeometry = (count: number): Stellar => {
  const position = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const cosT = random(i + 2) * 2 - 1;
    const phi = random(i + 3) * Math.PI * 2;
    const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
    const radius = 46 + (48 * random(i + 4)) ** (1 / 3) * 12;
    position.set(
      [
        FIELD_CENTRE.x + radius * sinT * Math.cos(phi),
        FIELD_CENTRE.y + radius * cosT * 0.72,
        FIELD_CENTRE.z + radius * sinT * Math.sin(phi),
      ],
      i * 3,
    );
    /*
     * Colour by stellar type rather than by decoration.
     *
     * Real starlight is nearly white — the hue is a temperature, and even a deep
     * orange giant is only faintly orange to the eye. The spread here is roughly the
     * proportions of a naked-eye sky: mostly white and blue-white, a fifth yellow,
     * a tenth orange, and the odd red. Saturation stays under a quarter, because the
     * saturated blue this used to carry is the single thing that made the field read
     * as confetti instead of as stars.
     */
    const kind = random(i + 7)
    color.setHSL(
      kind > 0.93 ? 0.04 : kind > 0.8 ? 0.09 : kind > 0.55 ? 0.13 : 0.6,
      kind > 0.8 ? 0.22 : 0.1,
      0.34 + random(i + 8) ** 3 * 0.6,
    );
    color.toArray(tint, i * 3);
    size[i] = 0.5 + random(i + 11) ** 3 * 2.2;
    seed[i] = random(i + 13);
  }
  return { position, tint, size, seed };
};
export const spiralFall = (
  r: number,
  h: number,
  shape: SwallowShape,
  span: number,
  seed = 0.5,
) => {
  const fall = Math.min(0.985, shape.drain ** (1 + r / span));
  const stretch = 1 + shape.tide * fall * 1.5;
  return {
    fall,
    radius: r * (1 - fall) * (1 + shape.tide * fall * (seed - 0.5) * 1.7),
    height: h * (1 - Math.min(1, fall * 1.4)),
    wind:
      shape.orbit *
      Math.min(5, Math.max(0.14, 1 - fall) ** -1.5) *
      0.22 *
      (0.75 + seed * 0.5),
    stretch,
    squeeze: 1 / Math.sqrt(stretch),
  };
};
/*
 * Galaxies the corridor never points at.
 *
 * The rail looks one way for its whole length, so everything in this scene was built
 * where that one view could see it — and the moment the Rig started lapping Earth,
 * the shot spent half the detour facing directions that had nothing in them but a
 * flat sky. These are what is out there when the lens turns: three more spirals, far
 * enough to be a smudge and a few hundred stars, placed off the rail's axis rather
 * than along it.
 *
 * They reuse the nucleus galaxy's own geometry — same generator, same buffer, one
 * extra draw call each — because a distant galaxy is the near one seen small, and
 * authoring a second kind of spiral to say that would be a worse answer than a
 * rotation and a scale.
 *
 * Placed on a ring around *Earth* rather than scattered off the rail, which is the
 * correction that made them show up at all. The lap carries the lens around Earth
 * looking inward, so the patch of sky behind the planet sweeps a full circle as it
 * goes; a ring centred on Earth is therefore the one arrangement where each of them
 * is guaranteed to come up behind it. Scattered anywhere else they were real, lit
 * and off-frame for the whole detour.
 */
const FAR_GALAXIES = [
  { at: [43.2, 16, 38.5], scale: 5, tilt: [0.5, 0.9, -0.3] },
  { at: [-59.1, -10, 20.4], scale: 4.2, tilt: [-0.9, 0.2, 0.6] },
  { at: [7.7, 26, -59.2], scale: 4.6, tilt: [0.2, -1.3, 0.35] },
  { at: [-38, 30, -52], scale: 3.4, tilt: [1.1, 0.4, 0.2] },
  { at: [52, -26, -34], scale: 3.8, tilt: [-0.4, -0.7, 0.9] },
] as const;

const GALAXY_RADIUS = 11.4;
const GALAXY_SPAN = 0.22;
const FIELD_SPAN = 14;
const UP = new THREE.Vector3(0, 1, 0);
const AXIS = new THREE.Vector3();
const SPIN = new THREE.Quaternion();
const stellarMaterial = (span: number, size: number, near: number) =>
  new THREE.ShaderMaterial({
    vertexShader: stellarVertex,
    fragmentShader: stellarFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uHole: { value: new THREE.Vector3() },
      uAxis: { value: new THREE.Vector3(0, 1, 0) },
      uDrain: { value: 0 },
      uSuction: { value: 0 },
      uTide: { value: 0 },
      uOrbit: { value: 0 },
      uSpan: { value: span },
      uHollow: { value: 0.01 },
      uOpacity: { value: 0 },
      uSize: { value: size },
      uPixel: { value: 540 },
      uNear: { value: near },
      uTime: { value: 0 },
      uChaos: { value: 0 },
      uVacuum: { value: 0 },
    },
  });
export const CosmicWorld = ({ quality }: { quality: Quality }) => {
  const galaxy = useRef<THREE.Points>(null);
  const backdrop = useRef<THREE.Mesh>(null);
  const resources = useMemo(() => {
    const field = starMaterial(FIELD_SPAN, 1.5)
    const dust = starMaterial(GALAXY_SPAN, 0.4)
    return {
      field,
      dust,
      galaxy: attach(galaxyGeometry(quality === "cinema" ? 9000 : 3200)),
      /*
       * Counts down again, and this time it is the geometry that asks for it: each
       * of these is twenty triangles rather than a quad, and each is a *resolved*
       * disc rather than a smear, so far fewer of them fill a sky. Nine hundred and
       * six hundred put roughly eighty stars in a 42-degree frame, which is about
       * what a dark-sky night gives the naked eye.
       */
      stars: swarm(fieldGeometry(quality === "cinema" ? 600 : 260), field),
      deep: swarm(deepGeometry(quality === "cinema" ? 900 : 380), dust),
      halo: stellarMaterial(GALAXY_SPAN, 0.06, 4.2),
      /*
       * Their own material, and deliberately never driven. Sharing the nucleus's
       * would drain them into the well along with everything else, and a galaxy
       * eighty metres off the rail is not in the well's reach — it is the sky.
       */
      /*
       * Point size 0.12 against the nucleus's 0.06, and that is distance arithmetic
       * rather than taste. These sit sixty-odd metres out where the nucleus sits at
       * twenty-five, and `gl_PointSize` divides by view depth: at 0.06 every star in
       * them measured under half a pixel, which does not render as a faint galaxy,
       * it renders as nothing at all — while 0.22, the first correction, overshot
       * into blur.
       */
      far: stellarMaterial(GALAXY_SPAN, 0.12, 1.0),
      nebula: new THREE.ShaderMaterial({
        // Seen from inside, so the winding is backwards and depth is nobody's
        // business: this is the far wall of everything.
        side: THREE.BackSide,
        vertexShader: skyVertex,
        fragmentShader: nebulaFragment,
        depthWrite: false,
        uniforms: {
          uFade: { value: 1 },
          uChaos: { value: 0 },
          uVacuum: { value: 0 },
        },
      }),
    };
  }, [quality]);
  useEffect(
    () => () => {
      resources.stars.dispose();
      resources.galaxy.dispose();
      resources.nebula.dispose();
      resources.field.dispose();
      resources.halo.dispose();
      resources.far.dispose();
      resources.dust.dispose();
      resources.deep.dispose();
    },
    [resources],
  );
  useFrame(({ clock, size, viewport, camera }) => {
    const b = sceneState.build;
    const chaos = reactorControl.lawMix.CHAOS;
    const vacuum = reactorControl.lawMix.VACUUM;
    const s = swallowShape(sceneState.swallow);
    // The galaxy feeds the nucleus throughout the dolly; the finale takes the rest.
    const feed = THREE.MathUtils.smoothstep(b, 0.12, 1) * 0.52;
    const galaxySwallow = swallowShape(Math.max(sceneState.swallow, feed));
    const time = clock.elapsedTime;
    const axis = holeAxis(AXIS, time);
    const shadow = captureRs(HOLE_SPIN) * holeRadiusFor(b, sceneState.swallow);
    const pixel = size.height * viewport.dpr * 0.5;
    /*
     * Metres of star radius per metre of view depth, for a fixed pixel target.
     *
     * Read from the live camera because the Rig moves the field of view every frame
     * — a counter-zoom at the ending, a breath during standby — and a star whose
     * world radius ignored that would swell and shrink with the lens. 1.15 pixels of
     * radius is the smallest a lit sphere can be and still resolve rather than
     * scintillate between pixels.
     */
    const angular =
      camera instanceof THREE.PerspectiveCamera
        ? (1.15 / pixel) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
        : 0.0012;
    /*
     * The sky is a dome the lens sits inside, and only its *position* follows.
     *
     * Three versions of this. It began as a 180 × 120 plane parked at z −46, which
     * is fine for a lens that only ever looks down the corridor and broke the moment
     * the Rig started lapping Earth: a plane has edges, the shot found one, and a
     * hard black rectangle cut a third of the frame. Locking the plane to the
     * camera's *orientation* removed the edge and bought the worse bug — the
     * backdrop then showed the identical image whichever way the lens turned, so
     * everything in the scene moved except the one thing behind all of it.
     *
     * A sphere fixes both. Carrying the position keeps the lens centred — the
     * dome can never be reached or clipped — while leaving the orientation in
     * world space, which is the whole point: turn, and a different piece of sky
     * is there.
     */
    if (backdrop.current) backdrop.current.position.copy(camera.position)
    resources.nebula.uniforms.uChaos.value = chaos
    resources.nebula.uniforms.uVacuum.value = vacuum
    {
      // Static except for the two laws that are allowed to touch the whole sky.
      const u = resources.far.uniforms;
      u.uOpacity.value = 0.55 * (1 - vacuum * 0.35);
      u.uPixel.value = size.height * viewport.dpr * 0.5;
      u.uTime.value = clock.elapsedTime;
      u.uChaos.value = chaos;
      u.uVacuum.value = vacuum;
      const d = resources.dust.uniforms;
      d.uOpacity.value = 0.7 * (1 - vacuum * 0.3);
      d.uAngular.value = angular;
      d.uTime.value = clock.elapsedTime;
      d.uChaos.value = chaos;
      d.uVacuum.value = vacuum;
    }
    resources.nebula.uniforms.uFade.value =
      (1 - s.drain * 0.95) * (1 - vacuum * 0.7);
    if (galaxy.current) {
      const scale = GALAXY_RADIUS * (0.84 + b * 0.16);
      galaxy.current.scale.setScalar(scale);
      galaxy.current.quaternion
        .setFromUnitVectors(UP, axis)
        .multiply(
          SPIN.setFromAxisAngle(
            UP,
            // CHAOS winds the disk up; VACUUM brakes it to a near standstill —
            // a sky with nothing left to feed the middle is a sky holding still.
            0.4 + b * 0.42 + time * (0.006 + chaos * 0.05 - vacuum * 0.0058),
          ),
        );
      const u = resources.halo.uniforms;
      u.uHollow.value = Math.max(1e-3, shadow / scale);
      u.uPixel.value = pixel;
      u.uDrain.value = galaxySwallow.drain;
      u.uSuction.value = galaxySwallow.suction;
      u.uTide.value = galaxySwallow.tide * sceneState.distortion;
      u.uOrbit.value = galaxySwallow.orbit;
      u.uTime.value = time;
      u.uChaos.value = chaos;
      u.uVacuum.value = vacuum;
      u.uOpacity.value =
        (0.65 + THREE.MathUtils.smoothstep(b, 0.18, 0.64) * 0.25) *
        (1 - galaxySwallow.crossing) *
        // A gentle global dim on top of the shader's per-star extinction, which
        // is the part that actually reads as VACUUM.
        (1 - vacuum * 0.2);
    }
    {
      const u = resources.field.uniforms;
      u.uAngular.value = angular;
      u.uHole.value.copy(holeCenter);
      u.uAxis.value.copy(axis);
      u.uHollow.value = Math.max(1e-3, shadow);
      u.uDrain.value = s.drain;
      u.uSuction.value = s.suction;
      u.uTide.value = s.tide * sceneState.distortion;
      u.uOrbit.value = s.orbit;
      u.uTime.value = time;
      u.uChaos.value = chaos;
      u.uVacuum.value = vacuum;
      u.uOpacity.value = 0.82 * (1 - s.crossing) * (1 - vacuum * 0.2);
    }
  });
  return (
    <>
      <mesh ref={backdrop} material={resources.nebula} renderOrder={-10}>
        <sphereGeometry args={[96, 40, 24]} />
      </mesh>
      <primitive object={resources.stars} />
      <primitive object={resources.deep} renderOrder={-9} />
      {FAR_GALAXIES.map((g) => (
        <points
          key={g.at.join()}
          geometry={resources.galaxy}
          material={resources.far}
          position={[...g.at]}
          rotation={[...g.tilt]}
          scale={g.scale}
          frustumCulled={false}
        />
      ))}
      <points
        ref={galaxy}
        geometry={resources.galaxy}
        material={resources.halo}
        position={holeCenter}
        frustumCulled={false}
      />
      <Planets quality={quality} />
      <CosmicEvents quality={quality} />
    </>
  );
};
export const CosmicIntro = ({ copy }: { copy: Copy }) => {
  const root = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      addTick(() => {
        if (!root.current) return;
        root.current.style.opacity = String(
          1 - THREE.MathUtils.smoothstep(sceneState.build, 0.005, 0.055),
        );
      }),
    [],
  );
  return (
    <div ref={root} className="cosmic-intro" aria-hidden="true">
      <p className="cosmic-eyebrow">
        DG /{" "}
        {copy.locale === "es" ? "OBSERVATORIO DIGITAL" : "DIGITAL OBSERVATORY"}
      </p>
      <h1>
        David
        <br />
        <span>Guillen.</span>
      </h1>
      <div className="cosmic-intro-footer">
        <span>FULL STACK SENIOR · BUENOS AIRES</span>
        <span>{copy.hero.cue} ↓</span>
      </div>
    </div>
  );
};
