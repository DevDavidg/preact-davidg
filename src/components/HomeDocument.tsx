import { About } from './About'
import { Contact } from './Contact'
import { Experience } from './Experience'
import { Hero } from './Hero'
import { Process } from './Process'
import { Services } from './Services'
import { SiteShell } from './SiteShell'
import { Work } from './Work'

/**
 * The home page as a document.
 *
 * This is what a visitor gets whenever the reactor is not running: no WebGL, a
 * metered connection, JavaScript disabled, or a device the performance governor
 * has demoted to `static` mid-session. It is also the shape the prerenderer
 * captures, because prerendering happens in the `checking` state — so this is
 * the HTML that search engines and link previews actually read.
 *
 * The section components it composes already existed and already carry the
 * right ids, headings and copy; nothing rendered them, which is why the static
 * output had become an empty scroll rail. `SiteShell` supplies the skip link,
 * nav and footer that the canvas route otherwise draws in 3D.
 */
export const HomeDocument = ({ children }: { children?: React.ReactNode }) => (
  <SiteShell>
    {children}
    <Hero />
    <Work />
    <Experience />
    <Services />
    <Process />
    <About />
    <Contact />
  </SiteShell>
)
