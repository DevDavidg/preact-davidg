import { Link, useLocation, useParams, type MetaFunction } from 'react-router'
import { JsonLd } from '../../src/components/JsonLd'
import { SiteShell } from '../../src/components/SiteShell'
import { Action } from '../../src/components/ui/Action'
import { Arrow, CaseImage, TagList } from '../../src/components/ui/CaseCard'
import { Reveal } from '../../src/components/ui/Reveal'
import { COPY, findCase, isLocale, nextCase } from '../../src/content'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { casePath, homePath } from '../../src/lib/routes'
import { caseSchema, pageMeta } from '../../src/lib/seo'
import { useAnchorScroll } from '../../src/motion/scroll'
import NotFound from './not-found'

export const meta: MetaFunction = ({ params, location }) => {
  const locale = isLocale(params.locale) ? params.locale : 'es'
  const study = findCase(locale, params.slug)

  // The localised segment has to match the locale, otherwise `/en/proyectos/x`
  // would serve the same content as `/en/work/x` at a second URL.
  if (!study || location.pathname !== casePath(locale, study.slug)) {
    return pageMeta({
      locale,
      path: location.pathname,
      title: `${COPY[locale].notFound.title} — David Guillen`,
      description: COPY[locale].notFound.lead,
      noindex: true,
    })
  }

  return pageMeta({
    locale,
    path: casePath(locale, study.slug),
    title: `${study.title} — ${COPY[locale].work.caseOf} — David Guillen`,
    description: study.summary,
    image: study.image.src,
    imageAlt: study.image.alt,
    ogType: 'article',
  })
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-2">
    {items.map((item) => (
      <li key={item} className="text-body flex gap-3 text-sm">
        <span aria-hidden="true" className="mt-2 size-1 shrink-0 bg-ignition" />
        {item}
      </li>
    ))}
  </ul>
)

const Block = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Reveal className="flex flex-col gap-4 border-t border-line pt-8">
    <h2 className="text-eyebrow shard shard-fine">{title}</h2>
    <div className="shard">{children}</div>
  </Reveal>
)

/**
 * One case study, prerendered per locale.
 *
 * Every section answers a question a client or a hiring reader actually asks —
 * problem, role, constraints, decisions, what was built, what can be verified —
 * because a screenshot and a stack list prove nothing about the thinking.
 */
const Case = () => {
  const params = useParams()
  const { pathname } = useLocation()
  const { copy, locale } = useCopy()
  useAnchorScroll()

  const study = findCase(locale, params.slug)

  // Wrong locale segment, or an unknown slug: a real 404 rather than a near miss.
  if (!study || pathname !== casePath(locale, study.slug)) return <NotFound />

  const labels = copy.caseStudy
  const upcoming = nextCase(locale, study.slug)

  return (
    <SiteShell>
      <JsonLd schemas={caseSchema(locale, study)} />
      <article className="px-gutter pb-24 pt-[calc(var(--spacing-nav)+4rem)]">
        <Reveal className="flex flex-col gap-6">
          <Link
            to={`${homePath(locale)}#work`}
            className="text-meta shard shard-fine inline-flex min-h-11 w-fit items-center gap-2 text-ink-dim transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
          >
            <span aria-hidden="true" className="rotate-180">
              <Arrow />
            </span>
            {labels.backToWork}
          </Link>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className={`text-meta border px-2 py-1 ${
                study.kind === 'product'
                  ? 'border-line-signal text-ignition'
                  : 'border-line text-ink-dim'
              }`}
            >
              {study.kindLabel}
            </span>
            <TagList tags={study.tags} />
          </div>

          <h1 className="text-display shard text-[clamp(2.25rem,6vw,4.5rem)]">
            {study.title}
          </h1>
          <p className="text-lead shard max-w-[52ch]">{study.summary}</p>

          <div className="flex flex-wrap gap-3">
            {study.demoUrl ? (
              <span className="shard inline-flex">
                <Action
                  to={study.demoUrl}
                  variant="primary"
                  event="demo_open"
                  eventDetail={study.slug}
                >
                  {labels.viewDemo}
                </Action>
              </span>
            ) : (
              <span className="text-meta shard inline-flex min-h-11 items-center border border-line px-4">
                {labels.noDemo}
              </span>
            )}
            {study.repoUrl ? (
              <span className="shard inline-flex">
                <Action
                  to={study.repoUrl}
                  variant="ghost"
                  event="repo_open"
                  eventDetail={study.slug}
                >
                  {labels.viewRepo}
                </Action>
              </span>
            ) : null}
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <div
            data-hairline
            className="shard shard-plate overflow-hidden border border-line"
          >
            <CaseImage study={study} priority />
          </div>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="flex flex-col gap-12">
            <Block title={labels.outcome}>
              <p className="text-body border-l border-line-signal pl-4 text-ink">
                {study.outcome}
              </p>
            </Block>

            <Block title={labels.problem}>
              <p className="text-body">{study.problem}</p>
            </Block>

            {study.constraints.length > 0 ? (
              <Block title={labels.constraints}>
                <Bullets items={study.constraints} />
              </Block>
            ) : null}

            {study.decisions.length > 0 ? (
              <Block title={labels.decisions}>
                <ul className="flex flex-col gap-6">
                  {study.decisions.map((decision) => (
                    <li key={decision.title} className="flex flex-col gap-2">
                      <h3 className="text-display text-lg">{decision.title}</h3>
                      <p className="text-body text-sm">{decision.body}</p>
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}

            <Block title={labels.contribution}>
              <Bullets items={study.contribution} />
            </Block>

            <Block title={labels.evidence}>
              <Bullets items={study.evidence} />
            </Block>
          </div>

          <Reveal className="lg:sticky lg:top-[calc(var(--spacing-nav)+3rem)] lg:self-start">
            <dl
              data-hairline
              className="shard flex flex-col gap-5 border border-line bg-graphite/60 p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-1">
                <dt className="text-meta">{labels.role}</dt>
                <dd className="text-body text-sm">{study.role}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-meta">{labels.scope}</dt>
                <dd className="text-body text-sm">{study.scope}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-meta">{labels.stack}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {study.stack.map((item) => (
                    <span
                      key={item}
                      className="text-meta border border-line px-2 py-0.5 normal-case tracking-normal"
                    >
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal className="mt-20 border-t border-line pt-8">
          <p className="text-meta shard shard-fine">{labels.nextCase}</p>
          <h2 className="text-display shard mt-3 text-2xl sm:text-3xl">
            <Link
              to={casePath(locale, upcoming.slug)}
              viewTransition
              onClick={() => trackEvent('case_open', upcoming.slug)}
              className="inline-flex items-center gap-3 transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
            >
              {upcoming.title}
              <Arrow />
            </Link>
          </h2>
        </Reveal>
      </article>
    </SiteShell>
  )
}

export default Case
