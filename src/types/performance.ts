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
// The PerformanceMonitor class definition has been removed from this file.
// The authoritative PerformanceMonitor class is now located in:
// src/features/performance-monitoring/utils/PerformanceMonitor.ts
//
// The interfaces above (PerformanceLog, PerformanceStats, PerformanceMetrics, PerformanceReport)
// are kept here for now as they might be used by other parts of the application.
// Ideally, these types should be co-located or derived from the main PerformanceMonitor implementation.
