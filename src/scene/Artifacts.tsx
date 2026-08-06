import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import { toShards } from './shardGeometry'
import {
  ARTIFACT_PANEL,
  ARTIFACTS,
  artifactGroupWindows,
  cinemaPanelSegments,
  type ArtifactPlacement,
  type ArtifactWindow,
} from './layout'
import {
  buildFor,
  liveFor,
  sceneState,
  type Tier,
} from './sceneState'
import { clamp01 } from './ui/fragmentSettle'
import type { SectionWindows } from './ui/sectionRanges'

/**
 * The projects, as objects in the room. Each one is a panel shattered into free
 * triangles that fly in and land carrying the real project shot — so what the
 * reconstruction reveals is the work itself, not a stock solid.
 *
 * No DOM dossier: Work is a scroll spacer; identity lives in world-copy glyphs.
 */

/** Dense enough to read as photo-debris in flight; still one draw call per panel. */
const SEGMENTS: Record<Tier, [number, number]> = {
  cinema: [12, 8],
  lite: [5, 3],
  still: [4, 3],
}

/**
 * `uAssembleAt` value at which every shard (stagger ≤ 0.42, settle span 0.36) is
 * locked — matches BEAUTY / STILL_BUILD in `ReconstructMaterial`.
 */
const ASSEMBLED_AT = 0.78

/**
 * Show the textured mesh once shotMix makes the plate readable.
 * ReconstructMaterial: shotMix = smoothstep(0.52, 0.9, vAssembled) with
 * assembleAt = progress * ASSEMBLED_AT (0.78) → progress ≈ 0.68 before
 * low-stagger shards carry a visible photo.
 */
const PLATE_ON = 0.68
const PLATE_OFF = 0.42

/** Hold assembled after the camera pass, then dissolve so Process/Services stay clear. */
const RETIRE_HOLD = 0.04
const RETIRE_SPAN = 0.08
/** Fade the gallery as Services enters — after every Work pass has had room. */
const LANE_CLEAR_LEAD = 0.02
const LANE_CLEAR_SPAN = 0.05

const useCinemaPanelSegments = (tier: Tier) => {
  const [segments, setSegments] = useState<[number, number]>(() =>
    cinemaPanelSegments(),
  )

  useEffect(() => {
    if (tier !== 'cinema') return

    let frame = 0
    const syncSegments = () => {
      frame = 0
      const next = cinemaPanelSegments()
      setSegments((current) =>
        current[0] === next[0] && current[1] === next[1] ? current : next,
      )
    }
    const handleResize = () => {
      if (frame) return
      frame = requestAnimationFrame(syncSegments)
    }

    syncSegments()
    window.addEventListener('resize', handleResize)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
    }
  }, [tier])

  return segments
}

const panelGeometry = (tier: Tier, cinemaSegments: [number, number]) => {
  const [columns, rows] =
    tier === 'cinema' ? cinemaSegments : SEGMENTS[tier]
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
  /** Slice of the whole page's scroll this panel assembles over. */
  window: ArtifactWindow
  /**
   * Build value where the Work lane must clear (Services enter). Using Work
   * DOM exit was too early for rear panels whose `pass` is still ahead.
   */
  laneClear: number
  tier: Tier
}

