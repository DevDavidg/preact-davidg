import type { Copy } from './types'

/** English mirrors `es.ts`. Written as English, not translated word for word. */
export const en: Copy = {
  locale: 'en',
  htmlLang: 'en',

  meta: {
    title: 'David Guillen — Full Stack Senior in Buenos Aires',
    description:
      'Full Stack Senior in Buenos Aires. I build product interfaces, apps and design systems with React, React Native and Next.js. Custom WebGL portfolio.',
    ogAlt: 'David Guillen — Full Stack Senior in Buenos Aires',
    cvTitle: 'David Guillen CV — Full Stack Senior',
    cvDescription:
      'CV of David Guillen, Full Stack Senior at Nonconformist in Buenos Aires. React, React Native, Next.js, design systems and WebGL.',
    gateTitle: 'David Guillen — Full Stack Senior · ES / EN',
    gateDescription:
      'Portfolio of David Guillen, Full Stack Senior in Buenos Aires. Choose a language: Spanish or English.',
  },

  nav: {
    ariaLabel: 'Primary',
    skipToContent: 'Skip to content',
    home: 'HOME',
    work: 'WORK',
    experience: 'EXPERIENCE',
    services: 'SERVICES',
    process: 'PROCESS',
    about: 'ABOUT',
    cta: "LET'S TALK",
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    soundOn: 'Turn on reactor sound',
    soundOff: 'Mute the reactor',
    langGroup: 'Language',
    langNames: { es: 'Español', en: 'English' },
  },

  hud: {
    subtitle: 'SIGNAL REACTOR · SUBSYSTEMS ONLINE',
    subtitleStatic: 'STILL FRAME · REDUCED MOTION',
    build: 'CHARGE',
    hint: 'STANDBY → CHARGE → TRANSMIT → IGNITION',
    boot: 'REACTOR PREFLIGHT',
    phases: {
      STANDBY: 'STANDBY',
      CHARGE: 'CHARGE',
      TRANSMIT: 'TRANSMIT',
      IGNITION: 'IGNITION',
    },
    operator: 'OPERATOR · DG-01',
    moduleLock: 'MODULE {n} LOCKED',
    sectorLabel: 'SECTOR 02 · UNSTABLE',
    uplinkReady: 'UPLINK READY',
    uplinkHold: 'HOLD TO CLOSE THE CIRCUIT',
    uplinkDone: 'UPLINK ESTABLISHED',
    bootLines: [
      'WEBGL2',
      'FIDELITY',
      'SPLINE',
      'AUDIO',
      'REACTOR',
    ],
    finaleLabel: 'Reactor collapse',
    finaleBody:
      'End of the run. Keep scrolling and the portal takes the whole room in; stop and it holds where it is; scroll back up and it comes out again.',
    finaleClose: 'DAVID GUILLEN · dev.davidg@gmail.com',
    finaleReturn: 'SCROLL UP TO COME BACK',
  },

  hero: {
    eyebrow: 'DAVID GUILLEN — FULL STACK SENIOR',
    title: 'David Guillen',
    headline: 'Interfaces built to survive production.',
    lead: 'Full Stack Senior at Nonconformist. I work the whole product: frontend architecture, React Native apps, design systems and the real-time 3D you are looking at right now.',
    ctaClient: 'I HAVE A PROJECT',
    ctaRecruiter: 'SEE EXPERIENCE',
    factExperience: 'NONCONFORMIST SINCE 2024 · BANKING, HEALTHCARE, TELCO & PRODUCT',
    factStack: 'REACT · REACT NATIVE · NEXT · ANGULAR · NODE',
    factAvailability: 'BUENOS AIRES (GMT−3) · REMOTE',
    cue: 'SCROLL TO ENTER',
  },

  work: {
    label: '01 — WORK',
    heading: 'Two production sites I shipped',
    intro:
      'Client work with a public URL: the site of a capital-markets broker, and the consultancy I work at.',
    featuredLabel: 'Featured cases',
    labLabel: 'Lab',
    labIntro:
      'Experiments, academic concepts and personal pieces. Shown as exactly that: no client behind them, or with sample data.',
    archiveLabel: 'Archive',
    openCase: 'Read the case',
    openDemo: 'Open site',
    caseOf: 'Case study',
  },

  experience: {
    label: '02 — EXPERIENCE',
    heading: 'Where I have worked and what I owned',
    intro:
      'Consultancy, product and freelance. Fixed dates from the CV; no business metrics I cannot show. What is verifiable is the role and the context.',
    currentLabel: 'Currently',
    previousLabel: 'Previously',
    cvCta: 'VIEW FULL CV',
    roles: [
      {
        company: 'Nonconformist',
        role: 'Fullstack Senior',
        period: 'Oct 2024 — Present',
        context:
          'IT consultancy. A3Mercados (site in development), Banco Mariva design system (React MFE), Santander workflow module (Angular/BPMN), Bayer Salesforce maintenance and DGALUM mobile MVP (React Native/Expo).',
        current: true,
      },
      {
        company: 'Motoya',
        role: 'Full Stack Developer',
        period: 'Aug 2025 — Jan 2026',
        context: 'Own product in parallel with Nonconformist: end-to-end front and backend.',
        current: false,
      },
      {
        company: 'EMD — Empleos Marketing Digital',
        role: 'Front End Developer',
        period: 'Jan 2024 — Jul 2024',
        context: 'Product interfaces for the jobs and digital marketing vertical.',
        current: false,
      },
      {
        company: 'GlobalLogic — Claro account',
        role: 'React Developer',
        period: 'Jul 2022 — Nov 2024',
        context:
          'Internal billing modules for Claro AR/UY/PY. React, TypeScript and Styled Components.',
        current: false,
      },
      {
        company: 'Skyblue Analytics',
        role: 'Vue / Quasar Developer',
        period: 'Apr 2023 — Sep 2023',
        context: 'Analytics interfaces on Vue and Quasar.',
        current: false,
      },
      {
        company: 'Gohaus',
        role: 'UX/UI Designer',
        period: 'Apr 2023 — May 2023',
        context: 'User experience design for digital product.',
        current: false,
      },
      {
        company: 'VinciU',
        role: 'Angular Developer',
        period: 'Jun 2022 — Apr 2023',
        context: 'IT virtual campus: Angular, Firebase, TypeScript and Bootstrap.',
        current: false,
      },
      {
        company: 'Orion2Pay',
        role: 'Front End Developer / UX/UI Designer',
        period: 'Sep 2021 — Feb 2022',
        context: 'Interfaces and experience design for a payments product.',
        current: false,
      },
    ],
  },

  services: {
    label: '03 — SERVICES',
    heading: 'Three ways we can work together',
    intro:
      'Less technology list, more problem solved. I pick the stack after understanding what has to ship.',
    problemLabel: 'Problem',
    deliverableLabel: 'Deliverable',
    timelineLabel: 'Typical timeline',
    items: [
      {
        title: 'End-to-end web product',
        problem:
          'You have a validated idea, or a product that already sells, but the frontend cannot keep up: iterating is slow and every change breaks something else.',
        deliverable:
          'A shipped application with documented frontend architecture, reusable components, CI and a handoff so your team can carry it forward.',
        timeline: '4 to 10 weeks',
      },
      {
        title: 'React Native mobile app',
        problem:
          'You need to be on iOS and Android without running two teams and two roadmaps.',
        deliverable:
          'App published on both stores, with navigation, state, authentication and a reproducible build.',
        timeline: '6 to 12 weeks',
      },
      {
        title: 'Design system and advanced interface',
        problem:
          'Every screen looks different, or you want motion and 3D without wrecking performance and accessibility.',
        deliverable:
          'Component library with tokens, theming, documentation and measured performance and accessibility budgets.',
        timeline: '3 to 8 weeks',
      },
    ],
  },

  process: {
    label: '04 — PROCESS',
    heading: 'How a piece reaches production',
    caption:
      'The same piece moves through all four phases. Agile delivery, frequent review and decisions written down.',
    steps: [
      {
        num: '01',
        phase: 'PHASE 01 — SCAN',
        title: 'Discovery',
        heading: 'Which problem, for whom, measured how',
        copy: 'Scope, users, technical constraints and the metric that defines success. Without this, everything after it is decoration.',
      },
      {
        num: '02',
        phase: 'PHASE 02 — PROTOTYPE',
        title: 'Prototype',
        heading: 'The hard interaction, proven first',
        copy: 'A navigable prototype of whatever can fail: the critical flow, not the prettiest screen. Validated before the full build is funded.',
      },
      {
        num: '03',
        phase: 'PHASE 03 — BUILD',
        title: 'Build',
        heading: 'Design and code move in the same sprint',
        copy: 'Navigable partial releases, code review, and performance and accessibility budgets from the first commit.',
      },
      {
        num: '04',
        phase: 'PHASE 04 — LIVE',
        title: 'Launch and iterate',
        heading: 'Ship it, measure it, tune it with data',
        copy: 'QA, Core Web Vitals, monitoring and a short list of improvements ranked by what actually happened in production.',
      },
    ],
  },

  about: {
    label: '05 — ABOUT',
    heading: 'The person behind the reactor',
    portrait: 'PORTRAIT — DAVID GUILLEN',
    portraitAlt:
      'David Guillen facing the camera, dark curly hair and thin-framed glasses',
    quote:
      '“What interests me is the point where an interface stops being a mockup and has to hold real users.”',
    copy: 'Full Stack Senior at Nonconformist. Before that I worked at GlobalLogic (Claro), VinciU, Skyblue and several freelance products. I am comfortable moving between frontend architecture and visual detail — and when it is needed I go down to the backend or to GPU rendering so the idea actually exists.',
    spec: [
      { key: 'BASE', value: 'Buenos Aires, Argentina — remote' },
      { key: 'FOCUS', value: 'Frontend · Mobile · Design systems' },
      { key: 'STACK', value: 'React · React Native · Next · Angular · Node' },
      { key: 'LANGUAGES', value: 'Native Spanish · English B2' },
    ],
  },

  contact: {
    label: '06 — CONTACT',
    live: 'REACTOR ONLINE — READY TO RECEIVE SIGNAL',
    title: 'Shall we power up your project?',
    lead: 'Tell me what you want to build and where it stands today. If there is something to look at — repo, design, live product — send it and I will come back with a concrete read.',
    email: 'dev.davidg@gmail.com',
    emailCta: 'Email me',
    copyEmail: 'Copy address',
    copiedEmail: 'Address copied',
    responseTime: 'I reply by email or LinkedIn, usually within 48 business hours.',
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
    signature: 'FRONTEND · MOBILE · HANDMADE',
    localeSwitchLabel: 'View this site in another language',
  },

  caseStudy: {
    backToWork: 'Back to work',
    overview: 'Overview',
    problem: 'Problem',
    role: 'My role',
    scope: 'Team and scope',
    stack: 'Stack',
    constraints: 'Constraints',
    decisions: 'Key decisions',
    contribution: 'What I built',
    evidence: 'What you can verify',
    outcome: 'Outcome',
    viewDemo: 'Open site',
    viewRepo: 'View code',
    nextCase: 'Next case',
    noDemo: 'No public demo',
  },

  cv: {
    label: 'CV',
    heading: 'David Guillen — Full Stack Senior',
    intro:
      'A printable version of my background. Same data as the rest of the site.',
    print: 'Print or save as PDF',
    sections: {
      profile: 'Profile',
      experience: 'Experience',
      skills: 'Technical skills',
      projects: 'Projects',
      education: 'Education',
      languages: 'Languages',
    },
    education: [
      {
        key: 'Da Vinci',
        value: 'Professional Certificate in Digital Media Management (2025)',
      },
      {
        key: 'UNAJ',
        value: 'Computer Engineering (2021 — 2023)',
      },
      {
        key: 'Courses',
        value:
          'SoyHenry, CoderHouse, Platzi, Udemy, SoloLearn, Google Creative Campus, Microsoft',
      },
    ],
    skills: [
      { key: 'Frontend', value: 'React, Next.js, Angular, Vue, TypeScript' },
      { key: 'Mobile', value: 'React Native, Expo, store releases' },
      { key: 'Backend', value: 'Node, Express, Firebase, Strapi, REST' },
      { key: 'Data', value: 'PostgreSQL, MySQL, MongoDB, Salesforce/SOQL' },
      { key: 'Interface', value: 'Design systems, MFE, accessibility, Core Web Vitals' },
      { key: 'Graphics', value: 'Three.js, React Three Fiber, GLSL, GSAP' },
    ],
    languages: [
      { key: 'Spanish', value: 'Native' },
      { key: 'English', value: 'B2' },
    ],
  },

  notFound: {
    title: 'This route does not exist',
    lead: 'The reactor could not find that signal. Head back home and we will pick it up from there.',
    cta: 'Go home',
  },

  localeGate: {
    title: 'David Guillen — Full Stack Senior',
    lead: 'Choose a language to enter.',
    choose: { es: 'Entrar en español', en: 'Enter in English' },
  },

  featured: [
    {
      slug: 'ag-valores',
      title: 'AG Valores',
      kind: 'product',
      kindLabel: 'Client · live site',
      tags: ['NEXT.JS', 'FINANCE', 'QUOTES'],
      summary:
        'AG Valores (ALyC) site: market quotes, investment services and advisor capture for the Argentine capital market.',
      outcome:
        'The public site runs at agvalores.com.ar with product navigation, quote tables and contact channels.',
      problem:
        'An ALyC needs to show instruments, regulation and account-opening paths with regulatory clarity and no mobile friction.',
      role: 'Frontend development of the site in the Nonconformist / client product context.',
      scope: 'Client. Public site with market data and contact forms.',
      stack: ['Next.js', 'React', 'TypeScript'],
      constraints: [
        'Copy and data under the CNV framework: no invented return promises in the UI.',
        'Quote tables readable on desktop and usable on mobile.',
        'Advisor and WhatsApp CTAs always one tap away.',
      ],
      decisions: [
        {
          title: 'Advise first, do not saturate',
          body: 'The hero sells personalised support; quotes live as a tool, not as noise in the first viewport.',
        },
        {
          title: 'Redundant contact channels',
          body: 'Form, phone and WhatsApp coexist because an ALyC visitor does not always finish a form on the first try.',
        },
      ],
      contribution: [
        'Implementation of the public site and product sections.',
        'Quotes UI and account-opening / advisor CTAs.',
        'Responsive and basic accessibility pass on the main path.',
      ],
      evidence: [
        'The site is live at https://agvalores.com.ar/',
        'AG Valores S.A. is listed as a CNV-registered ALyC in the site footer.',
      ],
      demoUrl: 'https://agvalores.com.ar/',
      image: {
        src: '/work/ag-valores.jpg',
        alt: 'AG Valores site: high-value advisory hero and quotes navigation',
        width: 1600,
        height: 1000,
      },
      plate: 'MODULE 01 — AG VALORES',
    },
    {
      slug: 'nonconformist',
      title: 'Nonconformist',
      kind: 'product',
      kindLabel: 'Client · live site',
      tags: ['AGENCY', 'NEXT.JS', 'BRAND'],
      summary:
        'Corporate site for Nonconformist Digital: the public face of the consultancy where I work as Fullstack Senior.',
      outcome:
        'The agency brand shipped at nonconformist.digital with the house narrative and portfolio.',
      problem:
        'An IT consultancy needs a site that signals product judgment, not just a technology list.',
      role: 'Development of the agency site at Nonconformist.',
      scope: 'Internal consultancy work. Marketing site in production.',
      stack: ['Next.js', 'React', 'TypeScript'],
      constraints: [
        'Must represent the brand to enterprise clients and startups.',
        'Performance and SEO matter: it is the commercial front door.',
        'Maintainable by the team after the first ship.',
      ],
      decisions: [
        {
          title: 'Brand first, stack second',
          body: 'The site sells product capability; technical detail serves the message, not the other way around.',
        },
        {
          title: 'Same quality bar as clients',
          body: 'If the agency asks third parties for Core Web Vitals, its own site cannot be the exception.',
        },
      ],
      contribution: [
        'Development of the agency public site.',
        'Content integration and lead capture path.',
        'Performance and responsive polish for launch.',
      ],
      evidence: [
        'The site is live at https://nonconformist.digital/',
        'Fullstack Senior at Nonconformist is listed on the CV (Oct 2024 — present).',
      ],
      demoUrl: 'https://nonconformist.digital/',
      image: {
        src: '/work/nonconformist.jpg',
        alt: 'Nonconformist Digital consultancy site',
        width: 1600,
        height: 1000,
      },
      plate: 'MODULE 02 — NXC',
    },
  ],

  lab: [
    {
      slug: 'signal-reactor',
      title: 'Signal Reactor',
      kind: 'product',
      kindLabel: 'This site · you are using it',
      tags: ['WEBGL', 'THREE.JS', 'PERFORMANCE', 'ACCESSIBILITY'],
      summary:
        'The portfolio you are reading: a WebGL scene that rebuilds the room as you scroll, mounted on static HTML that works without JavaScript.',
      outcome:
        'The 3D experience is an optional upgrade, not a requirement: with no WebGL, on a slow machine, or with reduced motion requested, the full content is still there and not a byte of Three.js is downloaded.',
      problem:
        'Immersive portfolios usually pick between spectacle and usefulness: either the 3D keeps content out of the HTML and out of search, or the site is a flat document. I wanted both at once.',
      role: 'Direction, design, shaders and full development.',
      scope: 'Personal project, in production and still evolving.',
      stack: [
        'React 19',
        'React Router (static prerender)',
        'Three.js',
        'React Three Fiber',
        'GLSL',
        'GSAP',
        'Tailwind CSS',
      ],
      constraints: [
        'The served HTML has to contain all the content before JavaScript runs.',
        'No WebGL, reduced motion or data saver: zero scene download.',
        'Projects have to open with mouse, touch and keyboard at every quality level.',
        'Stable frame budget: if the machine cannot keep up, the site lowers quality by itself.',
      ],
      decisions: [
        {
          title: 'Content first, scene second',
          body: 'Every route is prerendered to static HTML with its own language and metadata. The scene is imported only once the browser has proven it can carry it.',
        },
        {
          title: 'A capability gate before the import',
          body: 'WebGL2, reduced motion and data saver are checked before the 3D chunk is requested. The static tier never pays for a scene it will not see.',
        },
        {
          title: 'Degradation driven by real frame time',
          body: 'Screen width is not enough. Frame time is measured, and if it stays high the post-processing goes, then the resolution, then the whole tier.',
        },
        {
          title: 'The 3D is never the only actionable layer',
          body: 'Typography and projects exist as real DOM. The scene accompanies them; if it fails it switches off and the document is untouched.',
        },
      ],
      contribution: [
        'Persistent scene with a spline-driven camera, depth-based reconstruction and typography in space.',
        'Custom shaders for assembly, the voxel portrait and the signal conduits.',
        'A tier system with adaptive degradation and WebGL context-loss recovery.',
        'Bilingual static prerender with metadata, hreflang, schema and sitemap.',
        'Automated bundle budgets and accessibility tests in CI.',
      ],
      evidence: [
        'Turn JavaScript off and the content is still complete in the HTML.',
        'Enable “reduce motion” in your system: the scene is never downloaded.',
        'The code is public on GitHub.',
      ],
      repoUrl: 'https://github.com/DevDavidg',
      image: {
        src: '/work/signal-reactor.jpg',
        alt: 'WebGL scene from the Signal Reactor portfolio: a dark room with project panels reassembling',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — REACTOR',
    },
    {
      slug: 'proyecto-bam',
      title: 'Proyecto BAM',
      kind: 'experiment',
      kindLabel: 'Experiment · public code',
      tags: ['WEBGL', 'THREE.JS', 'ECS'],
      summary:
        'An isometric base-building strategy game that runs in the browser: a build grid, tick-based resource economy and combat, with no commercial engine under it.',
      outcome:
        'Simulation ended up separated from rendering: the core is plain TypeScript, state lives in Zustand, entities sync through an ECS, and Three.js only draws what that state says.',
      problem:
        'A base builder has hundreds of entities changing every tick. If the simulation lives inside the components that draw, every tick walks the React tree again and the frame budget goes.',
      role: 'Technical design and full development.',
      scope: 'Personal project. Public code under the MIT licence.',
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
        'Local-first: progress is saved in the browser, with no server behind it.',
        'Buildings are generated as procedural geometry rather than sprites.',
        'The tick simulation cannot depend on the render loop.',
      ],
      decisions: [
        {
          title: 'The core does not know Three.js exists',
          body: 'Grid, placement rules, catalogues and balance are plain TypeScript. The render layer reads that state and never writes it, so the rules can be tested without mounting a scene.',
        },
        {
          title: 'An ECS between state and scene',
          body: 'Entities sync through components instead of props: a tick that moves a hundred units does not re-render a hundred components.',
        },
      ],
      contribution: [
        'Grid engine, placement rules and tick-based resource economy.',
        'ECS layer syncing simulation to scene.',
        'Procedural 3D visuals per building family, with damage states and per-tier scaling.',
        'Isometric camera, hover/placement raycasting and local persistence of progress.',
      ],
      evidence: [
        'The repository is public and the layered architecture is documented in the README.',
        'The licence is MIT and the whole commit history is readable.',
      ],
      repoUrl: 'https://github.com/DevDavidg/proyectobam',
      image: {
        src: '/work/proyecto-bam.jpg',
        alt: 'Proyecto BAM: an isometric 3D view of a village with the town hall at its centre, a resource HUD on the left and a village panel on the right',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — BAM',
    },
    {
      slug: 'muscly',
      title: 'Muscly',
      kind: 'experiment',
      kindLabel: 'Experiment · public demo',
      tags: ['NEXT.JS', 'WEB AUDIO', 'SUPABASE'],
      summary:
        'A beat-library player that analyses the audio as it plays: sub, bass, mid and high meters driven by the actual track.',
      outcome:
        'The visualisation comes out of the audio in real time rather than from a looping animation: the meters move with whatever is playing and sit still when nothing is.',
      problem:
        'A track list in a generic player says nothing about the material. I wanted the interface to show the shape of the sound while you listen to it.',
      role: 'Full development.',
      scope: 'Personal project with a real track catalogue. Public demo.',
      stack: ['Next.js', 'React', 'TypeScript', 'Meyda', 'Supabase', 'Tailwind CSS'],
      constraints: [
        'Audio analysis runs in the browser and cannot eat the interface frame budget.',
        'The tracks are WAV files, so loading has to be on demand rather than all at once.',
      ],
      decisions: [
        {
          title: 'Live analysis, not a prerecorded animation',
          body: 'The meters are fed by the features Meyda extracts from the audio node, so what you see is the track and not a decorative loop on top of it.',
        },
        {
          title: 'The catalogue lives outside the bundle',
          body: 'Tracks and their metadata are served from Supabase, so adding material does not mean rebuilding the application.',
        },
      ],
      contribution: [
        'Player with a queue, track selection and loading states.',
        'Audio analysis chain and per-frequency-band meters.',
        'Library interface with the drive, warmth, brightness and motion controls.',
      ],
      evidence: [
        'The demo is public: the meters move with the track that is playing.',
        'The repository is public.',
      ],
      demoUrl: 'https://muscly-lake.vercel.app/',
      repoUrl: 'https://github.com/DevDavidg/muscly',
      image: {
        src: '/work/muscly.jpg',
        alt: 'Muscly: a beat player on a dark screen, with sub, bass, mid and high meters on the left and the track listing on the right',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — MUSCLY',
    },
    {
      slug: 'launch-flow',
      title: 'Launch Flow',
      kind: 'concept',
      kindLabel: 'Academic concept · sample data',
      tags: ['LANDING', 'SAAS', 'LAYOUT'],
      summary:
        'BetaLaunch landing for the Web Layout & Development coursework (Da Vinci): hero, features and beta capture with fictional data.',
      outcome:
        'A conversion-landing structure exercise delivered as coursework — not a real product or real traction.',
      problem:
        'Practising the order of a product landing: proposition, proof, objection and action, without the aesthetic burying the message.',
      role: 'Design and development.',
      scope:
        'Academic coursework (Escuela Da Vinci, 1st term 2025). Brand and on-screen metrics are samples.',
      stack: ['React', 'CSS', 'Responsive design'],
      constraints: [
        'The glass effect cannot eat the text contrast.',
        'The structure has to read the same on mobile.',
      ],
      decisions: [
        {
          title: 'The numbers are clearly samples',
          body: 'The hero figures belong to a mockup of an invented product; they do not represent real traction, and this case says so.',
        },
      ],
      contribution: ['Structure, composition and development of the view.'],
      evidence: [
        'The demo is public at https://launch-flow.vercel.app/',
        'The site footer declares the coursework, teacher and student.',
      ],
      demoUrl: 'https://launch-flow.vercel.app/',
      image: {
        src: '/work/launch-flow.jpg',
        alt: 'BetaLaunch landing with a headline about turning an idea into a startup and sample metrics',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — LAUNCH',
    },
    {
      slug: 'chroma-dev',
      title: 'Chroma Dev',
      kind: 'concept',
      kindLabel: 'Personal project · public demo',
      tags: ['DESIGN SYSTEM', 'REACT', 'THEMING'],
      summary:
        'An editor where a JSON of tokens defines colour and typography, and the interface re-skins itself with no reload and no redeploy.',
      outcome:
        'The theme becomes data: edit the JSON and the interface re-skins immediately, with no recompile.',
      problem:
        'When a SaaS product is sold under each client’s brand, the easy path is duplicating the project or keeping a branch per account.',
      role: 'Design and development, solo.',
      scope: 'Personal project, no client. Scope limited to proving the mechanism.',
      stack: ['React', 'Next.js', 'TypeScript', 'shadcn/ui', 'CSS custom properties'],
      constraints: [
        'The theme has to change live, without reload and without recompiling.',
        'Tokens have to be editable by someone who does not touch the code.',
        'Contrast cannot break when the palette changes.',
      ],
      decisions: [
        {
          title: 'Tokens as data, not as classes',
          body: 'The theme lives in a JSON that maps onto CSS custom properties. Components read variables, so none of them needs to know which theme is active.',
        },
        {
          title: 'A typed contract for the theme',
          body: 'The JSON shape is typed: a missing or renamed token shows up at compile time.',
        },
      ],
      contribution: [
        'Token schema and typings.',
        'JSON → custom-properties bridge at runtime.',
        'Editor with immediate preview.',
      ],
      evidence: [
        'The demo is public: edit the JSON and the interface changes immediately.',
      ],
      demoUrl: 'https://chroma-dev.vercel.app/',
      image: {
        src: '/work/chroma-dev.jpg',
        alt: 'Chroma Dev editor showing a theme.json file with colour tokens and a type scale',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — CHROMA',
    },
    {
      slug: 'landing-davinci',
      title: 'Landing Da Vinci',
      kind: 'concept',
      kindLabel: 'Personal project · public demo',
      tags: ['ART DIRECTION', 'LANDING', 'TYPOGRAPHY'],
      summary:
        'Editorial landing for an art collection: an enormous headline over a full-bleed image, with the atmosphere of a museum room.',
      outcome:
        'The piece carries a full-screen image without covering the artwork with opaque layers.',
      problem:
        'When the image is the protagonist, text usually fights it with shadows or black gradients.',
      role: 'Art direction, design and full development.',
      scope: 'Personal project, no client. One view, worked through properly.',
      stack: ['Next.js', 'React', 'CSS'],
      constraints: [
        'The image fills the screen and the text has to stay readable on top of it.',
        'No opaque layers over the artwork.',
      ],
      decisions: [
        {
          title: 'Extreme type scale, a single voice',
          body: 'One very large headline and everything else very restrained.',
        },
        {
          title: 'Contrast solved in the composition',
          body: 'The text sits in the dark region of the image rather than darkening it.',
        },
      ],
      contribution: [
        'Composition and type system.',
        'Responsive development of the landing.',
      ],
      evidence: [
        'The demo is public and can be viewed at any screen size.',
      ],
      demoUrl: 'https://landing-davinci.vercel.app/',
      image: {
        src: '/work/landing-davinci.jpg',
        alt: 'Landing Da Vinci: the headline “Galaxia al óleo” over an oil-painted galaxy with a brush',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — DAVINCI',
    },
    {
      slug: 'fueradecontexto',
      title: 'Fueradecontexto',
      kind: 'concept',
      kindLabel: 'Concept · degraded demo',
      tags: ['ECOMMERCE', 'REACT', 'LOADING STATES'],
      summary:
        'An online store with catalogue, cart and checkout. The deployment still boots the shell but no longer fetches its products, so the demo stops at the skeletons.',
      outcome:
        'What remains demonstrable is the loading-state design: the page does not break when data never arrives.',
      problem:
        'Practising the full purchase journey, including loading, empty, error and sold out.',
      role: 'Interface design and frontend development.',
      scope:
        'Personal project, no real payments. The deployment’s data backend stopped responding.',
      stack: ['React', 'TypeScript', 'CSS Modules'],
      constraints: [
        'The page has to stay readable when data is slow or never arrives.',
      ],
      decisions: [
        {
          title: 'Skeletons shaped like the real content',
          body: 'Placeholders reproduce card height so the page does not jump.',
        },
      ],
      contribution: [
        'Catalogue and product page layout.',
        'Loading, empty and error states.',
      ],
      evidence: [
        'The demo is public and shows the shell with its loading states; the products no longer load.',
      ],
      demoUrl: 'https://fueradecontexto.vercel.app/',
      image: {
        src: '/work/fueradecontexto.jpg',
        alt: 'Fueradecontexto store showing its header and the catalogue loading blocks',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — FUERA',
    },
    {
      slug: 'sphere-app',
      title: 'Sphere App',
      kind: 'experiment',
      kindLabel: 'Experiment · public demo',
      tags: ['WEBGL', 'THREE.JS', 'MATERIALS'],
      summary:
        'A WebGL scene with spheres inside a volume: a test bench for materials, light and density.',
      outcome:
        'The step before real-time rendering in this portfolio: instancing, materials and fill-rate.',
      problem:
        'Understanding where performance falls apart as objects and reflective materials grow.',
      role: 'Full development.',
      scope: 'Personal experiment. One scene, no interface around it.',
      stack: ['Three.js', 'JavaScript', 'WebGL'],
      constraints: [
        'Many objects with reflective material without losing smoothness.',
      ],
      decisions: [
        {
          title: 'Geometry shared across instances',
          body: 'A single geometry reused: cost lands on fill-rate, not draw calls.',
        },
      ],
      contribution: ['Scene, materials and camera control.'],
      evidence: ['The demo is public and runs straight in the browser.'],
      demoUrl: 'https://sphere-app.vercel.app/',
      image: {
        src: '/work/sphere-app.jpg',
        alt: 'WebGL scene with coloured spheres inside a larger translucent sphere on a starfield',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — SPHERE',
    },
  ],

  archive: [
    {
      slug: 'david-g-dev',
      title: 'Previous portfolio',
      kind: 'archive',
      kindLabel: 'Archive · earlier version',
      tags: ['PORTFOLIO', 'ARCHIVE'],
      summary:
        'The previous version of this portfolio, from when I still introduced myself as an interface designer.',
      outcome:
        'Kept reachable as a reference for where the current site’s identity came from, not as current work.',
      problem: 'Historical record of the earlier project.',
      role: 'Design and development.',
      scope: 'Personal project, discontinued.',
      stack: ['React', 'CSS'],
      constraints: [],
      decisions: [],
      contribution: ['Design and development of the earlier version of the site.'],
      evidence: ['Still published, so it can be compared with the current version.'],
      demoUrl: 'https://david-g-dev.vercel.app/',
      image: {
        src: '/work/devdavidgapp.jpg',
        alt: 'David Guillen’s previous portfolio: black-and-white hero with minimal navigation',
        width: 1600,
        height: 1000,
      },
      plate: 'ARCHIVE — DAVIDG',
    },
  ],
}
