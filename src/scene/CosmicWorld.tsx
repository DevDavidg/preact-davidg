import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import type { Copy } from '../content'
import { addTick } from '../motion/ticker'
import {
  captureRs,
  HOLE_SPIN,
  holeAxis,
  holeCenter,
  holeRadiusFor,
} from './blackHole'
import { sceneState, swallowShape, type SwallowShape } from './sceneState'

/*
 * Cosmic observatory: three worlds and a galaxy, all of it falling into the well
 * at the end of the corridor once the finale starts.
 *
 * Two things here are worth knowing before reading any of it.
 *
 * The first is that the galaxy is not a backdrop that happens to sit behind the
 * aperture — the singularity *is* its nucleus. The point cloud is centred exactly
 * on `holeCenter` and its plane is `holeAxis`, the accretion disk's own plane, so
 * the bulge, the arms and the disk the well is being fed by are one object seen
 * from one angle. Anything that drifts those two apart turns the ending back into
 * a ring of dots parked near a hole.
 *
 * The second is that nothing in this file integrates. Every position, angle,
 * stretch and brightness is a pure function of `swallowShape(sceneState.swallow)`,
 * which is itself a pure function of scroll — so the whole collapse runs backwards
 * exactly when the visitor scrolls up. `scripts/check-cosmos.ts` is where that is
 * actually asserted.
 */

const vertex = /* glsl */ `
uniform vec3 uTideDir; uniform float uTide; uniform float uSqueeze;
varying vec3 vP; varying vec3 vN; varying vec3 vT; varying vec3 vView; varying vec2 vUv; varying vec3 vSun;
const vec3 SUN=normalize(vec3(-1.0,0.45,0.35));
void main(){
  vP=position;vUv=uv;
  mat3 m=mat3(modelMatrix);
  vN=normalize(m*normal);
  // East on the sphere. The relief basis and the cloud shadow's parallax are both
  // texture-space directions, so they need the surface's own tangent frame rather
  // than anything the camera knows about.
  vec3 east=cross(vec3(0.0,1.0,0.0),normal);
  vT=normalize(m*(dot(east,east)>1e-8?east:vec3(1.0,0.0,0.0)));
  // The sun in object space: mᵀ·sun, since m is a rotation and a uniform scale and
  // normalize takes the scale back out. Saturn's ring shadow is a ray cast in the
  // planet's own equatorial plane, which is the one place that frame is needed.
  vSun=normalize(vec3(dot(m[0],SUN),dot(m[1],SUN),dot(m[2],SUN)));
  vec4 world=modelMatrix*vec4(position,1.0);
  /*
   * Spaghettification, as a linear map about the body's own centre: elongate along
   * the line to the well, compress across it. It is diagonal in the
   * {radial, transverse} basis, so the normal transform is the same decomposition
   * with its eigenvalues inverted — which is what keeps the terminator honest while
   * the planet is being drawn out into a filament. Done here rather than with a
   * non-uniform group scale because a parent scale between two rotations shears,
   * and because mat3(modelMatrix) is the wrong normal matrix the moment it does.
   */
  vec3 centre=modelMatrix[3].xyz;
  vec3 rel=world.xyz-centre;
  float along=dot(rel,uTideDir);
  world.xyz=centre+uTideDir*along*(1.0+uTide)+(rel-uTideDir*along)*uSqueeze;
  float na=dot(vN,uTideDir);
  vN=normalize((vN-uTideDir*na)/uSqueeze+uTideDir*(na/(1.0+uTide)));
  vView=cameraPosition-world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`

/*
 * One shader, three very different objects, because what separates them is which
 * physics is allowed to be skipped rather than how they are drawn.
 *
 * Earth gets the full treatment: relief, a cloud deck with its own rotation and its
 * own shadow, water-only specular and Rayleigh scattering. The moon gets none of
 * it and instead gets the scattering law a dark regolith actually obeys. Saturn is
 * a scattering atmosphere with no surface at all, plus the one detail that makes it
 * unmistakable — its rings' shadow, cast for real.
 *
 * `uMask` is a channel-packed map, three.js's own packing: R is elevation, G is
 * roughness (land is rough, water is glass) and B is cloud cover. Three maps for
 * one fetch, and no alpha plane to pay for. Saturn binds the ring map here instead.
 */
