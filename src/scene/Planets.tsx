import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { holeAxis, holeCenter } from './blackHole'
import { spiralFall } from './CosmicWorld'
import { sceneState, swallowShape } from './sceneState'
import {
  PLANET_SPAN,
  PLANETS,
  planetAnchor,
  planetSwing,
} from './planetSpec'
import { reactorControl } from './control/reactorControl'

/*
 * The three worlds, as flybys rather than as furniture.
 *
 * Two things are worth knowing before reading any of it.
 *
 * The first is that nothing here is placed to be *looked at from where it is*.
 * Each world hangs near the corridor's axis while the lens is still far down it,
 * and slides outboard and up as the lens closes on its depth — so it grows in the
 * middle of the frame, passes about three metres from the glass, and leaves by the
 * edge. The driver is the lens's own remaining depth read from the live camera, not
 * `build`, so the pass stays exact through damping, `corridorLateral`, pointer
 * parallax and the velocity pull-back. There is no shared timer and no `depart`.
 *
 * The second is that the collapse does not integrate. Fall, stretch and swallow-
 * winding are a pure function of `swallowShape(sceneState.swallow)` via
 * `spiralFall` — scroll up and the worlds come back out. At swallow 0 that pipeline
 * is the identity on the flyby anchor (cos 0 = 1, sin 0 = 0, fall = 0), so the
 * framing numbers below are exactly what ships. `scripts/check-cosmos.ts` is where
 * the fall itself is asserted.
 *
 * `spiralFall` is imported from `CosmicWorld`, which imports this module back. The
 * cycle is fine because the call only happens inside `useFrame` — by then both
 * module bodies have run and the live binding resolves.
 */

const vertex = /* glsl */ `
uniform vec3 uTideDir; uniform float uTide; uniform float uSqueeze;
varying vec3 vP; varying vec3 vN; varying vec3 vT; varying vec3 vView; varying vec2 vUv; varying vec3 vSun;
/*
 * The sun, and why it is off to the side.
 *
 * It used to be (0.52, 0.30, 0.80). The lens looks down −z, so a sun with 0.80 of
 * its direction in +z sits almost directly behind the camera — every world was lit
 * flat-on, full-disc, with the terminator swung round the back where nobody could
 * see it. That is the one lighting angle under which a sphere reads as a circle:
 * no limb, no shadow, no relief, and on Earth no night side at all, which meant the
 * city lights the shader has always sampled were dead code for the whole flyby.
 *
 * The sign of x is what actually decides it, not the magnitude. Earth and the moon
 * hang to port and the lens flies up the middle, so the camera sees their +x faces;
 * a sun at +x lights exactly the side already facing us and there is no night in
 * shot however far round it is swung. Putting the sun to port instead throws the
 * terminator across the two worlds the visitor gets closest to — and Saturn, which
 * is the one to starboard, keeps its lit face turned to the lens — which is what every
 * photograph of a planet from space actually looks like, and what gives the relief
 * something to cast into. Shared by all three worlds and by the ring, so Saturn's
 * ring shadow and the moon's craters get the same grazing light.
 */
const vec3 SUN=normalize(vec3(-0.62,0.30,0.72));
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
   *
   * Both uniforms are fed from sceneState.distortion, which is the orchestrator's
   * own gate for "final VISCOUS approach". At distortion 0 this map is exactly the
   * identity — centre + dir·along·(1+0) + (rel − dir·along)·1 — and the normal
   * decomposition divides and multiplies by one, so nothing around the well is
   * deformed until the very end.
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
 * Earth gets the full treatment: relief with its own cast shadow, a cloud deck with
 * its own rotation and its own shadow, water *and* land specular, Rayleigh and
 * ozone. The moon gets none of it and instead gets the scattering law a dark
 * regolith actually obeys, plus crater shadow — the only shadow an airless body
 * has. Saturn is a scattering atmosphere with no surface at all, plus the one
 * detail that makes it unmistakable: its rings' shadow, cast for real.
 *
 * Every constant in here was retuned for three metres. At the twenty-six the worlds
 * used to be seen from, one-texel differencing, a hard terminator and an ocean-only
 * specular were all invisible approximations; at the new range they are the three
 * things that make a planet read as printed.
 *
 * `uMask` is a channel-packed map, three.js's own packing: R is elevation, G is
 * roughness (land is rough, water is glass) and B is cloud cover. Three maps for
 * one fetch, and no alpha plane to pay for. Saturn binds the ring map here instead.
 */
const planetFragment = /* glsl */ `
uniform vec3 uAir; uniform float uKind; uniform float uCloudSpin; uniform float uRelief;
uniform sampler2D uSurface; uniform sampler2D uNight; uniform sampler2D uMask;
uniform vec2 uTexel; uniform float uChaos; uniform float uVacuum;
/* sceneState.chaosBurn: "CHAOS has been running and the well is winning". Surface
 * destruction only — this never reaches the vertex stage. See the fracture below. */
uniform float uBurn;
uniform float uMark; uniform vec3 uMarkTint; uniform vec3 uMarkRim;
/* Object-space direction to the brightest stellar eruption, and how bright it is. */
uniform vec3 uFlash; uniform float uFlashAmount;
varying vec3 vP; varying vec3 vN; varying vec3 vT; varying vec3 vView; varying vec2 vUv; varying vec3 vSun;
/*
 * The sun: the room's own key-light azimuth (see \`ReconstructMaterial\`), dropped
 * to a low elevation.
 *
 * The azimuth has to agree with the corridor's — the planets were the one set of
 * objects lit from the other side of the room, and all three passes now happen with
 * the lens on the world's +Z side. The *elevation* cannot: the room's key is 57° up,
 * and a planet lit from overhead puts its terminator across the lower hemisphere,
 * which is precisely where the marked country is. Seventeen degrees runs the
 * terminator vertically instead, so the southern hemisphere stays lit and the phase
 * is still gibbous rather than flat.
 */
const vec3 SUN=normalize(vec3(-0.62,0.30,0.72));
/*
 * \`uTexel\` is a uniform and not the const it used to be, and that was a real bug
 * rather than tidiness: the const said 1/2048 × 1/1024 for every body, and
 * moon.webp is 1536 × 768 — so every relief tap on the moon was reading a third of
 * a texel short and its craters were shaded at two thirds strength.
 */
/** Height-field gradient as a tangent-space tilt. Four taps beat shipping a normal map. */
vec2 slope(sampler2D map,vec2 uv,vec2 texel){
  // 1.5 texels, not one. A single-texel difference is a high-pass filter, and at
  // three metres from the lens what it passes is the map's own compression noise
  // crawling over the terrain. Wider taps trade the last of the detail for relief
  // that holds still.
  vec2 e=texel*1.5;
  return vec2(texture2D(map,uv-vec2(e.x,0.0)).r-texture2D(map,uv+vec2(e.x,0.0)).r,
              texture2D(map,uv-vec2(0.0,e.y)).r-texture2D(map,uv+vec2(0.0,e.y)).r);
}
/*
 * Relief's own shadow, as a horizon march along the sun in texture space.
 *
 * A bumped normal tells you which way a slope faces; it cannot tell you that a
 * mountain is standing between this point and the sun. Four taps up the sun ray: if
 * the terrain ahead rises faster than the ray does, this point is behind it. It is
 * the difference between the Andes having a lit side and the Andes having a dark
 * side, and it only costs anything where the terminator is.
 */
