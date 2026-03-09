import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef,
} from "preact/hooks";
import { memo, startTransition } from "preact/compat";
import type { JSX } from "preact";
import {
  MotionDiv,
  MotionP,
  MotionSvg,
  MotionPath,
} from "../utils/motion-components";
import { useTranslation } from "../hooks/useTranslation";
import { useSectionReveal } from "../hooks/useSectionReveal";
import {
  sectionReveal,
  sectionRevealHeader,
  sectionRevealSubheader,
  sectionRevealItem,
  sectionRevealCard,
} from "../utils/section-reveal-variants";

interface ProjectCard {
  id: number;
  demoUrl: string;
  github: string;
  title: string;
  gif: string;
  description: string;
  icons: string;
  cardLang: string;
  isDesign: boolean;
  previewType?: "image" | "iframe" | "link";
  hideDemoLink?: boolean;
}

type FilterState = {
  category: "all" | "dev" | "design";
  technology: string | null;
  searchTerm: string;
};

type FilterAction =
  | { type: "SET_CATEGORY"; payload: "all" | "dev" | "design" }
  | { type: "SET_TECHNOLOGY"; payload: string | null }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "RESET" };

const filterReducer = (
  state: FilterState,
  action: FilterAction,
): FilterState => {
  switch (action.type) {
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_TECHNOLOGY":
      return { ...state, technology: action.payload };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload };
    case "RESET":
      return { category: "all", technology: null, searchTerm: "" };
    default:
      return state;
  }
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const parseStringArray = (str: string): string[] => {
  if (!str) return [];
  try {
    const cleanStr = str.replace(/'/g, '"');
    const parsed = JSON.parse(cleanStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

const getProjectDescriptionKey = (title: string): string =>
  title
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const USE_GIF_DOMAINS = new Set(["drfapiprojects.onrender.com"]);
const KEEP_VIDEO_TITLES = new Set(["Sphere With Physics"]);
const SKIP_FAVICON_DOMAINS = new Set([
  "chroma-dev.vercel.app",
  "fueradecontexto.vercel.app",
]);
const HEAVY_ANIMATION_DOMAINS = new Set([
  "landing-davinci.vercel.app",
  "launch-flow.vercel.app",
]);

const withPreviewType = (p: ProjectCard): ProjectCard => {
  if (p.isDesign || !p.demoUrl) return p;
  if (KEEP_VIDEO_TITLES.has(p.title)) return p;
  try {
    const host = new URL(p.demoUrl).hostname.replace(/^www\./, "");
    if (p.gif && USE_GIF_DOMAINS.has(host)) return p;
    return { ...p, previewType: "iframe" };
  } catch {
    return p;
  }
};

const STATIC_PROJECTS: Omit<ProjectCard, "id">[] = [
  {
    demoUrl: "https://nonconformist.nxc.digital",
    github: "",
    title: "Nonconformist",
    gif: "",
    description:
      "Último proyecto desarrollado. Página principal de la empresa Nonconformist.",
    icons: '["Angular", "TypeScript", "SCSS"]',
    cardLang: "es",
    isDesign: false,
    previewType: "iframe",
  },
  {
    demoUrl: "https://muscly-lake.vercel.app",
    github: "https://github.com/DevDavidg/muscly",
    title: "muscly",
    gif: "",
    description:
      "Gestor de música que analiza a nivel de espectrograma. Soporta enlaces de YouTube o URLs web.",
    icons: '["React", "TypeScript", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "iframe",
  },
  {
    demoUrl: "https://moto-ledger.vercel.app",
    github: "https://github.com/DevDavidg/moto-ledger",
    title: "moto-ledger",
    gif: "",
    description:
      "App financiera para gestionar gastos de motocicletas en Panamá.",
    icons: '["React", "TypeScript", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "iframe",
  },
  {
    demoUrl: "https://fueradecontexto.vercel.app",
    github: "https://github.com/DevDavidg/fueradecontexto",
    title: "fueradecontexto",
    gif: "",
    description: "Tienda de ropa.",
    icons: '["React", "TypeScript", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "link",
  },
  {
    demoUrl: "https://chroma-dev.vercel.app",
    github: "https://github.com/DevDavidg/shadcn",
    title: "chroma-dev",
    gif: "",
    description:
      "Aplicación multi-tenant. Crea temas y colores personalizados para componentes multi-tenant mediante JSON.",
    icons: '["React", "TypeScript", "shadcn", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "link",
  },
  {
    demoUrl: "https://landing-davinci.vercel.app",
    github: "https://github.com/DevDavidg/landing-davinci",
    title: "landing-davinci",
    gif: "",
    description:
      "Proyecto universitario con animaciones en React y TypeScript.",
    icons: '["React", "TypeScript", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "iframe",
  },
  {
    demoUrl: "https://launch-flow.vercel.app",
    github: "https://github.com/DevDavidg/landing-glassmorph",
    title: "launch-flow",
    gif: "",
    description: "Proyecto universitario.",
    icons: '["React", "TypeScript", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "iframe",
  },
  {
    demoUrl: "https://moto-finance-nexus.vercel.app/login",
    github: "https://github.com/DevDavidg/moto-finance-nexus",
    title: "moto-finance-nexus",
    gif: "",
    description:
      "Portal que une dos proyectos: ledger de motocicletas y concesionario de motocicletas.",
    icons: '["React", "TypeScript", "Vercel"]',
    cardLang: "es",
    isDesign: false,
    previewType: "iframe",
    hideDemoLink: true,
  },
];

const mediaUtils = {
  isVideo: (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes(".mp4") ||
      lowerUrl.includes(".webm") ||
      lowerUrl.includes(".mov")
    );
  },

  isGif: (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes(".gif") && !lowerUrl.includes(".mp4");
  },

  getOptimizedImageUrl: (url: string, size: string = "m"): string => {
    if (url.includes("imgur.com") && !url.includes(".mp4")) {
      const imgurRegex = /imgur\.com\/([a-zA-Z0-9]+)/;
      const match = imgurRegex.exec(url);
      if (match?.[1]) {
        return `https://i.imgur.com/${match[1]}${size}.jpg`;
      }
    }
    return url;
  },
};

const Badge = memo(
  ({
    children,
    active = false,
    onClick,
    ariaLabel,
  }: {
    children: JSX.Element | string;
    active?: boolean;
    onClick?: () => void;
    ariaLabel?: string;
  }) => {
    return (
      <div
        className={`badge cursor-pointer text-xs px-3 py-1.5 rounded-full transition-all duration-200 select-none hover:scale-105 ${
          active
            ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary ring-2 ring-light-accent/30 dark:ring-dark-accent/30"
            : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
        }`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={ariaLabel}
        onKeyDown={(e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </div>
    );
  },
);

const VideoMedia = memo(
  ({
    url,
    title,
    hovered,
  }: {
    url: string;
    title: string;
    hovered: boolean;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      if (hovered && isLoaded) {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }, [hovered, isLoaded]);

    return (
      <div
        className="w-full h-full transition-all duration-300"
        style={{
          filter: hovered
            ? "grayscale(0%) brightness(1)"
            : "grayscale(100%) brightness(0.7)",
        }}
      >
        <video
          ref={videoRef}
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setIsLoaded(false)}
          aria-label={`Video preview of ${title}`}
        />
      </div>
    );
  },
);

const LinkIcon = memo(() => (
  <svg
    className="w-14 h-14 text-light-accent/80 dark:text-dark-accent/80"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  </svg>
));

const LinkPreviewMedia = memo(
  ({
    url,
    title,
    hovered,
    viewDemoLabel,
  }: {
    url: string;
    title: string;
    hovered: boolean;
    viewDemoLabel: string;
  }) => {
    const host = useMemo(() => {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    }, [url]);
    const [faviconError, setFaviconError] = useState(false);
    const skipFavicon = SKIP_FAVICON_DOMAINS.has(host);

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 transition-all duration-300 bg-gradient-to-br from-light-muted to-light-muted/60 dark:from-dark-muted dark:to-dark-muted/60 hover:from-light-muted/90 hover:to-light-muted/50 dark:hover:from-dark-muted/90 dark:hover:to-dark-muted/50"
        style={{
          filter: hovered
            ? "grayscale(0%) brightness(1)"
            : "grayscale(100%) brightness(0.9)",
        }}
        aria-label={`Abrir ${title}`}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-light-primary/5 dark:bg-dark-primary/5">
          {skipFavicon || faviconError ? (
            <LinkIcon />
          ) : (
            <img
              src={`https://icons.duckduckgo.com/ip3/${host}.ico`}
              alt=""
              className="w-10 h-10 rounded-lg object-cover"
              onError={() => setFaviconError(true)}
            />
          )}
        </div>
        <span className="text-base font-semibold text-light-primary dark:text-dark-primary text-center line-clamp-2">
          {title}
        </span>
        <span className="text-xs font-medium text-light-accent dark:text-dark-accent px-4 py-2 rounded-lg bg-light-accent/10 dark:bg-dark-accent/10">
          {viewDemoLabel}
        </span>
      </a>
    );
  },
);

const getIframeStyle = (url: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const isHeavy = HEAVY_ANIMATION_DOMAINS.has(host);
    if (isHeavy) {
      return {
        width: "200%",
        height: "200%",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) scale(0.5)",
      };
    }
    return {
      width: "1920px",
      height: "1080px",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) scale(0.208)",
    };
  } catch {
    return {
      width: "200%",
      height: "200%",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%) scale(0.5)",
    };
  }
};