const planetFragment = /* glsl */ `
uniform vec3 uAir; uniform float uKind; uniform float uCloudSpin; uniform float uRelief;
uniform sampler2D uSurface; uniform sampler2D uNight; uniform sampler2D uMask;
varying vec3 vP; varying vec3 vN; varying vec3 vT; varying vec3 vView; varying vec2 vUv; varying vec3 vSun;
const vec3 SUN=normalize(vec3(-1.0,0.45,0.35));
const vec2 TEXEL=vec2(1.0/2048.0,1.0/1024.0);
/** Height-field gradient as a tangent-space tilt. Four taps beat shipping a normal map. */
vec2 slope(sampler2D map,vec2 uv){
  return vec2(texture2D(map,uv-vec2(TEXEL.x,0.0)).r-texture2D(map,uv+vec2(TEXEL.x,0.0)).r,
              texture2D(map,uv-vec2(0.0,TEXEL.y)).r-texture2D(map,uv+vec2(0.0,TEXEL.y)).r);
}
void main(){
  vec3 n0=normalize(vN),eye=normalize(vView);
  vec3 east=normalize(vT-n0*dot(vT,n0)),north=cross(n0,east);
  float geo=dot(n0,SUN);
  float grazing=1.0-max(dot(n0,eye),0.0);
  vec3 surface=texture2D(uSurface,vUv).rgb;
  vec3 col;
  if(uKind<0.5){
    vec3 mask=texture2D(uMask,vUv).rgb;
    float land=mask.g,ocean=1.0-land;
    // Relief on land only: the sea is flat, and a bumped ocean reads as a static
    // crawling over the water. It shows up at the terminator and nowhere else,
    // which is exactly where a planet stops looking like a printed globe.
    vec2 tilt=slope(uMask,vUv);
    vec3 n=normalize(n0+(east*tilt.x+north*tilt.y)*uRelief*land);
    // The sun is half a degree wide, so the terminator is a band, not an edge.
    float day=max(dot(n,SUN),0.0)*smoothstep(-0.05,0.06,geo);
    // Real ocean albedo is ~0.06 against land's ~0.25, and the map is a photograph
    // with the sky's own blue already in the water.
    col=surface*mix(0.70,1.0,land)*(0.006+day*1.55);
    // Sun glint, water only, on the *geometric* normal — waves are not in the map,
    // and the specular is what tells an eye which parts of the blue are liquid.
    vec3 halfv=normalize(SUN+eye);
    float fres=0.02+0.98*pow(1.0-max(dot(eye,n0),0.0),5.0);
    col+=vec3(1.0,0.95,0.86)*pow(max(dot(n0,halfv),0.0),190.0)*fres*ocean*2.8;
    /*
     * Clouds: their own layer, their own rotation, and their own shadow. The
     * shadow lookup is offset along the sun's direction *in texture space*, which
     * is the whole trick — the parallax between deck and ground is what makes the
     * cloud read as floating above the surface rather than painted onto it.
     */
    vec2 cloudUv=vUv+vec2(uCloudSpin,0.0);
    float cloud=smoothstep(0.05,0.55,texture2D(uMask,cloudUv).b);
    vec2 sunUv=vec2(dot(SUN,east),dot(SUN,north))*TEXEL*16.0;
    col*=1.0-smoothstep(0.06,0.6,texture2D(uMask,cloudUv-sunUv).b)*0.5*step(0.0,geo);
    // Cloud tops are bright and forward-scatter hard, which is why a lit rim of
    // cloud survives at the terminator after the ground under it has gone dark.
    float forward=pow(max(dot(eye,-SUN),0.0),3.0)*0.55*smoothstep(-0.28,0.14,geo);
    col=mix(col,vec3(0.96,0.97,1.0)*(0.012+day*1.2+forward),cloud*0.93);
    // Night side: city light, put out by whatever cloud is above it.
    col+=texture2D(uNight,vUv).rgb*(1.0-smoothstep(-0.10,0.07,geo))*(1.0-cloud*0.8)*0.85;
    /*
     * Rayleigh. Three terms, and all three are the reason the limb is blue: the
     * optical depth along the view ray grows toward the edge of the disc, the phase
     * function is 1 + cos²θ so the scatter is strongest toward and away from the
     * sun, and none of it arrives at all unless the air itself is lit.
     */
    float cosT=dot(eye,-SUN);
    col+=uAir*pow(grazing,3.2)*0.75*(1.0+cosT*cosT)*smoothstep(-0.32,0.28,geo)*1.4;
    // ...and the path through the terminator is long enough to have scattered the
    // blue out of itself, which is what a sunset is.
    col+=vec3(1.0,0.40,0.14)*pow(grazing,5.5)*smoothstep(0.22,0.0,abs(geo))*2.2;
    // Aerial perspective: even at noon you are looking through air.
    col+=uAir*day*0.05;
  }else if(uKind>1.5){
    // The map is a photograph, so its own luminance is the height field: crater
    // floors are dark because they are down. Doubling as bump costs four taps.
    vec2 g=vec2(dot(texture2D(uSurface,vUv-vec2(TEXEL.x,0.0)).rgb-texture2D(uSurface,vUv+vec2(TEXEL.x,0.0)).rgb,vec3(0.34)),
                dot(texture2D(uSurface,vUv-vec2(0.0,TEXEL.y)).rgb-texture2D(uSurface,vUv+vec2(0.0,TEXEL.y)).rgb,vec3(0.34)));
    vec3 n=normalize(n0+(east*g.x+north*g.y)*uRelief);
    float mu0=max(dot(n,SUN),0.0),muv=max(dot(n,eye),0.0);
    /*
     * Lommel-Seeliger, not Lambert: mu0/(mu0+mu). A dark, porous regolith scatters
     * once and the emergent brightness barely falls off toward the limb, which is
     * why the full moon reads as a flat disc rather than a shaded ball. Lambert
     * gives you the grey plastic sphere, and no amount of tuning gets it back.
     */
    float scatter=mu0/max(0.05,mu0+muv);
    // Opposition surge: at small phase angles the regolith hides its own shadows,
    // so the disc brightens far faster than geometry says it should.
    float phase=acos(clamp(dot(SUN,eye),-1.0,1.0));
    // Geometric albedo 0.12 against Earth's 0.31, and the map is scanned to
    // mid-grey — so it has to come down by roughly that ratio to be asphalt.
    col=surface*0.44*scatter*(1.0+0.55*exp(-phase*5.5))*2.4*smoothstep(-0.04,0.05,geo);
  }else{
    // A gas giant has no surface: the light comes back out of a deep scattering
    // atmosphere, so it limb-darkens hard and has no specular anywhere.
    col=surface*(0.004+max(geo,0.0)*1.5)*pow(max(dot(n0,eye),0.02),0.42);
    /*
     * The rings' shadow on the planet, cast rather than faked: walk the sun ray
     * from this point down to the equatorial plane and ask the ring's own alpha
     * map what is standing in the way. It cannot be a painted gradient because it
     * has to move with the axial tilt, and it is the single detail that makes the
     * silhouette unmistakably Saturn.
     */
    vec3 p=normalize(vP);
    float t=-p.y/(abs(vSun.y)<1e-3?1e-3:vSun.y);
    float u=(length((p+vSun*t).xz)-1.24)/1.03;
    if(t>0.0&&u>0.0&&u<1.0)col*=1.0-texture2D(uMask,vec2(u,0.5)).a*0.72;
  }
  // Saturn's own limb haze. Earth built its atmosphere above; the moon has none.
  col+=uAir*pow(grazing,4.0)*smoothstep(-0.25,0.3,geo)*((uKind>0.5&&uKind<1.5)?0.5:0.0);
  gl_FragColor=vec4(col,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const ringFragment = /* glsl */ `
