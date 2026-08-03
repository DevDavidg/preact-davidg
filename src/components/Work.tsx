import { useCallback, useEffect, useRef, type PointerEvent } from 'react'
import { useCopy, type Copy } from '../i18n/copy'
import { useInView } from '../hooks/useInView'
import { sceneState, useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'

const MAX_TILT = 11
/** Per-frame blend toward the pointer — replaces CSS transform transitions. */
const TILT_LERP = 0.18

interface ArtifactPanelProps {
  index: number
  item: Copy['work']['items'][number]
}

interface TiltState {
  rx: number
  ry: number
  targetRx: number
  targetRy: number
  frame: number
  tracking: boolean
}

/**
 * An overlay panel bound to one 3D artifact. Hovering or tab-focusing the panel
 * publishes the index to `sceneState`, and the matching object in the scene lifts
 * its accent rim — so the flat card and the solid it describes are one thing.
 */
const ArtifactPanel = ({ index, item }: ArtifactPanelProps) => {
  // Reveal lives on the article itself: a wrapper with a transform would become
  // the containing block and break the absolute placement in the field.
  const { ref, inView } = useInView<HTMLElement>()
  const tier = useSceneStore((state) => state.tier)
  const tilt = useRef<TiltState>({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    frame: 0,
    tracking: false,
  })

  const writeTilt = useCallback(() => {
    const node = ref.current
    const state = tilt.current
    // Always clear the slot before bailing — a stale non-zero id would make
    // ensureTiltLoop think the loop is still alive after Strict Mode remount.
    if (!node) {
      state.frame = 0
      return
    }

    state.rx += (state.targetRx - state.rx) * TILT_LERP
    state.ry += (state.targetRy - state.ry) * TILT_LERP

    if (Math.abs(state.rx) < 0.02 && Math.abs(state.targetRx) < 0.02) state.rx = 0
    if (Math.abs(state.ry) < 0.02 && Math.abs(state.targetRy) < 0.02) state.ry = 0

    node.style.setProperty('--rx', `${state.rx.toFixed(2)}deg`)
    node.style.setProperty('--ry', `${state.ry.toFixed(2)}deg`)

    // Stop once converged — even while hovered. The next pointermove restarts
    // the loop; keeping rAF alive for a stationary cursor only burns frames.
    const settling =
      Math.abs(state.targetRx - state.rx) > 0.03 ||
      Math.abs(state.targetRy - state.ry) > 0.03

    if (settling) {
      state.frame = requestAnimationFrame(writeTilt)
      return
    }

    state.frame = 0
    if (!state.tracking && state.rx === 0 && state.ry === 0) {
      node.style.removeProperty('--rx')
      node.style.removeProperty('--ry')
    }
  }, [ref])

  const ensureTiltLoop = useCallback(() => {
    if (tilt.current.frame) return
    tilt.current.frame = requestAnimationFrame(writeTilt)
  }, [writeTilt])

  useEffect(
    () => () => {
      if (!tilt.current.frame) return
      cancelAnimationFrame(tilt.current.frame)
      tilt.current.frame = 0
    },
    [],
  )

  // Pointer handlers bail when tier !== cinema but never clear `tracking`, so a
  // mid-hover tier drop (resize / reduced-motion) would leave rAF running forever.
  useEffect(() => {
    if (tier === 'cinema') return
    const state = tilt.current
    if (!state.tracking && state.targetRx === 0 && state.targetRy === 0) return
    state.tracking = false
    state.targetRx = 0
    state.targetRy = 0
    ensureTiltLoop()
  }, [tier, ensureTiltLoop])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const node = ref.current
      if (!node || tier !== 'cinema') return
      const rect = node.getBoundingClientRect()
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5
      const state = tilt.current
      state.tracking = true
      state.targetRy = offsetX * MAX_TILT
      state.targetRx = -offsetY * MAX_TILT
      ensureTiltLoop()
    },
    [ref, tier, ensureTiltLoop],
  )

  const handleFocus = useCallback(() => {
    sceneState.focus = index
  }, [index])

  const handleBlur = useCallback(() => {
    sceneState.focus = -1
    const state = tilt.current
    state.tracking = false
    state.targetRx = 0
    state.targetRy = 0
    ensureTiltLoop()
  }, [ensureTiltLoop])

  return (
    <article
      ref={ref}
      data-hit
      data-shown={inView}
      className={`artifact artifact--${index + 1}`}
      style={{ transitionDelay: `${index * 90}ms` }}
      onPointerEnter={handleFocus}
      onPointerMove={handlePointerMove}
      onPointerLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="artifact__shot window">
        <span>{item.shot}</span>
      </div>
      <div className="artifact__body">
        <div className="artifact__top">
          <span className="numeral artifact__num">{`0${index + 1}`}</span>
          <span className="meta">{item.tag}</span>
        </div>
        <h3 className="artifact__title">{item.title}</h3>
        <p className="body-sm" style={{ marginTop: 10 }}>
          {item.copy}
        </p>
        <a href="#contact" className="artifact__link">
          {item.link}
        </a>
      </div>
    </article>
  )
}

export const Work = () => {
  const { copy } = useCopy()

  return (
    <section id="work" className="section work" aria-labelledby="work-label">
      <Reveal className="section__head">
        <h2 id="work-label" className="eyebrow">
          {copy.work.label}
        </h2>
        <span className="meta">{copy.work.note}</span>
      </Reveal>

      <div className="work__field">
        {copy.work.items.map((item, index) => (
          <ArtifactPanel key={item.title} index={index} item={item} />
        ))}
      </div>
    </section>
  )
}
