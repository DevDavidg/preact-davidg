import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { reactorControl } from './control/reactorControl'
import { ARTIFACTS, CONDUIT_Y, REACTOR_CORE } from './layout'
import { sceneColors } from './sceneColors'
import { clamp01, livePowerFor, sceneState } from './sceneState'

/**
 * The wiring between the core and the modules.
 *
 * This is what makes the reactor read as a system rather than as decorated
 * corridor: each conduit carries a pulse of light from the core to one module, and
 * a module only reaches full presence once its conduit has energised. It is the
 * cheapest possible way to show causality — one thin strip per module, drawn as
 * additive lines with no lighting and no geometry beyond a quad.
 *
 * The `energise` value per conduit comes from the same window the module panel
 * uses, so the light always arrives just before the project it belongs to.
 */

const vertexShader = /* glsl */ `
attribute float aRun;
attribute float aConduit;

varying float vRun;
varying float vConduit;

void main() {
  vRun = aRun;
  vConduit = aConduit;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uPower;
uniform vec3 uSignal;
uniform vec3 uAccent;
/** Per-conduit energise amount, indexed by aConduit. */
uniform float uEnergy[3];
uniform float uFocus[3];

varying float vRun;
varying float vConduit;

layout(location = 0) out vec4 fragColor;

void main() {
  int index = int(vConduit + 0.5);
  float energy = uEnergy[index];
  float focus = uFocus[index];
  if (energy <= 0.001) discard;

  // The conduit fills from the core outward, so the light visibly travels.
  float filled = smoothstep(vRun - 0.06, vRun, energy);

  // A pulse rides along whatever is already filled.
  float head = fract(uTime * 0.35 - vRun * 1.4);
  float pulse = exp(-pow(head * 6.0, 2.0)) * filled;

  vec3 color = mix(uSignal, uAccent, clamp(uPower + focus * 0.5, 0.0, 1.0));
  float alpha = filled * (0.14 + focus * 0.3) + pulse * (0.35 + focus * 0.4);
  alpha *= 0.55 + uPower * 0.45;

  if (alpha < 0.004) discard;
  fragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`

/**
 * One thin ribbon per module, running along the floor from the core to a point
 * beneath the panel. Built as a single merged geometry so the whole harness is one
 * draw call.
 */
const buildConduits = (): THREE.BufferGeometry => {
  const positions: number[] = []
  const runs: number[] = []
  const ids: number[] = []
  const WIDTH = 0.045

  ARTIFACTS.forEach((placement, index) => {
    const from = new THREE.Vector3(REACTOR_CORE[0], CONDUIT_Y, REACTOR_CORE[2])
    const to = new THREE.Vector3(
      placement.position[0] * 0.82,
      CONDUIT_Y,
      placement.position[2],
    )

    // A slight lateral bow so three straight lines do not read as a diagram.
    const mid = from
      .clone()
      .lerp(to, 0.5)
      .add(new THREE.Vector3(index % 2 === 0 ? -0.5 : 0.5, 0.06, 0))
    const curve = new THREE.CatmullRomCurve3([from, mid, to])

    const SEGMENTS = 24
    for (let step = 0; step < SEGMENTS; step++) {
      const t0 = step / SEGMENTS
      const t1 = (step + 1) / SEGMENTS
      const p0 = curve.getPointAt(t0)
      const p1 = curve.getPointAt(t1)

      // Ribbon lies flat on the floor, so the offset is perpendicular in XZ.
      const direction = p1.clone().sub(p0).normalize()
      const side = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(
        WIDTH,
      )

      const a = p0.clone().add(side)
      const b = p0.clone().sub(side)
      const c = p1.clone().add(side)
      const d = p1.clone().sub(side)

      for (const [vertex, run] of [
        [a, t0],
        [b, t0],
        [c, t1],
        [b, t0],
        [d, t1],
        [c, t1],
      ] as const) {
        positions.push(vertex.x, vertex.y, vertex.z)
        runs.push(run)
        ids.push(index)
      }
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('aRun', new THREE.Float32BufferAttribute(runs, 1))
  geometry.setAttribute('aConduit', new THREE.Float32BufferAttribute(ids, 1))
  return geometry
}

interface SignalConduitsProps {
  quality: Quality
}

/**
 * The timing comes from the placed consoles rather than from measured DOM
 * sections. Placement resequences every beat into an exclusive reading slice, so
 * a conduit lit from the raw section window would energise for a module the
 * visitor is not being shown — light arriving for the wrong project is worse
 * than no light at all.
 */
export const SignalConduits = ({ quality }: SignalConduitsProps) => {
  const geometry = useMemo(buildConduits, [])
  const mesh = useRef<THREE.Mesh>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPower: { value: 0 },
          uSignal: { value: sceneColors.signal.clone() },
          uAccent: { value: sceneColors.accent.clone() },
          uEnergy: { value: [0, 0, 0] },
          uFocus: { value: [0, 0, 0] },
        },
      }),
    [],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state) => {
    const build = sceneState.build
    const { uniforms } = material
    uniforms.uTime.value = state.clock.elapsedTime
    // The harness carries the sound as well as the charge: with audio on, the
    // conduits are the room's own level meter, so the visitor can see what they
    // are hearing travel down the corridor.
    uniforms.uPower.value = Math.min(
      1,
      livePowerFor(build) + reactorControl.audio * 0.5,
    )
    uniforms.uSignal.value.copy(sceneColors.signal)
    uniforms.uAccent.value.copy(sceneColors.accent)

    const energy = uniforms.uEnergy.value as number[]
    const focus = uniforms.uFocus.value as number[]

    const beats = reactorControl.moduleBeats

    for (let index = 0; index < ARTIFACTS.length; index++) {
      const beat = beats[index]
      if (!beat) {
        energy[index] = 0
        focus[index] = 0
        continue
      }

      // Light leads the module: the conduit charges over the run-up to the beat
      // and is already lit by the time the bay's shards land, so the visitor sees
      // the cause before the effect.
      const lead = clamp01(
        (build - (beat.enter - beat.span * 0.9)) /
          Math.max(beat.span * 1.4, 0.02),
      )
      // Fades once the beat is over, otherwise three lit lines trail the visitor
      // into the next chapter and the room never settles.
      const retire = clamp01((build - beat.exit) / Math.max(beat.exitSpan, 0.02))
      energy[index] = lead * (1 - retire)
      focus[index] = sceneState.focus === index ? energy[index] : 0
    }

    /*
     * A dark harness is not drawn at all.
     *
     * The fragment shader already discards an unenergised conduit, but a discard
     * happens *after* the fragment has been shaded — so three floor-length
     * ribbons were still being rasterised across the opening shot, where no
     * module exists to light them. On a weak GPU that fill was enough to push
     * the frame budget over and have the governor abandon the scene outright.
     */
    const node = mesh.current
    if (node) {
      node.visible =
        energy[0] > 0.001 || energy[1] > 0.001 || energy[2] > 0.001
    }
  })

  // Lite renders the harness but never the pulse-heavy width; keeping it means the
  // causal read survives on a phone, which is the part that carries the story.
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      visible={false}
      renderOrder={quality === 'cinema' ? 1 : 0}
    />
  )
}
