import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");
const SERVE_CONFIG = path.join(__dirname, "serve.json");

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
        startServer();
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
  startServer();
}

function startServer() {
  const PORT = 4173;

  if (!fs.existsSync(SERVE_CONFIG)) {
    console.warn(
      "\x1b[33mAdvertencia: No se encontró el archivo serve.json. Se usará la configuración por defecto.\x1b[0m"
    );
  }

  const serveCommand = fs.existsSync(SERVE_CONFIG)
    ? `npx serve --config ${SERVE_CONFIG} -p ${PORT} --no-clipboard`
    : `npx serve dist -p ${PORT} --no-compression --single --no-clipboard`;

  console.log(
    "\n\x1b[32m===================================================\x1b[0m"
  );
  console.log(
    `\x1b[32mIniciando servidor en http://localhost:${PORT}...\x1b[0m`
  );
  console.log(
    "\x1b[32m===================================================\x1b[0m"
  );
  console.log(`\x1b[36mComando: ${serveCommand}\x1b[0m`);

  const serverProcess = exec(serveCommand);

  let serverStarted = false;

  serverProcess.stdout.on("data", (data) => {
    process.stdout.write(data);

    if (
      !serverStarted &&
      (data.includes("Serving!") || data.includes("Available on:"))
    ) {
      serverStarted = true;
      setTimeout(() => {
        openBrowser(PORT);
      }, 500);
    }
  });

  serverProcess.stderr.on("data", (data) => {
    process.stderr.write(`\x1b[31m${data}\x1b[0m`);
  });

  process.on("SIGINT", () => {
    console.log("\n\x1b[33mDeteniendo servidor...\x1b[0m");
    serverProcess.kill();
    process.exit(0);
  });
}

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
