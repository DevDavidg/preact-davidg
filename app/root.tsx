import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  useLocation,
  useRouteError,
  type LinksFunction,
} from 'react-router'
import { COPY } from '../src/content'
import { localeFromPath } from '../src/lib/locale'
import { homePath } from '../src/lib/routes'

/*
 * Side-effect imports rather than `?url` + a `links` entry.
 *
 * With `?url`, the prerender pass and the client pass each emitted their own hashed
 * copy of the stylesheet — Tailwind generates its utilities per environment, so the
 * two files differed and so did their hashes. The `<link href>` in the prerendered
 * HTML then pointed at a different file than the one the client expected, which
 * failed hydration and made React discard the whole server-rendered tree.
 *
 * Imported this way, the bundler manifest is the single source of the href and
 * `<Links />` emits it identically in both passes.
 */
import './fonts.css'
import './theme.css'
import './scene.css'

/**
 * The document itself. Every page is prerendered to static HTML from here, so
 * `lang` is derived from the URL rather than from a preference the build cannot
 * know about.
 *
 * Fonts are preloaded rather than merely linked: they are on the critical path
 * for the headline, and they are small enough (≈95 kB subsetted) that the
 * round trip is the cost, not the bytes.
 */
export const links: LinksFunction = () => [
  {
    rel: 'preload',
    href: '/fonts/bricolage-grotesque.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/fonts/newsreader.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
  { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'sitemap', href: '/sitemap.xml', type: 'application/xml' },
  { rel: 'me', href: 'https://github.com/DevDavidg' },
  { rel: 'me', href: 'https://www.linkedin.com/in/david-guillen-5074281b8' },
]

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation()
  const locale = localeFromPath(pathname)

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        {/* No maximum-scale or user-scalable: pinch zoom stays available. */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#050608" />
        <meta name="application-name" content="David Guillen" />
        <meta name="author" content="David Guillen" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

const App = () => <Outlet />

export default App

/**
 * A thrown route error still has to leave a usable page behind, so the boundary
 * renders real navigation instead of a bare message.
 */
export const ErrorBoundary = () => {
  const error = useRouteError()
  const { pathname } = useLocation()
  const locale = localeFromPath(pathname)
  const copy = COPY[locale]

  const status = isRouteErrorResponse(error) ? error.status : 500
  const title = status === 404 ? copy.notFound.title : copy.notFound.title

  return (
    <main className="mx-gutter flex min-h-screen flex-col justify-center gap-6 py-24">
      <p className="text-meta">{status}</p>
      <h1 className="text-display text-4xl sm:text-6xl">{title}</h1>
      <p className="text-lead">{copy.notFound.lead}</p>
      <a
        href={homePath(locale)}
        className="text-eyebrow inline-flex w-fit items-center gap-2 border border-line-strong px-5 py-3 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition"
      >
        {copy.notFound.cta}
      </a>
    </main>
  )
}
