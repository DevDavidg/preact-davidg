import { FunctionComponent } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import {
  MotionSection,
  MotionH2,
  MotionForm,
  MotionInput,
  MotionTextarea,
  MotionButton,
  MotionDiv,
  MotionSpan,
  MotionP,
} from "../utils/motion-components";
import { useTranslation } from "../hooks/useTranslation";

interface Vector2D {
  x: number;
  y: number;
}

interface FlowField {
  cols: number;
  rows: number;
  resolution: number;
  field: number[][];
  time: number;
}

interface ThemeColors {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

class NoiseGenerator {
  private static readonly permutation = Array.from({ length: 256 }, () =>
    Math.floor(Math.random() * 256)
  );
  private static readonly p = [
    ...NoiseGenerator.permutation,
    ...NoiseGenerator.permutation,
  ];

  private static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private static grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  static noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA], x, y, z),
          this.grad(this.p[BA], x - 1, y, z)
        ),
        this.lerp(
          u,
          this.grad(this.p[AB], x, y - 1, z),
          this.grad(this.p[BB], x - 1, y - 1, z)
        )
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(
          u,
          this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );
  }
}

class ParticleEntity {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  lifespan: number;
  maxLifespan: number;
  size: number;
  color: string;
  type: string;
  shape: string;
  isCaptured: boolean;
  captureForce: number;
  followMouse: boolean;
  shouldFlee: boolean;
  fleeDistance: number;
  amplitude: number;
  frequency: number;
  phase: number;
  trail: Vector2D[];
  trailLength: number;
  mode: string;
  targetPosition: Vector2D | null;
  repelForce: number;
  attractForce: number;
  noiseOffset: Vector2D;
  noiseScale: number;
  noiseStrength: number;
  glow: boolean;
  glowStrength: number;
  rotationAngle: number;
  rotationSpeed: number;
  patternType: string;
  patternScale: number;
  targetEntity: ParticleEntity | null;
  colorVariant: "primary" | "secondary" | "accent";
  colorAlpha: number;
  originalAlpha: number;

