import type { Config } from '@react-router/dev/config'
import { staticPaths } from './src/lib/routes'

/**
 * No server runs in production: every route is rendered to static HTML at build
 * time and the 3D scene is layered on afterwards in the browser. `prerender`
 * reads the same manifest the sitemap does, so a route cannot be indexed without
 * also being built.
 */
export default {
  appDirectory: 'app',
  ssr: false,
  prerender: () => staticPaths(),
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config
