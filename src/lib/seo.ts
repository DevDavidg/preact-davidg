import type { MetaDescriptor } from 'react-router'
import type {
  Article,
  BreadcrumbList,
  ImageObject,
  ItemList,
  Offer,
  Person,
  ProfilePage,
  WebSite,
  WithContext,
} from 'schema-dts'
import { COPY, LOCALES, type CaseStudy, type Locale } from '../content'
import { casePath, cvPath, homePath, translatePath } from './routes'
import { absoluteUrl, PERSON, SITE_NAME, SITE_ORIGIN } from './site'

/**
 * Direction: every public URL ships a complete head (title, description,
 * canonical, hreflang, robots, social) plus typed JSON-LD. Case and CV pages
 * also render a real document when the reactor is off, so crawlers never see
 * an empty scroll rail.
 *
 * Structured data stays out of `<head>`. React 19 hoists metadata and ordered
 * the JSON-LD `<script>` differently during prerender vs hydration, which
 * discarded the server-rendered tree. `<JsonLd>` renders it in the body.
 */

export const OG_IMAGE: Record<Locale, string> = {
  es: '/social/og-es.png',
  en: '/social/og-en.png',
}

export const OG_LOCALE: Record<Locale, string> = {
  es: 'es_AR',
  en: 'en_US',
}

const INDEXABLE_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

interface PageMetaOptions {
  locale: Locale
  path: string
  title: string
  description: string
  /** Absolute-from-root path to the share image. */
  image?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  /** Case study pages are articles; everything else is a profile/site page. */
  ogType?: 'website' | 'article'
  article?: {
    section?: string
    tags?: string[]
  }
  noindex?: boolean
}

const imageMime = (src: string) => {
  if (src.endsWith('.png')) return 'image/png'
  if (src.endsWith('.webp')) return 'image/webp'
  if (src.endsWith('.avif')) return 'image/avif'
  return 'image/jpeg'
}

const alternateLinks = (path: string): MetaDescriptor[] => [
  ...LOCALES.map((locale) => ({
    tagName: 'link',
    rel: 'alternate',
    hrefLang: locale,
    href: absoluteUrl(translatePath(path, locale)),
  })),
  {
    tagName: 'link',
    rel: 'alternate',
    hrefLang: 'x-default',
    href: absoluteUrl('/'),
  },
]

export const pageMeta = ({
  locale,
  path,
  title,
  description,
  image,
  imageAlt,
  imageWidth = 1200,
  imageHeight = 630,
  ogType = 'website',
  article,
  noindex = false,
}: PageMetaOptions): MetaDescriptor[] => {
  const canonical = absoluteUrl(path)
  const cardPath = image ?? OG_IMAGE[locale]
  const card = absoluteUrl(cardPath)
  const alt = imageAlt ?? COPY[locale].meta.ogAlt
  const otherLocale = locale === 'es' ? 'en' : 'es'

  return [
    { title },
    { name: 'description', content: description },
    {
      name: 'robots',
      content: noindex ? 'noindex, follow' : INDEXABLE_ROBOTS,
    },
    { name: 'googlebot', content: noindex ? 'noindex, follow' : INDEXABLE_ROBOTS },
    { tagName: 'link', rel: 'canonical', href: canonical },
    { tagName: 'link', rel: 'author', href: absoluteUrl(homePath(locale)) },
    ...(noindex ? [] : alternateLinks(path)),

    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    { property: 'og:locale:alternate', content: OG_LOCALE[otherLocale] },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: card },
    { property: 'og:image:secure_url', content: card },
    { property: 'og:image:type', content: imageMime(cardPath) },
    { property: 'og:image:width', content: String(imageWidth) },
    { property: 'og:image:height', content: String(imageHeight) },
    { property: 'og:image:alt', content: alt },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: card },
    { name: 'twitter:image:alt', content: alt },

    ...(ogType === 'article'
      ? [
          { property: 'article:author', content: PERSON.name },
          ...(article?.section
            ? [{ property: 'article:section', content: article.section }]
            : []),
          ...(article?.tags ?? []).map((tag) => ({
            property: 'article:tag',
            content: tag,
          })),
        ]
      : []),
  ]
}

const personImage = (): ImageObject => ({
  '@type': 'ImageObject',
  url: absoluteUrl('/about/david-portrait.jpg'),
  contentUrl: absoluteUrl('/about/david-portrait.jpg'),
  caption: PERSON.name,
  width: '800',
  height: '800',
})

