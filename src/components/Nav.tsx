import { FunctionComponent } from "preact";
import type { AnchorHTMLAttributes, ComponentType } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { useRouter, Link } from "preact-router";

const NavLink = Link as ComponentType<AnchorHTMLAttributes<HTMLAnchorElement>>;
import useTheme from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import {
  MotionHeader,
  MotionButton,
  MotionA,
  MotionDiv,
  MotionSpan,
} from "../utils/motion-components";
import { Variants } from "framer-motion";

const SCROLL_THRESHOLD = 60;
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const headerVariants: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 0.8,
    },
  },
};

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: 0.05 * i,
    },
  }),
};

const linkVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
  tap: { scale: 0.97 },
};

const LanguageToggle: FunctionComponent<{
  locale: string;
  setLocale: (locale: string) => void;
}> = ({ locale, setLocale }) => {
  const isEs = locale === "es";

  return (
    <div
      className="flex rounded-full p-0.5 bg-light-bg-tertiary/80 dark:bg-dark-bg-tertiary/80 backdrop-blur-sm border border-light-border/50 dark:border-dark-border/50"
      aria-label="Language selector"
    >
      <MotionButton
        type="button"
        onClick={() => setLocale("es")}
        aria-label="Cambiar a español"
        variants={linkVariants}
        whileHover="hover"
        whileTap="tap"
        className={`relative px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors ${
          isEs
            ? "text-light-accent dark:text-dark-accent"
            : "text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary"
        }`}
      >
        {isEs && (
          <MotionSpan
            layoutId="lang-pill"
            className="absolute inset-0 rounded-full bg-light-bg dark:bg-dark-bg shadow-sm border border-light-border/50 dark:border-dark-border/50"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">ES</span>
      </MotionButton>
      <MotionButton
        type="button"
        onClick={() => setLocale("en")}
        aria-label="Switch to English"
        variants={linkVariants}
        whileHover="hover"
        whileTap="tap"
        className={`relative px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors ${
          isEs
            ? "text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary"
            : "text-light-accent dark:text-dark-accent"
        }`}
      >
        {!isEs && (
          <MotionSpan
            layoutId="lang-pill"
            className="absolute inset-0 rounded-full bg-light-bg dark:bg-dark-bg shadow-sm border border-light-border/50 dark:border-dark-border/50"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">EN</span>
      </MotionButton>
    </div>
  );
};

const ThemeToggle: FunctionComponent<{
  theme: string;
  toggleTheme: () => void;
}> = ({ theme, toggleTheme }) => {
  const isLight = theme === "light";
  const label = isLight ? "Switch to dark" : "Switch to light";

  return (
    <MotionButton
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      variants={linkVariants}
      whileHover="hover"
      whileTap="tap"
      className="relative p-2.5 rounded-xl text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent bg-light-bg-tertiary/50 dark:bg-dark-bg-tertiary/50 hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 border border-transparent hover:border-light-accent/20 dark:hover:border-dark-accent/20 transition-colors"
    >
      <MotionSpan
        animate={{ rotate: isLight ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="block"
      >
        {isLight ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </MotionSpan>
    </MotionButton>
  );
};

const navLinks = [
  { href: "/", key: "navigation.home" },
  { href: "/projects", key: "navigation.projects" },
  { href: "/about", key: "navigation.about" },
  { href: "/contact", key: "navigation.contact" },
];

const Nav: FunctionComponent = () => {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [router] = useRouter();
  const currentPath =
    router?.url?.split("?")[0] ??
    (typeof window === "undefined" ? "/" : window.location.pathname);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    const reduced = prefersReducedMotion();

    if (y > 20) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }

    if (reduced) {
      setIsVisible(true);
      setLastScrollY(y);
      return;
    }

    if (y < SCROLL_THRESHOLD) {
      setIsVisible(true);
    } else if (y > lastScrollY && y > 100) {
      setIsVisible(false);
    } else if (y < lastScrollY) {
      setIsVisible(true);
    }

    setLastScrollY(y);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentPath]);

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-light-accent focus:dark:bg-dark-accent focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        {t("accessibility.skipToContent")}
      </a>
      <MotionHeader
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={headerVariants}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav
          className={`mx-4 mt-3 rounded-2xl transition-all duration-300 ${
            isScrolled
              ? "bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-xl border border-light-border/40 dark:border-dark-border/40 shadow-lg shadow-light-primary/5 dark:shadow-dark-primary/5"
              : "bg-transparent"
          }`}
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-3 md:px-6">
            <MotionA
              href="/"
              variants={navItemVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-lg font-bold text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              {t("navigation.portfolio")}
            </MotionA>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, i) => {
                const isActive =
                  currentPath === link.href ||
                  (link.href !== "/" && currentPath.startsWith(link.href));
                return (
                  <MotionDiv
                    key={link.href}
                    variants={navItemVariants}
                    custom={i + 1}
                    initial="hidden"
                    animate="visible"
                  >
                    <NavLink
                      href={link.href}
                      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "text-light-accent dark:text-dark-accent font-semibold"
                          : "text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary hover:bg-light-bg-tertiary/50 dark:hover:bg-dark-bg-tertiary/50"
                      }`}
                    >
                      {t(link.key)}
                      {isActive && (
                        <MotionSpan
                          layoutId="nav-underline"
                          className="absolute bottom-1 left-4 right-4 h-0.5 bg-light-accent dark:bg-dark-accent rounded-full"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </NavLink>
                  </MotionDiv>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle locale={locale} setLocale={setLocale} />
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

              <MotionButton
                type="button"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label={isMobileOpen ? t("common.close") : t("common.menu")}
                aria-expanded={isMobileOpen}
                aria-controls="mobile-nav"
                variants={linkVariants}
                whileTap="tap"
                className="md:hidden p-2.5 rounded-xl text-light-primary dark:text-dark-primary hover:bg-light-bg-tertiary/50 dark:hover:bg-dark-bg-tertiary/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${isMobileOpen ? "rotate-90" : ""}`}
                >
                  {isMobileOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" />
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </MotionButton>
            </div>
          </div>
        </nav>

        <MotionDiv
          id="mobile-nav"
          initial={false}
          animate={{
            height: isMobileOpen ? "auto" : 0,
            opacity: isMobileOpen ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="md:hidden overflow-hidden"
        >
          <div
            className={`mx-4 mb-3 rounded-2xl py-4 px-4 bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-xl border border-light-border/40 dark:border-dark-border/40 shadow-lg ${
              isMobileOpen ? "block" : "hidden"
            }`}
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link, i) => (
                <MotionA
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isMobileOpen ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.05 * i }}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    currentPath === link.href ||
                    (link.href !== "/" && currentPath.startsWith(link.href))
                      ? "text-light-accent dark:text-dark-accent bg-light-accent/10 dark:bg-dark-accent/10"
                      : "text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary hover:bg-light-bg-tertiary/50 dark:hover:bg-dark-bg-tertiary/50"
                  }`}
                >
                  {t(link.key)}
                </MotionA>
              ))}
            </nav>
          </div>
        </MotionDiv>
      </MotionHeader>
    </>
  );
};

export default Nav;
