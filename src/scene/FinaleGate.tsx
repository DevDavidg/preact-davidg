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

void main() {
  vec2 point = (vUv - 0.5) * 2.0;
  float radius = length(point);
  if (radius > 1.0) discard;

  float angle = atan(point.y, point.x);

  // Held open by the ring: the field falls off before it reaches the collar
  // rather than being cut off by the geometry's edge.
  float aperture = smoothstep(1.0, 0.82, radius);

  // Rings travelling inward. This is the whole difference between a field and
  // a blob — a gradient has no direction, and direction is what says the thing
  // is doing work.
  float travel = sin((radius * 13.0 - uTime * 1.15) * 3.14159265) * 0.5 + 0.5;
  travel = pow(travel, 3.0);

  /*
   * The accretion swirl, and why it is here.
   *
   * Concentric rings alone say "a field is being held open". They do not say
   * "this is taking something in", because inward travel with no rotation reads
   * as a pulse. Winding the angle with the radius gives the field a direction of
   * spin, and tying that spin to the swallow means the mouth visibly starts
   * turning at the moment the room begins to go into it.
   */
  float swirlPhase = angle * 3.0 - uTime * (0.35 + uSwallow * 2.6) + radius * 7.5;
  float swirl = pow(sin(swirlPhase) * 0.5 + 0.5, 2.4);
  swirl *= smoothstep(0.05, 0.55, radius) * (0.25 + uSwallow * 1.15);

  /*
   * The horizon.
   *
   * A ring that tightens as the swallow deepens, so the aperture reads as having
   * an edge that things fall past rather than as an evenly bright disc. It closes
   * toward the centre, which is what gives the last stretch of the ending its
   * "the room went in there" beat.
   */
  float horizonAt = mix(0.72, 0.16, uSwallow);
  float horizon =
    exp(-pow((radius - horizonAt) * mix(9.0, 26.0, uSwallow), 2.0)) *
    (0.18 + uSwallow * 1.35);

  float core = exp(-radius * radius * mix(3.4, 1.1, uSwallow));
  float body =
    core * (0.22 + uPower * 0.42 + uSwallow * 0.75) +
    travel * (0.1 + uPower * 0.2) +
    swirl * 0.5 +
    horizon +
    uHandshake * (core * 0.45 + travel * 0.3);

  vec3 tint = mix(uOuter, uInner, clamp(core * 1.1 + uHandshake * 0.3, 0.0, 1.0));
  // The mouth runs hotter as it feeds: the centre pushes toward the inner tone
  // while the rim keeps the accent, which separates near from far in the field.
  tint = mix(tint, uInner, uSwallow * 0.45 * (1.0 - radius));
  vec3 colour = tint * (0.5 + body * 0.9);

  /*
   * A knee below clipping.
   *
   * Additive blending over a hot accent drove the middle of the aperture to
   * pure white, and a white disc has no hue, no depth and no material — it
   * reads as a blown highlight rather than as a field. Rolling the top end off
   * keeps the centre the brightest thing in the room while it stays champagne.
   */
  colour = colour / (1.0 + max(colour - 0.72, 0.0) * 1.9);

  float alpha = body * aperture * uOpacity;
  if (alpha < 0.004) discard;
  fragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
}
`

export const FinaleGate = () => {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const spin = useRef(0)

  const geometries = useMemo(
    () => ({
      column: gateColumn(),
      lintel: gateLintel(),
      ring: gateRing(),
      portal: new THREE.PlaneGeometry(RING_RADIUS * 1.7, RING_RADIUS * 1.7),
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

  useEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      material.dispose()
      portalMaterial.dispose()
      envMap.dispose()
    },
    [geometries, material, portalMaterial, envMap],
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
      ring.current.rotation.z =
        spin.current + power * 0.6 + handshake * 1.4
    }

    portalMaterial.uniforms.uTime.value = time
    portalMaterial.uniforms.uPower.value = Math.max(power, swallow.pull)
    portalMaterial.uniforms.uHandshake.value = handshake
    portalMaterial.uniforms.uSwallow.value = swallow.amount
    // The field only exists once there is a ring to hold it.
    portalMaterial.uniforms.uOpacity.value =
      Math.max(
        THREE.MathUtils.smoothstep(ease, 0.45, 0.95) * (0.35 + power * 0.65),
        swallow.amount,
      )
    portalMaterial.uniforms.uInner.value
      .copy(sceneColors.signal)
      .lerp(sceneColors.ink, 0.3 + handshake * 0.25)
    portalMaterial.uniforms.uOuter.value
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, 0.35)

    const root = group.current
    if (root) {
      root.visible = ease > 0.02
      /*
       * The mouth opens toward the lens as the swallow deepens. Scaling the whole
       * gate rather than only the aperture is what makes it read as the visitor
       * being drawn *into* it: the structure grows past the frame, which is what a
       * doorway does when you fall through it.
       */
      root.scale.setScalar(
        (0.9 + ease * 0.12 + power * 0.05 + handshake * 0.06) *
          (1 + swallow.pull * 1.35 + swallow.beyond * 2.2),
      )
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
      <mesh
        geometry={geometries.portal}
        material={portalMaterial}
        position={[0, RING_Y, 0]}
        renderOrder={2}
        frustumCulled={false}
      />
    </group>
  )
}
