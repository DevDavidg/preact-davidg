# David Guillen - Portfolio Personal

Portfolio profesional de David Guillen, Front-End & Mobile Developer especializado en React, Angular, Vue y desarrollo móvil. Esta aplicación web moderna está construida con Preact y empaquetada con Vite, optimizada para ofrecer el mejor rendimiento posible incluso en dispositivos de gama baja.

## 🚀 Tecnologías

- **Preact**: Alternativa rápida de 3kB a React con la misma API
- **Vite**: Herramienta de compilación frontend de próxima generación
- **TailwindCSS**: Framework CSS basado en utilidades
- **TypeScript**: JavaScript tipado a escala
- **Express**: Servidor backend para despliegue en producción
- **Framer Motion**: Biblioteca de animaciones para Preact

## 🔧 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd dev-davidg

# Instalar dependencias
npm install
```

## 💻 Desarrollo

Inicia el servidor de desarrollo con recarga en caliente:

```bash
npm run dev
```

El servidor de desarrollo estará disponible en http://localhost:5173.

### Verificación de tipos

Verifica los tipos de TypeScript:

```bash
npm run check-types
```

## 📊 Sistema de Monitoreo de Rendimiento

Esta aplicación incluye un sistema avanzado de monitoreo y optimización de rendimiento que:

- Rastrea métricas clave (FPS, tiempo de frame, memoria)
- Diagnostica automáticamente problemas de rendimiento
- Optimiza elementos fuera de la vista para reducir la carga de CPU
- Adapta las animaciones según la capacidad del dispositivo

### Herramientas de rendimiento

Para acceder a las herramientas de monitoreo:

- Usa el atajo `Alt+Shift+P` para mostrar/ocultar el panel de rendimiento
- Ejecuta `window.diagnosePerformance()` en la consola del navegador para un diagnóstico completo

Para más detalles, consulta [PERFORMANCE_MONITORING.md](./PERFORMANCE_MONITORING.md).

## 🚀 Construcción y Despliegue

### Comando principal: deploy

Para construir y desplegar la aplicación:

```bash
npm run deploy
```

Este comando:

1. Verifica si la aplicación ya está construida (carpeta `dist/`)
2. Si no existe, construye automáticamente la aplicación con optimizaciones
3. Inicia un servidor HTTP optimizado con configuración de tipos MIME correcta
4. Maneja correctamente las rutas de SPA redirigiendo al index.html
5. Abre automáticamente el navegador para mostrar la aplicación

### Construcción manual

```bash
npm run build
```

Esto generará la aplicación optimizada en la carpeta `dist/`.

## 📁 Estructura del Proyecto

```
dev-davidg/
├── dist/               # Resultado de la compilación
├── public/             # Activos estáticos
├── src/
│   ├── assets/         # Imágenes y otros activos
│   ├── components/     # Componentes reutilizables
│   │   └── PerformancePanel.tsx  # Panel visual de rendimiento
│   ├── config/         # Configuración de la aplicación
│   ├── hooks/          # Hooks personalizados
│   ├── pages/          # Páginas/rutas de la aplicación
│   ├── styles/         # Estilos globales
│   ├── types/          # Definiciones de tipos TypeScript
│   ├── utils/          # Funciones utilitarias
│   │   ├── PerformanceMonitor.ts       # Monitor de rendimiento
│   │   ├── PerformanceOptimizer.tsx    # Optimizador automático
│   │   ├── diagnosePerfIssues.ts       # Diagnóstico de problemas
│   │   └── ComponentProfiler.tsx       # Perfilador de componentes
│   ├── app.tsx         # Componente principal de la aplicación
│   ├── index.css       # Punto de entrada CSS
│   └── main.tsx        # Punto de entrada
├── serve.json          # Configuración para servidor estático
├── simple-http-server.js # Servidor HTTP simple
├── simple-server.js    # Servidor Express
├── vite.config.ts      # Configuración de Vite
├── tailwind.config.js  # Configuración de TailwindCSS
├── tsconfig.json       # Configuración de TypeScript
└── package.json        # Dependencias y scripts
```

## 🎨 Enfoque de Estilizado

Este proyecto utiliza un enfoque de estilizado unificado que combina:

1. **TailwindCSS**: Para estilizado basado en utilidades
2. **Variables CSS**: Para consistencia de tema (modo claro/oscuro)
3. **Framer Motion**: Para animaciones

Características clave del sistema de estilizado:

- Esquema de colores unificado con variables CSS
- Soporte para modo oscuro con toggles basados en clases
- Diseño responsivo con optimizaciones para móviles
- Sistema de animaciones con keyframes y utilidades de transición
- Efectos 3D con transformaciones de perspectiva

## 🧪 Depuración y Optimización

El sistema de monitoreo de rendimiento proporciona:

- Identificación de componentes lentos
- Detección de elementos que causan reflow y layout thrashing
- Optimización automática de efectos visuales en dispositivos lentos
- Exportación de métricas para análisis profundo
- Notificaciones automáticas cuando el rendimiento es bajo

## 👨‍💻 Para desarrolladores

### Perfilando componentes específicos

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

## 🌎 Despliegue en hosting

Para desplegar esta aplicación en un servicio de hosting, siga estos pasos:

### 1. Preparación para despliegue

```bash
# Construir la aplicación para producción
npm run build
```

### 2. Configuración del hosting

Asegúrese de que su proveedor de hosting esté configurado correctamente:

1. **Configuración de SPA**: Configure su hosting para redirigir todas las rutas no encontradas a `index.html`
2. **Tipos MIME**: Verifique que los tipos MIME estén configurados correctamente (use serve.json como referencia)
3. **Carpeta raíz**: Configure la carpeta `dist/` como la raíz del sitio web

### 3. Opciones de despliegue

#### Vercel

```bash
# Instalar Vercel CLI si aún no está instalado
npm install -g vercel

