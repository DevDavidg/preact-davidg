import { FunctionComponent, JSX } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import clsx from "clsx";
import {
  MotionA,
  MotionButton,
  MotionDiv,
  MotionNav,
  MotionLi,
  MotionUl,
  MotionSpan,
  MotionSvg,
  MotionHeader,
  MotionPath,
} from "../utils/motion-components";
import { fadeIn, initialFadeIn } from "../hooks/animations";
import useTheme from "../hooks/useTheme";

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

const fastSpring = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};

const smoothTransition = {
  type: "tween",
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

const bubbleBounce = {
  scale: [1, 1.05, 0.98, 1.02, 1],
  transition: {
    times: [0, 0.2, 0.5, 0.8, 1],
    duration: 0.4,
  },
};

const menuItems = [
  { href: "#home", label: "Inicio" },
  { href: "#about", label: "Acerca de" },
  { href: "#projects", label: "Proyectos" },
  { href: "#contact", label: "Contacto" },
];

const ThemeToggle: FunctionComponent<{
  theme: string;
  toggleTheme: () => void;
  isScrolled: boolean;
}> = ({ theme, toggleTheme, isScrolled }) => (
  <MotionButton
    initial={initialFadeIn}
    animate={{
      ...fadeIn,
      scale: isScrolled ? 0.9 : 1,
      transition: smoothTransition,
    }}
    whileHover={{
      scale: 1.1,
      rotate: 5,
      boxShadow:
        theme === "light"
          ? "0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)"
          : "0 0 20px rgba(124, 58, 237, 0.8), 0 0 40px rgba(124, 58, 237, 0.4)",
      transition: { duration: 0.2 },
    }}
    whileTap={{
      scale: 0.9,
      rotate: -5,
      transition: { duration: 0.1 },
    }}
    onClick={toggleTheme}
    className={clsx(
      "p-3 rounded-full backdrop-blur-xl shadow-lg relative overflow-hidden border",
      theme === "light"
        ? "bg-amber-50/95 text-amber-600 shadow-amber-200/50 border-amber-200/30"
        : "bg-violet-950/95 text-violet-200 shadow-violet-500/30 border-violet-500/20"
    )}
    style={{
      boxShadow:
        theme === "light"
          ? "0 4px 20px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)"
          : "0 4px 20px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    }}
    aria-label={
      theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    }
  >
    {theme === "light" ? (
      <MotionSvg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: [0.5, 1.3, 1],
          transition: { duration: 0.6, times: [0, 0.6, 1] },
        }}
      >
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </MotionSvg>
    ) : (
      <MotionSvg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: [0.5, 1.3, 1],
          transition: { duration: 0.6, times: [0, 0.6, 1] },
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </MotionSvg>
    )}
    <MotionSpan
      className={clsx(
        "absolute inset-0 pointer-events-none rounded-full",
        theme === "light"
          ? "bg-gradient-radial from-amber-400/30 via-amber-300/20 to-transparent"
          : "bg-gradient-radial from-violet-500/30 via-violet-400/20 to-transparent"
      )}
      animate={{
        opacity: theme === "light" ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </MotionButton>
);

const MobileMenuButton: FunctionComponent<{
  isOpen: boolean;
  onClick: () => void;
  isScrolled: boolean;
}> = ({ isOpen, onClick, isScrolled }) => (
  <MotionButton
    className={clsx(
      "md:hidden p-3 rounded-full backdrop-blur-xl shadow-lg border relative overflow-hidden",
      isOpen
        ? "bg-red-50/95 text-red-600 dark:bg-red-950/95 dark:text-red-300 border-red-200/30 dark:border-red-500/20"
        : "bg-light-bg/95 dark:bg-dark-bg/95 text-light-primary dark:text-dark-primary border-gray-200/30 dark:border-gray-700/30"
    )}
    onClick={() => {
      onClick();
      const button = document.activeElement as HTMLElement;
      if (button) button.blur();
    }}
    initial={initialFadeIn}
    animate={{
      ...fadeIn,
      scale: isScrolled ? 0.9 : 1,
      transition: smoothTransition,
    }}
    whileHover={{
      scale: 1.05,
      rotate: isOpen ? -5 : 5,
      boxShadow: isOpen
        ? "0 0 15px rgba(239, 68, 68, 0.5)"
        : "0 0 15px rgba(var(--color-accent-rgb), 0.5)",
      transition: { duration: 0.2 },
    }}
    whileTap={{
      scale: 0.95,
      transition: { duration: 0.1 },
    }}
    aria-label={isOpen ? "Close menu" : "Open menu"}
    aria-expanded={isOpen}
  >
    <MotionSvg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      animate={{
        rotate: isOpen ? 180 : 0,
        transition: fastSpring,
      }}
    >
      {isOpen ? (
        <MotionPath
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <MotionPath
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </MotionSvg>
    <MotionSpan
      className="absolute inset-0 rounded-full opacity-0"
      animate={{
        opacity: isOpen ? [0, 0.3, 0] : 0,
        scale: isOpen ? [0.8, 1.2, 0.8] : 1,
      }}
      transition={{
        duration: 1,
        repeat: isOpen ? Infinity : 0,
      }}
      style={{
        background: isOpen
          ? "radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)"
          : "none",
      }}
    />
  </MotionButton>
);

const LogoComponent: FunctionComponent<{
  isScrolled: boolean;
  setActiveLink: (link: string) => void;
  scrollToSection: (sectionId: string, isFromMenu?: boolean) => boolean;
}> = ({ isScrolled, setActiveLink, scrollToSection }) => (
  <MotionA
    href="#home"
    className="text-2xl font-bold relative z-10 flex items-center group"
    initial={initialFadeIn}
    animate={{
      ...fadeIn,
      scale: isScrolled ? 0.95 : 1,
      transition: smoothTransition,
    }}
    whileHover={{
      scale: isScrolled ? 1.05 : 1.03,
      transition: fastSpring,
    }}
    whileTap={bubbleBounce}
    onClick={(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setActiveLink("#home");
      scrollToSection("home");
    }}
  >
    <MotionSpan
      className="text-transparent bg-clip-text bg-gradient-to-r from-light-accent via-light-primary to-light-accent dark:from-dark-accent dark:via-dark-primary dark:to-dark-accent"
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundSize: "200% 200%",
        textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.3)",
      }}
    >
      Portfolio
    </MotionSpan>
    <MotionSpan
      initial={{ opacity: 0, width: 0, x: -10 }}
      animate={{
        opacity: 1,
        width: "auto",
        x: 0,
      }}
      transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
      className="ml-2 text-light-muted dark:text-dark-muted text-lg font-mono group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors duration-300"
    >
      &lt;/&gt;
    </MotionSpan>
    <MotionSpan
      className="absolute -inset-2 bg-gradient-to-r from-light-accent/0 via-light-accent/10 to-light-accent/0 dark:from-dark-accent/0 dark:via-dark-accent/10 dark:to-dark-accent/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </MotionA>
);

const NavLink: FunctionComponent<{
  href: string;
  isActive: boolean;
  onClick: (e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => void;
  children: JSX.Element | string | (JSX.Element | string)[];
  index: number;
}> = ({ href, isActive, onClick, children, index }) => (
  <MotionLi className="relative group">
    <MotionA
      href={href}
      className={clsx(
        "relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 inline-block rounded-lg",
        isActive
          ? "text-light-accent dark:text-dark-accent"
          : "text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.1, duration: 0.3 },
      }}
      whileHover={{
        scale: 1.05,
        y: -2,
        textShadow: "0 0 12px rgba(var(--color-accent-rgb), 0.6)",
        transition: fastSpring,
      }}
      whileTap={{
        scale: 0.95,
        y: 0,
        transition: { duration: 0.1 },
      }}
      onClick={onClick}
    >
      {children}
      <MotionSpan
        className="absolute inset-0 bg-gradient-to-r from-light-accent/0 via-light-accent/10 to-light-accent/0 dark:from-dark-accent/0 dark:via-dark-accent/10 dark:to-dark-accent/0 rounded-lg opacity-0 group-hover:opacity-100"
        initial={{ scale: 0.8 }}
        whileHover={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      />
      {isActive && (
        <MotionSpan
          className="absolute bottom-0 left-1/2 h-1 bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary rounded-full"
          initial={{ width: 0, x: "-50%" }}
          animate={{
            width: "80%",
            boxShadow: [
              "0 0 5px rgba(var(--color-accent-rgb), 0.5)",
              "0 0 15px rgba(var(--color-accent-rgb), 0.8)",
              "0 0 5px rgba(var(--color-accent-rgb), 0.5)",
            ],
          }}
          transition={{
            width: { duration: 0.3, type: "spring", stiffness: 300 },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      )}
    </MotionA>
  </MotionLi>
);

const MobileNavLink: FunctionComponent<{
  href: string;
  isActive: boolean;
  onClick: (e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => void;
  index: number;
  children: JSX.Element | string | (JSX.Element | string)[];
}> = ({ href, isActive, onClick, index, children }) => (
  <MotionLi
    initial={{ opacity: 0, x: 50, scale: 0.9 }}
    animate={{
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        type: "spring",
        stiffness: 300,
      },
    }}
    exit={{
      opacity: 0,
      x: 50,
      scale: 0.9,
      transition: { duration: 0.2 },
    }}
  >
    <MotionA
      href={href}
      className={clsx(
        "text-xl font-medium uppercase tracking-wider block text-left p-4 relative rounded-xl border-l-4 group",
        isActive
          ? "text-light-accent dark:text-dark-accent bg-light-accent/5 dark:bg-dark-accent/5 border-light-accent dark:border-dark-accent"
          : "text-light-primary dark:text-dark-primary border-transparent hover:border-light-accent/50 dark:hover:border-dark-accent/50 hover:bg-light-accent/5 dark:hover:bg-dark-accent/5"
      )}
      onClick={onClick}
      whileHover={{
        x: 8,
        backgroundColor: isActive
          ? "rgba(var(--color-accent-rgb), 0.1)"
          : "rgba(var(--color-accent-rgb), 0.05)",
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.98,
        x: 4,
        transition: { duration: 0.1 },
      }}
    >
      <MotionSpan className="relative z-10">{children}</MotionSpan>
      <MotionSpan
        className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.58L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.58Z" />
        </svg>
      </MotionSpan>
      {isActive && (
        <MotionSpan
          className="absolute inset-0 bg-gradient-to-r from-light-accent/10 to-transparent dark:from-dark-accent/10 dark:to-transparent rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            background: [
              "linear-gradient(to right, rgba(var(--color-accent-rgb), 0.1), transparent)",
              "linear-gradient(to right, rgba(var(--color-accent-rgb), 0.15), transparent)",
              "linear-gradient(to right, rgba(var(--color-accent-rgb), 0.1), transparent)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </MotionA>
  </MotionLi>
);

const ProgressBar: FunctionComponent<{ isScrolled: boolean }> = ({
  isScrolled,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const availableSections = menuItems.map((item) => {
      const sectionId = item.href.substring(1);
      const element = document.getElementById(sectionId);
      return {
        id: sectionId,
        exists: !!element,
        href: item.href,
      };
    });
    console.log("Available sections:", availableSections);
  }, []);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = scrollHeight > 0 ? scrolled / scrollHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  if (!isScrolled) return null;

  return (
    <MotionDiv
      className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-light-accent via-light-primary to-light-accent dark:from-dark-accent dark:via-dark-primary dark:to-dark-accent overflow-visible rounded-full"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{
        scaleX: scrollProgress,
        opacity: 1,
        boxShadow: [
          "0 0 8px rgba(var(--color-accent-rgb), 0.5)",
          "0 0 16px rgba(var(--color-accent-rgb), 0.8)",
          "0 0 8px rgba(var(--color-accent-rgb), 0.5)",
        ],
      }}
      style={{
        transformOrigin: "left",
        width: "100%",
      }}
      transition={{
        scaleX: { type: "spring", stiffness: 300, damping: 30 },
        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
    />
  );
};

const Nav: FunctionComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");
  const [isVisible, setIsVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const scrollToSection = (sectionId: string, isFromMenu = false) => {
    const element = document.getElementById(sectionId);
    const delay = isFromMenu ? 300 : 0;

    if (element) {
      const navHeight = isScrolled ? 80 : 100;
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight;

      setTimeout(() => {
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
      }, delay);

      return true;
    } else {
      if (sectionId === "home") {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, delay);
        return true;
      }
      return false;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      setIsScrolled(currentScrollY > 20);

      if (scrollDifference > 5) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const sectionIds = menuItems.map((item) => item.href.substring(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el) => el !== null) as HTMLElement[];

    if (sections.length === 0) return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);

      if (visibleEntries.length > 0) {
        const mostVisible = visibleEntries.reduce((prev, current) =>
          current.intersectionRatio > prev.intersectionRatio ? current : prev
        );
        setActiveLink(`#${mostVisible.target.id}`);
      }
    };

    const observerOptions = {
      root: null,
      threshold: [0.1, 0.3, 0.5, 0.7],
      rootMargin: "-10% 0px -10% 0px",
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleLinkClick = (e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");

    if (href) {
      setActiveLink(href);
      setIsMenuOpen(false);

      if (href.startsWith("#")) {
        const element = document.querySelector(href);
        if (element) {
          const navHeight = isScrolled ? 80 : 100;
          const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    }
  };

  return (
    <MotionHeader
      className="fixed top-0 left-0 right-0 w-full z-50 pointer-events-none"
      style={{ paddingTop: "1rem", paddingBottom: "1rem" }}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: 1,
        y: isVisible ? 0 : -100,
        transition: {
          opacity: { duration: 0.3 },
          y: { duration: 0.4, type: "spring", stiffness: 300, damping: 30 },
        },
      }}
    >
      <MotionNav
        className={clsx(
          "transition-all duration-500 rounded-2xl max-w-7xl mx-auto relative overflow-visible border",
          isScrolled
            ? "py-3 px-6 shadow-2xl backdrop-blur-xl bg-light-bg/95 dark:bg-dark-bg/95 border-gray-200/20 dark:border-gray-700/20"
            : "py-4 px-8 bg-transparent border-transparent"
        )}
        style={{
          boxShadow: isScrolled
            ? "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "none",
        }}
        animate={{
          scale: isScrolled ? 0.98 : 1,
          transition: smoothTransition,
        }}
      >
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <LogoComponent
            isScrolled={isScrolled}
            setActiveLink={setActiveLink}
            scrollToSection={scrollToSection}
          />

          <MotionUl className="hidden md:flex items-center space-x-2">
            {menuItems.map((item, index) => (
              <NavLink
                key={item.href}
                href={item.href}
                isActive={activeLink === item.href}
                onClick={handleLinkClick}
                index={index}
              >
                {item.label}
              </NavLink>
            ))}
          </MotionUl>

          <div className="flex items-center space-x-3 pointer-events-auto">
            <ThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              isScrolled={isScrolled}
            />
            <MobileMenuButton
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              isScrolled={isScrolled}
            />
          </div>
        </div>

        <ProgressBar isScrolled={isScrolled} />
      </MotionNav>

      {isMenuOpen && (
        <MotionDiv
          className="md:hidden fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MotionDiv
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsMenuOpen(false)}
          />

          <MotionDiv
            ref={menuRef}
            className="absolute top-0 right-0 w-80 h-full bg-light-bg/98 dark:bg-dark-bg/98 shadow-2xl backdrop-blur-xl border-l border-gray-200/20 dark:border-gray-700/20"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4,
            }}
            style={{
              boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div className="p-8 space-y-8 h-full overflow-y-auto">
              <div className="flex justify-between items-center">
                <MotionSpan
                  className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Menú
                </MotionSpan>
                <MotionButton
                  className="p-2 rounded-full text-light-muted dark:text-dark-muted hover:text-light-accent dark:hover:text-dark-accent hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </MotionButton>
              </div>

              <MotionDiv
                className="h-px bg-gradient-to-r from-transparent via-light-accent/30 to-transparent dark:via-dark-accent/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              />

              <MotionUl className="space-y-3">
                {menuItems.map((item, index) => (
                  <MobileNavLink
                    key={item.href}
                    href={item.href}
                    isActive={activeLink === item.href}
                    onClick={handleLinkClick}
                    index={index}
                  >
                    {item.label}
                  </MobileNavLink>
                ))}
              </MotionUl>

              <MotionDiv
                className="h-px bg-gradient-to-r from-transparent via-light-accent/30 to-transparent dark:via-dark-accent/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              />

              <MotionDiv
                className="flex flex-col space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                <MotionSpan className="text-sm text-light-muted dark:text-dark-muted font-medium">
                  Cambiar tema
                </MotionSpan>
                <div className="flex justify-center">
                  <ThemeToggle
                    theme={theme}
                    toggleTheme={toggleTheme}
                    isScrolled={false}
                  />
                </div>
              </MotionDiv>

              <MotionDiv
                className="absolute bottom-8 left-8 right-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                <MotionDiv className="text-center">
                  <MotionSpan className="text-xs text-light-muted dark:text-dark-muted">
                    © 2024 Portfolio
                  </MotionSpan>
                  <MotionDiv
                    className="mt-2 h-1 bg-gradient-to-r from-light-accent/20 via-light-accent to-light-accent/20 dark:from-dark-accent/20 dark:via-dark-accent dark:to-dark-accent/20 rounded-full"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  />
                </MotionDiv>
              </MotionDiv>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </MotionHeader>
  );
};

export default Nav;
