import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 4173;
const DIST_DIR = path.join(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".tsx": "application/javascript",
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url || "/");

    urlPath = urlPath.split("?")[0];

    console.log(`${req.method} ${urlPath}`);

    let filePath = "";

    if (urlPath === "/" || !path.extname(urlPath)) {
      filePath = path.join(DIST_DIR, "index.html");
      return serveFile(filePath, "text/html; charset=UTF-8", res);
    }

    if (urlPath.startsWith("/assets/")) {
      filePath = path.join(DIST_DIR, urlPath);

      if (fs.existsSync(filePath)) {
        return serveFile(filePath, getMimeType(filePath), res);
      } else {
        console.error(`Archivo no encontrado: ${filePath}`);
        return serveNotFound(res);
      }
    }

    filePath = path.join(DIST_DIR, urlPath);

    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (fs.existsSync(filePath)) {
        return serveFile(filePath, getMimeType(filePath), res);
      }
    }

    return serveFile(
      path.join(DIST_DIR, "index.html"),
      "text/html; charset=UTF-8",
      res
    );
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("500 Error interno del servidor");
  }
});

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function serveFile(filePath, contentType, res) {
  try {
    const data = fs.readFileSync(filePath);

    const headers = {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    };

    if (!contentType.includes("html")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    }

    res.writeHead(200, headers);
    res.end(data);
  } catch (err) {
    console.error(`Error al servir ${filePath}:`, err);
    serveNotFound(res);
  }
}

function serveNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found - Archivo no encontrado");
}

if (!fs.existsSync(DIST_DIR)) {
  console.error(`\x1b[31mError: El directorio '${DIST_DIR}' no existe.\x1b[0m`);
  console.log(`\x1b[33mEjecutando 'npm run build' primero...\x1b[0m`);
  try {
    execSync("npm run build", { stdio: "inherit" });
    console.log(`\x1b[32mBuild completado con éxito.\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31mError al ejecutar build: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

server.listen(PORT, () => {
  console.log(
    `\x1b[32m===================================================\x1b[0m`
  );
  console.log(`\x1b[32mServidor iniciado en http://localhost:${PORT}\x1b[0m`);
  console.log(
    `\x1b[32m===================================================\x1b[0m`
  );
  console.log(`\x1b[36mSirviendo archivos desde: ${DIST_DIR}\x1b[0m`);

  const stats = { total: 0, types: {} };

  function scanDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDir(filePath);
      } else {
        stats.total++;
        const ext = path.extname(filePath).toLowerCase() || "sin extensión";
        stats.types[ext] = (stats.types[ext] || 0) + 1;
      }
    }
  }

  scanDir(DIST_DIR);

  console.log(`\n\x1b[33mResumen de archivos:\x1b[0m`);
  for (const [ext, count] of Object.entries(stats.types)) {
    const mime = MIME_TYPES[ext] || "desconocido";
    console.log(`  \x1b[36m${ext}\x1b[0m: ${count} archivo(s) - MIME: ${mime}`);
  }
  console.log(`\n\x1b[32mTotal: ${stats.total} archivos\x1b[0m`);

  const url = `http://localhost:${PORT}`;
  try {
    function getBrowserCommand(url) {
      if (process.platform === "win32") return `start "" "${url}"`;
      if (process.platform === "darwin") return `open "${url}"`;
      return `xdg-open "${url}"`;
    }

    const command = getBrowserCommand(url);

    import("child_process")
      .then(({ exec }) => {
        exec(command);
      })
      .catch(() => {
        console.log(
          `\x1b[33mNo se pudo abrir el navegador automáticamente. Por favor, visita:\x1b[0m`
        );
        console.log(`\x1b[36m${url}\x1b[0m`);
      });
  } catch (error) {
    console.log(
      `\x1b[33mNo se pudo abrir el navegador automáticamente. Por favor, visita:\x1b[0m`
    );
    console.log(`\x1b[36m${url}\x1b[0m`);
  }
});
