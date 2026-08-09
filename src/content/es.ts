import type { Copy } from './types'

/**
 * Spanish is the source of truth: `en.ts` is typed against this shape, so a key
 * that exists here and nowhere else fails the build.
 *
 * Editorial rules that apply to every string below:
 * - Ninguna métrica sin evidencia pública. Los proyectos propios se etiquetan
 *   como concepto o experimento, nunca como trabajo entregado a un cliente.
 * - Ninguna cifra que caduque (edad, "+N años"): la trayectoria se cuenta con
 *   fechas fijas y con la lista real de equipos.
 * - Cada CTA promete exactamente lo que hace su destino.
 */
export const es: Copy = {
  locale: 'es',
  htmlLang: 'es',

  meta: {
    title: 'David Guillen — Senior Frontend & Mobile Engineer',
    description:
      'Senior Frontend & Mobile Engineer. Construyo interfaces de producto, apps y sistemas de diseño con React, React Native y Next.js — y este portfolio corre sobre una escena WebGL propia.',
    ogAlt: 'David Guillen — Senior Frontend & Mobile Engineer',
  },

  nav: {
    ariaLabel: 'Principal',
    skipToContent: 'Saltar al contenido',
    home: 'INICIO',
    work: 'PROYECTOS',
    experience: 'EXPERIENCIA',
    services: 'SERVICIOS',
    process: 'PROCESO',
    about: 'SOBRE MÍ',
    cta: 'HABLEMOS',
    menuOpen: 'Abrir menú',
    menuClose: 'Cerrar menú',
    soundOn: 'Activar sonido del reactor',
    soundOff: 'Silenciar el reactor',
    langGroup: 'Idioma',
    langNames: { es: 'Español', en: 'English' },
  },

  hud: {
    subtitle: 'REACTOR DE SEÑAL · SUBSISTEMAS EN LÍNEA',
    subtitleStatic: 'CUADRO FIJO · MOVIMIENTO REDUCIDO',
    build: 'CARGA',
    hint: 'STANDBY → CARGA → TRANSMISIÓN → IGNICIÓN',
    boot: 'PREFLIGHT DEL REACTOR',
    phases: {
      STANDBY: 'STANDBY',
      CHARGE: 'CARGA',
      TRANSMIT: 'TRANSMISIÓN',
      IGNITION: 'IGNICIÓN',
    },
  },

  hero: {
    eyebrow: 'DAVID GUILLEN — SENIOR FRONTEND & MOBILE',
    title: 'David Guillen',
    headline: 'Interfaces que aguantan producción.',
    lead: 'Senior Frontend & Mobile Engineer. Trabajo el producto completo: arquitectura de front, apps en React Native, sistemas de diseño y el 3D en tiempo real que estás viendo ahora mismo.',
    ctaClient: 'TENGO UN PROYECTO',
    ctaRecruiter: 'VER EXPERIENCIA',
    factExperience: 'FREELANCE DESDE 2018 · EQUIPOS DE PRODUCTO, BANCA Y SALUD',
    factStack: 'REACT · REACT NATIVE · NEXT · ANGULAR · NODE',
    factAvailability: 'BUENOS AIRES (GMT−3) · REMOTO',
    cue: 'SCROLL PARA ENTRAR',
  },

  work: {
    label: '01 — PROYECTOS',
    heading: 'Tres piezas que muestran cómo trabajo',
    intro:
      'Cada una responde a un problema distinto: sistemas de diseño, flujo de compra y render en tiempo real. Todas tienen demo pública y podés abrirlas ahora.',
    featuredLabel: 'Casos destacados',
    labLabel: 'Lab',
    labIntro:
      'Experimentos y conceptos donde pruebo una técnica puntual. Los muestro como lo que son: piezas propias, sin cliente detrás.',
    archiveLabel: 'Archivo',
    openCase: 'Leer el caso',
    openDemo: 'Abrir demo',
    caseOf: 'Caso de estudio',
  },

  experience: {
    label: '02 — EXPERIENCIA',
    heading: 'Dónde trabajé y qué me tocó sostener',
    intro:
      'Equipos de producto, banca, salud y agencia. Sin métricas de negocio que no pueda mostrar: lo verificable es el rol y el contexto.',
    currentLabel: 'Actualmente',
    previousLabel: 'Antes',
    cvCta: 'VER CV COMPLETO',
    roles: [
      {
        company: 'Grupo Mariva',
        role: 'Líder Técnico',
        context:
          'Finanzas. Decisiones de arquitectura de front, revisión de código y acompañamiento del equipo.',
        current: true,
      },
      {
        company: 'Bayer',
        role: 'Desarrollo sobre Salesforce',
        context: 'Salud. Interfaces y automatizaciones dentro de la plataforma.',
        current: true,
      },
      {
        company: 'Nonconformist',
        role: 'Frontend Engineer',
        context: 'Agencia de producto digital. Web y plataformas de cliente.',
        current: true,
      },
      {
        company: 'Santander España',
        role: 'Frontend Angular',
        context: 'Banca. Desarrollo sobre aplicaciones internas de gran escala.',
        current: false,
      },
      {
        company: 'GlobalLogic — cuenta Claro',
        role: 'Frontend Engineer',
        context: 'Telecomunicaciones. Producto de cara al cliente final.',
        current: false,
      },
      {
        company: 'Skyblue · VinciU · Orion2Pay',
        role: 'Desarrollo web y mobile',
        context: 'Primeros equipos: producto, pagos y apps.',
        current: false,
      },
    ],
  },

  services: {
    label: '03 — SERVICIOS',
    heading: 'Tres formas de trabajar juntos',
    intro:
      'Menos lista de tecnologías, más problema resuelto. El stack lo elijo después de entender qué hay que entregar.',
    problemLabel: 'Problema',
    deliverableLabel: 'Entregable',
    timelineLabel: 'Plazo típico',
    items: [
      {
        title: 'Producto web de punta a punta',
        problem:
          'Tenés una idea validada o un producto que ya vende, pero el front no acompaña: cuesta iterar y cada cambio rompe otra cosa.',
        deliverable:
          'Aplicación en producción con arquitectura de front documentada, componentes reutilizables, CI y handoff para que tu equipo siga solo.',
        timeline: '4 a 10 semanas',
      },
      {
        title: 'App mobile con React Native',
        problem:
          'Necesitás estar en iOS y Android sin mantener dos equipos ni dos roadmaps.',
        deliverable:
          'App publicada en ambas tiendas, con navegación, estado, autenticación y build reproducible.',
        timeline: '6 a 12 semanas',
      },
      {
        title: 'Sistema de diseño e interfaz avanzada',
        problem:
          'Cada pantalla se ve distinta, o querés una experiencia con motion y 3D sin destruir el rendimiento ni la accesibilidad.',
        deliverable:
          'Librería de componentes con tokens, temas, documentación y presupuestos de rendimiento y accesibilidad medidos.',
        timeline: '3 a 8 semanas',
      },
    ],
  },

  process: {
    label: '04 — PROCESO',
    heading: 'Cómo llega una pieza a producción',
    caption:
      'La misma pieza atraviesa las cuatro fases. Método ágil, revisiones frecuentes y decisiones escritas.',
    steps: [
      {
        num: '01',
        phase: 'FASE 01 — SCAN',
        title: 'Descubrimiento',
        heading: 'Qué problema, para quién y con qué medida de éxito',
        copy: 'Alcance, usuarios, restricciones técnicas y la métrica que define si salió bien. Sin esto, todo lo que viene después es decoración.',
      },
      {
        num: '02',
        phase: 'FASE 02 — PROTOTYPE',
        title: 'Prototipo',
        heading: 'La interacción difícil, probada primero',
        copy: 'Prototipo navegable de lo que puede fallar: el flujo crítico, no la pantalla más linda. Se valida antes de invertir el build completo.',
      },
      {
        num: '03',
        phase: 'FASE 03 — BUILD',
        title: 'Construcción',
        heading: 'Diseño y código avanzan en el mismo sprint',
        copy: 'Entregas parciales navegables, revisión de código y presupuestos de rendimiento y accesibilidad desde el primer commit.',
      },
      {
        num: '04',
        phase: 'FASE 04 — LIVE',
        title: 'Lanzamiento e iteración',
        heading: 'Sale, se mide y se afina con datos',
        copy: 'QA, Core Web Vitals, monitoreo y una lista corta de mejoras priorizadas por lo que realmente pasó en producción.',
      },
    ],
  },

  about: {
    label: '05 — SOBRE MÍ',
    heading: 'La persona detrás del reactor',
    portrait: 'RETRATO — DAVID GUILLEN',
    portraitAlt:
      'David Guillen, de frente, con cabello oscuro rizado y anteojos de marco fino',
    quote:
      '«Me interesa el punto donde la interfaz deja de ser una maqueta y tiene que aguantar usuarios reales.»',
    copy: 'Escribo software desde 2018: empecé freelance y seguí en equipos de producto, banca y salud. Me muevo cómodo entre la arquitectura de front y el detalle visual — y cuando hace falta bajo al backend o al render en GPU para que la idea exista de verdad.',
    spec: [
      { key: 'BASE', value: 'Buenos Aires, Argentina — remoto' },
      { key: 'FOCO', value: 'Frontend · Mobile · Sistemas de diseño' },
      { key: 'STACK', value: 'React · React Native · Next · Angular · Node' },
      { key: 'IDIOMAS', value: 'Español nativo · Inglés B2' },
    ],
  },

  contact: {
    label: '06 — CONTACTO',
    live: 'REACTOR EN LÍNEA — LISTO PARA RECIBIR SEÑAL',
    title: '¿Encendemos tu proyecto?',
    lead: 'Contame qué querés construir y en qué estado está hoy. Si hay algo para ver — repo, diseño, producto en vivo — mandalo y te respondo con una lectura concreta.',
    email: 'dev.davidg@gmail.com',
    emailCta: 'Escribime por mail',
    copyEmail: 'Copiar dirección',
    copiedEmail: 'Dirección copiada',
    responseTime: 'Respondo por mail o LinkedIn, normalmente dentro de 48 h hábiles.',
    social: [
      { label: 'GITHUB', href: 'https://github.com/DevDavidg', external: true },
      {
        label: 'LINKEDIN',
        href: 'https://www.linkedin.com/in/david-guillen-5074281b8',
        external: true,
      },
      { label: '+54 11 7003-0947', href: 'tel:+541170030947', external: false },
    ],
  },

  footer: {
    copyright: 'DAVID GUILLEN',
    signature: 'FRONTEND · MOBILE · HECHO A MANO',
    localeSwitchLabel: 'Ver este sitio en otro idioma',
  },

  caseStudy: {
    backToWork: 'Volver a proyectos',
    overview: 'Resumen',
    problem: 'Problema',
    role: 'Mi rol',
    scope: 'Equipo y alcance',
    stack: 'Stack',
    constraints: 'Restricciones',
    decisions: 'Decisiones clave',
    contribution: 'Qué construí',
    evidence: 'Qué podés verificar',
    outcome: 'Resultado',
    viewDemo: 'Abrir demo',
    viewRepo: 'Ver código',
    nextCase: 'Siguiente caso',
    noDemo: 'Sin demo pública',
  },

  cv: {
    label: 'CV',
    heading: 'David Guillen — Senior Frontend & Mobile Engineer',
    intro:
      'Versión imprimible de mi trayectoria. Los datos son los mismos que están en el resto del sitio.',
    print: 'Imprimir o guardar como PDF',
    sections: {
      profile: 'Perfil',
      experience: 'Experiencia',
      skills: 'Capacidades técnicas',
      projects: 'Proyectos propios',
      education: 'Formación',
      languages: 'Idiomas',
    },
    education: [
      {
        key: 'Formación técnica',
        value: 'Desarrollo web y mobile — trayecto autodidacta y cursos aplicados',
      },
      {
        key: 'Aprendizaje continuo',
        value: 'Arquitectura de front, accesibilidad, rendimiento y gráficos en tiempo real',
      },
    ],
    skills: [
      { key: 'Frontend', value: 'React, Next.js, Angular, Vue, TypeScript' },
      { key: 'Mobile', value: 'React Native, Android, publicación en tiendas' },
      { key: 'Backend', value: 'Node, Express, Firebase, REST' },
      { key: 'Datos', value: 'PostgreSQL, MySQL, MongoDB' },
      { key: 'Interfaz', value: 'Sistemas de diseño, accesibilidad WCAG, Core Web Vitals' },
      { key: 'Gráficos', value: 'Three.js, React Three Fiber, GLSL, GSAP' },
    ],
  },

  notFound: {
    title: 'Esta ruta no existe',
    lead: 'El reactor no encontró esa señal. Volvé al inicio y seguimos desde ahí.',
    cta: 'Ir al inicio',
  },

  localeGate: {
    title: 'David Guillen — Senior Frontend & Mobile Engineer',
    lead: 'Elegí un idioma para entrar.',
    choose: { es: 'Entrar en español', en: 'Enter in English' },
  },

  featured: [
    {
      slug: 'chroma-dev',
      title: 'Chroma Dev',
      kind: 'concept',
      kindLabel: 'Proyecto propio · demo pública',
      tags: ['DESIGN SYSTEM', 'REACT', 'THEMING'],
      summary:
        'Un editor donde un JSON de tokens define color y tipografía, y la interfaz se re-skinnea sin recargar ni volver a deployar.',
      outcome:
        'El tema queda definido como datos: se edita el JSON y la interfaz se re-skinnea en el momento, sin recompilar. Eso es lo que vuelve viable un mismo build con la marca de varios clientes.',
      problem:
        'Cuando un producto SaaS se vende con la marca de cada cliente, el camino fácil es duplicar el proyecto o mantener una rama por cuenta. Ese atajo multiplica el trabajo de cada cambio y hace que dos clientes nunca tengan la misma versión.',
      role: 'Diseño y desarrollo completo, en solitario.',
      scope: 'Proyecto propio, sin cliente detrás. Alcance acotado a demostrar el mecanismo.',
      stack: ['React', 'Next.js', 'TypeScript', 'shadcn/ui', 'CSS custom properties'],
      constraints: [
        'El tema tiene que cambiar en caliente, sin recarga y sin recompilar.',
        'Los tokens tienen que ser editables por alguien que no toca el código.',
        'El contraste no puede romperse al cambiar de paleta.',
      ],
      decisions: [
        {
          title: 'Tokens como datos, no como clases',
          body: 'El tema vive en un JSON que se mapea a custom properties de CSS. Los componentes leen variables, así que ninguno necesita saber qué tema está activo.',
        },
        {
          title: 'Un contrato tipado para el tema',
          body: 'La forma del JSON está tipada: un token que falta o cambia de nombre se ve al compilar, no cuando un cliente abre la app con la mitad de los colores en negro.',
        },
        {
          title: 'Editor y preview en la misma pantalla',
          body: 'La edición se valida al lado del resultado. Es la diferencia entre "confío en el JSON" y "veo el JSON aplicado".',
        },
      ],
      contribution: [
        'Esquema de tokens de color y tipografía, y su tipado.',
        'Puente entre el JSON y las custom properties aplicadas en runtime.',
        'Editor con validación y aplicación inmediata del tema.',
        'Set de componentes de muestra para ver el tema sobre UI real.',
      ],
      evidence: [
        'La demo es pública: editás el JSON y la interfaz cambia en el momento.',
        'La escala tipográfica y la paleta se ven en el mismo editor.',
      ],
      demoUrl: 'https://chroma-dev.vercel.app/',
      image: {
        src: '/work/chroma-dev.jpg',
        alt: 'Editor de Chroma Dev mostrando un archivo theme.json con tokens de color y escala tipográfica',
        width: 1600,
        height: 1000,
      },
      plate: 'MÓDULO 01 — CHROMA',
    },
    {
      slug: 'landing-davinci',
      title: 'Landing Da Vinci',
      kind: 'concept',
      kindLabel: 'Proyecto propio · demo pública',
      tags: ['DIRECCIÓN DE ARTE', 'LANDING', 'TIPOGRAFÍA'],
      summary:
        'Landing editorial para una colección de arte: un titular enorme sobre una imagen a sangre, con atmósfera de sala de museo.',
      outcome:
        'La pieza sostiene una imagen que ocupa toda la pantalla sin que el texto pierda legibilidad ni jerarquía — y lo hace con composición, no tapando la foto con una capa opaca.',
      problem:
        'Cuando la imagen es la protagonista, el texto suele terminar peleando contra ella: se le pone una sombra, un degradado negro encima, o se lo empuja a una franja lateral. El ejercicio era mantener las dos cosas enteras en la misma pantalla.',
      role: 'Dirección de arte, diseño y desarrollo completo.',
      scope: 'Proyecto propio, sin cliente. Una vista, trabajada a fondo.',
      stack: ['Next.js', 'React', 'CSS'],
      constraints: [
        'La imagen ocupa toda la pantalla y el texto tiene que seguir legible encima.',
        'La jerarquía tiene que leerse antes que la decoración.',
        'Nada de capas opacas sobre la obra: es lo que la landing viene a mostrar.',
      ],
      decisions: [
        {
          title: 'Escala tipográfica extrema, una sola voz',
          body: 'Un titular muy grande y todo lo demás muy contenido. El contraste de tamaño hace el trabajo que en otras landings hacen cinco colores y tres pesos.',
        },
        {
          title: 'El contraste se resuelve en la composición',
          body: 'El texto se apoya en la zona oscura de la imagen en lugar de oscurecerla. Cuesta más encuadrar y no cuesta nada en legibilidad.',
        },
        {
          title: 'Los CTA rompen la penumbra, el resto no',
          body: 'Un único bloque claro en la esquina inferior izquierda concentra la acción. Todo lo demás queda en el rango tonal de la obra.',
        },
      ],
      contribution: [
        'Composición y sistema tipográfico de la vista.',
        'Tratamiento de imagen, encuadre y jerarquía de contenido.',
        'Desarrollo de la landing y su comportamiento responsive.',
      ],
      evidence: [
        'La demo es pública y se puede ver en cualquier tamaño de pantalla.',
        'El titular se lee sobre la obra sin ninguna capa oscura de por medio.',
      ],
      demoUrl: 'https://landing-davinci.vercel.app/',
      image: {
        src: '/work/landing-davinci.jpg',
        alt: 'Landing Da Vinci: el titular «Galaxia al óleo» sobre una galaxia pintada al óleo con un pincel',
        width: 1600,
        height: 1000,
      },
      plate: 'MÓDULO 02 — DAVINCI',
    },
    {
      slug: 'signal-reactor',
      title: 'Signal Reactor',
      kind: 'product',
      kindLabel: 'Este sitio · lo estás usando',
      tags: ['WEBGL', 'THREE.JS', 'RENDIMIENTO', 'ACCESIBILIDAD'],
      summary:
        'El portfolio que estás leyendo: una escena WebGL propia que reconstruye la sala mientras scrolleás, montada sobre HTML estático que funciona sin JavaScript.',
      outcome:
        'La experiencia 3D es una mejora opcional, no un requisito: si no hay WebGL, si el equipo es lento o si pedís movimiento reducido, el contenido completo sigue ahí y no se descarga ni un byte de Three.js.',
      problem:
        'Los portfolios inmersivos suelen elegir entre espectáculo y utilidad: o el 3D deja el contenido fuera del HTML y de los buscadores, o el sitio es un documento plano. Quería las dos cosas al mismo tiempo.',
      role: 'Dirección, diseño, shaders y desarrollo completo.',
      scope: 'Proyecto propio, en producción y en evolución continua.',
      stack: [
        'React 19',
        'React Router (prerender estático)',
        'Three.js',
        'React Three Fiber',
        'GLSL',
        'GSAP',
        'Tailwind CSS',
      ],
      constraints: [
        'El HTML servido tiene que contener todo el contenido antes de ejecutar JavaScript.',
        'Sin WebGL, con movimiento reducido o con ahorro de datos: cero descarga de la escena.',
        'Los proyectos tienen que abrirse con mouse, touch y teclado en cualquier nivel de calidad.',
        'Presupuesto de frame estable: si el equipo no llega, el sitio baja la calidad solo.',
      ],
      decisions: [
        {
          title: 'Contenido primero, escena después',
          body: 'Cada ruta se prerenderiza a HTML estático con su propio idioma y metadatos. La escena se importa recién cuando el navegador demostró que puede sostenerla.',
        },
        {
          title: 'Un gate de capacidades antes del import',
          body: 'Se comprueba WebGL2, movimiento reducido y ahorro de datos antes de pedir el chunk 3D. El tier estático nunca paga el costo de una escena que no va a ver.',
        },
        {
          title: 'Degradación por tiempo de frame real',
          body: 'No alcanza con mirar el ancho de pantalla. Se mide el frame time y, si se sostiene alto, cae el postproceso, después la resolución y por último el tier entero.',
        },
        {
          title: 'El 3D nunca es la única capa accionable',
          body: 'La tipografía y los proyectos existen como DOM real. La escena los acompaña; si falla, se apaga y el documento queda intacto.',
        },
      ],
      contribution: [
        'Escena persistente con cámara sobre spline, reconstrucción por profundidad y tipografía en el espacio.',
        'Shaders propios de ensamblado, retrato en voxels y conducciones de señal.',
        'Sistema de tiers con degradación adaptativa y recuperación de pérdida de contexto WebGL.',
        'Prerender estático bilingüe con metadatos, hreflang, schema y sitemap.',
        'Presupuestos automatizados de bundle y pruebas de accesibilidad en CI.',
      ],
      evidence: [
        'Desactivá JavaScript y el contenido sigue completo en el HTML.',
        'Activá "reducir movimiento" en el sistema: la escena no se descarga.',
        'El código es público en GitHub.',
      ],
      repoUrl: 'https://github.com/DevDavidg',
      image: {
        src: '/work/signal-reactor.jpg',
        alt: 'Escena WebGL del portfolio Signal Reactor: sala oscura con paneles de proyecto reconstruyéndose',
        width: 1600,
        height: 1000,
      },
      plate: 'MÓDULO 03 — REACTOR',
    },
  ],

  lab: [
    {
      slug: 'fueradecontexto',
      title: 'Fueradecontexto',
      kind: 'concept',
      kindLabel: 'Concepto · demo degradada',
      tags: ['ECOMMERCE', 'REACT', 'ESTADOS DE CARGA'],
      summary:
        'Tienda online con catálogo, carrito y checkout. Hoy el deploy levanta el shell pero no llega a traer los productos: la demo se queda en los skeletons.',
      outcome:
        'Lo que sigue siendo demostrable es el diseño de estados de carga: la página no se rompe ni se queda en blanco cuando los datos no llegan, muestra la estructura que va a ocupar el contenido.',
      problem:
        'Practicar el recorrido de compra completo, incluidos los estados intermedios que casi nunca se diseñan: carga, vacío, error y agotado.',
      role: 'Diseño de interfaz y desarrollo frontend.',
      scope:
        'Proyecto propio, sin pagos reales. El backend de datos del deploy dejó de responder, así que la demo no representa el estado terminado.',
      stack: ['React', 'TypeScript', 'CSS Modules'],
      constraints: [
        'La página tiene que seguir siendo legible cuando los datos tardan o no llegan.',
        'La grilla tiene que funcionar de 320 px a desktop sin scroll horizontal.',
      ],
      decisions: [
        {
          title: 'Skeletons con la forma real del contenido',
          body: 'Los placeholders reproducen la altura y la disposición de las tarjetas, así que la página no salta cuando los datos entran. Es también la razón por la que la demo caída se ve incompleta pero no rota.',
        },
      ],
      contribution: [
        'Layout de catálogo y ficha de producto.',
        'Estados de carga, vacío y error de la tienda.',
      ],
      evidence: [
        'La demo es pública y muestra el shell con sus estados de carga; los productos ya no cargan.',
        'Lo dejo así, y dicho, en lugar de mostrar una captura que prometa una tienda funcionando.',
      ],
      demoUrl: 'https://fueradecontexto.vercel.app/',
      image: {
        src: '/work/fueradecontexto.jpg',
        alt: 'Tienda Fueradecontexto mostrando su cabecera y los bloques de carga del catálogo',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — FUERA',
    },
    {
      slug: 'sphere-app',
      title: 'Sphere App',
      kind: 'experiment',
      kindLabel: 'Experimento · demo pública',
      tags: ['WEBGL', 'THREE.JS', 'MATERIALES'],
      summary:
        'Escena WebGL con esferas dentro de un volumen: un banco de pruebas de materiales, luz y densidad de objetos.',
      outcome:
        'Fue el paso previo al render en tiempo real de este portfolio: acá probé instanciado, materiales y costo de fill-rate antes de llevarlo a producción.',
      problem:
        'Antes de apoyar un sitio entero en WebGL necesitaba entender dónde se cae el rendimiento cuando crecen los objetos y los materiales reflectantes.',
      role: 'Desarrollo completo.',
      scope: 'Experimento propio. Una escena, sin interfaz alrededor.',
      stack: ['Three.js', 'JavaScript', 'WebGL'],
      constraints: [
        'Muchos objetos con material reflectante sin perder fluidez.',
        'La escena tiene que arrancar sin assets pesados.',
      ],
      decisions: [
        {
          title: 'Geometría compartida entre instancias',
          body: 'Una sola geometría reutilizada para todas las esferas: el costo se va al fill-rate, no al número de draw calls.',
        },
      ],
      contribution: ['Escena, materiales y control de cámara.'],
      evidence: ['La demo es pública y corre directamente en el navegador.'],
      demoUrl: 'https://sphere-app.vercel.app/',
      image: {
        src: '/work/sphere-app.jpg',
        alt: 'Escena WebGL con esferas de colores dentro de una esfera mayor translúcida sobre fondo estrellado',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — SPHERE',
    },
    {
      slug: 'launch-flow',
      title: 'Launch Flow',
      kind: 'concept',
      kindLabel: 'Concepto · datos de ejemplo',
      tags: ['LANDING', 'SAAS', 'GLASSMORPHISM'],
      summary:
        'Landing de lanzamiento para un producto SaaS ficticio, con hero, características y captación de beta.',
      outcome:
        'Ejercicio de estructura de landing de conversión: qué se dice primero, qué se prueba y dónde va el formulario.',
      problem:
        'Practicar el orden de una landing de producto: propuesta, prueba, objeción y acción, sin que la estética tape el mensaje.',
      role: 'Diseño y desarrollo completo.',
      scope:
        'Concepto propio. El producto, la marca y los números que aparecen en pantalla son de ejemplo, no resultados reales.',
      stack: ['React', 'CSS', 'Diseño responsive'],
      constraints: [
        'El efecto de vidrio no puede comerse el contraste del texto.',
        'La estructura tiene que leerse igual en móvil.',
      ],
      decisions: [
        {
          title: 'Los números son claramente de muestra',
          body: 'Las cifras del hero forman parte de una maqueta de producto inventado; no representan tracción real y así se declara en este caso.',
        },
      ],
      contribution: ['Estructura, composición y desarrollo de la vista.'],
      evidence: ['La demo es pública. Los datos que muestra son ficticios.'],
      demoUrl: 'https://launch-flow.vercel.app/',
      image: {
        src: '/work/launch-flow.jpg',
        alt: 'Landing BetaLaunch con titular sobre convertir una idea en startup y métricas de ejemplo',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — LAUNCH',
    },
  ],

  archive: [
    {
      slug: 'david-g-dev',
      title: 'Portfolio anterior',
      kind: 'archive',
      kindLabel: 'Archivo · versión anterior',
      tags: ['PORTFOLIO', 'ARCHIVO'],
      summary:
        'La versión previa de este portfolio, cuando mi presentación todavía era la de diseñador de interfaz.',
      outcome:
        'Lo dejo accesible como referencia de dónde venía la identidad del sitio actual, no como muestra de trabajo vigente.',
      problem: 'Registro histórico del proyecto anterior.',
      role: 'Diseño y desarrollo completo.',
      scope: 'Proyecto propio, discontinuado.',
      stack: ['React', 'CSS'],
      constraints: [],
      decisions: [],
      contribution: ['Diseño y desarrollo de la versión anterior del sitio.'],
      evidence: ['Sigue publicado y se puede comparar con la versión actual.'],
      demoUrl: 'https://david-g-dev.vercel.app/',
      image: {
        src: '/work/devdavidgapp.jpg',
        alt: 'Portfolio anterior de David Guillen: hero en blanco y negro con navegación mínima',
        width: 1600,
        height: 1000,
      },
      plate: 'ARCHIVO — DAVIDG',
    },
  ],
}
