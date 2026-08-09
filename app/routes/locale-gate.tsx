import { useEffect } from 'react'
import { Link, useNavigate, type MetaFunction } from 'react-router'
import { COPY, DEFAULT_LOCALE, LOCALES } from '../../src/content'
import { readPreferredLocale } from '../../src/lib/locale'
import { homePath, LOCALE_GATE_PATH } from '../../src/lib/routes'
import { pageMeta } from '../../src/lib/seo'
import { PERSON } from '../../src/lib/site'

/**
 * `/` is the `x-default` entry point. It is a real page with real links to both
 * languages — never an IP or header guess — so a crawler can reach both versions
 * and a visitor without JavaScript can still choose.
 *
 * Visitors who do run JavaScript are moved to their remembered or browser-preferred
 * language immediately, which is why the markup stays deliberately small.
 */
export const meta: MetaFunction = () => [
  ...pageMeta({
    locale: DEFAULT_LOCALE,
    path: LOCALE_GATE_PATH,
    title: COPY[DEFAULT_LOCALE].meta.title,
    description: COPY[DEFAULT_LOCALE].meta.description,
  }),
]

const LocaleGate = () => {
  const copy = COPY[DEFAULT_LOCALE]
  const navigate = useNavigate()

  useEffect(() => {
    const preferred = readPreferredLocale() ?? DEFAULT_LOCALE
    navigate(homePath(preferred), { replace: true })
  }, [navigate])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-gutter py-24">
      <p className="text-meta">{PERSON.jobTitle}</p>
      <h1 className="text-display text-3xl sm:text-5xl">
        {copy.localeGate.title}
      </h1>
      <p className="text-lead">{copy.localeGate.lead}</p>

      <ul className="flex flex-col gap-3 sm:flex-row">
        {LOCALES.map((locale) => (
          <li key={locale}>
            <Link
              to={homePath(locale)}
              hrefLang={locale}
              lang={locale}
              className="text-eyebrow inline-flex min-h-11 items-center border border-line-strong px-6 text-ink transition-colors duration-hover ease-signal pointer-fine:hover:border-line-signal pointer-fine:hover:text-ignition"
            >
              {copy.localeGate.choose[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default LocaleGate
