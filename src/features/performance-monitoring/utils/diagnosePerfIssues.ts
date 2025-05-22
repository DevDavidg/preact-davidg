import PerformanceMonitor from "./PerformanceMonitor";

export type PerformanceIssue = {
  type:
    | "animation"
    | "rendering"
    | "layout"
    | "script"
    | "memory"
    | "network"
    | "asset";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  component?: string;
  selector?: string;
  count?: number;
  recommendations: string[];
};

const PERFORMANCE_HEAVY_SELECTORS = {
  animations: [
    ".animate-float",
    ".animate-float-3d",
    ".animate-float-reverse",
    '[style*="animation"]',
    ".motion-safe",
    '[data-animate="true"]',
  ],
  transforms: [
    ".preserve-3d",
    ".perspective",
    '[style*="transform"]',
    '[style*="rotate"]',
    '[style*="translate"]',
  ],
  filters: [
    ".backdrop-blur-md",
    '[style*="blur"]',
    '[style*="filter"]',
    ".bg-blur",
    '[class*="blur"]',
  ],
  shadows: [
    '[class*="shadow"]',
    '[style*="shadow"]',
    '[style*="box-shadow"]',
    '[style*="text-shadow"]',
  ],
  gradients: ['[class*="gradient"]', '[style*="gradient"]', ".bg-gradient"],
};

export function scanForPerformanceIssues(): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  const animationElements = document.querySelectorAll(
    PERFORMANCE_HEAVY_SELECTORS.animations.join(",")
  );
  if (animationElements.length > 20) {
    issues.push({
      type: "animation",
      severity: animationElements.length > 50 ? "critical" : "high",
      description: `Alto número de elementos animados (${animationElements.length})`,
      count: animationElements.length,
      selector: PERFORMANCE_HEAVY_SELECTORS.animations.join(","),
      recommendations: [
        "Reducir el número de animaciones simultáneas",
        "Usar `will-change` solo en elementos que realmente lo necesiten",
        "Pausar animaciones fuera de la vista con IntersectionObserver",
        "Considerar desactivar animaciones en dispositivos de baja potencia",
      ],
    });
  }

  const filterElements = document.querySelectorAll(
    PERFORMANCE_HEAVY_SELECTORS.filters.join(",")
  );
  if (filterElements.length > 10) {
    issues.push({
      type: "rendering",
      severity: filterElements.length > 20 ? "critical" : "high",
      description: `Alto número de elementos con filtros CSS (${filterElements.length})`,
      count: filterElements.length,
      selector: PERFORMANCE_HEAVY_SELECTORS.filters.join(","),
      recommendations: [
        "Reducir el uso de `backdrop-filter` y `filter` en elementos grandes",
        "Considerar usar imágenes pre-procesadas en lugar de filtros en tiempo real",
        "Limitar el área de los elementos con filtros",
        "Considerar usar CSS opacity en lugar de blur para efectos de transparencia",
      ],
    });
  }

  const shadowElements = document.querySelectorAll(
    PERFORMANCE_HEAVY_SELECTORS.shadows.join(",")
  );
  if (shadowElements.length > 30) {
    issues.push({
      type: "rendering",
      severity: "medium",
      description: `Alto número de elementos con sombras (${shadowElements.length})`,
      count: shadowElements.length,
      selector: PERFORMANCE_HEAVY_SELECTORS.shadows.join(","),
      recommendations: [
        "Considerar usar sprites o imágenes para sombras complejas",
        "Simplificar o eliminar sombras en dispositivos de baja potencia",
        "Reducir el radio de desenfoque (blur) en las sombras",
      ],
    });
  }

  const monitor = PerformanceMonitor.getInstance();
  const report = monitor.getPerformanceReport();
  const longFrames = report.stats.longFrames;

  if (longFrames > 10) {
    issues.push({
      type: "script",
      severity: longFrames > 30 ? "critical" : "high",
      description: `Detección de ${longFrames} frames largos (>50ms)`,
      component: report.stats.slowestComponents[0]?.[0],
      recommendations: [
        "Revisar el código JavaScript que se ejecuta en bucles o eventos frecuentes",
        "Considerar usar requestAnimationFrame para operaciones visuales",
        "Debounce o throttle eventos como resize, scroll o input",
        "Dividir operaciones costosas en tareas más pequeñas",
      ],
    });
  }

  const layoutScanResults = scanForLayoutThrashing();
  if (layoutScanResults.count > 5) {
    issues.push({
      type: "layout",
      severity: layoutScanResults.count > 15 ? "critical" : "high",
      description: `Posible layout thrashing detectado (${layoutScanResults.count} operaciones)`,
      recommendations: [
        "Agrupar lecturas y escrituras del DOM para evitar recálculos",
        "Considerar usar CSS transform en lugar de cambiar propiedades como width/height",
        "Usar absolute o fixed positioning para elementos que cambian frecuentemente",
        "Medir y optimizar los tiempos de redimensionamiento y scroll",
      ],
    });
  }

  return issues;
}

