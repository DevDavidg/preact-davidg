import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ABOUT_PANEL,
  ABOUT_PORTRAIT,
  ABOUT_PORTRAIT_URL,
  cinemaPortraitVoxelGrid,
} from './layout'
import { PortraitVoxelMaterial } from './PortraitVoxelMaterial'
import {
  buildPortraitVoxels,
  type PortraitVoxelField,
} from './portraitVoxels'
import {
  buildFor,
  liveFor,
  sceneState,
  useSceneStore,
  type Tier,
} from './sceneState'
import { clamp01 } from './ui/fragmentSettle'
import type { SectionWindows } from './ui/sectionRanges'

/**
 * About headshot as coloured voxel shards. Cinema only — `#about` is a scroll
 * spacer; this mesh is the only portrait when live. Assembly starts before the
 * section centres so the face is readable by About mid-scroll.
 */

/** Vertical focus in the source (0 top → 1 bottom). */
const FACE_FOCUS_Y = 0.22

/** Extrusion — three layers read as a head, not a flat stamp. */
const LAYERS = 3

/** Build units past assemble end before voxels dissolve for Contact. */
const RETIRE_HOLD = 0.05
const RETIRE_SPAN = 0.12

/** DOM face fallback hand-off — hysteresis avoids flicker on scroll-back. */
const PLATE_ON = 0.62
const PLATE_OFF = 0.4

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

const usePortraitVoxels = (enabled: boolean) => {
  const [field, setField] = useState<PortraitVoxelField | null>(null)
  const setAboutVoxels = useSceneStore((state) => state.setAboutVoxels)

  useEffect(() => {
    if (!enabled) {
      setField(null)
      setAboutVoxels('pending')
      return
    }

    let cancelled = false
    setAboutVoxels('pending')
    const image = new Image()
    image.decoding = 'async'

    const handleLoad = () => {
      if (cancelled) return
      const [cols, rows] = cinemaPortraitVoxelGrid()
      const next = buildPortraitVoxels(image, {
        width: ABOUT_PANEL.width,
        height: ABOUT_PANEL.height,
        cols,
        rows,
        layers: LAYERS,
        focusY: FACE_FOCUS_Y,
        bgLuma: 0.56,
      })
      if (next.count > 0) {
        // Stay `pending` until useFrame sees a legible mesh — field-ready alone
        // must not void the DOM face into an empty About lane.
        setField(next)
        return
      }
      setField(null)
      setAboutVoxels('dead')
    }

    image.addEventListener('load', handleLoad)
    image.addEventListener('error', () => {
      if (cancelled) return
      setField(null)
      setAboutVoxels('dead')
    })
    image.src = ABOUT_PORTRAIT_URL

    return () => {
      cancelled = true
      image.removeEventListener('load', handleLoad)
      setField(null)
      setAboutVoxels('pending')
    }
  }, [enabled, setAboutVoxels])

  return field
}

interface AboutPortraitProps {
  tier: Tier
  windows: SectionWindows
}

export const AboutPortrait = ({ tier, windows }: AboutPortraitProps) => {
  if (tier !== 'cinema') return null
  return <CinemaAboutPortrait windows={windows} />
}

const CinemaAboutPortrait = ({ windows }: { windows: SectionWindows }) => {
  const field = usePortraitVoxels(true)
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

    const build = buildFor('cinema')
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

    // Geometry + opacity are set before the face fallback leaves. Restoring on
    // scroll-back keeps a readable portrait while voxels dissolve.
    const { aboutVoxels, setAboutVoxels } = useSceneStore.getState()
    const shouldHandOff =
      opacityRef.current >= PLATE_ON &&
      progress >= PLATE_ON &&
      presence > 0.5
    const shouldRestore =
      opacityRef.current < PLATE_OFF || presence <= 0.35
    if (aboutVoxels === 'pending' && shouldHandOff) {
      setAboutVoxels('live')
    } else if (aboutVoxels === 'live' && shouldRestore) {
      setAboutVoxels('pending')
    }
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
