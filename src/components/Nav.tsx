import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { LOCALES, type Locale } from '../content'
import { useCopy } from '../lib/locale'
import { rememberLocale } from '../lib/locale'
import { trackEvent } from '../lib/analytics'
import {
  homePath,
  SECTION_IDS,
  translatePath,
  type SectionId,
} from '../lib/routes'
import { useSceneStore } from '../scene/sceneState'
import { SoundToggle } from './SoundToggle'
import { Action } from './ui/Action'

/** Sections that earn a nav slot. Hero and contact are reached by mark and CTA. */
const NAV_SECTIONS = [
  'work',
  'experience',
  'services',
  'process',
  'about',
] as const satisfies readonly SectionId[]

type NavSection = (typeof NAV_SECTIONS)[number]

/**
 * Fixed chrome: mark, section links, language and the primary call to action.
 *
 * Below the desktop breakpoint the links move into a `<dialog>` rather than
 * disappearing. The previous version simply hid them, which left phone visitors
 * with no way to reach any section but the one they were scrolled to.
 */
export const Nav = () => {
  const { copy, locale } = useCopy()
  const { pathname, hash } = useLocation()
  const activeSection = useSceneStore((state) => state.activeSection)
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  const onHome = pathname === homePath(locale)

  const closeMenu = useCallback(() => setOpen(false), [])

  // A native dialog gives focus trapping, Escape and `inert` on the rest of the
  // document for free — all things a hand-rolled menu has to reimplement badly.
  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  // Any navigation closes the menu, including a hash change to the same page.
  useEffect(() => closeMenu(), [pathname, hash, closeMenu])

  const handleLocale = (target: Locale) => {
    rememberLocale(target)
    trackEvent('locale_switch', target)
  }

  const sectionHref = (id: SectionId) =>
    onHome ? `#${id}` : `${homePath(locale)}#${id}`

  // The nav label for a section id. Keyed off `copy.nav`, so a renamed section
  // fails to compile rather than rendering an empty link.
  const sectionLabel = (id: NavSection) => copy.nav[id]

  return (
    <header
      data-print-hide
      className="fixed inset-x-0 top-0 z-nav flex h-nav items-center justify-between gap-4 border-b border-line bg-reactor/70 px-gutter backdrop-blur-md"
    >
      {/* Sized to the touch minimum rather than to the glyphs: a wordmark is still a
          control, and its hit area should not be the height of its own line box. */}
      <Link
        to={homePath(locale)}
        className="font-display inline-flex h-11 shrink-0 items-center text-xl font-bold tracking-tight"
        aria-label={copy.nav.home}
      >
        DG<span className="text-ignition">®</span>
      </Link>

      <nav
        aria-label={copy.nav.ariaLabel}
        className="hidden items-center gap-7 lg:flex"
      >
        {NAV_SECTIONS.map((id) => (
          <a
            key={id}
            href={sectionHref(id)}
            aria-current={
              onHome && activeSection === id ? 'true' : undefined
            }
            className="text-meta relative inline-flex min-h-11 items-center text-ink-dim transition-colors duration-hover ease-signal after:absolute after:inset-x-0 after:bottom-3 after:h-px after:origin-left after:scale-x-0 after:bg-ignition after:transition-transform after:duration-state after:ease-signal aria-[current]:text-ink pointer-fine:hover:text-ink aria-[current]:after:scale-x-100 pointer-fine:hover:after:scale-x-100"
          >
            {sectionLabel(id)}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-4">
        <div
          role="group"
          aria-label={copy.nav.langGroup}
          className="flex items-center"
        >
          {LOCALES.map((option) => (
            <Link
              key={option}
              to={translatePath(pathname, option)}
              hrefLang={option}
              lang={option}
              onClick={() => handleLocale(option)}
              aria-current={locale === option ? 'true' : undefined}
              // Full accessible name: "ES" alone tells a screen reader nothing.
              aria-label={copy.nav.langNames[option]}
              className="text-meta flex h-11 min-w-11 items-center justify-center text-ink-dim transition-colors duration-hover ease-signal aria-[current]:text-ink pointer-fine:hover:text-ignition"
            >
              {option.toUpperCase()}
            </Link>
          ))}
        </div>

        <SoundToggle />

        {/*
          Hidden by a wrapper rather than by a `hidden sm:inline-flex` class on the
          action itself: the action's own base class list already sets `inline-flex`,
          and two display utilities on one element resolve by stylesheet order, not by
          the order they are written — so the button stayed visible at 320 px and
          pushed the header past the viewport.
        */}
        <span className="hidden sm:inline-flex">
          <Action
            to={sectionHref('contact')}
            anchor={onHome}
            variant="primary"
            className="px-4 text-[0.6875rem]"
            event="contact_click"
            eventDetail="nav"
          >
            {copy.nav.cta}
          </Action>
        </span>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={copy.nav.menuOpen}
          aria-expanded={open}
          className="flex size-11 shrink-0 items-center justify-center text-ink lg:hidden"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="size-5 fill-none stroke-current stroke-[1.5]"
          >
            <path d="M2 6h16M2 10h16M2 14h16" />
          </svg>
        </button>
      </div>

      <dialog
        ref={dialog}
        onClose={closeMenu}
        // `overscroll-contain` stops a swipe inside the sheet from scrolling the
        // page behind it once the list hits its end.
        className="m-0 h-dvh max-h-none w-full max-w-none overscroll-contain bg-reactor/98 p-0 text-ink backdrop:bg-reactor/80 lg:hidden"
      >
        <div className="flex h-full flex-col px-gutter py-6">
          <div className="flex h-nav items-center justify-between">
            <span className="text-meta">{copy.nav.ariaLabel}</span>
            <button
              type="button"
              onClick={closeMenu}
              aria-label={copy.nav.menuClose}
              className="flex size-11 shrink-0 items-center justify-center"
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="size-5 fill-none stroke-current stroke-[1.5]"
              >
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            </button>
          </div>

          <nav aria-label={copy.nav.ariaLabel} className="mt-6 flex flex-col">
            {NAV_SECTIONS.map((id) => (
              <a
                key={id}
                href={sectionHref(id)}
                onClick={closeMenu}
                className="text-display border-b border-line py-5 text-2xl"
              >
                {sectionLabel(id)}
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-8">
            <Action
              to={sectionHref('contact')}
              anchor={onHome}
              variant="primary"
              className="w-full"
              event="contact_click"
              eventDetail="menu"
            >
              {copy.nav.cta}
            </Action>
          </div>
        </div>
      </dialog>
    </header>
  )
}

export const SkipLink = () => {
  const { copy } = useCopy()

  return (
    <a
      href="#main"
      data-print-hide
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-boot focus-visible:inline-flex focus-visible:min-h-11 focus-visible:items-center focus-visible:bg-ignition focus-visible:px-4 focus-visible:font-mono focus-visible:text-xs focus-visible:font-semibold focus-visible:uppercase focus-visible:tracking-[0.18em] focus-visible:text-reactor"
    >
      {copy.nav.skipToContent}
    </a>
  )
}

export { SECTION_IDS }
