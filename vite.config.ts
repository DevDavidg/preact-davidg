import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  // Configuración de sourcemaps y debugging
  esbuild: {
    sourcemap: true,
    keepNames: true, // Preservar nombres de funciones para debugging
  },
  plugins: [
    preact(),
    // ❌ Compresión eliminada para evitar problemas en Vercel deploy
    // Solo generar stats.html cuando se especifique ANALYZE=true
    ...(process.env.ANALYZE === "true" 
      ? [visualizer({
          filename: "stats.html",
          open: false,
          gzipSize: true,
          brotliSize: true,
          template: "treemap", // Mejor visualización
        })]
      : []
    ),
  ],
  server: {
    sourcemapIgnoreList: false, // Mostrar sourcemaps de node_modules
    proxy: {
      "/api/proxy": {
        target: "https://drfapiprojects.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, "/projectcards/"),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
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
    sourcemap: mode === "development" ? true : false, // Sourcemaps solo en desarrollo
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
          if (!assetInfo.name) return "assets/[name]-[hash][extname]";
          
          // ❌ Excluir archivos de código fuente
          if (/\.(tsx?|jsx?)$/i.test(assetInfo.name)) {
            return "assets/temp/[name]-[hash][extname]"; // Los ponemos en temp para luego eliminarlos
          }
          
          // 🖼️ Imágenes en carpeta aparte
          if (/\.(png|jpe?g|svg|gif|tiff|webp|bmp|ico)$/i.test(assetInfo.name)) {
            return "assets/images/[name]-[hash][extname]";
          }

          // Otros assets
          return "assets/[name]-[hash][extname]";
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
}));
