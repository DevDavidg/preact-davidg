import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { allCases } from '../content'
import { useCopy } from '../lib/locale'
import { casePath, cvPath, homePath, translatePath } from '../lib/routes'
import { rememberLocale } from '../lib/locale'
import { trackEvent } from '../lib/analytics'
import { otherLocale } from '../content'
import { useSceneStore } from '../scene/sceneState'

/**
 * The keyboard's way through the corridor.
 *
 * The 3D routes deliberately carry no navigation: every destination is a raycast
 * target on a console, which is the right call for a pointer and leaves a keyboard
 * with nothing. `SiteShell` — and with it the nav and the footer — never mounts on
 * these routes, so the only focusable things on the page were the operator panel's
 * law control. A visitor navigating by Tab could not reach a
 * single case study, the CV, or the email address: the entire portfolio was
 * pointer-only, which is a WCAG 2.1.1 failure and, more plainly, a portfolio that
 * some people cannot read.
 *
 * This is the fix, and it is deliberately the same shape as the skip link that was
 * already here: visually hidden until something in it takes focus, at which point
 * it becomes a real panel with real links. The corridor stays clean for a pointer,
 * and Tab reveals a complete index of everything the room can reach.
 *
 * Touch has no Tab. On a coarse pointer or below the desktop breakpoint the panel
 * gets a real toggle button instead, because a phone visitor otherwise has no way
 * to reach a single case study, the CV, or the email address while the reactor is
 * running — the same pointer-only failure, one input mode over.
 *
 * Not a substitute for the consoles — they still own the experience. This is the
 * text-mode door into the same building.
 */
export const WorldNav = () => {
  const { copy, locale } = useCopy()
  const { pathname } = useLocation()
  const experience = useSceneStore((state) => state.experience)
  const [open, setOpen] = useState(false)

  // Any navigation closes the panel, including one case study to the next.
  useEffect(() => setOpen(false), [pathname])

  if (experience !== 'cinema' && experience !== 'lite') return null

  const cases = allCases(locale)
  const other = otherLocale(locale)

  return (
    <div
      data-print-hide
      data-open={open}
      className="world-nav"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="world-nav-index"
        aria-label={open ? copy.nav.menuClose : copy.nav.menuOpen}
        onClick={() => setOpen((value) => !value)}
        className="world-nav-toggle"
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="size-5 fill-none stroke-current stroke-[1.5]"
        >
          {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M2 6h16M2 10h16M2 14h16" />}
        </svg>
      </button>

      <nav
        id="world-nav-index"
        aria-label={copy.nav.ariaLabel}
        className="world-nav-panel"
      >
        <ul
          className="world-nav-list"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) setOpen(false)
          }}
        >
        <li>
          <Link to={cvPath(locale)} onClick={() => trackEvent('cv_view', 'world-nav')}>
            {copy.experience.cvCta}
          </Link>
        </li>
        {cases.map((study) => (
          <li key={study.slug}>
            <Link to={casePath(locale, study.slug)}>
              {study.title} — {copy.work.caseOf}
            </Link>
          </li>
        ))}
        <li>
          <a href={`mailto:${copy.contact.email}`}>{copy.contact.emailCta}</a>
        </li>
        {copy.contact.social.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              {...(link.external
                ? { target: '_blank', rel: 'noreferrer noopener' }
                : {})}
            >
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <Link
            to={translatePath(homePath(locale), other)}
            hrefLang={other}
            onClick={() => {
              rememberLocale(other)
              trackEvent('locale_switch', other)
            }}
          >
            {copy.nav.langNames[other]}
          </Link>
        </li>
      </ul>
      </nav>
    </div>
  )
}
