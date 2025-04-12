import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "preact/hooks";
import { memo } from "preact/compat";
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

const parseStringArray = (str: string): string[] => {
  try {
    const cleanStr = str.replace(/'/g, '"');
    return JSON.parse(cleanStr);
  } catch (error) {
    console.error("Error parsing string array:", error);
    return [];
  }
};

const mediaUtils = {
  isVideo: (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.endsWith(".mp4") ||
      lowerUrl.includes(".mp4") ||
      (lowerUrl.includes("imgur") && lowerUrl.includes(".mp4"))
    );
  },

  isGif: (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    const isImgur = lowerUrl.includes("imgur");
    const isNotOtherFormat =
      !lowerUrl.includes(".mp4") &&
      !lowerUrl.includes(".png") &&
      !lowerUrl.includes(".jpg") &&
      !lowerUrl.includes(".jpeg");

    return lowerUrl.endsWith(".gif") || (isImgur && isNotOtherFormat);
  },

  isAnimated: (url: string): boolean => {
    return mediaUtils.isVideo(url) || mediaUtils.isGif(url);
  },

  getStillImageUrl: (gifUrl: string): string => {
    if (gifUrl.includes("imgur.com") && !gifUrl.includes(".mp4")) {
      const imgurRegex = /imgur\.com\/([a-zA-Z0-9]+)/;
      const result = imgurRegex.exec(gifUrl);

      if (result?.[1]) {
        return `https://i.imgur.com/${result[1]}h.jpg`;
      }
    }
    return gifUrl;
  },
};

const Badge = memo(
  ({
    children,
    active = false,
    onClick = undefined,
    index = 0,
  }: {
    children: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    index?: number;
  }) => {
    const badgeClass = useMemo(
      () =>
        `badge cursor-pointer text-xs px-2 py-1 rounded-md ${
          active
            ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary"
            : "bg-light-muted/40 dark:bg-dark-muted/40"
        }`,
      [active]
    );

    return (
      <MotionDiv
        className={badgeClass}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.05,
          duration: 0.4,
        }}
        whileHover={{
          y: -3,
          scale: 1.05,
        }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </MotionDiv>
    );
  }
);

const PlayIcon = memo(() => (
  <MotionDiv
    className="absolute inset-0 flex items-center justify-center z-10"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 0.9, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    <MotionSvg
      width="50"
      height="50"
      viewBox="0 0 24 24"
      className="text-light-bg dark:text-dark-bg opacity-80"
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 },
      }}
    >
      <MotionPath d="M8 5v14l11-7z" fill="currentColor" />
    </MotionSvg>
  </MotionDiv>
));

const VideoMedia = memo(
  ({
    url,
    hovered,
  }: {
    url: string;
    title: string;
    hovered: boolean;
    mediaTransition: any;
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      let timerId: number;
      if (!videoRef.current) return;

      if (hovered) {
        timerId = window.setTimeout(() => {
          if (videoRef.current?.paused) {
            const playPromise = videoRef.current.play();

            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                if (err.name !== "AbortError") {
                  console.error("Error playing video:", err);
                }
              });
            }
          }
        }, 100);
      } else {
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
          video.currentTime = 0;
        }
      }

      return () => clearTimeout(timerId);
    }, [hovered]);

    return (
      <MotionDiv
        initial={{ filter: "grayscale(100%)" }}
        animate={{
          filter: hovered ? "grayscale(0%)" : "grayscale(100%)",
        }}
        transition={{ duration: 0.4 }}
      >
        <video
          ref={videoRef}
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      </MotionDiv>
    );
  }
);