  constructor(
    id: number,
    x: number,
    y: number,
    colorVariant: "primary" | "secondary" | "accent" = "primary"
  ) {
    this.id = id;
    this.position = { x, y };
    this.velocity = {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
    };
    this.acceleration = { x: 0, y: 0 };
    this.maxLifespan = Math.random() * 400 + 200;
    this.lifespan = this.maxLifespan;
    this.size = Math.random() * 8 + 2;
    this.colorVariant = colorVariant;
    this.colorAlpha = 0;
    this.originalAlpha = Math.random() * 0.3 + 0.1;
    this.type = Math.random() > 0.7 ? "special" : "normal";
    this.shape =
      Math.random() > 0.8
        ? Math.random() > 0.5
          ? "square"
          : "triangle"
        : "circle";
    this.isCaptured = false;
    this.captureForce = 0;
    this.followMouse = Math.random() > 0.6;
    this.shouldFlee = Math.random() > 0.7;
    this.fleeDistance = 100 + Math.random() * 100;
    this.amplitude = Math.random() * 2 + 0.5;
    this.frequency = Math.random() * 0.05 + 0.01;
    this.phase = Math.random() * Math.PI * 2;
    this.trail = [];
    this.trailLength = Math.floor(Math.random() * 10) + 5;
    this.mode = Math.random() > 0.7 ? "attract" : "repel";
    this.targetPosition = null;
    this.repelForce = Math.random() * 0.5 + 0.1;
    this.attractForce = Math.random() * 0.1 + 0.05;
    this.noiseOffset = {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
    };
    this.noiseScale = 0.003 + Math.random() * 0.005;
    this.noiseStrength = Math.random() * 0.5 + 0.1;
    this.glow = Math.random() > 0.7;
    this.glowStrength = Math.random() * 15 + 5;
    this.rotationAngle = Math.random() * Math.PI * 2;
    this.rotationSpeed =
      (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
    this.patternType = ["wave", "spiral", "orbit", "noise"][
      Math.floor(Math.random() * 4)
    ];
    this.patternScale = Math.random() * 0.1 + 0.05;
    this.targetEntity = null;
    this.color = "";
  }

  applyForce(force: Vector2D) {
    this.acceleration.x += force.x;
    this.acceleration.y += force.y;
  }

  follow(flowfield: FlowField) {
    const x = Math.floor(this.position.x / flowfield.resolution);
    const y = Math.floor(this.position.y / flowfield.resolution);

    if (x >= 0 && x < flowfield.cols && y >= 0 && y < flowfield.rows) {
      const angle = flowfield.field[y][x];
      const force = {
        x: Math.cos(angle) * this.noiseStrength,
        y: Math.sin(angle) * this.noiseStrength,
      };
      this.applyForce(force);
    }
  }

  behaviors(
    mouse: { x: number | null; y: number | null },
    entities: ParticleEntity[]
  ) {
    if (mouse.x !== null && mouse.y !== null) {
      const distToMouse = Math.hypot(
        this.position.x - mouse.x,
        this.position.y - mouse.y
      );

      if (distToMouse < 150) {
        if (this.shouldFlee && distToMouse < this.fleeDistance) {
          const fleeForce = {
            x: ((this.position.x - mouse.x) / distToMouse) * 0.2,
            y: ((this.position.y - mouse.y) / distToMouse) * 0.2,
          };
          this.applyForce(fleeForce);
        } else if (this.followMouse) {
          const followForce = {
            x: ((mouse.x - this.position.x) / distToMouse) * 0.05,
            y: ((mouse.y - this.position.y) / distToMouse) * 0.05,
          };
          this.applyForce(followForce);
        }

        if (distToMouse < 50) {
          this.isCaptured = true;
          this.captureForce = 1 - distToMouse / 50;
          this.colorAlpha = this.originalAlpha + this.captureForce * 0.6;
        } else {
          this.isCaptured = false;
          this.captureForce = 0;
        }
      }
    }

    switch (this.patternType) {
      case "wave":
        this.applyForce({
          x:
            Math.sin(
              this.position.y * this.patternScale + performance.now() * 0.001
            ) * 0.01,
          y:
            Math.cos(
              this.position.x * this.patternScale + performance.now() * 0.001
            ) * 0.01,
        });
        break;
      case "spiral":
        const angle = Math.atan2(
          this.position.y - window.innerHeight / 2,
          this.position.x - window.innerWidth / 2
        );
        const dist = Math.hypot(
          this.position.x - window.innerWidth / 2,
          this.position.y - window.innerHeight / 2
        );
        this.applyForce({
          x: Math.cos(angle + dist * 0.01) * 0.01,
          y: Math.sin(angle + dist * 0.01) * 0.01,
        });
        break;
      case "orbit":
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const distToCenter = Math.hypot(
          this.position.x - centerX,
          this.position.y - centerY
        );
        if (distToCenter > 100) {
          this.applyForce({
            x: ((centerX - this.position.x) / distToCenter) * 0.01,
            y: ((centerY - this.position.y) / distToCenter) * 0.01,
          });
        }
        break;
      case "noise":
        this.noiseOffset.x += 0.01;
        this.noiseOffset.y += 0.01;
        const noiseVal = NoiseGenerator.noise(
          this.position.x * this.noiseScale + this.noiseOffset.x,
          this.position.y * this.noiseScale + this.noiseOffset.y,
          performance.now() * 0.0001
        );
        const noiseAngle = noiseVal * Math.PI * 2;
        this.applyForce({
          x: Math.cos(noiseAngle) * 0.02,
          y: Math.sin(noiseAngle) * 0.02,
        });
        break;
    }

    if (entities.length > 1) {
      for (let i = 0; i < Math.min(5, entities.length); i++) {
        if (this.id === entities[i].id) continue;

        const other = entities[i];
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          if (this.mode === "attract" && distance > 20) {
            this.applyForce({
              x: (dx / distance) * -this.attractForce,
              y: (dy / distance) * -this.attractForce,
            });
          } else if (this.mode === "repel") {
            this.applyForce({
              x: (dx / distance) * this.repelForce,
              y: (dy / distance) * this.repelForce,
            });
          }
        }
      }
    }
  }

