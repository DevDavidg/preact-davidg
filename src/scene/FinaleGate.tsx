/**
 * The gate at the end of the corridor.
 *
 * This used to be two stretched boxes, a slab and a thin hoop — under the
 * reconstruction material's wireframe stage that read as scaffolding rather than
 * as the thing the whole room has been charging toward. It is now an actual
 * mechanism: machined columns with plinths, collars and heads; a lintel with
 * brackets hanging off it; and a stator ring of radial vanes holding an aperture
 * open in the middle of it.
 *
 * The light in the aperture is a shader rather than a sprite. A radial gradient
 * billboard is a blob — it has no structure, so it reads as a lens flare stuck
 * to the screen. Concentric rings travelling inward read as a field being held
 * open, and they respond to both the charge and the operator's handshake, which
 * is what makes the finale something that *happened* rather than something that
 * faded up.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { reactorControl } from './control/reactorControl'
import { mergeBoxes, type Box } from './kit/chassis'
import { PORTAL_POSITION } from './layout'
import { ReconstructMaterial } from './ReconstructMaterial'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState, swallowShape, clamp01 } from './sceneState'
import { toShards } from './shardGeometry'
import { createStudioEquirect } from './studioEnv'
import { softAssemble } from './ui/assembleDrama'

const COLUMN_X = 2.9
const COLUMN_HEIGHT = 5.1
const RING_RADIUS = 1.85
const RING_Y = 2.55
/** Radial vanes between the two rings — a stator, not a hoop. */
const VANE_COUNT = 16

/**
 * A machined column: base plate, plinth, banded shaft, three collars, head.
 *
 * Segmented on the long axis so the reconstruction breaks it into plausible
 * pieces — a five-metre box shatters into five-metre splinters, which is what
 * made the old gate look like debris rather than like a structure assembling.
 */
const gateColumn = (): THREE.BufferGeometry => {
  const shaft = 0.36
  const boxes: Box[] = [
    { size: [1.0, 0.16, 1.0], position: [0, 0.08, 0], segments: [2, 1, 2] },
    { size: [0.72, 0.28, 0.72], position: [0, 0.3, 0] },
    {
      size: [shaft, COLUMN_HEIGHT - 1.1, shaft],
      position: [0, 0.44 + (COLUMN_HEIGHT - 1.1) / 2, 0],
      segments: [1, 9, 1],
    },
    { size: [0.58, 0.1, 0.58], position: [0, 1.5, 0] },
    { size: [0.5, 0.08, 0.5], position: [0, 2.8, 0] },
    { size: [0.58, 0.1, 0.58], position: [0, 4.1, 0] },
    { size: [0.8, 0.34, 0.8], position: [0, COLUMN_HEIGHT - 0.5, 0] },
    { size: [0.94, 0.12, 0.94], position: [0, COLUMN_HEIGHT - 0.27, 0] },
  ]
  return mergeBoxes(boxes)
}

/** The lintel: a main beam, a fascia under it, and brackets hanging down. */
const gateLintel = (): THREE.BufferGeometry => {
  const span = COLUMN_X * 2 + 1.1
  const boxes: Box[] = [
    { size: [span, 0.44, 0.62], position: [0, 0.22, 0], segments: [12, 1, 1] },
    { size: [span - 0.5, 0.14, 0.78], position: [0, -0.05, 0], segments: [10, 1, 1] },
  ]
  for (let index = 0; index < 7; index += 1) {
    const t = index / 6 - 0.5
    boxes.push({
      size: [0.1, 0.42, 0.36],
      position: [t * (span - 1.4), -0.3, 0],
    })
  }
  return mergeBoxes(boxes)
}

/**
 * The aperture assembly: an outer collar, an inner collar, and vanes between
 * them. The vanes are what make it read as machinery holding something open
 * rather than as a hoop hanging in the air.
 */
const gateRing = (): THREE.BufferGeometry => {
  const boxes: Box[] = []
  const inner = RING_RADIUS * 0.78

  for (let index = 0; index < VANE_COUNT; index += 1) {
    const angle = (index / VANE_COUNT) * Math.PI * 2
    const mid = (RING_RADIUS + inner) / 2
    boxes.push({
      size: [RING_RADIUS - inner, 0.07, 0.16],
      position: [Math.cos(angle) * mid, Math.sin(angle) * mid, 0],
      // Each vane is pitched a little, the way a stator's blades are.
      rotation: [0.22, 0, angle],
    })
  }

  const shards = mergeBoxes(boxes)

  // The two collars are turned parts, so they stay as low-segment torii rather
  // than being approximated out of boxes.
  const outer = toShards(new THREE.TorusGeometry(RING_RADIUS, 0.09, 4, 48))
  const rim = toShards(new THREE.TorusGeometry(inner, 0.055, 4, 40))

  const merged = mergeGeometries([shards, outer, rim])
  shards.dispose()
  outer.dispose()
  rim.dispose()
  return merged
}

