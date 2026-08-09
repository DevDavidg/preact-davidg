import type { CaseStudy, Copy, Locale } from '../../content'
import {
  ARTIFACTS,
  artifactGroupWindows,
  artifactLabelWindow,
} from '../layout'
import { trimLead, trimTitle } from '../kit/consoleLayout'
import type { SectionWindows } from '../ui/sectionRanges'
import type { ConsoleSpec } from './types'

/**
 * Home corridor: one console per beat, reserved Z slots, trimmed copy.
 * Long paragraphs live on /case and /cv — not here.
 */

export const homeConsoleSpecs = (
  copy: Copy,
  featured: CaseStudy[],
  locale: Locale,
  windows: SectionWindows = {},
): ConsoleSpec[] => {
  const caseSegment = locale === 'es' ? 'proyectos' : 'work'
  const groupWindows = artifactGroupWindows(windows.work)

  const specs: ConsoleSpec[] = [
    {
      id: 'hero',
      section: 'hero',
      width: 2.9,
      height: 1.85,
      z: 6.1,
      side: -1,
      lateral: -0.9,
      rise: 0.08,
      rows: [
        { kind: 'eyebrow', text: copy.hero.eyebrow },
        { kind: 'title', text: trimTitle(copy.hero.headline, 40), em: 0.24 },
        { kind: 'lead', text: trimLead(copy.hero.lead, 78) },
        { kind: 'data', text: copy.hero.factStack },
        { kind: 'data', text: copy.hero.factAvailability },
      ],
      actions: [
        {
          id: 'cta-client',
          label: copy.hero.ctaClient,
          kind: 'scroll',
          target: 'contact',
        },
        {
          id: 'cta-recruiter',
          label: copy.hero.ctaRecruiter,
          kind: 'scroll',
          target: 'experience',
        },
      ],
    },
  ]

  // Featured modules only — no separate work intro (kept the corridor exclusive).
  featured.slice(0, 3).forEach((study, index) => {
    const side: -1 | 1 = index % 2 === 0 ? -1 : 1
    const artifact = ARTIFACTS[index]
    const aw = groupWindows[index]
    const label = aw ? artifactLabelWindow(aw) : null

    specs.push({
      id: `module-${study.slug}`,
      section: 'work',
      width: 3.05,
      height: 1.85,
      z: artifact?.position[2] ?? 4.2 - index * 4.0,
      side,
      lateral: side * 0.75,
      rise: 0.1,
      moduleIndex: index,
      timing: aw
        ? {
            enter: aw.enter,
            span: aw.span,
            centre: aw.enter + aw.span * 0.55,
            exit: label
              ? Math.min(label.exit + 0.02, windows.work?.exit ?? 1)
              : aw.pass + 0.08,
            exitSpan: 0.05,
          }
        : undefined,
      rows: [
        {
          kind: 'eyebrow',
          text: `MÓDULO ${String(index + 1).padStart(2, '0')}  ·  ${study.kindLabel.toUpperCase()}`,
        },
        { kind: 'title', text: trimTitle(study.title, 28), em: 0.22 },
        { kind: 'lead', text: trimLead(study.summary, 76) },
        { kind: 'data', text: study.tags.slice(0, 4).join(' · ').toUpperCase() },
      ],
      actions: [
        {
          id: `case-${study.slug}`,
          label: copy.work.openCase.toUpperCase(),
          kind: 'route',
          target: `/${locale}/${caseSegment}/${study.slug}`,
        },
        ...(study.demoUrl
          ? [
              {
                id: `demo-${study.slug}`,
                label: copy.work.openDemo.toUpperCase(),
                kind: 'external' as const,
                target: study.demoUrl,
              },
            ]
          : []),
      ],
    })
  })

  specs.push(
    {
      id: 'lab',
      section: 'lab',
      width: 2.7,
      height: 1.6,
      z: -5.2,
      side: -1,
      rise: 0.12,
      rows: [
        { kind: 'eyebrow', text: `SECTOR 02 / ${copy.work.labLabel.toUpperCase()}` },
        { kind: 'title', text: trimTitle(copy.work.labLabel, 24), em: 0.22 },
        { kind: 'lead', text: trimLead(copy.work.labIntro, 78) },
        {
          kind: 'data',
          text: [...copy.lab, ...copy.archive]
            .slice(0, 4)
            .map((s) => s.title)
            .join(' · '),
        },
      ],
    },
    {
      id: 'experience',
      section: 'experience',
      width: 3.15,
      height: 1.95,
      z: -9.6,
      side: -1,
      rise: 0.1,
      rows: [
        { kind: 'eyebrow', text: copy.experience.label },
        { kind: 'title', text: trimTitle(copy.experience.heading, 42), em: 0.2 },
        { kind: 'lead', text: trimLead(copy.experience.intro, 78) },
        ...copy.experience.roles.slice(0, 3).map((role) => ({
          kind: 'data' as const,
          text: `${role.current ? '●' : '○'} ${role.company} — ${role.role}`,
        })),
      ],
      actions: [
        {
          id: 'cv',
          label: copy.experience.cvCta,
          kind: 'route',
          target: `/${locale}/cv`,
        },
      ],
    },
    {
      id: 'services',
      section: 'services',
      width: 2.8,
      height: 1.75,
      z: -12.0,
      side: 1,
      rise: 0.1,
      rows: [
        { kind: 'eyebrow', text: copy.services.label },
        { kind: 'title', text: trimTitle(copy.services.heading, 40), em: 0.2 },
        { kind: 'lead', text: trimLead(copy.services.intro, 78) },
        ...copy.services.items.slice(0, 3).map((item, i) => ({
          kind: 'data' as const,
          text: `${String(i + 1).padStart(2, '0')}  ${trimTitle(item.title, 30)}`,
        })),
      ],
    },
    {
      id: 'process',
      section: 'process',
      width: 2.75,
      height: 1.7,
      z: -14.2,
      side: -1,
      lateral: -1.1,
      rise: 0.12,
      rows: [
        { kind: 'eyebrow', text: copy.process.label },
        { kind: 'title', text: trimTitle(copy.process.heading, 40), em: 0.2 },
        ...copy.process.steps.map((step) => ({
          kind: 'data' as const,
          text: `${step.num}  ${step.title.toUpperCase()}`,
        })),
      ],
    },
    {
      id: 'about',
      section: 'about',
      width: 2.8,
      height: 1.8,
      z: -16.0,
      side: 1,
      lateral: 1.15,
      rise: 0.14,
      rows: [
        { kind: 'eyebrow', text: copy.about.label },
        { kind: 'title', text: trimTitle(copy.about.heading, 40), em: 0.2 },
        {
          kind: 'lead',
          text: trimLead(copy.about.quote.replace(/[«»]/g, ''), 80),
        },
        ...copy.about.spec.slice(0, 3).map((entry) => ({
          kind: 'data' as const,
          text: `${entry.key}  ${entry.value}`,
        })),
      ],
    },
    {
      id: 'contact',
      section: 'contact',
      width: 3.2,
      height: 2.0,
      z: -18.4,
      side: 0,
      lateral: 0,
      rise: 0.12,
      rows: [
        { kind: 'eyebrow', text: copy.contact.label, accent: 0.4 },
        { kind: 'title', text: trimTitle(copy.contact.title, 42), accent: 0.2, em: 0.2 },
        { kind: 'lead', text: trimLead(copy.contact.lead, 80) },
        { kind: 'data', text: copy.contact.responseTime },
      ],
      actions: [
        {
          id: 'mail',
          label: copy.contact.emailCta.toUpperCase(),
          kind: 'mailto',
          target: copy.contact.email,
        },
        {
          id: 'locale',
          label: locale === 'es' ? 'EN' : 'ES',
          kind: 'locale',
          target: locale === 'es' ? 'en' : 'es',
        },
        ...copy.contact.social.slice(0, 1).map((link) => ({
          id: `social-${link.label}`,
          label: link.label,
          kind: (link.external ? 'external' : 'route') as 'external' | 'route',
          target: link.href,
        })),
      ],
    },
  )

  return specs
}

/** Glyph source strings for atlas warm-up. */
export const homeConsoleSources = (
  copy: Copy,
  featured: CaseStudy[],
  locale: Locale,
): { role: 'display' | 'body' | 'mono'; text: string }[] => {
  const specs = homeConsoleSpecs(copy, featured, locale)
  return specs.flatMap((spec) => [
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
}
