import { FunctionComponent } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";

import Footer from "./components/Footer";
import "./styles/globals.css";
import "./styles/3d-effects.css";
import "./styles/decorative-elements.css";

import { PerformancePanel } from "./components/PerformancePanel";
import PerformanceNotifier from "./components/PerformanceNotifier";
import PerformanceMonitor from "./utils/PerformanceMonitor";
import Nav from "./components/Nav";
import { ENV } from "./config/env";
import { scanForPerformanceIssues } from "./utils/diagnosePerfIssues";
declare global {
  interface Window {
    removeInitialLoader?: () => void;
    showPerformanceMonitor?: () => void;
    hidePerformanceMonitor?: () => void;
    exportPerformanceLogs?: () => void;
    diagnosePerformance?: () => any;
    perfReport?: any;
  }
}

interface AppProps {
  children?: any;
}

export const App: FunctionComponent<AppProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const loadingTimeout = useRef<number | null>(null);
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (ENV.PERFORMANCE_MONITOR_ENABLED) {
      try {
        const monitor = PerformanceMonitor.getInstance();
        if (typeof monitor.start === "function") {
          monitor.start();
          console.log("Performance monitor started successfully");
        } else {
          console.warn("Performance monitor has no start method");
        }

        window.diagnosePerformance = () => scanForPerformanceIssues();

        window.showPerformanceMonitor = () => setShowPerformancePanel(true);
        window.hidePerformanceMonitor = () => setShowPerformancePanel(false);
        window.exportPerformanceLogs = () => monitor.exportLogs();
      } catch (error) {
        console.error("Error starting performance monitor:", error);
      }
    } else {
      console.log("Performance monitor disabled in configuration");
    }
  }, []);

  useEffect(() => {
    const removeLoader = () => {
      if (window.removeInitialLoader) {
        window.removeInitialLoader();
      }
      setIsLoading(false);
    };

    loadingTimeout.current = window.setTimeout(removeLoader, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setShowPerformancePanel((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const updatePanel = () => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      setShowPerformancePanel(ENV.PERFORMANCE_MONITOR_ENABLED);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      updatePanel();
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen flex flex-col">
      {isLoading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="content">
          <Nav />
          <main className="flex-grow">{children}</main>
          <Footer />
          {showPerformancePanel && ENV.PERFORMANCE_MONITOR_ENABLED && (
            <PerformancePanel onClose={() => setShowPerformancePanel(false)} />
          )}
        </div>
      )}
      {ENV.PERFORMANCE_MONITOR_ENABLED && (
        <PerformanceNotifier threshold={30} />
      )}
    </div>
  );
};

export default App;
