import { FunctionComponent } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";

import Hero from "./components/Hero";
import Footer from "./components/Footer";
import "./styles/globals.css";
import "./styles/3d-effects.css";
import "./styles/decorative-elements.css";

import Projects from "./components/Proyects";
import AboutMe from "./components/AboutMe";
import PerformanceOptimizer from "./utils/PerformanceOptimizer";
import Contact from "./components/Contact";
import { PerformancePanel } from "./components/PerformancePanel";
import PerformanceNotifier from "./components/PerformanceNotifier";
import PerformanceMonitor from "./utils/PerformanceMonitor";
import Nav from "./components/Nav";
import { ENV } from "./config/env";
import { createNoiseTexture } from "./utils/noiseTexture";

declare global {
  interface Window {
    removeInitialLoader?: () => void;
    showPerformanceMonitor?: () => void;
    hidePerformanceMonitor?: () => void;
    exportPerformanceLogs?: () => void;
    diagnosePerformance?: () => any;
  }
}

export const App: FunctionComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const loadingTimeout = useRef<number | null>(null);
  const isInitialized = useRef<boolean>(false);
  const noiseOverlay = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ENV.PERFORMANCE_MONITOR_ENABLED) {
      try {
        const monitor = PerformanceMonitor.getInstance();
        if (typeof monitor.start === "function") {
          monitor.start();
          console.log("Monitor de rendimiento iniciado correctamente");
        } else {
          console.warn("El monitor de rendimiento no tiene el método start");
        }
      } catch (error) {
        console.error("Error al iniciar el monitor de rendimiento:", error);
      }
    } else {
      console.log("Monitor de rendimiento deshabilitado en la configuración");
    }
  }, []);

  useEffect(() => {
    if (!noiseOverlay.current) {
      noiseOverlay.current = createNoiseTexture();

      if (noiseOverlay.current) {
        noiseOverlay.current.style.transform = "none";
        noiseOverlay.current.style.willChange = "auto";
        noiseOverlay.current.style.zIndex = "1000";
        document.body.appendChild(noiseOverlay.current);
      }
    }

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
      setShowPerformancePanel(true);
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
          <p>Cargando...</p>
        </div>
      ) : (
        <div className="content">
          {ENV.PERFORMANCE_OPTIMIZER_ENABLED && <PerformanceOptimizer />}
          <Nav />
          <main className="flex-grow">
            <Hero />
            <Projects />
            <AboutMe />
            <Contact />
          </main>
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
