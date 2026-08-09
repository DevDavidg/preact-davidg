import { useCopy } from '../lib/locale'
import { cvPath } from '../lib/routes'
import { Action } from './ui/Action'
import { Reveal } from './ui/Reveal'
import { Section } from './ui/Section'

/**
 * The recruiter path.
 *
 * Roles and context only: no invented date ranges, no business metrics that
 * cannot be shown. What a reader can verify here is where the work happened and
 * what the responsibility was, which is more useful than an unverifiable number.
 */
export const Experience = () => {
  const { copy, locale } = useCopy()

  const current = copy.experience.roles.filter((role) => role.current)
  const previous = copy.experience.roles.filter((role) => !role.current)

  const group = (label: string, roles: typeof copy.experience.roles) => (
    <div className="flex flex-col gap-6">
      <h3 className="text-eyebrow shard shard-fine">{label}</h3>
      <ul className="flex flex-col">
        {roles.map((role) => (
          <Reveal
            as="li"
            key={`${role.company}-${role.role}`}
            className="grid gap-1 border-t border-line py-6 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-8"
          >
            <p className="text-display shard text-lg">{role.company}</p>
            <div className="shard flex flex-col gap-1">
              <p className="text-meta text-ignition">{role.role}</p>
              <p className="text-body text-sm">{role.context}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  )

  return (
    <Section
      id="experience"
      label={copy.experience.label}
      heading={copy.experience.heading}
      intro={copy.experience.intro}
      scrim
    >
      <div className="mt-14 flex flex-col gap-14">
        {group(copy.experience.currentLabel, current)}
        {group(copy.experience.previousLabel, previous)}
      </div>

      <Reveal className="mt-12">
        <span className="shard inline-flex">
          <Action to={cvPath(locale)} variant="ghost" event="cv_view" eventDetail="experience">
            {copy.experience.cvCta}
          </Action>
        </span>
      </Reveal>
    </Section>
  )
}
