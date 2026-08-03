import { useCopy } from '../i18n/copy'
import { Reveal } from './ui/Reveal'

export const About = () => {
  const { copy } = useCopy()

  return (
    <section id="about" className="section" aria-labelledby="about-label">
      <Reveal>
        <h2 id="about-label" className="eyebrow">
          {copy.about.label}
        </h2>
      </Reveal>

      <div className="about__grid">
        <Reveal delay={80}>
          <figure className="about__portrait window">
            <span>{copy.about.portrait}</span>
          </figure>
        </Reveal>

        <Reveal className="panel about__body" delay={160}>
          <p className="about__quote">{copy.about.quote}</p>
          <p className="lead" style={{ marginTop: 24, fontSize: 15 }}>
            {copy.about.copy}
          </p>
          <dl className="spec">
            {copy.about.spec.map((entry) => (
              <div key={entry.key} className="spec__row">
                <dt className="spec__key">{entry.key}</dt>
                <dd style={{ margin: 0 }}>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
