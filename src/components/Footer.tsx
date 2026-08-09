import { Link, useLocation } from 'react-router'
import { otherLocale } from '../content'
import { trackEvent } from '../lib/analytics'
import { rememberLocale, useCopy } from '../lib/locale'
import { translatePath } from '../lib/routes'

/**
 * Outside `<main>`: it is site-wide chrome, not part of the page's document
 * outline. The year is computed so it cannot go stale.
 */
export const Footer = () => {
  const { copy, locale } = useCopy()
  const { pathname } = useLocation()
  const target = otherLocale(locale)

  return (
    <footer
      data-print-hide
      className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-gutter py-6"
    >
      <p className="text-meta">
        © {new Date().getFullYear()} {copy.footer.copyright}
      </p>
      <p className="text-meta">{copy.footer.signature}</p>
      <Link
        to={translatePath(pathname, target)}
        hrefLang={target}
        lang={target}
        onClick={() => {
          rememberLocale(target)
          trackEvent('locale_switch', target)
        }}
        aria-label={copy.footer.localeSwitchLabel}
        className="text-meta inline-flex min-h-11 items-center text-ink-soft transition-colors duration-hover ease-signal pointer-fine:hover:text-ignition"
      >
        {copy.nav.langNames[target]}
      </Link>
    </footer>
  )
}
