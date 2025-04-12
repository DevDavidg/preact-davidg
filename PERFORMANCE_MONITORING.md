# 🚀 Herramientas de Monitoreo de Rendimiento

Este documento explica cómo utilizar las herramientas de monitoreo de rendimiento implementadas en el proyecto para detectar problemas de lag y uso excesivo de CPU.

## 📊 Herramientas disponibles

El proyecto incluye las siguientes herramientas para monitorear y diagnosticar problemas de rendimiento:

1. **Monitor de Rendimiento**: Panel visual con métricas en tiempo real (FPS, tiempo de frame, memoria)
2. **Diagnóstico de Rendimiento**: Identificación automática de problemas y recomendaciones
3. **Exportación de Logs**: Guardado de datos detallados para análisis posterior
4. **Notificador de Problemas**: Alertas automáticas cuando el rendimiento cae

## 🔍 Cómo acceder a las herramientas

### Monitor de Rendimiento

Hay varias formas de acceder al monitor de rendimiento:

- **Atajo de teclado**: Presiona `Alt+Shift+P` para mostrar/ocultar el panel
- **Console**: Ejecuta `window.showPerformanceMonitor()` en la consola del navegador

El panel de rendimiento muestra:

- FPS actual (verde si es bueno, rojo si es bajo)
- Tiempo de frame
- Uso de memoria (cuando está disponible)
- Conteo de frames con lag
- Gráficos de FPS y tiempo de frame

### Diagnóstico de Problemas

Para ejecutar un diagnóstico de problemas de rendimiento:

- **Atajo de teclado**: Presiona `Alt+Shift+D`
- **Console**: Ejecuta `window.diagnosePerformance()` en la consola

El diagnóstico muestra:

- FPS promedio
- Elementos problemáticos en la página
- Componentes con bajo rendimiento
- Recomendaciones específicas para mejorar el rendimiento

### Exportación de Datos

Para exportar los datos recopilados y analizarlos externamente:

1. Abre el Monitor de Rendimiento con `Alt+Shift+P`
2. Haz clic en "Exportar"

También puedes exportar los logs desde la consola:

```js
window.exportPerformanceLogs();
```

## 📋 Interpretando los resultados

### Indicadores de problemas de rendimiento

| Métrica         | Bueno  | Aceptable | Problemático |
| --------------- | ------ | --------- | ------------ |
| FPS             | > 50   | 30-50     | < 30         |
| Tiempo de frame | < 16ms | 16-33ms   | > 33ms       |
| Frames con lag  | < 5    | 5-20      | > 20         |

### Problemas comunes y soluciones

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

## 🧪 Probando el rendimiento en diferentes dispositivos

Para simular dispositivos de baja potencia:

1. Abre las DevTools del navegador
2. Ve a la pestaña "Performance" o "Rendimiento"
3. Activa la opción de throttling de CPU (4x o 6x slowdown)

## 🛠️ Personalizando la configuración

Puedes ajustar los umbrales y comportamiento del monitor modificando las constantes en `src/utils/PerformanceMonitor.ts`:

```typescript
export const PERFORMANCE_CONFIG = {
  targetFPS: 60,
  frameBudget: 16.67, // ~60fps en ms
  lagThreshold: 50, // Umbral para detectar lag severo (ms)
  logLevel: "debug", // 'debug' | 'warning' | 'error'
  sampleRate: 5, // Muestreo (1 = cada frame, 5 = cada 5 frames)
  bufferSize: 300, // Número máximo de entradas en el buffer
  autoExport: true, // Exportar automáticamente logs cuando detecte problemas
};
```

## 👨‍💻 Para desarrolladores: Perfilando componentes específicos

Si quieres monitorear el rendimiento de componentes específicos, puedes usar el HOC `withProfiling`:

```tsx
import { withProfiling } from "../utils/ComponentProfiler";

// Componente normal
const MyComponent = (props) => {
  // ...
};

// Componente con monitoreo de rendimiento
export default withProfiling(MyComponent, "MyComponentName");
```

O usar el componente `ComponentProfiler` directamente:

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