const GifMedia = memo(
  ({
    url,
    title,
    hovered,
  }: {
    url: string;
    title: string;
    hovered: boolean;
    mediaTransition: any;
  }) => {
    return (
      <>
        <MotionImg
          src={url}
          alt={title}
          className="w-full h-full object-cover absolute inset-0"
          width="100%"
          height="100%"
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{
            opacity: hovered ? 1 : 0,
            filter: "grayscale(0%)",
          }}
          transition={{ duration: 0.4 }}
        />
        <MotionImg
          src={mediaUtils.getStillImageUrl(url)}
          alt={`${title} - preview`}
          className="w-full h-full object-cover absolute inset-0"
          width="100%"
          height="100%"
          loading="lazy"
          decoding="async"
          initial={{ opacity: 1 }}
          animate={{
            opacity: hovered ? 0 : 1,
            filter: "grayscale(100%)",
          }}
          transition={{ duration: 0.4 }}
        />
      </>
    );
  }
);

const StaticMedia = memo(
  ({
    url,
    title,
    hovered,
  }: {
    url: string;
    title: string;
    hovered: boolean;
    mediaTransition: any;
  }) => {
    return (
      <MotionImg
        src={url}
        alt={title}
        className="w-full h-full object-cover"
        width="100%"
        height="100%"
        loading="lazy"
        decoding="async"
        initial={{ filter: "grayscale(100%)" }}
        animate={{
          filter: hovered ? "grayscale(0%)" : "grayscale(100%)",
        }}
        transition={{ duration: 0.4 }}
      />
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
    const isVideoMedia = useMemo(() => mediaUtils.isVideo(url), [url]);
    const isGifMedia = useMemo(() => mediaUtils.isGif(url), [url]);

    const renderMediaContent = () => {
      if (isVideoMedia) {
        return (
          <VideoMedia
            url={url}
            title={title}
            hovered={hovered}
            mediaTransition={null}
          />
        );
      }

      if (isGifMedia) {
        return (
          <GifMedia
            url={url}
            title={title}
            hovered={hovered}
            mediaTransition={null}
          />
        );
      }

      return (
        <StaticMedia
          url={url}
          title={title}
          hovered={hovered}
          mediaTransition={null}
        />
      );
    };

    return (
      <div
        className="w-full h-full relative overflow-hidden rounded-t-xl"
        style={{ contain: "paint layout" }}
      >
        {renderMediaContent()}

        {!hovered && (isVideoMedia || isGifMedia) && <PlayIcon />}

        <MotionDiv
          className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
          style={{ width: "100%", height: "100%" }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: hovered ? 0.2 : 0.6 }}
          transition={{ duration: 0.4 }}
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
  }: {
    href: string;
    isPrimary?: boolean;
    children: React.ReactNode;
  }) => (
    <MotionA
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${
        isPrimary ? "btn-gradient" : "btn-outline"
      } text-sm flex-1 text-center rounded-lg py-2 font-medium`}
      whileHover={{
        scale: 1.05,
        translateY: -3,
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </MotionA>
  )
);

const ProjectCard = memo(
  ({ project, index }: { project: ProjectCard; index: number }) => {
    const [hovered, setHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!cardRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, Math.min(index * 100, 300));
          } else {
            setIsVisible(false);
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
      );

      observer.observe(cardRef.current);

      return () => {
        observer.disconnect();
      };
    }, [index]);

    const techs = useMemo(
      () => parseStringArray(project.icons),
      [project.icons]
    );
    const isAnimated = useMemo(
      () => mediaUtils.isAnimated(project.gif),
      [project.gif]
    );
    const mediaType = useMemo(
      () => (mediaUtils.isVideo(project.gif) ? "Video" : "Animado"),
      [project.gif]
    );

    const cardStyles = {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(50px)",
      transition: isVisible
        ? "opacity 0.5s ease, transform 0.7s cubic-bezier(0.2, 0.8, 0.4, 1)"
        : "none",
    };

    return (
      <div ref={cardRef} style={{ minHeight: "100px" }}>
        <article
          className="glass-card overflow-hidden rounded-xl flex flex-col h-full relative shadow-lg"
          style={cardStyles}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="relative overflow-hidden h-56 bg-light-muted dark:bg-dark-muted">
            <ProjectMedia
              url={project.gif}
              title={project.title}
              hovered={hovered}
            />

            <div className="absolute top-3 right-3 flex gap-2 z-10">
              {project.isDesign && (
                <Badge>
                  <div>Diseño</div>
                </Badge>
              )}
              {isAnimated && (
                <Badge>
                  <div>{mediaType}</div>
                </Badge>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-xl font-bold mb-1 text-white drop-shadow-lg">
                {project.title}
              </p>
            </div>
          </div>

          <div className="p-6 relative z-10 flex flex-col flex-1">
            <div className="flex-1">
              <p className="text-light-secondary dark:text-dark-secondary mb-4 line-clamp-3">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {techs.slice(0, 4).map((tech, techIndex) => (
                  <Badge key={tech} index={techIndex}>
                    {tech}
                  </Badge>
                ))}
                {techs.length > 4 && (
                  <Badge>
                    <div>+{techs.length - 4} más</div>
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-auto pt-4">
              {project.demoUrl && (
                <ProjectLink href={project.demoUrl} isPrimary>
                  Ver Demo
                </ProjectLink>
              )}

              {project.github && (
                <ProjectLink href={project.github}>Código</ProjectLink>
              )}
            </div>
          </div>
        </article>
      </div>
    );
  }
);

const CategoryButton = memo(
  ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => {
    return (
      <MotionButton
        className={`btn-outline relative px-5 py-2 rounded-lg overflow-hidden ${
          active ? "bg-light-primary/10 dark:bg-dark-primary/10" : ""
        }`}
        onClick={onClick}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
        {active && (
          <MotionDiv
            className="absolute bottom-0 left-0 h-0.5 bg-light-accent dark:bg-dark-accent"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </MotionButton>
    );
  }
);

const LoadingSpinner = () => (
  <MotionDiv
    className="flex justify-center items-center py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <MotionSvg
      width="50"
      height="50"
      viewBox="0 0 50 50"
      className="text-light-accent dark:text-dark-accent"
      animate={{ rotate: 360 }}
      transition={{
        rotate: {
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        },
      }}
    >
      <MotionPath
        fill="none"
        strokeWidth="5"
        stroke="currentColor"
        strokeLinecap="round"
        d="M25,2.5A22.5,22.5,0,1,1,2.5,25,22.5,22.5,0,0,1,25,2.5"
        strokeDasharray="140"
        strokeDashoffset="140"
        animate={{ strokeDashoffset: 0 }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
      />
    </MotionSvg>
    <MotionP className="ml-3 text-light-secondary dark:text-dark-secondary">
      Cargando proyectos...
    </MotionP>
  </MotionDiv>
);

const ErrorMessage = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <MotionDiv
    className="p-6 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-center my-10"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <MotionP>Error al cargar proyectos: {error}</MotionP>
    <MotionButton
      className="mt-4 bg-red-200 dark:bg-red-800 px-4 py-2 rounded-lg"
      onClick={onRetry}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Reintentar
    </MotionButton>
  </MotionDiv>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <MotionDiv
    className="text-center py-12"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <MotionP className="text-xl text-light-secondary dark:text-dark-secondary">
      No se encontraron proyectos con los filtros actuales.
    </MotionP>
    <MotionButton
      className="mt-4 btn-outline"
      onClick={onReset}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95 }}
    >
      Mostrar todos los proyectos
    </MotionButton>
  </MotionDiv>
);

const Projects = () => {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "dev" | "design"
  >("all");

  const iconsCache = useRef<Record<string, string[]>>({});

  const cachedParseStringArray = useCallback((str: string): string[] => {
    if (iconsCache.current[str]) {
      return iconsCache.current[str];
    }
    const result = parseStringArray(str);
    iconsCache.current[str] = result;
    return result;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProjects = async () => {
      try {
        setLoading(true);

        try {
          const response = await fetch(
            "https://drfapiprojects.onrender.com/projectcards/",
            { signal }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }

          const data = await response.json();
          setProjects(data);
          setError(null);
        } catch (fetchError) {
          if (
            fetchError instanceof TypeError &&
            fetchError.message.includes("Content Security Policy")
          ) {
            console.warn("CSP bloqueó la solicitud, usando datos de respaldo");

            const fallbackData = [
              {
                id: 1,
                demoUrl: "https://github.com/davidgdev",
                github: "https://github.com/davidgdev",
                title: "Proyecto de Ejemplo",
                gif: "https://via.placeholder.com/600x400",
                description:
                  "Este es un proyecto de ejemplo que se muestra cuando la API no está disponible.",
                icons: "React,TypeScript,Tailwind",
                cardLang: "es",
                isDesign: false,
              },
              {
                id: 2,
                demoUrl: "https://github.com/davidgdev",
                github: "https://github.com/davidgdev",
                title: "Diseño de Interfaz",
                gif: "https://via.placeholder.com/600x400",
                description:
                  "Un diseño de interfaz de usuario creado con Figma.",
                icons: "Figma,UI/UX",
                cardLang: "es",
                isDesign: true,
              },
            ];

            setProjects(fallbackData);
            setError(null);
          } else {
            throw fetchError;
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Error fetching projects:", err);
          setError(
            err instanceof Error ? err.message : "Unknown error occurred"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    return () => controller.abort();
  }, []);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const techs = cachedParseStringArray(project.icons);
        const matchesTech = filter ? techs.includes(filter) : true;

        let matchesCategory = true;
        if (activeCategory !== "all") {
          matchesCategory =
            activeCategory === "design" ? project.isDesign : !project.isDesign;
        }

        return matchesTech && matchesCategory;
      }),
    [projects, filter, activeCategory, cachedParseStringArray]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => {
      const techs = cachedParseStringArray(project.icons);
      techs.forEach((tech) => tagSet.add(tech));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [projects, cachedParseStringArray]);

  const setActiveFilter = useCallback((tag: string | null) => {
    setFilter(tag);
  }, []);

  const setActiveFilterCategory = useCallback(
    (category: "all" | "dev" | "design") => {
      setActiveCategory(category);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilter(null);
    setActiveCategory("all");
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const ProjectsHeader = useMemo(
    () => (
      <div className="text-center mb-16">
        <MotionP className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gradient">
          Proyectos Destacados
        </MotionP>

        <MotionP className="text-light-secondary dark:text-dark-secondary text-lg max-w-2xl mx-auto mb-8">
          Explora la colección de proyectos en los que he trabajado, desde
          aplicaciones web hasta diseños de interfaz.
        </MotionP>

        <div className="flex justify-center gap-4 mb-8">
          <CategoryButton
            active={activeCategory === "all"}
            onClick={() => setActiveFilterCategory("all")}
          >
            Todos
          </CategoryButton>

          <CategoryButton
            active={activeCategory === "dev"}
            onClick={() => setActiveFilterCategory("dev")}
          >
            Desarrollo
          </CategoryButton>

          <CategoryButton
            active={activeCategory === "design"}
            onClick={() => setActiveFilterCategory("design")}
          >
            Diseño
          </CategoryButton>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-4xl mx-auto">
          <Badge active={filter === null} onClick={() => setActiveFilter(null)}>
            Todas las tecnologías
          </Badge>

          {allTags.map((tag, index) => (
            <Badge
              key={tag}
              active={filter === tag}
              onClick={() => setActiveFilter(tag)}
              index={index}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    ),
    [activeCategory, filter, allTags, setActiveFilterCategory, setActiveFilter]
  );

  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} onRetry={handleRetry} />;
    if (filteredProjects.length === 0)
      return <EmptyState onReset={resetFilters} />;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    );
  };

  return (
    <section
      id="projects"
      className="py-20 bg-light-bg dark:bg-dark-bg"
      data-optimize="true"
    >
      <div className="triangle-divider"></div>

      {ProjectsHeader}
      {renderContent()}
    </section>
  );
};

export default Projects;
