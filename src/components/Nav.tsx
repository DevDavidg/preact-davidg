import { FunctionComponent, JSX } from "preact";
import { useState, useEffect, useRef } from "preact/hooks"; // Removed useCallback if not needed later
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
} from "../utils/motion-components";
import {
  fadeIn,
  initialFadeIn,
  slideUp,
  initialSlideUp,
} from "../hooks/animations";
import useTheme from "../hooks/useTheme";

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

const scrollTransition = {
  type: "tween",
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1],
};

const bubbleBounce = {
  scale: [1, 1.05, 0.95, 1.02, 1],
  transition: {
    times: [0, 0.3, 0.6, 0.8, 1],
    duration: 0.6,
  },
};

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
      transition: scrollTransition,
    }}
    whileHover={{
      scale: 1.1,
      boxShadow:
        theme === "light"
          ? "0 0 15px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.4)"
          : "0 0 15px rgba(124, 58, 237, 0.8), 0 0 30px rgba(124, 58, 237, 0.4)",
      transition: { duration: 0.2 },
    }}
    whileTap={{
      scale: 0.9,
      boxShadow:
        theme === "light"
          ? "0 0 8px rgba(251, 191, 36, 0.5)"
          : "0 0 8px rgba(124, 58, 237, 0.5)",
    }}
    onClick={toggleTheme}
    className={clsx(
      "p-3 rounded-full backdrop-blur-lg shadow-lg relative overflow-hidden",
      theme === "light"
        ? "bg-amber-100/90 text-amber-600 shadow-amber-200/50"
        : "bg-violet-900/90 text-violet-200 shadow-violet-500/30"
    )}
    style={{
      boxShadow:
        theme === "light"
          ? "0 0 10px rgba(251, 191, 36, 0.4), 0 0 20px rgba(251, 191, 36, 0.2)"
          : "0 0 10px rgba(124, 58, 237, 0.4), 0 0 20px rgba(124, 58, 237, 0.2)",
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
        initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: [0.7, 1.2, 1],
          transition: { duration: 0.5, times: [0, 0.5, 1] },
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
        initial={{ opacity: 0, rotate: 45, scale: 0.7 }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: [0.7, 1.2, 1],
          transition: { duration: 0.5, times: [0, 0.5, 1] },
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </MotionSvg>
    )}
    <MotionSpan
      className={clsx(
        "absolute inset-0 pointer-events-none",
        theme === "light"
          ? "bg-gradient-radial from-amber-400/20 via-amber-300/15 to-transparent"
          : "bg-gradient-radial from-violet-500/20 via-violet-400/15 to-transparent"
      )}
      animate={{
        opacity: theme === "light" ? [0.2, 0.4, 0.2] : [0.15, 0.3, 0.15],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
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
      "md:hidden p-3 rounded-full backdrop-blur-md shadow-lg",
      isOpen
        ? "bg-red-100/80 text-red-600 dark:bg-red-900/40 dark:text-red-200"
        : "bg-light-bg/80 dark:bg-dark-bg/40 text-light-primary dark:text-dark-primary"
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
      transition: scrollTransition,
    }}
    whileHover={{
      scale: 1.05,
      boxShadow: "0 0 12px rgba(var(--color-accent-rgb), 0.5)",
    }}
    whileTap={bubbleBounce}
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
        rotate: isOpen ? 90 : 0,
        transition: springTransition,
      }}
    >
      {isOpen ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </MotionSvg>
  </MotionButton>
);

