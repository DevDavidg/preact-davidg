
export function createNoiseTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const size = 256;
  canvas.width = size;
  canvas.height = size;

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() > 0.5 ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = Math.floor(Math.random() * 80) + 20;
  }

  ctx.putImageData(imageData, 0, 0);
  ctx.filter = "blur(0.5px)";
  ctx.drawImage(canvas, 0, 0);

  const bodyAfter = document.createElement("div");
  bodyAfter.style.position = "fixed";
  bodyAfter.style.top = "0";
  bodyAfter.style.left = "0";
  bodyAfter.style.width = "100%";
  bodyAfter.style.height = "100%";
  bodyAfter.style.pointerEvents = "none";
  bodyAfter.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
  bodyAfter.style.backgroundRepeat = "repeat";
  bodyAfter.style.opacity = "var(--grain-opacity, 0.12)";
  bodyAfter.style.zIndex = "1000";
  bodyAfter.style.mixBlendMode = "overlay";
  bodyAfter.style.transition = "opacity var(--transition-medium)";
  bodyAfter.classList.add("noise-overlay");

  document.body.appendChild(bodyAfter);
  return bodyAfter;
}

function generateNoiseData(
  data: Uint8ClampedArray,
  contrastLevel: string,
  intensity: number
) {
  const length = data.length;

  for (let i = 0; i < length; i += 4) {
    let noiseValue = 0;
    let alphaValue = 0;

    if (contrastLevel === "high") {
      noiseValue = Math.random() > 0.5 ? 255 * intensity : 0;
      alphaValue = Math.floor(Math.random() * 150) + 50;
    } else if (contrastLevel === "medium") {
      const isHighLight = Math.random() > 0.3;
      noiseValue = isHighLight
        ? 180 + Math.random() * 75 * intensity
        : Math.random() * 80 * intensity;
      alphaValue = Math.floor(Math.random() * 100) + 80;
    } else {
      noiseValue = 100 + Math.random() * 155 * intensity;
      alphaValue = Math.floor(Math.random() * 80) + 40;
    }

    data[i] = noiseValue;
    data[i + 1] = noiseValue;
    data[i + 2] = noiseValue;
    data[i + 3] = alphaValue;
  }
}

export function createCustomNoiseTexture({
  size = 256,
  opacity = 0.12,
  intensity = 0.8,
  zIndex = 1000,
  blendMode = "overlay",
  contrastLevel = "high",
} = {}) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = size;
  canvas.height = size;

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  generateNoiseData(data, contrastLevel, intensity);
  ctx.putImageData(imageData, 0, 0);

  if (contrastLevel !== "high") {
    ctx.filter = "blur(0.5px)";
    ctx.drawImage(canvas, 0, 0);
  }

  const noiseOverlay = document.createElement("div");
  noiseOverlay.style.position = "fixed";
  noiseOverlay.style.top = "0";
  noiseOverlay.style.left = "0";
  noiseOverlay.style.width = "100%";
  noiseOverlay.style.height = "100%";
  noiseOverlay.style.pointerEvents = "none";
  noiseOverlay.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
  noiseOverlay.style.backgroundRepeat = "repeat";
  noiseOverlay.style.opacity = opacity.toString();
  noiseOverlay.style.zIndex = zIndex.toString();
  noiseOverlay.style.mixBlendMode = blendMode;
  noiseOverlay.style.transition = "opacity 0.3s ease";
  noiseOverlay.classList.add("noise-overlay");

  document.body.appendChild(noiseOverlay);
  return noiseOverlay;
}

export function updateNoiseOpacity(isDarkTheme: boolean) {
  const overlay = document.querySelector(".noise-overlay");
  if (overlay && overlay instanceof HTMLElement) {
    overlay.style.opacity = isDarkTheme ? "0.15" : "0.12";
  }
}
