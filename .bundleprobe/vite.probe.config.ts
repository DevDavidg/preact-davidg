import { defineConfig } from 'vite'
export default defineConfig({
  root: __dirname,
  resolve: { dedupe: ['react', 'react-dom', 'three'] },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: process.env.PROBE_OUT!,
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'es2022',
    lib: {
      entry: process.env.PROBE_ENTRY!,
      formats: ['es'],
      fileName: 'probe',
    },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
  },
})
