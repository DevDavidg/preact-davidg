import { Fragment, useEffect, useMemo, useRef } from 'react'
import { addTick } from '../../motion/ticker'
import { sceneState, useSceneStore } from '../../scene/sceneState'

interface WeightMorphHeadingProps {
  id: string
  text: string
  className?: string
}

const RADIUS = 300
const MIN_WEIGHT = 450
const MAX_WEIGHT = 800
/** Quantised: re-laying out glyphs for imperceptible weight changes is waste. */
const STEP = 25

interface CharCache {
  node: HTMLElement
  /** Centre in document space, so scrolling needs no re-measure. */
  docX: number
  docY: number
  weight: number
}

/**
 * A heading whose variable-font weight responds to pointer proximity, with a
 * word-by-word reveal on arrival.
 *
 * The text itself is ordinary, selectable DOM — the effect is additive.
 *
 * The word reveal is a CSS animation rather than a tween, which keeps the animation
 * engine out of the critical bundle; only the pointer response needs a per-frame
 * callback, and that subscribes to the shared tick bus so it exists solely while a
 * scene is running. Positions are measured once and cached, so the per-frame work is
 * arithmetic and a style write with no layout reads.
 */
export const WeightMorphHeading = ({
  id,
  text,
  className,
}: WeightMorphHeadingProps) => {
  const ref = useRef<HTMLHeadingElement>(null)
  const experience = useSceneStore((state) => state.experience)
  const booted = useSceneStore((state) => state.booted)
  const words = useMemo(() => text.split(' '), [text])

  useEffect(() => {
    const heading = ref.current
    if (!heading || experience !== 'cinema') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let chars: CharCache[] = []

    const measure = () => {
      chars = Array.from(
        heading.querySelectorAll<HTMLElement>('[data-char]'),
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
        const falloff = Math.min(1, Math.hypot(dx, dy) / RADIUS)
        const target =
          Math.round((MIN_WEIGHT + falloff * (MAX_WEIGHT - MIN_WEIGHT)) / STEP) *
          STEP

        if (target === char.weight) continue
        char.weight = target
        char.node.style.setProperty('--wght', String(target))
      }
    }

    measure()
    // Glyph advances change when the webfont swaps in, so measure again then.
    document.fonts?.ready.then(measure).catch(() => undefined)
    window.addEventListener('resize', measure)
    const stopTick = addTick(tick)

    return () => {
      stopTick()
      window.removeEventListener('resize', measure)
      chars.forEach((char) => char.node.style.removeProperty('--wght'))
    }
  }, [experience, words])

  return (
    <h1
      ref={ref}
      id={id}
      // `data-revealed` gates the CSS word reveal on the preflight overlay having
      // cleared, so the two never play over each other.
      data-revealed={booted}
      className={`text-display shard${className ? ` ${className}` : ''}`}
    >
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          {/* The mask clips the word while the reveal slides it up into place.
              Padding plus a matching negative margin keeps descenders visible. */}
          <span className="-mx-[0.06em] -mb-[0.14em] -mt-[0.02em] inline-block overflow-hidden px-[0.06em] pb-[0.14em] pt-[0.02em] align-bottom">
            {/* The stagger lives in CSS, keyed off sibling position: an inline
                custom property would be one more thing for hydration to match. */}
            <span data-word className="inline-block whitespace-nowrap">
              {Array.from(word).map((char, charIndex) => (
                <span
                  key={charIndex}
                  data-char
                  className="inline-block [font-variation-settings:'wght'_var(--wght,600)]"
                >
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
