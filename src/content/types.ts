/**
 * The content model. Everything the site says lives behind these types, so a
 * missing translation or a renamed field is a compile error rather than a blank
 * region on a prerendered page.
 */

export const LOCALES = ['es', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/**
 * How much evidence stands behind a piece of work. The label is rendered next to
 * every project so a concept piece is never mistaken for delivered client work.
 */
type ProjectKind = 'product' | 'concept' | 'experiment' | 'archive'

interface Media {
  src: string
  alt: string
  width: number
  height: number
}

interface LabelledValue {
  key: string
  value: string
}

interface Decision {
  title: string
  body: string
}

export interface CaseStudy {
  /** URL segment. Shared across locales so the two versions stay siblings. */
  slug: string
  title: string
  kind: ProjectKind
  /** Localised wording for `kind`, shown as a badge. */
  kindLabel: string
  /** Short technology/domain tags for scanning. */
  tags: string[]
  /** One sentence: what it is. */
  summary: string
  /** What changed because the thing exists. Qualitative unless measured. */
  outcome: string
  problem: string
  role: string
  scope: string
  stack: string[]
  constraints: string[]
  decisions: Decision[]
  contribution: string[]
  /** Only claims a visitor can check for themselves. */
  evidence: string[]
  demoUrl?: string
  repoUrl?: string
  image: Media
  /** Label for the 3D artifact plate in the scene. */
  plate: string
}

interface ServiceOffer {
  title: string
  /** The buyer problem, not the technology. */
  problem: string
  deliverable: string
  timeline: string
}

interface ProcessPhase {
  num: string
  /** Reactor subsystem name shown in the HUD. */
  phase: string
  title: string
  heading: string
  copy: string
}

interface Role {
  company: string
  role: string
  /** Fixed date range from the CV — never a rolling "+N years". */
  period: string
  context: string
  /** Present tense engagements render under "current". */
  current: boolean
}

export interface Copy {
  locale: Locale
  /** `<html lang>` and `Intl` locale. */
  htmlLang: string
  meta: {
    title: string
    description: string
    ogAlt: string
  }
  nav: {
    ariaLabel: string
    skipToContent: string
    home: string
    work: string
    experience: string
    services: string
    process: string
    about: string
    cta: string
    menuOpen: string
    menuClose: string
    soundOn: string
    soundOff: string
    langGroup: string
    langNames: Record<Locale, string>
  }
  hud: {
    subtitle: string
    subtitleStatic: string
    build: string
    hint: string
    boot: string
    phases: Record<string, string>
  }
  hero: {
    eyebrow: string
    title: string
    /** Rendered as the H1 and as the 3D headline. */
    headline: string
    lead: string
    ctaClient: string
    ctaRecruiter: string
    factExperience: string
    factStack: string
    factAvailability: string
    cue: string
  }
  work: {
    label: string
    heading: string
    intro: string
    featuredLabel: string
    labLabel: string
    labIntro: string
    archiveLabel: string
    openCase: string
    openDemo: string
    caseOf: string
  }
  experience: {
    label: string
    heading: string
    intro: string
    currentLabel: string
    previousLabel: string
    cvCta: string
    roles: Role[]
  }
  services: {
    label: string
    heading: string
    intro: string
    problemLabel: string
    deliverableLabel: string
    timelineLabel: string
    items: ServiceOffer[]
  }
  process: {
    label: string
    heading: string
    caption: string
    steps: ProcessPhase[]
  }
  about: {
    label: string
    heading: string
    portrait: string
    portraitAlt: string
    quote: string
    copy: string
    spec: LabelledValue[]
  }
  contact: {
    label: string
    live: string
    title: string
    lead: string
    email: string
    emailCta: string
    copyEmail: string
    copiedEmail: string
    responseTime: string
    social: { label: string; href: string; external: boolean }[]
  }
  footer: {
    copyright: string
    signature: string
    localeSwitchLabel: string
  }
  caseStudy: {
    backToWork: string
    overview: string
    problem: string
    role: string
    scope: string
    stack: string
    constraints: string
    decisions: string
    contribution: string
    evidence: string
    outcome: string
    viewDemo: string
    viewRepo: string
    nextCase: string
    noDemo: string
  }
  cv: {
    label: string
    heading: string
    intro: string
    print: string
    sections: {
      profile: string
      experience: string
      skills: string
      projects: string
      education: string
      languages: string
    }
    education: LabelledValue[]
    skills: LabelledValue[]
  }
  notFound: {
    title: string
    lead: string
    cta: string
  }
  localeGate: {
    title: string
    lead: string
    choose: Record<Locale, string>
  }
  /** Featured work drives the 3D gallery; lab and archive stay DOM-only. */
  featured: CaseStudy[]
  lab: CaseStudy[]
  archive: CaseStudy[]
}