  edges() {
    const margin = 50;
    const buffer = 0.5;

    if (this.position.x > window.innerWidth - margin) {
      const force = (this.position.x - (window.innerWidth - margin)) * buffer;
      this.applyForce({ x: -force * 0.01, y: 0 });
    }

    if (this.position.x < margin) {
      const force = (margin - this.position.x) * buffer;
      this.applyForce({ x: force * 0.01, y: 0 });
    }

    if (this.position.y > window.innerHeight - margin) {
      const force = (this.position.y - (window.innerHeight - margin)) * buffer;
      this.applyForce({ x: 0, y: -force * 0.01 });
    }

    if (this.position.y < margin) {
      const force = (margin - this.position.y) * buffer;
      this.applyForce({ x: 0, y: force * 0.01 });
    }
  }

  update(_time: number) {
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }
    this.trail.push({ ...this.position });

    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;

    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
    );
    if (speed > 2) {
      this.velocity.x = (this.velocity.x / speed) * 2;
      this.velocity.y = (this.velocity.y / speed) * 2;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;

    this.acceleration.x = 0;
    this.acceleration.y = 0;

    this.lifespan--;

    this.rotationAngle += this.rotationSpeed;

    if (this.lifespan > this.maxLifespan - 60) {
      this.colorAlpha =
        (1 - (this.maxLifespan - this.lifespan) / 60) * this.originalAlpha;
    } else if (this.lifespan < 60) {
      this.colorAlpha = (this.lifespan / 60) * this.originalAlpha;
    } else if (!this.isCaptured) {
      this.colorAlpha = this.originalAlpha;
    }
  }

  updateColor(themeColors: ThemeColors, _isDarkTheme: boolean) {
    let color = "";
    let alpha = this.colorAlpha;

    if (this.isCaptured) {
      alpha = Math.min(0.9, this.colorAlpha);
    }

    switch (this.colorVariant) {
      case "primary":
        color = themeColors.primary;
        break;
      case "secondary":
        color = themeColors.secondary;
        break;
      case "accent":
        color = themeColors.accent;
        break;
    }

    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      this.color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else {
      this.color = color;
    }
  }

  draw(ctx: CanvasRenderingContext2D, _isDarkTheme: boolean) {
    ctx.save();

    if (this.glow) {
      ctx.shadowBlur =
        this.glowStrength + (this.isCaptured ? this.captureForce * 10 : 0);
      ctx.shadowColor = this.color;
    }

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotationAngle);

    switch (this.shape) {
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "square":
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.lineTo(this.size, this.size);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();

    if (this.trail.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);

      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }

      if (this.color.startsWith("rgba")) {
        const rgba = this.color.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
        );
        if (rgba) {
          const trailAlpha = parseFloat(rgba[4]) * 0.3;
          ctx.strokeStyle = `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${trailAlpha})`;
        } else {
          ctx.strokeStyle = this.color;
        }
      } else {
        ctx.strokeStyle = this.color;
      }

      ctx.lineWidth = this.size * 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  isDead(): boolean {
    return this.lifespan <= 0;
  }
}

interface ThemeColors {
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
}

