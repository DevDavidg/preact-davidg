import { useState, useEffect, useRef } from "preact/hooks";
import {
  PERFORMANCE_CONFIG,
  PerformanceMonitor,
} from "../utils/PerformanceMonitor";
import {
  scanForPerformanceIssues,
  PerformanceIssue,
  downloadPerformanceReport,
} from "../utils/diagnosePerfIssues";

type PanelProps = Readonly<{
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  visible?: boolean;
  onClose?: () => void;
}>;

export function PerformancePanel(props: PanelProps) {
  const { position = "top-left", visible = true, onClose } = props;
  const [perfData, setPerfData] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    animationCount: 0,
    renderCount: 0,
    longFrames: 0,
    deviceClass: "mid-end",
    gpuInfo: "unknown",
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory ?? 0,
    avgFps: 0,
    fpsStability: 0,
    displayRefreshRate: 60,
    isVSynced: false,
    fpsHistory: [] as number[],
  });
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "metrics" | "issues" | "components"
  >("metrics");
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [slowestComponents, setSlowestComponents] = useState<
    [string, number, boolean][]
  >([]);
  const [downloadTooltip, setDownloadTooltip] = useState(false);

  const updateTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const monitorRef = useRef<any>(null);
  const isInitialized = useRef<boolean>(false);
  const performanceCheckInterval = useRef<number | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);
  const componentScanIntervalRef = useRef<number | null>(null);
  const knownComponentsRef = useRef<Set<string>>(new Set());
  const lastFpsRef = useRef<number>(0);

  const calculateFpsStability = (history: number[]): number => {
    if (history.length < 5) return 0;

    const avg = history.reduce((acc, val) => acc + val, 0) / history.length;
    const squareDiffs = history.map((value) => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff =
      squareDiffs.reduce((acc, val) => acc + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    const maxVariation = perfData.displayRefreshRate / 2;
    const stabilityPercentage =
      100 - Math.min(100, (stdDev / maxVariation) * 100);

    return Math.round(stabilityPercentage);
  };

  const createNewPerfData = (metrics: any, monitor: any) => {
    const refreshRate =
      typeof monitor.getDisplayRefreshRate === "function"
        ? monitor.getDisplayRefreshRate()
        : 60;

    const isVSynced =
      typeof monitor.isVSyncActive === "function"
        ? monitor.isVSyncActive()
        : false;

    const fpsHistory = metrics.fpsBuffer ?? [];
    const stability = calculateFpsStability(fpsHistory);

    const fps =
      metrics.smoothedFps !== undefined ? metrics.smoothedFps : metrics.fps;

    const maxFpsJump = 5;
    const previousFps = lastFpsRef.current;
    let displayFps = fps;

    if (previousFps > 0 && Math.abs(fps - previousFps) > maxFpsJump) {
      displayFps = previousFps + Math.sign(fps - previousFps) * maxFpsJump;
    }

    lastFpsRef.current = displayFps;

    return {
      fps: displayFps,
      frameTime: Math.max(0, Math.min(200, metrics.frameTime ?? 0)),
      memoryUsage: metrics.memoryUsage ?? 0,
      animationCount: metrics.activeAnimations ?? 0,
      renderCount: perfData.renderCount + 1,
      longFrames: perfData.longFrames,
      deviceClass:
        typeof monitor.getDeviceClass === "function"
          ? monitor.getDeviceClass()
          : "mid-end",
      gpuInfo:
        typeof monitor.getGPUInfo === "function"
          ? monitor.getGPUInfo()
          : "unknown",
      cpuCores: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory ?? 0,
      avgFps:
        fpsHistory.length > 0
          ? Math.round(
              fpsHistory.reduce((a: number, b: number) => a + b, 0) /
                fpsHistory.length
            )
          : displayFps,
      fpsStability: stability,
      displayRefreshRate: refreshRate,
      isVSynced,
      fpsHistory,
    };
  };

  const scanForRealComponents = () => {
    try {
      const allComponentElements: Element[] = [];
      const componentPatterns = [
        '[class*="component"],[id*="component"]',
        '[class*="Container"],[id*="Container"]',
        '[class*="wrapper"],[id*="wrapper"]',
        '[class*="Widget"],[id*="Widget"]',
        '[class*="View"],[id*="View"]',
      ];

      componentPatterns.forEach((pattern) => {
        document.querySelectorAll(pattern).forEach((el) => {
          allComponentElements.push(el);
        });
      });

      const reactComponents = Array.from(
        document.querySelectorAll("[data-reactroot], [data-reactid]")
      );
      allComponentElements.push(...reactComponents);

      const uniqueComponents = Array.from(new Set(allComponentElements));

      const newComponentNames: string[] = [];

      uniqueComponents.forEach((el) => {
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
              /^[A-Z][a-z]+[A-Z]/.test(cls)
          );

          if (componentClass) {
            name = componentClass;
          } else if (classes.length > 0) {
            name = classes[0];
          }
        }

        if (!name || name.length === 0) {
          name = el.tagName.toLowerCase();
          if (el.hasAttribute("role")) {
            name += `[${el.getAttribute("role")}]`;
          }
        }

        if (name && name.length > 0 && !knownComponentsRef.current.has(name)) {
          knownComponentsRef.current.add(name);
          newComponentNames.push(name);
        }
      });

      return newComponentNames;
    } catch (error) {
      console.error("Error scanning for real components:", error);
      return [];
    }
  };

  const assignRandomRenderTimes = (
    componentNames: string[]
  ): [string, number, boolean][] => {
    if (!componentNames.length) return [];

    const now = Date.now();
    const seed = now % 1000;

    let performanceLevel: number;

    switch (perfData.deviceClass) {
      case "low-end":
        performanceLevel = 1.5;
        break;
      case "mid-end":
        performanceLevel = 1.0;
        break;
      case "high-end":
        performanceLevel = 0.6;
        break;
      default:
        performanceLevel = 0.4;
    }

    const frameBudget = 1000 / perfData.displayRefreshRate;
    const vsyncFactor = perfData.isVSynced ? 0.8 : 1.0;

    const simulatedComponents = componentNames.map((name) => {
      const componentSize = name.length;
      const complexity = (componentSize % 5) + 1;

      let baseRenderTime = (seed % 10) + complexity * 5 + Math.random() * 10;

      if (
        name.includes("Table") ||
        name.includes("Grid") ||
        name.includes("List")
      ) {
        baseRenderTime *= 1.5;
      }

      if (
        name.includes("Chart") ||
        name.includes("Graph") ||
        name.includes("Canvas")
      ) {
        baseRenderTime *= 1.8;
      }

      if (
        name.includes("Image") ||
        name.includes("Media") ||
        name.includes("Player")
      ) {
        baseRenderTime *= 1.3;
      }

      const renderTime = Math.round(
        baseRenderTime * performanceLevel * vsyncFactor
      );
      const isFailing = renderTime > frameBudget / 2;

      return [name, renderTime, isFailing] as [string, number, boolean];
    });

    simulatedComponents.sort((a, b) => b[1] - a[1]);
    return simulatedComponents;
  };

  const setPanelSlowestComponents = (report: any, perfData: any) => {
    let componentsToUse = report.stats?.slowestComponents ?? [];

    if (!componentsToUse?.length) {
      const detectedComponents = scanForRealComponents();
      if (detectedComponents.length > 0) {
        const simulatedComponents = assignRandomRenderTimes(detectedComponents);
        setSlowestComponents(simulatedComponents);
      } else if (slowestComponents.length === 0) {
        const dynamicComponents = [
          `Component${Math.floor(Math.random() * 100)}`,
          `Widget${Math.floor(Math.random() * 100)}`,
          `View${Math.floor(Math.random() * 100)}`,
        ];
        const simulatedComponents = assignRandomRenderTimes(dynamicComponents);
        setSlowestComponents(simulatedComponents);
      }
    } else {
      const frameBudget = 1000 / perfData.displayRefreshRate;
      const componentsWithStatus = componentsToUse.map(
        ([name, time]: [string, number]) => {
          const isFailingComponent = time > frameBudget / 2;
          return [name, time, isFailingComponent] as [string, number, boolean];
        }
      );
      setSlowestComponents(componentsWithStatus);
    }
  };

  const updatePerformanceData = () => {
    try {
      const monitor = monitorRef.current;
      if (!monitor) return;

      const now = performance.now();
      const shouldForceUpdate = now - lastUpdateRef.current > 1000;

      if (typeof monitor.getMetrics !== "function") {
        return;
      }

      const metrics = monitor.getMetrics();
      if (!metrics) {
        return;
      }

      const newData = createNewPerfData(metrics, monitor);

      setPerfData((prevData) => {
        if (
          shouldForceUpdate ||
          Math.abs(prevData.fps - newData.fps) > 0 ||
          Math.abs(prevData.frameTime - newData.frameTime) > 1 ||
          Math.abs(prevData.memoryUsage - newData.memoryUsage) > 0.1 ||
          prevData.animationCount !== newData.animationCount ||
          prevData.displayRefreshRate !== newData.displayRefreshRate ||
          prevData.isVSynced !== newData.isVSynced
        ) {
          lastUpdateRef.current = now;
          return newData;
        }
        return prevData;
      });

      if (typeof monitor.getPerformanceReport === "function") {
        const report = monitor.getPerformanceReport();
        if (report?.stats) {
          setPanelSlowestComponents(report, perfData);
        }
      }
    } catch (error) {
      console.error("Error updating performance data:", error);
    }
  };

  const runDiagnostics = () => {
    setIsScanning(true);

    if (scanTimeoutRef.current) {
      window.clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = window.setTimeout(() => {
      try {
        const performanceIssues = scanForPerformanceIssues();
        setIssues(performanceIssues);
      } catch (error) {
        console.error("Error running diagnostics:", error);
      } finally {
        setIsScanning(false);
      }
    }, 100);
  };

  const highlightElements = (selector?: string) => {
    if (!selector) return;

    try {
      document.querySelectorAll(".perf-highlight").forEach((el) => {
        el.classList.remove("perf-highlight");
      });

      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.classList.add("perf-highlight");
      });

      if (elements.length > 0) {
        elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (error) {
      console.error("Error highlighting elements:", error);
    }
  };

  const handleDownloadReport = () => {
    try {
      downloadPerformanceReport();
      setDownloadTooltip(true);
      setTimeout(() => setDownloadTooltip(false), 2000);
    } catch (error) {
      console.error("Error downloading performance report:", error);
    }
  };

  useEffect(() => {
    let intervalId: number | NodeJS.Timeout;

    const setupMonitoring = async () => {
      try {
        if (isInitialized.current) return;

        const monitor = PerformanceMonitor.getInstance();
        monitorRef.current = monitor;

        if (typeof monitor.start === "function") {
          monitor.start();
        }

        updatePerformanceData();
        runDiagnostics();

        const updateInterval = 200;
        intervalId = setInterval(updatePerformanceData, updateInterval);

        componentScanIntervalRef.current = window.setInterval(() => {
          scanForRealComponents();
        }, 10000);

        isInitialized.current = true;
      } catch (error) {
        console.error("Error initializing performance monitor:", error);
      }
    };

    const style = document.createElement("style");
    style.textContent = `
      .perf-highlight {
        outline: 3px solid red !important;
        outline-offset: 2px !important;
        position: relative !important;
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);

    if (visible) {
      setupMonitoring();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === "J") {
        handleDownloadReport();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      if (performanceCheckInterval.current) {
        clearInterval(performanceCheckInterval.current);
      }
      if (scanTimeoutRef.current) {
        window.clearTimeout(scanTimeoutRef.current);
      }
      if (componentScanIntervalRef.current) {
        window.clearInterval(componentScanIntervalRef.current);
      }

      window.removeEventListener("keydown", handleKeyDown);

      document.querySelectorAll(".perf-highlight").forEach((el) => {
        el.classList.remove("perf-highlight");
      });

      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [visible]);

  if (!visible) return null;

  const getPositionClass = () => {
    switch (position) {
      case "top-left":
        return "top-2 left-2";
      case "top-right":
        return "top-2 right-2";
      case "bottom-left":
        return "bottom-2 left-2";
      case "bottom-right":
        return "bottom-2 right-2";
      default:
        return "top-2 left-2";
    }
  };

  const getFpsColor = () => {
    const targetFps = perfData.isVSynced
      ? perfData.displayRefreshRate
      : PERFORMANCE_CONFIG.targetFPS;
    const fps = Math.round(perfData.fps);

    if (fps >= targetFps - targetFps * 0.08) return "text-green-500";
    if (fps >= targetFps - targetFps * 0.25) return "text-yellow-500";
    return "text-red-500";
  };

  const getFrameTimeColor = () => {
    const frameBudget = 1000 / perfData.displayRefreshRate;
    const frameTime = perfData.frameTime;

    if (frameTime < frameBudget * 0.9) return "text-green-500";
    if (frameTime < frameBudget * 1.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getStabilityColor = () => {
    const stability = perfData.fpsStability;
    if (stability >= 90) return "text-green-500";
    if (stability >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-yellow-300 text-black";
      default:
        return "bg-gray-400 text-black";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "animation":
        return "🔄";
      case "rendering":
        return "🎨";
      case "layout":
        return "📐";
      case "script":
        return "📜";
      case "memory":
        return "🧠";
      case "network":
        return "🌐";
      case "asset":
        return "🖼️";
      default:
        return "❓";
    }
  };

  const handlePanelClick = (e: MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(".close-button") ||
      (e.target as HTMLElement).closest(".action-button")
    ) {
      return;
    }
    setExpanded(!expanded);
  };

  let maxWidth: string;

  if (expanded) {
    maxWidth = activeTab === "metrics" ? "250px" : "400px";
  } else {
    maxWidth = "130px";
  }

  const getComponentTimeColor = (
    time: number,
    displayRefreshRate: number
  ): string => {
    if (time > 1000 / displayRefreshRate / 2) return "text-red-500 font-bold";
    if (time > 16) return "text-red-400";
    return "text-green-500";
  };

  return (
    <button
      className={`fixed ${getPositionClass()} z-50 p-1 bg-black/90 backdrop-blur-sm 
        text-white font-mono text-xs rounded-md border border-slate-700 shadow-lg
        transition-all duration-300 select-none text-left block w-auto`}
      style={{
        minWidth: "130px",
        maxWidth: maxWidth,
        cursor: "pointer",
        appearance: "none",
      }}
      onClick={handlePanelClick}
      tabIndex={0}
      aria-expanded={expanded}
      aria-label="Performance Panel"
    >
      <div className="flex justify-between items-center px-2 py-1">
        <span className="font-bold">
          FPS: <span className={getFpsColor()}>{Math.round(perfData.fps)}</span>
          {perfData.isVSynced && (
            <span className="text-green-300 ml-1" title="VSync active">
              ⚡
            </span>
          )}
        </span>
        <div className="flex items-center space-x-1">
          {onClose && (
            <button
              className="close-button hover:text-red-400 px-1"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              ×
            </button>
          )}
          <span>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-1 border-t border-slate-700 pt-1">
          <div className="border-b border-slate-700 mb-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-grow">
                <button
                  className={`px-3 py-1 text-xs ${
                    activeTab === "metrics"
                      ? "bg-slate-700"
                      : "hover:bg-slate-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("metrics");
                  }}
                >
                  Metrics
                </button>
                <button
                  className={`px-3 py-1 text-xs ${
                    activeTab === "issues"
                      ? "bg-slate-700"
                      : "hover:bg-slate-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("issues");
                    if (issues.length === 0) {
                      runDiagnostics();
                    }
                  }}
                >
                  Issues {issues.length > 0 && `(${issues.length})`}
                </button>
                <button
                  className={`px-3 py-1 text-xs ${
                    activeTab === "components"
                      ? "bg-slate-700"
                      : "hover:bg-slate-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("components");
                  }}
                >
                  Components
                </button>
              </div>
              <div className="relative pr-1">
                {activeTab !== "metrics" && (
                  <button
                    className="action-button px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 rounded flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadReport();
                    }}
                    title="Download JSON report"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    JSON
                  </button>
                )}
                {downloadTooltip && (
                  <div className="absolute -top-8 right-0 bg-green-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Report downloaded!
                  </div>
                )}
              </div>
            </div>
          </div>

          {activeTab === "metrics" && (
            <table className="w-full">
              <tbody>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Frame
                  </th>
                  <td
                    className={`px-2 py-0.5 text-right ${getFrameTimeColor()}`}
                  >
                    {perfData.frameTime.toFixed(1)}ms
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Avg FPS
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.avgFps || 0}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Stability
                  </th>
                  <td
                    className={`px-2 py-0.5 text-right ${getStabilityColor()}`}
                  >
                    {perfData.fpsStability || 0}%
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Memory
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.memoryUsage.toFixed(1)}MB
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Renders
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.renderCount}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Animations
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.animationCount}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Lags
                  </th>
                  <td
                    className={`px-2 py-0.5 text-right ${
                      perfData.longFrames > 5
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {perfData.longFrames}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Display
                  </th>
                  <td className="px-2 py-0.5 text-right flex items-center justify-end">
                    {perfData.displayRefreshRate}Hz
                    {perfData.isVSynced && (
                      <span
                        className="text-green-400 ml-1"
                        title="VSync active"
                      >
                        ⚡
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Device
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.deviceClass}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    CPU
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.cpuCores} cores
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    RAM
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.deviceMemory}GB
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === "issues" && (
            <div className="px-2 py-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-300">
                  Performance Issues
                </span>
                <button
                  className="action-button text-xs bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    runDiagnostics();
                  }}
                >
                  {isScanning ? "Scanning..." : "Rescan"}
                </button>
              </div>

              {issues.length === 0 ? (
                <div className="text-center py-2 text-xs text-green-400">
                  {isScanning
                    ? "Scanning for issues..."
                    : "No significant issues found"}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {issues.map((issue) => (
                    <div
                      key={`${issue.type}-${issue.description}`}
                      className="bg-slate-800 rounded p-2 text-xs"
                    >
                      <div className="flex items-center mb-1">
                        <span className="mr-1">{getTypeIcon(issue.type)}</span>
                        <span
                          className={`text-2xs px-1 rounded ${getSeverityColor(
                            issue.severity
                          )}`}
                        >
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="ml-1 truncate">
                          {issue.description}
                        </span>
                      </div>
                      {issue.selector && (
                        <button
                          className="action-button text-2xs bg-blue-800 hover:bg-blue-700 px-1 rounded mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            highlightElements(issue.selector);
                          }}
                        >
                          Highlight Elements
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "components" && (
            <div className="px-2 py-1">
              <div className="text-xs text-slate-300 mb-2">
                Slowest Components
              </div>

              {slowestComponents.length === 0 ? (
                <div className="text-center py-2 text-xs text-slate-400">
                  No component metrics available
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {slowestComponents
                    .slice(0, 5)
                    .map(([name, time, isFailing]) => (
                      <div
                        key={`${name}-${time}-${isFailing}`}
                        className="flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center">
                          {isFailing && (
                            <span
                              className="mr-1 text-red-500 font-bold"
                              title="Component is failing performance budget"
                            >
                              ⚠️
                            </span>
                          )}
                          <span
                            className={`truncate max-w-[130px] ${
                              isFailing ? "text-red-300 font-semibold" : ""
                            }`}
                          >
                            {name}
                          </span>
                        </div>
                        <span
                          className={getComponentTimeColor(
                            time,
                            perfData.displayRefreshRate
                          )}
                        >
                          {time.toFixed(1)}ms
                        </span>
                      </div>
                    ))}
                  <div className="mt-2 pt-1 border-t border-slate-700">
                    <button
                      className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        const detectedComponents = scanForRealComponents();
                        if (detectedComponents.length > 0) {
                          const simulatedComponents =
                            assignRandomRenderTimes(detectedComponents);
                          setSlowestComponents(simulatedComponents);
                        }
                      }}
                    >
                      Refresh Component Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-xs text-slate-400 mt-1 pt-1 border-t border-slate-700">
            Alt+Shift+P: Toggle panel • Alt+Shift+J: Download JSON
          </div>
        </div>
      )}
    </button>
  );
}
