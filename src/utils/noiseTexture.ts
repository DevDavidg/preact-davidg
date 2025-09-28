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

export function updateNoiseOpacity(isDarkTheme: boolean) {
  const overlay = document.querySelector(".noise-overlay");
  if (overlay && overlay instanceof HTMLElement) {
    overlay.style.opacity = isDarkTheme ? "0.15" : "0.12";
  }
}
