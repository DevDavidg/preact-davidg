import {
  ComponentType,
  FunctionComponent,
  ComponentChild,
  ComponentChildren,
} from "preact";
import { useRef, useEffect } from "preact/hooks";
import PerformanceMonitor from "./PerformanceMonitor";

interface ComponentProfilerProps {
  id: string;
  children: ComponentChild | ComponentChildren;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}

/**
 * Envuelve un componente para monitorear su rendimiento
 */
const ComponentProfiler: FunctionComponent<ComponentProfilerProps> = ({
  id,
  children,
  onRender,
}) => {
  const renderStartTime = useRef(0);
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    renderStartTime.current = performance.now();
    const endRender = monitor.markComponentRender(id);

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      endRender();

      if (onRender) {
        onRender(id, "update", renderTime);
      }
    };
  });

  return <>{children}</>;
};

/**
 * HOC para envolver componentes y monitorear su rendimiento
 */
export function withProfiling<P extends object>(
  Component: ComponentType<P>,
  profilerName?: string
): FunctionComponent<P> {
  const displayName =
    profilerName ||
    Component.displayName ||
    Component.name ||
    "UnknownComponent";

  const ProfilingComponent: FunctionComponent<P> = (props: P) => {
    return (
      <ComponentProfiler id={displayName}>
        <Component {...props} />
      </ComponentProfiler>
    );
  };

  ProfilingComponent.displayName = `Profiled(${displayName})`;
  return ProfilingComponent;
}

export default ComponentProfiler;
