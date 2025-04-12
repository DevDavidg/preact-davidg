import { ENV } from "../config/env";

export const PERFORMANCE_CONFIG = {
  targetFPS: 60,
  frameTimeThreshold: 16.67,
  longFrameThreshold: 33.33,
  memoryWarningThreshold: 90,
  lowEndDeviceThreshold: 30,
  maxLogEntries: 1000,
  scanInterval: 2000,
  rafThrottle: 0,
  highEndDeviceThreshold: 8,
  ultraHighEndDeviceThreshold: 16,
};

interface PerformanceLog {
  fps: number;
  frameTime: number;
  timestamp: number;
  memoryUsage: number;
  animationCount: number;
  renderCount: number;
}

interface PerformanceStats {
  totalFrames: number;
  totalFrameTime: number;
  averageFps: number;
  averageFrameTime: number;
  minFps: number;
  maxFps: number;
  maxFrameTime: number;
  longFrames: number;
  slowestComponents: [string, number][];
  avgFps: number;
  memoryTrend: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private animationCount = 0;
  private renderCount = 0;
  private isRunning = false;
  private startTime = performance.now();
  private frameCount = 0;
  private currentFps = 0;
  private lastFrameTime = 0;
  private totalFrameTime = 0;
  private logs: PerformanceLog[] = [];
  private readonly stats: PerformanceStats = {
    totalFrames: 0,
    totalFrameTime: 0,
    averageFps: 0,
    averageFrameTime: 0,
    minFps: 60,
    maxFps: 0,
    maxFrameTime: 0,
    longFrames: 0,
    slowestComponents: [],
    avgFps: 0,
    memoryTrend: 0,
  };
  private readonly eventListeners: Map<string, Function[]> = new Map();

  private deviceClass: "ultra-high-end" | "high-end" | "mid-end" | "low-end" =
    "mid-end";

  private readonly componentRenderTimes: Map<string, number[]> = new Map();

  private constructor() {
    if (!ENV.PERFORMANCE_MONITOR_ENABLED) {
      return;
    }
    this.lastFrameTime = performance.now();
    this.checkDeviceCapabilities();
    this.setupEventListeners();
    this.startMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private rafLoop(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.totalFrameTime += frameTime;
    this.frameCount++;

    const elapsedTime = currentTime - this.startTime;
    if (elapsedTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsedTime);
      this.frameCount = 0;
      this.startTime = currentTime;
    }

    this.updateStats({
      fps: this.currentFps,
      frameTime: frameTime,
      timestamp: Date.now(),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      animationCount: this.animationCount,
      renderCount: this.renderCount,
    });

    if (this.isRunning) {
      requestAnimationFrame(() => this.rafLoop());
    }
  }

