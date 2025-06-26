const fs = require("fs");
const path = require("path");

// Función para eliminar directorios recursivamente
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Removed directory: ${dirPath}`);
  }
}

// Función para eliminar archivos con patrón
function removeFiles(pattern) {
  const dir = path.dirname(pattern);
  const fileName = path.basename(pattern);

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const filesToRemove = files.filter((file) => {
      if (fileName.includes("*")) {
        const extension = fileName.replace("*", "");
        return file.endsWith(extension);
      }
      return file === fileName;
    });

    filesToRemove.forEach((file) => {
      const filePath = path.join(dir, file);
      fs.unlinkSync(filePath);
      console.log(`✓ Removed file: ${filePath}`);
    });
  }
}

// Limpiar directorios problemáticos
removeDir("dist/assets/ignored");
removeDir("dist/assets/temp");

// Limpiar archivos .tsx
removeFiles("dist/assets/*.tsx");

console.log("🧹 Build cleanup completed successfully!");
