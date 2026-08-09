import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import {
  ARTIFACT_PANEL,
  ARTIFACTS,
  artifactGroupWindows,
  panelSegments,
  type ArtifactPlacement,
  type ArtifactWindow,
} from './layout'
import { ReconstructMaterial } from './ReconstructMaterial'
import { clamp01, liveFor, sceneState } from './sceneState'
import { toShards } from './shardGeometry'
import type { SectionWindows } from './ui/sectionRanges'

/**
 * The featured projects, as objects in the room.
 *
 * Each one is a panel shattered into free triangles that fly in carrying the real
 * project shot, so what the reconstruction reveals is the work itself.
 *
 * These modules are decorative. The dossier cards in the document are what a
 * visitor reads and clicks; hovering a card is what tells a module to light up.
 * That split is deliberate — the previous version put the gallery *only* in the
 * canvas, which meant a visitor with a mouse could see the projects and open none
 * of them.
 */

/** Charge value at which every shard of a panel is locked home. */
const ASSEMBLED_AT = 0.78

/** Assembly progress at which the shot is readable enough to back with a plate. */
const PLATE_ON = 0.68
const PLATE_OFF = 0.42

/** Hold assembled after the camera pass, then dissolve so later chapters stay clear. */
const RETIRE_HOLD = 0.04
const RETIRE_SPAN = 0.08
const LANE_CLEAR_LEAD = 0.02
const LANE_CLEAR_SPAN = 0.05

const useResponsiveSegments = (quality: Quality) => {
  const [segments, setSegments] = useState<[number, number]>(() => panelSegments())

  useEffect(() => {
    let frame = 0
    const sync = () => {
      frame = 0
      const next = panelSegments()
      setSegments((current) =>
        current[0] === next[0] && current[1] === next[1] ? current : next,
      )
    }
    const handleResize = () => {
      if (frame) return
      frame = requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('resize', handleResize)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
    }
  }, [quality])

  return segments
}

const panelGeometry = (
  quality: Quality,
  segments: [number, number],
): THREE.BufferGeometry => {
  const [columns, rows] = quality === 'cinema' ? segments : [5, 3]
  const source = new THREE.PlaneGeometry(
    ARTIFACT_PANEL.width,
    ARTIFACT_PANEL.height,
    columns,
    rows,
  )
  const shards = toShards(source)
  source.dispose()
  return shards
}

interface ArtifactProps {
  index: number
  placement: ArtifactPlacement
  geometry: THREE.BufferGeometry
  texture: THREE.Texture | null
  window: ArtifactWindow
  /** Charge value at which the gallery lane has to clear for the next chapter. */
  laneClear: number
  quality: Quality
}

const Artifact = ({
  index,
  placement,
  geometry,
  texture,
  window: assembly,
  laneClear,
  quality,
}: ArtifactProps) => {
  const plateRef = useRef<THREE.Mesh>(null)
  const rimRef = useRef<THREE.Mesh>(null)
  const focus = useRef(0)
  const plateLive = useRef(false)

  const material = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 3.75,
        jitter: 0.78,
        depthSpan: 0.28,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    material.uniforms.uMap.value = texture ?? material.uniforms.uMap.value
    material.uniforms.uHasMap.value = texture ? 1 : 0
  }, [material, texture])

  useFrame((state, delta) => {
    const build = sceneState.build
    const targetFocus = sceneState.focus === index ? 1 : 0
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 6, delta)

    const progress = clamp01((build - assembly.enter) / assembly.span)

    // Dissolve after this module's camera pass. The lane clear must never start
    // before that pass: document scroll and dolly depth disagree for deeper
    // modules, and a single global fade used to kill them at progress ≈ 0.
    const passRetire = clamp01(
      (build - (assembly.pass + RETIRE_HOLD)) / RETIRE_SPAN,
    )
    const laneRetire =
      laneClear > 0
        ? clamp01(
            (build -
              (Math.max(laneClear, assembly.pass + RETIRE_HOLD) - LANE_CLEAR_LEAD)) /
              LANE_CLEAR_SPAN,
          )
        : 0
    const presence = 1 - Math.max(passRetire, laneRetire)

    material.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      assembleAt: progress * ASSEMBLED_AT,
    })

    const enterFade = THREE.MathUtils.smoothstep(progress, 0.04, 0.32)

    // Hysteresis on the backing plate, so scrolling back and forth across the
    // threshold does not flicker the dark backing behind the shot.
    const wantsPlate = Boolean(texture) &&
      (plateLive.current
        ? presence > 0.35 && progress >= PLATE_OFF
        : progress >= PLATE_ON && presence > 0.5)
    plateLive.current = wantsPlate

    material.uniforms.uOpacity.value =
      (progress > 0 ? Math.max(enterFade, 0.45) : 0) * presence

    const plateFade =
      THREE.MathUtils.smoothstep(progress, 0.62, 0.9) *
      (wantsPlate ? enterFade : 0)

    const plate = plateRef.current
    if (plate) {
      plate.visible = plateFade > 0.02
      const plateMaterial = plate.material as THREE.MeshBasicMaterial
      plateMaterial.opacity = plateFade * 0.94
      // Only occlude once the silhouette is solid: a fading plate writing depth
      // punches holes through everything behind the panel.
      plateMaterial.depthWrite = plateFade > 0.85
    }

    const rim = rimRef.current
    if (rim) {
      rim.visible = plateFade > 0.02
      const rimMaterial = rim.material as THREE.MeshBasicMaterial
      // The rim is the focus signal: brighter when the matching card is hovered.
      rimMaterial.opacity = plateFade * (0.28 + focus.current * 0.5)
    }
  })

  return (
    <group
      position={placement.position}
      rotation={[placement.pitch, placement.yaw, 0]}
      scale={placement.scale}
    >
      <mesh ref={plateRef} position={[0, 0, -0.05]} renderOrder={0} visible={false}>
        <planeGeometry
          args={[ARTIFACT_PANEL.width * 1.08, ARTIFACT_PANEL.height * 1.08]}
        />
        <meshBasicMaterial
          color="#050608"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={rimRef} position={[0, 0, -0.03]} renderOrder={0} visible={false}>
        <planeGeometry
          args={[ARTIFACT_PANEL.width * 1.12, ARTIFACT_PANEL.height * 1.12]}
        />
        <meshBasicMaterial
          color="#ffb454"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={geometry}
        material={material}
        // Ahead of the lattice so a settled panel is never painted under a shard.
        renderOrder={quality === 'cinema' ? 2 : 1}
      />
    </group>
  )
}