const Artifact = ({
  index,
  placement,
  geometry,
  texture,
  window: assembly,
  laneClear,
  tier,
}: ArtifactProps) => {
  const plateRef = useRef<THREE.Mesh>(null)
  const rimRef = useRef<THREE.Mesh>(null)
  const focus = useRef(0)
  const liveRef = useRef(false)

  // Wide scatter + seed stagger: same debris language as the lattice, resolving
  // as a wave of photo shards rather than a flat snap.
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

  // Bind map before paint; plate visibility waits on assemble progress below.
  useEffect(() => {
    material.uniforms.uMap.value = texture ?? material.uniforms.uMap.value
    material.uniforms.uHasMap.value = texture ? 1 : 0
  }, [material, texture])

  useFrame((state, delta) => {
    const build = buildFor(tier)
    const targetFocus = sceneState.focus === index ? 1 : 0
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 6, delta)

    // Still freezes the room at STILL_BUILD (0.78). Deep panels pass later than
    // that, so force a locked plate — reduced-motion must never show mid-flight.
    const progress =
      tier === 'still'
        ? 1
        : clamp01((build - assembly.enter) / assembly.span)

    // Dissolve after this panel's camera pass. Lane-clear (Services enter) must
    // not start before that pass — DOM scroll and dolly depth disagree for rear
    // artifacts, and a global fade was killing them at progress ≈ 0.
    const passRetire = clamp01(
      (build - (assembly.pass + RETIRE_HOLD)) / RETIRE_SPAN,
    )
    const laneRetire =
      laneClear > 0
        ? clamp01(
            (build -
              (Math.max(laneClear, assembly.pass + RETIRE_HOLD) -
                LANE_CLEAR_LEAD)) /
              LANE_CLEAR_SPAN,
          )
        : 0
    const retire = tier === 'still' ? 0 : Math.max(passRetire, laneRetire)
    const presence = 1 - retire

    material.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      // 0 → fully scattered wire; ASSEMBLED_AT → every shard locked home.
      assembleAt: progress * ASSEMBLED_AT,
    })

    // Assemble enter/leave fade: Work stays clear before the window.
    const enterFade =
      tier === 'cinema'
        ? THREE.MathUtils.smoothstep(progress, 0.04, 0.32)
        : 1

    // Cinema: shards stay visible through the assemble window (flying photo
    // debris → plate). `plateLive` only gates the dark backing/rim — hiding the
    // whole mesh until PLATE_ON left Work empty with no DOM dossier.
    let plateLive = false
    if (tier === 'cinema') {
      plateLive =
        Boolean(texture) &&
        (liveRef.current
          ? presence > 0.35 && progress >= PLATE_OFF
          : progress >= PLATE_ON && presence > 0.5)
      liveRef.current = plateLive
    }

    // Once the window opens, keep debris readable — enterFade alone stayed 0
    // for the first ~4% and blanked the gallery with no DOM dossier.
    material.uniforms.uOpacity.value =
      tier === 'cinema'
        ? (progress > 0 ? Math.max(enterFade, 0.45) : 0) * presence
        : presence

    // Plate/rim once shards are mostly home — early enough to read while in view.
    const plateFade =
      THREE.MathUtils.smoothstep(progress, 0.62, 0.9) *
      (tier === 'cinema' ? (plateLive ? enterFade : 0) : presence)
    const plate = plateRef.current
    if (plate) {
      plate.visible = plateFade > 0.02
      const plateMat = plate.material as THREE.MeshBasicMaterial
      plateMat.opacity = plateFade * 0.94
      // Only occlude once the silhouette is solid — a fading plate writing Z
      // punches holes through lattice and world-copy behind the panel.
      plateMat.depthWrite = plateFade > 0.85
    }
    const rim = rimRef.current
    if (rim) {
      rim.visible = plateFade > 0.02
      const rimMat = rim.material as THREE.MeshBasicMaterial
      rimMat.opacity = plateFade * 0.4
    }

    // Focus accent stays in the material. Do not scale the group — world-copy
    // numeral/title are baked from static placements and would desync.
  })

  return (
    <group
      position={placement.position}
      rotation={[placement.pitch, placement.yaw, 0]}
      scale={placement.scale}
    >
      {/* Dark plate + thin rim: silhouette only after the shards have landed. */}
      <mesh ref={plateRef} position={[0, 0, -0.05]} renderOrder={0} visible={false}>
        <planeGeometry
          args={[ARTIFACT_PANEL.width * 1.08, ARTIFACT_PANEL.height * 1.08]}
        />
        <meshBasicMaterial
          color="#070605"
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
          color="#c4a37a"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={geometry}
        material={material}
        // Ahead of the lattice so a settled panel is never painted under a wall shard.
        renderOrder={1}
      />
    </group>
  )
}

