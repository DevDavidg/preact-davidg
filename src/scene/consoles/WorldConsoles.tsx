import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useLocation, useNavigate } from 'react-router'
import * as THREE from 'three'
import { nextCase, type CaseStudy, type Copy } from '../../content'
import { useCopy } from '../../lib/locale'
import type { Quality } from '../capability'
import { publishBeats } from '../control/reactorControl'
import { Console } from '../kit/Console'
import { layoutActionRow, type ActionRowLayout } from '../kit/actionRow'
import { layoutConsoleRows, type TypeMetrics } from '../kit/consoleLayout'
import { createStudioEquirect } from '../studioEnv'
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
import {
  BASE_FOV,
  computeViewportFit,
  consoleDistanceFor,
  consoleHeightFit,
  consoleSizeFit,
  consoleWidthFit,
  fovCompensation,
  lateralFit,
  typeFit,
} from '../viewportFit'

const BUDGET: Record<Quality, number> = { cinema: 22000, lite: 9000 }

interface WorldConsolesProps {
  copy: Copy
  featured: CaseStudy[]
  quality: Quality
  windows: SectionWindows
  mode?: SceneMode
  study?: CaseStudy
}

/**
 * The rows of controls for every console, laid out once.
 *
 * Keyed by console id so both consumers — the plates in `Console` and the label
 * glyphs in the field below — read the *same* geometry. This is the fix for
 * labels overflowing their own buttons: there is now exactly one answer to how
 * wide a plate is and how big its label may be, and it is measured against the
 * atlas the glyphs are drawn from.
 */
const buildActionRows = (
  built: BuiltConsole[],
  widthFit: number,
  heightFit: number,
  atlas: GlyphAtlas,
  type: TypeMetrics,
): Map<string, ActionRowLayout> => {
  const rows = new Map<string, ActionRowLayout>()
  for (const entry of built) {
    const actions = entry.spec.actions ?? []
    if (!actions.length) continue
    rows.set(
      entry.spec.id,
      layoutActionRow({
        actions: actions.map((action) => ({ id: action.id, label: action.label })),
        consoleWidth: entry.spec.width * widthFit,
        consoleHeight: entry.spec.height * heightFit,
        atlas,
        type,
      }),
    )
  }
  return rows
}

