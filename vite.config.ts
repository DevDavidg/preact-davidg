import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
// import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    preact(),
    // viteCompression({
    //   algorithm: "gzip",
    // }),
    // viteCompression({
    //   algorithm: "brotliCompress",
    // }),
    visualizer({
      filename: "stats.html",
      open: false,
    }),
  ],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    assetsInlineLimit: 0,
    cssMinify: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["preact", "preact/hooks", "preact/compat"],
          "framer-motion": ["framer-motion"],
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.type === "asset" && assetInfo.name) {
            if (
              /\.(png|jpe?g|svg|gif|tiff|webp|bmp|ico)$/i.test(assetInfo.name)
            ) {
              return `assets/images/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  preview: {
    port: 4173,
    open: true,
    headers: {
      "Content-Type": "text/javascript",
      "Cache-Control": "public, max-age=31536000",
    },
  },
});