/**
 * Loads the project shots one step ahead of the camera.
 *
 * Loading all of them on mount cost roughly a megabyte before the visitor had
 * scrolled past the hero. Now only the active module and the next one are
 * requested, and textures are released when they fall behind.
 */
const useShotTextures = (shots: string[], windows: ArtifactWindow[]) => {
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>(() =>
    shots.map(() => null),
  )
  const [wanted, setWanted] = useState(1)
  const shotsKey = shots.join('\0')

  // How many modules are worth having decoded right now.
  useFrame(() => {
    const build = sceneState.build
    let next = 1
    for (let index = 0; index < windows.length; index++) {
      const window = windows[index]
      if (!window) continue
      // Start fetching a module's shot a little before its shards arrive.
      if (build >= window.enter - window.span * 0.6) next = index + 2
    }
    const capped = Math.min(next, shots.length)
    if (capped !== wanted) setWanted(capped)
  })

  useEffect(() => {
    const urls = shotsKey.length > 0 ? shotsKey.split('\0') : []
    const loader = new THREE.TextureLoader()
    const loaded: (THREE.Texture | null)[] = urls.map(() => null)
    let cancelled = false

    urls.slice(0, wanted).forEach((url, index) => {
      loader.load(
        url,
        (texture) => {
          if (cancelled) {
            texture.dispose()
            return
          }
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = 4
          loaded[index] = texture
          setTextures([...loaded])
        },
        undefined,
        // A failed shot leaves the panel as shaded shards; the document still
        // shows the real image, so this must not become a visible error.
        () => undefined,
      )
    })

    return () => {
      cancelled = true
      loaded.forEach((texture) => texture?.dispose())
    }
  }, [shotsKey, wanted])

  return textures
}

interface ArtifactsProps {
  quality: Quality
  /** Project shot URLs, index-matched to `ARTIFACTS`. */
  shots: string[]
  windows: SectionWindows
}

export const Artifacts = ({ quality, shots, windows }: ArtifactsProps) => {
  const segments = useResponsiveSegments(quality)
  const geometry = useMemo(
    () => panelGeometry(quality, segments),
    [quality, segments],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  const panelWindows = useMemo(
    () => artifactGroupWindows(windows.work),
    [windows.work],
  )
  const textures = useShotTextures(shots, panelWindows)
  // Prefer the next section's entry so a deep module finishes its pass first.
  const laneClear = windows.experience?.enter ?? windows.work?.exit ?? 0

  return (
    <>
      {ARTIFACTS.map((placement, index) => (
        <Artifact
          key={index}
          index={index}
          placement={placement}
          geometry={geometry}
          texture={textures[index] ?? null}
          window={panelWindows[index]}
          laneClear={laneClear}
          quality={quality}
        />
      ))}
    </>
  )
}