/** The label glyphs, placed on the plates the row layout just decided. */
const actionLabelBlocks = (
  built: BuiltConsole[],
  rows: Map<string, ActionRowLayout>,
): TextBlock[] => {
  const blocks: TextBlock[] = []

  for (const entry of built) {
    const row = rows.get(entry.spec.id)
    if (!row) continue

    for (const slot of row.slots) {
      // Slightly proud of the plate so the letters are never coplanar with the
      // face they sit on.
      const local = new THREE.Vector3(slot.x, slot.y, 0.1)
      const world = local
        .clone()
        .applyQuaternion(entry.quaternion)
        .add(entry.position)

      blocks.push({
        id: `${entry.spec.id}-action-${slot.id}`,
        text: slot.label,
        role: 'mono',
        em: slot.em,
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
    }
  }

  return blocks
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
  /** Narrower than the plate scale on portrait — see `consoleWidthFit`. */
  const widthFit = consoleWidthFit(fit, aspect)
  /*
   * Plate height is its own answer now: a tall, narrow frame has vertical room to
   * spare, and giving it to the plate is what stops the copy being clipped on a
   * phone. See `consoleHeightFit`.
   */
  const heightFit = consoleHeightFit(fit, aspect)
  /*
   * The projection the type system needs. Distance and lens are the same values
   * `placement.ts` and `Rig.tsx` use, so a row's measured size on screen is the
   * size it actually gets.
   */
  const typeMetrics = useMemo<TypeMetrics>(
    () => ({
      scale: typeFit(fit, aspect),
      distance: consoleDistanceFor(fit),
      fov: BASE_FOV + fovCompensation(fit),
      heightPx,
    }),
    [fit, aspect, heightPx],
  )

  /*
   * One shared studio for every project frame — cinema only, so a budget
   * device never spends a canvas + texture upload on a reflection it can't
   * afford. Every console mounts at once (visibility is presence, not
   * mount/unmount), so this is built once here rather than per-card.
   */
  const envMap = useMemo(
    () => (quality === 'cinema' ? createStudioEquirect(384, 192) : null),
    [quality],
  )
  useEffect(() => {
    return () => envMap?.dispose()
  }, [envMap])

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
    () => buildPlacedConsoles(specs, { windows, quality, fit, aspect }),
    [specs, windows, quality, fit, aspect],
  )

  /*
   * A bay needs a lane to sit in.
   *
   * `lateralFit` is already the room's own answer to "is this viewport wide
   * enough to read as a corridor". Below that threshold every console collapses
   * to dead-centre, and a project shot beside a centred plate would simply be
   * off the side of the screen.
   */
  const bays = quality === 'cinema' && lateralFit(fit, aspect) > 0.45

  /*
   * Republish the beats.
   *
   * Placement resequences every console into an exclusive reading slice, so the
   * measured DOM section windows are *not* the values anything is actually shown
   * at. Objects that have to agree with a console — the conduits that light its
   * bay, the portrait that shares About's beat, the gate that waits for contact
   * — read the resequenced numbers from here rather than re-deriving them and
   * drifting.
   */
  useEffect(() => {
    publishBeats(
      placed.map((entry) => ({
        id: entry.spec.id,
        enter: entry.enter,
        span: entry.span,
        exit: entry.exit,
        exitSpan: entry.exitSpan,
        position: entry.position,
      })),
      placed
        .filter((entry) => entry.spec.moduleIndex != null)
        .sort(
          (left, right) =>
            (left.spec.moduleIndex ?? 0) - (right.spec.moduleIndex ?? 0),
        )
        .map((entry) => entry.spec.id),
    )
  }, [placed])

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

  const actionRows = useMemo(
    () =>
      atlas
        ? buildActionRows(placed, widthFit, heightFit, atlas, typeMetrics)
        : new Map<string, ActionRowLayout>(),
    [atlas, placed, widthFit, heightFit, typeMetrics],
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
            width: entry.spec.width * widthFit,
            height: entry.spec.height * heightFit,
            pad: 0.2 * sizeFit,
            /*
             * The band the controls actually need, not a constant.
             *
             * It was 0.36 for any console with actions and 0.08 for the rest,
             * which was wrong in both directions once the row could stack: a
             * stacked column of three controls needs roughly a metre, and a
             * single control needs less than a third of one. Reserving the
             * measured height is what keeps copy from ever landing on a button.
             */
            actionBand: actionRows.get(entry.spec.id)?.band ?? 0.08,
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
          typeMetrics,
        ),
      )
    }
    blocks.push(...actionLabelBlocks(placed, actionRows))
    return blocks
  }, [atlas, placed, sizeFit, widthFit, heightFit, typeMetrics, actionRows])

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
          width={entry.spec.width * widthFit}
          height={entry.spec.height * heightFit}
          position={entry.position.toArray() as [number, number, number]}
          quaternion={entry.quaternion}
          enter={entry.enter}
          span={entry.span}
          exit={entry.exit}
          exitSpan={entry.exitSpan}
          moduleIndex={entry.spec.moduleIndex}
          side={entry.spec.side}
          bay={bays ? entry.spec.bay : undefined}
          uplink={entry.spec.uplink}
          envMap={envMap}
          chargedAction={
            entry.spec.uplink
              ? entry.spec.actions?.find((action) => action.kind === 'mailto')
                  ?.id
              : undefined
          }
          actions={(actionRows.get(entry.spec.id)?.slots ?? []).map((slot) => ({
            ...slot,
            onActivate: () => {
              const action = entry.spec.actions?.find(
                (candidate) => candidate.id === slot.id,
              )
              if (action) handleAction(action)
            },
          }))}
        />
      ))}
      <GlyphField instances={instances} atlas={atlas.texture} />
      <TelemetryStrip consoles={placed} heightFit={heightFit} widthFit={widthFit} />
    </>
  )
}
