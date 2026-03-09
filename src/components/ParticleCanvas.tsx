import { useEffect, useRef } from "preact/hooks";

const MAX_PARTICLES = 55;
const GRID_CELL = 80;

const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || initRef.current) return;
    initRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const hexToHue = (hex: string): number => {
      const re = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
      const m = re.exec(hex);
      if (!m) return 200;
      const r = Number.parseInt(m[1], 16) / 255;
      const g = Number.parseInt(m[2], 16) / 255;
      const b = Number.parseInt(m[3], 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      if (max !== min) {
        const d = max - min;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      return Math.round(h * 360);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      baseAlpha: number;
      phase: number;
      hue: number;
    }[] = [];

    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent")
        .trim() || "#0984e3";
    const baseHue = hexToHue(accent.startsWith("#") ? accent : "#0984e3");

    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.4,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        baseAlpha: Math.random() * 0.4 + 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: baseHue + (Math.random() - 0.5) * 25,
      });
    }

    let cancelled = false;
    let paused = false;
    let frameId = 0;

    const draw = (time: number) => {
      if (cancelled || paused) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pulse = Math.sin(time * 0.001) * 0.1 + 0.9;
      const grid = new Map<string, number[]>();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        const cellX = Math.floor(p.x / GRID_CELL);
        const cellY = Math.floor(p.y / GRID_CELL);
        const key = `${cellX},${cellY}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(i);

        const alpha =
          p.baseAlpha * pulse * (0.8 + 0.2 * Math.sin(time * 0.002 + p.phase));
        const size =
          p.size * (0.95 + 0.1 * Math.sin(time * 0.003 + p.phase * 2));

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 55%, ${alpha})`;
        ctx.fill();
      }

      Array.from(grid.values()).forEach((indices) => {
        for (let a = 0; a < indices.length; a++) {
          for (let b = a + 1; b < indices.length; b++) {
            const p = particles[indices[a]];
            const q = particles[indices[b]];
            const dist = Math.hypot(p.x - q.x, p.y - q.y);
            if (dist < GRID_CELL) {
              const lineAlpha = (1 - dist / GRID_CELL) * 0.08 * pulse;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(140, 140, 160, ${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      });

      frameId = requestAnimationFrame(draw);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        paused = true;
        cancelAnimationFrame(frameId);
      } else if (!cancelled && paused) {
        paused = false;
        frameId = requestAnimationFrame(draw);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    if (document.visibilityState === "visible") {
      frameId = requestAnimationFrame(draw);
    }

    return () => {
      cancelled = true;
      initRef.current = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
      style={{ mixBlendMode: "soft-light", contain: "strict" }}
    />
  );
};

export default ParticleCanvas;
