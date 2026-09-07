/**
 * The well at the end of the corridor.
 *
 * Cinema traces geodesics; lite paints the same silhouette on two billboards.
 * The columns, lintel and stator used to frame it, and they also broke it:
 * a hard D-crease down the middle plus a doorway drawn over the pass. The
 * well stands on its own now.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  captureRs,
  GATE_APERTURE_Y,
  GATE_APERTURE_Z_AHEAD,
  HOLE_SPIN,
  holeGateFor,
  holeRadiusFor,
  holeRender,
  iscoRs,
} from './blackHole'
import { reactorControl } from './control/reactorControl'
import { PORTAL_POSITION } from './layout'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState, swallowShape } from './sceneState'

const RING_RADIUS = 1.85
/** World Y of the well, shared with `holeCenter` so the billboard cannot drift. */
const RING_Y = GATE_APERTURE_Y
/** The hot end of the disk's temperature ramp, in the renderer's linear space. */
const WHITE = new THREE.Color(1, 1, 1)

const portalVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * The aperture, for a device with no post chain.
 *
 * `src/scene/cinema/BlackHoleEffect.ts` draws the well properly — it integrates
 * photon geodesics and gets the shadow, the ring, the lensed disk and the bent
 * corridor as consequences. It also needs a composer to sample the frame it is
 * bending, and every phone resolves `lite`, which has none. So this is the same
 * image drawn as a picture rather than as a simulation, on the one billboard the
 * gate already has.
 *
 * What matters is that it is the same *silhouette*. The old version was a face-on
 * whirlpool: radially symmetric, spinning, with a dark middle. It read as a portal
 * and it was a decent portal, but the shape it made is not the shape a black hole
 * makes. The shape a black hole makes — the one thing everyone recognises — is
 * three separate images of a single flat disk:
 *
 * 1. the **near half**, crossing in front of and slightly below the shadow;
 * 2. the **far half**, lensed up and over the *top* of the shadow, because light
 *    leaving it away from us is bent back toward us;
 * 3. the **underside** of the disk, lensed under the bottom, thinner and fainter.
 *
 * Those three close into the loop around a black disc that nothing else in nature
 * produces, and the arcs are the whole read: face-on, all three collapse onto each
 * other and the structure is gone. So they are drawn here as three explicit terms,
 * because a billboard cannot derive what it never traced.
 */
const portalFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uPower;
uniform float uHandshake;
uniform float uOpacity;
uniform float uSwallow;
uniform float uHorizon;
uniform float uSpin;
uniform float uDiskIn;
uniform vec3 uInner;
uniform vec3 uOuter;
uniform vec3 uChill;
uniform vec3 uEmber;

varying vec2 vUv;

layout(location = 0) out vec4 fragColor;

/*
 * Value noise, and an fbm over it.
 *
 * Four octaves is the cheapest thing that still has structure at two scales at
 * once, which is what a fluid needs: without the small octaves the flow is a
 * smooth gradient sliding around, and without the large ones it is static.
 */
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 4; octave++) {
    total += noise(p) * amplitude;
    p *= 2.02;
    amplitude *= 0.5;
  }
  return total;
}

