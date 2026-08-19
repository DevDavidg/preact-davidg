import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCopy } from '../../lib/locale'
import { reactorControl } from '../control/reactorControl'
import { sceneState, useSceneStore } from '../sceneState'
import type { BuiltConsole } from './types'

/**
 * The readout, mounted on whichever console is being read — not a HUD.
 *
 * Two lines. The top one is the machine's own state: chapter, charge, and the
 * law if it is not the default. The bottom one is the last thing the *operator*
 * did — a sector vented, a module seated, a mode engaged, the handshake closed.
 *
 * That second line is what makes the room answer back. Every operation in the
 * scene writes to `reactorControl.log` from wherever it happens, and this is the
 * one place it surfaces, so a visitor who fires a facet or turns the law sees
 * the machine acknowledge it in the machine's own vocabulary.
 */

interface TelemetryStripProps {
  consoles: BuiltConsole[]
  /**
   * The multiplier the plates were actually rendered at.
   *
   * The strip is parked a fixed distance above its console's top edge, and it was
   * computing that edge from the *spec* height — the authored number, before the
   * viewport scaled it. Once portrait plates grew taller than their spec, the
   * strip was no longer above the plate at all: it landed inside it, printing the
   * charge readout straight through the project title.
   */
  heightFit: number
  widthFit: number
}

/** Two rows of monospace at a comfortable texel density. */
const STRIP_WIDTH = 512
const STRIP_HEIGHT = 96

export const TelemetryStrip = ({
  consoles,
  heightFit,
  widthFit,
}: TelemetryStripProps) => {
  const { copy } = useCopy()
  const phase = useSceneStore((state) => state.phase)
  const mesh = useRef<THREE.Mesh>(null)
  const lastLabel = useRef('')

  const { texture, material, canvas, context } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = STRIP_WIDTH
    canvas.height = STRIP_HEIGHT
    const context = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    })
    return { texture, material, canvas, context }
  }, [])

  useEffect(
    () => () => {
      texture.dispose()
      material.dispose()
    },
    [texture, material],
  )

  useFrame(() => {
    const build = sceneState.build
    const active = consoles.find(
      (entry) =>
        build >= entry.enter + entry.span * 0.5 &&
        build < entry.exit + entry.exitSpan * 0.25,
    )
    const node = mesh.current
    if (!active || !node) {
      material.opacity = 0
      if (node) node.visible = false
      return
    }

    const phaseLabel = (copy.hud.phases[phase] ?? phase).toUpperCase()
    const percent = String(Math.round(build * 100)).padStart(3, '0')
    const law =
      reactorControl.law === 'VISCOUS' ? '' : `  ·  ${reactorControl.law}`
    const entry = reactorControl.log[0]
    const label = `${phaseLabel}  ·  ${percent}%${law}\n${entry?.id ?? 0}${
      entry?.text ?? ''
    }`

    if (label !== lastLabel.current) {
      lastLabel.current = label
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.textBaseline = 'middle'

      context.font = '500 26px "IBM Plex Mono", ui-monospace, monospace'
      context.fillStyle = 'rgba(236, 232, 224, 0.78)'
      context.fillText(`${phaseLabel}  ·  ${percent}%${law}`, 8, 26)

      if (entry) {
        context.font = '500 22px "IBM Plex Mono", ui-monospace, monospace'
        // Operator lines arrive in the accent; routine ones stay quiet, so the
        // strip never reads as a log of equally loud events.
        context.fillStyle = entry.weight
          ? 'rgba(255, 180, 84, 0.92)'
          : 'rgba(154, 148, 140, 0.8)'
        context.fillText(`› ${entry.text}`, 8, 68)
      }
      texture.needsUpdate = true
    }

    const local = new THREE.Vector3(
      0,
      (active.spec.height * heightFit) / 2 + 0.22,
      0.05,
    )
    local.applyQuaternion(active.quaternion)
    node.position.copy(active.position).add(local)
    node.quaternion.copy(active.quaternion)
    const stripWidth = active.spec.width * widthFit * 0.48
    node.scale.set(
      stripWidth,
      (stripWidth / STRIP_WIDTH) * STRIP_HEIGHT,
      1,
    )

    const presence =
      THREE.MathUtils.smoothstep(
        build,
        active.enter + active.span * 0.45,
        active.enter + active.span,
      ) *
      (1 -
        THREE.MathUtils.smoothstep(
          build,
          active.exit,
          active.exit + active.exitSpan,
        ))
    material.opacity = presence * 0.72
    node.visible = presence > 0.08
  })

  return (
    <mesh ref={mesh} material={material} renderOrder={3}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
