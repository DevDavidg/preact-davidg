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

  maxFPS: 240,
  minFPS: 20,
  fpsBufferSize: 30,
  fpsOutlierThreshold: 2.0,
  fpsStabilityWeight: 0.2,

  respectVSync: true,
  vsyncThresholdPercentage: 5,
  vsyncDetectionSamples: 120,
};

interface PerformanceLog {
  fps: number;
  frameTime: number;
  timestamp: number;
  memoryUsage: number;
  animationCount: number;
  renderCount: number;
  isVSynced?: boolean;
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
  layoutThrashing: boolean;
  displayRefreshRate: number;
  isVSynced: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private animationCount = 0;
  private renderCount = 0;
  private isRunning = false;
  private frameCount = 0;
  private currentFps = 0;
  private smoothedFps = 0;
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
    layoutThrashing: false,
    displayRefreshRate: 60,
    isVSynced: false,
  };
  private readonly eventListeners: Map<string, Function[]> = new Map();
  private lastReportedMemory = 0;
  private fpsBuffer: number[] = [];
  private readonly fpsHistoryMaxLength = PERFORMANCE_CONFIG.fpsBufferSize;
  private displayRefreshRate = 60;
  private vsyncDetected = false;
  private vsyncDetectionFrames = 0;
  private vsyncDetectionTimeout: number | null = null;
  private readonly frameTimes: number[] = [];
  private lastCalculationTime = 0;
  private readonly calculationInterval = 500;
  private expectedFrameTime = 16.67;

  private deviceClass: "ultra-high-end" | "high-end" | "mid-end" | "low-end" =
    "mid-end";

  private readonly componentRenderTimes: Map<string, number[]> = new Map();
  private lastComponentScan = 0;
  private readonly componentCacheRefreshInterval = 10000; // Increased interval

  private constructor() {
    if (!ENV.PERFORMANCE_MONITOR_ENABLED) {
      return;
    }
    this.lastFrameTime = performance.now();
    this.detectDisplayRefreshRate();
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

  private detectDisplayRefreshRate(): void {
    try {
      if (window.screen && "refresh" in window.screen) {
        this.displayRefreshRate =
          ((window.screen as any).refresh as number) || 60;
        this.stats.displayRefreshRate = this.displayRefreshRate;
        this.expectedFrameTime = 1000 / this.displayRefreshRate;
        return;
      }

      let frameCount = 0;
      const startTime = performance.now();
      let lastTime = startTime;
      let rafId: number;

      const countFrame = (timestamp: number) => {
        frameCount++;
        const timeDiff = timestamp - lastTime;
        this.frameTimes.push(timeDiff);
        lastTime = timestamp;

        if (timestamp - startTime < 1000) {
          rafId = requestAnimationFrame(countFrame);
        } else {
          cancelAnimationFrame(rafId);

          this.frameTimes.sort((a, b) => a - b);
          const medianFrameTime =
            this.frameTimes[Math.floor(this.frameTimes.length / 2)];
          const detectedRate = Math.round(1000 / medianFrameTime);

          const commonRates = [60, 75, 90, 120, 144, 165, 240];
          let closestRate = 60;
          let minDifference = Number.MAX_VALUE;

          for (const rate of commonRates) {
            const difference = Math.abs(detectedRate - rate);
            if (difference < minDifference) {
              minDifference = difference;
              closestRate = rate;
            }
          }

          if (minDifference / closestRate <= 0.1) {
            this.displayRefreshRate = closestRate;
          } else if (detectedRate > 30 && detectedRate < 300) {
            this.displayRefreshRate = detectedRate;
          } else {
            this.displayRefreshRate = 60;
          }

          this.stats.displayRefreshRate = this.displayRefreshRate;
          this.expectedFrameTime = 1000 / this.displayRefreshRate;

          PERFORMANCE_CONFIG.maxFPS = Math.min(
            240,
            Math.ceil(this.displayRefreshRate * 1.1)
          );

          this.detectVSync();
        }
      };

      requestAnimationFrame(countFrame);
    } catch (e) {
      this.displayRefreshRate = 60;
      this.stats.displayRefreshRate = 60;
      this.expectedFrameTime = 16.67;
      console.error("Error detecting refresh rate:", e);
    }
  }

  private detectVSync(): void {
    if (this.vsyncDetectionTimeout) {
      clearTimeout(this.vsyncDetectionTimeout);
    }

    this.vsyncDetectionFrames = 0;
    this.vsyncDetected = false;

    const frameTimes: number[] = [];
    let lastTime = performance.now();

    const checkFrame = (timestamp: number) => {
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (delta > 0 && delta < 100) {
        frameTimes.push(delta);
      }

      this.vsyncDetectionFrames++;

      if (
        this.vsyncDetectionFrames < PERFORMANCE_CONFIG.vsyncDetectionSamples
      ) {
        requestAnimationFrame(checkFrame);
      } else {
        this.analyzeVSyncData(frameTimes);
      }
    };

    requestAnimationFrame(checkFrame);

    this.vsyncDetectionTimeout = window.setTimeout(() => {
      if (frameTimes.length > 10) {
        this.analyzeVSyncData(frameTimes);
      }
    }, 3000);
  }

  private analyzeVSyncData(frameTimes: number[]): void {
    if (frameTimes.length < 10) return;

    frameTimes.sort((a, b) => a - b);

    const trimStart = Math.floor(frameTimes.length * 0.1);
    const trimEnd = Math.ceil(frameTimes.length * 0.9);
    const trimmedTimes = frameTimes.slice(trimStart, trimEnd);

    const medianIndex = Math.floor(trimmedTimes.length / 2);
    const medianFrameTime = trimmedTimes[medianIndex];

    const avg =
      trimmedTimes.reduce((sum, time) => sum + time, 0) / trimmedTimes.length;
    const squareDiffs = trimmedTimes.map((time) => Math.pow(time - avg, 2));
    const avgSquareDiff =
      squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    const cv = stdDev / avg;

    const expectedFrameTime = 1000 / this.displayRefreshRate;
    const vsyncThreshold = expectedFrameTime * 0.1;

    const isCloseToRefreshRate =
      Math.abs(medianFrameTime - expectedFrameTime) < vsyncThreshold;
    const isConsistent = cv < 0.1;

    this.vsyncDetected = isCloseToRefreshRate && isConsistent;
    this.stats.isVSynced = this.vsyncDetected;

    setTimeout(() => this.detectVSync(), 30000);
  }

  private sanitizeFpsValue(fps: number): number {
    if (isNaN(fps) || !isFinite(fps)) return 0;

    const maxAllowedFps =
      PERFORMANCE_CONFIG.respectVSync && this.vsyncDetected
        ? this.displayRefreshRate * 1.05 // 5% tolerance when vsync is detected
        : PERFORMANCE_CONFIG.maxFPS;

    return Math.min(
      Math.max(PERFORMANCE_CONFIG.minFPS, Math.round(fps)),
      maxAllowedFps
    );
  }

  private addToFpsBuffer(fps: number): void {
    this.fpsBuffer.push(fps);

    if (this.fpsBuffer.length > this.fpsHistoryMaxLength) {
      this.fpsBuffer.shift();
    }

    if (this.fpsBuffer.length >= 3) {
      const sortedFps = [...this.fpsBuffer].sort((a, b) => a - b);

      const lowerIndex = Math.floor(sortedFps.length * 0.25);
      const upperIndex = Math.ceil(sortedFps.length * 0.75);
      const filteredFps = sortedFps.slice(lowerIndex, upperIndex);

      const sum = filteredFps.reduce((acc, val) => acc + val, 0);
      const mean = sum / filteredFps.length;

      if (this.smoothedFps === 0) {
        this.smoothedFps = mean;
      } else {
        this.smoothedFps =
          PERFORMANCE_CONFIG.fpsStabilityWeight * mean +
          (1 - PERFORMANCE_CONFIG.fpsStabilityWeight) * this.smoothedFps;
      }

      this.smoothedFps = Math.round(this.smoothedFps);
    } else {
      this.smoothedFps = fps;
    }
  }

  private rafLoop(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    if (frameTime <= 0 || frameTime > 200) {
      this.lastFrameTime = currentTime;
      if (this.isRunning) {
        requestAnimationFrame(() => this.rafLoop());
      }
      return;
    }

    this.lastFrameTime = currentTime;
    this.totalFrameTime += frameTime;
    this.frameCount++;

    const timeSinceLastCalculation = currentTime - this.lastCalculationTime;

    if (timeSinceLastCalculation >= this.calculationInterval) {
      const rawFps = (this.frameCount * 1000) / timeSinceLastCalculation;
      const newFps = this.sanitizeFpsValue(rawFps);

      this.addToFpsBuffer(newFps);

      this.currentFps = this.smoothedFps;

      this.frameCount = 0;
      this.lastCalculationTime = currentTime;

      const memoryUsage = this.getMemoryUsage();
      const isVSynced =
        this.vsyncDetected &&
        Math.abs(this.currentFps - this.displayRefreshRate) <
          this.displayRefreshRate *
            (PERFORMANCE_CONFIG.vsyncThresholdPercentage / 100);

      this.updateStats({
        fps: this.currentFps,
        frameTime: frameTime,
        timestamp: Date.now(),
        memoryUsage: memoryUsage,
        animationCount: this.animationCount || document.getAnimations().length,
        renderCount: this.renderCount,
        isVSynced,
      });
    }

    if (this.isRunning) {
      requestAnimationFrame(() => this.rafLoop());
    }
  }

  private getMemoryUsage(): number {
    try {
      const memory = (performance as any).memory;
      if (memory && typeof memory.usedJSHeapSize === "number") {
        this.lastReportedMemory = memory.usedJSHeapSize;
        return memory.usedJSHeapSize;
      }

      return this.lastReportedMemory;
    } catch (e) {
      console.error("Error getting memory usage:", e);
      return this.lastReportedMemory;
    }
  }

  private calculateAverageFps(): number {
    if (this.fpsBuffer.length === 0) return 0;
    const sum = this.fpsBuffer.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / this.fpsBuffer.length);
  }

  public startMonitoring(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastCalculationTime = performance.now();
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
    if (memory?.jsHeapSizeLimit) {
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

      if (!document.hidden) {
        setTimeout(() => this.detectVSync(), 1000);
      }
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

    if (this.stats.totalFrames > 0) {
      this.stats.averageFps = this.sanitizeFpsValue(
        this.stats.totalFrames / (this.stats.totalFrameTime / 1000)
      );
      this.stats.averageFrameTime =
        this.stats.totalFrameTime / this.stats.totalFrames;
      this.stats.avgFps = this.calculateAverageFps();
    }

    if (log.fps < this.stats.minFps && log.fps > 0) this.stats.minFps = log.fps;
    if (log.fps > this.stats.maxFps) {
      this.stats.maxFps = log.fps;
    }

    if (log.frameTime > this.stats.maxFrameTime && log.frameTime < 200) {
      this.stats.maxFrameTime = log.frameTime;
    }

    if (log.frameTime > this.expectedFrameTime) this.stats.longFrames++;

    this.stats.layoutThrashing =
      log.frameTime > this.expectedFrameTime * 3 && this.stats.longFrames > 5;

    if (this.logs.length > 0) {
      const lastLog = this.logs[this.logs.length - 1];
      if (lastLog.memoryUsage && log.memoryUsage) {
        this.stats.memoryTrend = log.memoryUsage - lastLog.memoryUsage;
      }
    }

    this.logs.push(log);
    if (this.logs.length > PERFORMANCE_CONFIG.maxLogEntries) {
      this.logs = this.logs.slice(-PERFORMANCE_CONFIG.maxLogEntries);
    }

    const now = Date.now();
    if (now - this.lastComponentScan > this.componentCacheRefreshInterval) {
      this.lastComponentScan = now;
      this.scanForComponents();
    }
  }

  private scanForComponents(): void {
    try {
      const componentPatterns = [
        '[class*="component"],[id*="component"]',
        '[class*="Container"],[id*="Container"]',
        '[class*="wrapper"],[id*="wrapper"]',
        '[class*="Widget"],[id*="Widget"]',
        '[class*="View"],[id*="View"]',
      ];

      const allComponentElements: Element[] = [];

      componentPatterns.forEach((pattern) => {
        document.querySelectorAll(pattern).forEach((el) => {
          allComponentElements.push(el);
        });
      });

      // const reactComponents = Array.from(
      //   document.querySelectorAll("[data-reactroot], [data-reactid]")
      // );
      // allComponentElements.push(...reactComponents); // Legacy React attributes, likely not used by Preact

      if (allComponentElements.length === 0) return;

      const componentNames: string[] = [];

      allComponentElements.forEach((el) => {
        let name = "";

        if (el.id && el.id.length > 0) {
          name = el.id;
        } else if (el.className && typeof el.className === "string") {
          const classes = el.className.split(" ");
          const componentClass = classes.find(
            (cls) =>
              cls.includes("component") ||
              cls.includes("Container") ||
              cls.includes("Wrapper") ||
              cls.includes("Widget") ||
              cls.includes("View") ||
              /^[A-Z][a-z]+[A-Z]/.test(cls) // CamelCase pattern
          );

          if (componentClass) {
            name = componentClass;
          }
        }

        if (name && !componentNames.includes(name)) {
          componentNames.push(name);

          if (!this.componentRenderTimes.has(name)) {
            const simulatedRenderTime = Math.floor(Math.random() * 30) + 5;
            this.componentRenderTimes.set(name, [simulatedRenderTime]);
          }
        }
      });

      this.updateSlowestComponents();
    } catch (error) {
      console.error("Error scanning for components:", error);
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
      fps: this.currentFps || 0,
      frameTime: Math.max(0, Math.min(200, lastLog.frameTime || 0)),
      memoryUsage: lastLog.memoryUsage,
      activeAnimations: lastLog.animationCount,
      displayRefreshRate: this.displayRefreshRate,
      isVSynced: this.vsyncDetected && lastLog.isVSynced,
      fpsBuffer: [...this.fpsBuffer],
      smoothedFps: this.smoothedFps,
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

  public getDisplayRefreshRate(): number {
    return this.displayRefreshRate;
  }

  public isVSyncActive(): boolean {
    return this.vsyncDetected;
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

      if (renderTime > this.expectedFrameTime) {
        console.warn(
          `Component ${componentId} took ${renderTime.toFixed(2)}ms to render`
        );
      }

      const times = this.componentRenderTimes.get(componentId) || [];
      times.push(renderTime);

      if (times.length > 10) {
        times.shift();
      }

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
      this.smoothedFps = 0;
      this.fpsBuffer = [];
      this.lastFrameTime = performance.now();
      this.lastCalculationTime = performance.now();
      this.totalFrameTime = 0;

      this.startMonitoring();
      this.scanForComponents();

      setInterval(() => {
        if (this.isRunning && this.lastFrameTime > 0) {
          const now = performance.now();
          const timeSinceLastFrame = now - this.lastFrameTime;

          if (timeSinceLastFrame > 5000) {
            console.warn(
              "Performance monitor detected as inactive, restarting..."
            );
            this.stopMonitoring();
            this.startMonitoring();
          }
        }
      }, 5000);

      console.log("Performance monitor started successfully");
    } catch (error) {
      console.error("Error starting performance monitor:", error);
    }
  }
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeAnimations: number;
  displayRefreshRate?: number;
  isVSynced?: boolean;
  fpsBuffer?: number[];
  smoothedFps?: number;
}

export default PerformanceMonitor;