const LogoComponent: FunctionComponent<{
  isScrolled: boolean;
}> = ({ isScrolled }) => (
  <MotionA
    href="#home"
    className="text-2xl font-bold relative z-10 flex items-center"
    initial={initialFadeIn}
    animate={{
      ...fadeIn,
      scale: isScrolled ? 0.95 : 1,
      transition: scrollTransition,
    }}
    whileHover={{
      scale: isScrolled ? 1.05 : 1.03,
      textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.6)",
    }}
    whileTap={bubbleBounce}
    onClick={(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
  >
    <MotionSpan
      className="text-transparent bg-clip-text bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary"
      animate={{
        textShadow: [
          "0 0 2px rgba(var(--color-accent-rgb), 0.3)",
          "0 0 5px rgba(var(--color-accent-rgb), 0.5)",
          "0 0 2px rgba(var(--color-accent-rgb), 0.3)",
        ],
        transition: {
          duration: 2.5,
          repeat: Infinity,
          repeatType: "reverse",
        },
      }}
    >
      Portfolio
    </MotionSpan>
    <MotionSpan
      initial={{ opacity: 0, width: 0 }}
      animate={{
        opacity: 1,
        width: "auto",
      }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="ml-1 text-light-muted dark:text-dark-muted text-sm"
    >
      &lt;/&gt;
    </MotionSpan>
  </MotionA>
);

const MobileNavLink: FunctionComponent<{
  href: string;
  isActive: boolean;
  onClick: (e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => void;
  index: number;
  children: JSX.Element | string | (JSX.Element | string)[];
}> = ({ href, isActive, onClick, index, children }) => (
  <MotionLi
    custom={index}
    initial={initialSlideUp}
    animate={slideUp}
    transition={{
      delay: index * 0.05,
    }}
  >
    <MotionA
      href={href}
      className={clsx(
        "text-xl font-medium uppercase tracking-wider block text-center p-3 relative",
        isActive
          ? "text-light-accent dark:text-dark-accent"
          : "text-light-primary dark:text-dark-primary"
      )}
      onClick={(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
        onClick(e);
        e.currentTarget.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.1)" },
            { transform: "scale(0.95)" },
            { transform: "scale(1.02)" },
            { transform: "scale(1)" },
          ],
          { duration: 400, easing: "ease-in-out" }
        );
      }}
      whileHover={{
        scale: 1.05,
        textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.6)",
        transition: { duration: 0.2 },
      }}
      whileTap={bubbleBounce}
    >
      {children}
      {isActive && (
        <MotionSpan
          className="block h-1 mt-1 bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary rounded-full mx-auto shadow-glow"
          initial={{ width: 0, boxShadow: "none" }}
          animate={{
            width: "50%",
            boxShadow:
              "0 0 8px rgba(var(--color-accent-rgb), 0.7), 0 0 4px rgba(var(--color-accent-rgb), 0.5)",
          }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        />
      )}
    </MotionA>
  </MotionLi>
);