const ContactCanvas: FunctionComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<ParticleEntity[]>([]);
  const flowFieldRef = useRef<FlowField | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const frameRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const themeColorsRef = useRef<ThemeColors>({
    bg: "#ffffff",
    primary: "#000000",
    secondary: "#444444",
    accent: "#888888",
    muted: "#f2f2f2",
  });

  const getCSSVariableValue = (variableName: string): string => {
    if (typeof window === "undefined" || !document.documentElement) return "";
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  };

  const updateThemeColors = () => {
    const isDarkTheme = document.documentElement.classList.contains("dark");
    if (isDarkTheme) {
      themeColorsRef.current = {
        bg: getCSSVariableValue("--color-bg") || "#121212",
        primary: getCSSVariableValue("--color-primary") || "#ffffff",
        secondary: getCSSVariableValue("--color-secondary") || "#bbbbbb",
        accent: getCSSVariableValue("--color-accent") || "#666666",
        muted: getCSSVariableValue("--color-muted") || "#1e1e1e",
      };
    } else {
      themeColorsRef.current = {
        bg: getCSSVariableValue("--color-bg") || "#ffffff",
        primary: getCSSVariableValue("--color-primary") || "#000000",
        secondary: getCSSVariableValue("--color-secondary") || "#444444",
        accent: getCSSVariableValue("--color-accent") || "#888888",
        muted: getCSSVariableValue("--color-muted") || "#f2f2f2",
      };
    }
  };

  const createFlowField = (width: number, height: number) => {
    const resolution = 20;
    const cols = Math.floor(width / resolution);
    const rows = Math.floor(height / resolution);

    const field: number[][] = [];

    for (let y = 0; y < rows; y++) {
      field[y] = [];
      for (let x = 0; x < cols; x++) {
        const angle = NoiseGenerator.noise(x * 0.1, y * 0.1, 0) * Math.PI * 2;
        field[y][x] = angle;
      }
    }

    return {
      cols,
      rows,
      resolution,
      field,
      time: 0,
    };
  };

  const updateFlowField = (flowField: FlowField, time: number) => {
    flowField.time = time;
    for (let y = 0; y < flowField.rows; y++) {
      for (let x = 0; x < flowField.cols; x++) {
        const noise = NoiseGenerator.noise(x * 0.1, y * 0.1, time * 0.0002);
        flowField.field[y][x] = noise * Math.PI * 2;
      }
    }
  };

  const initCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) return;

    (ctx as any).imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = "high";

    updateThemeColors();

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      flowFieldRef.current = createFlowField(canvas.width, canvas.height);

      entitiesRef.current = [];

      const baseParticleCount = Math.min(
        (window.innerWidth * window.innerHeight) / 10000,
        100
      );
      const particleCount = Math.floor(baseParticleCount);

      const colorVariants: ("primary" | "secondary" | "accent")[] = [
        "primary",
        "secondary",
        "accent",
      ];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const colorVariant = colorVariants[i % colorVariants.length];
        entitiesRef.current.push(new ParticleEntity(i, x, y, colorVariant));
      }
    };

    const drawConnections = (
      ctx: CanvasRenderingContext2D,
      _isDarkTheme: boolean
    ) => {
      const entities = entitiesRef.current;

      const pairs = [];
      const maxDistance = 150;
      const maxConnections = 3;

      const connectionCounts = new Map<number, number>();
      entities.forEach((e) => connectionCounts.set(e.id, 0));

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i];
          const e2 = entities[j];

          if (
            connectionCounts.get(e1.id)! >= maxConnections ||
            connectionCounts.get(e2.id)! >= maxConnections
          ) {
            continue;
          }

          const dx = e1.position.x - e2.position.x;
          const dy = e1.position.y - e2.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            pairs.push({ e1, e2, distance });
            connectionCounts.set(e1.id, connectionCounts.get(e1.id)! + 1);
            connectionCounts.set(e2.id, connectionCounts.get(e2.id)! + 1);
          }
        }
      }

      pairs.sort((a, b) => a.distance - b.distance);

      for (const pair of pairs) {
        const { e1, e2, distance } = pair;
        const opacity = Math.pow(1 - distance / maxDistance, 2) * 0.5;

        const gradient = ctx.createLinearGradient(
          e1.position.x,
          e1.position.y,
          e2.position.x,
          e2.position.y
        );

        const color1 = e1.color.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
        );
        const color2 = e2.color.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
        );

        if (color1 && color2) {
          const alpha1 = parseFloat(color1[4]) * opacity;
          const alpha2 = parseFloat(color2[4]) * opacity;

          gradient.addColorStop(
            0,
            `rgba(${color1[1]}, ${color1[2]}, ${color1[3]}, ${alpha1})`
          );
          gradient.addColorStop(
            1,
            `rgba(${color2[1]}, ${color2[2]}, ${color2[3]}, ${alpha2})`
          );

          ctx.beginPath();
          ctx.moveTo(e1.position.x, e1.position.y);

          if (Math.random() > 0.7) {
            const midX = (e1.position.x + e2.position.x) / 2;
            const midY = (e1.position.y + e2.position.y) / 2;
            const offset = Math.sin(performance.now() * 0.001) * 20;

            ctx.quadraticCurveTo(
              midX + offset,
              midY + offset,
              e2.position.x,
              e2.position.y
            );
          } else {
            ctx.lineTo(e2.position.x, e2.position.y);
          }

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.5 + (e1.captureForce + e2.captureForce);

          if (e1.glow || e2.glow) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = e1.color;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    };

    const animate = (timestamp: number) => {
      if (!canvas || !ctx || !isVisibleRef.current) return;

      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDarkTheme = document.documentElement.classList.contains("dark");

      if (Math.random() < 0.05) {
        updateThemeColors();
      }

      if (flowFieldRef.current) {
        updateFlowField(flowFieldRef.current, timestamp);
      }

      for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
        const entity = entitiesRef.current[i];

        if (flowFieldRef.current) {
          entity.follow(flowFieldRef.current);
        }

        entity.behaviors(mouseRef.current, entitiesRef.current);
        entity.edges();
        entity.update(timestamp);

        entity.updateColor(themeColorsRef.current, isDarkTheme);

        if (entity.isDead()) {
          entitiesRef.current.splice(i, 1);

          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const colorVariant = entity.colorVariant;
          entitiesRef.current.push(
            new ParticleEntity(Date.now() + i, x, y, colorVariant)
          );
        }
      }

      drawConnections(ctx, isDarkTheme);

      entitiesRef.current.forEach((entity) => {
        entity.draw(ctx, isDarkTheme);
      });

      if (entitiesRef.current.length < 100 && Math.random() < 0.01) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;

        switch (edge) {
          case 0:
            x = Math.random() * canvas.width;
            y = -10;
            break;
          case 1:
            x = canvas.width + 10;
            y = Math.random() * canvas.height;
            break;
          case 2:
            x = Math.random() * canvas.width;
            y = canvas.height + 10;
            break;
          case 3:
            x = -10;
            y = Math.random() * canvas.height;
            break;
          default:
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
        }

        const colorVariantOptions: ("primary" | "secondary" | "accent")[] = [
          "primary",
          "secondary",
          "accent",
        ];
        const randomIndex = Math.floor(Math.random() * 3);
        entitiesRef.current.push(
          new ParticleEntity(Date.now(), x, y, colorVariantOptions[randomIndex])
        );
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    });

    canvas.addEventListener("touchmove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
    });

    canvas.addEventListener("mouseout", () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    });

    canvas.addEventListener("click", (_e) => {
      if (!mouseRef.current.x || !mouseRef.current.y) return;

      const burstCount = 6;
      const colorVariants: ("primary" | "secondary" | "accent")[] = [
        "primary",
        "secondary",
        "accent",
      ];

      for (let i = 0; i < burstCount; i++) {
        const angle = (i / burstCount) * Math.PI * 2;
        const distance = 5;
        const x = mouseRef.current.x + Math.cos(angle) * distance;
        const y = mouseRef.current.y + Math.sin(angle) * distance;

        const entity = new ParticleEntity(
          Date.now() + i,
          x,
          y,
          colorVariants[i % 3]
        );
        entity.type = "special";
        entity.followMouse = false;
        entity.shouldFlee = false;
        entity.glow = true;
        entity.size = 5 + Math.random() * 3;
        entity.originalAlpha = 0.6;

        entity.velocity = {
          x: Math.cos(angle) * (2 + Math.random()),
          y: Math.sin(angle) * (2 + Math.random()),
        };

        entity.updateColor(
          themeColorsRef.current,
          document.documentElement.classList.contains("dark")
        );

        entitiesRef.current.push(entity);
      }
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;

          if (entry.isIntersecting) {
            if (!frameRef.current) {
              lastTimeRef.current = performance.now();
              frameRef.current = requestAnimationFrame(animate);
            }
          } else if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = 0;
          }
        });
      },
      { threshold: 0.1 }
    );

    visibilityObserver.observe(canvas);
    resizeCanvas();
    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      visibilityObserver.disconnect();
      observer.disconnect();
    };
  };

  useEffect(() => {
    initCanvas();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full -z-0"
    />
  );
};

