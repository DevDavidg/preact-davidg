import { render } from "preact";
import { Router } from "preact-router";
import { App } from "./app";
import "./index.css";

// Safari-specific initialization
const initializeSafariTheme = () => {
  if (typeof window === "undefined") return;

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (!isSafari) return;

  // Force initial theme detection for Safari
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } else {
    // Detect system preference for Safari
    try {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const systemTheme = prefersDark ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", systemTheme);
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", systemTheme);
    } catch (error) {
      console.warn("Safari theme detection failed:", error);
      // Default to light mode for Safari
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  // Add Safari-specific event listener for theme changes
  window.addEventListener("theme-changed", (event: CustomEvent) => {
    const { theme } = event.detail;
    document.documentElement.setAttribute("data-theme", theme);

    // Force Safari to re-render
    document.body.style.display = "none";
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = "";
  });
};

// Initialize Safari theme fixes before rendering
initializeSafariTheme();

// Import pages
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ColorShowcase from "./pages/ColorShowcase";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";

Object.defineProperty(window, "perfTools", {
  value: {
    start: () => window.showPerformanceMonitor?.(),
    stop: () => window.hidePerformanceMonitor?.(),
    export: () => window.exportPerformanceLogs?.(),
    diagnose: () => window.diagnosePerformance?.(),
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
  },
  writable: false,
});

render(
  <App>
    <Router>
      <Home path="/" />
      <Projects path="/projects" />
      <About path="/about" />
      <Contact path="/contact" />
      <ColorShowcase path="/colors" />
      <Sitemap path="/sitemap" />
      <NotFound default />
    </Router>
  </App>,
  document.getElementById("app") as HTMLElement
);
