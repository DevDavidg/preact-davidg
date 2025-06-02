import { motion } from "framer-motion";

const ColorShowcase = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg py-20">
      <div className="container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-4">
              Sistema de Colores Mejorado
            </h1>
            <p className="text-xl text-light-secondary dark:text-dark-secondary max-w-3xl mx-auto">
              Exploración completa del nuevo sistema de colores con paletas
              optimizadas para modo claro y oscuro
            </p>
          </motion.div>

          {/* Color Palette */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Paleta Principal
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Primary Colors */}
              <div className="space-y-2">
                <div className="h-20 bg-light-primary dark:bg-dark-primary rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Primary
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Secondary
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-tertiary dark:bg-dark-tertiary rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Tertiary
                </p>
              </div>

              {/* Accent Colors */}
              <div className="space-y-2">
                <div className="h-20 bg-light-accent dark:bg-dark-accent rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Accent
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-accent-secondary dark:bg-dark-accent-secondary rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Accent 2
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-accent-tertiary dark:bg-dark-accent-tertiary rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Accent 3
                </p>
              </div>
            </div>
          </motion.section>

          {/* Status Colors */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Colores de Estado
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-light-success dark:bg-dark-success rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Success
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-warning dark:bg-dark-warning rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Warning
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-error dark:bg-dark-error rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Error
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-20 bg-light-info dark:bg-dark-info rounded-lg shadow-md"></div>
                <p className="text-sm font-medium text-light-secondary dark:text-dark-secondary">
                  Info
                </p>
              </div>
            </div>
          </motion.section>

          {/* Buttons Showcase */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Componentes de Botones
            </h2>

            <div className="flex flex-wrap gap-4">
              <button className="btn-primary rounded-lg">Primary Button</button>
              <button className="btn-secondary rounded-lg">
                Secondary Button
              </button>
              <button className="btn-gradient rounded-lg">
                Gradient Button
              </button>
              <button className="btn-outline rounded-lg">Outline Button</button>
              <button className="btn-ghost rounded-lg">Ghost Button</button>
            </div>
          </motion.section>

          {/* Cards Showcase */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Tarjetas y Superficies
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary mb-2">
                  Glass Card
                </h3>
                <p className="text-light-secondary dark:text-dark-secondary">
                  Efecto de vidrio con backdrop blur y transparencias.
                </p>
              </div>

              <div className="card-elevated p-6">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary mb-2">
                  Elevated Card
                </h3>
                <p className="text-light-secondary dark:text-dark-secondary">
                  Tarjeta elevada con sombras y bordes definidos.
                </p>
              </div>

              <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary mb-2">
                  Surface Card
                </h3>
                <p className="text-light-secondary dark:text-dark-secondary">
                  Superficie con color de fondo secundario.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Badges Showcase */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Badges y Estados
            </h2>

            <div className="flex flex-wrap gap-4">
              <span className="badge">Default Badge</span>
              <span className="badge badge-success">Success Badge</span>
              <span className="badge badge-warning">Warning Badge</span>
              <span className="badge badge-error">Error Badge</span>
              <span className="badge badge-info">Info Badge</span>
            </div>
          </motion.section>

          {/* Text Elements */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Elementos de Texto
            </h2>

            <div className="space-y-4">
              <p className="text-gradient text-2xl font-bold">
                Texto con gradiente vibrante
              </p>
              <p className="text-gradient-subtle text-xl">
                Texto con gradiente sutil
              </p>
              <p className="text-light-primary dark:text-dark-primary text-lg">
                Texto principal estándar
              </p>
              <p className="text-light-secondary dark:text-dark-secondary">
                Texto secundario para contenido de apoyo
              </p>
              <p className="text-light-tertiary dark:text-dark-tertiary text-sm">
                Texto terciario para metadatos
              </p>
            </div>
          </motion.section>

          {/* Interactive Elements */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Elementos Interactivos
            </h2>

            <div className="space-y-4">
              <a
                href="#"
                className="link-hover text-light-accent dark:text-dark-accent"
              >
                Enlace con efecto hover
              </a>

              <div className="space-y-2">
                <span className="highlight-text">Texto destacado</span>
                <span className="ml-4 highlight-text bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent">
                  Texto destacado con acento
                </span>
              </div>
            </div>
          </motion.section>

          {/* 3D Effects Showcase */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Efectos 3D
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-3d p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary mb-2">
                  Glass 3D
                </h3>
                <p className="text-light-secondary dark:text-dark-secondary">
                  Efecto 3D con cristal y profundidad.
                </p>
              </div>

              <div className="shadow-3d p-6 bg-light-bg dark:bg-dark-bg rounded-lg">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary mb-2">
                  Shadow 3D
                </h3>
                <p className="text-light-secondary dark:text-dark-secondary">
                  Sombras tridimensionales avanzadas.
                </p>
              </div>

              <div className="hover-float p-6 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                <h3 className="text-lg font-semibold text-light-primary dark:text-dark-primary mb-2">
                  Hover Float
                </h3>
                <p className="text-light-secondary dark:text-dark-secondary">
                  Efecto de flotación al hacer hover.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Background Patterns */}
          <motion.section variants={itemVariants} className="space-y-8">
            <h2 className="text-3xl font-bold text-light-primary dark:text-dark-primary">
              Patrones de Fondo
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dots h-32 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-light-bg/80 dark:bg-dark-bg/80 flex items-center justify-center">
                  <span className="text-light-primary dark:text-dark-primary font-medium">
                    Patrón de Puntos
                  </span>
                </div>
              </div>

              <div className="bg-grid h-32 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-light-bg/80 dark:bg-dark-bg/80 flex items-center justify-center">
                  <span className="text-light-primary dark:text-dark-primary font-medium">
                    Patrón de Rejilla
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
};

export default ColorShowcase;