uniform vec3 uColor; uniform sampler2D uMask;
varying vec3 vP; varying vec3 vN; varying vec3 vView; varying vec3 vSun;
const vec3 SUN=normalize(vec3(-1.0,0.45,0.35));
void main(){
  float u=(length(vP.xy)-1.24)/1.03;
  if(u<0.0||u>1.0)discard;
  vec4 ring=texture2D(uMask,vec2(u,0.5));
  /*
   * The planet's shadow on the ring. The ring point lies in the equatorial plane
   * and the planet is the unit sphere at the origin of this mesh's own frame, so
   * the umbra is just "does the ray to the sun miss the sphere" — a dot product and
   * a length. The soft edge is the penumbra; the floor is Saturn-shine, because a
   * shadowed ring is lit by the planet next to it and never goes fully black.
   */
  vec3 q=vec3(vP.xy,0.0);
  float s=-dot(q,vSun);
  float umbra=s>0.0?mix(0.12,1.0,smoothstep(0.96,1.06,length(q+vSun*s))):1.0;
  // Beer-Lambert through a slab: seen edge-on the same ice is optically thicker,
  // which is why the ring thins to a bright line as the tilt closes.
  float slant=1.0/max(0.10,abs(dot(normalize(vN),normalize(vView))));
  // Ice forward-scatters, so the limb of the ring pointing away from you is the
  // bright one. A ring of uniform brightness is the giveaway of a flat decal.
  float forward=1.0+max(-dot(normalize(vView),SUN),0.0)*0.6;
  gl_FragColor=vec4(uColor*ring.rgb*2.1*forward*umbra,1.0-pow(1.0-ring.a,slant));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const nebulaFragment = /* glsl */ `
uniform float uFade; uniform sampler2D uSky; varying vec2 vUv;
void main(){vec2 p=(vUv-0.5)*vec2(0.82,0.85);
p=mat2(0.94,-0.34,0.34,0.94)*p;
vec3 col=texture2D(uSky,p+vec2(0.5,0.51)).rgb*0.7;
gl_FragColor=vec4(col*uFade,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`

/*
 * Stars and galaxy, one shader, and the infall lives in the vertex stage.
 *
 * On the GPU because there are several thousand of them and the alternative is a
 * per-frame CPU loop over every point; and as a custom material rather than
 * `PointsMaterial` because a galaxy needs *per-point size* — a bulge is thousands
 * of unresolved specks and the arms are the few bright ones that give a point
 * cloud any structure at all. One shared size is the difference between a galaxy
 * and gravel.
 *
 * `uSpan` is the only per-object number: it sets how quickly the fall reaches
 * outward, so the same shader eats a 1-unit galaxy and a 60-metre star box.
 * The CPU twin of this maths is `spiralFall` below, which is what the check
 * script asserts — keep the two in step or the planets and the sky will fall on
 * different schedules.
 */
const stellarVertex = /* glsl */ `
attribute vec3 aTint; attribute float aSize; attribute float aSeed;
uniform vec3 uHole; uniform vec3 uAxis;
uniform float uDrain; uniform float uSuction; uniform float uTide; uniform float uOrbit;
uniform float uSpan; uniform float uHollow; uniform float uOpacity; uniform float uSize; uniform float uPixel; uniform float uNear;
varying vec3 vTint; varying float vAlpha;
void main(){
  vec3 d=position-uHole;
  float h=dot(d,uAxis);
  vec3 plane=d-uAxis*h;
  float r=length(plane);
  vec3 radial=r>1e-4?plane/r:vec3(1.0,0.0,0.0);
  vec3 tangent=cross(uAxis,radial);
  /*
   * How far along its fall this star is. The exponent carries the whole idea: it is
   * 1 at the centre, so the nucleus tracks the drain exactly, and it grows with
   * radius, so the outskirts hold their orbit while the core is already gone and
   * then let go all at once near the end. Every star still arrives at drain 1,
   * which is what stops the outer disk from being left hanging in an empty frame.
   *
   * uSuction is deliberately *not* in here. It is a beat — it returns to zero
   * between gulps — and a beat multiplied onto a position is a star coming back out
   * of the hole between pulls, which is the one thing the swallow curve exists to
   * forbid. The gulps are still felt, because four fifths of the drain *is* the
   * three beats, so this climbs steeply through each one; and the kick itself goes
   * on brightness and size below, where there is nothing to give back.
   */
  float fall=min(0.985,pow(uDrain,1.0+r/uSpan));
  // Angular rate runs away as the orbit decays — r^-3/2, bounded, because the rail
  // is finite and the real law parks most of the turns in the last few pixels.
  float wind=uOrbit*min(5.0,pow(max(0.14,1.0-fall),-1.5))*0.22*(0.75+aSeed*0.5);
  // Spaghettification for a cloud: the stream smears along the radius by a
  // per-star amount, and the disk it came out of collapses into the plane.
  float rn=r*(1.0-fall)*(1.0+uTide*fall*(aSeed-0.5)*1.7);
  vec3 p=uHole+(radial*cos(wind)+tangent*sin(wind))*rn+uAxis*h*(1.0-min(1.0,fall*1.4));
  vec4 view=viewMatrix*modelMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*view;
  gl_PointSize=uPixel*uSize*aSize*(1.0+fall*1.6+uSuction*0.3)/max(0.35,-view.z);
  // Beamed and blueshifted on the way down, then gone: light from inside the
  // horizon does not come back out, and nothing draws inside the shadow either —
  // which is also what puts the dark bite in the middle of the bulge. The
  // convergence to blue-white is heavy on purpose: at a lighter mix the infalling
  // arms keep their own colours and the whole collapse reads as pink confetti.
  vTint=mix(aTint,vec3(0.72,0.85,1.0),fall*fall*0.92)*(1.0+fall*fall*3.2+uSuction*0.4);
  vAlpha=uOpacity*(1.0-smoothstep(0.80,0.975,fall))*smoothstep(uHollow*0.8,uHollow*1.4,length(p-uHole))
    // Nothing within a few metres of the lens. The galaxy shares the accretion
    // disk's plane, which runs almost straight down the corridor, so the camera
    // passes *through* its near arm on the way to the gate — and a star three metres
    // away is a fat coloured blob rather than a star. Fading them is cheaper than
    // shrinking the galaxy until it no longer frames the aperture it is behind.
    *smoothstep(uNear*0.45,uNear,-view.z);
}
`
const stellarFragment = /* glsl */ `
varying vec3 vTint; varying float vAlpha;
void main(){
  vec2 q=gl_PointCoord-0.5;
  float d=dot(q,q);
  if(d>0.25)discard;
  // Gaussian, not a disc: a star is a point spread function, and a hard circle two
  // pixels across reads as confetti.
  float core=exp(-d*11.0);
  gl_FragColor=vec4(vTint*core,vAlpha*core);
}
`

const random = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
/** Three uniforms summed: near enough to normal, in one line, and deterministic. */
const gauss = (seed: number) =>
  (random(seed) + random(seed + 101) + random(seed + 211) - 1.5) / 1.5

/**
 * Arm pitch, radians. The Milky Way's is ~12°.
 *
 * The number that decides whether the thing reads as a galaxy. A logarithmic
 * spiral opens out as it goes, which is why real arms sweep; the previous pass
 * placed stars by `i % 3` at a fixed angular rate, and a fixed rate draws an
 * Archimedean spiral — evenly spaced arcs that read as a pinwheel decal.
 */
const ARM_PITCH = 0.24
/** Two arms. Grand-design spirals have two; three or more reads as a flower. */
const ARMS = 2
/** Scale length of the disk, in galaxy radii. Sets where the light actually is. */
const DISK_SCALE = 0.2
/**
 * Outer edge of the bulge, in galaxy radii — its half-light radius lands about a
 * third of the way in.
 *
 * Sized against the *shadow*, not against the disk. The shader hollows out every
 * star inside ~1.4× the shadow's apparent radius, which at the top of the corridor
 * is about 0.1 in these units, so a tighter bulge is a bulge that is entirely behind
 * the hole and therefore invisible. This puts half its light in the band between the
 * hollow and 0.3 R: a bright halo hugging the shadow, which is the whole image.
 */
const BULGE_R = 0.3
/**
 * How many disk stars ignore the arms, and why any of them must.
 *
 * A galaxy is not two ribbons. Real spirals carry a smooth disk underneath the arms,
 * and without it the arm/inter-arm contrast is total — the first pass at this
 * measured nineteen times the mean azimuthal density, which draws as a pinwheel
 * line-art rather than as a mass of stars with structure in it.
 */
const SMOOTH_DISK = 0.3

/*
 * The two stellar populations, and why they are colours rather than hues.
 *
 * A K-giant bulge and a B-star arm, interpolated in RGB. The first pass ran a hue
 * ramp from 0.1 to 0.6 instead, which is the obvious thing to write and is wrong for
 * one reason: the shortest hue path from yellow to blue goes through *green*, so the
 * mid-radius arms came out teal and the whole object read as a smudge of pond water.
 * Real populations run yellow → white → blue, which is what a straight line in RGB
 * between these two does.
 */
const OLD_STARS = new THREE.Color('#ffd2a1')
const YOUNG_STARS = new THREE.Color('#8fb8ff')
/** HII regions: ionised hydrogen, and the only saturated thing in a real spiral. */
const HII_REGION = new THREE.Color('#ff86a8')

interface Stellar {
  position: Float32Array
  tint: Float32Array
  size: Float32Array
  seed: Float32Array
}

const attach = ({ position, tint, size, seed }: Stellar) =>
  new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(position, 3))
    .setAttribute('aTint', new THREE.BufferAttribute(tint, 3))
    .setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    .setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

