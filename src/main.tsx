import { render } from "preact";
import { App } from "./app";
import "./index.css";

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

render(<App />, document.getElementById("app") as HTMLElement);
