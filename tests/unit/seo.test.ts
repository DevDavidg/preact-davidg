import { describe, expect, it } from 'vitest'
import { COPY } from '../../src/content'
import { casePath, cvPath, homePath } from '../../src/lib/routes'
import {
  caseSchema,
  cvSchema,
  gateSchema,
  homeSchema,
  pageMeta,
} from '../../src/lib/seo'
import { SITE_ORIGIN } from '../../src/lib/site'

const contentOf = (tags: ReturnType<typeof pageMeta>, key: string) =>
  tags.find(
    (tag) =>
      ('name' in tag && tag.name === key) ||
      ('property' in tag && tag.property === key),
  )

const hrefOf = (tags: ReturnType<typeof pageMeta>, rel: string, hrefLang?: string) =>
  tags.find(
    (tag) =>
      'tagName' in tag &&
      tag.tagName === 'link' &&
      tag.rel === rel &&
      (hrefLang === undefined || tag.hrefLang === hrefLang),
  )

describe('pageMeta', () => {
  it('ships a complete indexable head for the home page', () => {
    const tags = pageMeta({
      locale: 'es',
      path: homePath('es'),
      title: COPY.es.meta.title,
      description: COPY.es.meta.description,
    })

    expect(tags[0]).toEqual({ title: COPY.es.meta.title })
    expect(contentOf(tags, 'description')).toMatchObject({
      content: COPY.es.meta.description,
    })
    expect(contentOf(tags, 'robots')).toMatchObject({
      content: expect.stringContaining('index, follow'),
    })
    expect(hrefOf(tags, 'canonical')).toMatchObject({
      href: `${SITE_ORIGIN}/es`,
    })
    expect(hrefOf(tags, 'alternate', 'en')).toMatchObject({
      href: `${SITE_ORIGIN}/en`,
    })
    expect(hrefOf(tags, 'alternate', 'x-default')).toMatchObject({
      href: `${SITE_ORIGIN}/`,
    })
    expect(contentOf(tags, 'og:locale')).toMatchObject({ content: 'es_AR' })
    expect(contentOf(tags, 'og:locale:alternate')).toMatchObject({
      content: 'en_US',
    })
    expect(contentOf(tags, 'og:image:type')).toMatchObject({
      content: 'image/png',
    })
  })

  it('marks unknown case URLs noindex and drops hreflang', () => {
    const tags = pageMeta({
      locale: 'es',
      path: '/es/proyectos/missing',
      title: 'missing',
      description: 'missing',
      noindex: true,
    })

    expect(contentOf(tags, 'robots')).toMatchObject({
      content: 'noindex, follow',
    })
    expect(hrefOf(tags, 'alternate', 'en')).toBeUndefined()
  })

  it('emits article tags for a case study', () => {
    const study = COPY.es.featured[0]
    const tags = pageMeta({
      locale: 'es',
      path: casePath('es', study.slug),
      title: study.title,
      description: study.summary,
      image: study.image.src,
      imageAlt: study.image.alt,
      imageWidth: study.image.width,
      imageHeight: study.image.height,
      ogType: 'article',
      article: { section: study.kindLabel, tags: study.tags },
    })

    expect(contentOf(tags, 'og:type')).toMatchObject({ content: 'article' })
    expect(contentOf(tags, 'article:author')).toMatchObject({
      content: 'David Guillen',
    })
    expect(contentOf(tags, 'article:section')).toMatchObject({
      content: study.kindLabel,
    })
    expect(contentOf(tags, 'og:image:width')).toMatchObject({
      content: String(study.image.width),
    })
  })
})

describe('structured data', () => {
  it('describes the person once and lists featured work on home', () => {
    const schemas = homeSchema('es')
    const types = schemas.map((schema) => (schema as { '@type': string })['@type'])
    expect(types).toEqual(['WebSite', 'ProfilePage', 'ItemList'])

    const profile = schemas[1] as {
      mainEntity: { '@id': string; givenName: string; telephone: string }
    }
    expect(profile.mainEntity['@id']).toBe(`${SITE_ORIGIN}/#person`)
    expect(profile.mainEntity.givenName).toBe('David')
    expect(profile.mainEntity.telephone).toBe('+541170030947')
  })

  it('models a case as an Article with breadcrumbs', () => {
    const study = COPY.en.featured[0]
    const schemas = caseSchema('en', study)
    const types = schemas.map((schema) => (schema as { '@type': string })['@type'])
    expect(types).toEqual(['Article', 'BreadcrumbList'])

    const article = schemas[0] as { headline: string; url: string }
    expect(article.headline).toBe(study.title)
    expect(article.url).toBe(`${SITE_ORIGIN}${casePath('en', study.slug)}`)
  })

  it('gives the CV its own profile page', () => {
    const schemas = cvSchema('es')
    const profile = schemas.find(
      (schema) => (schema as { '@type': string })['@type'] === 'ProfilePage',
    ) as { url: string; name: string }
    expect(profile.url).toBe(`${SITE_ORIGIN}${cvPath('es')}`)
    expect(profile.name).toBe(COPY.es.meta.cvTitle)
  })

  it('keeps the language gate as the website node', () => {
    const [site] = gateSchema() as { '@type': string; url: string }[]
    expect(site['@type']).toBe('WebSite')
    expect(site.url).toBe(SITE_ORIGIN)
  })
})
