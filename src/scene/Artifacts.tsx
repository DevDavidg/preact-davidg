import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import { toShards } from './shardGeometry'
import {
  ARTIFACT_PANEL,
  ARTIFACTS,
  buildAtDepth,
  type ArtifactPlacement,
} from './layout'
import { buildFor, liveFor, sceneState, type Tier } from './sceneState'
import { clamp01 } from './ui/fragmentSettle'

/**
 * The projects, as objects in the room. Each one is a panel shattered into free
 * triangles that fly in and land carrying the real project shot — so what the
 * reconstruction reveals is the work itself, not a stock solid.
 */

/** Segment counts per tier: shards big enough to read while they are in flight. */
const SEGMENTS: Record<Tier, [number, number]> = {
  cinema: [7, 5],
  lite: [4, 3],
  still: [4, 3],
}

/** Assembly is fully settled at this shader build; see `ReconstructMaterial`. */
const ASSEMBLED_AT = 0.78

const panelGeometry = (tier: Tier) => {
  const [columns, rows] = SEGMENTS[tier]
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
  window: { enter: number; span: number }
  tier: Tier
}

const Artifact = ({
  index,
  placement,
  geometry,
  texture,
  window: assembly,
  tier,
}: ArtifactProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const focus = useRef(0)

  const material = useMemo(
    () => new ReconstructMaterial({ spread: 0.95, jitter: 0.22 }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  // The shot arrives without re-suspending the scene: the panel is a cloud of
  // wireframe shards until then anyway.
  useEffect(() => {
    material.uniforms.uMap.value = texture ?? material.uniforms.uMap.value
    material.uniforms.uHasMap.value = texture ? 1 : 0
  }, [material, texture])

  useFrame((state, delta) => {
    const build = buildFor(tier)
    const targetFocus = sceneState.focus === index ? 1 : 0
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 6, delta)

    material.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      // Panels belong to the Work scroll, not to the whole page: each one waits
      // for its own card to come into view before it starts landing.
      assembleAt:
        clamp01((build - assembly.enter) / assembly.span) * ASSEMBLED_AT,
    })

    const mesh = meshRef.current
    if (!mesh || tier === 'still') return

    // A slow breath and a nudge toward the corridor on focus — the panel stays
    // planted, the reconstruction does the moving.
    mesh.position.y =
      placement.position[1] +
      Math.sin(state.clock.elapsedTime * 0.5 + index * 1.7) * 0.07
    mesh.scale.setScalar(placement.scale * (1 + focus.current * 0.05))
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={placement.position}
      rotation={[placement.pitch, placement.yaw, 0]}
      scale={placement.scale}
    />
  )
}

/**
 * Loads the project shots imperatively. `useLoader` would suspend the whole
 * canvas subtree on a 500 kB JPEG; here the room keeps rendering and each panel
 * picks up its texture whenever it lands.
 */
const useShotTextures = (shots: string[], enabled: boolean) => {
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>([])

  useEffect(() => {
    if (!enabled) {
      setTextures([])
      return
    }

    const loader = new THREE.TextureLoader()
    const loaded: (THREE.Texture | null)[] = shots.map(() => null)
    let cancelled = false

    shots.forEach((url, index) => {
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
  }, [shots, enabled])

  return textures
}

/**
 * Each panel is timed against the dolly rather than against the Work section's
 * scroll range: it has to be standing by the time the camera reaches its depth,
 * whatever the copy length does to the page height.
 */
const PANEL_WINDOWS = ARTIFACTS.map((placement) => ({
  // Standing by the time the camera is roughly six metres short of it: a finished
  // object that sweeps overhead, not a cloud that snaps together beside the lens.
  enter: buildAtDepth(placement.position[2] + 6),
  span: 0.08,
}))

interface ArtifactsProps {
  tier: Tier
  /** Project shot URLs, index-matched to `ARTIFACTS`. */
  shots: string[]
}

export const Artifacts = ({ tier, shots }: ArtifactsProps) => {
  const geometry = useMemo(() => panelGeometry(tier), [tier])
  useEffect(() => () => geometry.dispose(), [geometry])

  const textures = useShotTextures(shots, tier === 'cinema')

  return (
    <>
      {ARTIFACTS.map((placement, index) => (
        <Artifact
          key={index}
          index={index}
          placement={placement}
          geometry={geometry}
          texture={textures[index] ?? null}
          window={PANEL_WINDOWS[index]}
          tier={tier}
        />
      ))}
    </>
  )
}
