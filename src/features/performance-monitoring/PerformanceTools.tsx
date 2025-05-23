import { FunctionComponent, Fragment } from "preact";
import { useEffect, useState, useCallback } from "preact/hooks";
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

  const showPerformanceMonitor = useCallback(() => setShowPanel(true), []);
  const hidePerformanceMonitor = useCallback(() => setShowPanel(false), []);

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

  useEffect(() => {
    if (ENV.PERFORMANCE_MONITOR_ENABLED) {
      window.perfTools = {
        start: showPerformanceMonitor,
        stop: hidePerformanceMonitor,
        export: exportPerformanceLogs,
        diagnose: runDiagnose,
        help: () => {
          console.log(`
            🚀 Herramientas de Rendimiento (desde PerformanceTools):
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

      // Setup window functions for direct access if still needed by App.tsx or other legacy parts initially
      // These were used in App.tsx, so we ensure they are available.
      window.showPerformanceMonitor = showPerformanceMonitor;
      window.hidePerformanceMonitor = hidePerformanceMonitor;
      window.exportPerformanceLogs = exportPerformanceLogs;

      // installPerformanceDiagnostics will set up window.diagnosePerformance
      installPerformanceDiagnostics();
      // If diagnosePerfIssues.ts exports a function that needs the monitor instance,
      // it should be passed here, e.g., window.diagnosePerformance = () => diagnosePerformance(monitor.getPerformanceReport());
      // However, the current structure of installPerformanceDiagnostics seems to handle this internally.

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

      return () => {
        // monitor.stopMonitoring(); // PerformanceMonitor doesn't have a generic stop, but stopMonitoring
        window.removeEventListener("keydown", handleKeyDown);
        // Clean up global functions
        delete window.perfTools;
        delete window.showPerformanceMonitor;
        delete window.hidePerformanceMonitor;
        delete window.exportPerformanceLogs;
        delete window.diagnosePerformance; // Clean up the one set by installPerformanceDiagnostics
        // Note: PerformanceMonitor is a singleton and might continue running.
        // If a full cleanup is needed, a reset or dispose method on the singleton might be required.
      };
    }
  }, [
    showPerformanceMonitor,
    hidePerformanceMonitor,
    exportPerformanceLogs,
    runDiagnose,
  ]); // Dependencies for useCallback references

  if (!ENV.PERFORMANCE_MONITOR_ENABLED) {
    return null;
  }

  return (
    <Fragment>
      {showPanel && (
        <PerformancePanel
          position="top-left"
          visible={showPanel}
          onClose={hidePerformanceMonitor}
        />
      )}
      {/* ENV.PERFORMANCE_NOTIFIER_ENABLED allows for separate control over the notifier visibility,
          distinct from the main PERFORMANCE_MONITOR_ENABLED flag. */}
      {ENV.PERFORMANCE_NOTIFIER_ENABLED && (
        <PerformanceNotifier threshold={30} />
      )}
    </Fragment>
  );
};

export default PerformanceTools;
