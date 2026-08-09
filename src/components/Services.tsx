import { useCopy } from '../lib/locale'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/**
 * Three offers, written as problems rather than as a technology list.
 *
 * The rows used to change background on hover while doing nothing when clicked,
 * which promised an interaction that did not exist. They are static content now:
 * definition lists, no hover affordance, no dead click target.
 */
export const Services = () => {
  const { copy } = useCopy()

  return (
    <Section
      id="services"
      label={copy.services.label}
      heading={copy.services.heading}
      intro={copy.services.intro}
      scrim
    >
      <ul className="mt-14 flex flex-col gap-px bg-line">
        {copy.services.items.map((item, index) => (
          <Reveal
            as="li"
            key={item.title}
            data-hairline
            className="bg-reactor p-6 sm:p-8 lg:p-10"
            delay={index * 80}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
              <div className="shard flex items-baseline gap-4">
                <span className="text-meta tabular">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-display text-xl sm:text-2xl">{item.title}</h3>
              </div>

              <dl className="shard flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <dt className="text-meta">{copy.services.problemLabel}</dt>
                  <dd className="text-body text-sm">{item.problem}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-meta text-ignition">
                    {copy.services.deliverableLabel}
                  </dt>
                  <dd className="text-body text-sm text-ink">{item.deliverable}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-meta">{copy.services.timelineLabel}</dt>
                  <dd className="text-body text-sm">{item.timeline}</dd>
                </div>
              </dl>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
