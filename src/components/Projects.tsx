import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "preact/hooks";
import { memo, startTransition } from "preact/compat";
import type { JSX } from "preact";
import {
  MotionDiv,
  MotionP,
  MotionA,
  MotionImg,
  MotionSvg,
  MotionPath,
  MotionButton,
} from "../utils/motion-components";

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
  action: FilterAction
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

  isAnimated: (url: string): boolean => {
    return mediaUtils.isVideo(url) || mediaUtils.isGif(url);
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
  }
);

const PlayIcon = memo(() => (
  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
    <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
      <MotionSvg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="text-white"
      >
        <MotionPath d="M8 5v14l11-7z" fill="currentColor" />
      </MotionSvg>
    </div>
  </div>
));

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
  }
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
      [url, isGif]
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
  }
);

const ProjectMedia = memo(
  ({
    url,
    title,
    hovered,
  }: {
    url: string;
    title: string;
    hovered: boolean;
  }) => {
    const isVideo = useMemo(() => mediaUtils.isVideo(url), [url]);
    const isGif = useMemo(() => mediaUtils.isGif(url), [url]);
    const isAnimated = useMemo(() => mediaUtils.isAnimated(url), [url]);

    return (
      <div className="w-full h-full relative overflow-hidden rounded-t-xl bg-light-muted dark:bg-dark-muted">
        {isVideo ? (
          <VideoMedia url={url} title={title} hovered={hovered} />
        ) : (
          <ImageMedia url={url} title={title} hovered={hovered} isGif={isGif} />
        )}

        {!hovered && isAnimated && <PlayIcon />}

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300"
          style={{ opacity: hovered ? 0.3 : 0.6 }}
        />
      </div>
    );
  }
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
  )
);

const ProjectCard = memo(({ project }: { project: ProjectCard }) => {
  const [hovered, setHovered] = useState(false);

  const techs = useMemo(() => parseStringArray(project.icons), [project.icons]);

  const isAnimated = useMemo(
    () => mediaUtils.isAnimated(project.gif),
    [project.gif]
  );

  const mediaType = useMemo(() => {
    if (mediaUtils.isVideo(project.gif)) return "Video";
    if (mediaUtils.isGif(project.gif)) return "Animado";
    return null;
  }, [project.gif]);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <div className="group opacity-100">
      <article
        className="glass-card overflow-hidden rounded-xl flex flex-col h-full relative shadow-lg hover:shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-light-accent dark:focus-within:ring-dark-accent"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden h-56 bg-light-muted dark:bg-dark-muted">
          <ProjectMedia
            url={project.gif}
            title={project.title}
            hovered={hovered}
          />

          <div className="absolute top-3 right-3 flex gap-2 z-20">
            {project.isDesign && (
              <Badge ariaLabel="Proyecto de diseño">Diseño</Badge>
            )}
            {mediaType && (
              <Badge ariaLabel={`Contenido ${mediaType.toLowerCase()}`}>
                {mediaType}
              </Badge>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className="text-xl font-bold mb-1 text-white drop-shadow-lg line-clamp-2">
              {project.title}
            </h3>
          </div>
        </div>

        <div className="p-6 relative z-10 flex flex-col flex-1">
          <div className="flex-1">
            <p className="text-light-secondary dark:text-dark-secondary mb-4 line-clamp-3 leading-relaxed">
              {project.description}
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
            {project.demoUrl && (
              <ProjectLink
                href={project.demoUrl}
                isPrimary
                ariaLabel={`Ver demo de ${project.title}`}
              >
                Ver Demo
              </ProjectLink>
            )}

            {project.github && (
              <ProjectLink
                href={project.github}
                ariaLabel={`Ver código fuente de ${project.title}`}
              >
                Código
              </ProjectLink>
            )}
          </div>
        </div>
      </article>
    </div>
  );
});

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
  }
);

const LoadingSpinner = memo(() => (
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
      Cargando proyectos...
    </p>
  </div>
));

const ErrorMessage = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
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
      <h3 className="text-lg font-semibold mb-2">Error al cargar proyectos</h3>
      <p className="mb-4">{error}</p>
      <button
        className="bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700 px-6 py-2.5 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  )
);

