import { en } from './en'
import { es } from './es'
import { LOCALES, type CaseStudy, type Copy, type Locale } from './types'

export { LOCALES }
export type { CaseStudy, Copy, Locale }
export type {
  Audience,
  Decision,
  LabelledValue,
  Media,
  ProcessPhase,
  ProjectKind,
  Role,
  ServiceOffer,
} from './types'

export const DEFAULT_LOCALE: Locale = 'es'

export const COPY: Record<Locale, Copy> = { es, en }

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

export const otherLocale = (locale: Locale): Locale =>
  locale === 'es' ? 'en' : 'es'

/** Featured work only: the 3D gallery has one module per entry. */
export const featuredCases = (locale: Locale): CaseStudy[] =>
  COPY[locale].featured

/** Every case that has its own prerendered page, in reading order. */
export const allCases = (locale: Locale): CaseStudy[] => {
  const copy = COPY[locale]
  return [...copy.featured, ...copy.lab, ...copy.archive]
}

export const findCase = (
  locale: Locale,
  slug: string | undefined,
): CaseStudy | undefined =>
  slug ? allCases(locale).find((entry) => entry.slug === slug) : undefined

/** The case after `slug`, wrapping around so the section always continues. */
export const nextCase = (locale: Locale, slug: string): CaseStudy => {
  const cases = allCases(locale)
  const index = cases.findIndex((entry) => entry.slug === slug)
  return cases[(index + 1) % cases.length]
}

/**
 * Slugs are locale-independent by design, so `/es/proyectos/x` and
 * `/en/work/x` are always siblings and hreflang can pair them without a map.
 */
export const CASE_SLUGS: string[] = allCases(DEFAULT_LOCALE).map(
  (entry) => entry.slug,
)
