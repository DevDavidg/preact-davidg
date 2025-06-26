import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");
const SERVE_CONFIG = path.join(__dirname, "serve.json");

const app = express();
const PORT = process.env.PORT || 4173;

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API proxy middleware
app.use(
  "/api/proxy",
  createProxyMiddleware({
    target: "https://drfapiprojects.onrender.com",
    changeOrigin: true,
    pathRewrite: {
      "^/api/proxy": "/projectcards",
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(500).json({ error: "Proxy error occurred" });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `Proxying ${req.method} ${req.url} -> ${proxyReq.getHeader("host")}${
          proxyReq.path
        }`
      );
    },
  })
);

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, "dist")));

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

if (!fs.existsSync(DIST_DIR)) {
  console.log(
    "\x1b[33mLa carpeta dist no existe. Ejecutando build primero...\x1b[0m"
  );
  try {
    const buildCmd = "npm run build";
    console.log(`\x1b[36mEjecutando: ${buildCmd}\x1b[0m`);

    const buildProcess = exec(buildCmd);

    buildProcess.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    buildProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    buildProcess.on("close", (code) => {
      if (code === 0) {
        console.log("\x1b[32mBuild completado correctamente\x1b[0m");
        app.listen(PORT, () => {
          console.log(`Server running at http://localhost:${PORT}`);
          console.log(
            `API proxy available at http://localhost:${PORT}/api/proxy`
          );
        });
      } else {
        console.error(
          `\x1b[31mError al ejecutar build, código: ${code}\x1b[0m`
        );
        process.exit(1);
      }
    });
  } catch (error) {
    console.error(`\x1b[31mError al ejecutar build: ${error.message}\x1b[0m`);
    process.exit(1);
  }
} else {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API proxy available at http://localhost:${PORT}/api/proxy`);
  });
}

export default app;

function getBrowserCommand(url) {
  if (process.platform === "win32") return `start "" "${url}"`;
  if (process.platform === "darwin") return `open "${url}"`;
  return `xdg-open "${url}"`;
}

function openBrowser(port) {
  const url = `http://localhost:${port}`;
  console.log(`\n\x1b[32mAbriendo navegador en ${url}\x1b[0m`);

  const command = getBrowserCommand(url);

  exec(command, (error) => {
    if (error) {
      console.log(
        "\x1b[33mNo se pudo abrir el navegador automáticamente. Por favor, visita:\x1b[0m"
      );
      console.log(`\x1b[36m${url}\x1b[0m`);
    }
  });
}