const EmptyState = memo(({ onReset }: { onReset: () => void }) => (
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
      No se encontraron proyectos
    </h3>
    <p className="text-light-secondary dark:text-dark-secondary mb-6 max-w-md mx-auto">
      No hay proyectos que coincidan con los filtros actuales. Intenta ajustar
      los criterios de búsqueda.
    </p>
    <button
      className="btn-outline px-6 py-2.5 hover:scale-105 hover:-translate-y-1 transition-all duration-200"
      onClick={onReset}
    >
      Mostrar todos los proyectos
    </button>
  </div>
));

const Projects = () => {
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

      const response = await fetch(
        "https://drfapiprojects.onrender.com/projectcards/",
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }

      setProjects(data);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.warn("API not available, using fallback data:", err);

      const fallbackData: ProjectCard[] = [
        {
          id: 1,
          demoUrl: "https://github.com/davidgdev",
          github: "https://github.com/davidgdev",
          title: "Proyecto de Ejemplo",
          gif: "https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=Proyecto+Demo",
          description:
            "Este es un proyecto de ejemplo que se muestra cuando la API no está disponible. Incluye todas las funcionalidades básicas esperadas.",
          icons: '["React", "TypeScript", "Tailwind"]',
          cardLang: "es",
          isDesign: false,
        },
        {
          id: 2,
          demoUrl: "https://github.com/davidgdev",
          github: "https://github.com/davidgdev",
          title: "Diseño de Interfaz",
          gif: "https://via.placeholder.com/600x400/EC4899/FFFFFF?text=Diseño+UI",
          description:
            "Un diseño de interfaz de usuario creado con herramientas profesionales de diseño.",
          icons: '["Figma", "UI/UX", "Prototipado"]',
          cardLang: "es",
          isDesign: true,
        },
      ];

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
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const techs = parseStringArray(project.icons);

      const matchesTech = filters.technology
        ? techs.some((tech) =>
            tech.toLowerCase().includes(filters.technology!.toLowerCase())
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
          tech.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
    []
  );

  const handleTechnologyChange = useCallback((technology: string | null) => {
    startTransition(() => {
      dispatch({ type: "SET_TECHNOLOGY", payload: technology });
    });
  }, []);

  const handleSearchChange = useCallback((searchTerm: string) => {
    dispatch({ type: "SET_SEARCH", payload: searchTerm });
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
    if (loading) return <LoadingSpinner />;
    if (error && projects.length === 0)
      return <ErrorMessage error={error} onRetry={handleRetry} />;
    if (filteredProjects.length === 0)
      return <EmptyState onReset={resetFilters} />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <section
      id="projects"
      className="py-20 px-4 sm:px-6 lg:px-8 container mx-auto relative min-h-screen perspective overflow-hidden bg-light-bg dark:bg-dark-bg"
      data-optimize="true"
    >
      <div className="triangle-divider"></div>

      <header className="text-center mb-16">
        <MotionP
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gradient"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Proyectos Destacados
        </MotionP>

        <MotionP
          className="text-light-secondary dark:text-dark-secondary text-lg max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          Explora la colección de proyectos en los que he trabajado, desde
          aplicaciones web hasta diseños de interfaz.
        </MotionP>

        <div className="flex justify-center gap-4 mb-8">
          <CategoryButton
            active={filters.category === "all"}
            onClick={() => handleCategoryChange("all")}
            ariaLabel="Mostrar todos los proyectos"
          >
            Todos
          </CategoryButton>

          <CategoryButton
            active={filters.category === "dev"}
            onClick={() => handleCategoryChange("dev")}
            ariaLabel="Mostrar solo proyectos de desarrollo"
          >
            Desarrollo
          </CategoryButton>

          <CategoryButton
            active={filters.category === "design"}
            onClick={() => handleCategoryChange("design")}
            ariaLabel="Mostrar solo proyectos de diseño"
          >
            Diseño
          </CategoryButton>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-5xl mx-auto">
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
        </div>
      </header>

      <main>{renderContent()}</main>
    </section>
  );
};

export default Projects;
