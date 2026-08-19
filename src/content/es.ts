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
    title: 'David Guillen — Full Stack Senior en Buenos Aires',
    description:
      'Full Stack Senior en Buenos Aires. Diseño interfaces, apps y design systems con React, React Native y Next.js. Portfolio con escena WebGL propia.',
    ogAlt: 'David Guillen — Full Stack Senior en Buenos Aires',
    cvTitle: 'CV de David Guillen — Full Stack Senior',
    cvDescription:
      'CV de David Guillen, Full Stack Senior en Nonconformist (Buenos Aires). React, React Native, Next.js, sistemas de diseño y WebGL.',
    gateTitle: 'David Guillen — Full Stack Senior · ES / EN',
    gateDescription:
      'Portfolio de David Guillen, Full Stack Senior en Buenos Aires. Elegí idioma: español o English.',
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
    operator: 'OPERADOR · DG-01',
    moduleLock: 'MÓDULO {n} ASENTADO',
    sectorLabel: 'SECTOR 02 · INESTABLE',
    uplinkReady: 'UPLINK LISTO',
    uplinkHold: 'MANTENÉ PARA CERRAR EL CIRCUITO',
    uplinkDone: 'UPLINK ESTABLECIDO',
    bootLines: [
      'WEBGL2',
      'FIDELIDAD',
      'SPLINE',
      'AUDIO',
      'REACTOR',
    ],
    finaleLabel: 'Colapso del reactor',
    finaleBody:
      'Final del recorrido. Si seguís scrolleando, el portal se traga la sala entera; si frenás, se queda donde está, y si scrolleás para arriba vuelve a salir.',
    finaleClose: 'DAVID GUILLEN · dev.davidg@gmail.com',
    finaleReturn: 'SCROLLEÁ PARA ARRIBA PARA VOLVER',
  },

  hero: {
    eyebrow: 'DAVID GUILLEN — FULL STACK SENIOR',
    title: 'David Guillen',
    headline: 'Interfaces que aguantan producción.',
    lead: 'Full Stack Senior en Nonconformist. Trabajo el producto completo: arquitectura de front, apps en React Native, sistemas de diseño y el 3D en tiempo real que estás viendo ahora mismo.',
    ctaClient: 'TENGO UN PROYECTO',
    ctaRecruiter: 'VER EXPERIENCIA',
    factExperience: 'NONCONFORMIST DESDE 2024 · BANCA, SALUD, TELCO Y PRODUCTO',
    factStack: 'REACT · REACT NATIVE · NEXT · ANGULAR · NODE',
    factAvailability: 'BUENOS AIRES (GMT−3) · REMOTO',
    cue: 'SCROLL PARA ENTRAR',
  },

  work: {
    label: '01 — PROYECTOS',
    heading: 'Dos sitios en producción que construí',
    intro:
      'Trabajo entregado a cliente, con URL pública: el sitio de un ALyC del mercado de capitales y la web de la consultora donde trabajo.',
    featuredLabel: 'Casos destacados',
    labLabel: 'Lab',
    labIntro:
      'Experimentos, conceptos académicos y piezas propias. Los muestro como lo que son: sin cliente detrás, o con datos de ejemplo.',
    archiveLabel: 'Archivo',
    openCase: 'Leer el caso',
    openDemo: 'Abrir sitio',
    caseOf: 'Caso de estudio',
  },

  experience: {
    label: '02 — EXPERIENCIA',
    heading: 'Dónde trabajé y qué me tocó sostener',
    intro:
      'Consultora, producto y freelance. Fechas fijas del CV; sin métricas de negocio que no pueda mostrar. Lo verificable es el rol y el contexto.',
    currentLabel: 'Actualmente',
    previousLabel: 'Antes',
    cvCta: 'VER CV COMPLETO',
    roles: [
      {
        company: 'Nonconformist',
        role: 'Fullstack Senior',
        period: 'Oct 2024 — Actualidad',
        context:
          'Consultora IT. A3Mercados (sitio en desarrollo), design system de Banco Mariva (React MFE), módulo de flujos Santander (Angular/BPMN), mantenimiento Salesforce en Bayer y MVP mobile DGALUM (React Native/Expo).',
        current: true,
      },
      {
        company: 'Motoya',
        role: 'Desarrollador Full Stack',
        period: 'Ago 2025 — Ene 2026',
        context: 'Producto propio en paralelo a Nonconformist: front y backend de punta a punta.',
        current: false,
      },
      {
        company: 'EMD — Empleos Marketing Digital',
        role: 'Desarrollador Front End',
        period: 'Ene 2024 — Jul 2024',
        context: 'Interfaces de producto para el vertical de empleos y marketing digital.',
        current: false,
      },
      {
        company: 'GlobalLogic — cuenta Claro',
        role: 'Desarrollador React',
        period: 'Jul 2022 — Nov 2024',
        context:
          'Módulos internos de facturación Claro AR/UY/PY. React, TypeScript y Styled Components.',
        current: false,
      },
      {
        company: 'Skyblue Analytics',
        role: 'Programador Vue / Quasar',
        period: 'Abr 2023 — Sep 2023',
        context: 'Interfaces de analytics sobre Vue y Quasar.',
        current: false,
      },
      {
        company: 'Gohaus',
        role: 'Diseñador UX/UI',
        period: 'Abr 2023 — May 2023',
        context: 'Diseño de experiencias de usuario para producto digital.',
        current: false,
      },
      {
        company: 'VinciU',
        role: 'Desarrollador Angular',
        period: 'Jun 2022 — Abr 2023',
        context: 'Campus virtual IT: Angular, Firebase, TypeScript y Bootstrap.',
        current: false,
      },
      {
        company: 'Orion2Pay',
        role: 'Programador Front End / Diseñador UX/UI',
        period: 'Sep 2021 — Feb 2022',
        context: 'Interfaces y diseño de experiencia para producto de pagos.',
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
    copy: 'Full Stack Senior en Nonconformist. Antes pasé por GlobalLogic (Claro), VinciU, Skyblue y varios productos freelance. Me muevo cómodo entre la arquitectura de front y el detalle visual — y cuando hace falta bajo al backend o al render en GPU para que la idea exista de verdad.',
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
    viewDemo: 'Abrir sitio',
    viewRepo: 'Ver código',
    nextCase: 'Siguiente caso',
    noDemo: 'Sin demo pública',
  },

  cv: {
    label: 'CV',
    heading: 'David Guillen — Full Stack Senior',
    intro:
      'Versión imprimible de mi trayectoria. Los datos son los mismos que están en el resto del sitio.',
    print: 'Imprimir o guardar como PDF',
    sections: {
      profile: 'Perfil',
      experience: 'Experiencia',
      skills: 'Capacidades técnicas',
      projects: 'Proyectos',
      education: 'Formación',
      languages: 'Idiomas',
    },
    education: [
      {
        key: 'Da Vinci',
        value: 'Certificación Profesional en Gestión de Medios Digitales (2025)',
      },
      {
        key: 'UNAJ',
        value: 'Ingeniería Informática (2021 — 2023)',
      },
      {
        key: 'Cursos',
        value:
          'SoyHenry, CoderHouse, Platzi, Udemy, SoloLearn, Google Creative Campus, Microsoft',
      },
    ],
    skills: [
      { key: 'Frontend', value: 'React, Next.js, Angular, Vue, TypeScript' },
      { key: 'Mobile', value: 'React Native, Expo, publicación en tiendas' },
      { key: 'Backend', value: 'Node, Express, Firebase, Strapi, REST' },
      { key: 'Datos', value: 'PostgreSQL, MySQL, MongoDB, Salesforce/SOQL' },
      { key: 'Interfaz', value: 'Sistemas de diseño, MFE, accesibilidad, Core Web Vitals' },
      { key: 'Gráficos', value: 'Three.js, React Three Fiber, GLSL, GSAP' },
    ],
    languages: [
      { key: 'Español', value: 'Nativo' },
      { key: 'English', value: 'B2' },
    ],
  },

  notFound: {
    title: 'Esta ruta no existe',
    lead: 'El reactor no encontró esa señal. Volvé al inicio y seguimos desde ahí.',
    cta: 'Ir al inicio',
  },

  localeGate: {
    title: 'David Guillen — Full Stack Senior',
    lead: 'Elegí un idioma para entrar.',
    choose: { es: 'Entrar en español', en: 'Enter in English' },
  },

  featured: [
    {
      slug: 'ag-valores',
      title: 'AG Valores',
      kind: 'product',
      kindLabel: 'Cliente · sitio en producción',
      tags: ['NEXT.JS', 'FINANZAS', 'COTIZACIONES'],
      summary:
        'Sitio de AG Valores (ALyC): cotizaciones, servicios de inversión y captación de asesores para el mercado de capitales argentino.',
      outcome:
        'La web pública opera en agvalores.com.ar con navegación de productos, tablas de cotización y canales de contacto.',
      problem:
        'Una ALyC necesita mostrar instrumentos, normativa y vías de apertura de cuenta con claridad regulatoria y sin fricción en móvil.',
      role: 'Desarrollo frontend del sitio en el contexto de Nonconformist / producto cliente.',
      scope: 'Cliente. Sitio público con datos de mercado y formularios de contacto.',
      stack: ['Next.js', 'React', 'TypeScript'],
      constraints: [
        'Copy y datos sujetos a marco CNV: nada de promesas de rendimiento inventadas en UI.',
        'Tablas de cotización legibles en desktop y usables en móvil.',
        'CTA de asesoría y WhatsApp siempre a un toque.',
      ],
      decisions: [
        {
          title: 'Jerarquía clara: asesorar antes que saturar',
          body: 'El hero vende acompañamiento personalizado; las cotizaciones viven como herramienta, no como ruido del primer viewport.',
        },
        {
          title: 'Canales de contacto redundantes',
          body: 'Formulario, teléfono y WhatsApp conviven porque el visitante de una ALyC no siempre completa un form a la primera.',
        },
      ],
      contribution: [
        'Implementación del sitio público y sus secciones de producto.',
        'UI de cotizaciones y CTAs de apertura de cuenta / asesor.',
        'Ajustes responsive y de accesibilidad básica del recorrido.',
      ],
      evidence: [
        'El sitio está en producción: https://agvalores.com.ar/',
        'AG Valores S.A. figura como ALyC registrada ante CNV en el propio pie del sitio.',
      ],
      demoUrl: 'https://agvalores.com.ar/',
      image: {
        src: '/work/ag-valores.jpg',
        alt: 'Sitio de AG Valores: hero de asesoramiento de alto valor y navegación de cotizaciones',
        width: 1600,
        height: 1000,
      },
      plate: 'MÓDULO 01 — AG VALORES',
    },
    {
      slug: 'nonconformist',
      title: 'Nonconformist',
      kind: 'product',
      kindLabel: 'Cliente · sitio en producción',
      tags: ['AGENCIA', 'NEXT.JS', 'MARCA'],
      summary:
        'Sitio corporativo de Nonconformist Digital: la cara pública de la consultora donde trabajo como Fullstack Senior.',
      outcome:
        'La marca de la agencia quedó publicada en nonconformist.digital con la narrativa y el portfolio de la casa.',
      problem:
        'Una consultora IT necesita una web que transmita criterio de producto, no solo un listado de tecnologías.',
      role: 'Desarrollo del sitio de la agencia en Nonconformist.',
      scope: 'Trabajo interno de la consultora. Sitio marketing en producción.',
      stack: ['Next.js', 'React', 'TypeScript'],
      constraints: [
        'Tiene que representar la marca frente a clientes enterprise y startups.',
        'Performance y SEO importan: es la puerta de entrada comercial.',
        'Mantenible por el equipo después del primer ship.',
      ],
      decisions: [
        {
          title: 'Marca primero, stack después',
          body: 'La web vende capacidad de producto; el detalle técnico queda al servicio del mensaje, no al revés.',
        },
        {
          title: 'Misma barra de calidad que los clientes',
          body: 'Si la agencia pide Core Web Vitals a terceros, su propia web no puede ser la excepción.',
        },
      ],
      contribution: [
        'Desarrollo del sitio público de la agencia.',
        'Integración de contenidos y recorrido de captación.',
        'Ajustes de performance y responsive para el lanzamiento.',
      ],
      evidence: [
        'El sitio está en producción: https://nonconformist.digital/',
        'El rol Fullstack Senior en Nonconformist consta en el CV (oct 2024 — actualidad).',
      ],
      demoUrl: 'https://nonconformist.digital/',
      image: {
        src: '/work/nonconformist.jpg',
        alt: 'Sitio de Nonconformist Digital, consultora IT',
        width: 1600,
        height: 1000,
      },
      plate: 'MÓDULO 02 — NXC',
    },
  ],

  lab: [
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
      plate: 'LAB — REACTOR',
    },
    {
      slug: 'proyecto-bam',
      title: 'Proyecto BAM',
      kind: 'experiment',
      kindLabel: 'Experimento · código público',
      tags: ['WEBGL', 'THREE.JS', 'ECS'],
      summary:
        'Juego de estrategia y base-building isométrico que corre en el navegador: grilla de construcción, economía de recursos por ticks y combate, sin motor comercial.',
      outcome:
        'La simulación quedó separada del render: el core es TypeScript puro, el estado vive en Zustand, las entidades se sincronizan por ECS y Three.js solo dibuja lo que ese estado dice.',
      problem:
        'Un base-builder tiene cientos de entidades cambiando en cada tick. Si la simulación vive dentro de los componentes que dibujan, cada tick vuelve a recorrer el árbol de React y el frame se cae.',
      role: 'Diseño técnico y desarrollo completo.',
      scope: 'Proyecto propio. Código público con licencia MIT.',
      stack: [
        'React 19',
        'TypeScript',
        'Three.js',
        'React Three Fiber',
        'bitECS',
        'Zustand',
        'Vite',
      ],
      constraints: [
        'Local-first: el progreso se guarda en el navegador, sin servidor detrás.',
        'Los edificios se generan por geometría procedural, no con sprites.',
        'La simulación por ticks no puede depender del ciclo de render.',
      ],
      decisions: [
        {
          title: 'El core no sabe que existe Three.js',
          body: 'Grilla, reglas de emplazamiento, catálogos y balance son TypeScript puro. La capa de render lee ese estado y nunca lo escribe, así las reglas se pueden probar sin montar una escena.',
        },
        {
          title: 'ECS entre el estado y la escena',
          body: 'Las entidades se sincronizan por componentes en lugar de por props: un tick que mueve cien unidades no vuelve a renderizar cien componentes.',
        },
      ],
      contribution: [
        'Motor de grilla, reglas de emplazamiento y economía de recursos por ticks.',
        'Capa ECS de sincronización entre simulación y escena.',
        'Visuales 3D procedurales por familia de edificio, con estados de daño y escala por nivel.',
        'Cámara isométrica, raycast de hover y colocación, y persistencia local del progreso.',
      ],
      evidence: [
        'El repositorio es público y la arquitectura por capas está documentada en el README.',
        'La licencia es MIT y el historial de commits se puede leer entero.',
      ],
      repoUrl: 'https://github.com/DevDavidg/proyectobam',
      image: {
        src: '/work/proyecto-bam.jpg',
        alt: 'Proyecto BAM: vista isométrica en 3D de una aldea con el ayuntamiento en el centro, HUD de recursos a la izquierda y panel de aldea a la derecha',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — BAM',
    },
    {
      slug: 'muscly',
      title: 'Muscly',
      kind: 'experiment',
      kindLabel: 'Experimento · demo pública',
      tags: ['NEXT.JS', 'WEB AUDIO', 'SUPABASE'],
      summary:
        'Reproductor de una biblioteca de beats que analiza el audio mientras suena: medidores de sub, bass, medios y agudos alimentados por la pista real.',
      outcome:
        'La visualización sale del propio audio en tiempo real, no de una animación en loop: los medidores se mueven con lo que está sonando y se quedan quietos cuando no suena nada.',
      problem:
        'Una lista de tracks en un reproductor genérico no dice nada del material. Quería que la interfaz mostrara la forma del sonido mientras se escucha.',
      role: 'Desarrollo completo.',
      scope: 'Proyecto propio con catálogo real de pistas. Demo pública.',
      stack: ['Next.js', 'React', 'TypeScript', 'Meyda', 'Supabase', 'Tailwind CSS'],
      constraints: [
        'El análisis de audio corre en el navegador y no puede comerse el frame de la interfaz.',
        'Las pistas son WAV: la carga tiene que ser por demanda, no toda de entrada.',
      ],
      decisions: [
        {
          title: 'Análisis en vivo, no animación pregrabada',
          body: 'Los medidores se alimentan de las features que Meyda extrae del nodo de audio, así lo que se ve es la pista y no un bucle decorativo encima.',
        },
        {
          title: 'El catálogo vive fuera del bundle',
          body: 'Las pistas y sus metadatos se sirven desde Supabase, así sumar material no implica volver a construir la aplicación.',
        },
      ],
      contribution: [
        'Reproductor con cola, selección de pista y estados de carga.',
        'Cadena de análisis de audio y medidores por banda de frecuencia.',
        'Interfaz de biblioteca con los controles de drive, warmth, brightness y motion.',
      ],
      evidence: [
        'La demo es pública: los medidores se mueven con la pista que suena.',
        'El repositorio es público.',
      ],
      demoUrl: 'https://muscly-lake.vercel.app/',
      repoUrl: 'https://github.com/DevDavidg/muscly',
      image: {
        src: '/work/muscly.jpg',
        alt: 'Muscly: reproductor de beats en pantalla oscura, con medidores de sub, bass, medios y agudos a la izquierda y el listado de pistas a la derecha',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — MUSCLY',
    },
    {
      slug: 'launch-flow',
      title: 'Launch Flow',
      kind: 'concept',
      kindLabel: 'Concepto académico · datos de ejemplo',
      tags: ['LANDING', 'SAAS', 'MAQUETADO'],
      summary:
        'Landing BetaLaunch para el TP de Maquetado y Desarrollo Web (Da Vinci): hero, características y captación de beta con datos ficticios.',
      outcome:
        'Ejercicio de estructura de landing de conversión entregado como trabajo práctico — no es un producto real ni tracción verdadera.',
      problem:
        'Practicar el orden de una landing de producto: propuesta, prueba, objeción y acción, sin que la estética tape el mensaje.',
      role: 'Diseño y desarrollo completo.',
      scope:
        'Trabajo práctico académico (Escuela Da Vinci, 1er cuatrimestre 2025). Marca y métricas de pantalla son de ejemplo.',
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
      evidence: [
        'La demo es pública en https://launch-flow.vercel.app/',
        'El pie del sitio declara el TP, el profesor y el estudiante.',
      ],
      demoUrl: 'https://launch-flow.vercel.app/',
      image: {
        src: '/work/launch-flow.jpg',
        alt: 'Landing BetaLaunch con titular sobre convertir una idea en startup y métricas de ejemplo',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — LAUNCH',
    },
    {
      slug: 'chroma-dev',
      title: 'Chroma Dev',
      kind: 'concept',
      kindLabel: 'Proyecto propio · demo pública',
      tags: ['DESIGN SYSTEM', 'REACT', 'THEMING'],
      summary:
        'Un editor donde un JSON de tokens define color y tipografía, y la interfaz se re-skinnea sin recargar ni volver a deployar.',
      outcome:
        'El tema queda definido como datos: se edita el JSON y la interfaz se re-skinnea en el momento, sin recompilar.',
      problem:
        'Cuando un producto SaaS se vende con la marca de cada cliente, el camino fácil es duplicar el proyecto o mantener una rama por cuenta.',
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
          body: 'La forma del JSON está tipada: un token que falta o cambia de nombre se ve al compilar.',
        },
      ],
      contribution: [
        'Esquema de tokens y tipado.',
        'Puente JSON → custom properties en runtime.',
        'Editor con preview inmediato.',
      ],
      evidence: [
        'La demo es pública: editás el JSON y la interfaz cambia en el momento.',
      ],
      demoUrl: 'https://chroma-dev.vercel.app/',
      image: {
        src: '/work/chroma-dev.jpg',
        alt: 'Editor de Chroma Dev mostrando un archivo theme.json con tokens de color y escala tipográfica',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — CHROMA',
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
        'La pieza sostiene una imagen a pantalla completa sin tapar la obra con capas opacas.',
      problem:
        'Cuando la imagen es la protagonista, el texto suele pelear contra ella con sombras o degradados negros.',
      role: 'Dirección de arte, diseño y desarrollo completo.',
      scope: 'Proyecto propio, sin cliente. Una vista, trabajada a fondo.',
      stack: ['Next.js', 'React', 'CSS'],
      constraints: [
        'La imagen ocupa toda la pantalla y el texto tiene que seguir legible encima.',
        'Nada de capas opacas sobre la obra.',
      ],
      decisions: [
        {
          title: 'Escala tipográfica extrema, una sola voz',
          body: 'Un titular muy grande y todo lo demás muy contenido.',
        },
        {
          title: 'El contraste se resuelve en la composición',
          body: 'El texto se apoya en la zona oscura de la imagen en lugar de oscurecerla.',
        },
      ],
      contribution: [
        'Composición y sistema tipográfico.',
        'Desarrollo responsive de la landing.',
      ],
      evidence: [
        'La demo es pública y se puede ver en cualquier tamaño de pantalla.',
      ],
      demoUrl: 'https://landing-davinci.vercel.app/',
      image: {
        src: '/work/landing-davinci.jpg',
        alt: 'Landing Da Vinci: el titular «Galaxia al óleo» sobre una galaxia pintada al óleo con un pincel',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — DAVINCI',
    },
    {
      slug: 'fueradecontexto',
      title: 'Fueradecontexto',
      kind: 'concept',
      kindLabel: 'Concepto · demo degradada',
      tags: ['ECOMMERCE', 'REACT', 'ESTADOS DE CARGA'],
      summary:
        'Tienda online con catálogo, carrito y checkout. Hoy el deploy levanta el shell pero no llega a traer los productos: la demo se queda en los skeletons.',
      outcome:
        'Lo demostrable es el diseño de estados de carga: la página no se rompe cuando los datos no llegan.',
      problem:
        'Practicar el recorrido de compra completo, incluidos carga, vacío, error y agotado.',
      role: 'Diseño de interfaz y desarrollo frontend.',
      scope:
        'Proyecto propio, sin pagos reales. El backend del deploy dejó de responder.',
      stack: ['React', 'TypeScript', 'CSS Modules'],
      constraints: [
        'La página tiene que seguir siendo legible cuando los datos tardan o no llegan.',
      ],
      decisions: [
        {
          title: 'Skeletons con la forma real del contenido',
          body: 'Los placeholders reproducen la altura de las tarjetas para que la página no salte.',
        },
      ],
      contribution: [
        'Layout de catálogo y ficha de producto.',
        'Estados de carga, vacío y error.',
      ],
      evidence: [
        'La demo es pública y muestra el shell con sus estados de carga; los productos ya no cargan.',
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
        'Escena WebGL con esferas dentro de un volumen: banco de pruebas de materiales, luz y densidad.',
      outcome:
        'Paso previo al render en tiempo real de este portfolio: instancing, materiales y fill-rate.',
      problem:
        'Entender dónde se cae el rendimiento cuando crecen objetos y materiales reflectantes.',
      role: 'Desarrollo completo.',
      scope: 'Experimento propio. Una escena, sin interfaz alrededor.',
      stack: ['Three.js', 'JavaScript', 'WebGL'],
      constraints: [
        'Muchos objetos con material reflectante sin perder fluidez.',
      ],
      decisions: [
        {
          title: 'Geometría compartida entre instancias',
          body: 'Una sola geometría reutilizada: el costo se va al fill-rate, no a los draw calls.',
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
