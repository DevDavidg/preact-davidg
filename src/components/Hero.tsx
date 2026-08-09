import { useCopy } from '../lib/locale'
import { useSceneStore } from '../scene/sceneState'
import { MagneticAction } from './ui/Action'
import { Reveal } from './ui/Reveal'
import { WeightMorphHeading } from './ui/WeightMorphHeading'

/**
 * The opening chapter, and the fork between the two audiences.
 *
 * The headline is a promise rather than the name — the name is already the mark in
 * the nav, the document title and the schema, so spending the largest type on it
 * again told a visitor nothing. Two calls to action follow, one per audience, so
 * neither a client nor a recruiter has to guess which path is theirs.
 */
export const Hero = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const booted = useSceneStore((state) => state.booted)

  return (
    <section
      id="hero"
      tabIndex={-1}
      aria-labelledby="hero-heading"
      className="scrim relative flex min-h-svh flex-col justify-center px-gutter pb-24 pt-[calc(var(--spacing-nav)+6rem)] focus-visible:outline-none"
    >
      <Reveal className="flex flex-col gap-6">
        <p className="text-eyebrow shard shard-fine flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-ignition motion-safe:animate-signal-blink"
          />
          {copy.hero.eyebrow}
        </p>

        {/* The H1 is the promise. `WeightMorphHeading` only adds a pointer-driven
            weight response on top of real, selectable text. */}
        <WeightMorphHeading
          id="hero-heading"
          text={copy.hero.headline}
          className="max-w-[18ch] text-[clamp(2.5rem,7vw,5.75rem)]"
        />
      </Reveal>

      <div className="mt-12 flex flex-col gap-10 lg:mt-16 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <Reveal className="flex max-w-xl flex-col gap-8" delay={120}>
          <p className="text-lead shard">{copy.hero.lead}</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <MagneticAction
              to="#contact"
              anchor
              variant="primary"
              event="hero_intent"
              eventDetail="client"
            >
              {copy.hero.ctaClient}
            </MagneticAction>
            <MagneticAction
              to="#experience"
              anchor
              variant="ghost"
              event="hero_intent"
              eventDetail="recruiter"
            >
              {copy.hero.ctaRecruiter}
            </MagneticAction>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <dl className="text-meta flex flex-col gap-2 lg:text-right">
            <div className="shard shard-fine">
              <dt className="sr-only">{copy.hero.eyebrow}</dt>
              <dd>{copy.hero.factExperience}</dd>
            </div>
            <div className="shard shard-fine">
              <dt className="sr-only">Stack</dt>
              <dd>{copy.hero.factStack}</dd>
            </div>
            <div className="shard shard-fine flex items-center gap-2 text-ink lg:justify-end">
              <dt className="sr-only">Base</dt>
              <dd className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-ignition"
                />
                {copy.hero.factAvailability}
              </dd>
            </div>
          </dl>
        </Reveal>
      </div>

      {/*
        The scroll cue only makes sense while a scroll-driven scene exists, and
        only once the intro has finished. Its own bob is on the inner elements so
        it composes with the arrival transform.
      */}
      {experience === 'cinema' ? (
        <a
          href="#work"
          aria-label={copy.hero.cue}
          data-shown={booted}
          className="group absolute inset-x-0 bottom-8 mx-auto hidden w-fit flex-col items-center gap-2 opacity-0 transition-opacity duration-chapter ease-signal data-[shown=true]:opacity-100 lg:flex"
        >
          <span className="text-meta motion-safe:animate-signal-bob">
            {copy.hero.cue}
          </span>
          <span
            aria-hidden="true"
            className="text-meta flex size-9 items-center justify-center rounded-full border border-line-strong transition-colors duration-hover ease-signal group-hover:border-line-signal group-hover:text-ignition"
          >
            <svg
              viewBox="0 0 12 12"
              className="size-3 fill-none stroke-current stroke-[1.5]"
            >
              <path d="M6 1v9M2.5 6.5L6 10l3.5-3.5" />
            </svg>
          </span>
        </a>
      ) : null}
    </section>
  )
}