const Contact: FunctionComponent = () => {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      message: "",
    };

    let isValid = true;

    if (!formState.name.trim()) {
      newErrors.name = "Por favor escribe tu nombre";
      isValid = false;
    }

    if (!formState.email.trim()) {
      newErrors.email = "Por favor escribe tu email";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      newErrors.email = "Por favor ingresa un email válido";
      isValid = false;
    }

    if (!formState.message.trim()) {
      newErrors.message = "Por favor escribe un mensaje";
      isValid = false;
    } else if (formState.message.trim().length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setFormStatus({
        success: true,
        message:
          "¡Gracias por tu mensaje! Me pondré en contacto contigo pronto.",
      });

      setFormState({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setFormStatus(null);
      }, 5000);
    } catch (error) {
      console.error(error);
      setFormStatus({
        success: false,
        message:
          "Ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: Event & {
      currentTarget: HTMLInputElement | HTMLTextAreaElement;
    }
  ) => {
    const { name, value } = e.currentTarget;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <MotionSection
      id="contact"
      className="min-h-screen py-20 relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      data-animate="true"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ContactCanvas />
      </div>

      <div className="absolute top-40 -left-20 w-64 h-64 bg-light-accent/5 dark:bg-dark-accent/5 rounded-full filter blur-3xl animate-float" />
      <div
        className="absolute bottom-40 right-10 w-80 h-80 bg-gradient-radial from-light-accent/5 to-transparent dark:from-dark-accent/5 animate-pulse-glow"
        style={{ animationDuration: "15s" }}
      />

      <div className="container relative z-10">
        <MotionDiv
          className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center mb-12"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <MotionH2
            className="text-4xl md:text-6xl font-bold mb-6 perspective preserve-3d"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="block">{t("contact.title")}</span>
          </MotionH2>

          <MotionP
            className="text-light-secondary dark:text-dark-secondary text-lg md:text-xl max-w-2xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t("contact.subtitle")}
          </MotionP>
        </MotionDiv>

        <MotionDiv
          className="max-w-5xl mx-auto glass-card overflow-hidden shadow-xl border border-light-accent/10 dark:border-dark-accent/10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="grid md:grid-cols-5 w-full">
            <div className="md:col-span-2 p-8 md:p-10 bg-gradient-to-br from-light-accent/10 to-light-primary/5 dark:from-dark-accent/10 dark:to-dark-primary/5">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-gradient">
                    {t("contact.connect")}
                  </h3>
                  <p className="text-light-secondary dark:text-dark-secondary mb-8">
                    {t("contact.description")}
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-white/10 dark:bg-white/5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {t("contact.contactInfo.email")}
                        </h4>
                        <a
                          href="mailto:dev.davidg@gmail.com"
                          className="text-light-accent dark:text-dark-accent hover:underline"
                        >
                          dev.davidg@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-white/10 dark:bg-white/5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {t("contact.contactInfo.location")}
                        </h4>
                        <p className="text-light-secondary dark:text-dark-secondary">
                          Villa Crespo, CABA, Argentina
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-medium mb-4">
                    {t("contact.follow")}
                  </h4>
                  <div className="flex space-x-3">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 dark:bg-white/5 hover:bg-light-accent/30 dark:hover:bg-dark-accent/30 hover-float transition-all duration-300"
                      aria-label="GitHub"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 dark:bg-white/5 hover:bg-light-accent/30 dark:hover:bg-dark-accent/30 hover-float transition-all duration-300"
                      aria-label="LinkedIn"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 dark:bg-white/5 hover:bg-light-accent/30 dark:hover:bg-dark-accent/30 hover-float transition-all duration-300"
                      aria-label="Twitter"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 dark:bg-white/5 hover:bg-light-accent/30 dark:hover:bg-dark-accent/30 hover-float transition-all duration-300"
                      aria-label="Instagram"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <MotionDiv
              className="md:col-span-3 p-8 md:p-10"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-6">
                {t("contact.form.title")}
              </h3>

              <MotionForm
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-light-secondary dark:text-dark-secondary"
                    >
                      {t("contact.form.name")}
                    </label>
                    <div className="relative">
                      <MotionInput
                        id="name"
                        name="name"
                        type="text"
                        value={formState.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-lg border ${
                          errors.name
                            ? "border-red-500"
                            : "border-light-accent/20 dark:border-dark-accent/20"
                        } focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-300`}
                        placeholder={t("contact.form.namePlaceholder")}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                      {errors.name && (
                        <MotionP
                          className="absolute text-sm text-red-500 mt-1"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.name}
                        </MotionP>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-light-secondary dark:text-dark-secondary"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <MotionInput
                        id="email"
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-lg border ${
                          errors.email
                            ? "border-red-500"
                            : "border-light-accent/20 dark:border-dark-accent/20"
                        } focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-300`}
                        placeholder={t("contact.form.emailPlaceholder")}
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      />
                      {errors.email && (
                        <MotionP
                          className="absolute text-sm text-red-500 mt-1"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.email}
                        </MotionP>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-light-secondary dark:text-dark-secondary"
                  >
                    {t("contact.form.subject")}
                  </label>
                  <MotionInput
                    id="subject"
                    name="subject"
                    type="text"
                    value={formState.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-lg border border-light-accent/20 dark:border-dark-accent/20 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-300"
                    placeholder="¿De qué se trata?"
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-light-secondary dark:text-dark-secondary"
                  >
                    {t("contact.form.message")}
                  </label>
                  <div className="relative">
                    <MotionTextarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formState.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/5 dark:bg-black/5 backdrop-blur-sm rounded-lg border ${
                        errors.message
                          ? "border-red-500"
                          : "border-light-accent/20 dark:border-dark-accent/20"
                      } focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-300`}
                      placeholder={t("contact.form.messagePlaceholder")}
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    />
                    {errors.message && (
                      <MotionP
                        className="absolute text-sm text-red-500 mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.message}
                      </MotionP>
                    )}
                  </div>
                </div>

                <div>
                  <MotionButton
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-gradient transform transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">
                      {isSubmitting
                        ? t("contact.form.submitting")
                        : t("contact.form.submit")}
                    </span>
                    <MotionSpan
                      className="absolute inset-0 bg-gradient-to-r from-light-primary to-light-accent dark:from-dark-primary dark:to-dark-accent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </MotionButton>
                </div>
              </MotionForm>

              {formStatus && (
                <MotionDiv
                  className={`mt-6 p-4 rounded-lg ${
                    formStatus.success
                      ? "bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formStatus.message}
                </MotionDiv>
              )}
            </MotionDiv>
          </div>
        </MotionDiv>
      </div>
    </MotionSection>
  );
};

export default Contact;
