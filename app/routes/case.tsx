import { useEffect } from 'react'
import { useLocation, useParams, type MetaFunction } from 'react-router'
import { CaseDocument } from '../../src/components/CaseDocument'
import { JsonLd } from '../../src/components/JsonLd'
import { OperatorBar } from '../../src/components/OperatorBar'
import { BootGate } from '../../src/components/BootGate'
import { SceneBoundary } from '../../src/components/SceneBoundary'
import { ScrollRail } from '../../src/components/ScrollRail'
import { SkipLink } from '../../src/components/Nav'
import { WorldNav } from '../../src/components/WorldNav'
import { StageTreatment } from '../../src/components/StageTreatment'
import { COPY, findCase, isLocale } from '../../src/content'
import { useExperience } from '../../src/hooks/useExperience'
import { useOperatorConsole } from '../../src/hooks/useOperatorConsole'
import { usePerformanceGovernor } from '../../src/hooks/usePerformanceGovernor'
import { usePointerTracking } from '../../src/hooks/usePointerTracking'
import { trackEvent } from '../../src/lib/analytics'
import { useCopy } from '../../src/lib/locale'
import { casePath, cvPath } from '../../src/lib/routes'
import { CASE_SECTION_IDS, caseRailChapters } from '../../src/lib/sceneRoutes'
import { caseSchema, pageMeta } from '../../src/lib/seo'
import { useReactorScroll, useScrollRefresh } from '../../src/motion/scroll'
import { qualityOf, rendersCanvas } from '../../src/scene/sceneState'
import NotFound from './not-found'

export const meta: MetaFunction = ({ params, location }) => {
  const locale = isLocale(params.locale) ? params.locale : 'es'
  const study = findCase(locale, params.slug)

  if (!study || location.pathname !== casePath(locale, study.slug)) {
    return pageMeta({
      locale,
      path: location.pathname,
      title: `${COPY[locale].notFound.title} — David Guillen`,
      description: COPY[locale].notFound.lead,
      noindex: true,
    })
  }

  return pageMeta({
    locale,
    path: casePath(locale, study.slug),
    title: `${study.title} — ${COPY[locale].work.caseOf} — David Guillen`,
    description: study.summary,
    image: study.image.src,
    imageAlt: study.image.alt,
    imageWidth: study.image.width,
    imageHeight: study.image.height,
    ogType: 'article',
    article: {
      section: study.kindLabel,
      tags: study.tags,
    },
  })
}

/** Case study as a 3D scroll corridor of consoles. */
const Case = () => {
  const params = useParams()
  const { pathname } = useLocation()
  const { copy, locale } = useCopy()
  const experience = useExperience()

  useReactorScroll(experience, 0)
  usePointerTracking(experience)
  usePerformanceGovernor(experience)
  useScrollRefresh(`${copy.locale}-${params.slug ?? ''}`)
  useOperatorConsole(experience, cvPath(locale))

  const study = findCase(locale, params.slug)

  useEffect(() => {
    if (study) trackEvent('case_open', study.slug)
  }, [study])

  if (!study || pathname !== casePath(locale, study.slug)) return <NotFound />

  const chapters = caseRailChapters(copy, study)
  const canvas = rendersCanvas(experience)
  const schemas = caseSchema(locale, study)

  if (!canvas) {
    return (
      <>
        <CaseDocument study={study}>
          <JsonLd schemas={schemas} />
        </CaseDocument>
        <BootGate />
      </>
    )
  }

  return (
    <>
      <SkipLink />
      <WorldNav />

      <SceneBoundary
        quality={qualityOf(experience)}
        copy={copy}
        featured={copy.featured}
        mode="case"
        study={study}
        sectionIds={CASE_SECTION_IDS}
      />

      <StageTreatment />
      <OperatorBar />

      <main id="main" tabIndex={-1} className="world-main focus-visible:outline-none">
        <JsonLd schemas={schemas} />
        <ScrollRail chapters={chapters} />
      </main>

      <BootGate />
    </>
  )
}

export default Case