const WebviewMedia = memo(
  ({
    url,
    title,
    hovered,
  }: {
    url: string;
    title: string;
    hovered: boolean;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const iframeStyle = useMemo(() => getIframeStyle(url), [url]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setIsInView(true);
        },
        { rootMargin: "100px", threshold: 0.01 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full transition-all duration-300"
        style={{
          filter: hovered
            ? "grayscale(0%) brightness(1)"
            : "grayscale(100%) brightness(0.7)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {isInView && (
            <iframe
              src={url}
              title={title}
              className="absolute border-0 pointer-events-none"
              style={iframeStyle}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>
    );
  },
);

const ImageMedia = memo(
  ({
    url,
    title,
    hovered,
    isGif = false,
  }: {
    url: string;
    title: string;
    hovered: boolean;
    isGif?: boolean;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [error, setError] = useState(false);

    const staticUrl = useMemo(
      () => (isGif ? mediaUtils.getOptimizedImageUrl(url, "h") : url),
      [url, isGif],
    );

    return (
      <div className="w-full h-full relative">
        {isGif && (
          <img
            src={url}
            alt={title}
            className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            style={{
              opacity: hovered && imageLoaded ? 1 : 0,
              filter: "grayscale(0%)",
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setError(true)}
          />
        )}

        <img
          src={staticUrl}
          alt={isGif ? `${title} - preview` : title}
          className="w-full h-full object-cover transition-all duration-300"
          loading="lazy"
          decoding="async"
          style={{
            opacity: isGif && hovered && imageLoaded ? 0 : error ? 0 : 1,
            filter: hovered
              ? "grayscale(0%) brightness(1)"
              : "grayscale(100%) brightness(0.7)",
          }}
          onError={() => setError(true)}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-light-muted dark:bg-dark-muted">
            <span className="text-light-secondary dark:text-dark-secondary text-sm">
              Error al cargar imagen
            </span>
          </div>
        )}
      </div>
    );
  },
);

const ProjectMedia = memo(
  ({
    url,
    title,
    hovered,
    iframeUrl,
    linkPreviewUrl,
    viewDemoLabel,
  }: {
    url: string;
    title: string;
    hovered: boolean;
    iframeUrl?: string;
    linkPreviewUrl?: string;
    viewDemoLabel: string;
  }) => {
    const isVideo = useMemo(() => mediaUtils.isVideo(url), [url]);
    const isGif = useMemo(() => mediaUtils.isGif(url), [url]);

    const isIframe = Boolean(iframeUrl);
    const renderMedia = () => {
      if (linkPreviewUrl)
        return (
          <LinkPreviewMedia
            url={linkPreviewUrl}
            title={title}
            hovered={hovered}
            viewDemoLabel={viewDemoLabel}
          />
        );
      if (iframeUrl)
        return <WebviewMedia url={iframeUrl} title={title} hovered={hovered} />;
      if (isVideo)
        return <VideoMedia url={url} title={title} hovered={hovered} />;
      return (
        <ImageMedia url={url} title={title} hovered={hovered} isGif={isGif} />
      );
    };

    return (
      <div
        className={`w-full h-full relative overflow-hidden rounded-t-xl ${
          isIframe ? "bg-black" : "bg-light-muted dark:bg-dark-muted"
        }`}
      >
        {renderMedia()}

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300"
          style={{ opacity: hovered ? 0.3 : 0.6 }}
        />
      </div>
    );
  },
);

const ProjectLink = memo(
  ({
    href,
    isPrimary = false,
    children,
    ariaLabel,
  }: {
    href: string;
    isPrimary?: boolean;
    children: JSX.Element | string;
    ariaLabel?: string;
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${
        isPrimary ? "btn-gradient" : "btn-outline"
      } text-sm flex-1 text-center rounded-lg py-2.5 px-4 font-medium transition-all duration-200 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-2`}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
);

const ProjectCard = memo(
  ({ project, t }: { project: ProjectCard; t: (key: string) => string }) => {
    const [hovered, setHovered] = useState(false);

    const techs = useMemo(
      () => parseStringArray(project.icons),
      [project.icons],
    );
    const descriptionKey = `projects.descriptions.${getProjectDescriptionKey(project.title)}`;
    const translatedDesc = t(descriptionKey);
    const description =
      translatedDesc !== descriptionKey ? translatedDesc : project.description;

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    return (
      <div className="group opacity-100 h-full flex flex-1 min-h-0">
        <article
          className="glass-card overflow-hidden rounded-xl flex flex-col flex-1 min-h-0 w-full relative shadow-lg hover:shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-light-accent dark:focus-within:ring-dark-accent"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative overflow-hidden h-56 bg-light-muted dark:bg-dark-muted">
            <ProjectMedia
              url={project.gif}
              title={project.title}
              hovered={hovered}
              iframeUrl={
                project.previewType === "iframe" ? project.demoUrl : undefined
              }
              linkPreviewUrl={
                project.previewType === "link" ? project.demoUrl : undefined
              }
              viewDemoLabel={t("projects.actions.openDemo")}
            />

            <div className="absolute top-3 right-3 flex gap-2 z-20">
              {project.isDesign && (
                <Badge ariaLabel="Proyecto de diseño">Diseño</Badge>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <h3 className="text-xl font-bold mb-1 text-white drop-shadow-lg line-clamp-2">
                {project.title}
              </h3>
            </div>
          </div>

          <div className="p-6 relative z-10 flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0">
              <p className="text-light-secondary dark:text-dark-secondary mb-4 line-clamp-3 leading-relaxed">
                {description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {techs.slice(0, 5).map((tech) => (
                  <Badge
                    key={`${project.id}-${tech}`}
                    ariaLabel={`Tecnología: ${tech}`}
                  >
                    {tech}
                  </Badge>
                ))}
                {techs.length > 5 && (
                  <Badge
                    ariaLabel={`${techs.length - 5} tecnologías adicionales`}
                  >
                    {`+${techs.length - 5}`}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-auto pt-4">
              {project.demoUrl && !project.hideDemoLink && (
                <ProjectLink
                  href={project.demoUrl}
                  isPrimary
                  ariaLabel={`${t("accessibility.viewDemo")} ${project.title}`}
                >
                  {t("projects.actions.viewDemo")}
                </ProjectLink>
              )}

              {project.github && (
                <ProjectLink
                  href={project.github}
                  ariaLabel={`${t("accessibility.viewCode")} ${project.title}`}
                >
                  {t("projects.actions.viewCode")}
                </ProjectLink>
              )}
            </div>
          </div>
        </article>
      </div>
    );
  },
);

const CategoryButton = memo(
  ({
    active,
    onClick,
    children,
    ariaLabel,
  }: {
    active: boolean;
    onClick: () => void;
    children: JSX.Element | string;
    ariaLabel?: string;
  }) => {
    return (
      <button
        className={`btn-outline relative px-6 py-2.5 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent ${
          active ? "bg-light-primary/10 dark:bg-dark-primary/10" : ""
        }`}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
      >
        {children}
        {active && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-light-accent dark:bg-dark-accent w-full" />
        )}
      </button>
    );
  },
);

const LoadingSpinner = memo(({ t }: { t: (key: string) => string }) => (
  <div className="flex flex-col justify-center items-center py-16">
    <MotionSvg
      width="48"
      height="48"
      viewBox="0 0 50 50"
      className="text-light-accent dark:text-dark-accent mb-4"
      animate={{ rotate: 360 }}
      transition={{
        rotate: {
          repeat: Infinity,
          duration: 1.2,
          ease: "linear",
        },
      }}
    >
      <MotionPath
        fill="none"
        strokeWidth="4"
        stroke="currentColor"
        strokeLinecap="round"
        d="M25,2.5A22.5,22.5,0,1,1,2.5,25,22.5,22.5,0,0,1,25,2.5"
        strokeDasharray="100"
        strokeDashoffset="100"
        animate={{ strokeDashoffset: 0 }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "easeInOut",
        }}
      />
    </MotionSvg>
    <p className="text-light-secondary dark:text-dark-secondary text-lg">
      {t("projects.loading")}
    </p>
  </div>
));

const ErrorMessage = memo(
  ({
    error,
    onRetry,
    t,
  }: {
    error: string;
    onRetry: () => void;
    t: (key: string) => string;
  }) => (
    <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-300 text-center my-12 border border-red-200 dark:border-red-800">
      <MotionSvg
        className="w-12 h-12 mx-auto mb-4 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </MotionSvg>
      <h3 className="text-lg font-semibold mb-2">
        {t("projects.error.title")}
      </h3>
      <p className="mb-4">{error}</p>
      <button
        className="bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  ),
);

const EmptyState = memo(
  ({ onReset, t }: { onReset: () => void; t: (key: string) => string }) => (
    <div className="text-center py-16">
      <MotionSvg
        className="w-16 h-16 mx-auto mb-6 text-light-muted dark:text-dark-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </MotionSvg>
      <h3 className="text-xl font-semibold mb-2 text-light-primary dark:text-dark-primary">
        {t("projects.empty.title")}
      </h3>
      <p className="text-light-secondary dark:text-dark-secondary mb-6 max-w-md mx-auto">
        {t("projects.empty.description")}
      </p>
      <button
        className="btn-outline px-6 py-2.5 hover:scale-105 hover:-translate-y-1 transition-all duration-200"
        onClick={onReset}
      >
        {t("projects.empty.showAll")}
      </button>
    </div>
  ),
);

const Projects = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useSectionReveal(sectionRef);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, dispatch] = useReducer(filterReducer, {
    category: "all",
    technology: null,
    searchTerm: "",
  });

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const fetchProjects = useCallback(async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch directly from the API
      const response = await fetch(
        "https://drfapiprojects.onrender.com/projectcards/",
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }

      const apiProjects = (data as ProjectCard[]).map(withPreviewType);
      const withIds = STATIC_PROJECTS.map((p, i) => ({
        ...p,
        id: 1000 + i,
      })) as ProjectCard[];
      setProjects([...apiProjects, ...withIds]);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.warn("API failed, using static projects:", err);

      const fallbackData: ProjectCard[] = STATIC_PROJECTS.map((p, i) => ({
        ...p,
        id: i + 1,
      })) as ProjectCard[];

      setProjects(fallbackData);
      setError(null);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => {
      const techs = parseStringArray(project.icons);
      techs.forEach((tech) => tagSet.add(tech));
    });
    return Array.from(tagSet).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const techs = parseStringArray(project.icons);

      const matchesTech = filters.technology
        ? techs.some((tech) =>
            tech.toLowerCase().includes(filters.technology!.toLowerCase()),
          )
        : true;

      const matchesCategory =
        filters.category === "all" ||
        (filters.category === "design" ? project.isDesign : !project.isDesign);

      const matchesSearch =
        !debouncedSearchTerm ||
        project.title
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        project.description
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        techs.some((tech) =>
          tech.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        );

      return matchesTech && matchesCategory && matchesSearch;
    });
  }, [projects, filters.technology, filters.category, debouncedSearchTerm]);

  const handleCategoryChange = useCallback(
    (category: "all" | "dev" | "design") => {
      startTransition(() => {
        dispatch({ type: "SET_CATEGORY", payload: category });
      });
    },
    [],
  );

  const handleTechnologyChange = useCallback((technology: string | null) => {
    startTransition(() => {
      dispatch({ type: "SET_TECHNOLOGY", payload: technology });
    });
  }, []);

  const resetFilters = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "RESET" });
    });
  }, []);

  const handleRetry = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  const renderContent = () => {
    if (loading) return <LoadingSpinner t={t} />;
    if (error && projects.length === 0)
      return <ErrorMessage error={error} onRetry={handleRetry} t={t} />;
    if (filteredProjects.length === 0)
      return <EmptyState onReset={resetFilters} t={t} />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
        {filteredProjects.map((project, i) => (
          <MotionDiv
            key={project.id}
            variants={sectionRevealCard}
            custom={i}
            className="h-full flex flex-col min-h-[420px]"
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "auto 420px",
            }}
          >
            <ProjectCard project={project} t={t} />
          </MotionDiv>
        ))}
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="py-20 px-4 sm:px-6 lg:px-8 container mx-auto relative min-h-screen perspective overflow-hidden"
      data-optimize="true"
    >
      <div className="gradient-divider" aria-hidden />

      <MotionDiv
        variants={sectionReveal}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="w-full"
      >
        <header className="text-center mb-16">
          <MotionP
            variants={sectionRevealHeader}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gradient"
          >
            {t("projects.title")}
          </MotionP>

          <MotionP
            variants={sectionRevealSubheader}
            className="text-light-secondary dark:text-dark-secondary text-lg max-w-2xl mx-auto mb-8"
          >
            {t("projects.subtitle")}
          </MotionP>

          <MotionDiv
            variants={sectionRevealItem}
            className="flex justify-center gap-4 mb-8"
          >
            <CategoryButton
              active={filters.category === "all"}
              onClick={() => handleCategoryChange("all")}
              ariaLabel="Mostrar todos los proyectos"
            >
              {t("projects.filters.all")}
            </CategoryButton>

            <CategoryButton
              active={filters.category === "dev"}
              onClick={() => handleCategoryChange("dev")}
              ariaLabel="Mostrar solo proyectos de desarrollo"
            >
              {t("projects.filters.development")}
            </CategoryButton>

            <CategoryButton
              active={filters.category === "design"}
              onClick={() => handleCategoryChange("design")}
              ariaLabel="Mostrar solo proyectos de diseño"
            >
              {t("projects.filters.design")}
            </CategoryButton>
          </MotionDiv>

          <MotionDiv
            variants={sectionRevealItem}
            className="flex flex-wrap justify-center gap-2 mt-6 max-w-5xl mx-auto"
          >
            <Badge
              active={filters.technology === null}
              onClick={() => handleTechnologyChange(null)}
              ariaLabel="Mostrar todas las tecnologías"
            >
              Todas las tecnologías
            </Badge>

            {allTags.map((tag) => (
              <Badge
                key={tag}
                active={filters.technology === tag}
                onClick={() => handleTechnologyChange(tag)}
                ariaLabel={`Filtrar por ${tag}`}
              >
                {tag}
              </Badge>
            ))}
          </MotionDiv>
        </header>

        <main>
          <MotionDiv variants={sectionRevealItem}>{renderContent()}</MotionDiv>
        </main>
      </MotionDiv>
    </section>
  );
};

export default Projects;