float reliefShade(sampler2D map,vec2 uv,vec2 step,float h0){
  float shade=0.0;
  for(int i=1;i<=4;i++){
    float t=float(i)*0.25;
    shade=max(shade,(texture2D(map,uv+step*t).r-h0)/t);
  }
  return clamp(shade*3.0,0.0,1.0);
}
/*
 * Argentina, as a polygon on the equirect sheet.
 *
 * Authored in degrees and converted by the macro, because the thing being traced is
 * a border and a border is written in longitude and latitude — a table of
 * normalised UVs is unreviewable and undebuggable. \`p\` is UV with u doubled, so the
 * space is isotropic in degrees and one rim width means the same in both axes.
 *
 * Even-odd rather than a winding rule: the ring's orientation then does not matter,
 * which means the vertex list can be edited without also being re-oriented. The
 * distance to the nearest segment comes out of the same walk, kept squared so there
 * is one sqrt for the whole country rather than 33.
 */
void argEdge(vec2 a,vec2 b,vec2 p,inout float inside,inout float d2){
  if((a.y>p.y)!=(b.y>p.y)){
    float t=(p.y-a.y)/(b.y-a.y);
    if(p.x<a.x+t*(b.x-a.x)) inside=1.0-inside;
  }
  vec2 e=b-a,w=p-a;
  vec2 q=w-e*clamp(dot(w,e)/dot(e,e),0.0,1.0);
  d2=min(d2,dot(q,q));
}
#define LL(lo,la) vec2(((lo)+180.0)/180.0,((la)+90.0)/180.0)
#define ARG(lo1,la1,lo2,la2) argEdge(LL(lo1,la1),LL(lo2,la2),p,inside,d2)
/**
 * 1.0 inside Argentina, 0.0 outside; \`border\` returns the distance to the coastline
 * in map units (1.0 = 180° of latitude).
 *
 * The bounding box is not an optimisation detail, it is what makes this cheap
 * enough to be unconditional: the country is 1.1% of an equirect sheet, so 99% of
 * the globe's fragments leave on the first branch and never touch the 33 segments.
 * The box is padded by the widest rim the glow can ask for.
 */
float argentina(vec2 uv,out float border){
  border=1.0;
  vec2 p=vec2(uv.x*2.0,uv.y);
  if(p.x<0.585||p.x>0.708||p.y<0.189||p.y>0.384) return 0.0;
  float inside=0.0,d2=1.0;
  // North: the Bolivian border, then the Pilcomayo down to Asunción.
  ARG(-66.30,-22.00,-62.80,-22.00);
  ARG(-62.80,-22.00,-57.90,-25.30);
  // The Paraguay to the Paraná confluence, then east and up into Misiones.
  ARG(-57.90,-25.30,-58.60,-27.30);
  ARG(-58.60,-27.30,-55.90,-27.40);
  ARG(-55.90,-27.40,-54.60,-25.60);
  ARG(-54.60,-25.60,-53.65,-26.25);
  // Down the Uruguay to the Plata.
  ARG(-53.65,-26.25,-55.10,-28.00);
  ARG(-55.10,-28.00,-57.60,-30.20);
  ARG(-57.60,-30.20,-58.20,-32.20);
  ARG(-58.20,-32.20,-58.40,-33.90);
  // The Atlantic, all the way to the Strait.
  ARG(-58.40,-33.90,-57.40,-35.40);
  ARG(-57.40,-35.40,-56.70,-36.40);
  ARG(-56.70,-36.40,-62.30,-38.90);
  ARG(-62.30,-38.90,-62.20,-40.80);
  ARG(-62.20,-40.80,-65.00,-42.80);
  ARG(-65.00,-42.80,-65.20,-45.00);
  ARG(-65.20,-45.00,-67.60,-49.30);
  ARG(-67.60,-49.30,-68.60,-52.30);
  ARG(-68.60,-52.30,-70.40,-52.60);
  // ...and back up the Andes. The 73.6° W turn is the westernmost point of the
  // country, and the reason the silhouette is unmistakable at a glance.
  ARG(-70.40,-52.60,-71.90,-51.90);
  ARG(-71.90,-51.90,-72.60,-48.00);
  ARG(-72.60,-48.00,-73.60,-44.00);
  ARG(-73.60,-44.00,-71.60,-41.00);
  ARG(-71.60,-41.00,-71.20,-37.00);
  ARG(-71.20,-37.00,-70.40,-33.00);
  ARG(-70.40,-33.00,-69.20,-28.00);
  ARG(-69.20,-28.00,-68.40,-24.50);
  ARG(-68.40,-24.50,-66.30,-22.00);
  float main_d2=d2,main_in=inside;
  /*
   * Tierra del Fuego, as its own ring.
   *
   * The Strait of Magellan separates it from the mainland, so a single even-odd
   * ring would have to bridge the strait and would tint a sliver of Chile to do it.
   * Two rings, one accumulator each, and the results are OR'd — which is also why
   * the helper takes the crossing count as \`inout\` rather than returning it.
   */
  inside=0.0; d2=1.0;
  ARG(-68.60,-52.65,-68.35,-54.65);
  ARG(-68.35,-54.65,-66.60,-54.95);
  ARG(-66.60,-54.95,-65.15,-54.70);
  ARG(-65.15,-54.70,-66.45,-53.15);
  ARG(-66.45,-53.15,-68.60,-52.65);
  border=sqrt(min(main_d2,d2));
  return max(main_in,inside);
}
/*
 * Slant path through the air, in planet radii — the exact chord, not a power curve.
 *
 * A ray leaving the unit sphere at cosine mu exits a shell of thickness h where
 * |P + t·eye| = 1 + h, so t = sqrt(mu² + 2h + h²) − mu. That gives ~h at the disc
 * centre and sqrt(2h) at the limb: for Earth's h = 0.028 the limb is 8.5× the
 * thickness of the middle, and that ratio *is* the look of an atmosphere.
 * \`pow(grazing,k)\` cannot produce it — it is fitted at one end and wrong at the
 * other, which is why the version this replaces needed three separate exponents
 * (3.2, 5.5, 7.0) to describe one profile, and a fourth hand-tinted term to get the
 * reddening a power of \`grazing\` carries no wavelength to produce.
 */
float airmass(float mu,float h){
  return sqrt(max(mu*mu+2.0*h+h*h,0.0))-mu;
}
/*
 * Henyey-Greenstein. \`d*sqrt(d)\` rather than \`pow(d,1.5)\`: same result, one fewer
 * transcendental, and no chance of pow() eating a negative from rounding.
 */