# Desplegar en Vercel (asegúrese de tener vercel.json configurado)
vercel
```

El archivo `vercel.json` ya está configurado para manejar correctamente las rutas SPA y los tipos MIME.

#### Netlify

1. Conecte su repositorio a Netlify
2. Configure el comando de construcción como `npm run build`
3. Configure la carpeta de publicación como `dist`
4. Agregue un archivo `_redirects` en la carpeta `public/` con el contenido:
   ```
   /* /index.html 200
   ```

#### Hosting tradicional (FTP)

1. Construya la aplicación con `npm run build`
2. Suba todos los archivos de la carpeta `dist/` a su servidor mediante FTP
3. Configure el servidor web (Apache/Nginx) para manejar las rutas SPA

##### Configuración de Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

##### Configuración de Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 4. Verificación post-despliegue

Después de desplegar, verifique:

- Que todas las rutas funcionen correctamente
- Que los assets se carguen con los tipos MIME correctos
- Que la navegación de la SPA funcione sin problemas
- Que el rendimiento sea óptimo en producción

## 📄 License

[Your License Information]

## 🎨 Styling Approach

This project uses a unified styling approach combining:

1. **TailwindCSS**: For utility-first styling
2. **CSS Variables**: For theme consistency (light/dark mode)
3. **CSS Modules**: For component-specific styles
4. **Framer Motion**: For animations

The styles are organized as follows:

- `src/index.css`: The main entry point that imports all styles
- `src/styles/globals.css`: Global styles, variables, and utility classes
- `src/styles/3d-effects.css`: Specialized 3D visual effects

Key features of the styling system:

- Unified color scheme with CSS variables
- Dark mode support with class-based toggle
- Responsive design with mobile optimizations
- Animation system with keyframes and transition utilities
- 3D effects with perspective transforms

### Best Practices for Styling

1. Use Tailwind utilities whenever possible
2. Leverage the predefined CSS classes for common patterns
3. Keep component-specific animations in the component files
4. Follow the existing naming conventions for consistency
5. Use CSS variables for theme-related values
6. Custom CSS should be added to globals.css under the appropriate section

## 🌟 Best Practices

### Performance Optimization

- The project uses code splitting with `manualChunks` in Vite config to separate vendor code
- Assets are optimized during build
- Terser minification is enabled for production builds

### Development Workflow

1. Write code with TypeScript for enhanced developer experience
2. Use hot module replacement during development for instant feedback
3. Run type checking before committing code
4. Build and test the production version before deployment

### MIME Type Handling

One common issue in SPAs is incorrect MIME type handling when serving files. This project includes multiple server options that properly handle MIME types:

- The Bun server (`bun.js`) includes MIME type mapping
- The Express server (`simple-server.js`) sets appropriate Content-Type headers
- The static server configuration (`serve.json`) includes MIME type definitions

### SPA Routing

All server implementations handle SPA routing by redirecting non-file requests to index.html.

## ⚠️ Common Issues and Solutions

### MIME Type Errors

If you see MIME type errors in the console, ensure you're using one of the provided server scripts rather than serving files directly.

### Content Security Policy

If encountering CSP issues, review the headers in your server configuration.

## 🎨 Styling Approach

This project uses a unified styling approach combining:

1. **TailwindCSS**: For utility-first styling
2. **CSS Variables**: For theme consistency (light/dark mode)
3. **CSS Modules**: For component-specific styles
4. **Framer Motion**: For animations

The styles are organized as follows:

- `src/index.css`: The main entry point that imports all styles
- `src/styles/globals.css`: Global styles, variables, and utility classes
- `src/styles/3d-effects.css`: Specialized 3D visual effects

Key features of the styling system:

- Unified color scheme with CSS variables
- Dark mode support with class-based toggle
- Responsive design with mobile optimizations
- Animation system with keyframes and transition utilities
- 3D effects with perspective transforms

### Best Practices for Styling

1. Use Tailwind utilities whenever possible
2. Leverage the predefined CSS classes for common patterns
3. Keep component-specific animations in the component files
4. Follow the existing naming conventions for consistency
5. Use CSS variables for theme-related values
6. Custom CSS should be added to globals.css under the appropriate section

## 🌟 Best Practices

### Performance Optimization

- The project uses code splitting with `manualChunks` in Vite config to separate vendor code
- Assets are optimized during build
- Terser minification is enabled for production builds

### Development Workflow

1. Write code with TypeScript for enhanced developer experience
2. Use hot module replacement during development for instant feedback
3. Run type checking before committing code
4. Build and test the production version before deployment

### MIME Type Handling

One common issue in SPAs is incorrect MIME type handling when serving files. This project includes multiple server options that properly handle MIME types:

- The Bun server (`bun.js`) includes MIME type mapping
- The Express server (`simple-server.js`) sets appropriate Content-Type headers
- The static server configuration (`serve.json`) includes MIME type definitions

### SPA Routing

All server implementations handle SPA routing by redirecting non-file requests to index.html.

## ⚠️ Common Issues and Solutions

### MIME Type Errors

If you see MIME type errors in the console, ensure you're using one of the provided server scripts rather than serving files directly.

### Content Security Policy

If encountering CSP issues, review the headers in your server configuration.

## 📄 License

[Your License Information]

## 👨‍💻 Working with Bun

### Why Bun?

Bun is a modern JavaScript runtime, bundler, transpiler, and package manager all in one. It's designed to be a drop-in replacement for Node.js with much faster performance. For this project, Bun offers:

1. **Faster dependency installation** - `bun install` is significantly faster than npm or yarn
2. **Improved server performance** - The Bun server has better throughput and lower latency
3. **TypeScript support out of the box** - No need for separate transpilation steps
4. **ESM and CommonJS compatibility** - Works with both module systems

### Bun Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build the project
bun run build

# Serve production build
bun run serve:bun

# Run TypeScript type checking
bun run check-types
```

### Switching Between Bun and Node.js

This project is fully compatible with both Bun and Node.js. All scripts can be run with either `bun run` or `npm run`. However, for optimal performance, we recommend using Bun whenever possible.

## 🔧 Funcionalidades de despliegue

### ⚙️ Funcionamiento técnico del comando deploy

El comando `npm run deploy` utiliza el script `serve-app.js` que proporciona las siguientes funcionalidades:

1. **Verificación automática de construcción**:

   - Comprueba si existe la carpeta `dist/`
   - Si no existe, ejecuta automáticamente `npm run build`
   - Muestra en tiempo real el progreso de la construcción

2. **Servidor optimizado**:

   - Utiliza `serve` con la configuración correcta de MIME types
   - Configura rutas SPA para redirigir todas las rutas a index.html
   - Aplica la configuración definida en `serve.json`

3. **Experiencia de usuario mejorada**:

   - Muestra información clara y colorida en la consola
   - Abre automáticamente el navegador cuando el servidor está listo
   - Maneja señales de terminación para cerrar limpiamente el servidor

4. **Mensajes de error claros**:
   - Muestra errores de construcción en formato legible
   - Proporciona soluciones para problemas comunes

El archivo `serve.json` proporciona una configuración detallada para el servidor:

- Configuración de cabeceras HTTP para cada tipo de archivo
- Reglas de reescritura para SPA
- Configuración de compresión y URLs limpias

### 📊 Archivos clave del proyecto

| Archivo                 | Descripción                             | Estado                      |
| ----------------------- | --------------------------------------- | --------------------------- |
| `serve-app.js`          | Script principal para despliegue        | Activo                      |
| `serve.json`            | Configuración del servidor              | Activo                      |
| `simple-http-server.js` | Servidor HTTP alternativo               | Disponible como alternativa |
| `simple-server.js`      | Servidor Express alternativo            | Disponible como alternativa |
| `vercel.json`           | Configuración para despliegue en Vercel | Activo                      |
