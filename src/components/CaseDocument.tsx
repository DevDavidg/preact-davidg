import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { nextCase, type CaseStudy } from '../content'
import { useCopy } from '../lib/locale'
import { casePath, homePath } from '../lib/routes'
import { SITE_NAME } from '../lib/site'
import { SiteShell } from './SiteShell'
import { Action } from './ui/Action'
import { CaseImage, ExternalArrow, TagList } from './ui/CaseCard'

/**
 * The case study as a document.
 *
 * The reactor corridor is optional. This is what a crawler, a visitor without
 * WebGL, or a metered connection actually reads — the full brief, not the
 * three sr-only sentences the scroll rail used to ship.
 */
export const CaseDocument = ({
  study,
  children,
}: {
  study: CaseStudy
  children?: ReactNode
}) => {
  const { copy, locale } = useCopy()
  const following = nextCase(locale, study.slug)
  const home = homePath(locale)

  return (
    <SiteShell>
      {children}
      <article className="mx-auto max-w-3xl px-gutter pb-32 pt-[calc(var(--spacing-nav)+3rem)]">
        <nav aria-label={copy.work.featuredLabel} className="text-meta">
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
            <li>
              <Link
                to={`${home}#work`}
                className="text-ink-soft transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
              >
                {copy.work.featuredLabel}
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-dim">
              /
            </li>
            <li className="text-ink" aria-current="page">
              {study.title}
            </li>
          </ol>
        </nav>

        <header id="case-overview" className="mt-10 flex flex-col gap-5">
          <p className="text-eyebrow">{study.kindLabel}</p>
          <h1 className="text-display text-4xl sm:text-5xl">{study.title}</h1>
          <TagList tags={study.tags} />
          <p className="text-lead">{study.summary}</p>
        </header>

        <figure className="mt-10 overflow-hidden border border-line">
          <CaseImage study={study} priority />
        </figure>

        <div id="case-deep" className="mt-14 flex flex-col gap-12">
          <section aria-labelledby="case-problem">
            <h2 id="case-problem" className="text-eyebrow">
              {copy.caseStudy.problem}
            </h2>
            <p className="text-body mt-3">{study.problem}</p>
          </section>

          <section aria-labelledby="case-role">
            <h2 id="case-role" className="text-eyebrow">
              {copy.caseStudy.role}
            </h2>
            <p className="text-body mt-3">{study.role}</p>
          </section>

          <section aria-labelledby="case-scope">
            <h2 id="case-scope" className="text-eyebrow">
              {copy.caseStudy.scope}
            </h2>
            <p className="text-body mt-3">{study.scope}</p>
          </section>

          <section aria-labelledby="case-stack">
            <h2 id="case-stack" className="text-eyebrow">
              {copy.caseStudy.stack}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {study.stack.map((item) => (
                <li
                  key={item}
                  className="text-meta border border-line px-2 py-1 text-ink"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="case-constraints">
            <h2 id="case-constraints" className="text-eyebrow">
              {copy.caseStudy.constraints}
            </h2>
            <ul className="text-body mt-3 flex list-disc flex-col gap-2 pl-5">
              {study.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="case-decisions">
            <h2 id="case-decisions" className="text-eyebrow">
              {copy.caseStudy.decisions}
            </h2>
            <ul className="mt-6 flex flex-col gap-8">
              {study.decisions.map((decision) => (
                <li key={decision.title}>
                  <h3 className="text-display text-xl">{decision.title}</h3>
                  <p className="text-body mt-2">{decision.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="case-contribution">
            <h2 id="case-contribution" className="text-eyebrow">
              {copy.caseStudy.contribution}
            </h2>
            <ul className="text-body mt-3 flex list-disc flex-col gap-2 pl-5">
              {study.contribution.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div id="case-close" className="mt-14 flex flex-col gap-12">
          <section aria-labelledby="case-evidence">
            <h2 id="case-evidence" className="text-eyebrow">
              {copy.caseStudy.evidence}
            </h2>
            <ul className="text-body mt-3 flex list-disc flex-col gap-2 pl-5">
              {study.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="case-outcome">
            <h2 id="case-outcome" className="text-eyebrow text-ignition">
              {copy.caseStudy.outcome}
            </h2>
            <p className="text-body mt-3 border-l border-line-signal pl-4 text-ink">
              {study.outcome}
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-4">
          {study.demoUrl ? (
            <Action
              to={study.demoUrl}
              variant="primary"
              event="demo_open"
              eventDetail={study.slug}
            >
              {copy.caseStudy.viewDemo}
              <ExternalArrow />
            </Action>
          ) : (
            <p className="text-meta">{copy.caseStudy.noDemo}</p>
          )}
          {study.repoUrl ? (
            <Action
              to={study.repoUrl}
              variant="ghost"
              event="repo_open"
              eventDetail={study.slug}
            >
              {copy.caseStudy.viewRepo}
              <ExternalArrow />
            </Action>
          ) : null}
        </div>

        <footer className="mt-20 flex flex-col gap-4 border-t border-line pt-8">
          <Action to={`${home}#work`} variant="quiet">
            {copy.caseStudy.backToWork}
          </Action>
          <p className="text-meta">{copy.caseStudy.nextCase}</p>
          <Link
            to={casePath(locale, following.slug)}
            viewTransition
            className="text-display text-2xl transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
          >
            {following.title}
          </Link>
        </footer>
      </article>
    </SiteShell>
  )
}
