import { useEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  clearHot,
  completeUplink,
  markHot,
  play,
  reactorControl,
} from '../control/reactorControl'
import { sceneColors } from '../sceneColors'
import { clamp01, sceneState } from '../sceneState'
import { softAssemble } from '../ui/assembleDrama'

/**
 * The handshake.
 *
 * Ignition used to be a value that reached 1 while the visitor scrolled — the
 * finale happened *to* them. Scroll still arms it, but the last twenty per cent
 * is a gesture: two terminals either side of the contact plate, and a circuit
 * that only closes while a hand is holding one of them.
 *
 * It is deliberately a hold rather than a click. A click is a button; a hold is
 * a circuit being completed, and it is the one moment in the room where the
 * machine waits for the person instead of the other way round.
 *
 * Nothing is sent. Closing the circuit lights the address — the visitor still
 * chooses to use it. A page that opened a mail client off a hover-and-hold
 * would be a trap, however good the animation.
 */

/** Seconds of contact to close the circuit. */
const HOLD_SECONDS = 1.15
/** The gate only arms once the contact beat is genuinely being read. */
const ARM_AT = 0.55

interface UplinkGateProps {
  width: number
  height: number
  enter: number
  span: number
  exit: number
  exitSpan: number
}

const arcVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const arcFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uCharge;
uniform float uTime;
uniform float uOpacity;

varying vec2 vUv;

layout(location = 0) out vec4 fragColor;

void main() {
  // The arc grows from the held terminal toward the far one, so the circuit is
  // visibly travelling rather than simply fading up.
  float reach = step(vUv.x, uCharge);

  // A filament, not a bar: brightest on the centreline, and displaced by a few
  // stacked sines so it wanders the way a discharge does.
  float wander =
    sin(vUv.x * 24.0 + uTime * 22.0) * 0.16 +
    sin(vUv.x * 9.0 - uTime * 13.0) * 0.1;
  float distance = abs((vUv.y - 0.5) * 2.0 - wander * uCharge);
  float core = exp(-distance * distance * 26.0);
  float halo = exp(-distance * distance * 4.0) * 0.35;

  float head = exp(-pow((vUv.x - uCharge) * 22.0, 2.0)) * 1.6;

  float alpha = (core + halo + head) * reach * uOpacity * uCharge;
  if (alpha < 0.004) discard;
  fragColor = vec4(uColor * (0.7 + core * 1.4 + head), clamp(alpha, 0.0, 1.0));
}
`

export const UplinkGate = ({
  width,
  height,
  enter,
  span,
  exit,
  exitSpan,
}: UplinkGateProps) => {
  const group = useRef<THREE.Group>(null)
  const left = useRef<THREE.Mesh>(null)
  const right = useRef<THREE.Mesh>(null)
  const held = useRef(false)
  const charge = useRef(0)
  const invalidate = useThree((state) => state.invalidate)

  const reach = width / 2 + 0.3
  const railY = -height / 2 + 0.62

  const arcMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: arcVertexShader,
        fragmentShader: arcFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: sceneColors.accent.clone() },
          uCharge: { value: 0 },
          uTime: { value: 0 },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  const terminalMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: sceneColors.signal.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  const capGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.11, 1), [])
  const postGeometry = useMemo(
    () => new THREE.BoxGeometry(0.07, 0.4, 0.07),
    [],
  )
  const arcGeometry = useMemo(
    () => new THREE.PlaneGeometry(reach * 2, 0.46),
    [reach],
  )

  useEffect(
    () => () => {
      arcMaterial.dispose()
      terminalMaterial.dispose()
      capGeometry.dispose()
      postGeometry.dispose()
      arcGeometry.dispose()
    },
    [arcMaterial, terminalMaterial, capGeometry, postGeometry, arcGeometry],
  )

  /* A hold that survives the pointer leaving the terminal it started on. */
  useEffect(() => {
    const release = () => {
      if (!held.current) return
      held.current = false
      document.body.style.cursor = ''
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
      release()
    }
  }, [])

  useFrame((state, delta) => {
    const build = sceneState.build
    const progress = clamp01((build - enter) / Math.max(span, 0.001))
    const leaving = clamp01((build - exit) / Math.max(exitSpan, 0.001))
    const presence = softAssemble(progress) * (1 - leaving)

    const node = group.current
    if (node) node.visible = presence > 0.02
    if (presence <= 0.02) {
      held.current = false
      // A half-finished handshake does not stay half-finished forever: scrolling
      // away from the terminals lets the charge bleed off, so the gate down the
      // corridor is never left partly powered by an attempt nobody completed.
      if (!reactorControl.uplinked && charge.current > 0) {
        charge.current = Math.max(0, charge.current - delta)
        reactorControl.uplink = charge.current
      }
      return
    }

    const armed = progress > ARM_AT
    const done = reactorControl.uplinked

    // Charging is fast, decay is slower — letting go should feel like losing
    // ground, not like the attempt never happened.
    const target = done ? 1 : held.current && armed ? 1 : 0
    const rate = target > charge.current ? 1 / HOLD_SECONDS : 0.75
    charge.current = THREE.MathUtils.clamp(
      charge.current + (target > charge.current ? rate : -rate) * delta,
      0,
      1,
    )
    reactorControl.uplink = charge.current

    if (charge.current >= 1 && !done) completeUplink()

    const pulse = done ? 0.85 + Math.sin(state.clock.elapsedTime * 2.2) * 0.15 : 1

    arcMaterial.uniforms.uCharge.value = charge.current
    arcMaterial.uniforms.uTime.value = state.clock.elapsedTime
    arcMaterial.uniforms.uOpacity.value = presence * pulse
    arcMaterial.uniforms.uColor.value
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, 0.25 + charge.current * 0.75)

    terminalMaterial.color
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, charge.current)
    terminalMaterial.opacity =
      presence * (armed ? 0.55 + charge.current * 0.45 : 0.18)

    const scale = 1 + charge.current * 0.35
    if (left.current) left.current.scale.setScalar(scale)
    if (right.current) right.current.scale.setScalar(scale)

    if (charge.current > 0 && charge.current < 1) invalidate()
  })

  const handleDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    held.current = true
    document.body.style.cursor = 'progress'
    play('tick')
    invalidate()
  }

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    markHot('uplink', { ui: true })
    document.body.style.cursor = 'pointer'
    invalidate()
  }

  const handleOut = () => {
    clearHot('uplink')
    if (!held.current) document.body.style.cursor = ''
    invalidate()
  }

  const terminal = (
    side: -1 | 1,
    ref: React.RefObject<THREE.Mesh | null>,
  ) => (
    <group position={[side * reach, railY, 0.12]}>
      <mesh
        geometry={postGeometry}
        material={terminalMaterial}
        position={[0, -0.26, 0]}
      />
      <mesh ref={ref} geometry={capGeometry} material={terminalMaterial} />
      {/* An invisible collar: the cap is small on purpose, but the target a
          visitor has to find must not be. */}
      <mesh
        visible={false}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onPointerDown={handleDown}
      >
        <sphereGeometry args={[0.3, 12, 8]} />
      </mesh>
    </group>
  )

  return (
    <group ref={group}>
      {terminal(-1, left)}
      {terminal(1, right)}
      <mesh
        geometry={arcGeometry}
        material={arcMaterial}
        position={[0, railY, 0.1]}
        renderOrder={4}
      />
    </group>
  )
}
