import { useState, useEffect, useRef } from "preact/hooks";
import {
  PERFORMANCE_CONFIG,
  PerformanceMonitor,
} from "../utils/PerformanceMonitor";

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
    deviceMemory: (navigator as any).deviceMemory || 0,
    avgFps: 0,
    fpsStability: 0,
  });
  const [expanded, setExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const updateTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const monitorRef = useRef<any>(null);
  const isInitialized = useRef<boolean>(false);
  const performanceCheckInterval = useRef<number | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const maxHistoryLength = 60;

  const calculateAverageFps = (history: number[]): number => {
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / history.length);
  };

  const calculateFpsStability = (history: number[]): number => {
    if (history.length < 2) return 0;
    const avg = calculateAverageFps(history);
    const squareDiffs = history.map((value) => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff =
      squareDiffs.reduce((acc, val) => acc + val, 0) / squareDiffs.length;
    return Math.round(Math.sqrt(avgSquareDiff));
  };

  const createNewPerfData = (
    lastEntry: any,
    report: any,
    monitor: any,
    fpsHistory: number[]
  ) => {
    const avgFps = calculateAverageFps(fpsHistory);
    const fpsStability = calculateFpsStability(fpsHistory);

    return {
      fps: lastEntry.fps || 0,
      frameTime: lastEntry.frameTime || 0,
      memoryUsage: lastEntry.memoryUsage || 0,
      animationCount: lastEntry.animationCount || 0,
      renderCount: lastEntry.renderCount || 0,
      longFrames: report.stats?.longFrames || 0,
      deviceClass:
        typeof monitor.getDeviceClass === "function"
          ? monitor.getDeviceClass()
          : "mid-end",
      gpuInfo:
        typeof monitor.getGPUInfo === "function"
          ? monitor.getGPUInfo()
          : "unknown",
      cpuCores: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      avgFps,
      fpsStability,
    };
  };

  const updatePerformanceData = () => {
    try {
      const monitor = monitorRef.current;
      if (!monitor) return;

      const now = performance.now();

      if (typeof monitor.getPerformanceReport !== "function") {
        console.warn("El monitor no tiene el método getPerformanceReport");
        return;
      }

      const report = monitor.getPerformanceReport();
      if (!report?.logs?.length) {
        console.warn("No hay datos de rendimiento disponibles");
        return;
      }

      const lastEntry = report.logs[report.logs.length - 1];
      if (!lastEntry) {
        console.warn("No hay entradas de log disponibles");
        return;
      }

      if (lastEntry.fps) {
        fpsHistoryRef.current.push(lastEntry.fps);
        if (fpsHistoryRef.current.length > maxHistoryLength) {
          fpsHistoryRef.current.shift();
        }
      }

      const newData = createNewPerfData(
        lastEntry,
        report,
        monitor,
        fpsHistoryRef.current
      );
      const shouldForceUpdate = now - lastUpdateRef.current > 2000;

      setPerfData((prevData) => {
        if (
          shouldForceUpdate ||
          Math.abs(prevData.fps - newData.fps) > 1 ||
          Math.abs(prevData.frameTime - newData.frameTime) > 1 ||
          Math.abs(prevData.memoryUsage - newData.memoryUsage) > 0.1 ||
          prevData.animationCount !== newData.animationCount ||
          prevData.renderCount !== newData.renderCount ||
          prevData.longFrames !== newData.longFrames ||
          prevData.avgFps !== newData.avgFps ||
          prevData.fpsStability !== newData.fpsStability
        ) {
          lastUpdateRef.current = now;
          return newData;
        }
        return prevData;
      });
    } catch (error) {
      console.error("Error al actualizar datos de rendimiento:", error);
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

        const updateInterval = 500;
        intervalId = setInterval(updatePerformanceData, updateInterval);
        isInitialized.current = true;
      } catch (error) {
        console.error("Error al inicializar el monitor de rendimiento:", error);
      }
    };

    if (visible) {
      setupMonitoring();
    }

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
    };
  }, [visible]);

  useEffect(() => {
    const checkPerformance = () => {
      if (!monitorRef.current) return;

      try {
        const report = monitorRef.current.getPerformanceReport();
        if (!report?.logs?.length) return;

        const lastEntry = report.logs[report.logs.length - 1];
        if (!lastEntry) return;

        const currentMetrics = {
          fps: lastEntry.fps || 0,
          frameTime: lastEntry.frameTime || 0,
          memoryUsage: lastEntry.memoryUsage || 0,
          animationCount: document.getAnimations().length,
        };

        setPerfData((prevData) => {
          if (
            Math.abs(prevData.fps - currentMetrics.fps) > 1 ||
            Math.abs(prevData.frameTime - currentMetrics.frameTime) > 1 ||
            Math.abs(prevData.memoryUsage - currentMetrics.memoryUsage) > 0.1 ||
            prevData.animationCount !== currentMetrics.animationCount
          ) {
            return {
              ...prevData,
              fps: currentMetrics.fps,
              frameTime: currentMetrics.frameTime,
              memoryUsage: currentMetrics.memoryUsage,
              animationCount: currentMetrics.animationCount,
            };
          }
          return prevData;
        });

        if (currentMetrics.fps < 30 || currentMetrics.frameTime > 33) {
          setShowNotification(true);
        }
      } catch (error) {
        console.error("Error al verificar rendimiento:", error);
      }
    };

    performanceCheckInterval.current = window.setInterval(
      checkPerformance,
      2000
    );

    return () => {
      if (performanceCheckInterval.current) {
        clearInterval(performanceCheckInterval.current);
      }
    };
  }, []);

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
    const fps = Math.round(perfData.fps);
    if (fps >= PERFORMANCE_CONFIG.targetFPS - 5) return "text-green-500";
    if (fps >= PERFORMANCE_CONFIG.targetFPS - 15) return "text-yellow-500";
    return "text-red-500";
  };

  const getFrameTimeColor = () => {
    const frameTime = perfData.frameTime;
    if (frameTime < 16) return "text-green-500";
    if (frameTime < 33) return "text-yellow-500";
    return "text-red-500";
  };

  const handlePanelClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".close-button")) {
      return;
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <button
        className={`fixed ${getPositionClass()} z-50 p-1 bg-black/90 backdrop-blur-sm 
          text-white font-mono text-xs rounded-md border border-slate-700 shadow-lg
          transition-all duration-300 select-none text-left block w-auto`}
        style={{
          minWidth: "130px",
          maxWidth: expanded ? "250px" : "130px",
          cursor: "pointer",
          appearance: "none",
        }}
        onClick={handlePanelClick}
        tabIndex={0}
        aria-expanded={expanded}
        aria-label="Panel de rendimiento"
      >
        <div className="flex justify-between items-center px-2 py-1">
          <span className="font-bold">
            FPS:{" "}
            <span className={getFpsColor()}>{Math.round(perfData.fps)}</span>
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
                    Promedio FPS
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
                    Estabilidad
                  </th>
                  <td className="px-2 py-0.5 text-right">
                    {perfData.fpsStability || 0}%
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-2 py-0.5 text-slate-300 text-left"
                  >
                    Memoria
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
                    Animaciones
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
                    Dispositivo
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
                    {perfData.cpuCores} núcleos
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
            <div className="text-center text-xs text-slate-400 mt-1 pt-1 border-t border-slate-700">
              Alt+Shift+P: Mostrar/ocultar
            </div>
          </div>
        )}
      </button>

      {showNotification && (
        <div
          className="fixed bottom-4 left-4 bg-yellow-700/90 text-white p-3 rounded-md shadow-lg backdrop-blur-sm z-50 max-w-xs animate-fade-in"
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "1rem",
            zIndex: 50,
          }}
        >
          <div className="font-bold mb-1">
            ⚠️ Problemas de rendimiento detectados
          </div>
          <div className="text-sm">
            FPS bajo ({perfData.fps}) o tiempo de frame alto (
            {perfData.frameTime.toFixed(1)}ms). Considere cerrar aplicaciones en
            segundo plano.
          </div>
          <button
            className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded"
            onClick={() => setShowNotification(false)}
          >
            Entendido
          </button>
        </div>
      )}
    </>
  );
}
