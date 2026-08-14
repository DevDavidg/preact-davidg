import { useEffect } from 'react'
import { type MetaFunction } from 'react-router'
import { CvDocument } from '../../src/components/CvDocument'
import { JsonLd } from '../../src/components/JsonLd'
import { OperatorBar } from '../../src/components/OperatorBar'
import { Preflight } from '../../src/components/Preflight'
import { SceneBoundary } from '../../src/components/SceneBoundary'
import { ScrollRail } from '../../src/components/ScrollRail'
import { SkipLink } from '../../src/components/Nav'
import { StageTreatment } from '../../src/components/StageTreatment'
import { COPY, isLocale } from '../../src/content'
import { useExperience } from '../../src/hooks/useExperience'
import { useOperatorConsole } from '../../src/hooks/useOperatorConsole'
import { usePerformanceGovernor } from '../../src/hooks/usePerformanceGovernor'
import { usePointerTracking } from '../../src/hooks/usePointerTracking'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { cvPath } from '../../src/lib/routes'
import { CV_SECTION_IDS, cvRailChapters } from '../../src/lib/sceneRoutes'
import { cvSchema, pageMeta } from '../../src/lib/seo'
import { useReactorScroll, useScrollRefresh } from '../../src/motion/scroll'
import { qualityOf, rendersCanvas } from '../../src/scene/sceneState'

export const meta: MetaFunction = ({ params }) => {
  const locale = isLocale(params.locale) ? params.locale : 'es'
  const copy = COPY[locale]
  return pageMeta({
    locale,
    path: cvPath(locale),
    title: copy.meta.cvTitle,
    description: copy.meta.cvDescription,
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
  useOperatorConsole(experience, cvPath(locale))

  useEffect(() => {
    trackEvent('cv_view', locale)
  }, [locale])

  const chapters = cvRailChapters(copy)
  const canvas = rendersCanvas(experience)
  const schemas = cvSchema(locale)

  if (!canvas) {
    return (
      <>
        <CvDocument>
          <JsonLd schemas={schemas} />
        </CvDocument>
        <Preflight />
      </>
    )
  }

  return (
    <>
      <SkipLink />

      <SceneBoundary
        quality={qualityOf(experience)}
        copy={copy}
        featured={copy.featured}
        mode="cv"
        sectionIds={CV_SECTION_IDS}
      />

      <StageTreatment />
      <OperatorBar />

      <main id="main" tabIndex={-1} className="world-main focus-visible:outline-none">
        <JsonLd schemas={schemas} />
        <ScrollRail chapters={chapters} />
      </main>

      <Preflight />
    </>
  )
}

export default Cv
