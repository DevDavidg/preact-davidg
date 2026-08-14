import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { allCases } from '../content'
import { trackEvent } from '../lib/analytics'
import { useCopy } from '../lib/locale'
import { casePath, homePath } from '../lib/routes'
import { SITE_NAME } from '../lib/site'
import { SiteShell } from './SiteShell'

/**
 * The CV as a document.
 *
 * Printable, indexable, and the fallback whenever the reactor is off. Same
 * facts as the rest of the site — the 3D route is a reading, not a second CV.
 */
export const CvDocument = ({ children }: { children?: ReactNode }) => {
  const { copy, locale } = useCopy()
  const home = homePath(locale)
  const cases = allCases(locale)
  const current = copy.experience.roles.filter((role) => role.current)
  const previous = copy.experience.roles.filter((role) => !role.current)

  const handlePrint = () => {
    trackEvent('cv_print')
    window.print()
  }

  const roleList = (
    label: string,
    roles: typeof copy.experience.roles,
  ) => (
    <div className="flex flex-col gap-6">
      <h3 className="text-eyebrow">{label}</h3>
      <ul className="flex flex-col">
        {roles.map((role) => (
          <li
            key={`${role.company}-${role.role}-${role.period}`}
            className="grid gap-1 border-t border-line py-6 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-8"
          >
            <div className="flex flex-col gap-1">
              <p className="text-display text-lg">{role.company}</p>
              <p className="text-meta text-ink-dim">{role.period}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-meta text-ignition">{role.role}</p>
              <p className="text-body text-sm">{role.context}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )

  const labelled = (items: { key: string; value: string }[]) => (
    <dl className="flex flex-col border-t border-line">
      {items.map((item) => (
        <div
          key={item.key}
          className="grid gap-2 border-b border-line py-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]"
        >
          <dt className="text-meta">{item.key}</dt>
          <dd className="text-body text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  )

  return (
    <SiteShell>
      {children}
      <article className="mx-auto max-w-3xl px-gutter pb-32 pt-[calc(var(--spacing-nav)+3rem)]">
        <nav aria-label={copy.cv.label} className="text-meta">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                to={home}
                className="text-ink-soft transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
              >
                {SITE_NAME}
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-dim">
              /
            </li>
            <li className="text-ink" aria-current="page">
              {copy.cv.label}
            </li>
          </ol>
        </nav>

        <header id="cv-profile" className="mt-10 flex flex-col gap-5">
          <p className="text-eyebrow">{copy.cv.label}</p>
          <h1 className="text-display text-4xl sm:text-5xl">{copy.cv.heading}</h1>
          <p className="text-lead">{copy.cv.intro}</p>
          <button
            type="button"
            data-print-hide
            onClick={handlePrint}
            className="text-eyebrow inline-flex min-h-11 w-fit items-center border border-line-strong px-6 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition"
          >
            {copy.cv.print}
          </button>
        </header>

        <section
          id="cv-experience"
          aria-labelledby="cv-experience-heading"
          className="mt-16"
        >
          <h2 id="cv-experience-heading" className="text-display text-2xl">
            {copy.cv.sections.experience}
          </h2>
          <div className="mt-8 flex flex-col gap-12">
            {roleList(copy.experience.currentLabel, current)}
            {roleList(copy.experience.previousLabel, previous)}
          </div>
        </section>

        <section
          id="cv-skills"
          aria-labelledby="cv-skills-heading"
          className="mt-16"
        >
          <h2 id="cv-skills-heading" className="text-display text-2xl">
            {copy.cv.sections.skills}
          </h2>
          <div className="mt-6">{labelled(copy.cv.skills)}</div>
        </section>

        <section aria-labelledby="cv-projects-heading" className="mt-16">
          <h2 id="cv-projects-heading" className="text-display text-2xl">
            {copy.cv.sections.projects}
          </h2>
          <ul className="mt-6 flex flex-col">
            {cases.map((study) => (
              <li key={study.slug} className="border-t border-line py-4">
                <Link
                  to={casePath(locale, study.slug)}
                  className="text-display text-lg transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
                >
                  {study.title}
                </Link>
                <p className="text-body mt-1 text-sm">{study.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cv-education-heading" className="mt-16">
          <h2 id="cv-education-heading" className="text-display text-2xl">
            {copy.cv.sections.education}
          </h2>
          <div className="mt-6">{labelled(copy.cv.education)}</div>
        </section>

        <section aria-labelledby="cv-languages-heading" className="mt-16">
          <h2 id="cv-languages-heading" className="text-display text-2xl">
            {copy.cv.sections.languages}
          </h2>
          <div className="mt-6">{labelled(copy.cv.languages)}</div>
        </section>
      </article>
    </SiteShell>
  )
}
