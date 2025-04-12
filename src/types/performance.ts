export interface PerformanceLog {
  fps: number;
  frameTime: number;
  timestamp: number;
  memoryUsage: number;
  animationCount: number;
  renderCount: number;
  metrics?: PerformanceMetrics;
  event?: string;
}

export interface PerformanceStats {
  totalFrames: number;
  totalFrameTime: number;
  averageFps: number;
  averageFrameTime: number;
  minFps: number;
  maxFps: number;
  maxFrameTime: number;
  longFrames: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeAnimations: number;
}

export interface PerformanceReport {
  logs: PerformanceLog[];
  stats: PerformanceStats;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private logs: PerformanceLog[] = [];
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    activeAnimations: 0,
  };

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  public getLogs(): PerformanceLog[] {
    return this.logs;
  }

  public logEvent(event: string): void {
    this.logs.push({
      timestamp: Date.now(),
      fps: this.metrics.fps,
      frameTime: this.metrics.frameTime,
      memoryUsage: this.metrics.memoryUsage,
      animationCount: this.metrics.activeAnimations,
      renderCount: 0,
      event,
    });
  }

  public updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
  }
}
