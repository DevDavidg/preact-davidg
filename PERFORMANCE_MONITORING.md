# 🚀 Herramientas de Monitoreo de Rendimiento

Este documento explica cómo utilizar las herramientas de monitoreo de rendimiento implementadas en el proyecto para detectar y solucionar problemas de rendimiento.

## 📊 Sistemas de Monitoreo Disponibles

El proyecto incluye los siguientes sistemas integrados:

1. **PerformanceMonitor**: Clase principal que rastrea y analiza métricas en tiempo real
2. **PerformancePanel**: Panel visual con información detallada sobre el rendimiento
3. **PerformanceOptimizer**: Sistema automático que optimiza elementos según el rendimiento
4. **diagnosePerfIssues**: Herramienta de diagnóstico que identifica problemas específicos
5. **ComponentProfiler**: Componente para medir el rendimiento de componentes específicos

## 🔍 Cómo Acceder a las Herramientas

### Panel de Rendimiento (PerformancePanel)

Muestra métricas clave como FPS, tiempo de frame, memoria y conteo de animaciones.

- **Atajo de teclado**: Presiona `Alt+Shift+P` para mostrar/ocultar el panel
- El panel aparece por defecto en la esquina superior izquierda, pero puede configurarse para aparecer en cualquiera de las 4 esquinas

El panel muestra:

- FPS actual (verde si es bueno, amarillo si es aceptable, rojo si es bajo)
- Tiempo de frame en milisegundos
- FPS promedio y estabilidad
- Uso de memoria (cuando está disponible)
- Conteo de animaciones activas
- Número de renderizados
- Frames con lag ("Lags")
- Información del dispositivo (clase, núcleos, RAM)

### Diagnóstico de Problemas

Para ejecutar un diagnóstico completo de problemas de rendimiento:

- **Console**: Ejecuta `window.diagnosePerformance()` en la consola del navegador

El diagnóstico analiza:

- Elementos con efectos visuales pesados (filtros, blur, sombras)
- Animaciones excesivas o ineficientes
- Problemas de layout thrashing (operaciones que causan recálculos del layout)
- Componentes con tiempos de renderizado altos

### Exportación de Datos de Rendimiento

Para exportar los datos recopilados por el PerformanceMonitor:

```js
// En la consola del navegador
const monitor = PerformanceMonitor.getInstance();
monitor.exportLogs();
```

## 📋 Interpretando los Resultados

### Indicadores de Problemas de Rendimiento

| Métrica         | Bueno  | Aceptable | Problemático |
| --------------- | ------ | --------- | ------------ |
| FPS             | > 50   | 30-50     | < 30         |
| Tiempo de frame | < 16ms | 16-33ms   | > 33ms       |
| Frames con lag  | < 5    | 5-20      | > 20         |
| Estabilidad     | < 5%   | 5-15%     | > 15%        |

### Problemas Comunes y Soluciones

1. **Alto número de elementos con filtros (blur, etc.)**

   - Reducir la cantidad de elementos con `backdrop-filter` y `filter`
   - Limitar el tamaño de los elementos con estos efectos
   - Usar imágenes pre-procesadas en lugar de filtros en tiempo real

2. **Exceso de animaciones**

   - Pausar animaciones fuera de la vista
   - Simplificar o eliminar animaciones en dispositivos de baja potencia
   - Usar `will-change` de forma limitada y estratégica

3. **Sombras excesivas**

   - Simplificar sombras (reducir el valor de blur)
   - Considerar usar sprites o imágenes para sombras complejas
   - Limitar el número de elementos con sombras

4. **Layout thrashing**
   - Agrupar lecturas y escrituras del DOM
   - Usar CSS transform en lugar de cambiar propiedades que provocan layout
   - Utilizar posicionamiento absoluto o fijo para elementos que cambian frecuentemente

## 🚀 Optimizador de Rendimiento Automático

El sistema incluye un optimizador automático (`PerformanceOptimizer`) que:

1. Detecta la capacidad del dispositivo del usuario (CPU, memoria, conexión)
2. Crea un perfil de rendimiento personalizado
3. Aplica optimizaciones automáticas según sea necesario:
   - Pausa animaciones fuera de la vista
   - Desactiva efectos visuales complejos en dispositivos de baja potencia
   - Reduce la calidad de efectos como sombras y blur cuando el FPS es bajo
   - Convierte GIFs a videos para mejorar rendimiento
   - Aplica `content-visibility: auto` para elementos fuera de la vista

## 🧪 Probando el Rendimiento

### Simulando Dispositivos de Baja Potencia

Para probar la aplicación en condiciones de bajo rendimiento:

1. Abre las DevTools del navegador
2. Ve a la pestaña "Performance" o "Rendimiento"
3. Activa la opción de throttling de CPU (4x o 6x slowdown)

### Forzando el Modo de Bajo Rendimiento

Puedes forzar el modo de bajo rendimiento:

```js
// En la consola del navegador
document.documentElement.setAttribute("data-perf-mode", "low");
```

## 🛠️ Configuración y Personalización

### Ajustando los Umbrales

Puedes personalizar los umbrales en `src/utils/PerformanceMonitor.ts`:

```typescript
export const PERFORMANCE_CONFIG = {
  targetFPS: 60,
  frameTimeThreshold: 16.67,
  longFrameThreshold: 33.33,
  memoryWarningThreshold: 90,
  lowEndDeviceThreshold: 30,
  maxLogEntries: 1000,
  scanInterval: 2000,
  rafThrottle: 0,
  highEndDeviceThreshold: 8,
  ultraHighEndDeviceThreshold: 16,
};
```

### Personalizando el Panel de Rendimiento

El componente `PerformancePanel` acepta las siguientes props:

```typescript
type PanelProps = Readonly<{
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  visible?: boolean;
  onClose?: () => void;
}>;
```

## 👨‍💻 Para Desarrolladores: Monitoreando Componentes Específicos

### Usando ComponentProfiler

Para medir el rendimiento de un componente específico:

```tsx
import ComponentProfiler from "../utils/ComponentProfiler";

const MyComponent = () => {
  return (
    <ComponentProfiler id="MyCustomSection">
      <div>{/* Contenido del componente */}</div>
    </ComponentProfiler>
  );
};
```

### Usando markComponentRender

Para un enfoque más detallado, puedes usar el método directo:

```tsx
import PerformanceMonitor from "../utils/PerformanceMonitor";

const MyComponent = () => {
  // Dentro del componente, antes de cualquier renderizado costoso
  const endMark =
    PerformanceMonitor.getInstance().markComponentRender("MyComponent");

  // Lógica de renderizado costosa...

  // Al finalizar el renderizado
  useEffect(() => {
    return endMark; // Llama a la función de finalización cuando el componente se monta
  }, []);

  return <div>Mi componente</div>;
};
```

### Entendiendo los Informes de Rendimiento

Los informes generados por `diagnosePerformance()` incluyen:

- **type**: Tipo de problema (animation, rendering, layout, script, memory, network, asset)
- **severity**: Gravedad del problema (low, medium, high, critical)
- **description**: Descripción del problema
- **recommendations**: Recomendaciones para solucionar el problema
- **component**: Componente afectado (si aplica)
- **count**: Número de elementos afectados
- **selector**: Selector CSS para identificar los elementos problemáticos

## 📈 Futuras Mejoras

Próximas características planificadas:

- Dashboard avanzado con gráficos de tendencias
- Exportación de métricas a servicios de análisis externos
- Más optimizaciones automáticas para dispositivos de gama baja
- API para integración con herramientas de pruebas automatizadas
