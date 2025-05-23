import { FunctionComponent } from "preact";
import { useEffect, useState, useCallback, useRef } from "preact/hooks";
import { ENV } from "../../config/env";
import PerformanceMonitor from "./utils/PerformanceMonitor";
import { PerformancePanel } from "./components/PerformancePanel";
import PerformanceNotifier from "./components/PerformanceNotifier";
// Assuming diagnosePerformance is exported from diagnosePerfIssues.ts
// and it might need the monitor instance or its logs.
// Let's check the actual export of diagnosePerfIssues.ts later if this is not correct.
import {
  installPerformanceDiagnostics,
  generatePerformanceReport,
} from "./utils/diagnosePerfIssues";
import "./styles/PerformancePanel.css";

declare global {
  interface Window {
    showPerformanceMonitor?: () => void;
    hidePerformanceMonitor?: () => void;
    exportPerformanceLogs?: () => void;
    diagnosePerformance?: () => any; // Or specific return type
    perfTools?: {
      start: () => void;
      stop: () => void;
      export: () => void;
      diagnose: () => void;
      help: () => void;
    };
  }
}

export const PerformanceTools: FunctionComponent = () => {
  const [showPanel, setShowPanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showPerformanceMonitor = useCallback(() => {
    setShowPanel(true);
  }, []);

  const hidePerformanceMonitor = useCallback(() => {
    setShowPanel(false);
  }, []);

  const exportPerformanceLogs = useCallback(() => {
    if (ENV.PERFORMANCE_MONITOR_ENABLED) {
      PerformanceMonitor.getInstance().exportLogs();
      console.log("Performance logs exported.");
    }
  }, []);

  const runDiagnose = useCallback(() => {
    if (ENV.PERFORMANCE_MONITOR_ENABLED) {
      console.log("Running performance diagnosis...");
      // The original diagnosePerformance in App.tsx called window.diagnosePerformance()
      // which was set up by installPerformanceDiagnostics.
      // installPerformanceDiagnostics itself calls generatePerformanceReport.
      // So we can either call the global one if it's already set up,
      // or call generatePerformanceReport directly.
      // For encapsulation, let's ensure diagnostics are installed and then call the global.
      if (window.diagnosePerformance) {
        window.diagnosePerformance();
      } else {
        // Fallback or direct call if window.diagnosePerformance is not set up by this point.
        // This depends on whether installPerformanceDiagnostics auto-runs or needs to be called.
        // From its code, it seems to auto-run and set up window.diagnosePerformance.
        console.warn(
          "window.diagnosePerformance not found. Generating report directly."
        );
        const report = generatePerformanceReport();
        console.log("Performance Report:", report);
      }
    }
  }, []);

  // Initialize global functions immediately
  useEffect(() => {
    window.perfTools = {
      start: showPerformanceMonitor,
      stop: hidePerformanceMonitor,
      export: exportPerformanceLogs,
      diagnose: runDiagnose,
      help: () => {
        console.log(`
          🚀 Herramientas de Rendimiento:
          perfTools.start()    - Mostrar monitor de rendimiento
          perfTools.stop()     - Ocultar monitor de rendimiento
          perfTools.export()   - Exportar logs de rendimiento
          perfTools.diagnose() - Ejecutar diagnóstico completo
          Atajos de teclado:
          Alt+Shift+P - Mostrar/ocultar monitor
          Alt+Shift+D - Ejecutar diagnóstico
        `);
      },
    };

    window.showPerformanceMonitor = showPerformanceMonitor;
    window.hidePerformanceMonitor = hidePerformanceMonitor;
    window.exportPerformanceLogs = exportPerformanceLogs;

    return () => {
      delete window.perfTools;
      delete window.showPerformanceMonitor;
      delete window.hidePerformanceMonitor;
      delete window.exportPerformanceLogs;
      delete window.diagnosePerformance;
    };
  }, [
    showPerformanceMonitor,
    hidePerformanceMonitor,
    exportPerformanceLogs,
    runDiagnose,
  ]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey) {
        if (e.key === "P" || e.key === "p") {
          e.preventDefault();
          setShowPanel((prev) => !prev);
        }
        if (e.key === "D" || e.key === "d") {
          e.preventDefault();
          runDiagnose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runDiagnose]);

  // Initialize performance diagnostics
  useEffect(() => {
    if (ENV.PERFORMANCE_MONITOR_ENABLED) {
      installPerformanceDiagnostics();
    }
  }, []);

  if (!ENV.PERFORMANCE_MONITOR_ENABLED) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {showPanel && (
        <div style={{ pointerEvents: "auto" }}>
          <PerformancePanel
            position="top-left"
            visible={showPanel}
            onClose={hidePerformanceMonitor}
          />
        </div>
      )}
      {/* ENV.PERFORMANCE_NOTIFIER_ENABLED allows for separate control over the notifier visibility,
          distinct from the main PERFORMANCE_MONITOR_ENABLED flag. */}
      {ENV.PERFORMANCE_NOTIFIER_ENABLED && (
        <div style={{ pointerEvents: "auto" }}>
          <PerformanceNotifier threshold={30} />
        </div>
      )}
    </div>
  );
};

export default PerformanceTools;
