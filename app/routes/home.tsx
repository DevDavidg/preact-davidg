import { useEffect, useMemo } from 'react'
import { useLocation, type MetaFunction } from 'react-router'
import { HomeDocument } from '../../src/components/HomeDocument'
import { JsonLd } from '../../src/components/JsonLd'
import { OperatorBar } from '../../src/components/OperatorBar'
import { BootGate } from '../../src/components/BootGate'
import { FinaleCard } from '../../src/components/FinaleCard'
import { SceneBoundary } from '../../src/components/SceneBoundary'
import { ScrollRail } from '../../src/components/ScrollRail'
import { SkipLink } from '../../src/components/Nav'
import { WorldNav } from '../../src/components/WorldNav'
import { StageTreatment } from '../../src/components/StageTreatment'
import { homeRailChapters } from '../../src/lib/sceneRoutes'
import { COPY, isLocale } from '../../src/content'
import { useExperience } from '../../src/hooks/useExperience'
import { useOperatorConsole } from '../../src/hooks/useOperatorConsole'
import { usePerformanceGovernor } from '../../src/hooks/usePerformanceGovernor'
import { usePointerTracking } from '../../src/hooks/usePointerTracking'
import { useSectionTracking } from '../../src/hooks/useSectionTracking'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { cvPath, homePath, SECTION_IDS } from '../../src/lib/routes'
import { homeSchema, pageMeta } from '../../src/lib/seo'
import {
  useAnchorScroll,
  useReactorScroll,
  useScrollRefresh,
} from '../../src/motion/scroll'
import { qualityOf, rendersCanvas } from '../../src/scene/sceneState'
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
 * Full-3D home: invisible scroll rail + reactor consoles.
 * No DOM chrome — interactions are raycast targets in the scene.
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
  useScrollRefresh(copy.locale)
  useOperatorConsole(experience, cvPath(copy.locale))

  useEffect(() => {
    if (experience === 'checking') return
    trackEvent('experience_resolved', experience)
  }, [experience])

  const chapters = useMemo(
    () =>
      homeRailChapters({
        hero: copy.hero.headline,
        work: copy.work.heading,
        lab: copy.work.labLabel,
        archive: copy.work.archiveLabel,
        experience: copy.experience.heading,
        services: copy.services.heading,
        process: copy.process.heading,
        about: copy.about.heading,
        contact: copy.contact.title,
        finale: copy.hud.finaleLabel,
      }),
    [copy],
  )

  if (!isLocale(pathname.replace(/^\/+/, '').split('/')[0])) return <NotFound />

  const canvas = rendersCanvas(experience)

  /*
   * No reactor, no blank page.
   *
   * `rendersCanvas` is false for `checking` (the prerendered state), `static`
   * (no WebGL, data saver) and `failed` (context lost, or the governor giving
   * up mid-session). Previously every one of those rendered only the invisible
   * scroll rail, so the page was a 16,000px column of nothing — and the
   * prerendered HTML that search engines read carried no copy at all.
   */
  if (!canvas) {
    return (
      <>
        <HomeDocument>
          <JsonLd schemas={homeSchema(copy.locale)} />
        </HomeDocument>
        <BootGate />
      </>
    )
  }

  return (
    <>
      {/*
        The corridor has no navigation on purpose — every route is a raycast
        target on a console. That is right for a pointer and wrong for a
        keyboard, so the two controls a visitor cannot reach any other way are
        real DOM: a skip link into the rail, and the operator's own panel.
      */}
      <SkipLink />
      <WorldNav />

      <SceneBoundary
        quality={qualityOf(experience)}
        copy={copy}
        featured={copy.featured}
        mode="home"
      />

      <StageTreatment />
      <OperatorBar />
      <FinaleCard />

      <main id="main" tabIndex={-1} className="world-main focus-visible:outline-none">
        <JsonLd schemas={homeSchema(copy.locale)} />
        <ScrollRail chapters={chapters} moduleCount={copy.featured.length} />
      </main>

      <BootGate />
    </>
  )
}

export default Home