function scanForLayoutThrashing(): { count: number; elements: string[] } {
  const result = { count: 0, elements: [] as string[] };

  try {
    const originalGetBoundingClientRect =
      Element.prototype.getBoundingClientRect;
    const originalGetComputedStyle = window.getComputedStyle;

    let measureCount = 0;
    let lastMeasureTime = 0;

    Element.prototype.getBoundingClientRect = function () {
      measureCount++;
      lastMeasureTime = performance.now();
      result.elements.push(
        this.tagName.toLowerCase() +
          (this.className ? `.${this.className.split(" ")[0]}` : "")
      );

      if (performance.now() - lastMeasureTime < 20 && measureCount > 5) {
        result.count++;
      }

      return originalGetBoundingClientRect.apply(this, arguments as any);
    };

    setTimeout(() => {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      window.getComputedStyle = originalGetComputedStyle;
    }, 2000);
  } catch (error) {
    console.error("Error al escanear problemas de layout:", error);
  }

  return result;
}

export function getSlowestComponents() {
  const monitor = PerformanceMonitor.getInstance();
  const report = monitor.getPerformanceReport();
  return report.stats.slowestComponents;
}

export function generatePerformanceReport() {
  const issues = scanForPerformanceIssues();
  const monitor = PerformanceMonitor.getInstance();
  const perfReport = monitor.getPerformanceReport();

  return {
    timestamp: new Date().toISOString(),
    issues,
    stats: {
      fps: {
        average: perfReport.stats.avgFps,
        min: Math.min(
          ...perfReport.logs.filter((l) => l.fps).map((l) => l.fps || 0)
        ),
        max: Math.max(
          ...perfReport.logs.filter((l) => l.fps).map((l) => l.fps || 0)
        ),
      },
      memory: {
        trend: perfReport.stats.memoryTrend,
      },
      slowestComponents: perfReport.stats.slowestComponents.slice(0, 10),
      longFrames: perfReport.stats.longFrames,
    },
    recommendations: issues.flatMap((issue) => issue.recommendations),
    browserInfo: {
      userAgent: navigator.userAgent,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: (navigator as any).connection && {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      },
    },
  };
}

export function installPerformanceDiagnostics() {
  if (typeof window !== "undefined") {
    (window as any).diagnosePerformance = () => {
      const issues = scanForPerformanceIssues();
      console.group("🔍 Diagnóstico de Rendimiento");

      if (issues.length === 0) {
        console.log("✅ No se detectaron problemas graves de rendimiento");
      } else {
        issues.forEach((issue) => {
          const severityColors = {
            critical: "#ff4d4f",
            high: "#ff7a45",
            medium: "#ffc53d",
            low: "#73d13d",
          };

          const color = severityColors[issue.severity];

          console.log(
            `%c${issue.severity.toUpperCase()}%c ${issue.type}: ${
              issue.description
            }`,
            `background: ${color}; color: white; padding: 2px 4px; border-radius: 2px;`,
            "font-weight: bold;"
          );

          console.log("Recomendaciones:");
          issue.recommendations.forEach((rec) => console.log(`- ${rec}`));

          if (issue.selector) {
            console.log(
              "Elementos afectados:",
              document.querySelectorAll(issue.selector)
            );
          }

          console.log("\n");
        });
      }

      console.groupEnd();

      return generatePerformanceReport();
    };

    console.info(
      "📊 Diagnóstico de rendimiento instalado. Ejecuta window.diagnosePerformance() para analizar problemas."
    );
  }
}

export default installPerformanceDiagnostics;
