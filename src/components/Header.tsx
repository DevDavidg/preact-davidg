import { FunctionComponent, JSX } from "preact";
import { useState, useEffect } from "preact/hooks";
import clsx from "clsx";
import { useTheme } from "../hooks/useTheme";
import {
  MotionA,
  MotionButton,
  MotionDiv,
  MotionNav,
  MotionLi,
  MotionUl,
  MotionSpan,
  MotionSvg,
} from "../utils/motion-components";

const navVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

const logoVariants = {
  normal: { scale: 1 },
  hover: {
    scale: 1.05,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  }),
  hover: {
    scale: 1.1,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

const mobileMenuVariants = {
  open: {
    clipPath: "circle(1000px at calc(100% - 40px) 40px)",
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 20,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  closed: {
    clipPath: "circle(30px at calc(100% - 40px) 40px)",
    opacity: 0,
    transition: {
      delay: 0.3,
      type: "spring",
      stiffness: 400,
      damping: 40,
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const mobileMenuItemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
  closed: {
    opacity: 0,
    y: 50,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

const themeButtonVariants = {
  light: { rotate: 0, scale: 1 },
  dark: { rotate: 180, scale: 1 },
  hover: {
    scale: 1.2,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.9 },
};

const Header: FunctionComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("#home");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = document.querySelectorAll("section[id]");
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop - 100;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        const sectionId = section.getAttribute("id");

        if (
          window.scrollY >= sectionTop &&
          window.scrollY < sectionTop + sectionHeight &&
          sectionId
        ) {
          setActiveLink(`#${sectionId}`);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  const menuItems = [
    { label: "Inicio", href: "#home" },
    { label: "Proyectos", href: "#projects" },
    { label: "Sobre mí", href: "#about" },
    { label: "Contacto", href: "#contact" },
  ];

  const handleLinkClick = (href: string) => {
    setActiveLink(href);
    setIsMenuOpen(false);

    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <MotionNav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "py-2 bg-light-bg/90 dark:bg-dark-bg/90 backdrop-blur-md shadow-lg"
          : "py-6"
      )}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <MotionA
          href="#home"
          className="text-2xl font-extrabold relative z-10 flex items-center"
          variants={logoVariants}
          whileHover="hover"
          initial="normal"
          onClick={(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            handleLinkClick("#home");
          }}
        >
          <MotionSpan className="text-transparent bg-clip-text bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary">
            Portfolio
          </MotionSpan>
          <MotionSpan
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ delay: 1, duration: 0.5 }}
            className="ml-1 text-light-muted dark:text-dark-muted text-sm"
          >
            &lt;/&gt;
          </MotionSpan>
        </MotionA>

        <MotionUl className="hidden md:flex items-center space-x-1">
          {menuItems.map((item, i) => (
            <MotionLi
              key={item.href}
              custom={i}
              variants={menuItemVariants}
              initial="hidden"
              animate="visible"
            >
              <MotionA
                href={item.href}
                className={clsx(
                  "relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors duration-300",
                  activeLink === item.href
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-primary dark:text-dark-primary hover:text-light-accent dark:hover:text-dark-accent"
                )}
                whileHover="hover"
                onClick={(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleLinkClick(item.href);
                }}
              >
                {item.label}
              </MotionA>
            </MotionLi>
          ))}
        </MotionUl>

        <div className="flex items-center space-x-4">
          <MotionButton
            variants={themeButtonVariants}
            initial={theme === "light" ? "light" : "dark"}
            animate={theme === "light" ? "light" : "dark"}
            whileHover="hover"
            whileTap="tap"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-light-bg dark:bg-dark-bg shadow-lg"
          >
            <MotionSvg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-light-primary dark:text-dark-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </MotionSvg>
          </MotionButton>

          <MotionButton
            className="md:hidden p-2 rounded-full bg-light-bg dark:bg-dark-bg shadow-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MotionSvg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-light-primary dark:text-dark-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </MotionSvg>
          </MotionButton>
        </div>
      </div>

      <MotionDiv
        className="fixed top-0 right-0 w-full h-screen bg-light-bg dark:bg-dark-bg md:hidden"
        variants={mobileMenuVariants}
        initial="closed"
        animate={isMenuOpen ? "open" : "closed"}
      >
        <MotionUl className="flex flex-col items-center justify-center h-full space-y-8">
          {menuItems.map((item, i) => (
            <MotionLi
              key={item.href}
              variants={mobileMenuItemVariants}
              custom={i}
            >
              <MotionA
                href={item.href}
                className={clsx(
                  "text-2xl font-medium uppercase tracking-wider",
                  activeLink === item.href
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-primary dark:text-dark-primary"
                )}
                onClick={(e: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  handleLinkClick(item.href);
                }}
              >
                {item.label}
              </MotionA>
            </MotionLi>
          ))}
        </MotionUl>
      </MotionDiv>
    </MotionNav>
  );
};

export default Header;
