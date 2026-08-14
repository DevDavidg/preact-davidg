import { useEffect, useRef, useState } from 'react'
import { addTick } from '../motion/ticker'
import { trackEvent } from '../lib/analytics'
import { useCopy } from '../lib/locale'
import { livePowerFor, sceneState, useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'
import { ExternalArrow } from './ui/CaseCard'
import { MagneticAction } from './ui/Action'

/**
 * Ignition: the last chapter and the only place the accent is allowed to take over.
 *
 * The call to action says what it does. It used to promise a fifteen-minute booking
 * and then scroll to a `mailto:` — there is no calendar, so the label now matches
 * the destination, and a copy-to-clipboard alternative exists for anyone whose
 * device has no mail client wired up.
 */
export const Contact = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const indicator = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState(false)

  // The live dot breathes with the reactor's actual charge, on the shared tick bus.
  useEffect(() => {
    const node = indicator.current
    if (!node) return

    if (experience === 'static' || experience === 'checking') {
      node.style.scale = '1'
      return
    }

    const tick = () => {
      // `scale` as an individual property so it composes with the arrival
      // translate rather than replacing the whole transform.
      node.style.scale = (0.84 + livePowerFor(sceneState.build) * 0.16).toFixed(3)
    }

    return addTick(tick)
  }, [experience])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2400)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copy.contact.email)
      setCopied(true)
      trackEvent('email_copy')
    } catch {
      // Clipboard access can be denied; the mail link beside it still works.
    }
  }

  return (
    <section
      id="contact"
      tabIndex={-1}
      aria-labelledby="contact-heading"
      className="scrim relative flex min-h-svh flex-col justify-center px-gutter pb-32 pt-24 focus-visible:outline-none"
    >
      <Reveal className="flex flex-col gap-3">
        <p className="text-eyebrow shard shard-fine">{copy.contact.label}</p>
        <p className="text-meta shard shard-fine flex items-center gap-2 text-ignition">
          <span
            ref={indicator}
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-ignition motion-safe:animate-signal-pulse"
          />
          {copy.contact.live}
        </p>
      </Reveal>

      <Reveal className="mt-6 flex flex-col gap-6" delay={80}>
        <h2
          id="contact-heading"
          className="text-display shard max-w-[18ch] text-[clamp(2.25rem,5.5vw,4.5rem)]"
        >
          {copy.contact.title}
        </h2>
        <p className="text-lead shard max-w-[46ch]">{copy.contact.lead}</p>
      </Reveal>

      <Reveal className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center" delay={160}>
        <span className="shard inline-flex">
          <MagneticAction
            to={`mailto:${copy.contact.email}`}
            variant="primary"
            event="contact_click"
            eventDetail="email"
            ariaLabel={`${copy.contact.emailCta}: ${copy.contact.email}`}
          >
            {copy.contact.emailCta}
          </MagneticAction>
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="text-eyebrow shard inline-flex min-h-11 items-center gap-2 border border-line-strong px-6 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition"
        >
          {copied ? copy.contact.copiedEmail : copy.contact.copyEmail}
        </button>

        {/* Announced politely so the confirmation reaches a screen reader without
            interrupting whatever it is currently reading. */}
        <span aria-live="polite" className="sr-only">
          {copied ? copy.contact.copiedEmail : ''}
        </span>
      </Reveal>

      <Reveal className="mt-10 flex flex-col gap-4" delay={220}>
        <p className="text-body shard max-w-[42ch] text-sm">
          {copy.contact.responseTime}
        </p>

        <ul className="flex flex-wrap gap-x-8 gap-y-2">
          {copy.contact.social.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={() => trackEvent('contact_click', link.label.toLowerCase())}
                data-print-url={link.href}
                {...(link.external
                  ? {
                      target: '_blank',
                      rel: /github\.com|linkedin\.com/.test(link.href)
                        ? 'me noopener noreferrer'
                        : 'noopener noreferrer',
                    }
                  : {})}
                className="text-meta shard shard-fine inline-flex min-h-11 items-center gap-2 text-ink-soft transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
              >
                {link.label}
                {link.external ? <ExternalArrow /> : null}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
