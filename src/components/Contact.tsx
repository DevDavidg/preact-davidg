import { useEffect, useRef } from 'react'
import { useCopy } from '../i18n/copy'
import { livePowerFor, sceneState, useSceneStore } from '../scene/sceneState'
import { Magnetic } from './ui/Magnetic'
import { Reveal } from './ui/Reveal'

export const Contact = () => {
  const { copy } = useCopy()
  const tier = useSceneStore((state) => state.tier)
  const liveIndicator = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const indicator = liveIndicator.current
    if (!indicator) return

    if (tier === 'still') {
      indicator.style.scale = '1'
      return
    }

    let frame = 0
    const syncLiveIndicator = () => {
      const power = livePowerFor(sceneState.build)
      // Scale is an individual transform property, so it composes with the dot
      // pulse and does not interfere with the parent shard's arrival opacity.
      indicator.style.scale = (0.84 + power * 0.16).toFixed(3)
      frame = requestAnimationFrame(syncLiveIndicator)
    }

    frame = requestAnimationFrame(syncLiveIndicator)
    return () => cancelAnimationFrame(frame)
  }, [tier])

  return (
    <section
      id="contact"
      className="section section--scrim contact"
      aria-labelledby="contact-title"
    >
      <Reveal>
        <h2 className="eyebrow shard">{copy.contact.label}</h2>
        <p className="contact__live shard">
          <span ref={liveIndicator} className="dot" aria-hidden="true">
            ●
          </span>{' '}
          {copy.contact.live}
        </p>
      </Reveal>

      <Reveal delay={80}>
        {/* The scene assembles this title out of glyph fragments on the cinema
            tier; the shard keeps the same arrival everywhere else. */}
        <p
          id="contact-title"
          className="display contact__title world-copy shard"
        >
          {copy.contact.title}
        </p>
        <p className="lead shard" style={{ marginTop: 20, maxWidth: '46ch' }}>
          {copy.contact.lead}
        </p>
      </Reveal>

      <Reveal delay={160}>
        <Magnetic
          href={`mailto:${copy.contact.email}`}
          className="contact__mail shard"
          strength={0.12}
        >
          {copy.contact.email}&nbsp;↗
        </Magnetic>
      </Reveal>

      <Reveal className="contact__social" delay={240}>
        {copy.contact.social.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="shard"
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </a>
        ))}
      </Reveal>
    </section>
  )
}
