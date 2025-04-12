import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 4173;
const DIST_DIR = path.join(__dirname, "dist");

const app = express();

let compressionEnabled = false;
try {
  const compression = await import("express-compression");
  app.use(
    compression.default({
      brotli: { enabled: true, zlib: {} },
    })
  );
  compressionEnabled = true;
  console.log("Compresión habilitada (gzip/brotli)");
} catch (err) {
  console.log("Módulo de compresión no disponible. Ejecutando sin compresión.");
  console.log(
    "Para habilitar la compresión, instala: npm install express-compression --save-dev"
  );
}

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  );
  next();
});

app.use((req, res, next) => {
  const url = req.url || "";

  if (url.includes(":")) {
    return next();
  }

  function setCacheControlHeader(res) {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  if (
    url === "/" ||
    url.endsWith(".html") ||
    url === "" ||
    !path.extname(url)
  ) {
    res.set("Content-Type", "text/html; charset=utf-8");
  } else if (url.endsWith(".js")) {
    res.set("Content-Type", "text/javascript");
    setCacheControlHeader(res);
  } else if (url.endsWith(".css")) {
    res.set("Content-Type", "text/css");
    setCacheControlHeader(res);
  } else if (
    [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"].some((ext) =>
      url.endsWith(ext)
    )
  ) {
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".svg": "image/svg+xml",
    };
    const ext = path.extname(url);
    if (mimeTypes[ext]) {
      res.set("Content-Type", mimeTypes[ext]);
      setCacheControlHeader(res);
    }
  } else if (
    [".woff", ".woff2", ".ttf", ".otf", ".eot"].some((ext) => url.endsWith(ext))
  ) {
    const mimeTypes = {
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".otf": "font/otf",
      ".eot": "application/vnd.ms-fontobject",
    };
    const ext = path.extname(url);
    if (mimeTypes[ext]) {
      res.set("Content-Type", mimeTypes[ext]);
      setCacheControlHeader(res);
    }
  }

  next();
});

app.use(
  express.static(DIST_DIR, {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

app.get("*", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

if (!fs.existsSync(DIST_DIR)) {
  console.error(`\x1b[31mError: El directorio '${DIST_DIR}' no existe.\x1b[0m`);
  console.log(
    "\x1b[33mAsegúrate de ejecutar 'npm run build' antes de iniciar el servidor.\x1b[0m"
  );
  process.exit(1);
}

const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\x1b[32mServidor Express ejecutándose en ${url}\x1b[0m`);
  console.log(
    `\x1b[36mTamaño de la aplicación: ${formatBytes(
      getFolderSize(DIST_DIR)
    )}\x1b[0m`
  );
  if (compressionEnabled) {
    console.log(
      `\x1b[32mCompresión activa: Los archivos se servirán con gzip/brotli\x1b[0m`
    );
  }
  console.log(`\x1b[36mAbriendo el navegador...\x1b[0m`);

  try {
    setTimeout(() => {
      import("child_process")
        .then(({ exec }) => {
          function getBrowserCommand(url) {
            if (process.platform === "win32") return `start ""${url}""`;
            if (process.platform === "darwin") return `open "${url}"`;
            return `xdg-open "${url}"`;
          }

          const command = getBrowserCommand(url);
          exec(command);
        })
        .catch(() => {
          console.log(
            `\x1b[33mNo se pudo abrir el navegador automáticamente. Por favor, abre: ${url}\x1b[0m`
          );
        });
    }, 500);
  } catch (error) {
    console.log(
      `\x1b[33mNo se pudo abrir el navegador automáticamente. Por favor, abre: ${url}\x1b[0m`
    );
  }
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("\n\x1b[33mServidor detenido\x1b[0m");
    process.exit(0);
  });
});

function getFolderSize(folderPath) {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        totalSize += stat.size;
      } else if (stat.isDirectory()) {
        totalSize += getFolderSize(filePath);
      }
    }
  } catch (err) {
    console.error(`Error al calcular tamaño: ${err.message}`);
  }

  return totalSize;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