const Nav: FunctionComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevScrollY = useRef<number>(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationReady(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // useEffect for theme initialization is removed, useTheme handles it.
  // checkActiveSection is removed. IntersectionObserver will handle activeLink.

  const menuItems = [
    { href: "#home", label: "Inicio" },
    { href: "#about", label: "Acerca de" },
    { href: "#projects", label: "Proyectos" },
    { href: "#contact", label: "Contacto" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > prevScrollY.current) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      setIsScrolled(currentScrollY > 50);
      prevScrollY.current = currentScrollY;
      // checkActiveSection() removed
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Removed checkActiveSection from dependencies

  useEffect(() => {
    const sectionIds = menuItems.map((item) => item.href.substring(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el) => el !== null) as HTMLElement[];

    if (sections.length === 0) return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(`#${entry.target.id}`);
        }
      });
    };

    const observerOptions = {
      root: null,
      threshold: 0.5,
      // rootMargin: '0px 0px -40% 0px' // Example if needed later
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    // Initial check for active section on load
    const currentActiveSection = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return (
        rect.top <= window.innerHeight * 0.5 &&
        rect.bottom >= window.innerHeight * 0.5
      );
    });
    if (currentActiveSection) {
      setActiveLink(`#${currentActiveSection.id}`);
    }

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
      observer.disconnect();
    };
  }, []); // menuItems is static, so no dependency needed

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Removed useCallback from handleLinkClick, toggleMenu, closeMenu for now,
  // as their dependencies haven't changed and they are not passed to heavily memoized components
  // where useCallback would make a significant difference. If performance issues arise,
  // useCallback can be re-added selectively.
  // The main toggleTheme is now from useTheme hook.

  const handleLinkClick = (e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    if (href) {
      setActiveLink(href);
      setIsMenuOpen(false);

      if (href.startsWith("#")) {
        const element = document.querySelector(href);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        } else {
          console.log("Elemento no encontrado:", href);
        }
      } else if (href === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        console.log("Navegación a:", href);
      }
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const popupAnimation = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.95,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: i * 0.05,
      },
    }),
  };

  return (
    <MotionHeader
      className="fixed top-0 left-0 right-0 w-full h-auto z-50 pointer-events-none"
      style={{
        paddingTop: "1rem",
        paddingBottom: "1rem",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MotionNav
        className={clsx(
          "transition-all duration-300 rounded-xl max-w-6xl overflow-visible mx-auto",
          isScrolled
            ? "py-2 px-4 shadow-lg backdrop-blur-md bg-light-bg/90 dark:bg-dark-bg/90"
            : "py-4 px-8 bg-transparent"
        )}
        style={{
          boxShadow: isScrolled
            ? "0 4px 20px rgba(0, 0, 0, 0.1), 0 8px 30px rgba(0, 0, 0, 0.05)"
            : "none",
          transform:
            isScrolled && scrollDirection === "down"
              ? "translateY(-5px)"
              : "translateY(0)",
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <LogoComponent isScrolled={isScrolled} />

          <MotionUl
            className="hidden md:flex items-center space-x-1 lg:space-x-2"
            initial="hidden"
            animate={isAnimationReady ? "visible" : "hidden"}
          >
            <MotionLi variants={popupAnimation} custom={0} className="relative">
              <MotionA
                href="#home"
                className={clsx(
                  "relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 inline-block",
                  activeLink === "#home"
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
                )}
                whileHover={{
                  scale: 1.05,
                  textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 10 },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLinkClick}
              >
                Inicio
                {activeLink === "#home" && (
                  <MotionSpan
                    className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: "100%",
                      boxShadow:
                        "0 0 10px rgba(var(--color-accent-rgb), 0.7), 0 0 5px rgba(var(--color-accent-rgb), 0.5)",
                    }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  />
                )}
              </MotionA>
            </MotionLi>

            <MotionLi variants={popupAnimation} custom={1} className="relative">
              <MotionA
                href="#about"
                className={clsx(
                  "relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 inline-block",
                  activeLink === "#about"
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
                )}
                whileHover={{
                  scale: 1.05,
                  textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 10 },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLinkClick}
              >
                Acerca de
                {activeLink === "#about" && (
                  <MotionSpan
                    className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: "100%",
                      boxShadow:
                        "0 0 10px rgba(var(--color-accent-rgb), 0.7), 0 0 5px rgba(var(--color-accent-rgb), 0.5)",
                    }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  />
                )}
              </MotionA>
            </MotionLi>

            <MotionLi variants={popupAnimation} custom={2} className="relative">
              <MotionA
                href="#projects"
                className={clsx(
                  "relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 inline-block",
                  activeLink === "#projects"
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
                )}
                whileHover={{
                  scale: 1.05,
                  textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 10 },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLinkClick}
              >
                Proyectos
                {activeLink === "#projects" && (
                  <MotionSpan
                    className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: "100%",
                      boxShadow:
                        "0 0 10px rgba(var(--color-accent-rgb), 0.7), 0 0 5px rgba(var(--color-accent-rgb), 0.5)",
                    }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  />
                )}
              </MotionA>
            </MotionLi>

            <MotionLi variants={popupAnimation} custom={3} className="relative">
              <MotionA
                href="#contact"
                className={clsx(
                  "relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-300 inline-block",
                  activeLink === "#contact"
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
                )}
                whileHover={{
                  scale: 1.05,
                  textShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 10 },
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLinkClick}
              >
                Contacto
                {activeLink === "#contact" && (
                  <MotionSpan
                    className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: "100%",
                      boxShadow:
                        "0 0 10px rgba(var(--color-accent-rgb), 0.7), 0 0 5px rgba(var(--color-accent-rgb), 0.5)",
                    }}
                    transition={{
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  />
                )}
              </MotionA>
            </MotionLi>
          </MotionUl>

          <div className="flex items-center space-x-2 pointer-events-auto">
            <ThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              isScrolled={isScrolled}
            />
            <MobileMenuButton
              isOpen={isMenuOpen}
              onClick={toggleMenu}
              isScrolled={isScrolled}
            />
          </div>
        </div>

        {isScrolled && (
          <MotionDiv
            className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-light-accent via-light-primary to-light-accent dark:from-dark-accent dark:via-dark-primary dark:to-dark-accent overflow-visible"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX:
                document.documentElement.scrollHeight - window.innerHeight > 0
                  ? window.scrollY /
                    (document.documentElement.scrollHeight - window.innerHeight)
                  : 0,
            }}
            style={{
              transformOrigin: "left",
              width: "100%",
              boxShadow: "0 0 8px rgba(var(--color-accent-rgb), 0.7)",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
      </MotionNav>

      {isMenuOpen && (
        <div className="md:hidden">
          <button
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 w-full h-full border-0 p-0"
            onClick={closeMenu}
            aria-label="Cerrar menú"
          />

          <div
            ref={menuRef}
            className="fixed top-0 right-0 w-64 h-full bg-light-bg/95 dark:bg-dark-bg/95 shadow-xl z-50 backdrop-blur-lg"
            style={{
              boxShadow: "-5px 0 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div className="p-6 space-y-6">
              <div className="flex justify-end">
                <button
                  className="text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
                  onClick={closeMenu}
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
                </button>
              </div>

              <ul className="space-y-4">
                <MobileNavLink
                  href="#home"
                  isActive={activeLink === "#home"}
                  onClick={handleLinkClick}
                  index={0}
                >
                  Inicio
                </MobileNavLink>
                <MobileNavLink
                  href="#about"
                  isActive={activeLink === "#about"}
                  onClick={handleLinkClick}
                  index={1}
                >
                  Acerca de
                </MobileNavLink>
                <MobileNavLink
                  href="#projects"
                  isActive={activeLink === "#projects"}
                  onClick={handleLinkClick}
                  index={2}
                >
                  Proyectos
                </MobileNavLink>
                <MobileNavLink
                  href="#contact"
                  isActive={activeLink === "#contact"}
                  onClick={handleLinkClick}
                  index={3}
                >
                  Contacto
                </MobileNavLink>
              </ul>
            </div>
          </div>
        </div>
      )}
    </MotionHeader>
  );
};

export default Nav;