void main() {
  vec2 point = (vUv - 0.5) * 2.0;
  if (length(point) > 1.0) discard;
  /*
   * Smooth D: shift and flatten with azimuth, never a crease on x = 0.
   * The disk band still uses point.x; only the hole is warped.
   */
  vec2 q = point;
  float side = point.x / max(length(point), 0.0001);
  q.x -= uSpin * 0.05;
  q.x *= 1.0 + uSpin * 0.2 * (0.5 + 0.5 * side);
  float radius = length(q);

  /*
   * The shadow, and the two radii that hang off it.
   *
   * uHorizon is the apparent radius of the black disc in this plane's own
   * coordinates, handed down so the occluding mesh drawn underneath can use
   * exactly the same number — a photon ring that is not concentric with the
   * darkness it rings is worse than no ring at all. 1.16 is 3 / 2.6: the ratio of
   * the disk's innermost stable orbit to the shadow's apparent size, which is why
   * a real image has a visible gap between the black and the bright.
   */
  float horizon = uHorizon;
  float diskIn = horizon * uDiskIn;
  // Held inside the stator: the band is the disk seen through the doorway, and a
  // band that runs out past the collar reads as a beam being fired rather than as
  // matter in orbit behind it.
  float diskOut = min(0.8, horizon * 4.6);

  /*
   * The flow.
   *
   * Seen edge-on, the disk's radius runs along screen x and its thickness along
   * screen y, so the log-polar coordinate that made the old version self-similar
   * is taken along x instead of radially. Signed, so material crossing the middle
   * keeps going the same way rather than reflecting.
   */
  float along = 1.0 + abs(point.x) / max(diskIn, 0.001);
  vec2 flow = vec2(
    sign(point.x) * log(along) * 2.5 - uTime * (0.35 + uSwallow * 3.4),
    point.y * 5.0 + uTime * 0.08
  );
  vec2 warp = vec2(fbm(flow * 1.2), fbm(flow * 1.2 + vec2(5.2, 1.3)));
  float grain = pow(clamp(fbm(flow * 2.1 + warp * 1.3), 0.0, 1.0), 1.6);

  /*
   * Image one: the near half, in front of the shadow.
   *
   * Offset downward, because the disk is tipped a few degrees toward the lens —
   * the same tilt src/scene/blackHole.ts gives the real one. The band thickens
   * outward: a disk flares, and a band of constant thickness reads as a drawn
   * line rather than as matter.
   */
  float tilt = 0.05 + uSwallow * 0.04;
  float thick = 0.045 + 0.24 * max(abs(point.x) - diskIn, 0.0) + uSwallow * 0.04;
  float reach =
    smoothstep(diskIn * 0.9, diskIn * 1.25, abs(point.x)) *
    (1.0 - smoothstep(diskOut * 0.82, diskOut, abs(point.x)));
  float primaryY = (point.y + tilt) / thick;
  float primary = exp(-primaryY * primaryY) * reach;

  /*
   * Image two: the far half, bent over the top.
   *
   * Light leaving the back of the disk *away* from the lens is turned right back
   * around by the well, so the far side is seen arcing above the shadow rather
   * than hidden behind it. Squashing y before measuring the radius is what makes
   * it an arc that hugs the shadow instead of a circle around it.
   */
  vec2 upper = vec2(point.x, (point.y - tilt) * 1.8);
  float overOff = (length(upper) - horizon * 1.45) / (horizon * 0.3);
  float over =
    exp(-overOff * overOff) *
    // Confined to the half it belongs to. Clamping the y term to zero instead —
    // which is what this did first — leaves the arc's radius equal to |x| for
    // every pixel below the line, so it lit two vertical lobes out in the lower
    // half where there is nothing at all: an arc over the top drawn twice more,
    // sideways.
    smoothstep(0.0, horizon * 0.5, point.y - tilt);

  /*
   * Image three: the underside, under the bottom. Thinner and dimmer, because it
   * is the same light taking a longer way round.
   */
  vec2 lower = vec2(point.x, (point.y + tilt) * 2.7);
  float underOff = (length(lower) - horizon * 1.32) / (horizon * 0.24);
  float under =
    exp(-underOff * underOff) *
    smoothstep(0.0, horizon * 0.5, -(point.y + tilt));

  float secondary = over * 0.85 + under * 0.4;

  /*
   * The photon ring: the thin, much brighter filament right at the shadow's edge,
   * where light that grazed the well comes back around. It is the single feature
   * that says "black hole" rather than "whirlpool".
   */
  float ringOff = (radius - horizon * 1.02) / (horizon * 0.055);
  float ring = exp(-ringOff * ringOff);
  // N=2: a second, thinner filament just inside the first. No third.
  float ring2 = (radius - horizon * 0.985) / (horizon * 0.028);
  ring += 0.4 * exp(-ring2 * ring2);

  /*
   * Doppler beaming, as an axis rather than as a rotation.
   *
   * Edge-on, one *side* of the frame is coming at the lens and the other is going
   * away, and the brightness ratio between them is better than four to one. It is
   * the plainest possible statement of the physics and it is most of what keeps
   * the aperture from reading as a decorative target.
   */
  float limb = point.x / max(diskOut, 0.001);
  float beam = mix(0.55, 1.85, smoothstep(-0.7, 0.7, limb));

  float matter = (primary + secondary) * (0.3 + grain * 0.9);
  /*
   * Two weak lobes along the axis: the jets, as dumb as everything else on this
   * board. They stay clear of the shadow (the escaped cutout below would catch
   * them anyway) and never outshine the band.
   */
  float jetX = point.x / 0.07;
  float jet =
    exp(-jetX * jetX) *
    smoothstep(horizon * 1.1, horizon * 1.7, abs(point.y)) *
    (1.0 - smoothstep(0.55, 0.9, abs(point.y)));
  // ponytail: jets stay dark until the well is actually feeding (power+swallow),
  // otherwise two faint lobes ride over the corridor stars and read as glare.
  float jetGate = smoothstep(0.25, 0.7, uPower + uSwallow * 1.5);
  float body =
    matter * beam * (0.28 + uPower * 0.45 + uSwallow * 1.1) +
    ring * (0.4 + uSwallow * 1.7) +
    jet * (0.10 + uSwallow * 0.35) * (0.3 + grain * 0.4) * jetGate +
    uHandshake * matter * 0.4;

  /*
   * Colour by radius and by limb. The outer flow keeps the room's accent, the
   * inner rim runs pale, and the two sides read as different temperatures: the
   * one rushing at the lens climbs to champagne, the receding one burns down to
   * ember — the same quantity that set beam, spending itself on hue.
   */
  float depth = smoothstep(diskOut, diskIn, abs(point.x));
  vec3 tint = mix(uOuter, uInner, depth * (0.55 + uSwallow * 0.45));
  tint = mix(tint, uChill, smoothstep(0.05, 0.75, limb) * 0.65);
  tint = mix(tint, uEmber, smoothstep(-0.05, -0.75, limb) * 0.7);
  tint = mix(tint, vec3(1.0), ring * 0.45);
  vec3 colour = tint * (0.3 + body);

  /*
   * A knee below clipping. Additive blending over a hot accent drives the brightest
   * part of the band to pure white, and white has no hue, no depth and no material
   * — it reads as a blown highlight rather than as matter.
   */
  colour = colour / (1.0 + max(colour - 0.72, 0.0) * 1.9);

  // Nothing escapes from inside the shadow — that is the whole idea.
  float escaped = smoothstep(horizon * 0.9, horizon * 1.06, radius);
  float aperture = smoothstep(1.0, 0.8, radius);

  float alpha = body * aperture * escaped * uOpacity;
  if (alpha < 0.004) discard;
  fragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
}
`

/**
 * The hole itself.
 *
 * A separate, *non*-additive disc drawn under the accretion shader. Additive
 * blending cannot draw darkness — it can only fail to add light — so with the
 * screen-space ignition wash rising through the finale the centre of the aperture
 * came out pale grey. A black hole whose middle is brighter than the room is a
 * whirlpool. This occludes instead, which is what gives the photon ring something
 * to be a ring around.
 */
const horizonFragmentShader = /* glsl */ `
uniform float uSwallow;
uniform float uOpacity;
uniform float uHorizon;
uniform float uSpin;
uniform vec3 uGround;

