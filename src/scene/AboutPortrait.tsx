import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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
import { beatFor, reactorControl } from './control/reactorControl'
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
  /*
   * The About console's *placed* beat is the authority.
   *
   * Consoles are resequenced into exclusive reading slices at placement time, so
   * the measured DOM window for About is not when About is on screen. Timing the
   * portrait to the measured window left the face assembling during a different
   * console's beat entirely. The measured window stays as the fallback for the
   * first frames, before any console has been placed.
   */
  const beat = beatFor('about')
  if (beat) {
    const enter = Math.max(beat.enter - beat.span * 0.8, 0)
    return {
      enter,
      span: Math.max(beat.span * 1.6, 0.05),
      // Leaves exactly when its console leaves.
      //
      // The portrait is placed relative to the eye now, so a retire window of
      // its own meant the face was still dissolving — five thousand voxels of
      // scatter — directly across the lens during the finale. It belongs to the
      // About beat at both ends or it belongs to neither.
      exit: beat.exit,
      exitSpan: Math.max(beat.exitSpan, 0.02),
    }
  }

  const about = windows.about
  if (!about) return { enter: 0.58, span: 0.16, exit: 0.8, exitSpan: RETIRE_SPAN }

  const process = windows.process
  // Start as Process exits / About leads in — earlier than section-local 0.1.
  const lead = process
    ? THREE.MathUtils.lerp(process.exit, about.enter, 0.35)
    : Math.max(0, about.enter - 0.05)
  const enter = Math.min(lead, about.enter)
  const end = about.centre
  const span = Math.max(end - enter, 0.08)
  return {
    enter,
    span,
    exit: enter + span + RETIRE_HOLD,
    exitSpan: RETIRE_SPAN,
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
    const beat = beatFor('about')
    const start = beat ? beat.enter - beat.span : windows.about?.enter
    if (start === undefined) return
    if (sceneState.build >= Math.max(start - 0.12, 0)) setNear(true)
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

const _inverse = new THREE.Matrix4()
const _probe = new THREE.Vector3()
const _right = new THREE.Vector3()
const _forward = new THREE.Vector3()

/**
 * How far to the side of the About plate the portrait sits, in metres.
 *
 * The plate is placed in the right-hand lane, so the face takes the left one —
 * the same pairing the module bays use, for the same reason: a reading surface
 * and the thing it is about, either side of the lens.
 */
const PORTRAIT_LATERAL = -1.95

const CinemaAboutPortrait = ({ windows }: { windows: SectionWindows }) => {
  const field = usePortraitVoxels(windows)
  const opacityRef = useRef(0)
  const mesh = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const camera = useThree((state) => state.camera)

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

  /*
   * Recomputed per frame rather than memoised: the placed beats are published
   * outside React and never trigger a render, so a memo keyed on the measured
   * windows would hold the fallback timing for the whole session.
   */
  const assemblyRef = useRef(portraitAssembleWindow(windows))

  useFrame((state, delta) => {
    if (!field || !geometry) return

    const assembly = portraitAssembleWindow(windows)
    assemblyRef.current = assembly
    const build = sceneState.build
    const progress = clamp01((build - assembly.enter) / assembly.span)
    const retire = clamp01((build - assembly.exit) / assembly.exitSpan)
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
      exit: assembly.exit,
      exitSpan: assembly.exitSpan,
    })

    /*
     * The portrait travels with its console.
     *
     * It used to be planted at a fixed corridor depth chosen when the About beat
     * was timed to the measured DOM section. Consoles are placed relative to the
     * eye and resequenced into exclusive slices, so that fixed point ended up
     * *behind the camera's own position* at the moment the beat plays — the face
     * filled the lens as a wall of voxels while the plate about it sat eight
     * metres further down the corridor. Anchoring to the published beat puts the
     * two back in the same shot, whatever the copy length does to the timings.
     */
    const root = group.current
    const beat = beatFor('about')
    if (root && beat) {
      camera.getWorldDirection(_forward)
      _right.crossVectors(_forward, camera.up).normalize()
      if (_right.lengthSq() < 1e-4) _right.set(1, 0, 0)
      root.position.copy(beat.position).addScaledVector(_right, PORTRAIT_LATERAL)
      // Square to the lens with a slight turn inward, so the face is looking
      // across the corridor at the plate rather than straight out of the screen.
      root.quaternion.copy(camera.quaternion)
      root.rotateY(0.16)
    }

    // The probe lives in world space and the voxels in the mesh's own; doing the
    // change of basis once here rather than per instance in the shader is the
    // difference between one matrix inverse a frame and five thousand.
    const node = mesh.current
    if (node) {
      _inverse.copy(node.matrixWorld).invert()
      _probe.copy(reactorControl.probe).applyMatrix4(_inverse)
      material.uniforms.uProbe.value.copy(_probe)
      material.uniforms.uProbeAmount.value = THREE.MathUtils.damp(
        material.uniforms.uProbeAmount.value as number,
        reactorControl.probeLive ? opacityRef.current : 0,
        5,
        delta,
      )
    }
  })

  const { position, pitch, yaw, scale } = ABOUT_PORTRAIT

  if (!geometry || !field?.count) return null

  return (
    // The transform below is only the first-frame fallback: once the About beat
    // has been published, the frame loop drives position and orientation.
    <group ref={group} position={position} rotation={[pitch, yaw, 0]} scale={scale}>
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        frustumCulled={false}
        renderOrder={1}
      />
    </group>
  )
}
