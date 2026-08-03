import { useCopy } from '../i18n/copy'
import { Magnetic } from './ui/Magnetic'
import { Reveal } from './ui/Reveal'

export const Contact = () => {
  const { copy } = useCopy()

  return (
    <section
      id="contact"
      className="section section--scrim contact"
      aria-labelledby="contact-title"
    >
      <Reveal>
        <h2 className="eyebrow">{copy.contact.label}</h2>
        <p className="contact__live">
          <span className="dot" aria-hidden="true">
            ●
          </span>{' '}
          {copy.contact.live}
        </p>
      </Reveal>

      <Reveal delay={80}>
        <p id="contact-title" className="display contact__title">
          {copy.contact.title}
        </p>
        <p className="lead" style={{ marginTop: 20, maxWidth: '46ch' }}>
          {copy.contact.lead}
        </p>
      </Reveal>

      <Reveal delay={160}>
        <Magnetic
          href={`mailto:${copy.contact.email}`}
          className="contact__mail"
          strength={0.12}
        >
          {copy.contact.email}&nbsp;↗
        </Magnetic>
      </Reveal>

      <Reveal className="contact__social" delay={240}>
        {copy.contact.social.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </Reveal>
    </section>
  )
}
