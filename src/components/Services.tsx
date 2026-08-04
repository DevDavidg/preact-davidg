import { useCopy } from '../i18n/copy'
import { Reveal } from './ui/Reveal'

export const Services = () => {
  const { copy } = useCopy()

  return (
    <section id="services" className="section" aria-labelledby="services-label">
      <Reveal>
        <h2 id="services-label" className="eyebrow shard">
          {copy.services.label}
        </h2>
      </Reveal>

      <Reveal className="rows panel" delay={100}>
        {copy.services.items.map((item, index) => (
          <div key={item.title} className="row shard" data-hit>
            <span className="row__idx">{`0${index + 1}`}</span>
            <div>
              <h3 className="row__title">{item.title}</h3>
              <p className="row__stack">{item.stack}</p>
            </div>
            <p className="body-sm">{item.copy}</p>
          </div>
        ))}
      </Reveal>
    </section>
  )
}