float hg(float c,float g){
  float d=1.0+g*g-2.0*g*c;
  return (1.0-g*g)/max(d*sqrt(d),1e-3);
}
void main(){
  vec3 n0=normalize(vN),eye=normalize(vView);
  vec3 east=normalize(vT-n0*dot(vT,n0)),north=cross(n0,east);
  float geo=dot(n0,SUN);
  float mu=max(dot(n0,eye),0.0);
  float grazing=1.0-mu;
  /*
   * Scattering angle, view against the sun's direction of travel. Hoisted here and
   * not left in the branches because the tail needs it too — and because \`n\`,
   * \`day\`, \`cloud\` and \`sunDir\` are branch-local and die at their closing brace.
   * The room's key is 37° off +Z and every pass is seen from the world's +Z side,
   * so \`cosT\` sits near −0.8 for the whole flyby: these are back-scatter shots.
   */
  float cosT=dot(eye,-SUN);
  vec3 surface=texture2D(uSurface,vUv).rgb;
  vec3 col;
  if(uKind<0.5){
    vec3 mask=texture2D(uMask,vUv).rgb;
    float land=mask.g,ocean=1.0-land;
    // Relief on land only: the sea is flat, and a bumped ocean reads as a static
    // crawling over the water.
    vec2 tilt=slope(uMask,vUv,uTexel);
    vec3 n=normalize(n0+(east*tilt.x+north*tilt.y)*uRelief*land);
    // The sun's own direction, in texture space. Two uses below: the height march
    // and the cloud deck's parallax, and nothing else needs a tangent frame at all.
    vec2 sunDir=normalize(vec2(dot(SUN,east),dot(SUN,north))+1e-6);
    float shade=1.0-reliefShade(uMask,vUv,sunDir*uTexel*5.0,mask.r)*0.8*land;
    /*
     * The terminator, as a band and not an edge.
     *
     * Widened from (-0.05, 0.06). The sun is half a degree across, which is where
     * that number came from, but the ground is not the only thing being lit: the
     * air above it goes on scattering after the surface has stopped receiving, so
     * the *visible* boundary is several degrees wide. At twenty-six metres that is
     * a pixel; at three it is the most-looked-at part of the frame.
     */
    float day=max(dot(n,SUN),0.0)*smoothstep(-0.09,0.10,geo)*shade;
    // Real ocean albedo is ~0.06 against land's ~0.25, and the map is a photograph
    // with the sky's own blue already in the water.
    /*
     * 1.0 at the subsolar point, not 1.55.
     *
     * \`surface\` is already a photograph — the sunlit albedo is baked into it — so a
     * gain over unity is exposing an exposed image a second time. At 1.55 the whole
     * day side clipped: oceans, land and the country mark all went to the same
     * white, and the bloom downstream then spread that flat white over the limb.
     * The blue marble is a *dark* object; what makes it read is the contrast
     * between a near-black ocean and bright cloud, and that contrast is the first
     * thing an over-exposure destroys.
     */
    col=surface*mix(0.70,1.0,land)*(0.006+day*1.0);
    vec3 halfv=normalize(SUN+eye);
    float fres=0.02+0.98*pow(1.0-max(dot(eye,n0),0.0),5.0);
    // Sun glint, water only, on the *geometric* normal — waves are not in the map,
    // and the specular is what tells an eye which parts of the blue are liquid.
    col+=vec3(1.0,0.95,0.86)*pow(max(dot(n0,halfv),0.0),190.0)*fres*ocean*2.8;
    /*
     * ...and a broad sheen on the land, off the *relief* normal.
     *
     * Rock is not a mirror, so this is a hundredth of the ocean's glint and twenty
     * times broader. It is here because the mask's G channel is roughness and a
     * shader that only speculars the water is asserting that land has no
     * microfacets at all — which at three metres reads as a printed globe with a
     * shiny sea stuck to it. This is the term that makes the mountains feel solid.
     */
    col+=vec3(1.0,0.96,0.90)*pow(max(dot(n,halfv),0.0),24.0)*land*0.16*day;
    /*
     * Clouds: their own layer, their own rotation, and their own shadow. The shadow
     * lookup is offset along the sun's direction *in texture space*, which is the
     * whole trick — the parallax between deck and ground is what makes the cloud
     * read as floating above the surface rather than painted onto it.
     */
    vec2 cloudUv=vUv+vec2(uCloudSpin,0.0);
    float cloud=smoothstep(0.05,0.55,texture2D(uMask,cloudUv).b);
    col*=1.0-smoothstep(0.06,0.6,texture2D(uMask,cloudUv-sunDir*uTexel*16.0).b)*0.5*step(0.0,geo);
    /*
     * Cloud tops are bright and back-scatter hard, which is why a lit rim of cloud
     * survives at the terminator after the ground under it has gone dark. It used
     * to be \`pow(max(dot(eye,-SUN),0.0),3.0)\`, which was dead code for the entire
     * flyby: \`cosT\` is near −0.8 the whole way, so the clamp zeroed it every frame.
     * The g = −0.30 lobe is the one that is actually lit at 143°.
     */
    float forward=(0.18+hg(cosT,-0.30)*0.30)*smoothstep(-0.28,0.14,geo);
    // Cloud tops are the brightest thing on the disc and they still have to sit
    // under 1: at 1.2 they clipped, and clipped cloud is what turned the terminator
    // into a hard white edge instead of a band.
    col=mix(col,vec3(0.96,0.97,1.0)*(0.012+day*0.9+forward),cloud*0.93);
    // Night side: city light, put out by whatever cloud is above it. Hoisted into
    // its own name because the CHAOS block below reuses the fetch as a fire map.
    vec3 lights=texture2D(uNight,vUv).rgb;
    /*
     * 2.6, not 0.85. The night map is mostly black with sparse bright pixels, and at
     * the distance this planet is seen from those pixels are already averaging down
     * through the mip chain — at 0.85 the lit coastlines were there in the buffer
     * and under the noise floor of the display. This is the term the whole night
     * side exists to show, so it is allowed to be the brightest thing in the dark.
     */
    col+=lights*(1.0-smoothstep(-0.10,0.07,geo))*(1.0-cloud*0.8)*2.6;
    /*
     * The air, as one optical path instead of four fitted rims.
     *
     * \`slant\` is the chord the view ray takes through the shell and \`sunSlant\` the
     * chord the sunlight already took to get here. RAY is beta_Rayleigh, softened
     * from the true 1/lambda⁴ ratios (0.175, 0.408, 1.0) to (0.30, 0.55, 1.0):
     * \`uAir\` is already carrying the hue, and stacking a full lambda⁻⁴ slope on top
     * of a blue tint drains the red channel to nothing at the limb.
     *
     * One exp() then does both halves of the job the old code needed a separate
     * hand-tinted sunset term for. \`through\` is what survives the sun-side path —
     * near white at the subsolar point (0.94, 0.90, 0.82) and hard orange at the
     * terminator (0.25, 0.08, 0.01), because blue is extinguished first.
     * \`inscatter\` is what the view path picks up, tinted by whatever \`through\` left
     * it: blue on the day limb, orange where the two paths are both long. That is
     * the sunset, derived rather than fitted.
     */
    float slant=airmass(mu,0.028);
    // The extra 0.42 is the grazing sun-path the shell model under-counts once the
    // sun is below this point's own horizon — it is what widens the terminator from
    // a line to the several-degree band it is at three metres.
    float sunSlant=airmass(max(geo,0.0),0.028)+(1.0-smoothstep(-0.06,0.35,geo))*0.42;
    vec3 RAY=vec3(0.30,0.55,1.0);
    vec3 through=exp(-RAY*sunSlant*7.0);
    vec3 inscatter=(1.0-exp(-RAY*slant*7.0))*through;
    /*
     * Molecular 1 + cos²θ, plus both aerosol lobes. At this scene's 143° the
     * g = 0.76 forward lobe is at 0.09 and the g = −0.18 backward one is at 1.51,
     * so the second is what is actually lighting the limb here. The forward lobe
     * stays because the finale swings the worlds around the well and the crescent
     * side does come into shot; the clamp is there because its spike at exact
     * forward scatter is 30× and the tone mapper will not save that.
     */
    float phase=min(0.62*(1.0+cosT*cosT)+hg(cosT,0.76)*0.70+hg(cosT,-0.18)*0.35,6.0);
    col+=uAir*inscatter*phase*smoothstep(-0.30,0.22,geo)*1.30;
    /*
     * Ozone. The Chappuis band eats the yellow-green out of a long slant path,
     * which is why the last few kilometres above a sunset go violet rather than
     * simply dimmer, and it is the only term above that nothing else models. Halved
     * from 0.9, since \`through\` is now doing the reddening it used to compensate for.
     */
    col+=vec3(0.30,0.18,0.52)*pow(grazing,7.0)*smoothstep(0.30,-0.10,geo)*0.45;
    /*
     * Cloud translucency at the terminator.
     *
     * A deck is optically thick from above and thin edge-on, and at the terminator
     * the sun is edge-on to it — so the light arriving has taken the same long
     * horizontal path the sunset takes (\`through\` is already that colour) and leaves
     * through the far side of the cloud rather than off the top. This is the term
     * that makes a terminator a band of burning cloud tops instead of a boundary.
     */
    col+=vec3(1.0,0.86,0.66)*through*cloud*(0.35+hg(cosT,-0.30)*0.45)
        *smoothstep(0.30,-0.02,abs(geo))*0.85;
    // Aerial perspective: even at noon you are looking through air.
    col+=uAir*day*0.05;
    /*
     * And a floor, because the sky is not empty.
     *
     * The room is inside a galaxy whose nucleus is the object at the end of the
     * corridor, and this planet passes two metres from the lens. A night side at
     * exactly zero is a hole in the frame; a hundredth of the surface albedo is the
     * shape of the dark limb becoming legible against the star field.
     */
    col+=surface*0.014+uAir*0.010;
    /*
     * CHAOS, on the one world that has anything to lose.
     *
     * Four separate terms, because "red" applied as a single tint is a photo filter
     * and reads as one — which is exactly what the single rim line in the tail used
     * to be, and at three metres it looked like a gel over a blue planet.
     */
    if(uChaos>0.001){
      /*
       * The oceans go to iron. Replaced rather than tinted: the map is a photograph
       * with the sky's own blue already in the water, so a multiply leaves a blue
       * ocean behind a red gel. Luminance × rust discards the hue and keeps the
       * sea's structure — currents, shelf, the terminator's glint — which is what
       * makes it read as the same ocean under a different sky, not as a repaint.
       */
      float sea=dot(col,vec3(0.34));
      col=mix(col,vec3(sea*1.5,sea*0.34,sea*0.12),ocean*uChaos*0.92);
      /*
       * Fever on the sunlit face. Hot ground radiates, and hardest where the sun is
       * highest — pow(day,0.7) rather than day, so the glow covers most of the lit
       * hemisphere instead of hugging the subsolar point.
       */
      col+=vec3(1.0,0.26,0.06)*pow(day,0.7)*land*uChaos*0.55;
      /*
       * Fires, and the night map is already the fire map: it is a raster of exactly
       * where there is anything on this planet that burns. Retinted from sodium to
       * flame and pushed hard over the city-light term above, so the dark side is
       * lit by what is happening to it rather than by infrastructure. The \`uBurn\`
       * gain is what turns a lit night side into a burning one as the well closes.
       */
      col+=lights*vec3(3.4,0.62,0.10)*(1.0-smoothstep(-0.10,0.10,geo))*uChaos*(1.0+uBurn*2.2);
      /*
       * ...and the crust opening along the ranges. \`tilt\` is the relief gradient
       * already computed for the bump forty lines up — steep is where the mountains
       * are — so a magma seam network that follows the Andes, the Himalaya and the
       * mid-ocean ridges costs one length() and no new texture at all.
       */
      col+=vec3(1.6,0.30,0.05)*smoothstep(0.05,0.34,length(tilt))*land*uChaos*(0.35+uBurn*1.8);
    }
    /*
     * The mark.
     *
     * It goes on last and it goes on lit-but-never-dark, because what is being
     * drawn is not paint on a planet — it is a country marked on a map, and a
     * marked map does not stop being legible on the night side. \`0.35 + 0.65*day\`
     * is that: the rim dims into the shadow without ever going out, so the outline
     * stays closed all the way around the terminator.
     *
     * \`fwidth\` and not a constant, because Earth goes from eight metres to three
     * over a fifth of the rail: a UV-constant rim is a hairline on the approach and
     * a smeared band at the close pass. This is a rim ~1.4 pixels wide at every
     * distance, floored so a distant Earth still shows the line.
     *
     * The limb fade is not cosmetic either — an equirect texel is a full degree of
     * longitude wide at the edge of the disc, so the polygon test there is sampling
     * a shape it cannot resolve.
     */
    if(uMark>0.001){
      float d;
      float fill=argentina(vUv,d);
      vec2 m=vec2(vUv.x*2.0,vUv.y);
      float w=max(max(fwidth(m.x),fwidth(m.y))*1.4,0.0012);
      /*
       * A thick solid core with a short falloff, not a wide gradient.
       *
       * d is the distance to the border, so the first argument is where the line
       * stops being solid and the second is where it ends. Widening only the second
       * — the obvious edit — spreads the same ink over more pixels and the outline
       * gets *fainter*, which is what happened on the first attempt. Holding it full
       * out to 2.2 texels and fading by 4 is a line you can see at a glance.
       */
      float rim=1.0-smoothstep(w*2.2,w*4.0,d);
      float facing=smoothstep(0.10,0.40,dot(n0,eye));
      float lit=0.35+0.65*day;
      float mark=uMark*facing;
      // Interior: the albedo is kept — the land under it has to stay recognisable —
      // and pulled toward the tint rather than replaced by it.
      col=mix(col,col*0.45+uMarkTint*(0.30+day*0.55),fill*mark*0.85);
      /*
       * Border: additive, so it survives whatever the terminator did to the ground,
       * and the loudest thing in the block. The interior wash was carrying the read
       * and the outline was a thread — which is backwards. A country is recognised
       * by its border: with the fill down and the rim up the shape reads at a
       * glance, and the land inside it stays land instead of turning teal.
       */
      col+=uMarkRim*rim*mark*(3.4*lit);
      // A single-texel inner halo, which is what stops the outline reading as a
      // sticker: the glow belongs to the surface, not on top of it.
      col+=uMarkTint*fill*mark*(1.0-smoothstep(w*2.0,w*9.0,d))*0.22*lit;
    }
  }else if(uKind>1.5){
    // The map is a photograph, so its own luminance is the height field: crater
    // floors are dark because they are down. Doubling as bump costs four taps.
    vec2 e=uTexel*1.5;
    vec2 g=vec2(dot(texture2D(uSurface,vUv-vec2(e.x,0.0)).rgb-texture2D(uSurface,vUv+vec2(e.x,0.0)).rgb,vec3(0.34)),
                dot(texture2D(uSurface,vUv-vec2(0.0,e.y)).rgb-texture2D(uSurface,vUv+vec2(0.0,e.y)).rgb,vec3(0.34)));
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
    /*
     * Crater shadow, the same horizon march the Earth's relief gets — and on a body
     * with no atmosphere it is the *only* shadow there is. This is the term that
     * stops a three-metre moon looking like a dimpled ball: at the terminator the
     * crater floors go black while their far rims stay lit.
     */
    vec2 sunDir=normalize(vec2(dot(SUN,east),dot(SUN,north))+1e-6);
    float h0=dot(surface,vec3(0.34));
    float shade=0.0;
    for(int i=1;i<=4;i++){
      float t=float(i)*0.25;
      shade=max(shade,(dot(texture2D(uSurface,vUv+sunDir*uTexel*5.0*t).rgb,vec3(0.34))-h0)/t);
    }
    scatter*=1.0-clamp(shade*3.0,0.0,1.0)*0.85;
    // Geometric albedo 0.12 against Earth's 0.31, and the map is scanned to
    // mid-grey — so it has to come down by roughly that ratio to be asphalt.
    col=surface*0.44*scatter*(1.0+0.55*exp(-phase*5.5))*2.4*smoothstep(-0.04,0.05,geo);
    // Earthshine, and no more than that: a rock this close cannot have a night side
    // of literally nothing in it.
    col+=surface*0.012;
  }else{
    // A gas giant has no surface: the light comes back out of a deep scattering
    // atmosphere, so it limb-darkens hard and has no specular anywhere.
    col=surface*(0.004+max(geo,0.0)*1.5)*pow(max(mu,0.02),0.42);
    /*
     * The rings' shadow on the planet, cast rather than faked: walk the sun ray
     * from this point down to the equatorial plane and ask the ring's own alpha map
     * what is standing in the way. It cannot be a painted gradient because it has
     * to move with the axial tilt, and it is the single detail that makes the
     * silhouette unmistakably Saturn.
     */
    vec3 p=normalize(vP);
    float t=-p.y/(abs(vSun.y)<1e-3?1e-3:vSun.y);
    float u=(length((p+vSun*t).xz)-1.24)/1.03;
    // Softened: a hard-edged band was survivable at twenty-six metres and is a
    // decal at four. The ring is a slab with structure, and its shadow's edge is
    // the penumbra of a light source half a degree wide.
    if(t>0.0&&u>-0.04&&u<1.04){
      float band=texture2D(uMask,vec2(clamp(u,0.0,1.0),0.5)).a;
      col*=1.0-band*0.72*smoothstep(-0.04,0.02,u)*smoothstep(1.04,0.98,u);
    }
    col+=surface*0.010;
    /*
     * The haze deck, on the same optical path as Earth's air and four times as
     * thick — this is all there is of Saturn, there is no ground under it — and
     * with no wavelength term, because the aerosols are large: they scatter grey
     * and the gold comes from \`uAir\`. h = 0.11 puts the limb at 2.2× the disc
     * centre, which is the soft edge a gas giant has instead of a silhouette.
     *
     * In the branch rather than in the tail, where it used to sit behind a
     * \`(uKind>0.5&&uKind<1.5)?0.5:0.0\` ternary paid for by every fragment of all
     * three worlds to be discarded on two of them.
     */
    col+=uAir*airmass(max(mu,0.02),0.11)*(0.35+hg(cosT,-0.24)*0.50)
        *smoothstep(-0.22,0.30,geo)*1.5;
  }
  /*
   * The generic CHAOS grade, on every body.
   *
   * This used to be \`uAir*pow(grazing,2.6)*uChaos*1.1\`, a rim tint in the body's
   * *own* air colour — so Saturn got a faint tan halo and the moon, whose \`air\` is
   * #000000, got precisely nothing. Three worlds under a law called CHAOS and one
   * of them could not tell.
   *
   * Written on luminance rather than as a mix toward a constant, so the map's own
   * structure survives the grade: Saturn's bands stay bands and the maria stay
   * maria, they are just being seen by a different light. The rim term stays,
   * because a body silhouetted against a burning sky has a hot edge, but it is now
   * the grade's own colour and not the planet's air.
   */
  if(uChaos>0.001){
    float lum=dot(col,vec3(0.34));
    col=mix(col,col*vec3(1.30,0.34,0.14)+vec3(lum*0.55,lum*0.10,lum*0.02),uChaos*0.8);
    col+=vec3(1.0,0.22,0.05)*pow(grazing,2.4)*uChaos*(0.8+uBurn*1.6);
  }
  /*
   * The eruptions actually light the worlds.
   *
   * CosmicEvents publishes the brightest nova on sceneState and these are the only
   * surfaces near enough for it to matter. Without this term a nova brightens five
   * thousand additive pixels and leaves the side of a planet shaded exactly as it
   * was, which reads as a sprite laid over the scene rather than an event in it.
   *
   * A second lambert term and nothing more: no specular, because a flash that
   * glints reads as a lamp in the room rather than as a star going off a dozen
   * metres away, and no shadow, because the falloff is already doing that job on
   * the CPU side. The tint is the cool blue-white the sprites are drawn in.
   *
   * Against the geometric normal n0 rather than the relief-perturbed n, and not
   * only because n is scoped to the branches above: this is a soft light from a
   * body a dozen metres off, so putting mountain relief into its terminator would
   * be detail the source cannot cast.
   *
   * The tint follows the law, because under CHAOS what arrives is not a nova a
   * dozen metres off — it is a rock landing on this body's own limb, and
   * \`CosmicEvents\` publishes the impact point as the flash source. The authored
   * 1/(1+r²·0.05) falloff on the CPU side puts that at ~95% where a distant
   * eruption lands at 5%, and a blue-white impact fireball reads as a lens artefact.
   */
  col+=mix(vec3(0.55,0.74,1.0),vec3(1.0,0.42,0.12),uChaos)*max(dot(n0,uFlash),0.0)*uFlashAmount*0.85;
  col=mix(col,vec3(dot(col,vec3(0.34)))*vec3(0.62,0.74,0.86),uVacuum*0.85)*(1.0-uVacuum*0.45);
  /*
   * Coming apart, as a fragment test and not as geometry.
   *
   * Three great circles through the body's centre; the fault network is the union
   * of the three distance-to-zero sets. Great circles because a shell fails along
   * planes through its centre, and three because it is the fewest that closes a
   * cell — each extra plane is another dot product on every fragment of a body
   * that fills half a frame at these distances.
   *
   * Deliberately NOT a tide, and that has to be said out loud here.
   * \`sceneState.distortion\` is the final-VISCOUS gate and is 0 for the whole of
   * CHAOS, so \`uTide\`/\`uSqueeze\` in the vertex stage are still exactly the
   * identity and nothing around the well is deformed. CHAOS does not stretch a
   * planet, it breaks it — a different verb, a cheaper one, and the one that was
   * actually asked for.
   */
  if(uBurn>0.002){
    vec3 sp=normalize(vP);
    // The wobble is the whole difference between a fracture network and a beach
    // ball: three exact circles are a pattern, three warped ones are damage.
    float w=0.055*sin(sp.x*8.3+sp.y*6.1)*cos(sp.z*7.4-sp.x*5.2);
    float f=min(min(abs(dot(sp,vec3( 0.81, 0.32, 0.49))+w),
                    abs(dot(sp,vec3(-0.28, 0.75, 0.60))-w)),
                    abs(dot(sp,vec3( 0.53,-0.62, 0.58))+w*0.6));
    // The fault opens with the burn: a hairline at 0, a 0.11-wide rift at 1.
    float open=0.006+uBurn*0.105;
    float crack=1.0-smoothstep(open*0.35,open,f);
    // Molten interior, hottest right at the lip where the shell is thinnest.
    // Additive-bright on purpose — the post chain's bloom is already there and
    // will do the heat haze for free.
    col=mix(col,vec3(2.4,0.62,0.10)*(0.35+uBurn),crack*(0.35+uBurn*0.65));
    /*
     * ...and then the lip goes too. This is the fragmentation: past the threshold
     * the body is literally not there along the fault, so the star field and the
     * well show *through* the gaps. A planet with holes in it reads as destroyed;
     * a planet at 40% opacity reads as a dimmed sprite, which is all \`gone\` was
     * doing on its own. Before gl_FragColor, so the tonemapping include is never
     * reached on a discarded fragment.
     */
    if(f<open*0.42*uBurn) discard;
  }
  gl_FragColor=vec4(col,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const ringFragment = /* glsl */ `
uniform vec3 uColor; uniform sampler2D uMask; uniform float uChaos; uniform float uVacuum;
uniform float uBurn;
varying vec3 vP; varying vec3 vN; varying vec3 vView; varying vec3 vSun;
const vec3 SUN=normalize(vec3(-0.62,0.30,0.72));
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
  vec3 col=uColor*ring.rgb*2.1*forward*umbra*(1.0+uChaos*0.6);
  // The ring is water ice and CHAOS is not a place where water ice keeps its shape.
  // Reddened with the planet it belongs to, and thinned — the alpha is what makes it
  // *disperse* rather than merely change colour, and it has to beat the body's own
  // fracture or Saturn ends up as a ring around nothing.
  col=mix(col,vec3(dot(col,vec3(0.34)))*vec3(1.5,0.38,0.12),uChaos*0.85);
  ring.a*=1.0-uBurn*0.88;
  col=mix(col,vec3(dot(col,vec3(0.34)))*vec3(0.62,0.74,0.86),uVacuum*0.85)*(1.0-uVacuum*0.45);
  gl_FragColor=vec4(col,1.0-pow(1.0-ring.a,slant));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`


/**
 * Argentina's centre, and the object-space azimuth of its meridian.
 *
 * In three's `SphereGeometry` the point at UV u lies along `(-cos 2πu, ·, sin 2πu)`,
 * whose azimuth `atan2(z, x)` reduces to exactly `−lon` in radians; and
 * `rotation.set(tilt, yaw, 0)` with the default XYZ order composes as
 * `Rx(tilt)·Ry(yaw)`, where `Ry(yaw)` *subtracts* from azimuth. So solving the yaw
 * for a bearing is a subtraction, not a search.
 *
 * `ARG_LAT` is not read at runtime — it is the number Earth's tilt is fitted to.
 * At the money frame (build 0.20) a tilt of +0.41 puts the sub-camera latitude at
 * +15.7°, which drops Argentina 50° down the disc and foreshortens it to 0.64. At
 * −0.41 it is −31.1°, three degrees from the sub-camera point: dead centre of the
 * visible disc, unforeshortened. Same 23.4° axial tilt, leaning the other way.
 */
const ARG_LON = -64 * THREE.MathUtils.DEG2RAD

/*
 * The tide's write, hoisted to module scope.
 *
 * The body and its ring take the identical warp, and expressing that as
 * `for (const m of [planets[i], rings[i]])` allocated a fresh two-element array
 * every world every frame. A function is free, and it is also what lets the ring
 * slot be empty for the two worlds that have none.
 */
const warpMaterial = (
  material: THREE.ShaderMaterial | null,
  at: THREE.Vector3,
  tide: number,
  squeeze: number,
  chaos: number,
  vacuum: number,
  burn: number,
) => {
  if (!material) return
  const u = material.uniforms
  u.uTideDir.value.copy(holeCenter).sub(at).normalize()
  u.uTide.value = tide
  u.uSqueeze.value = squeeze
  u.uChaos.value = chaos
  u.uVacuum.value = vacuum
  u.uBurn.value = burn
}

const AXIS = new THREE.Vector3()
const RADIAL = new THREE.Vector3()
const TANGENT = new THREE.Vector3()
const ANCHOR = new THREE.Vector3()
const VIEW = new THREE.Vector3()
const FLASH = new THREE.Vector3()
const UNSPIN = new THREE.Quaternion()

const MAPS = [
  '/cosmos/earth.webp',
  '/cosmos/earth-mask.webp',
  '/cosmos/night.webp',
  '/cosmos/moon.webp',
  '/cosmos/saturn.webp',
  '/cosmos/ring.webp',
] as const

/** Texel size per surface map. moon.webp is 1536 × 768; the rest are 2048 × 1024. */
const TEXELS = [
  new THREE.Vector2(1 / 2048, 1 / 1024),
  new THREE.Vector2(1 / 2048, 1 / 1024),
  new THREE.Vector2(1 / 1536, 1 / 768),
] as const

export const Planets = ({ quality }: { quality: Quality }) => {
  const maps = useLoader(THREE.TextureLoader, [...MAPS])
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const worlds = useRef<THREE.Group>(null)
  /**
   * Free rotation, accumulated rather than read off the clock.
   *
   * Two reasons. A planet whose yaw is `b * spin` freezes the instant the wheel
   * does, which is the single biggest "this is a diorama" tell. And Earth's yaw is
   * *solved* inside its pass — blending that lock in against a term read from a
   * running clock makes the planet jump a frame, while blending it against an
   * accumulator that simply stops accumulating does not.
   */
  const drift = useRef([0, 0, 0])
  const resources = useMemo(() => {
    const [earth, mask, night, moon, saturn, ring] = maps
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    for (const map of maps) {
      map.colorSpace = THREE.SRGBColorSpace
      map.anisotropy = anisotropy
      // Equirectangular maps wrap in longitude, and the cloud deck is sampled at a
      // rolling offset — without this the seam clamps into a smear at the dateline.
      map.wrapS = THREE.RepeatWrapping
    }
    // The packed mask is data, not a photograph. Left as sRGB, its elevation, land
    // and cloud channels all come back gamma-decoded and every threshold in the
    // shader reads the wrong number.
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
            uTexel: { value: TEXELS[i] },
            uTideDir: { value: new THREE.Vector3(0, 0, -1) },
            uTide: { value: 0 },
            uSqueeze: { value: 1 },
            uChaos: { value: 0 },
            uVacuum: { value: 0 },
            uBurn: { value: 0 },
            // Earth only. The other two never take the branch, so the country's 33
            // segments never run on them.
            uMark: { value: 0 },
            uMarkTint: { value: new THREE.Color('#4fd6c4') },
            uMarkRim: { value: new THREE.Color('#8ff7e4') },
            uFlash: { value: new THREE.Vector3(0, 1, 0) },
            uFlashAmount: { value: 0 },
          },
        }),
    )
    return {
      planets,
      /*
       * Sparse on purpose: indexed alongside `planets` so the frame loop can stay
       * a single pass over `PLANETS`, but only the ringed world gets a material.
       * Building all three meant two of them were constructed, written to every
       * frame and disposed without ever being mounted — the JSX only renders a
       * ring mesh where `p.ring` is true.
       */
      rings: PLANETS.map((p) =>
        !p.ring
          ? null
          : new THREE.ShaderMaterial({
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
              uChaos: { value: 0 },
              uVacuum: { value: 0 },
              uBurn: { value: 0 },
            },
          }),
      ),
      // Up from 64 × 40, because these now fill a third of the frame: at three
      // metres that tessellation shows a polygonal limb.
      sphere:
        quality === 'cinema'
          ? new THREE.SphereGeometry(1, 128, 80)
          : new THREE.SphereGeometry(1, 96, 56),
      // Inner and outer edge of the real ring system, in planet radii: the C ring
      // starts at 1.24 and the A ring ends at 2.27. The alpha map's u runs across
      // exactly that span, so both shaders can invert it from a radius.
      ring: new THREE.RingGeometry(1.24, 2.27, 220),
    }
  }, [quality, maps, gl])
  useEffect(
    () => () => {
      resources.sphere.dispose()
      resources.ring.dispose()
      resources.planets.forEach((m) => m.dispose())
      resources.rings.forEach((m) => m?.dispose())
    },
    [resources],
  )

  useFrame(({ clock }, delta) => {
    const b = sceneState.build
    const chaos = reactorControl.lawMix.CHAOS
    const vacuum = reactorControl.lawMix.VACUUM
    const s = swallowShape(sceneState.swallow)
    const time = clock.elapsedTime
    // One axis for the galaxy's plane, the planets' decaying orbits and the disk
    // the well is actually being fed by. Reading it rather than authoring a second
    // one is what keeps the nucleus and the accretion disk from drifting apart.
    const axis = holeAxis(AXIS, time)
    // Requirement: nothing around the well is tide-deformed until the very end, and
    // then only in VISCOUS. `sceneState.distortion` is already that gate.
    const warp = sceneState.distortion
    /*
     * CHAOS's destruction gate, and note what it is *not*: `warp` above is the
     * geometric tide and stays 0 outside the final VISCOUS approach. This one only
     * ever reaches the fragment stage. Nothing here deforms a vertex.
     */
    const burn = sceneState.chaosBurn
    /*
     * Earth's pass, as a single turn that lands on Argentina.
     *
     * Read off the world's own approach rather than off `build`, for the same reason
     * the flyby is: it is the lens closing on Earth that the rotation has to be in
     * step with, and `build` does not know about the damping or the lane.
     *
     * The window is measured. Earth is on screen from build 0 to about 0.24 and its
     * disc grows 0.31 → 0.77 over that; past 0.24 it is leaving the frame and by
     * 0.28 it is gone. Those correspond to `planetSwing` 0.02 → 0.70, so the turn is
     * spent there and finishes while the planet is still big and whole. Anything
     * later would land the country on a limb sliding out of shot.
     */
    const pass = THREE.MathUtils.smoothstep(
      planetSwing(PLANETS[0], sceneState.railZ),
      0.02,
      0.7,
    )

    worlds.current?.children.forEach((world, index) => {
      const spec = PLANETS[index]
      /*
       * The flyby, as a gap-driven sweep.
       *
       * `gap` is the metres of corridor left between the lens and this world's
       * reference depth, read from the live camera so the pass survives damping and
       * parallax. `swing` is smoothstep and not linear deliberately: smoothstep
       * front-loads the lateral escape into the near half of `reach`, which is what
       * keeps the minimum distance from collapsing while the world is still near
       * the axis.
       */
      planetAnchor(spec, sceneState.railZ, ANCHOR)
      // Split the offset from the singularity into the disk's plane and the height
      // above it. Infalling matter joins the disk it is being fed into, so the
      // well's own axis is the axis every orbit here decays around.
      RADIAL.copy(ANCHOR).sub(holeCenter)
      const height = RADIAL.dot(axis)
      RADIAL.addScaledVector(axis, -height)
      const r = Math.max(1e-4, RADIAL.length())
      RADIAL.divideScalar(r)
      TANGENT.crossVectors(axis, RADIAL)
      const fall = spiralFall(r, height, s, PLANET_SPAN)
      /*
       * At swallow 0 this is the identity on `ANCHOR`: fall = 0, wind = 0, so
       * radius is the authored radius and the cos/sin recompose is exact. The
       * corridor cruise that used to be added here is gone — the flyby *is* the
       * motion now, and at the new radii a fraction of a radian about the well was
       * worth two metres of sideways error against a three-metre pass. The orbit
       * machinery stays for the swallow only.
       */
      world.position
        .copy(holeCenter)
        .addScaledVector(RADIAL, Math.cos(fall.wind) * fall.radius)
        .addScaledVector(TANGENT, Math.sin(fall.wind) * fall.radius)
        .addScaledVector(axis, fall.height)
      // CHAOS spins the worlds harder; the lock freezes the accumulator instead of
      // fighting it.
      drift.current[index] +=
        delta * spec.idle * (1 + chaos * 4) * (1 - (spec.kind === 0 ? pass : 0))
      const free = spec.phase + b * spec.spin + drift.current[index]
      let yaw = free
      if (spec.kind === 0) {
        /*
         * Argentina, aimed at the lens.
         *
         * The view vector brought into the tilt frame — Rx(−tilt)·v, x and z only —
         * gives the bearing the surface has to be turned to, and the yaw that puts
         * ARG_LON there is a subtraction. Crossfaded in over the same ramp as the
         * mark: the lens swings ~90° of azimuth around Earth during the pass, so
         * holding the lock reads as *Earth turning to present Argentina* rather
         * than as a frozen planet.
         */
        VIEW.copy(camera.position).sub(world.position)
        const c = Math.cos(spec.tilt)
        const sn = Math.sin(spec.tilt)
        const bearing = Math.atan2(-sn * VIEW.y + c * VIEW.z, VIEW.x)
        /*
         * The target is the solve and nothing else. It used to read
         * `-ARG_LON - bearing + drift.current[index]`, which adds the free-rotation
         * accumulator to an angle that was just solved for — so the country landed
         * wherever Earth happened to have spun to before the lock engaged, and the
         * face presented to the lens drifted with how long the page had been open.
         * `drift` belongs in `free`, which is the other end of this lerp.
         */
/*
         * Earth turns at its own rate, and the *lens* is what goes round it.
         *
         * A previous version spun the globe a turn and a half over the pass to show
         * every side. That is not the same picture: a planet whirling on its axis in
         * ten seconds reads as a prop on a turntable, and it also fights the one
         * thing the surface has to do, which is hold still enough to be looked at.
         * The lap belongs to the camera — see `earthOrbitAngle` in `planetSpec` and
         * the orbit block in `Rig` — so here the spin stays the slow idle it always
         * was, crossfading into the solved angle as the pass closes.
         */
        yaw = THREE.MathUtils.lerp(free, -ARG_LON - bearing, pass)
      }
      // XYZ Euler order means Rx wraps Ry, so the planet spins about its own axis
      // *inside* its tilt — which is what axial tilt is, and what lets the ring ride
      // the tilt without being spun by the day.
      world.rotation.set(spec.tilt, yaw, 0)
      /*
       * Out before the lens starts for the mouth, and staggered so no two blink out
       * on the same frame.
       *
       * Gated on `drain` rather than on `fall`. `fall` is a function of r, and at
       * the new radii — 22.0 / 18.4 / 14.7 m about `holeCenter`, against a lens
       * parked 10.2–12 m out — the near world reaches the camera's own shell at
       * fall 0.18, i.e. before a window on `fall` had begun to fade it. `drain` is
       * the same channel for every world, so the guarantee is uniform: nothing can
       * arrive at the lens still visible.
       *
       * `beyond` is the backstop: it is the channel the whole finale already uses
       * for "the room is inside the well and what is left in frame is its own
       * light", so anything still standing when it opens is on the wrong side of
       * that statement.
       */
      const gone =
        (1 -
          THREE.MathUtils.smoothstep(
            s.drain,
            0.08 + index * 0.05,
            0.3 + index * 0.06,
          )) *
        (1 - s.beyond)
      /*
       * ...and the mirror of it at the other end: a world arrives for its own pass.
       *
       * `gone` handles the exit and there was nothing handling the entrance, so all
       * three worlds stood at full size from the first frame. For Earth and Saturn
       * that is right — they are the establishing shot. For the moon it was not: its
       * pass is at build 0.57 and at build 0.02 it sat eighteen metres out, directly
       * behind Earth and just far enough off-centre to poke a grey cratered lump
       * through Earth's limb. Two bodies grazing at the silhouette do not read as
       * two bodies, they read as a bite taken out of the nearer one.
       *
       * Scaled from the world's own `reach`, so it is the same number that already
       * paces its sweep rather than a second schedule to keep in step: absent beyond
       * 1.6 reaches, whole inside 1.25. At the opening that is Earth 10.7 m against
       * 16.6 and Saturn 14.4 against 26.1 — both untouched — and the moon 18.0
       * against 17.4, which is the lump gone. It grows in over the first metres of
       * the dolly, which is what an approach looks like anyway.
       */
      const arrive =
        1 -
        THREE.MathUtils.smoothstep(
          sceneState.railZ - spec.at[2],
          spec.reach * 1.25,
          spec.reach * 1.6,
        )
      const present = gone * arrive
      world.scale.setScalar(spec.size * Math.max(0.001, present))
      world.visible = present > 0.004
      // Note that squeeze lerps from 1 rather than scaling: at warp 0 both are
      // the identity and the vertex map is a no-op.
      const tide = (fall.stretch - 1) * warp
      const squeeze = 1 + (fall.squeeze - 1) * warp
      warpMaterial(resources.planets[index], world.position, tide, squeeze, chaos, vacuum, burn)
      warpMaterial(resources.rings[index], world.position, tide, squeeze, chaos, vacuum, burn)
      /*
       * The nova's light, in this world's own object space.
       *
       * Resolved on the CPU rather than in the shader because the direction is the
       * same for every fragment of a body four metres wide seen from a dozen: a
       * per-vertex solve would cost a varying and buy nothing. The rotation is all
       * that has to be undone — the group's scale is uniform, so its inverse does
       * not shear the direction.
       *
       * Falloff is authored, not inverse-square: the eruptions spawn anywhere from
       * four to thirty metres out and a true 1/r² either blows out the near ones or
       * loses the far ones entirely. This reads as a flash that reaches.
       */
      const u = resources.planets[index].uniforms
      if (sceneState.flash > 0.002) {
        FLASH.set(sceneState.flashX, sceneState.flashY, sceneState.flashZ).sub(
          world.position,
        )
        const range = FLASH.length()
        FLASH.divideScalar(Math.max(range, 1e-4)).applyQuaternion(
          UNSPIN.copy(world.quaternion).invert(),
        )
        u.uFlash.value.copy(FLASH)
        // Under CHAOS the source is an impact on this world's own limb rather than
        // a nova a dozen metres off, and an impact is a detonation: +80% at full
        // CHAOS, which the orange tint in the shader is matched to.
        u.uFlashAmount.value =
          (sceneState.flash / (1 + range * range * 0.05)) * present * (1 + chaos * 0.8)
      } else {
        u.uFlashAmount.value = 0
      }
      // The deck turns faster than the ground, and faster than it used to: at three
      // metres the parallax between deck and surface has to be visible or the cloud
      // shadow's offset is wasted.
      resources.planets[index].uniforms.uCloudSpin.value =
        time * 0.0035 + b * 0.05
    })

    // Lights up as Earth begins its approach and stays lit — by the time it would
    // matter that it never fades, Earth is behind the lens.
    /*
     * ...and the country is painted last, not held up throughout.
     *
     * Over the final quarter of the turn, so it arrives as the rotation settles:
     * the mark appearing while the globe is still visibly spinning reads as a decal
     * riding the surface, and appearing after it has stopped reads as a label
     * switched on. Landing together is the one that reads as arrival.
     */
    resources.planets[0].uniforms.uMark.value = THREE.MathUtils.smoothstep(
      pass,
      0.72,
      0.99,
    )
  })

  return (
    <group ref={worlds}>
      {PLANETS.map((p, i) => (
        <group key={p.air + p.kind} position={[...p.at]} scale={p.size}>
          <mesh geometry={resources.sphere} material={resources.planets[i]} />
          {p.ring ? (
            <mesh
              geometry={resources.ring}
              material={resources.rings[i]!}
              rotation={[-Math.PI / 2, 0, 0]}
            />
          ) : null}
        </group>
      ))}
    </group>
  )
}
