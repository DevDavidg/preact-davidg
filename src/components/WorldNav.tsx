import { Link } from 'react-router'
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
 * sound, law and wire controls. A visitor navigating by Tab could not reach a
 * single case study, the CV, or the email address: the entire portfolio was
 * pointer-only, which is a WCAG 2.1.1 failure and, more plainly, a portfolio that
 * some people cannot read.
 *
 * This is the fix, and it is deliberately the same shape as the skip link that was
 * already here: visually hidden until something in it takes focus, at which point
 * it becomes a real panel with real links. The corridor stays clean for a pointer,
 * and Tab reveals a complete index of everything the room can reach.
 *
 * Not a substitute for the consoles — they still own the experience. This is the
 * text-mode door into the same building.
 */
export const WorldNav = () => {
  const { copy, locale } = useCopy()
  const experience = useSceneStore((state) => state.experience)

  if (experience !== 'cinema' && experience !== 'lite') return null

  const cases = allCases(locale)
  const other = otherLocale(locale)

  return (
    <nav aria-label={copy.nav.ariaLabel} data-print-hide className="world-nav">
      <ul className="world-nav-list">
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
  )
}
