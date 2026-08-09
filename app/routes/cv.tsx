import { useEffect } from 'react'
import { type MetaFunction } from 'react-router'
import { SiteShell } from '../../src/components/SiteShell'
import { Reveal } from '../../src/components/ui/Reveal'
import { allCases, COPY, isLocale } from '../../src/content'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { cvPath } from '../../src/lib/routes'
import { pageMeta } from '../../src/lib/seo'
import { PERSON } from '../../src/lib/site'

export const meta: MetaFunction = ({ params }) => {
  const locale = isLocale(params.locale) ? params.locale : 'es'
  const copy = COPY[locale]
  return pageMeta({
    locale,
    path: cvPath(locale),
    title: `${copy.cv.label} — David Guillen`,
    description: copy.cv.intro,
  })
}

/**
 * The CV as a real page rather than a PDF attachment.
 *
 * A binary résumé goes stale the moment the site changes, and it cannot be
 * indexed, translated or read on a phone without a download. This renders from the
 * same content model as the rest of the site and prints cleanly — the print
 * stylesheet in `scene.css` drops the chrome and inverts to ink on paper — so
 * "save as PDF" produces the document without a second source of truth.
 */
const Cv = () => {
  const { copy, locale } = useCopy()
  const cases = allCases(locale)

  useEffect(() => {
    trackEvent('cv_view', locale)
  }, [locale])

  const handlePrint = () => {
    trackEvent('cv_print', locale)
    window.print()
  }

  const heading = 'text-eyebrow shard shard-fine'

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-gutter pb-24 pt-[calc(var(--spacing-nav)+4rem)]">
        <Reveal className="flex flex-col gap-4">
          <p className={heading}>{copy.cv.label}</p>
          <h1 className="text-display shard text-3xl sm:text-4xl">
            {copy.cv.heading}
          </h1>
          <p className="text-lead shard">{copy.cv.intro}</p>

          <dl className="shard mt-2 flex flex-wrap gap-x-8 gap-y-2">
            <div className="flex gap-2">
              <dt className="text-meta">Mail</dt>
              <dd className="font-mono text-xs text-ink">
                <a
                  href={`mailto:${PERSON.email}`}
                  data-print-url={PERSON.email}
                  className="underline decoration-line-strong underline-offset-4"
                >
                  {PERSON.email}
                </a>
              </dd>
            </div>
            {PERSON.sameAs.map((href) => (
              <div key={href} className="flex gap-2">
                <dt className="sr-only">Link</dt>
                <dd className="font-mono text-xs text-ink">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-print-url={href}
                    className="underline decoration-line-strong underline-offset-4"
                  >
                    {new URL(href).hostname.replace('www.', '')}
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={handlePrint}
            data-print-hide
            className="text-eyebrow shard mt-4 inline-flex min-h-11 w-fit items-center border border-line-strong px-6 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition"
          >
            {copy.cv.print}
          </button>
        </Reveal>

        <Reveal className="mt-14 flex flex-col gap-4 border-t border-line pt-8">
          <h2 className={heading}>{copy.cv.sections.profile}</h2>
          <p className="text-body shard">{copy.about.copy}</p>
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-6 border-t border-line pt-8">
          <h2 className={heading}>{copy.cv.sections.experience}</h2>
          <ul className="shard flex flex-col gap-6">
            {copy.experience.roles.map((role) => (
              <li key={`${role.company}-${role.role}`} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-display text-lg">{role.company}</h3>
                  <p className="text-meta">
                    {role.current
                      ? copy.experience.currentLabel
                      : copy.experience.previousLabel}
                  </p>
                </div>
                <p className="text-meta text-ignition">{role.role}</p>
                <p className="text-body text-sm">{role.context}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-4 border-t border-line pt-8">
          <h2 className={heading}>{copy.cv.sections.skills}</h2>
          <dl className="shard flex flex-col">
            {copy.cv.skills.map((entry) => (
              <div
                key={entry.key}
                className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="text-meta">{entry.key}</dt>
                <dd className="text-body text-sm">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-4 border-t border-line pt-8">
          <h2 className={heading}>{copy.cv.sections.projects}</h2>
          <ul className="shard flex flex-col gap-4">
            {cases.map((study) => (
              <li key={study.slug} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="text-display text-base">{study.title}</h3>
                  <span className="text-meta">{study.kindLabel}</span>
                </div>
                <p className="text-body text-sm">{study.summary}</p>
                {study.demoUrl ? (
                  <a
                    href={study.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-print-url={study.demoUrl}
                    className="text-meta w-fit underline decoration-line-strong underline-offset-4"
                  >
                    {copy.caseStudy.viewDemo}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-12 grid gap-12 border-t border-line pt-8 sm:grid-cols-2">
          <Reveal className="flex flex-col gap-4">
            <h2 className={heading}>{copy.cv.sections.education}</h2>
            <dl className="shard flex flex-col gap-3">
              {copy.cv.education.map((entry) => (
                <div key={entry.key} className="flex flex-col gap-1">
                  <dt className="text-meta">{entry.key}</dt>
                  <dd className="text-body text-sm">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="flex flex-col gap-4">
            <h2 className={heading}>{copy.cv.sections.languages}</h2>
            <p className="text-body shard text-sm">
              {copy.about.spec.at(-1)?.value}
            </p>
          </Reveal>
        </div>
      </article>
    </SiteShell>
  )
}

export default Cv