/**
 * Loads the project shots imperatively. `useLoader` would suspend the whole
 * canvas subtree on a 500 kB JPEG; here the room keeps rendering and each panel
 * picks up its texture whenever it lands.
 */
const useShotTextures = (shots: string[], enabled: boolean) => {
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>([])
  // Content key — not array identity — so a locale swap with same length still
  // reloads, and a stable URL list does not thrash every render.
  const shotsKey = shots.join('\0')

  useEffect(() => {
    if (!enabled) {
      setTextures([])
      return
    }

    const urls = shotsKey.length > 0 ? shotsKey.split('\0') : []
    const loader = new THREE.TextureLoader()
    const loaded: (THREE.Texture | null)[] = urls.map(() => null)
    let cancelled = false
    setTextures(urls.map(() => null))

    urls.forEach((url, index) => {
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
        () => undefined,
      )
    })

    return () => {
      cancelled = true
      loaded.forEach((texture) => texture?.dispose())
      setTextures([])
    }
  }, [shotsKey, enabled])

  return textures
}

interface ArtifactsProps {
  tier: Tier
  /** Project shot URLs, index-matched to `ARTIFACTS`. */
  shots: string[]
  windows: SectionWindows
}

export const Artifacts = ({ tier, shots, windows }: ArtifactsProps) => {
  const cinemaSegments = useCinemaPanelSegments(tier)
  const geometry = useMemo(
    () => panelGeometry(tier, cinemaSegments),
    [tier, cinemaSegments],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  const textures = useShotTextures(shots, tier === 'cinema')
  // Prefer Services enter so rear Work panels finish their pass first.
  const laneClear = windows.services?.enter ?? windows.work?.exit ?? 0

  // Each panel assembles while it is coming into view: scattered far ahead,
  // locked before the camera draws alongside so the project reads while
  // looked at. Rescaled into Work's own DOM bounds — see `artifactGroupWindows`.
  const panelWindows = useMemo(
    () => artifactGroupWindows(windows.work),
    [windows.work],
  )

  // Work has no dossier hover targets — focus follows the nearest live panel on
  // the dolly so ReconstructMaterial / bay columns still get a rim accent.
  // Keyboard focus on `.work__a11y` wins so SR/tab users still light the rim.
  useFrame(() => {
    if (tier === 'still') {
      sceneState.focus = -1
      return
    }

    const active = document.activeElement
    if (active instanceof HTMLElement) {
      const link = active.closest('a[data-artifact]')
      if (link instanceof HTMLElement && link.closest('.work__a11y')) {
        const index = Number(link.dataset.artifact)
        if (Number.isFinite(index)) {
          sceneState.focus = index
          return
        }
      }
    }

    const build = buildFor(tier)
    const work = windows.work
    // Bound by Work exit + the same retire window the panel scorer uses —
    // Services.enter can land mid-spacer; cutting at LANE_CLEAR alone drops
    // rim accent while the last shards are still dissolving.
    if (
      !work ||
      build < work.enter ||
      build > work.exit + RETIRE_HOLD + RETIRE_SPAN
    ) {
      sceneState.focus = -1
      return
    }

    // Score by closeness to each panel's pass on the scroll, not raw camera Z —
    // a just-passed panel often stays nearer in Z while it dissolves and would
    // steal the rim from the one the visitor is approaching.
    let best = -1
    let bestScore = Infinity
    for (let index = 0; index < ARTIFACTS.length; index++) {
      const panel = panelWindows[index]
      if (!panel || build < panel.enter) continue
      if (build > panel.pass + RETIRE_HOLD + RETIRE_SPAN) continue
      const score =
        build <= panel.pass
          ? panel.pass - build
          : (build - panel.pass) * 2.5
      if (score < bestScore) {
        bestScore = score
        best = index
      }
    }
    sceneState.focus = best
  })

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
          tier={tier}
        />
      ))}
    </>
  )
}
