import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],

  resolve: {
    /*
     * React Three Fiber is a second React *renderer*, so it imports React itself.
     * Without deduping, dependency pre-bundling gave it its own copy and every hook
     * inside the canvas subtree threw "Invalid hook call" — the scene then failed
     * into the error boundary and the site silently served the document-only
     * experience even on capable machines.
     */
    dedupe: ['react', 'react-dom', 'three'],
  },

  build: {
    /*
     * The scene chunk is knowingly large. `scripts/bundle-budget.mjs` is what
     * actually gates size, per chunk and against the real critical path, so this
     * only silences a warning that cannot tell the two apart.
     */
    chunkSizeWarningLimit: 700,
  },
})
