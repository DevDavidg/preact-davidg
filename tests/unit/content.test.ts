import { describe, expect, it } from 'vitest'
import { allCases, COPY, LOCALES, nextCase } from '../../src/content'
import { es } from '../../src/content/es'
import { en } from '../../src/content/en'
import { ARTIFACTS } from '../../src/scene/layout'

/**
 * The content model is the site's source of truth for copy, routing and the 3D
 * gallery at once, so its invariants are worth asserting rather than assuming.
 */
describe('content model', () => {
  it('keeps case slugs identical across locales so hreflang can pair them', () => {
    const slugs = (locale: 'es' | 'en') => allCases(locale).map((c) => c.slug)
    expect(slugs('en')).toEqual(slugs('es'))
  })

  it('has one 3D module placement per featured case', () => {
    for (const locale of LOCALES) {
      expect(COPY[locale].featured).toHaveLength(ARTIFACTS.length)
    }
  })

  it('gives every case a unique slug', () => {
    for (const locale of LOCALES) {
      const slugs = allCases(locale).map((entry) => entry.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    }
  })

  it('gives every module a plate string that appears nowhere in the document', () => {
    // The 3D typography is decorative: if a plate duplicated a heading it would
    // render the same words twice, once selectable and once not.
    for (const locale of LOCALES) {
      const copy = COPY[locale]
      const headings = [
        copy.hero.headline,
        copy.work.heading,
        ...copy.featured.map((entry) => entry.title),
      ]
      for (const study of copy.featured) {
        expect(study.plate).toBeTruthy()
        expect(headings).not.toContain(study.plate)
      }
    }
  })

  it('describes every image with alt text and intrinsic dimensions', () => {
    for (const locale of LOCALES) {
      for (const study of allCases(locale)) {
        expect(study.image.alt.length).toBeGreaterThan(10)
        expect(study.image.width).toBeGreaterThan(0)
        expect(study.image.height).toBeGreaterThan(0)
      }
    }
  })

  it('states evidence for every case', () => {
    for (const locale of LOCALES) {
      for (const study of allCases(locale)) {
        expect(study.evidence.length).toBeGreaterThan(0)
      }
    }
  })

  it('labels every project with its level of evidence', () => {
    for (const locale of LOCALES) {
      for (const study of allCases(locale)) {
        expect(study.kindLabel.length).toBeGreaterThan(0)
      }
    }
  })

  it('never claims a demo it does not link', () => {
    for (const locale of LOCALES) {
      for (const study of allCases(locale)) {
        if (study.demoUrl) expect(study.demoUrl).toMatch(/^https:\/\//)
        if (study.repoUrl) expect(study.repoUrl).toMatch(/^https:\/\//)
      }
    }
  })

  it('carries no expiring personal claims', () => {
    // An age or a "+N years" count is wrong within a year of being written; the
    // trajectory is expressed with fixed dates and the real list of teams instead.
    for (const locale of LOCALES) {
      const flat = JSON.stringify(COPY[locale])
      expect(flat).not.toMatch(/\+\s?\d+\s?(años|years)/i)
      expect(flat).not.toMatch(/\b\d{2}\s?(años|years old)\b/i)
    }
  })

  it('keeps both locales structurally identical', () => {
    const shape = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(shape)
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.keys(value as object)
            .sort()
            .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
        )
      }
      return typeof value
    }
    expect(shape(en)).toEqual(shape(es))
  })

  it('wraps around when asked for the case after the last one', () => {
    const cases = allCases('es')
    expect(nextCase('es', cases.at(-1)!.slug).slug).toBe(cases[0].slug)
  })
})