/**
 * A spiral galaxy, in normalised units: everything lands inside radius 1, centred
 * on the origin, with the disk in the XZ plane. The caller scales and orients it,
 * which is what lets the nucleus be pinned to the singularity.
 *
 * Five things have to be true at once or the cloud does not read as a galaxy, and
 * each is one clause below:
 *
 * - **A bulge.** Dense, steeply concentrated, and reaching right up to the middle,
 *   so the eye is handed a single centre. Without one the arms read as an annulus
 *   with a hole in it, which is precisely what a well at the centre must not look
 *   like — the shadow has to be a bite taken out of light, not a gap.
 * - **Logarithmic arms**, at a real pitch, with the scatter falling off as 1/r
 *   because an arm's width is roughly constant in distance rather than in angle.
 * - **An exponential disk.** Sampled as Gamma(2, h) — the sum of two logs — which
 *   is exactly the r·e^(-r/h) profile a disk's star counts follow, so the light
 *   peaks a fifth of the way out and tails off instead of filling to the rim.
 * - **A thin disk that flares**, because the same vertical dispersion carries
 *   further out where the disk's own gravity is weaker.
 * - **A colour gradient.** Old and metal-rich in the middle, still forming stars in
 *   the arms. This is the cue that says which part of the object is its centre,
 *   and it is doing as much work as the density.
 *
 * Deterministic, so the check script can assert on it: `random` is a hash of the
 * attempt index, and rejections do not shift any other point's draw.
 */