/**
 * Concatenates already-sharded geometries.
 *
 * They all carry the same attribute set from `toShards`, so joining them is a
 * matter of appending arrays — and it keeps the whole ring assembly at one draw
 * call, which matters because this object is on screen at the same moment the
 * corridor is at its busiest.
 */
const mergeGeometries = (
  geometries: THREE.BufferGeometry[],
): THREE.BufferGeometry => {
  const names = ['position', 'normal', 'uv', 'aBary', 'aCenter', 'aAxis', 'aSeed']
  const sizes: Record<string, number> = {
    position: 3,
    normal: 3,
    uv: 2,
    aBary: 3,
    aCenter: 3,
    aAxis: 3,
    aSeed: 1,
  }

  const merged = new THREE.BufferGeometry()
  for (const name of names) {
    const parts = geometries.map((geometry) => geometry.getAttribute(name))
    const total = parts.reduce((sum, part) => sum + part.array.length, 0)
    const joined = new Float32Array(total)
    let offset = 0
    for (const part of parts) {
      joined.set(part.array as Float32Array, offset)
      offset += part.array.length
    }
    merged.setAttribute(name, new THREE.BufferAttribute(joined, sizes[name]))
  }
  return merged
}

const portalVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const portalFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uPower;
uniform float uHandshake;
uniform float uOpacity;
uniform float uSwallow;
uniform vec3 uInner;
uniform vec3 uOuter;

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
  float radius = length(point);
  if (radius > 1.0) discard;

  float angle = atan(point.y, point.x);

  /*
   * The event horizon, and why the maths below is in log-polar space.
   *
   * A black hole's accretion flow is not a texture spinning: the material closer
   * in orbits *faster*, and it is that shear between neighbouring radii that
   * stretches the flow into spirals and makes it read as liquid rather than as a
   * rotating image. Keplerian orbital speed goes as r^-1.5, which is the term in
   * "orbit" below — the inner edge laps the outer edge many times over.
   *
   * Sampling the noise against log(radius) is what makes the spiral
   * self-similar: equal steps in the coordinate are equal *ratios* of radius, so
   * the flow has the same character at every scale and appears to fall inward
   * forever without ever showing a seam or a repeat.
   */
  float horizon = mix(0.07, 0.4, uSwallow);
  float orbitRadius = max(radius, horizon);
  float orbit = uTime * (0.3 + uSwallow * 1.9) / pow(orbitRadius, 1.5);

  vec2 flow = vec2(
    angle * 0.85 + orbit,
    log(orbitRadius) * 1.7 - uTime * (0.18 + uSwallow * 0.5)
  );

  /*
   * Domain warping: the noise is sampled at a position that is itself displaced
   * by noise. One sample is clouds; a sample of a warped sample is the curdling,
   * folding motion of something viscous being drawn through itself.
   */
  vec2 warp = vec2(fbm(flow * 1.25), fbm(flow * 1.25 + vec2(5.2, 1.3)));
  float liquid = fbm(flow * 2.05 + warp * (1.1 + uSwallow * 0.9));
  liquid = pow(clamp(liquid, 0.0, 1.0), 1.35);

  // The disk exists outside the horizon and falls off before the collar, so the
  // field is held open by the ring rather than cut off by the geometry's edge.
  float disk = smoothstep(horizon * 0.96, horizon * 1.7, radius);
  float aperture = smoothstep(1.0, 0.8, radius);

  /*
   * The photon ring: the thin, much brighter line right at the horizon where the
   * light that grazed it comes back around. It is the single feature that says
   * "black hole" rather than "whirlpool", and it tightens as the horizon grows.
   */
  float ring = exp(-pow((radius - horizon * 1.08) / (0.055 * (1.0 - uSwallow * 0.45)), 2.0));

  /*
   * Doppler beaming: the side of the disk rotating toward the viewer is brighter.
   * Real images of this are markedly lopsided, and the asymmetry is most of what
   * keeps the aperture from reading as a decorative target.
   */
  float beam = 0.55 + 0.45 * cos(angle - 0.6);

  float body =
    liquid * disk * beam * (0.3 + uPower * 0.4 + uSwallow * 0.95) +
    ring * (0.35 + uSwallow * 1.5) +
    uHandshake * disk * 0.35;

  /*
   * Colour by depth into the well: the outer flow keeps the room's accent, the
   * material about to cross the horizon runs hot and pale. Shifting hue with
   * radius rather than with brightness is what gives the aperture the sense of
   * having a *near* and a *far*.
   */
  float depth = smoothstep(horizon * 3.0, horizon, radius);
  vec3 tint = mix(uOuter, uInner, depth * (0.55 + uSwallow * 0.45));
  tint = mix(tint, vec3(1.0), ring * 0.45);
  vec3 colour = tint * (0.35 + body);

  /*
   * A knee below clipping. Additive blending over a hot accent drives the middle
   * of the aperture to pure white, and a white disc has no hue, no depth and no
   * material — it reads as a blown highlight rather than as a field.
   */
  colour = colour / (1.0 + max(colour - 0.72, 0.0) * 1.9);

  // Nothing escapes from inside the horizon — that is the whole idea.
  float escaped = smoothstep(horizon * 0.9, horizon * 1.12, radius);

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
uniform vec3 uGround;

