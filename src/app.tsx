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
import Nav from "./components/Nav";
import { ENV } from "./config/env";
import { PerformanceTools } from "./features/performance-monitoring/PerformanceTools";
import { createNoiseTexture } from "./utils/noiseTexture";

declare global {
  interface Window {
    removeInitialLoader?: () => void;
    // Performance related globals will be managed by PerformanceTools
  }
}

export const App: FunctionComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeout = useRef<number | null>(null);
  const noiseOverlay = useRef<HTMLDivElement | null>(null);

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

    // The handleKeyDown function and its listeners were removed as they were unused.
    // If global keyboard shortcuts are needed in the future, they can be added here
    // or in a dedicated module.

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  // updatePanel and its useEffect are removed as panel visibility is managed by PerformanceTools

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
          {/* PerformanceTools will manage its own rendering based on ENV.PERFORMANCE_MONITOR_ENABLED */}
          {ENV.PERFORMANCE_MONITOR_ENABLED && <PerformanceTools />}
          <Nav />
          <main className="flex-grow">
            <Hero />
            <Projects />
            <AboutMe />
            <Contact />
          </main>
          <Footer />
          {/* PerformancePanel and PerformanceNotifier are now rendered within PerformanceTools */}
        </div>
      )}
      {/* PerformanceNotifier is now rendered within PerformanceTools */}
    </div>
  );
};

export default App;