const personSchema = (locale: Locale): Person => {
  const copy = COPY[locale]

  const offers: Offer[] = copy.services.items.map((item) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: item.title,
      description: item.deliverable,
    },
  }))

  return {
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}/#person`,
    name: PERSON.name,
    givenName: PERSON.givenName,
    familyName: PERSON.familyName,
    jobTitle: PERSON.jobTitle,
    description: copy.about.copy,
    url: absoluteUrl(homePath(locale)),
    image: personImage(),
    email: `mailto:${PERSON.email}`,
    telephone: PERSON.telephone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: PERSON.locality,
      addressRegion: PERSON.region,
      addressCountry: PERSON.country,
    },
    nationality: {
      '@type': 'Country',
      name: PERSON.countryName,
    },
    worksFor: {
      '@type': 'Organization',
      name: PERSON.worksFor.name,
      url: PERSON.worksFor.url,
    },
    alumniOf: PERSON.alumniOf.map((name) => ({
      '@type': 'EducationalOrganization',
      name,
    })),
    sameAs: [...PERSON.sameAs],
    knowsAbout: [...PERSON.knowsAbout],
    knowsLanguage: [
      { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: PERSON.jobTitle,
      occupationLocation: {
        '@type': 'City',
        name: PERSON.locality,
      },
    },
    makesOffer: offers,
  }
}

const websiteSchema = (locale: Locale): WithContext<WebSite> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  name: SITE_NAME,
  alternateName: ['DG', 'DevDavidg'],
  url: SITE_ORIGIN,
  description: COPY[locale].meta.description,
  inLanguage: [...LOCALES],
  publisher: { '@id': `${SITE_ORIGIN}/#person` },
  author: { '@id': `${SITE_ORIGIN}/#person` },
})

const featuredList = (locale: Locale): WithContext<ItemList> => {
  const copy = COPY[locale]
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${absoluteUrl(homePath(locale))}#work`,
    name: copy.work.heading,
    numberOfItems: copy.featured.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: copy.featured.map((study, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: study.title,
      url: absoluteUrl(casePath(locale, study.slug)),
      description: study.summary,
    })),
  }
}

const crumbs = (
  locale: Locale,
  items: { name: string; path: string }[],
): WithContext<BreadcrumbList> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: SITE_NAME,
      item: absoluteUrl(homePath(locale)),
    },
    ...items.map((item, index) => ({
      '@type': 'ListItem' as const,
      position: index + 2,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : absoluteUrl(item.path),
    })),
  ],
})

export const homeSchema = (locale: Locale): object[] => {
  const copy = COPY[locale]
  const url = absoluteUrl(homePath(locale))

  const profile: WithContext<ProfilePage> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name: copy.meta.title,
    description: copy.meta.description,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#person` },
    mainEntity: personSchema(locale),
    breadcrumb: crumbs(locale, []),
  }

  return [websiteSchema(locale), profile, featuredList(locale)]
}

export const caseSchema = (locale: Locale, study: CaseStudy): object[] => {
  const url = absoluteUrl(casePath(locale, study.slug))
  const copy = COPY[locale]
  const image = absoluteUrl(study.image.src)

  const article: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#case`,
    headline: study.title,
    name: study.title,
    description: study.summary,
    url,
    inLanguage: locale,
    articleSection: study.kindLabel,
    keywords: study.tags.join(', '),
    about: study.tags,
    author: { '@id': `${SITE_ORIGIN}/#person` },
    creator: { '@id': `${SITE_ORIGIN}/#person` },
    publisher: { '@id': `${SITE_ORIGIN}/#person` },
    mainEntityOfPage: url,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    image: {
      '@type': 'ImageObject',
      url: image,
      contentUrl: image,
      caption: study.image.alt,
      width: String(study.image.width),
      height: String(study.image.height),
    },
    ...(study.demoUrl ? { sameAs: study.demoUrl } : {}),
  }

  return [
    article,
    crumbs(locale, [
      {
        name: copy.work.featuredLabel,
        path: `${homePath(locale)}#work`,
      },
      { name: study.title, path: url },
    ]),
  ]
}

export const cvSchema = (locale: Locale): object[] => {
  const copy = COPY[locale]
  const url = absoluteUrl(cvPath(locale))

  const profile: WithContext<ProfilePage> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#cv`,
    url,
    name: copy.meta.cvTitle,
    description: copy.meta.cvDescription,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#person` },
    mainEntity: personSchema(locale),
    breadcrumb: crumbs(locale, [{ name: copy.cv.label, path: url }]),
  }

  return [websiteSchema(locale), profile]
}

export const gateSchema = (): object[] => [websiteSchema('es')]
