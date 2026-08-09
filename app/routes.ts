import { index, route, type RouteConfig } from '@react-router/dev/routes'

/**
 * Localised URLs, one module per page. The case-study segment differs per
 * language (`proyectos` / `work`) so each locale reads like a native site; the
 * module rejects mismatched combinations so the same case never resolves at two
 * URLs.
 *
 * Static segments outrank dynamic ones in React Router's matcher, so `/404`
 * resolves to the not-found page rather than to `/:locale`.
 */
export default [
  index('routes/locale-gate.tsx'),
  route('404', 'routes/not-found.tsx', { id: 'not-found' }),
  route(':locale', 'routes/home.tsx'),
  route(':locale/cv', 'routes/cv.tsx'),
  route(':locale/proyectos/:slug', 'routes/case.tsx', { id: 'case-es' }),
  route(':locale/work/:slug', 'routes/case.tsx', { id: 'case-en' }),
  route('*', 'routes/not-found.tsx', { id: 'not-found-splat' }),
] satisfies RouteConfig
