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
 *
 * The trim limits here are a *ceiling on the source*, not the line budget. They
 * used to be tight enough to cut mid-sentence on every viewport — a lead clipped
 * at 62 characters before the layout had even measured the plate — so the copy
 * was truncated twice, once here and once again by `layoutConsoleRows`. Only the
 * layout knows how wide the plate is and how big the type ended up, so it is the
 * one that should decide; these now only keep a genuinely long paragraph from
 * being handed to a console at all.
 */

/**
 * Lab and archive, one console per project.
 *
 * These used to be a single plate naming four of the titles, so most of the work
 * the static page lists existed in the DOM and nowhere in the room. Every study
 * now gets its own beat: `sequenceTimings` splits a section's measured window
 * evenly across the consoles it carries, and `HOME_CHAPTER_VH` scales the lab and
 * archive chapters by how many studies there are — so adding a case lengthens the
 * chapter instead of shortening everybody else's beat.
 *
 * No bay. A bay is a cinema-only rig wired to an `ARTIFACTS` slot and to the
 * conduits that light it, and there are four slots for the featured modules. The
 * lab plate carries the words, the case route carries the shot.
 */
const projectSpecs = (
  studies: CaseStudy[],
  section: string,
  copy: Copy,
  locale: Locale,
  caseSegment: string,
  [front, back]: [number, number],
): ConsoleSpec[] =>
  studies.map((study, index) => {
    // Alternating lanes, opposite the featured run's opening side, so the lab
    // reads as its own stretch of corridor rather than a continuation.
    const side: -1 | 1 = index % 2 === 0 ? 1 : -1
    const t = (index + 1) / (studies.length + 1)

    return {
      id: `lab-${study.slug}`,
      section,
      width: 2.8,
      height: 1.9,
      z: front + (back - front) * t,
      side,
      lateral: side * 0.7,
      rise: 0.12,
      rows: [
        { kind: 'eyebrow', text: study.kindLabel.toUpperCase() },
        { kind: 'title', text: trimTitle(study.title, 28) },
        { kind: 'lead', text: trimLead(study.summary, 108) },
        {
          kind: 'data',
          text: study.tags.slice(0, 3).join(' · ').toUpperCase(),
        },
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
    }
  })

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
      width: 3.1,
      height: 2.15,
      z: 6.1,
      side: -1,
      lateral: -0.9,
      rise: 0.08,
      rows: [
        // The corridor opens on an operator file, not on a job title. The
        // document keeps the LinkedIn line; this is the machine's own label for
        // the person operating it.
        { kind: 'eyebrow', text: copy.hud.operator },
        { kind: 'title', text: trimTitle(copy.hero.headline, 52) },
        { kind: 'lead', text: trimLead(copy.hero.lead, 112) },
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
      width: 3.15,
      height: 2.1,
      z: artifact?.position[2] ?? 4.2 - index * 4.0,
      side,
      lateral: side * 0.75,
      rise: 0.1,
      moduleIndex: index,
      // Three bays, three silhouettes. A vault has to be unsealed, a book of
      // quotes breathes, a totem stacks — so the charge chapter is three
      // different objects instead of the same panel three times.
      bay: {
        shot: study.image.src,
        chassis: (['vault', 'ledger', 'totem'] as const)[index % 3],
        label: study.title,
      },
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
        // The eyebrow is one line by construction, so it carries the operation
        // and nothing else. Evidence of what kind of work this is moves down to
        // the data row, where it has room to be read instead of being clipped.
        {
          kind: 'eyebrow',
          text: copy.hud.moduleLock.replace(
            '{n}',
            String(index + 1).padStart(2, '0'),
          ),
        },
        { kind: 'title', text: trimTitle(study.title, 28) },
        { kind: 'lead', text: trimLead(study.summary, 108) },
        {
          kind: 'data',
          text: `${study.kindLabel.toUpperCase()}  ·  ${study.tags
            .slice(0, 3)
            .join(' · ')
            .toUpperCase()}`,
        },
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
      width: 2.85,
      height: 1.95,
      z: -5.2,
      side: -1,
      rise: 0.12,
      rows: [
        { kind: 'eyebrow', text: copy.hud.sectorLabel },
        { kind: 'title', text: trimTitle(copy.work.labLabel, 24) },
        { kind: 'lead', text: trimLead(copy.work.labIntro, 108) },
        // The titles used to be listed here because this was the only lab plate
        // there was. Each study has its own console now, so the intro just opens
        // the sector.
      ],
    },
    ...projectSpecs(copy.lab, 'lab', copy, locale, caseSegment, [-5.45, -9.3]),
    ...projectSpecs(
      copy.archive,
      'archive',
      copy,
      locale,
      caseSegment,
      [-9.35, -9.55],
    ),
    {
      id: 'experience',
      section: 'experience',
      width: 3.2,
      height: 2.2,
      z: -9.6,
      side: -1,
      rise: 0.1,
      rows: [
        { kind: 'eyebrow', text: copy.experience.label },
        { kind: 'title', text: trimTitle(copy.experience.heading, 42) },
        { kind: 'lead', text: trimLead(copy.experience.intro, 96) },
        // Roles as telemetry, not as a résumé list: a filled marker is a live
        // channel, a hollow one is a closed log entry.
        //
        // Promoted above the default data priority because on this console the
        // log *is* the content — an experience plate that drops every role to
        // keep an intro paragraph has kept the wrong half.
        ...copy.experience.roles.slice(0, 3).map((role) => ({
          kind: 'data' as const,
          priority: 4,
          text: `${role.current ? '●' : '○'} ${role.company.toUpperCase()} — ${
            role.current ? copy.hud.phases.TRANSMIT : role.role
          }`,
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
      width: 2.95,
      height: 2.05,
      z: -12.0,
      side: 1,
      rise: 0.1,
      rows: [
        { kind: 'eyebrow', text: copy.services.label },
        { kind: 'title', text: trimTitle(copy.services.heading, 40) },
        { kind: 'lead', text: trimLead(copy.services.intro, 96) },
        ...copy.services.items.slice(0, 3).map((item, i) => ({
          kind: 'data' as const,
          priority: 4,
          text: `${String(i + 1).padStart(2, '0')}  ${trimTitle(item.title, 30)}`,
        })),
      ],
    },
    {
      id: 'process',
      section: 'process',
      width: 2.9,
      height: 1.95,
      z: -14.2,
      side: -1,
      lateral: -1.1,
      rise: 0.12,
      rows: [
        { kind: 'eyebrow', text: copy.process.label },
        { kind: 'title', text: trimTitle(copy.process.heading, 40) },
        ...copy.process.steps.map((step) => ({
          kind: 'data' as const,
          priority: 4,
          text: `${step.num}  ${step.title.toUpperCase()}`,
        })),
      ],
    },
    {
      id: 'about',
      section: 'about',
      width: 2.95,
      height: 2.05,
      z: -16.0,
      side: 1,
      lateral: 1.15,
      rise: 0.14,
      rows: [
        { kind: 'eyebrow', text: copy.about.label },
        { kind: 'title', text: trimTitle(copy.about.heading, 40) },
        {
          kind: 'lead',
          text: trimLead(copy.about.quote.replace(/[«»]/g, ''), 96),
        },
        ...copy.about.spec.slice(0, 3).map((entry) => ({
          kind: 'data' as const,
          priority: 4,
          text: `${entry.key}  ${entry.value}`,
        })),
      ],
    },
    {
      id: 'contact',
      section: 'contact',
      width: 2.3,
      height: 1.55,
      z: -18.4,
      side: 0,
      lateral: 0,
      // Slight drop — the nucleus reads above the plate, not behind a wall.
      rise: -0.07,
      uplink: true,
      rows: [
        // The mail address is not a footer button here — it is the frequency the
        // machine transmits on once it reaches ignition.
        { kind: 'eyebrow', text: copy.hud.uplinkReady, accent: 0.4 },
        { kind: 'title', text: trimTitle(copy.contact.title, 42), accent: 0.2 },
        { kind: 'lead', text: trimLead(copy.contact.lead, 108) },
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
