import { useEffect, type ReactNode } from 'react'
import { observeWebVitals } from '../lib/analytics'
import { Footer } from './Footer'
import { Nav, SkipLink } from './Nav'

/**
 * Chrome shared by every page: skip link, fixed nav, the `<main>` landmark the
 * skip link targets, and the footer — which sits outside `<main>` because it is
 * site-wide furniture rather than part of the page's outline.
 */
export const SiteShell = ({ children }: { children: ReactNode }) => {
  useEffect(() => observeWebVitals(), [])

  return (
    <>
      <SkipLink />
      <Nav />
      <main id="main" tabIndex={-1} className="overlay focus-visible:outline-none">
        {children}
      </main>
      <Footer />
    </>
  )
}