  public startMonitoring(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.rafLoop();
    }
  }

  public stopMonitoring(): void {
    this.isRunning = false;
  }

  public incrementAnimationCount(): void {
    this.animationCount++;
  }

  public incrementRenderCount(): void {
    this.renderCount++;
  }

  private checkDeviceCapabilities(): void {
    const memory = this.getDeviceMemory();
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (
      cores >= PERFORMANCE_CONFIG.ultraHighEndDeviceThreshold ||
      memory >= 32
    ) {
      this.deviceClass = "ultra-high-end";
    } else if (
      cores >= PERFORMANCE_CONFIG.highEndDeviceThreshold ||
      memory >= 16
    ) {
      this.deviceClass = "high-end";
    } else if (memory < 4 || cores < 4 || (isMobile && memory < 6)) {
      this.deviceClass = "low-end";
    } else {
      this.deviceClass = "mid-end";
    }

    this.adjustConfigForDeviceClass();
  }

  private getDeviceMemory(): number {
    if ((navigator as any).deviceMemory) {
      return (navigator as any).deviceMemory;
    }

    const memory = (performance as any).memory;
    if (memory ?? memory.jsHeapSizeLimit) {
      return Math.round(memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
    }

    return 4;
  }

  private adjustConfigForDeviceClass(): void {
    switch (this.deviceClass) {
      case "ultra-high-end":
        PERFORMANCE_CONFIG.scanInterval = 1000;
        PERFORMANCE_CONFIG.maxLogEntries = 2000;
        break;
      case "high-end":
        PERFORMANCE_CONFIG.scanInterval = 1500;
        PERFORMANCE_CONFIG.maxLogEntries = 1500;
        break;
      case "low-end":
        PERFORMANCE_CONFIG.scanInterval = 3000;
        PERFORMANCE_CONFIG.maxLogEntries = 500;
        break;
      default:
        PERFORMANCE_CONFIG.scanInterval = 2000;
        PERFORMANCE_CONFIG.maxLogEntries = 1000;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("load", () => this.logEvent("page", "load"));
    window.addEventListener("unload", () => this.logEvent("page", "unload"));

    document.addEventListener("visibilitychange", () => {
      this.logEvent("visibility", document.hidden ? "hidden" : "visible");
    });

    window.addEventListener("error", (e) => {
      this.logEvent("error", e.message, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
    });

    window.addEventListener("unhandledrejection", (e) => {
      this.logEvent("unhandledRejection", e.reason);
    });
  }

  private updateStats(log: PerformanceLog): void {
    this.stats.totalFrames++;
    this.stats.totalFrameTime += log.frameTime;
    this.stats.averageFps =
      this.stats.totalFrames / (this.stats.totalFrameTime / 1000);
    this.stats.averageFrameTime =
      this.stats.totalFrameTime / this.stats.totalFrames;
    this.stats.avgFps = this.stats.averageFps;

    if (log.fps < this.stats.minFps) this.stats.minFps = log.fps;
    if (log.fps > this.stats.maxFps) this.stats.maxFps = log.fps;
    if (log.frameTime > this.stats.maxFrameTime)
      this.stats.maxFrameTime = log.frameTime;
    if (log.frameTime > 16.67) this.stats.longFrames++;

    if (this.logs.length > 0) {
      const lastLog = this.logs[this.logs.length - 1];
      if (lastLog.memoryUsage) {
        this.stats.memoryTrend = log.memoryUsage - lastLog.memoryUsage;
      }
    }

    this.logs.push(log);
    if (this.logs.length > PERFORMANCE_CONFIG.maxLogEntries) {
      this.logs = this.logs.slice(-PERFORMANCE_CONFIG.maxLogEntries);
    }
  }

  public logEvent(
    category: string,
    action: string,
    data?: Record<string, any>
  ): void {
    if (!this.isRunning) return;

    const event = {
      timestamp: Date.now(),
      category,
      action,
      data,
    };

    const listeners = this.eventListeners.get(category) || [];
    listeners.forEach((listener) => listener(event));

    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${category}:${action}`, data || "");
    }
  }

  public on(category: string, callback: Function): void {
    if (!this.eventListeners.has(category)) {
      this.eventListeners.set(category, []);
    }
    this.eventListeners.get(category)?.push(callback);
  }

  public off(category: string, callback: Function): void {
    const listeners = this.eventListeners.get(category);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public getPerformanceReport(): {
    logs: PerformanceLog[];
    stats: PerformanceStats;
  } {
    return {
      logs: [...this.logs],
      stats: { ...this.stats },
    };
  }

  public getLogs(): PerformanceLog[] {
    return [...this.logs];
  }

  public getMetrics(): PerformanceMetrics {
    const lastLog = this.logs[this.logs.length - 1] || {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      animationCount: 0,
    };

    return {
      fps: lastLog.fps,
      frameTime: lastLog.frameTime,
      memoryUsage: lastLog.memoryUsage,
      activeAnimations: lastLog.animationCount,
    };
  }

  public exportLogs(): void {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public getDeviceClass(): string {
    return this.deviceClass;
  }

  public getGPUInfo(): string {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
      }
    }
    return "unknown";
  }

  public markComponentRender(componentId: string): () => void {
    const startTime = performance.now();
    this.incrementRenderCount();

    if (!this.componentRenderTimes.has(componentId)) {
      this.componentRenderTimes.set(componentId, []);
    }

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16.67) {
        console.warn(
          `Componente ${componentId} tomó ${renderTime.toFixed(
            2
          )}ms para renderizar`
        );
      }

      const times = this.componentRenderTimes.get(componentId) || [];
      times.push(renderTime);
      this.componentRenderTimes.set(componentId, times);

      this.updateSlowestComponents();
    };
  }

  private updateSlowestComponents(): void {
    const componentAverages: [string, number][] = [];

    this.componentRenderTimes.forEach((times, componentId) => {
      if (times.length > 0) {
        const avgTime =
          times.reduce((sum, time) => sum + time, 0) / times.length;
        componentAverages.push([componentId, avgTime]);
      }
    });

    componentAverages.sort((a, b) => b[1] - a[1]);

    this.stats.slowestComponents = componentAverages.slice(0, 10);
  }

  public start(): void {
    try {
      if (this.isRunning) {
        this.stopMonitoring();
      }

      this.frameCount = 0;
      this.currentFps = 0;
      this.lastFrameTime = performance.now();
      this.startTime = performance.now();
      this.totalFrameTime = 0;

      this.startMonitoring();

      setInterval(() => {
        if (this.isRunning && this.lastFrameTime > 0) {
          const now = performance.now();
          const timeSinceLastFrame = now - this.lastFrameTime;

          if (timeSinceLastFrame > 5000) {
            console.warn(
              "Monitor de rendimiento detectado como inactivo, reiniciando..."
            );
            this.stopMonitoring();
            this.startMonitoring();
          }
        }
      }, 5000);

      console.log("Monitor de rendimiento iniciado correctamente");
    } catch (error) {
      console.error("Error al iniciar el monitor de rendimiento:", error);
    }
  }
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeAnimations: number;
}

export default PerformanceMonitor;