varying vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  float radius = length((vUv - 0.5) * 2.0);
  if (radius > 1.0) discard;
  // Soft shoulder so the silhouette never shows the quad it is drawn on.
  float solid = smoothstep(1.0, 0.72, radius);
  float alpha = solid * uOpacity * (0.35 + uSwallow * 0.65);
  if (alpha < 0.004) discard;
  fragColor = vec4(uGround * 0.15, clamp(alpha, 0.0, 1.0));
}
`

export const FinaleGate = () => {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const portal = useRef<THREE.Mesh>(null)
  const horizon = useRef<THREE.Mesh>(null)
  const spin = useRef(0)

  const geometries = useMemo(
    () => ({
      column: gateColumn(),
      lintel: gateLintel(),
      ring: gateRing(),
      portal: new THREE.PlaneGeometry(RING_RADIUS * 1.7, RING_RADIUS * 1.7),
      horizon: new THREE.PlaneGeometry(RING_RADIUS * 1.7, RING_RADIUS * 1.7),
    }),
    [],
  )

  const material = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.7,
        jitter: 0.14,
        opacity: 0.8,
        depthSpan: 0.05,
      }),
    [],
  )

  // The gate is the one machined structure the visitor sees dead-on and at
  // rest, so it is where a mirror reflection earns the most: the same studio
  // the hero shell reflects, held on the gate's columns and stator ring.
  const envMap = useMemo(() => createStudioEquirect(512, 256), [])
  useEffect(() => {
    material.setEnv(envMap)
  }, [material, envMap])

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
          uInner: { value: sceneColors.ink.clone() },
          uOuter: { value: sceneColors.accent.clone() },
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
          uGround: { value: sceneColors.base.clone() },
        },
      }),
    [],
  )

  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      material.dispose()
      portalMaterial.dispose()
      horizonMaterial.dispose()
      envMap.dispose()
    },
    [geometries, material, portalMaterial, horizonMaterial, envMap],
  )

  useFrame((state) => {
    const build = sceneState.build
    const power = livePowerFor(build)
    const swallow = swallowShape(sceneState.swallow)
    const enter = clamp01((build - 0.7) / 0.24)
    // Assembled by the corridor, then held fully assembled for the whole ending:
    // the gate cannot still be arriving while it is taking the room in.
    const ease = Math.max(softAssemble(enter), swallow.amount)
    /*
     * The gate is the *consequence* of the handshake, not a second control.
     *
     * The terminals the visitor actually touches are on the contact plate at
     * reading distance; this stands eleven metres down the corridor, where a
     * clickable target would be a few pixels across. Scroll assembles the
     * structure, and the circuit closing is what powers it — so the last beat of
     * the room is something the visitor did, seen at the scale of the building.
     */
    const handshake = reactorControl.uplink
    const time = state.clock.elapsedTime

    material.setShape({
      spread: THREE.MathUtils.lerp(0.7, 0.05, ease),
      jitter: THREE.MathUtils.lerp(0.14, 0.02, ease),
      drift: THREE.MathUtils.lerp(1, 0.04, ease),
    })
    material.sync({
      build,
      live: Math.max(power, handshake, swallow.amount),
      focus: ease * 0.45 + handshake * 0.5 + swallow.pull * 0.5,
      time,
      velocity: sceneState.velocity,
      assembleAt: ease * 0.88,
    })
    /*
     * The columns are the last thing to go.
     *
     * Everything else the room is made of is inside `SwallowField` and is drawn
     * in bodily; the gate is the mouth, so it stays until the very end and then
     * fades rather than travelling. `beyond` is the final stretch of the swallow,
     * after the corridor has already gone.
     */
    material.uniforms.uOpacity.value =
      ease *
      (0.5 + power * 0.35 + handshake * 0.3 + swallow.pull * 0.25) *
      (1 - swallow.beyond * 0.92)

    /*
     * The stator turns, and turns harder as the field takes hold.
     *
     * The rotation used to accumulate `delta` into a ref, which meant the one part
     * of the finale with any visible motion could not be scrubbed: scrolling back
     * up ran the room backwards while the ring kept turning the same way, and the
     * position it held depended on how long the page had been open. It is a pure
     * function of scroll now, with only the idle drift left on the clock — so
     * reversing the wheel reverses the mechanism, which is the entire point of
     * this ending.
     */
    spin.current = time * 0.12 + swallow.amount * Math.PI * 5.5
    if (ring.current) {
      ring.current.rotation.z = spin.current + power * 0.6 + handshake * 1.4
    }

    portalMaterial.uniforms.uTime.value = time
    portalMaterial.uniforms.uPower.value = Math.max(power, swallow.pull)
    portalMaterial.uniforms.uHandshake.value = handshake
    portalMaterial.uniforms.uSwallow.value = swallow.amount
    portalMaterial.uniforms.uOpacity.value = Math.max(
      THREE.MathUtils.smoothstep(ease, 0.45, 0.95) * (0.35 + power * 0.65),
      swallow.amount,
    )
    portalMaterial.uniforms.uInner.value
      .copy(sceneColors.signal)
      .lerp(sceneColors.ink, 0.3 + handshake * 0.25)
    portalMaterial.uniforms.uOuter.value
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, 0.35)

    horizonMaterial.uniforms.uSwallow.value = swallow.amount
    horizonMaterial.uniforms.uGround.value.copy(sceneColors.base)
    horizonMaterial.uniforms.uOpacity.value =
      THREE.MathUtils.smoothstep(ease, 0.5, 0.95) * (0.25 + swallow.pull * 0.75)

    /*
     * Only the aperture moves.
     *
     * The whole gate used to be scaled by the swallow — `root.scale` took
     * `1 + pull * 1.35 + beyond * 2.2` — so scrolling through the finale visibly
     * inflated the columns, the lintel and the brackets along with the field. A
     * building does not grow when you fall into the doorway. The structure now
     * holds a fixed scale and every bit of the ending's motion belongs to the two
     * things that should have it: the stator turning, and the well opening.
     *
     * The plane still has to grow, and by more than the group ever did, because
     * "the portal swallows everything" ends with the aperture being the entire
     * frame. Both discs scale together so the horizon stays exactly concentric
     * with the photon ring drawn around it.
     */
    const mouth = 1 + swallow.pull * 1.6 + swallow.beyond * 3.4
    if (portal.current) portal.current.scale.setScalar(mouth)
    if (horizon.current) horizon.current.scale.setScalar(mouth)

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
      position={[PORTAL_POSITION[0], 0, PORTAL_POSITION[2] + 2.4]}
      visible={false}
    >
      <mesh
        geometry={geometries.column}
        material={material}
        position={[-COLUMN_X, 0, 0]}
        frustumCulled={false}
      />
      <mesh
        geometry={geometries.column}
        material={material}
        position={[COLUMN_X, 0, 0]}
        frustumCulled={false}
      />
      <mesh
        geometry={geometries.lintel}
        material={material}
        position={[0, COLUMN_HEIGHT - 0.05, 0]}
        frustumCulled={false}
      />
      <mesh
        ref={ring}
        geometry={geometries.ring}
        material={material}
        position={[0, RING_Y, 0.1]}
        frustumCulled={false}
      />
      {/* Drawn first: the darkness the accretion ring is a ring *around*. */}
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