export const galaxyGeometry = (count: number): Stellar => {
  const position = new Float32Array(count * 3)
  const tint = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const seed = new Float32Array(count)
  const color = new THREE.Color()
  let written = 0
  for (let k = 0; written < count && k < count * 8; k += 1) {
    // Stride wider than the largest offset used below, or one attempt's hash is the
    // next attempt's and the "random" numbers are correlated across points.
    const s = k * 17
    const bulge = random(s + 1) < 0.34
    let r: number
    let x: number
    let y: number
    let z: number
    if (bulge) {
      // A flattened spheroid, not a ball: a real bulge is boxy and ~0.6 as tall as
      // it is wide. The steep power is what makes it *glow* toward one point rather
      // than sit there as a fuzzy sphere.
      r = BULGE_R * random(s + 2) ** 1.6
      const cosT = random(s + 3) * 2 - 1
      const phi = random(s + 4) * Math.PI * 2
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT))
      x = r * sinT * Math.cos(phi)
      z = r * sinT * Math.sin(phi)
      y = r * cosT * 0.6
    } else {
      r =
        -DISK_SCALE *
        (Math.log(1 - random(s + 2) * 0.999) + Math.log(1 - random(s + 3) * 0.999))
      if (r > 1) continue
      const off = gauss(s + 5)
      const inArm = random(s + 12) >= SMOOTH_DISK
      /*
       * A dust lane is an absence, not a dark star. Additive points cannot draw
       * one, so the lane is carved by rejecting the arm stars that fall on the
       * arm's inner edge — which is also what is physically going on: the dust
       * sits in front of the light and what reaches you is the hole it leaves.
       */
      if (inArm && Math.abs(off + 0.42) < 0.14 && random(s + 6) < 0.85) continue
      // Arm width is roughly constant in *distance*, so it narrows in angle as the
      // radius grows — which is why real arms look like they converge on the middle.
      const theta = inArm
        ? Math.floor(random(s + 4) * ARMS) * ((Math.PI * 2) / ARMS) +
          Math.log(Math.max(r, 0.02) / 0.05) / Math.tan(ARM_PITCH) +
          off * (0.35 + 0.45 / (1 + r * 5))
        : random(s + 13) * Math.PI * 2
      x = Math.cos(theta) * r
      z = Math.sin(theta) * r
      y = (0.008 + r * 0.05) * gauss(s + 7)
    }
    position.set([x, y, z], written * 3)
    // Old and yellow in the middle, young and blue in the arms. The bulge is pinned
    // at zero rather than graded by radius because it is a different population, not
    // the inner end of the same one — and that step is the cue that tells a viewer
    // which part of the object is its centre.
    const hii = !bulge && r > 0.18 && random(s + 8) > 0.982
    color
      .copy(hii ? HII_REGION : OLD_STARS)
      .lerp(YOUNG_STARS, hii || bulge ? 0 : Math.min(1, (r / 0.45) ** 0.8))
      .multiplyScalar(hii ? 0.55 : 0.26 + random(s + 9) ** 3 * 0.62)
    color.toArray(tint, written * 3)
    size[written] = hii
      ? 2.0
      : bulge
        ? 0.5 + random(s + 10) * 0.5
        : 0.65 + random(s + 10) ** 2.4 * 2.3
    seed[written] = random(s + 6)
    written += 1
  }
  return { position, tint, size, seed }
}

/** The far field: a box of stars behind the room, no structure, just depth. */
const fieldGeometry = (count: number): Stellar => {
  const position = new Float32Array(count * 3)
  const tint = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const seed = new Float32Array(count)
  const color = new THREE.Color()
  for (let i = 0; i < count; i += 1) {
    position.set(
      [
        (random(i + 2) - 0.5) * 64,
        (random(i + 3) - 0.5) * 40,
        12 - random(i + 4) * 65,
      ],
      i * 3,
    )
    // Mostly hot and blue-white with a scattering of red giants, which is roughly
    // what a naked-eye sky is and keeps the field from reading as grey noise.
    color.setHSL(random(i + 7) > 0.84 ? 0.06 : 0.58, 0.2, 0.34 + random(i + 8) ** 3 * 0.6)
    color.toArray(tint, i * 3)
    size[i] = 0.5 + random(i + 11) ** 3 * 2.2
    seed[i] = random(i + 13)
  }
  return { position, tint, size, seed }
}

