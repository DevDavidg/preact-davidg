import type { MetaDescriptor } from 'react-router'
import type {
  BreadcrumbList,
  CreativeWork,
  Person,
  ProfilePage,
  WebSite,
  WithContext,
} from 'schema-dts'
import { COPY, LOCALES, type CaseStudy, type Locale } from '../content'
import { casePath, homePath, translatePath } from './routes'
import { absoluteUrl, PERSON, SITE_NAME, SITE_ORIGIN } from './site'

/**
 * React Router's `meta` export takes a flat array of descriptors, so each route
 * builds its head here instead of assembling tags inline. Everything a crawler
 * needs — title, description, canonical, hreflang, social card — comes from one
 * call so a route cannot ship half a head.
 *
 * Structured data is deliberately *not* part of that array. React 19 hoists
 * metadata into `<head>`, and it ordered the JSON-LD `<script>` differently during
 * the prerender than during hydration, which failed hydration and made React throw
 * away the entire server-rendered tree. JSON-LD is valid anywhere in the document,
 * so `<JsonLd>` renders it in the body where the order is ours to control.
 */

const OG_IMAGE: Record<Locale, string> = {
  es: '/social/og-es.png',
  en: '/social/og-en.png',
}

interface PageMetaOptions {
  locale: Locale
  path: string
  title: string
  description: string
  /** Absolute-from-root path to the share image. */
  image?: string
  imageAlt?: string
  /** Case study pages are articles; everything else is a profile/site page. */
  ogType?: 'website' | 'article'
  noindex?: boolean
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
  ogType = 'website',
  noindex = false,
}: PageMetaOptions): MetaDescriptor[] => {
  const canonical = absoluteUrl(path)
  const card = absoluteUrl(image ?? OG_IMAGE[locale])
  const alt = imageAlt ?? COPY[locale].meta.ogAlt

  return [
    { title },
    { name: 'description', content: description },
    ...(noindex ? [{ name: 'robots', content: 'noindex, follow' }] : []),
    { tagName: 'link', rel: 'canonical', href: canonical },
    ...(noindex ? [] : alternateLinks(path)),

    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: locale === 'es' ? 'es_AR' : 'en_US' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: card },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: alt },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: card },
    { name: 'twitter:image:alt', content: alt },
  ]
}

const personSchema = (locale: Locale): Person => ({
  '@type': 'Person',
  '@id': `${SITE_ORIGIN}/#person`,
  name: PERSON.name,
  jobTitle: PERSON.jobTitle,
  url: absoluteUrl(homePath(locale)),
  image: absoluteUrl('/about/david-portrait.jpg'),
  email: `mailto:${PERSON.email}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: PERSON.locality,
    addressCountry: PERSON.country,
  },
  sameAs: [...PERSON.sameAs],
  knowsAbout: [...PERSON.knowsAbout],
  knowsLanguage: ['es', 'en'],
})

export const homeSchema = (locale: Locale): object[] => {
  const copy = COPY[locale]

  const site: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    inLanguage: locale,
    publisher: { '@id': `${SITE_ORIGIN}/#person` },
  }

  const profile: WithContext<ProfilePage> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${absoluteUrl(homePath(locale))}#profile`,
    url: absoluteUrl(homePath(locale)),
    name: copy.meta.title,
    description: copy.meta.description,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    mainEntity: personSchema(locale),
  }

  return [site, profile]
}

export const caseSchema = (locale: Locale, study: CaseStudy): object[] => {
  const url = absoluteUrl(casePath(locale, study.slug))
  const copy = COPY[locale]

  const work: WithContext<CreativeWork> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#case`,
    name: study.title,
    headline: study.title,
    description: study.summary,
    url,
    inLanguage: locale,
    author: { '@id': `${SITE_ORIGIN}/#person` },
    creator: { '@id': `${SITE_ORIGIN}/#person` },
    keywords: study.tags.join(', '),
    image: absoluteUrl(study.image.src),
    ...(study.demoUrl ? { sameAs: study.demoUrl } : {}),
  }

  const crumbs: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: absoluteUrl(homePath(locale)),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: copy.work.featuredLabel,
        item: `${absoluteUrl(homePath(locale))}#work`,
      },
      { '@type': 'ListItem', position: 3, name: study.title, item: url },
    ],
  }

  return [work, crumbs]
}
