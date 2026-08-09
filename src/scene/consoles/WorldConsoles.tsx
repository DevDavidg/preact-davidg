import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useLocation, useNavigate } from 'react-router'
import * as THREE from 'three'
import { nextCase, type CaseStudy, type Copy } from '../../content'
import { useCopy } from '../../lib/locale'
import type { Quality } from '../capability'
import { Console } from '../kit/Console'
import { layoutConsoleRows } from '../kit/consoleLayout'
import { GlyphField } from '../ui/GlyphField'
import { buildGlyphAtlas, type GlyphAtlas } from '../ui/glyphAtlas'
import { layoutBlocks, type TextBlock } from '../ui/glyphLayout'
import type { SectionWindows } from '../ui/sectionRanges'
import type { SceneMode } from '../ui/ReactorType'
import { caseConsoleSources, caseConsoleSpecs } from './caseConsoles'
import { cvConsoleSources, cvConsoleSpecs } from './cvConsoles'
import { homeConsoleSources, homeConsoleSpecs } from './homeConsoles'
import { buildPlacedConsoles } from './placement'
import { resolveAction } from './resolveAction'
import { TelemetryStrip } from './TelemetryStrip'
import type { BuiltConsole, ConsoleActionSpec } from './types'
import { computeViewportFit, consoleSizeFit } from '../viewportFit'

const BUDGET: Record<Quality, number> = { cinema: 22000, lite: 9000 }

interface WorldConsolesProps {
  copy: Copy
  featured: CaseStudy[]
  quality: Quality
  windows: SectionWindows
  mode?: SceneMode
  study?: CaseStudy
}

const actionLabelBlocks = (
  built: BuiltConsole[],
  sizeFit: number,
  resolve: (action: ConsoleActionSpec) => void,
): { blocks: TextBlock[]; binders: Array<{ action: ConsoleActionSpec; console: BuiltConsole; index: number }> } => {
  const blocks: TextBlock[] = []
  const binders: Array<{
    action: ConsoleActionSpec
    console: BuiltConsole
    index: number
  }> = []

  for (const entry of built) {
    const actions = entry.spec.actions ?? []
    if (!actions.length) continue
    const height = entry.spec.height * sizeFit
    const gap = Math.min(1.35, (entry.spec.width * sizeFit * 0.9) / Math.max(actions.length, 1))
    const actionY = -height / 2 + 0.24 * sizeFit
    const actionStartX = actions.length <= 1 ? 0 : -((actions.length - 1) * gap) / 2

    actions.forEach((action, index) => {
      const local = new THREE.Vector3(
        actionStartX + index * gap,
        actionY,
        0.1,
      )
      const world = local
        .clone()
        .applyQuaternion(entry.quaternion)
        .add(entry.position)

      blocks.push({
        id: `${entry.spec.id}-action-${action.id}`,
        text: action.label,
        role: 'mono',
        em: 0.11 * sizeFit,
        tracking: 0.06,
        align: 'centre',
        position: world,
        quaternion: entry.quaternion.clone(),
        enter: entry.enter + entry.span * 0.35,
        span: entry.span * 0.55,
        exit: entry.exit,
        exitSpan: entry.exitSpan,
        slice: [1, 1],
        chaos: 0.015,
        depth: -0.1,
        accent: 0.9,
        weight: 1.25,
        priority: 5,
      })
      binders.push({ action, console: entry, index })
      void resolve
    })
  }

  return { blocks, binders }
}

export const WorldConsoles = ({
  copy,
  featured,
  quality,
  windows,
  mode = 'home',
  study,
}: WorldConsolesProps) => {
  const { locale } = useCopy()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [atlas, setAtlas] = useState<GlyphAtlas | null>(null)
  const aspect = useThree((state) => state.viewport.aspect)
  const heightPx = useThree((state) => state.size.height)
  const fit = computeViewportFit(aspect, heightPx)
  const sizeFit = consoleSizeFit(fit)

  const sources = useMemo(() => {
    if (mode === 'cv') return cvConsoleSources(copy, locale)
    if (mode === 'case' && study) {
      const upcoming = nextCase(locale, study.slug)
      return caseConsoleSources(copy, study, locale, upcoming.slug, upcoming.title)
    }
    return homeConsoleSources(copy, featured, locale)
  }, [copy, featured, locale, mode, study])

  useEffect(() => {
    let cancelled = false
    let built: GlyphAtlas | null = null

    buildGlyphAtlas(sources)
      .then((next) => {
        if (cancelled) {
          next.dispose()
          return
        }
        built = next
        setAtlas(next)
      })
      .catch(() => setAtlas(null))

    return () => {
      cancelled = true
      built?.dispose()
      setAtlas(null)
    }
  }, [sources])

  const specs = useMemo(() => {
    if (mode === 'cv') return cvConsoleSpecs(copy, locale)
    if (mode === 'case' && study) {
      const upcoming = nextCase(locale, study.slug)
      return caseConsoleSpecs(
        copy,
        study,
        locale,
        upcoming.slug,
        upcoming.title,
      )
    }
    return homeConsoleSpecs(copy, featured, locale, windows)
  }, [copy, featured, locale, mode, study, windows])

  const placed = useMemo(
    () => buildPlacedConsoles(specs, { windows, quality, fit }),
    [specs, windows, quality, fit],
  )

  const handleAction = useMemo(
    () => (action: ConsoleActionSpec) => {
      resolveAction(action, {
        navigate,
        locale,
        pathname,
        email: copy.contact.email,
      })
    },
    [navigate, locale, pathname, copy.contact.email],
  )

  const textBlocks = useMemo(() => {
    if (!atlas) return [] as TextBlock[]
    const blocks: TextBlock[] = []
    for (const entry of placed) {
      blocks.push(
        ...layoutConsoleRows(
          entry.spec.id,
          entry.spec.rows,
          {
            width: entry.spec.width * sizeFit,
            height: entry.spec.height * sizeFit,
            pad: 0.28 * sizeFit,
          },
          {
            position: entry.position,
            quaternion: entry.quaternion,
            enter: entry.enter,
            span: entry.span,
            exit: entry.exit,
            exitSpan: entry.exitSpan,
          },
          atlas,
          fit,
        ),
      )
    }
    const { blocks: labels } = actionLabelBlocks(placed, sizeFit, handleAction)
    blocks.push(...labels)
    return blocks
  }, [atlas, placed, fit, sizeFit, handleAction])

  const instances = useMemo(
    () => (atlas ? layoutBlocks(textBlocks, atlas, BUDGET[quality]) : null),
    [atlas, textBlocks, quality],
  )

  if (!atlas || !instances) return null

  return (
    <>
      {placed.map((entry) => (
        <Console
          key={entry.spec.id}
          width={entry.spec.width * sizeFit}
          height={entry.spec.height * sizeFit}
          position={entry.position.toArray() as [number, number, number]}
          quaternion={entry.quaternion}
          enter={entry.enter}
          span={entry.span}
          exit={entry.exit}
          exitSpan={entry.exitSpan}
          moduleIndex={entry.spec.moduleIndex}
          actions={(entry.spec.actions ?? []).map((action) => ({
            id: action.id,
            label: action.label,
            onActivate: () => handleAction(action),
          }))}
        />
      ))}
      <GlyphField instances={instances} atlas={atlas.texture} />
      <TelemetryStrip consoles={placed} />
    </>
  )
}
