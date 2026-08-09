import { useEffect } from 'react'
import { useLocation, type MetaFunction } from 'react-router'
import { About } from '../../src/components/About'
import { Contact } from '../../src/components/Contact'
import { Experience } from '../../src/components/Experience'
import { Hero } from '../../src/components/Hero'
import { Hud } from '../../src/components/Hud'
import { Preflight } from '../../src/components/Preflight'
import { Process } from '../../src/components/Process'
import { SceneBoundary } from '../../src/components/SceneBoundary'
import { Services } from '../../src/components/Services'
import { JsonLd } from '../../src/components/JsonLd'
import { SiteShell } from '../../src/components/SiteShell'
import { Work } from '../../src/components/Work'
import { COPY, isLocale } from '../../src/content'
import { useExperience } from '../../src/hooks/useExperience'
import { usePerformanceGovernor } from '../../src/hooks/usePerformanceGovernor'
import { usePointerTracking } from '../../src/hooks/usePointerTracking'
import { useSectionTracking } from '../../src/hooks/useSectionTracking'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { homePath, SECTION_IDS } from '../../src/lib/routes'
import {
  useAnchorScroll,
  useReactorScroll,
  useScrollRefresh,
} from '../../src/motion/scroll'
import { qualityOf, rendersCanvas } from '../../src/scene/sceneState'
import { homeSchema, pageMeta } from '../../src/lib/seo'
import NotFound from './not-found'

export const meta: MetaFunction = ({ params }) => {
  const locale = isLocale(params.locale) ? params.locale : 'es'
  const copy = COPY[locale]
  return pageMeta({
    locale,
    path: homePath(locale),
    title: copy.meta.title,
    description: copy.meta.description,
  })
}

/**
 * The single-page narrative, and the only route that mounts the reactor.
 *
 * The order of operations here is the whole progressive-enhancement contract:
 * the sections render first and unconditionally, then `useExperience` decides
 * whether a canvas is warranted, and only then is the scene chunk requested.
 */
const Home = () => {
  const { pathname } = useLocation()
  const { copy } = useCopy()
  const experience = useExperience()

  useReactorScroll(experience, copy.featured.length)
  usePointerTracking(experience)
  usePerformanceGovernor(experience)
  useAnchorScroll()
  useSectionTracking(SECTION_IDS)
  // Section offsets move when the language changes the copy length.
  useScrollRefresh(copy.locale)

  useEffect(() => {
    if (experience === 'checking') return
    trackEvent('experience_resolved', experience)
  }, [experience])

  // An unknown first segment is a real 404, not the default locale's home: two
  // URLs rendering the same page would be duplicate content.
  if (!isLocale(pathname.replace(/^\/+/, '').split('/')[0])) return <NotFound />

  return (
    <>
      {rendersCanvas(experience) ? (
        <SceneBoundary
          quality={qualityOf(experience)}
          featured={copy.featured}
        />
      ) : null}

      {rendersCanvas(experience) ? <Hud /> : null}

      <SiteShell>
        <JsonLd schemas={homeSchema(copy.locale)} />
        <Hero />
        <Work />
        <Experience />
        <Services />
        <Process />
        <About />
        <Contact />
      </SiteShell>

      <Preflight />
    </>
  )
}

export default Home
