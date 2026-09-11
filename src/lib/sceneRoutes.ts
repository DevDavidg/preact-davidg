import type { RailChapter } from '../components/ScrollRail'
import type { CaseStudy, Copy } from '../content'
import { SECTION_IDS, type SectionId } from './routes'

/**
 * Viewport multiples per home chapter.
 *
 * These are the story's pacing now, not decoration. `placement` cuts each
 * console's beat out of its own chapter's measured window, so a chapter's height
 * is literally how much scroll that beat gets — which is what makes an anchor
 * land on the right moment and what makes the rail and the camera agree.
 *
 * Before, the numbers here had no effect at all: the corridor was sliced into
 * equal parts regardless, so Work at 340vh and Services at 170vh were shown for
 * exactly the same length of scroll.
 *
 * The shape:
 * - `hero` is tall because it carries the whole approach — the camera flying onto
 *   the optic's axis and through it costs `HERO_BUILD` of the rail — and then the
 *   opening console after it.
 * - `work` carries one beat per featured module, so it is a multiple of the base.
 * - `archive` carries no console of its own; it stays short so it only lengthens
 *   the beat it sits inside rather than opening a dead stretch.
 * - `finale` is the swallow: the stretch past the end of the corridor where the
 *   portal takes the room in, and the only chapter whose scroll drives something
 *   other than `build`. It is the longest chapter on the rail, and it has to be:
 *   the ending carries a real infall — three gulps, an orbit that winds four turns
 *   while it decays, a tidal stretch, a lens falling through the aperture, and then
 *   the crossing. At the 1.6 it once had, the swallow occupied about a screen and a
 *   half of wheel and the last third of it went past in a flick. At 2.6 it owned
 *   fifteen percent of the rail: the third gulp — the beat that takes the room —
 *   and the whole crossing after it fitted inside two screens of wheel, and a
 *   visitor who reached the bottom and kept pushing found the page simply over.
 *
 *   4.4 is that read as the brief it was. The ask was that reaching the end and
 *   continuing to scroll should swallow everything, and there are exactly two
 *   honest ways to give scroll to a rail that has run out of it. One is to capture
 *   the wheel and touch deltas the browser is already throwing away at the clamp —
 *   Lenis exposes them on `virtual-scroll`, before its own clamp — and integrate
 *   them into a second axis. The other is for the end to be longer than the visitor
 *   expects. This is the second, and the reason is that the first is not a scroll
 *   *position*: an integral of gestures cannot be restored on reload, cannot be
 *   deep-linked, has nothing to hand a keyboard, and keeps running for the second
 *   of trackpad inertia after the fingers have left the glass — which is the exact
 *   opposite of the one rule this ending is built on, that it stops when you stop
 *   and runs backwards when you scroll back. The swallow now owns 28% of the rail
 *   instead of 15%, `corridorShare` is measured so nothing in the corridor moves,
 *   and the visitor does reach what feels like the end — the room gone, the plate
 *   up — and finds there is more of it.
 */
const BEAT_VH = 170

export const HOME_CHAPTER_VH: Record<SectionId, number> = {
  hero: BEAT_VH * 3,
  work: BEAT_VH * 2,
  lab: BEAT_VH,
  archive: Math.round(BEAT_VH * 0.4),
  experience: BEAT_VH,
  services: BEAT_VH,
  process: BEAT_VH,
  about: BEAT_VH,
  contact: BEAT_VH,
  finale: Math.round(BEAT_VH * 4.4),
}

export const homeRailChapters = (
  labels: Record<SectionId, string>,
): RailChapter[] =>
  SECTION_IDS.map((id) => ({
    id,
    vh: HOME_CHAPTER_VH[id],
    label: labels[id],
  }))

export const CV_SECTION_IDS = [
  'cv-profile',
  'cv-experience',
  'cv-skills',
] as const

export const CASE_SECTION_IDS = [
  'case-overview',
  'case-deep',
  'case-close',
] as const

export const cvRailChapters = (copy: Copy): RailChapter[] => [
  {
    id: 'cv-profile',
    vh: 200,
    label: copy.cv.heading,
    body: copy.cv.intro,
  },
  {
    id: 'cv-experience',
    vh: 280,
    label: copy.cv.sections.experience,
    body: copy.experience.roles
      .map((role) => `${role.company}: ${role.role}. ${role.context}`)
      .join(' '),
  },
  {
    id: 'cv-skills',
    vh: 220,
    label: copy.cv.sections.skills,
    body: copy.cv.skills.map((skill) => `${skill.key}: ${skill.value}`).join(' '),
  },
]

export const caseRailChapters = (
  copy: Copy,
  study: CaseStudy,
): RailChapter[] => [
  {
    id: 'case-overview',
    vh: 220,
    label: study.title,
    body: study.summary,
  },
  {
    id: 'case-deep',
    vh: 260,
    label: copy.caseStudy.problem,
    body: `${study.problem} ${study.role} ${study.scope}`,
  },
  {
    id: 'case-close',
    vh: 200,
    label: copy.caseStudy.outcome,
    body: study.outcome,
  },
]
