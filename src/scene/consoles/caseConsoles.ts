import type { CaseStudy, Copy, Locale } from '../../content'
import { trimLead, trimTitle } from '../kit/consoleLayout'
import type { ConsoleSpec } from './types'

export const caseConsoleSpecs = (
  copy: Copy,
  study: CaseStudy,
  locale: Locale,
  nextSlug: string,
  nextTitle: string,
): ConsoleSpec[] => {
  const caseSegment = locale === 'es' ? 'proyectos' : 'work'

  return [
    {
      id: 'case-overview',
      section: 'case-overview',
      width: 3.6,
      height: 2.35,
      z: 5.5,
      side: -1,
      rise: 0.25,
      rows: [
        { kind: 'eyebrow', text: `${copy.work.caseOf.toUpperCase()}  ·  ${study.kindLabel.toUpperCase()}` },
        { kind: 'title', text: trimTitle(study.title, 32), em: 0.32 },
        { kind: 'lead', text: trimLead(study.summary, 95) },
        { kind: 'data', text: study.tags.slice(0, 5).join(' · ').toUpperCase() },
        { kind: 'data', text: trimLead(study.outcome, 70) },
      ],
      actions: [
        {
          id: 'back',
          label: copy.caseStudy.backToWork.toUpperCase(),
          kind: 'route',
          target: `/${locale}#work`,
        },
        ...(study.demoUrl
          ? [
              {
                id: 'demo',
                label: copy.caseStudy.viewDemo.toUpperCase(),
                kind: 'external' as const,
                target: study.demoUrl,
              },
            ]
          : []),
      ],
    },
    {
      id: 'case-deep',
      section: 'case-deep',
      width: 3.5,
      height: 2.4,
      z: 0.5,
      side: 1,
      rise: 0.2,
      rows: [
        { kind: 'eyebrow', text: copy.caseStudy.problem.toUpperCase() },
        { kind: 'title', text: trimTitle(copy.caseStudy.overview, 28), em: 0.26 },
        { kind: 'lead', text: trimLead(study.problem, 95) },
        {
          kind: 'data',
          text: `${copy.caseStudy.role.toUpperCase()}  ${trimLead(study.role, 50)}`,
        },
        {
          kind: 'data',
          text: `${copy.caseStudy.scope.toUpperCase()}  ${trimLead(study.scope, 50)}`,
        },
        {
          kind: 'data',
          text: study.stack.slice(0, 5).join(' · ').toUpperCase(),
        },
      ],
      actions: study.repoUrl
        ? [
            {
              id: 'repo',
              label: copy.caseStudy.viewRepo.toUpperCase(),
              kind: 'external',
              target: study.repoUrl,
            },
          ]
        : undefined,
    },
    {
      id: 'case-close',
      section: 'case-close',
      width: 3.4,
      height: 2.2,
      z: -4.5,
      side: -1,
      rise: 0.25,
      rows: [
        { kind: 'eyebrow', text: copy.caseStudy.outcome.toUpperCase() },
        { kind: 'title', text: trimTitle(study.outcome, 40), em: 0.26 },
        {
          kind: 'lead',
          text: trimLead(
            study.decisions[0]
              ? `${study.decisions[0].title}: ${study.decisions[0].body}`
              : study.contribution[0] ?? study.evidence[0] ?? study.outcome,
            95,
          ),
        },
        {
          kind: 'data',
          text: study.evidence.slice(0, 2).join(' · ') || study.contribution.slice(0, 2).join(' · '),
        },
      ],
      actions: [
        {
          id: 'next',
          label: `${copy.caseStudy.nextCase.toUpperCase()}: ${trimTitle(nextTitle, 18)}`,
          kind: 'route',
          target: `/${locale}/${caseSegment}/${nextSlug}`,
        },
      ],
    },
  ]
}

export const caseConsoleSources = (
  copy: Copy,
  study: CaseStudy,
  locale: Locale,
  nextSlug: string,
  nextTitle: string,
) =>
  caseConsoleSpecs(copy, study, locale, nextSlug, nextTitle).flatMap((spec) => [
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
