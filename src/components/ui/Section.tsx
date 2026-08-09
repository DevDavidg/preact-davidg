import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

interface SectionProps {
  id: string
  /** Machine label shown above the heading, e.g. `01 — WORK`. */
  label: string
  heading: string
  intro?: string
  children: ReactNode
  /** Adds the directional scrim for copy sitting straight on the scene. */
  scrim?: boolean
  className?: string
}

/**
 * One chapter of the home page.
 *
 * `tabIndex={-1}` makes the section a focus target so anchor navigation can move
 * the keyboard caret into it, rather than jumping the viewport while focus stays
 * behind in the nav.
 */
export const Section = ({
  id,
  label,
  heading,
  intro,
  children,
  scrim = false,
  className,
}: SectionProps) => (
  <section
    id={id}
    tabIndex={-1}
    aria-labelledby={`${id}-heading`}
    className={`relative px-gutter py-24 focus-visible:outline-none sm:py-32${
      scrim ? ' scrim' : ''
    }${className ? ` ${className}` : ''}`}
  >
    <Reveal className="flex flex-col gap-4">
      <p className="text-eyebrow shard shard-fine">{label}</p>
      <h2
        id={`${id}-heading`}
        className="text-display shard max-w-4xl text-3xl sm:text-4xl lg:text-5xl"
      >
        {heading}
      </h2>
      {intro ? <p className="text-lead shard mt-2">{intro}</p> : null}
    </Reveal>

    {children}
  </section>
)
