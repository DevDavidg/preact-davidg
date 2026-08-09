import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCopy } from '../../lib/locale'
import { sceneState, useSceneStore } from '../sceneState'
import type { BuiltConsole } from './types'

/**
 * Phase + charge as a thin plate on the active console frame — not a HUD.
 */

interface TelemetryStripProps {
  consoles: BuiltConsole[]
}

export const TelemetryStrip = ({ consoles }: TelemetryStripProps) => {
  const { copy } = useCopy()
  const phase = useSceneStore((state) => state.phase)
  const mesh = useRef<THREE.Mesh>(null)
  const lastLabel = useRef('')

  const { texture, material, canvas, context } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 48
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
    const label = `${phaseLabel}  ·  ${percent}%`
    if (label !== lastLabel.current) {
      lastLabel.current = label
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.font = '500 26px "IBM Plex Mono", ui-monospace, monospace'
      context.fillStyle = 'rgba(236, 232, 224, 0.78)'
      context.textBaseline = 'middle'
      context.fillText(label, 8, canvas.height / 2)
      texture.needsUpdate = true
    }

    const local = new THREE.Vector3(0, active.spec.height / 2 + 0.16, 0.05)
    local.applyQuaternion(active.quaternion)
    node.position.copy(active.position).add(local)
    node.quaternion.copy(active.quaternion)
    node.scale.set(active.spec.width * 0.42, 0.1, 1)

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
