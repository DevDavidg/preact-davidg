import type { RailChapter } from '../components/ScrollRail'
import type { CaseStudy, Copy } from '../content'
import { SECTION_IDS, type SectionId } from './routes'

/** Viewport multiples per home chapter — longer than a typical landing. */
export const HOME_CHAPTER_VH: Record<SectionId, number> = {
  hero: 170,
  work: 340,
  lab: 200,
  archive: 180,
  experience: 190,
  services: 170,
  process: 210,
  about: 190,
  contact: 180,
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
