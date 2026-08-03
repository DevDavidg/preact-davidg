import { useCallback, type PointerEvent } from 'react'
import { useCopy, type Copy } from '../i18n/copy'
import { useInView } from '../hooks/useInView'
import { sceneState, useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'

const MAX_TILT = 11

interface ArtifactPanelProps {
  index: number
  item: Copy['work']['items'][number]
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

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const node = ref.current
      if (!node || tier !== 'cinema') return
      const rect = node.getBoundingClientRect()
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5
      node.style.setProperty('--ry', `${(offsetX * MAX_TILT).toFixed(2)}deg`)
      node.style.setProperty('--rx', `${(-offsetY * MAX_TILT).toFixed(2)}deg`)
    },
    [ref, tier],
  )

  const handleFocus = useCallback(() => {
    sceneState.focus = index
  }, [index])

  const handleBlur = useCallback(() => {
    sceneState.focus = -1
    const node = ref.current
    if (!node) return
    node.style.removeProperty('--rx')
    node.style.removeProperty('--ry')
  }, [ref])

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
