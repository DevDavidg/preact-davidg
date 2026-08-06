import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Copy } from '../../i18n/copy'
import { useSceneStore, type Tier } from '../sceneState'
import { GlyphField } from './GlyphField'
import { buildGlyphAtlas, type GlyphAtlas } from './glyphAtlas'
import { layoutBlocks } from './glyphLayout'
import type { SectionWindows } from './sectionRanges'
import { buildWorldCopy, worldCopySources } from './worldBlocks'

/**
 * The page's typography, living in the room. Blocks are placed from the camera
 * spline and windowed by the real scroll position of their DOM section, so every
 * headline and numeral assembles out of the background exactly as the visitor
 * scrolls it into view.
 */

interface WorldCopyProps {
  copy: Copy
  tier: Tier
  windows: SectionWindows
}

/** Fragment budget per tier. Cinema hosts voxelised hero + project labels. */
/** Cinema hosts voxel hero/projects + About reading plate beside the portrait. */
const BUDGET: Record<Tier, number> = { cinema: 10500, lite: 280, still: 0 }

/** Reference aspect the world placements were composed for. */
const REFERENCE_ASPECT = 1.6

/**
 * Signals the DOM that the scene has taken the headings over, so CSS can retire
 * them and the pointer-driven weight morph can stop working on invisible text.
 * Set only once the atlas has actually rasterized: if WebGL or the fonts never
 * arrive, the HTML stays the visible layer.
 */
const useWorldCopyFlag = (active: boolean) => {
  const setWorldCopy = useSceneStore((state) => state.setWorldCopy)

  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    root.dataset.worldCopy = 'on'
    setWorldCopy(true)
    return () => {
      delete root.dataset.worldCopy
      setWorldCopy(false)
    }
  }, [active, setWorldCopy])
}

export const WorldCopy = ({ copy, tier, windows }: WorldCopyProps) => {
  const [atlas, setAtlas] = useState<GlyphAtlas | null>(null)
  const [faded, setFaded] = useState(false)
  const aspect = useThree((state) => state.viewport.aspect)
  const enabled = tier !== 'still'

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let built: GlyphAtlas | null = null

    buildGlyphAtlas(worldCopySources(copy))
      .then((next) => {
        if (cancelled) {
          next.dispose()
          return
        }
        built = next
        setAtlas(next)
      })
      .catch(() => setAtlas(null))

    return () => {
      cancelled = true
      built?.dispose()
      setAtlas(null)
    }
  }, [copy, enabled])

  // Quantised: a one-pixel resize must not reallocate every fragment buffer.
  const fit =
    Math.round(THREE.MathUtils.clamp(aspect / REFERENCE_ASPECT, 0.42, 1) * 50) / 50

  const blocks = useMemo(
    () => buildWorldCopy({ copy, windows, tier, fit }),
    [copy, windows, tier, fit],
  )

  const instances = useMemo(
    () => (atlas ? layoutBlocks(blocks, atlas, BUDGET[tier]) : null),
    [atlas, blocks, tier],
  )

  // Atlas rebuild always re-earns the hand-off. Remeasuring windows reshuffles
  // instance buffers — do not clear `faded` on those swaps or DOM headings flash
  // over an already-readable field. Incomplete/empty layouts must clear it so a
  // remounted GlyphField (opacity 0) cannot keep `data-world-copy` on.
  useEffect(() => setFaded(false), [atlas])
  useEffect(() => {
    if (!instances?.complete || !instances.count) setFaded(false)
  }, [instances])

  // Only the cinema tier replaces DOM headings; see `buildWorldCopy`. Everything
  // here has to be true at once: a partial atlas or a layout the budget cut short
  // would retire the HTML in favour of copy the scene cannot actually spell.
  useWorldCopyFlag(
    tier === 'cinema' &&
      Boolean(atlas?.complete) &&
      Boolean(instances?.complete) &&
      Boolean(instances?.count) &&
      faded,
  )

  // Incomplete atlas or layout must not paint — the DOM flag stays off when
  // either `complete` is false, so missing About glyphs never replace HTML.
  if (!atlas?.complete || !instances?.count || !instances.complete) return null

  return (
    <GlyphField
      instances={instances}
      atlas={atlas.texture}
      tier={tier}
      onVisible={() => setFaded(true)}
    />
  )
}
