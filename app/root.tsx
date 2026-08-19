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

/**
 * The boot hold.
 *
 * The prerendered HTML *is* the complete document, which means it paints — the
 * headline, the project cards, all of it — the moment it arrives, before any
 * script has run. The 3D scene then replaced it a beat later, and that swap is
 * the "primero carga el portfolio y luego lo 3d" bug. No effect, layout or
 * otherwise, can run earlier than a paint that happens before JavaScript does,
 * so the hold has to be stated in the markup.
 *
 * This is a parser-blocking inline script in `<head>`: it stamps
 * `data-boot="hold"` on `<html>` before `<body>` is parsed, and the inline style
 * below keeps the body transparent over the reactor background for as long as
 * the stamp is there. `src/components/BootGate.tsx` releases it — on the first
 * settled frame of the scene, or immediately for visitors who are never getting
 * one.
 *
 * Three properties this shape has and a JS-only solution does not:
 * - Scripting off, or the bundle failing to load: the attribute is never
 *   stamped, so the document is simply visible. There is no cover to get stuck.
 * - It writes an ATTRIBUTE on an element React already owns, never a new node.
 *   A foreign child of `<html>` breaks hydration here (see the note in
 *   `src/scene/sceneColors.ts`); an extra attribute is left alone.
 * - The failsafe timeout is armed by this script, not by React, so it fires even
 *   if hydration never happens.
 *
 * Visitors who are getting the document anyway are not held at all, and neither
 * are pages that never mount a scene. Three cheap tests, in order:
 *
 * - The path. Only the localised routes — home, the case studies and the CV —
 *   bring up a reactor. `/` is the language picker and `/404` is a message; both
 *   are pure documents, and holding them meant a blank background until the
 *   failsafe fired 2.6 seconds later, because no `BootGate` was there to release
 *   them earlier.
 * - Data saver, and a connection slow enough that a 3D payload would be hostile.
 * - A crawler, which needs to see content rather than a canvas.
 *
 * Those last two are the cheap half of `detectQuality`; the WebGL probe is
 * deliberately left out, because a context allocation is not something to put on
 * the parser's critical path.
 */
const BOOT_HOLD_STYLE = [
  'html[data-boot="hold"]{background-color:#050608}',
  'html[data-boot="hold"] body{opacity:0!important}',
  // Nothing should be burning frames behind the hold.
  'html[data-boot="hold"] body *{animation-play-state:paused!important}',
].join('')

const BOOT_HOLD_SCRIPT = `(function(){try{
var d=document.documentElement,n=navigator,c=n.connection||{};
if(!/^\\/(es|en)(\\/|$)/.test(location.pathname))return;
if(c.saveData||c.effectiveType==='slow-2g'||c.effectiveType==='2g')return;
if(/bot|crawler|spider|preview|slurp|facebookexternalhit|linkedinbot|whatsapp|telegrambot|discordbot|gptbot|claudebot|perplexity|bytespider|applebot|bingpreview|duckduckbot|yandex|baiduspider/i.test(n.userAgent||''))return;
d.setAttribute('data-boot','hold');
setTimeout(function(){if(d.getAttribute('data-boot')==='hold')d.setAttribute('data-boot','open')},2600);
}catch(e){}})()`

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
        {/*
          Inline rather than in `theme.css`: the hold has to be in force for the
          very first paint, and a stylesheet is a separate request that the
          browser is free to still be fetching when the body arrives.
        */}
        <style dangerouslySetInnerHTML={{ __html: BOOT_HOLD_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: BOOT_HOLD_SCRIPT }} />
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
