import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { CaseStudy } from '../../content'
import type { Quality } from '../capability'
import { GlyphField } from './GlyphField'
import { buildGlyphAtlas, type GlyphAtlas } from './glyphAtlas'
import { layoutBlocks } from './glyphLayout'
import type { SectionWindows } from './sectionRanges'
import { buildWorldType, worldTypeSources } from './worldBlocks'

/**
 * Decorative typography in the room: the monogram, corridor sector markers and the
 * module plates, all in one instanced draw call.
 *
 * None of it stands in for document text, so an atlas that never rasterises — a
 * font that fails, a 2D context the browser refuses — simply renders nothing and
 * the page is unaffected. That is why there is no hand-off flag here any more.
 */

/** Fragment budget per quality. */
const BUDGET: Record<Quality, number> = { cinema: 9000, lite: 280 }

/** Reference aspect the world placements were composed for. */
const REFERENCE_ASPECT = 1.6

interface ReactorTypeProps {
  featured: CaseStudy[]
  quality: Quality
  windows: SectionWindows
}

export const ReactorType = ({
  featured,
  quality,
  windows,
}: ReactorTypeProps) => {
  const [atlas, setAtlas] = useState<GlyphAtlas | null>(null)
  const aspect = useThree((state) => state.viewport.aspect)

  useEffect(() => {
    let cancelled = false
    let built: GlyphAtlas | null = null

    buildGlyphAtlas(worldTypeSources(featured))
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
  }, [featured])

  // Quantised: a one-pixel resize must not reallocate every fragment buffer.
  const fit =
    Math.round(THREE.MathUtils.clamp(aspect / REFERENCE_ASPECT, 0.42, 1) * 50) / 50

  const blocks = useMemo(
    () => buildWorldType({ featured, windows, quality, fit }),
    [featured, windows, quality, fit],
  )

  const instances = useMemo(
    () => (atlas ? layoutBlocks(blocks, atlas, BUDGET[quality]) : null),
    [atlas, blocks, quality],
  )

  if (!atlas || !instances?.count) return null

  return <GlyphField instances={instances} atlas={atlas.texture} />
}
