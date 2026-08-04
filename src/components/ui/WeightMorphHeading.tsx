import { Fragment, useEffect, useMemo, useRef } from 'react'
import { sceneState, useSceneStore } from '../../scene/sceneState'

interface WeightMorphHeadingProps {
  text: string
  className?: string
  /** Marks each word for the GSAP intro to stagger. */
  wordAttribute?: string
}

const RADIUS = 280
const MIN_WEIGHT = 300
const MAX_WEIGHT = 700
/** Quantising avoids re-laying out glyphs for imperceptible weight changes. */
const STEP = 25

interface CharCache {
  node: HTMLElement
  /** Centre in document space, so scrolling needs no re-measure. */
  docX: number
  docY: number
  weight: number
}

/**
 * Splits a heading into characters whose variable-font weight responds to
 * pointer proximity. Positions are measured once and cached: the per-frame work
 * is arithmetic plus a style write, with no layout reads.
 */
export const WeightMorphHeading = ({
  text,
  className,
  wordAttribute,
}: WeightMorphHeadingProps) => {
  const ref = useRef<HTMLHeadingElement>(null)
  const tier = useSceneStore((state) => state.tier)
  const worldCopy = useSceneStore((state) => state.worldCopy)
  const words = useMemo(() => text.split(' '), [text])

  useEffect(() => {
    const heading = ref.current
    // Once the scene renders this heading, the DOM copy is transparent: morphing
    // weights nobody can see would be a per-frame loop for nothing.
    if (!heading || tier !== 'cinema' || worldCopy) return

    let chars: CharCache[] = []
    let frame = 0

    const measure = () => {
      chars = Array.from(
        heading.querySelectorAll<HTMLElement>('.morph__char'),
      ).map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          node,
          docX: rect.left + rect.width / 2 + window.scrollX,
          docY: rect.top + rect.height / 2 + window.scrollY,
          weight: MAX_WEIGHT,
        }
      })
    }

    const tick = () => {
      const pointerX = ((sceneState.pointerX + 1) / 2) * window.innerWidth
      const pointerY = ((sceneState.pointerY + 1) / 2) * window.innerHeight

      for (const char of chars) {
        const dx = pointerX - (char.docX - window.scrollX)
        const dy = pointerY - (char.docY - window.scrollY)
        const distance = Math.hypot(dx, dy)
        const falloff = Math.min(1, distance / RADIUS)
        const target =
          Math.round((MIN_WEIGHT + falloff * (MAX_WEIGHT - MIN_WEIGHT)) / STEP) *
          STEP

        if (target === char.weight) continue
        char.weight = target
        char.node.style.setProperty('--wght', String(target))
      }

      frame = requestAnimationFrame(tick)
    }

    measure()
    // Glyph advances change once the webfont swaps in, so measure again then.
    document.fonts.ready.then(measure).catch(() => undefined)
    frame = requestAnimationFrame(tick)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      chars.forEach((char) => char.node.style.removeProperty('--wght'))
    }
  }, [tier, words, worldCopy])

  return (
    <h1 ref={ref} className={className ? `display ${className}` : 'display'}>
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          {/* The mask clips the word while the intro slides it up into place. */}
          <span className="morph__mask">
            <span
              className="morph__word"
              {...(wordAttribute && { [wordAttribute]: '' })}
            >
              {Array.from(word).map((char, charIndex) => (
                <span key={charIndex} className="morph__char">
                  {char}
                </span>
              ))}
            </span>
          </span>
          {wordIndex < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </h1>
  )
}