/**
 * Where a body at orbital radius `r` and height `h` above the disk has got to.
 *
 * The CPU twin of `stellarVertex`'s infall, and the reason both exist: the planets
 * are three objects that also need a tidal *scale*, the stars are thousands that
 * do not, but they have to fall on one schedule or the sky and the worlds in front
 * of it visibly disagree about when the ending is happening.
 *
 * A straight `position.lerp(holeCenter, drain)` — what this replaces — is the one
 * thing infalling matter never does. Three things are needed instead:
 *
 * - The orbit **decays** rather than the position interpolating, and it decays from
 *   the inside out: `pow(drain, 1 + r/span)` is 1 at the centre and steepens with
 *   radius, so the near matter goes first and the far matter holds and then lets go.
 * - The **angular rate runs away**, as r^-3/2 — Kepler's third law, and the single
 *   most recognisable thing about a body falling into a well. Bounded at five times,
 *   because the real law is a divergence and the scroll rail is a few hundred pixels.
 * - The body is **stretched**: gravity's gradient goes as 1/r³ and pulls the near
 *   side harder than the far, so it is drawn out along the line to the hole and
 *   squeezed across it, and the out-of-plane height collapses into the disk.
 *
 * Every channel is a monotone function of the drain, and `suction` is deliberately
 * absent from all of them: a gulp is a beat that returns to zero, so multiplying a
 * *position* by it hands the well's matter back between pulls. The beats are still
 * there — four fifths of the drain is the three gulps, so each one is a steep climb
 * in this curve — and the kick itself lives on brightness in the shader, where there
 * is nothing to give back. `scripts/check-cosmos.ts` asserts all of it.
 */
export const spiralFall = (
  r: number,
  h: number,
  shape: SwallowShape,
  span: number,
  seed = 0.5,
) => {
  const fall = Math.min(0.985, shape.drain ** (1 + r / span))
  const stretch = 1 + shape.tide * fall * 1.5
  return {
    fall,
    radius: r * (1 - fall) * (1 + shape.tide * fall * (seed - 0.5) * 1.7),
    height: h * (1 - Math.min(1, fall * 1.4)),
    wind:
      shape.orbit *
      Math.min(5, Math.max(0.14, 1 - fall) ** -1.5) *
      0.22 *
      (0.75 + seed * 0.5),
    /** Radial elongation of a solid body, 1 → 2.5. */
    stretch,
    /**
     * ...and the transverse compression, which is not a free parameter.
     *
     * A tidal field shears at fixed density, so the map has to preserve volume:
     * 1/√stretch is the only squeeze that does. Two independently tuned
     * coefficients — what this used to be — quietly inflate the body while
     * elongating it, so a planet on its way in got *bigger* before it got long,
     * which reads as ballooning rather than as being pulled apart.
     */
    squeeze: 1 / Math.sqrt(stretch),
  }
}

/**
 * The galaxy's radius, in metres.
 *
 * Bounded from above by the corridor rather than by taste. The disk shares the
 * accretion disk's plane, which runs very nearly straight down the corridor, so a
 * galaxy much wider than this puts its near arm level with the lens at the finale's
 * closest approach (`APPROACH_Z` is 12 m from the singularity) and the visitor
 * watches stars slide past the camera. At 8.4 the near edge stays ~4 m ahead of the
 * lens, and from 12 m out the arms still subtend ~70°, wider than the aperture they
 * frame — which is what makes the gate read as a window cut into a galaxy.
 */
const GALAXY_RADIUS = 8.4
/** Infall span for the galaxy, in its own normalised units, and for the far field. */
const GALAXY_SPAN = 0.22
const FIELD_SPAN = 14
/** Span for the worlds, in metres: the corridor's own length, so they fall with it. */
const PLANET_SPAN = 12

const PLANETS = [
  // Earth. Axial tilt 23.4°, and the only one that gets the whole shader.
  { at: [0, 1.62, 5.15], size: 1.08, air: '#5f9fe0', kind: 0, tilt: 0.41, spin: 2.8, phase: 2.2, relief: 2.6, ring: false },
  // Saturn. 26.7° of tilt is what opens the rings to the ~27° they are famous for.
  { at: [4.1, 3.3, -3.8], size: 1.65, air: '#c8b489', kind: 1, tilt: 0.47, spin: 1.2, phase: 1.7, relief: 0, ring: true },
  { at: [-4.6, 3.1, -12.8], size: 1.35, air: '#000000', kind: 2, tilt: 0.09, spin: 1.2, phase: 3.4, relief: 1.9, ring: false },
] as const

const UP = new THREE.Vector3(0, 1, 0)
const AXIS = new THREE.Vector3()
const RADIAL = new THREE.Vector3()
const TANGENT = new THREE.Vector3()
const SPIN = new THREE.Quaternion()

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
    },
  })

const MAPS = [
  '/cosmos/earth.webp',
  '/cosmos/earth-mask.webp',
  '/cosmos/night.webp',
  '/cosmos/moon.webp',
  '/cosmos/saturn.webp',
  '/cosmos/ring.webp',
  '/cosmos/sky.webp',
] as const