varying vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  vec2 point = (vUv - 0.5) * 2.0;
  if (length(point) > 1.0) discard;
  vec2 q = point;
  float side = point.x / max(length(point), 0.0001);
  q.x -= uSpin * 0.05;
  q.x *= 1.0 + uSpin * 0.2 * (0.5 + 0.5 * side);
  float radius = length(q);

  /*
   * The shadow, at exactly the radius the accretion shader rings.
   *
   * This used to cover the whole billboard with a soft grey wash, on the reasoning
   * that the middle of a black hole has to be darker than the room. True, but the
   * middle is 2.6 Rs across and the billboard is twenty times that, so the wash
   * also dimmed the disk it was there to make readable. uHorizon is shared with
   * the accretion pass so the darkness and the filament around it are one object
   * rather than two that happen to be concentric.
   *
   * Nearly opaque rather than fully: the disc is drawn over a corridor that is
   * already almost black, and a hard cut to zero shows the edge of the quad's
   * antialiasing before it shows an event horizon.
   */
  float solid = smoothstep(uHorizon * 1.08, uHorizon * 0.88, radius);
  float alpha = solid * uOpacity * (0.88 + uSwallow * 0.12);
  if (alpha < 0.004) discard;
  fragColor = vec4(uGround * 0.02, clamp(alpha, 0.0, 1.0));
}
`

export const FinaleGate = () => {
  const group = useRef<THREE.Group>(null)
  const portal = useRef<THREE.Mesh>(null)
  const horizon = useRef<THREE.Mesh>(null)

  const geometries = useMemo(
    () => ({
      portal: new THREE.PlaneGeometry(RING_RADIUS * 1.7, RING_RADIUS * 1.7),
      horizon: new THREE.PlaneGeometry(RING_RADIUS * 1.7, RING_RADIUS * 1.7),
    }),
    [],
  )

  const portalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uHandshake: { value: 0 },
          uOpacity: { value: 0 },
          uSwallow: { value: 0 },
          uHorizon: { value: 0.1 },
          uSpin: { value: 0 },
          uDiskIn: { value: 1.16 },
          uInner: { value: sceneColors.ink.clone() },
          uOuter: { value: sceneColors.accent.clone() },
          uChill: { value: sceneColors.ink.clone() },
          uEmber: { value: new THREE.Color('#6a2a14') },
        },
      }),
    [],
  )

  const horizonMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: portalVertexShader,
        fragmentShader: horizonFragmentShader,
        transparent: true,
        depthWrite: false,
        // Normal blending on purpose: this one is here to subtract, not to add.
        blending: THREE.NormalBlending,
        uniforms: {
          uSwallow: { value: 0 },
          uOpacity: { value: 0 },
          uHorizon: { value: 0.1 },
          uSpin: { value: 0 },
          uGround: { value: sceneColors.base.clone() },
        },
      }),
    [],
  )

  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      portalMaterial.dispose()
      horizonMaterial.dispose()
    },
    [geometries, portalMaterial, horizonMaterial],
  )

  useFrame((state) => {
    const build = sceneState.build
    const power = livePowerFor(build)
    const swallow = swallowShape(sceneState.swallow)
    // Same ramp cinema uses for uGate, so lite's nucleus lands with the jewel
    // instead of waiting until 0.94 while the galaxy already has a hole in it.
    const ease = Math.max(holeGateFor(build), swallow.amount)
    const handshake = reactorControl.uplink
    const time = state.clock.elapsedTime

    /*
     * The billboard stands down when the composer is drawing the well for real.
     *
     * Two accretion disks in one aperture is not twice the light, it is a bright
     * smear with no structure in it — and the geodesic pass draws *over* this one,
     * so what survived would be a wrong-shaped halo around a right-shaped hole.
     * `visible` rather than a faded opacity, because a mesh that is only invisible
     * still costs its draw call and its fragments.
     */
    const billboard = !holeRender.lensing

    /*
     * The shadow's apparent radius, in the billboard's own coordinates.
     *
     * Derived from the real geometry rather than authored, so the cheap version and
     * the expensive one are pictures of the same object: 2.6 Rs is what a distant
     * viewer measures the black disc to be, and the plane it is drawn on is
     * `RING_RADIUS * 1.7` across, hence the half-width below.
     *
     * Capped at a bit over a third, because the billboard's own coordinates are
     * where the whole image is laid out: the disk's inner edge, its outer fade and
     * both lensed arcs are multiples of this, so a shadow allowed to grow past a
     * third squeezes the band it is meant to sit inside out to the plane's rim.
     * The *apparent* size still grows with the ending — it grows because the plane
     * does. See `mouth` below.
     */
    const shadow = Math.min(
      0.36,
      (captureRs(HOLE_SPIN) * holeRadiusFor(build, sceneState.swallow)) /
        (RING_RADIUS * 1.7 * 0.5),
    )

    portalMaterial.uniforms.uTime.value = time
    portalMaterial.uniforms.uPower.value = Math.max(power, swallow.pull)
    portalMaterial.uniforms.uHandshake.value = handshake
    portalMaterial.uniforms.uSwallow.value = swallow.amount
    portalMaterial.uniforms.uHorizon.value = shadow
    portalMaterial.uniforms.uSpin.value = HOLE_SPIN
    portalMaterial.uniforms.uDiskIn.value =
      iscoRs(HOLE_SPIN) / captureRs(HOLE_SPIN)
    portalMaterial.uniforms.uOpacity.value = Math.max(
      THREE.MathUtils.smoothstep(ease, 0.45, 0.95) * (0.35 + power * 0.65),
      swallow.amount,
    )
    portalMaterial.uniforms.uInner.value
      .set('#ffd4a0')
      .lerp(sceneColors.ink, 0.3 + handshake * 0.25)
    portalMaterial.uniforms.uOuter.value
      .set('#bd6d3e')
    portalMaterial.uniforms.uChill.value.copy(sceneColors.ink).lerp(WHITE, 0.5)

    horizonMaterial.uniforms.uSwallow.value = swallow.amount
    horizonMaterial.uniforms.uHorizon.value = shadow
    horizonMaterial.uniforms.uSpin.value = HOLE_SPIN
    horizonMaterial.uniforms.uGround.value.copy(sceneColors.base)
    // ponytail: horizon ramps behind the portal so the dark nucleus never appears
    // before the ring is lit — a black disc flashing on ahead of its own halo is
    // the "black flash" symptom; portal starts at ease 0.45, this at 0.6.
    horizonMaterial.uniforms.uOpacity.value =
      THREE.MathUtils.smoothstep(ease, 0.6, 0.95) * (0.4 + swallow.pull * 0.6)

    /*
     * The plane grows with the drain so the well can take the frame. Both
     * discs scale together so the horizon stays concentric with the ring.
     *
     * ponytail: early in the corridor the aperture is a small nucleus, not the
     * full plane — the galaxy stars around it stay visible. mouth eases from
     * 0.3 up to 1.0 as the gate comes on, then drain widens it past the frame.
     * Ceiling: ease<=1 ⇒ mouth<=1.0; drain<=1 ⇒ +2.2 ⇒ 3.2 (same max as before).
     */
    const mouth = 0.3 + ease * 0.7 + swallow.drain * 2.2
    if (portal.current) {
      portal.current.scale.setScalar(mouth)
      portal.current.visible = billboard
    }
    if (horizon.current) {
      horizon.current.scale.setScalar(mouth)
      horizon.current.visible = billboard
    }

    const root = group.current
    if (root) {
      root.visible = ease > 0.02
      // Assemble pop only — no scroll-driven scaling past that.
      root.scale.setScalar(0.9 + ease * 0.12)
    }
  })

  return (
    <group
      ref={group}
      position={[PORTAL_POSITION[0], 0, PORTAL_POSITION[2] + GATE_APERTURE_Z_AHEAD]}
      visible={false}
    >
      {/* Drawn first: the darkness the accretion ring is a ring around. */}
      <mesh
        ref={horizon}
        geometry={geometries.horizon}
        material={horizonMaterial}
        position={[0, RING_Y, -0.01]}
        renderOrder={1}
        frustumCulled={false}
      />
      <mesh
        ref={portal}
        geometry={geometries.portal}
        material={portalMaterial}
        position={[0, RING_Y, 0]}
        renderOrder={2}
        frustumCulled={false}
      />
    </group>
  )
}
