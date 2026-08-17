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
import { livePowerFor, sceneState, clamp01 } from './sceneState'
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
uniform vec3 uInner;
uniform vec3 uOuter;

varying vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  vec2 point = (vUv - 0.5) * 2.0;
  float radius = length(point);
  if (radius > 1.0) discard;

  // Held open by the ring: the field falls off before it reaches the collar
  // rather than being cut off by the geometry's edge.
  float aperture = smoothstep(1.0, 0.82, radius);

  // Rings travelling inward. This is the whole difference between a field and
  // a blob — a gradient has no direction, and direction is what says the thing
  // is doing work.
  float travel = sin((radius * 13.0 - uTime * 1.15) * 3.14159265) * 0.5 + 0.5;
  travel = pow(travel, 3.0);

  float core = exp(-radius * radius * 3.4);
  float body =
    core * (0.22 + uPower * 0.42) +
    travel * (0.1 + uPower * 0.2) +
    uHandshake * (core * 0.45 + travel * 0.3);

  vec3 tint = mix(uOuter, uInner, clamp(core * 1.1 + uHandshake * 0.3, 0.0, 1.0));
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

  useFrame((state, delta) => {
    const build = sceneState.build
    const power = livePowerFor(build)
    const enter = clamp01((build - 0.7) / 0.24)
    const ease = softAssemble(enter)
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
      live: Math.max(power, handshake),
      focus: ease * 0.45 + handshake * 0.5,
      time,
      velocity: sceneState.velocity,
      assembleAt: ease * 0.88,
    })
    material.uniforms.uOpacity.value =
      ease * (0.5 + power * 0.35 + handshake * 0.3)

    // The stator turns, and turns harder as the field takes hold.
    spin.current += delta * (0.12 + power * 0.4 + handshake * 2.2)
    if (ring.current) ring.current.rotation.z = spin.current

    portalMaterial.uniforms.uTime.value = time
    portalMaterial.uniforms.uPower.value = power
    portalMaterial.uniforms.uHandshake.value = handshake
    // The field only exists once there is a ring to hold it.
    portalMaterial.uniforms.uOpacity.value =
      THREE.MathUtils.smoothstep(ease, 0.45, 0.95) * (0.35 + power * 0.65)
    portalMaterial.uniforms.uInner.value
      .copy(sceneColors.signal)
      .lerp(sceneColors.ink, 0.3 + handshake * 0.25)
    portalMaterial.uniforms.uOuter.value
      .copy(sceneColors.accent)
      .lerp(sceneColors.signal, 0.35)

    const root = group.current
    if (root) {
      root.visible = ease > 0.02
      root.scale.setScalar(0.9 + ease * 0.12 + power * 0.05 + handshake * 0.06)
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
