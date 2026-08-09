import type { Copy, Locale } from '../../content'
import { trimLead, trimTitle } from '../kit/consoleLayout'
import type { ConsoleSpec } from './types'

export const cvConsoleSpecs = (copy: Copy, locale: Locale): ConsoleSpec[] => [
  {
    id: 'cv-profile',
    section: 'cv-profile',
    width: 3.5,
    height: 2.3,
    z: 5.2,
    side: -1,
    rise: 0.25,
    rows: [
      { kind: 'eyebrow', text: copy.cv.label.toUpperCase() },
      { kind: 'title', text: trimTitle(copy.cv.heading, 36), em: 0.3 },
      { kind: 'lead', text: trimLead(copy.cv.intro, 95) },
      ...copy.about.spec.map((entry) => ({
        kind: 'data' as const,
        text: `${entry.key}  ${entry.value}`,
      })),
    ],
    actions: [
      {
        id: 'print',
        label: copy.cv.print.toUpperCase(),
        kind: 'print',
        target: 'print',
      },
      {
        id: 'mail',
        label: copy.contact.emailCta.toUpperCase(),
        kind: 'mailto',
        target: copy.contact.email,
      },
      {
        id: 'home',
        label: copy.nav.home.toUpperCase(),
        kind: 'route',
        target: `/${locale}`,
      },
    ],
  },
  {
    id: 'cv-experience',
    section: 'cv-experience',
    width: 3.6,
    height: 2.45,
    z: 0.2,
    side: 1,
    rise: 0.2,
    rows: [
      { kind: 'eyebrow', text: copy.cv.sections.experience.toUpperCase() },
      { kind: 'title', text: trimTitle(copy.experience.heading, 36) },
      ...copy.experience.roles.map((role) => ({
        kind: 'data' as const,
        text: `${role.current ? '●' : '○'} ${role.company} — ${role.role}`,
      })),
    ],
  },
  {
    id: 'cv-skills',
    section: 'cv-skills',
    width: 3.5,
    height: 2.3,
    z: -4.8,
    side: -1,
    rise: 0.25,
    rows: [
      { kind: 'eyebrow', text: copy.cv.sections.skills.toUpperCase() },
      { kind: 'title', text: trimTitle(copy.cv.sections.skills, 28), em: 0.28 },
      ...copy.cv.skills.slice(0, 6).map((skill) => ({
        kind: 'data' as const,
        text: `${skill.key}  ${trimLead(skill.value, 40)}`,
      })),
      {
        kind: 'data',
        text: copy.featured
          .slice(0, 3)
          .map((s) => s.title)
          .join(' · '),
      },
    ],
    actions: [
      {
        id: 'locale',
        label: locale === 'es' ? 'EN' : 'ES',
        kind: 'locale',
        target: locale === 'es' ? 'en' : 'es',
      },
    ],
  },
]

export const cvConsoleSources = (copy: Copy, locale: Locale) =>
  cvConsoleSpecs(copy, locale).flatMap((spec) => [
    ...spec.rows.map((row) => ({
      role: (row.role ??
        (row.kind === 'title' ? 'display' : 'mono')) as 'display' | 'mono',
      text: row.text,
    })),
    ...(spec.actions ?? []).map((action) => ({
      role: 'mono' as const,
      text: action.label,
    })),
  ])
