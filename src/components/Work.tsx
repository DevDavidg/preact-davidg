import { useCopy } from '../i18n/copy'
import { useSceneStore } from '../scene/sceneState'

/**
 * Work is a scroll spacer + accessible project list. The visual gallery lives
 * only in the 3D room (shards + world-copy). No visible dossier cards — the
 * a11y list stays clipped until keyboard focus, then surfaces below the nav.
 */
export const Work = () => {
  const { copy } = useCopy()
  const tier = useSceneStore((state) => state.tier)

  if (tier !== 'cinema') {
    return (
      <section
        id="work"
        className="section section--scrim work"
        aria-labelledby="work-label"
      >
        <h2 id="work-label" className="eyebrow">
          {copy.work.label}
        </h2>
        <ol className="work__fallback">
          {copy.work.items.map((item, index) => (
            <li key={item.title} className="work__fallback-item">
              <span className="work__fallback-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="work__fallback-title"
                  aria-label={`${item.title}: ${item.link}`}
                >
                  {item.title} ↗
                </a>
                <p className="body-sm">{item.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    )
  }

  return (
    <section id="work" className="section work" aria-labelledby="work-label">
      <h2 id="work-label" className="sr-only">
        {copy.work.label}
      </h2>
      <ul className="work__a11y">
        {copy.work.items.map((item, index) => (
          <li key={item.title}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              data-artifact={index}
              aria-label={`${item.title}: ${item.link}`}
            >
              {item.title}
            </a>
            <p>{item.copy}</p>
          </li>
        ))}
      </ul>
      <div className="work__field" aria-hidden="true" />
    </section>
  )
}
