/**
 * Deployment-level facts. The canonical origin has to be a real absolute URL for
 * canonical tags, hreflang, sitemap and Open Graph images to be valid, so it is
 * read from the environment with a documented default (see README).
 */

const FALLBACK_ORIGIN = 'https://davidguillen.dev'

const normaliseOrigin = (value: string) => value.replace(/\/+$/, '')

/**
 * Read defensively: this module is also imported by the asset and sitemap scripts,
 * which run in plain Node where `import.meta.env` does not exist.
 */
const configuredOrigin = (): string => {
  const fromVite = import.meta.env?.VITE_SITE_ORIGIN
  if (typeof fromVite === 'string' && fromVite) return fromVite

  const node = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process
  const fromNode = node?.env?.VITE_SITE_ORIGIN
  if (typeof fromNode === 'string' && fromNode) return fromNode

  return FALLBACK_ORIGIN
}

export const SITE_ORIGIN = normaliseOrigin(configuredOrigin())

/** Host without protocol, for display in share cards and the printed CV. */
export const SITE_HOST = SITE_ORIGIN.replace(/^https?:\/\//, '')

export const SITE_NAME = 'David Guillen'

/**
 * Last editorial revision, used as `lastmod` in the sitemap. Update when the
 * content model or a public URL changes in a way a crawler should recrawl.
 */
export const SITE_REVISED = '2026-08-13'

export const PERSON = {
  name: 'David Guillen',
  givenName: 'David',
  familyName: 'Guillen',
  jobTitle: 'Full Stack Senior',
  email: 'dev.davidg@gmail.com',
  telephone: '+541170030947',
  /** City only: precise location is not portfolio content. */
  locality: 'Buenos Aires',
  region: 'Buenos Aires',
  country: 'AR',
  countryName: 'Argentina',
  worksFor: {
    name: 'Nonconformist',
    url: 'https://nonconformist.digital',
  },
  alumniOf: [
    'Universidad Nacional Arturo Jauretche',
    'Escuela Da Vinci',
  ],
  sameAs: [
    'https://github.com/DevDavidg',
    'https://www.linkedin.com/in/david-guillen-5074281b8',
  ],
  /** Skills that the site itself demonstrates or the CV lists. */
  knowsAbout: [
    'Frontend architecture',
    'React',
    'React Native',
    'Next.js',
    'TypeScript',
    'Design systems',
    'WebGL',
    'Web accessibility',
    'Web performance',
  ],
} as const

export const absoluteUrl = (path: string) =>
  `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
