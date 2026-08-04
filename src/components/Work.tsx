import { useCallback } from 'react'
import { useCopy, type Copy } from '../i18n/copy'
import { useInView } from '../hooks/useInView'
import { sceneState } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'

interface ArtifactPanelProps {
  index: number
  item: Copy['work']['items'][number]
}

/**
 * An overlay panel bound to one 3D artifact. Hovering or tab-focusing the panel
 * publishes the index to `sceneState`, and the matching object in the scene lifts
 * its accent rim — so the flat card and the solid it describes are one thing.
 *
 * No CSS 3D tilt: `perspective` / rotateX/Y on a layer over the WebGL canvas
 * paints solid black rectangles for a frame on Chromium/WebKit (hover flash).
 */
const ArtifactPanel = ({ index, item }: ArtifactPanelProps) => {
  // Reveal lives on the article itself: a wrapper with a transform would become
  // the containing block and break the absolute placement in the field.
  const { ref, inView } = useInView<HTMLElement>()

  const handleFocus = useCallback(() => {
    // Scene only has three solids; map every panel onto that triad.
    sceneState.focus = index % 3
  }, [index])

  const handleBlur = useCallback(() => {
    sceneState.focus = -1
  }, [])

  return (
    <article
      ref={ref}
      data-hit
      data-shown={inView}
      className={`artifact artifact--${index + 1}`}
      style={{ transitionDelay: `${index * 90}ms` }}
      onPointerEnter={handleFocus}
      onPointerLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="artifact__shot window">
        <img
          src={item.image}
          alt=""
          className="artifact__img"
          width={720}
          height={450}
          loading="lazy"
          decoding="async"
        />
        <span>{item.shot}</span>
      </div>
      <div className="artifact__body">
        <div className="artifact__top">
          <span className="numeral artifact__num">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="meta">{item.tag}</span>
        </div>
        <h3 className="artifact__title">{item.title}</h3>
        <p className="body-sm" style={{ marginTop: 10 }}>
          {item.copy}
        </p>
        <a
          href={item.href}
          className="artifact__link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${item.title}: ${item.link}`}
        >
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
