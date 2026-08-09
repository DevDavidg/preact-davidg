import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import {
  ABOUT_PANEL,
  ABOUT_PORTRAIT,
  ABOUT_PORTRAIT_URL,
  portraitVoxelGrid,
} from './layout'
import { PortraitVoxelMaterial } from './PortraitVoxelMaterial'
import {
  buildPortraitVoxels,
  type PortraitVoxelField,
} from './portraitVoxels'
import { clamp01, liveFor, sceneState } from './sceneState'
import type { SectionWindows } from './ui/sectionRanges'

/**
 * The headshot as coloured voxel shards, cinema only.
 *
 * The document keeps its own `<img>` and simply fades it once this mesh is
 * legible, so a failed decode, a lower quality or a lost context all leave a real
 * photograph on screen rather than an empty column.
 */

/** Vertical focus in the source (0 top → 1 bottom). */
const FACE_FOCUS_Y = 0.22

/** Extrusion — three layers read as a head, not a flat stamp. */
const LAYERS = 3

/** Charge units past assembly before the voxels dissolve for the last chapter. */
const RETIRE_HOLD = 0.05
const RETIRE_SPAN = 0.12

/**
 * Carve an early assemble window: begin while Process is still leaving so
 * voxels are mid-flight as About enters, and lock by About centre.
 */
const portraitAssembleWindow = (windows: SectionWindows) => {
  const about = windows.about
  if (!about) return { enter: 0.58, span: 0.16 }

  const process = windows.process
  // Start as Process exits / About leads in — earlier than section-local 0.1.
  const lead = process
    ? THREE.MathUtils.lerp(process.exit, about.enter, 0.35)
    : Math.max(0, about.enter - 0.05)
  const enter = Math.min(lead, about.enter)
  const end = about.centre
  return {
    enter,
    span: Math.max(end - enter, 0.08),
  }
}

const ATTRIBUTES = [
  ['aChaos', 3, 'chaos'],
  ['aHome', 3, 'home'],
  ['aColor', 3, 'color'],
  ['aAxis', 3, 'axis'],
  ['aSeed', 1, 'seed'],
  ['aSize', 1, 'size'],
] as const

const fieldGeometry = (field: PortraitVoxelField) => {
  const geometry = new THREE.InstancedBufferGeometry()
  const box = new THREE.BoxGeometry(1, 1, 1)
  geometry.setAttribute('position', box.getAttribute('position'))
  geometry.setAttribute('normal', box.getAttribute('normal'))
  geometry.setIndex(box.getIndex())
  box.dispose()

  for (const [name, itemSize, key] of ATTRIBUTES) {
    const source = field[key]
    geometry.setAttribute(
      name,
      new THREE.InstancedBufferAttribute(
        source.subarray(0, field.count * itemSize),
        itemSize,
      ),
    )
  }

  geometry.instanceCount = field.count
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)
  return geometry
}

/**
 * The portrait is only decoded once the reader is approaching About. Voxelising it
 * on mount cost a 140 kB fetch plus a synchronous pixel pass long before the
 * section was anywhere near the viewport.
 */
const usePortraitVoxels = (windows: SectionWindows) => {
  const [field, setField] = useState<PortraitVoxelField | null>(null)
  const [near, setNear] = useState(false)

  useFrame(() => {
    if (near) return
    const about = windows.about
    if (!about) return
    if (sceneState.build >= Math.max(about.enter - 0.12, 0)) setNear(true)
  })

  useEffect(() => {
    if (!near) return

    let cancelled = false
    const image = new Image()
    image.decoding = 'async'

    const handleLoad = () => {
      if (cancelled) return
      const [cols, rows] = portraitVoxelGrid()
      const next = buildPortraitVoxels(image, {
        width: ABOUT_PANEL.width,
        height: ABOUT_PANEL.height,
        cols,
        rows,
        layers: LAYERS,
        focusY: FACE_FOCUS_Y,
        bgLuma: 0.56,
      })
      setField(next.count > 0 ? next : null)
    }

    image.addEventListener('load', handleLoad)
    // A failed decode is not an error state: the document's own photograph is
    // already on screen and simply stays there.
    image.addEventListener('error', () => setField(null))
    image.src = ABOUT_PORTRAIT_URL

    return () => {
      cancelled = true
      image.removeEventListener('load', handleLoad)
      setField(null)
    }
  }, [near])

  return field
}

interface AboutPortraitProps {
  quality: Quality
  windows: SectionWindows
}

export const AboutPortrait = ({ quality, windows }: AboutPortraitProps) => {
  if (quality !== 'cinema') return null
  return <CinemaAboutPortrait windows={windows} />
}

const CinemaAboutPortrait = ({ windows }: { windows: SectionWindows }) => {
  const field = usePortraitVoxels(windows)
  const opacityRef = useRef(0)

  const material = useMemo(() => new PortraitVoxelMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  const geometry = useMemo(
    () => (field ? fieldGeometry(field) : null),
    [field],
  )
  useEffect(
    () => () => {
      geometry?.dispose()
    },
    [geometry],
  )

  const assembly = useMemo(
    () => portraitAssembleWindow(windows),
    [windows],
  )

  useFrame((state, delta) => {
    if (!field || !geometry) return

    const build = sceneState.build
    const progress = clamp01((build - assembly.enter) / assembly.span)
    const assembleEnd = assembly.enter + assembly.span
    const retire = clamp01((build - (assembleEnd + RETIRE_HOLD)) / RETIRE_SPAN)
    const presence = 1 - retire
    const enterFade = THREE.MathUtils.smoothstep(progress, 0.02, 0.22)

    const targetOpacity = presence > 0.15 ? enterFade * presence : 0
    opacityRef.current = THREE.MathUtils.damp(
      opacityRef.current,
      targetOpacity,
      6.5,
      delta,
    )

    material.sync({
      build,
      live: liveFor(build),
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      opacity: opacityRef.current,
      enter: assembly.enter,
      span: assembly.span,
      exit: assembleEnd + RETIRE_HOLD,
      exitSpan: RETIRE_SPAN,
    })
  })

  const { position, pitch, yaw, scale } = ABOUT_PORTRAIT

  if (!geometry || !field?.count) return null

  return (
    <group position={position} rotation={[pitch, yaw, 0]} scale={scale}>
      <mesh
        geometry={geometry}
        material={material}
        frustumCulled={false}
        renderOrder={1}
      />
    </group>
  )
}