export const CosmicWorld = ({ quality }: { quality: Quality }) => {
  const maps = useLoader(THREE.TextureLoader, [...MAPS])
  const worlds = useRef<THREE.Group>(null)
  const galaxy = useRef<THREE.Points>(null)
  const stars = useRef<THREE.Points>(null)
  const resources = useMemo(() => {
    const [earth, mask, night, moon, saturn, ring, sky] = maps
    for (const map of maps) {
      map.colorSpace = THREE.SRGBColorSpace
      map.anisotropy = 4
      // Equirectangular maps wrap in longitude, and the cloud deck is sampled at a
      // rolling offset — without this the seam clamps into a smear at the dateline.
      map.wrapS = THREE.RepeatWrapping
    }
    // The packed mask is data, not a photograph. Left as sRGB, its elevation, land
    // and cloud channels all come back gamma-decoded and every threshold below
    // reads the wrong number.
    mask.colorSpace = THREE.LinearSRGBColorSpace
    ring.wrapS = THREE.ClampToEdgeWrapping
    const surfaces = [earth, saturn, moon]
    const planets = PLANETS.map(
      (p, i) =>
        new THREE.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: planetFragment,
          uniforms: {
            uAir: { value: new THREE.Color(p.air) },
            uKind: { value: p.kind },
            uCloudSpin: { value: 0 },
            uRelief: { value: p.relief },
            uSurface: { value: surfaces[i] },
            uNight: { value: night },
            uMask: { value: p.kind === 1 ? ring : mask },
            uTideDir: { value: new THREE.Vector3(0, 0, -1) },
            uTide: { value: 0 },
            uSqueeze: { value: 1 },
          },
        }),
    )
    return {
      planets,
      rings: PLANETS.map(
        (p) =>
          new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: ringFragment,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
              uColor: { value: new THREE.Color(p.air) },
              uMask: { value: ring },
              uTideDir: { value: new THREE.Vector3(0, 0, -1) },
              uTide: { value: 0 },
              uSqueeze: { value: 1 },
            },
          }),
      ),
      sphere: new THREE.SphereGeometry(1, 64, 40),
      // Inner and outer edge of the real ring system, in planet radii: the C ring
      // starts at 1.24 and the A ring ends at 2.27. The alpha map's u runs across
      // exactly that span, so both shaders can invert it from a radius.
      ring: new THREE.RingGeometry(1.24, 2.27, 200),
      stars: attach(fieldGeometry(quality === 'cinema' ? 3000 : 1200)),
      galaxy: attach(galaxyGeometry(quality === 'cinema' ? 9000 : 3200)),
      /*
       * Point sizes, in the same units three.js's own `sizeAttenuation` uses:
       * pixels = uSize · aSize · (height·dpr/2) / distance.
       *
       * Both were an order of magnitude smaller to begin with — inherited from a
       * `PointsMaterial` size of 0.041 — and at the twenty-odd metres the galaxy is
       * seen from down the corridor that works out to under a pixel per star. Which
       * is why it read as a faint smudge no matter how good the geometry was: the
       * arms were there, they were just being rendered below the resolution of the
       * screen. At 0.06 the bright arm stars land at three or four pixels and the
       * bulge's specks at under one, which is the contrast a galaxy is made of.
       */
      // 4.2 m for the galaxy is measured, not chosen: at the finale's closest
      // approach its near arm stands ~4.3 m ahead of the lens, so this clears the
      // stars the camera is inside of and leaves the ones that frame the aperture.
      field: stellarMaterial(FIELD_SPAN, 0.036, 1.5),
      halo: stellarMaterial(GALAXY_SPAN, 0.06, 4.2),
      nebula: new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: nebulaFragment,
        depthWrite: false,
        uniforms: {
          uFade: { value: 1 },
          uSky: { value: sky },
          uTideDir: { value: new THREE.Vector3(0, 0, -1) },
          uTide: { value: 0 },
          uSqueeze: { value: 1 },
        },
      }),
    }
  }, [quality, maps])
  useEffect(
    () => () => {
      resources.sphere.dispose()
      resources.ring.dispose()
      resources.stars.dispose()
      resources.galaxy.dispose()
      resources.nebula.dispose()
      resources.field.dispose()
      resources.halo.dispose()
      resources.planets.forEach((m) => m.dispose())
      resources.rings.forEach((m) => m.dispose())
    },
    [resources],
  )

  useFrame(({ clock, size, viewport }) => {
    const b = sceneState.build
    const s = swallowShape(sceneState.swallow)
    const time = clock.elapsedTime
    // One axis for the galaxy's plane, the planets' decaying orbits and the disk
    // the well is actually being fed by. Reading it rather than authoring a second
    // one is what keeps the nucleus and the accretion disk from drifting apart.
    const axis = holeAxis(AXIS, time)
    // The shadow's apparent radius, in metres. Not the horizon: 3√3/2 Rs at rest,
    // pulled in by the spin. Stars inside it are behind the hole, so they do not
    // draw — which is what leaves a dark bite in the middle of the bulge instead of
    // an additive white dot where the singularity is supposed to be.
    const shadow = captureRs(HOLE_SPIN) * holeRadiusFor(b, sceneState.swallow)
    const depart = THREE.MathUtils.smoothstep(b, 0.025, 0.11)
    // Matches three.js's own `sizeAttenuation` scale, read per frame so a resize or
    // a governor change in device pixel ratio needs no extra wiring.
    const pixel = size.height * viewport.dpr * 0.5
    resources.nebula.uniforms.uFade.value = 1 - s.drain * 0.95

    worlds.current?.children.forEach((world, index) => {
      const spec = PLANETS[index]
      RADIAL.set(spec.at[0], spec.at[1], spec.at[2])
      if (index === 0) {
        RADIAL.x -= depart * 3.7
        RADIAL.y += depart * 1.1
      }
      // Split the offset from the singularity into the disk's plane and the height
      // above it. Infalling matter joins the disk it is being fed into, so the
      // well's own axis is the axis every orbit here decays around.
      RADIAL.sub(holeCenter)
      const height = RADIAL.dot(axis)
      RADIAL.addScaledVector(axis, -height)
      const r = Math.max(1e-4, RADIAL.length())
      RADIAL.divideScalar(r)
      TANGENT.crossVectors(axis, RADIAL)
      const fall = spiralFall(r, height, s, PLANET_SPAN)
      world.position
        .copy(holeCenter)
        .addScaledVector(RADIAL, Math.cos(fall.wind) * fall.radius)
        .addScaledVector(TANGENT, Math.sin(fall.wind) * fall.radius)
        .addScaledVector(axis, fall.height)
      // XYZ Euler order means Rx wraps Ry, so the planet spins about its own axis
      // *inside* its tilt — which is what axial tilt is, and what lets the ring ride
      // the tilt without being spun by the day.
      world.rotation.set(spec.tilt, b * spec.spin + spec.phase, 0)
      /*
       * Each world goes out when *it* crosses, not on a shared timer, so the near one
       * is already gone while the far one is still falling.
       *
       * And it goes out far short of the horizon, for a reason that is entirely about
       * where the lens ends up. The finale is shot from ten metres out and the well's
       * own pass magnifies anything near the photon ring, while the moon starts only
       * ten metres from the singularity — so a decaying orbit keeps it at roughly the
       * camera's own distance the whole way down, and at 0.975 it was a crater field
       * filling two thirds of the frame with the event horizon behind it. Holding the
       * window between 0.35 and 0.68 puts the swallowing of the worlds in the first
       * two gulps, where the camera is still back and the shadow still small.
       *
       * `beyond` is the backstop: it is the channel the whole finale already uses for
       * "the room is inside the well and what is left in frame is its own light", so
       * anything still standing when it opens is on the wrong side of that statement.
       */
      const gone =
        (1 - THREE.MathUtils.smoothstep(fall.fall, 0.35, 0.68)) * (1 - s.beyond)
      world.scale.setScalar(spec.size * Math.max(0.001, gone))
      world.visible = gone > 0.004
      for (const material of [resources.planets[index], resources.rings[index]]) {
        const u = material.uniforms
        u.uTideDir.value.copy(holeCenter).sub(world.position).normalize()
        u.uTide.value = fall.stretch - 1
        u.uSqueeze.value = fall.squeeze
      }
      // The deck turns about a quarter of a degree per second faster than the
      // ground. Slow enough to be deniable, fast enough that a second look at the
      // same frame is not the same frame.
      resources.planets[index].uniforms.uCloudSpin.value = time * 0.0018 + b * 0.05
    })

    if (galaxy.current) {
      const scale = GALAXY_RADIUS * (0.84 + b * 0.16)
      galaxy.current.scale.setScalar(scale)
      // The galaxy's plane *is* the accretion disk's plane, and its centre *is* the
      // singularity — so the object's own origin is the hole and `uHole` is zero.
      // That is the whole of task one: the bulge cannot be off-centre from a point
      // it is defined as being centred on.
      galaxy.current.quaternion
        .setFromUnitVectors(UP, axis)
        .multiply(SPIN.setFromAxisAngle(UP, 0.4 + b * 0.42 + time * 0.006))
      // `uHole` and `uAxis` stay at the material's defaults — the origin and +Y —
      // precisely because the object is centred on the singularity and its plane is
      // the disk's. There is nothing to update.
      const u = resources.halo.uniforms
      u.uHollow.value = Math.max(1e-3, shadow / scale)
      u.uPixel.value = pixel
      u.uDrain.value = s.drain
      u.uSuction.value = s.suction
      u.uTide.value = s.tide
      u.uOrbit.value = s.orbit
      // Fades up with the corridor's charge — the arms should arrive as the well
      // does, not hang behind an unbuilt room — and out only at the crossing, since
      // the stars now leave by falling rather than by being turned off.
      u.uOpacity.value =
        (0.26 + THREE.MathUtils.smoothstep(b, 0.25, 0.72) * 0.6) * (1 - s.crossing)
    }
    if (stars.current) {
      const u = resources.field.uniforms
      u.uHole.value.copy(holeCenter)
      u.uAxis.value.copy(axis)
      u.uHollow.value = Math.max(1e-3, shadow)
      u.uPixel.value = pixel
      u.uDrain.value = s.drain
      u.uSuction.value = s.suction
      u.uTide.value = s.tide
      u.uOrbit.value = s.orbit
      u.uOpacity.value = 0.82 * (1 - s.crossing)
    }
  })

  return (
    <>
      <mesh position={[0, 6, -46]} material={resources.nebula} renderOrder={-10}>
        <planeGeometry args={[180, 120]} />
      </mesh>
      {/* Both point clouds move their own vertices, so no bounding sphere the CPU
          could compute for them is true for more than one frame. */}
      <points
        ref={stars}
        geometry={resources.stars}
        material={resources.field}
        frustumCulled={false}
      />
      <points
        ref={galaxy}
        geometry={resources.galaxy}
        material={resources.halo}
        position={holeCenter}
        frustumCulled={false}
      />
      <group ref={worlds}>
        {PLANETS.map((p, i) => (
          <group key={p.air + p.kind} position={[...p.at]} scale={p.size}>
            <mesh geometry={resources.sphere} material={resources.planets[i]} />
            {p.ring ? (
              <mesh
                geometry={resources.ring}
                material={resources.rings[i]}
                rotation={[-Math.PI / 2, 0, 0]}
              />
            ) : null}
          </group>
        ))}
      </group>
    </>
  )
}

export const CosmicIntro = ({ copy }: { copy: Copy }) => {
  const root = useRef<HTMLDivElement>(null)
  useEffect(
    () =>
      addTick(() => {
        if (!root.current) return
        root.current.style.opacity = String(
          1 - THREE.MathUtils.smoothstep(sceneState.build, 0.005, 0.055),
        )
      }),
    [],
  )
  return (
    <div ref={root} className="cosmic-intro" aria-hidden="true">
      <p className="cosmic-eyebrow">
        DG / {copy.locale === 'es' ? 'OBSERVATORIO DIGITAL' : 'DIGITAL OBSERVATORY'}
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
  )
}
