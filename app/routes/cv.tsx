import { useEffect } from 'react'
import { type MetaFunction } from 'react-router'
import { Preflight } from '../../src/components/Preflight'
import { SceneBoundary } from '../../src/components/SceneBoundary'
import { ScrollRail } from '../../src/components/ScrollRail'
import { StageTreatment } from '../../src/components/StageTreatment'
import { COPY, isLocale } from '../../src/content'
import { useExperience } from '../../src/hooks/useExperience'
import { usePerformanceGovernor } from '../../src/hooks/usePerformanceGovernor'
import { usePointerTracking } from '../../src/hooks/usePointerTracking'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { cvPath } from '../../src/lib/routes'
import { CV_SECTION_IDS, cvRailChapters } from '../../src/lib/sceneRoutes'
import { pageMeta } from '../../src/lib/seo'
import { useReactorScroll, useScrollRefresh } from '../../src/motion/scroll'
import { qualityOf, rendersCanvas } from '../../src/scene/sceneState'

export const meta: MetaFunction = ({ params }) => {
  const locale = isLocale(params.locale) ? params.locale : 'es'
  const copy = COPY[locale]
  return pageMeta({
    locale,
    path: cvPath(locale),
    title: `${copy.cv.label} — David Guillen`,
    description: copy.cv.intro,
  })
}

/** CV as a 3D scroll narrative of consoles. */
const Cv = () => {
  const { copy, locale } = useCopy()
  const experience = useExperience()

  useReactorScroll(experience, 0)
  usePointerTracking(experience)
  usePerformanceGovernor(experience)
  useScrollRefresh(copy.locale)

  useEffect(() => {
    trackEvent('cv_view', locale)
  }, [locale])

  const chapters = cvRailChapters(copy)
  const canvas = rendersCanvas(experience)

  return (
    <>
      {canvas ? (
        <SceneBoundary
          quality={qualityOf(experience)}
          copy={copy}
          featured={copy.featured}
          mode="cv"
          sectionIds={CV_SECTION_IDS}
        />
      ) : null}

      {canvas ? <StageTreatment /> : null}

      <main id="main" tabIndex={-1} className="world-main focus-visible:outline-none">
        <ScrollRail chapters={chapters} />
      </main>

      <Preflight />
    </>
  )
}

export default Cv
