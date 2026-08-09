import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useCopy } from '../lib/locale'
import { useSceneStore } from '../scene/sceneState'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

interface ProcessStepProps {
  phase: string
  heading: string
  body: string
  dimmed: boolean
}

/**
 * One calibration phase.
 *
 * `dimmed` styles only the phase label, never the prose. The previous version
 * dropped the whole step to 40% opacity, which pushed informational body text well
 * below the contrast floor for every phase the reader was not currently on.
 */
const ProcessStep = ({ phase, heading, body, dimmed }: ProcessStepProps) => {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div ref={ref} data-shown={inView} className="flex flex-col gap-3">
      <p
        className={`text-meta shard shard-fine transition-colors duration-state ease-signal ${
          dimmed ? 'text-ink-dim' : 'text-ignition'
        }`}
      >
        {phase}
      </p>
      <h3 className="text-display shard text-xl sm:text-2xl">{heading}</h3>
      <p className="text-body shard max-w-[52ch]">{body}</p>
    </div>
  )
}

/**
 * The four calibration phases.
 *
 * An ordered list, because the order is the content. The sticky numeral tracks the
 * phase the reader is in; the 3D layer answers by transforming a single piece
 * rather than spelling the same numeral again in the room.
 */
export const Process = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const container = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const node = container.current
    if (!node) return

    const steps = node.querySelectorAll<HTMLElement>('[data-step-index]')
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.find((entry) => entry.isIntersecting)
        if (!entering) return
        setActive(Number(entering.target.getAttribute('data-step-index') ?? 0))
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )

    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  const step = copy.process.steps[active]

  return (
    <Section
      id="process"
      label={copy.process.label}
      heading={copy.process.heading}
      scrim
    >
      <div
        ref={container}
        className="mt-14 grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-24"
      >
        <Reveal className="lg:sticky lg:top-[calc(var(--spacing-nav)+4rem)] lg:self-start">
          <div
            data-hairline
            className="border border-line bg-graphite/60 p-7 backdrop-blur-sm"
          >
            {/*
              Decorative: the active step's own heading already announces the
              phase, so repeating the numeral to a screen reader would be noise.
              `key` restarts the rise on each change; opacity and transform only,
              never a blur, which would soften type and repaint over the canvas.
            */}
            <p
              aria-hidden="true"
              key={step.num}
              className="text-display text-[clamp(5rem,10vw,9rem)] leading-none text-ink-dim/40 motion-safe:animate-[vt-rise-in_var(--duration-state)_var(--ease-signal)]"
            >
              {step.num}
            </p>
            <p className="text-display shard mt-3 text-2xl">{step.title}</p>
            <p className="text-body shard mt-3 max-w-[28ch] text-sm">
              {copy.process.caption}
            </p>
          </div>
        </Reveal>

        <ol className="flex flex-col">
          {copy.process.steps.map((item, index) => (
            <li
              key={item.num}
              data-step-index={index}
              className="border-t border-line py-10 sm:py-14"
            >
              <ProcessStep
                phase={item.phase}
                heading={item.heading}
                body={item.copy}
                // Before the capability check resolves there is no scroll
                // choreography yet, so nothing should read as inactive.
                dimmed={experience !== 'checking' && active !== index}
              />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
