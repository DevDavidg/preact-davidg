import { Link } from 'react-router'
import type { CaseStudy, Locale } from '../../content'
import { trackEvent } from '../../lib/analytics'
import { casePath } from '../../lib/routes'
import { sceneState } from '../../scene/sceneState'
import { Reveal } from './Reveal'

/** Shared element name for the home → case study morph. */
const caseImageName = (slug: string) => `case-image-${slug}`

interface CaseImageProps {
  study: CaseStudy
  /** Above-the-fold cards decode eagerly; everything else waits. */
  priority?: boolean
  className?: string
}

/**
 * Explicit `width`/`height` on every project shot: these are the largest images on
 * the page and without intrinsic dimensions each one reflows the section below it
 * as it decodes.
 *
 * Modern formats are offered through `<picture>` and only exist when they actually
 * beat the JPEG — the asset pipeline deletes them otherwise, and a missing source
 * in a `<picture>` simply falls through to the next one.
 *
 * Deliberately no `fetchPriority`: React 19 hoists an automatic preload `<link>` for
 * high-priority images during server render but not during hydration, which fails
 * hydration on every prerendered page. Where a preload is genuinely wanted, the
 * route declares it in `meta` so both passes agree.
 */
export const CaseImage = ({ study, priority = false, className }: CaseImageProps) => {
  const stem = study.image.src.replace(/\.jpe?g$/, '')

  return (
    <picture>
      <source srcSet={`${stem}.avif`} type="image/avif" />
      <source srcSet={`${stem}.webp`} type="image/webp" />
      <img
        src={study.image.src}
        alt={study.image.alt}
        width={study.image.width}
        height={study.image.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        sizes="(max-width: 900px) 100vw, 50vw"
        style={{ viewTransitionName: caseImageName(study.slug) }}
        className={`aspect-16/10 w-full bg-graphite object-cover${
          className ? ` ${className}` : ''
        }`}
      />
    </picture>
  )
}

const KindBadge = ({ study }: { study: CaseStudy }) => (
  <span
    className={`text-meta inline-flex items-center gap-2 border px-2 py-1 ${
      study.kind === 'product'
        ? 'border-line-signal text-ignition'
        : 'border-line text-ink-dim'
    }`}
  >
    {study.kindLabel}
  </span>
)

/**
 * Tags need a visible separator. Set in mono at wide tracking and run together, three
 * tags read as one long phrase — "DIRECCIÓN DE ARTE LANDING TIPOGRAFÍA" is three
 * things, and nothing in the type told the reader that.
 */
const TagList = ({ tags }: { tags: string[] }) => (
  <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
    {tags.map((tag, index) => (
      <li key={tag} className="text-meta flex items-center gap-2">
        {index > 0 ? (
          <span aria-hidden="true" className="text-ink-dim/50">
            ·
          </span>
        ) : null}
        {tag}
      </li>
    ))}
  </ul>
)

interface FeaturedCardProps {
  study: CaseStudy
  index: number
  locale: Locale
  labels: {
    openCase: string
    openDemo: string
    outcome: string
  }
}

/**
 * A featured project, as a readable dossier.
 *
 * Previously the desktop gallery lived only inside the canvas, with the real links
 * clipped off-screen for screen readers — so a visitor with a mouse could see six
 * projects and open none of them. The card is now the primary way in at every
 * quality; the 3D module beside it is the accompaniment, and hovering the card is
 * what tells the scene which module to light.
 */
export const FeaturedCard = ({
  study,
  index,
  locale,
  labels,
}: FeaturedCardProps) => {
  const focusModule = () => {
    sceneState.focus = index
  }
  const blurModule = () => {
    sceneState.focus = -1
  }

  return (
    <Reveal
      as="li"
      // The motion runtime binds a scroll trigger to this index, so the matching
      // 3D module lights on touch where there is no hover to read.
      data-module-index={index}
      className="group grid gap-6 border-t border-line pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12"
      delay={index * 80}
    >
      <Link
        to={casePath(locale, study.slug)}
        viewTransition
        tabIndex={-1}
        aria-hidden="true"
        onMouseEnter={focusModule}
        onMouseLeave={blurModule}
        className="shard shard-plate block overflow-hidden border border-line transition-colors duration-state ease-signal pointer-fine:group-hover:border-line-signal"
      >
        <CaseImage study={study} priority={index === 0} />
      </Link>

      <div className="shard flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <KindBadge study={study} />
          <TagList tags={study.tags} />
        </div>

        <h3 className="text-display text-2xl sm:text-3xl">
          <Link
            to={casePath(locale, study.slug)}
            viewTransition
            onFocus={focusModule}
            onBlur={blurModule}
            onMouseEnter={focusModule}
            onMouseLeave={blurModule}
            onClick={() => trackEvent('case_open', study.slug)}
            className="transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
          >
            {study.title}
          </Link>
        </h3>

        <p className="text-body">{study.summary}</p>

        <p className="text-body border-l border-line-signal pl-4 text-ink">
          <span className="text-meta mb-1 block text-ignition">
            {labels.outcome}
          </span>
          {study.outcome}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to={casePath(locale, study.slug)}
            viewTransition
            onClick={() => trackEvent('case_open', study.slug)}
            className="text-eyebrow inline-flex min-h-11 items-center gap-2 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
          >
            {labels.openCase}
            <Arrow />
          </Link>

          {study.demoUrl ? (
            <a
              href={study.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('demo_open', study.slug)}
              className="text-eyebrow inline-flex min-h-11 items-center gap-2 text-ink-dim transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
            >
              {labels.openDemo}
              <ExternalArrow />
            </a>
          ) : null}
        </div>
      </div>
    </Reveal>
  )
}

/**
 * Arrows are drawn rather than typed: the glyphs are outside the subsetted font
 * range, so a text arrow would fall back to a system face mid-sentence.
 */
const Arrow = () => (
  <svg
    viewBox="0 0 14 10"
    aria-hidden="true"
    className="size-3 shrink-0 fill-none stroke-current stroke-[1.5]"
  >
    <path d="M0 5h13M9 1l4 4-4 4" />
  </svg>
)

const ExternalArrow = () => (
  <svg
    viewBox="0 0 12 12"
    aria-hidden="true"
    className="size-3 shrink-0 fill-none stroke-current stroke-[1.5]"
  >
    <path d="M4 8l5-5M4.5 3H9v4.5" />
  </svg>
)

interface CompactCardProps {
  study: CaseStudy
  locale: Locale
  labels: { openCase: string; openDemo: string }
}

/** Lab and archive entries: same information architecture, less real estate. */
export const CompactCard = ({ study, locale, labels }: CompactCardProps) => (
  <Reveal
    as="li"
    className="grid gap-4 border-t border-line py-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
  >
    <Link
      to={casePath(locale, study.slug)}
      viewTransition
      tabIndex={-1}
      aria-hidden="true"
      className="shard shard-plate block overflow-hidden border border-line"
    >
      <CaseImage study={study} className="aspect-16/10" />
    </Link>

    <div className="shard flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge study={study} />
      </div>
      <h3 className="text-display text-lg">
        <Link
          to={casePath(locale, study.slug)}
          viewTransition
          onClick={() => trackEvent('case_open', study.slug)}
          className="transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
        >
          {study.title}
        </Link>
      </h3>
      <p className="text-body text-sm">{study.summary}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-5">
        <Link
          to={casePath(locale, study.slug)}
          viewTransition
          onClick={() => trackEvent('case_open', study.slug)}
          className="text-meta inline-flex min-h-11 items-center gap-2 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
        >
          {labels.openCase}
          <Arrow />
        </Link>
        {study.demoUrl ? (
          <a
            href={study.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('demo_open', study.slug)}
            className="text-meta inline-flex min-h-11 items-center gap-2 text-ink-dim transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
          >
            {labels.openDemo}
            <ExternalArrow />
          </a>
        ) : null}
      </div>
    </div>
  </Reveal>
)

export { Arrow, ExternalArrow, TagList }
