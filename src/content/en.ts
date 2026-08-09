import type { Copy } from './types'

/** English mirrors `es.ts`. Written as English, not translated word for word. */
export const en: Copy = {
  locale: 'en',
  htmlLang: 'en',

  meta: {
    title: 'David Guillen — Senior Frontend & Mobile Engineer',
    description:
      'Senior Frontend & Mobile Engineer. I build product interfaces, apps and design systems with React, React Native and Next.js — and this portfolio runs on a WebGL scene I wrote myself.',
    ogAlt: 'David Guillen — Senior Frontend & Mobile Engineer',
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
  },

  hero: {
    eyebrow: 'DAVID GUILLEN — SENIOR FRONTEND & MOBILE',
    title: 'David Guillen',
    headline: 'Interfaces built to survive production.',
    lead: 'Senior Frontend & Mobile Engineer. I work the whole product: frontend architecture, React Native apps, design systems and the real-time 3D you are looking at right now.',
    ctaClient: 'I HAVE A PROJECT',
    ctaRecruiter: 'SEE EXPERIENCE',
    factExperience: 'FREELANCE SINCE 2018 · PRODUCT, BANKING & HEALTHCARE TEAMS',
    factStack: 'REACT · REACT NATIVE · NEXT · ANGULAR · NODE',
    factAvailability: 'BUENOS AIRES (GMT−3) · REMOTE',
    cue: 'SCROLL TO CHARGE',
  },

  work: {
    label: '01 — WORK',
    heading: 'Three pieces that show how I work',
    intro:
      'Each one solves a different problem: design systems, purchase flow and real-time rendering. All three have a public demo you can open right now.',
    featuredLabel: 'Featured cases',
    labLabel: 'Lab',
    labIntro:
      'Experiments and concepts where I test one specific technique. Shown as exactly that: my own pieces, with no client behind them.',
    archiveLabel: 'Archive',
    openCase: 'Read the case',
    openDemo: 'Open demo',
    caseOf: 'Case study',
  },

  experience: {
    label: '02 — EXPERIENCE',
    heading: 'Where I have worked and what I owned',
    intro:
      'Product, banking, healthcare and agency teams. No business metrics I cannot show you: what is verifiable here is the role and the context.',
    currentLabel: 'Currently',
    previousLabel: 'Previously',
    cvCta: 'VIEW FULL CV',
    roles: [
      {
        company: 'Grupo Mariva',
        role: 'Technical Lead',
        context:
          'Finance. Frontend architecture decisions, code review and supporting the team.',
        current: true,
      },
      {
        company: 'Bayer',
        role: 'Salesforce platform development',
        context: 'Healthcare. Interfaces and automation inside the platform.',
        current: true,
      },
      {
        company: 'Nonconformist',
        role: 'Frontend Engineer',
        context: 'Digital product agency. Client web apps and platforms.',
        current: true,
      },
      {
        company: 'Santander España',
        role: 'Frontend Angular',
        context: 'Banking. Development on large-scale internal applications.',
        current: false,
      },
      {
        company: 'GlobalLogic — Claro account',
        role: 'Frontend Engineer',
        context: 'Telecom. Customer-facing product.',
        current: false,
      },
      {
        company: 'Skyblue · VinciU · Orion2Pay',
        role: 'Web and mobile development',
        context: 'Early teams: product, payments and apps.',
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
    copy: 'I have been writing software since 2018: freelance first, then inside product, banking and healthcare teams. I am comfortable moving between frontend architecture and visual detail — and when it is needed I go down to the backend or to GPU rendering so the idea actually exists.',
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
    viewDemo: 'Open demo',
    viewRepo: 'View code',
    nextCase: 'Next case',
    noDemo: 'No public demo',
  },

  cv: {
    label: 'CV',
    heading: 'David Guillen — Senior Frontend & Mobile Engineer',
    intro:
      'A printable version of my background. Same data as the rest of the site.',
    print: 'Print or save as PDF',
    sections: {
      profile: 'Profile',
      experience: 'Experience',
      skills: 'Technical skills',
      projects: 'Personal projects',
      education: 'Education',
      languages: 'Languages',
    },
    education: [
      {
        key: 'Technical training',
        value: 'Web and mobile development — self-taught track plus applied courses',
      },
      {
        key: 'Ongoing learning',
        value: 'Frontend architecture, accessibility, performance and real-time graphics',
      },
    ],
    skills: [
      { key: 'Frontend', value: 'React, Next.js, Angular, Vue, TypeScript' },
      { key: 'Mobile', value: 'React Native, Android, store releases' },
      { key: 'Backend', value: 'Node, Express, Firebase, REST' },
      { key: 'Data', value: 'PostgreSQL, MySQL, MongoDB' },
      { key: 'Interface', value: 'Design systems, WCAG accessibility, Core Web Vitals' },
      { key: 'Graphics', value: 'Three.js, React Three Fiber, GLSL, GSAP' },
    ],
  },

  notFound: {
    title: 'This route does not exist',
    lead: 'The reactor could not find that signal. Head back home and we will pick it up from there.',
    cta: 'Go home',
  },

  localeGate: {
    title: 'David Guillen — Senior Frontend & Mobile Engineer',
    lead: 'Choose a language to enter.',
    choose: { es: 'Entrar en español', en: 'Enter in English' },
  },

  featured: [
    {
      slug: 'chroma-dev',
      title: 'Chroma Dev',
      kind: 'concept',
      kindLabel: 'Personal project · public demo',
      tags: ['DESIGN SYSTEM', 'REACT', 'THEMING'],
      summary:
        'An editor where a JSON of tokens defines colour and typography, and the interface re-skins itself with no reload and no redeploy.',
      outcome:
        'The theme becomes data: edit the JSON and the interface re-skins immediately, with no recompile. That is what makes one build viable under several clients’ brands.',
      problem:
        'When a SaaS product is sold under each client’s brand, the easy path is duplicating the project or keeping a branch per account. That shortcut multiplies the cost of every change and guarantees two clients are never on the same version.',
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
          body: 'The JSON shape is typed: a missing or renamed token shows up at compile time, not when a client opens the app with half the colours black.',
        },
        {
          title: 'Editor and preview on one screen',
          body: 'Edits are validated next to the result. That is the difference between trusting the JSON and seeing the JSON applied.',
        },
      ],
      contribution: [
        'Colour and typography token schema, and its typings.',
        'The bridge between the JSON and the custom properties applied at runtime.',
        'Editor with validation and immediate theme application.',
        'Sample component set so the theme is seen on real UI.',
      ],
      evidence: [
        'The demo is public: edit the JSON and the interface changes immediately.',
        'The type scale and palette are visible in the same editor.',
      ],
      demoUrl: 'https://chroma-dev.vercel.app/',
      image: {
        src: '/work/chroma-dev.jpg',
        alt: 'Chroma Dev editor showing a theme.json file with colour tokens and a type scale',
        width: 1600,
        height: 1000,
      },
      plate: 'MODULE 01 — CHROMA',
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
        'The piece carries an image that fills the entire screen without the text losing legibility or hierarchy — and it does that through composition, not by covering the artwork with an opaque layer.',
      problem:
        'When the image is the protagonist, text usually ends up fighting it: a drop shadow, a black gradient on top, or banishment to a side column. The exercise was keeping both intact on the same screen.',
      role: 'Art direction, design and full development.',
      scope: 'Personal project, no client. One view, worked through properly.',
      stack: ['Next.js', 'React', 'CSS'],
      constraints: [
        'The image fills the screen and the text has to stay readable on top of it.',
        'Hierarchy has to read before decoration.',
        'No opaque layers over the artwork: it is what the landing exists to show.',
      ],
      decisions: [
        {
          title: 'Extreme type scale, a single voice',
          body: 'One very large headline and everything else very restrained. Size contrast does the work that five colours and three weights do in other landings.',
        },
        {
          title: 'Contrast solved in the composition',
          body: 'The text sits in the dark region of the image rather than darkening it. Harder to frame, and free in terms of legibility.',
        },
        {
          title: 'The CTAs break the gloom, nothing else does',
          body: 'A single light block in the lower left concentrates the action. Everything else stays inside the artwork’s tonal range.',
        },
      ],
      contribution: [
        'Composition and type system for the view.',
        'Image treatment, framing and content hierarchy.',
        'Development of the landing and its responsive behaviour.',
      ],
      evidence: [
        'The demo is public and can be viewed at any screen size.',
        'The headline reads over the artwork with no darkening layer in between.',
      ],
      demoUrl: 'https://landing-davinci.vercel.app/',
      image: {
        src: '/work/landing-davinci.jpg',
        alt: 'Landing Da Vinci: the headline “Galaxia al óleo” over an oil-painted galaxy with a brush',
        width: 1600,
        height: 1000,
      },
      plate: 'MODULE 02 — DAVINCI',
    },
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
      plate: 'MODULE 03 — REACTOR',
    },
  ],

  lab: [
    {
      slug: 'fueradecontexto',
      title: 'Fueradecontexto',
      kind: 'concept',
      kindLabel: 'Concept · degraded demo',
      tags: ['ECOMMERCE', 'REACT', 'LOADING STATES'],
      summary:
        'An online store with catalogue, cart and checkout. The deployment still boots the shell but no longer fetches its products, so the demo stops at the skeletons.',
      outcome:
        'What remains demonstrable is the loading-state design: the page neither breaks nor goes blank when the data does not arrive — it shows the shape the content will occupy.',
      problem:
        'Practising the full purchase journey, including the in-between states nobody designs: loading, empty, error and sold out.',
      role: 'Interface design and frontend development.',
      scope:
        'Personal project, no real payments. The deployment’s data backend stopped responding, so the demo does not represent the finished state.',
      stack: ['React', 'TypeScript', 'CSS Modules'],
      constraints: [
        'The page has to stay readable when data is slow or never arrives.',
        'The grid has to work from 320 px up with no horizontal scroll.',
      ],
      decisions: [
        {
          title: 'Skeletons shaped like the real content',
          body: 'Placeholders reproduce the height and layout of the cards, so the page does not jump when data lands. It is also why the broken demo looks incomplete rather than broken.',
        },
      ],
      contribution: [
        'Catalogue and product page layout.',
        'Loading, empty and error states across the store.',
      ],
      evidence: [
        'The demo is public and shows the shell with its loading states; the products no longer load.',
        'I leave it that way, and say so, rather than showing a screenshot that promises a working store.',
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
        'A WebGL scene with spheres inside a volume: a test bench for materials, light and object density.',
      outcome:
        'It was the step before the real-time rendering in this portfolio: here I tested instancing, materials and fill-rate cost before taking it to production.',
      problem:
        'Before resting a whole site on WebGL I needed to understand where performance falls apart as objects and reflective materials grow.',
      role: 'Full development.',
      scope: 'Personal experiment. One scene, no interface around it.',
      stack: ['Three.js', 'JavaScript', 'WebGL'],
      constraints: [
        'Many objects with reflective material without losing smoothness.',
        'The scene has to start without heavy assets.',
      ],
      decisions: [
        {
          title: 'Geometry shared across instances',
          body: 'A single geometry reused for every sphere: the cost lands on fill-rate, not on draw call count.',
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
    {
      slug: 'launch-flow',
      title: 'Launch Flow',
      kind: 'concept',
      kindLabel: 'Concept · sample data',
      tags: ['LANDING', 'SAAS', 'GLASSMORPHISM'],
      summary:
        'A launch landing for a fictional SaaS product, with hero, features and beta capture.',
      outcome:
        'A structure exercise for conversion landings: what is said first, what is proven, and where the form goes.',
      problem:
        'Practising the order of a product landing: proposition, proof, objection and action, without the aesthetic burying the message.',
      role: 'Design and development.',
      scope:
        'Personal concept. The product, the brand and the numbers on screen are samples, not real results.',
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
      evidence: ['The demo is public. The data it shows is fictional.'],
      demoUrl: 'https://launch-flow.vercel.app/',
      image: {
        src: '/work/launch-flow.jpg',
        alt: 'BetaLaunch landing with a headline about turning an idea into a startup and sample metrics',
        width: 1600,
        height: 1000,
      },
      plate: 'LAB — LAUNCH',
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
