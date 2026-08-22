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
     * Emit the client manifest. The bundle budget walks it to classify every
     * chunk by *who can actually load it* — critical path, base scene, or the
     * cinema-only layer — because that is the honest measure of what a phone
     * versus a capable desktop is asked to download. A filename convention
     * (`manualChunks` naming) was tried first and abandoned: under rolldown it
     * distorted the shared vendor chunk and silently pulled React internals onto
     * the critical path. The import graph cannot lie; a name can.
     */
    manifest: true,

    /*
     * The scene chunk is knowingly large. `scripts/bundle-budget.mjs` is what
     * actually gates size, per chunk and against the real critical path, so this
     * only silences a warning that cannot tell the two apart.
     */
    chunkSizeWarningLimit: 1600,
  },
})
