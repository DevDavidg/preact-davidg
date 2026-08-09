import { Link, useLocation, type MetaFunction } from 'react-router'
import { COPY } from '../../src/content'
import { localeFromPath } from '../../src/lib/locale'
import { homePath, NOT_FOUND_PATH } from '../../src/lib/routes'
import { pageMeta } from '../../src/lib/seo'

/**
 * Prerendered to `/404.html` so a static host can serve it with a real 404
 * status, and reused as the catch-all so an unknown client-side route lands
 * somewhere navigable instead of on a blank screen.
 */
export const meta: MetaFunction = ({ location }) => {
  const locale = localeFromPath(location.pathname)
  return pageMeta({
    locale,
    path: NOT_FOUND_PATH,
    title: `${COPY[locale].notFound.title} — David Guillen`,
    description: COPY[locale].notFound.lead,
    noindex: true,
  })
}

const NotFound = () => {
  const { pathname } = useLocation()
  const locale = localeFromPath(pathname)
  const copy = COPY[locale]

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-gutter py-24">
      <p className="text-meta">404</p>
      <h1 className="text-display text-4xl sm:text-6xl">
        {copy.notFound.title}
      </h1>
      <p className="text-lead">{copy.notFound.lead}</p>
      <Link
        to={homePath(locale)}
        className="text-eyebrow inline-flex min-h-11 w-fit items-center border border-line-strong px-6 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition"
      >
        {copy.notFound.cta}
      </Link>
    </main>
  )
}

export default NotFound
