import { describe, expect, it } from 'vitest'
import { CASE_SLUGS, LOCALES } from '../../src/content'
import { localeFromPath } from '../../src/lib/locale'
import {
  casePath,
  cvPath,
  homePath,
  NOT_FOUND_PATH,
  staticPaths,
  translatePath,
} from '../../src/lib/routes'

describe('routing', () => {
  it('derives the locale from the URL and nothing else', () => {
    expect(localeFromPath('/es')).toBe('es')
    expect(localeFromPath('/en/work/chroma-dev')).toBe('en')
    // An unknown first segment must not silently become a valid locale page.
    expect(localeFromPath('/fr')).toBe('es')
    expect(localeFromPath('/')).toBe('es')
  })

  it('uses a localised segment for case studies', () => {
    expect(casePath('es', 'chroma-dev')).toBe('/es/proyectos/chroma-dev')
    expect(casePath('en', 'chroma-dev')).toBe('/en/work/chroma-dev')
  })

  it('translates any path to its sibling in the other locale', () => {
    expect(translatePath('/es', 'en')).toBe('/en')
    expect(translatePath('/es/proyectos/sphere-app', 'en')).toBe(
      '/en/work/sphere-app',
    )
    expect(translatePath('/en/work/sphere-app', 'es')).toBe(
      '/es/proyectos/sphere-app',
    )
    expect(translatePath('/en/cv', 'es')).toBe('/es/cv')
    // A path with no locale still has to resolve somewhere sensible.
    expect(translatePath('/', 'en')).toBe('/en')
  })

  it('round-trips a translation back to the original', () => {
    for (const slug of CASE_SLUGS) {
      const original = casePath('es', slug)
      expect(translatePath(translatePath(original, 'en'), 'es')).toBe(original)
    }
  })

  it('prerenders every URL the sitemap can advertise', () => {
    const paths = staticPaths()
    for (const locale of LOCALES) {
      expect(paths).toContain(homePath(locale))
      expect(paths).toContain(cvPath(locale))
      for (const slug of CASE_SLUGS) {
        expect(paths).toContain(casePath(locale, slug))
      }
    }
    expect(paths).toContain('/')
    expect(paths).toContain(NOT_FOUND_PATH)
  })

  it('lists no path twice', () => {
    const paths = staticPaths()
    expect(new Set(paths).size).toBe(paths.length)
  })
})
