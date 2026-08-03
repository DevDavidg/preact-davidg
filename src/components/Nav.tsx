import { Fragment } from 'react'
import { useCopy, type Locale } from '../i18n/copy'
import { useSceneStore } from '../scene/sceneState'
import { Magnetic } from './ui/Magnetic'

const LOCALES: Locale[] = ['es', 'en']

export const Nav = () => {
  const { copy, locale, setLocale } = useCopy()
  const activeSection = useSceneStore((state) => state.activeSection)

  const links = [
    { id: 'work', label: copy.nav.projects },
    { id: 'services', label: copy.nav.services },
    { id: 'process', label: copy.nav.process },
    { id: 'about', label: copy.nav.about },
  ]

  return (
    <header className="nav">
      <div className="nav__brand">
        <a href="#hero" className="nav__mark">
          DG<span>®</span>
        </a>
        <span className="meta">{copy.nav.tagline}</span>
      </div>

      <nav className="nav__links" aria-label={copy.nav.ariaLabel}>
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="nav__link"
            aria-current={activeSection === link.id ? 'true' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="nav__tail">
        <div className="lang" role="group" aria-label={copy.nav.langLabel}>
          {LOCALES.map((option, index) => (
            <Fragment key={option}>
              {index > 0 && <span aria-hidden="true">⁄</span>}
              <button
                type="button"
                className="lang__opt"
                aria-pressed={locale === option}
                onClick={() => setLocale(option)}
              >
                {option.toUpperCase()}
              </button>
            </Fragment>
          ))}
        </div>
        <Magnetic href="#contact" className="btn btn--primary btn--sm">
          {copy.nav.cta}
        </Magnetic>
      </div>
    </header>
  )
}
