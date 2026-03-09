import { FunctionComponent } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import {
  MotionDiv,
  MotionH1,
  MotionP,
  MotionA,
  MotionSpan,
  MotionSvg,
} from "../utils/motion-components";
import { useTranslation } from "../hooks/useTranslation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.04,
      delayChildren: 0.02,
      type: "spring",
      damping: 18,
      stiffness: 85,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 16,
      stiffness: 100,
      when: "beforeChildren",
      staggerChildren: 0.012,
      delayChildren: 0.06,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.02,
    },
  },
};

const characterVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    rotateY: 12,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 150,
      duration: 0.4,
    },
  },
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 32, rotateX: 8 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      damping: 18,
      stiffness: 90,
      delay: delay,
    },
  }),
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.5 + i * 0.1,
      duration: 0.4,
      type: "spring",
      damping: 12,
      stiffness: 100,
    },
  }),
  hover: {
    scale: 1.05,
    boxShadow: "0 15px 30px -6px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.97,
  },
};

const scrollIndicatorVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 0.8,
    y: 0,
    transition: {
      delay: 1.2,
      duration: 0.4,
      ease: "easeOut",
    },
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      y: {
        repeat: Infinity,
        duration: 1.8,
        ease: "easeInOut",
      },
    },
  },
};

const AnimatedTitle: FunctionComponent<{
  text: string;
  className: string;
  specialWords: string[];
}> = ({ text, className, specialWords }) => {
  const words = text.split(" ");

  return (
    <MotionH1
      initial="hidden"
      animate="visible"
      variants={titleVariants}
      className={className}
    >
      {words.map((word, wordIndex) => (
        <MotionSpan
          key={`word-${word}-${wordIndex}`}
          variants={wordVariants}
          className={`h-20 inline-block mr-2 md:mr-3 mb-1 md:mb-2 ${
            specialWords.includes(word) ? "text-gradient" : ""
          }`}
        >
          {word.split("").map((char, charIndex) => (
            <MotionSpan
              key={`char-${char}-${wordIndex}-${charIndex}`}
              variants={characterVariants}
              style={{
                display: "inline-block",
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
              }}
            >
              {char}
            </MotionSpan>
          ))}
        </MotionSpan>
      ))}
    </MotionH1>
  );
};

const Hero = () => {
  const { t, locale } = useTranslation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      applyTiltEffectToElements(
        { x: e.clientX - rect.left, y: e.clientY - rect.top },
        rect,
      );
    };

    const currentRef = heroRef.current;
    if (currentRef) {
      currentRef.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [isMobile]);

  const applyTiltEffectToElements = (
    mousePos: { x: number; y: number },
    containerRect: DOMRect,
  ) => {
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const normalizedX = (mousePos.x - centerX) / centerX;
    const normalizedY = (mousePos.y - centerY) / centerY;

    if (contentRef.current?.style) {
      try {
        contentRef.current.style.transform = `
          perspective(1500px) 
          rotateX(${normalizedY}deg) 
          rotateY(${-normalizedX}deg)
          translateZ(10px)
        `;
      } catch {
        //
      }
    }
  };

  const resetTiltEffect = () => {
    if (contentRef.current?.style) {
      try {
        contentRef.current.style.transform = `
          perspective(1500px) 
          rotateX(0deg) 
          rotateY(0deg)
          translateZ(0)
        `;
      } catch {
        //
      }
    }
  };

  const parallax = (strength = 0.02, inverted = false) => {
    if (!heroRef.current || isMobile) return { x: 0, y: 0 };
    const rect = heroRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = (mousePosition.x - centerX) * strength;
    const dy = (mousePosition.y - centerY) * strength;
    return {
      x: inverted ? -dx : dx,
      y: inverted ? -dy : dy,
    };
  };

  const titleText = t("hero.title");
  const specialWords =
    locale === "es"
      ? ["experiencias", "digitales", "impacto"]
      : ["digital", "experiences", "impact"];

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden perspective"
      ref={heroRef}
      onMouseLeave={resetTiltEffect}
    >
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0 bg-gradient-radial from-light-accent/10 to-transparent dark:from-dark-accent/15 dark:to-transparent"
        style={{
          transform: `translate3d(${parallax(0.008).x}px, ${parallax(0.008).y}px, 0)`,
          width: "100%",
          height: "100%",
        }}
      />

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute w-32 h-32 md:w-40 md:h-40 right-[15%] top-[20%]"
          style={{
            transform: `translate3d(${parallax(0.03).x}px, ${parallax(0.02).y}px, 0) translateY(${scrollY * 0.05}px) rotate(${scrollY * 0.02}deg)`,
          }}
        >
          <div className="w-full h-full perspective preserve-3d animate-spin-slow" style={{ transformStyle: "preserve-3d", animationDuration: "10s" }}>
          {[
            { transform: "translateZ(20px)", className: "bg-light-primary/20 dark:bg-dark-primary/20" },
            { transform: "rotateY(180deg) translateZ(20px)", className: "bg-light-primary/20 dark:bg-dark-primary/20" },
            { transform: "rotateY(90deg) translateZ(20px)", className: "bg-light-accent/20 dark:bg-dark-accent/20" },
            { transform: "rotateY(-90deg) translateZ(20px)", className: "bg-light-accent/20 dark:bg-dark-accent/20" },
            { transform: "rotateX(90deg) translateZ(20px)", className: "bg-light-secondary/20 dark:bg-dark-secondary/20" },
            { transform: "rotateX(-90deg) translateZ(20px)", className: "bg-light-secondary/20 dark:bg-dark-secondary/20" },
          ].map((face, i) => (
            <div
              key={i}
              className={`absolute inset-0 ${face.className}`}
              style={{ transform: face.transform, transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            />
          ))}
          </div>
        </div>

        <div
          className="absolute w-24 h-24 md:w-32 md:h-32 left-[10%] bottom-[25%]"
          style={{
            transform: `translate3d(${parallax(0.03, true).x}px, ${parallax(0.02, true).y}px, 0) translateY(${scrollY * -0.05}px) rotate(${scrollY * -0.02}deg)`,
          }}
        >
          <div className="w-full h-full perspective preserve-3d animate-spin-slow" style={{ transformStyle: "preserve-3d", animationDuration: "15s", animationDirection: "reverse" }}>
          {[
            { transform: "translateZ(16px)", className: "bg-light-accent/20 dark:bg-dark-accent/20" },
            { transform: "rotateY(120deg) translateZ(16px)", className: "bg-light-primary/20 dark:bg-dark-primary/20" },
            { transform: "rotateY(240deg) translateZ(16px)", className: "bg-light-secondary/20 dark:bg-dark-secondary/20" },
            { transform: "rotateX(90deg) translateZ(-16px)", className: "bg-light-muted/20 dark:bg-dark-muted/20" },
          ].map((face, i) => (
            <div
              key={i}
              className={`absolute inset-0 ${face.className}`}
              style={{ transform: face.transform, transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            />
          ))}
          </div>
        </div>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="absolute right-[10%] top-1/4 w-64 h-64 md:w-72 md:h-72 rounded-full bg-light-primary/10 dark:bg-dark-primary/10 animate-float"
          style={{
            transform: `translate3d(${parallax(0.05).x}px, ${parallax(0.05).y}px, 0) translateY(${scrollY * 0.05}px)`,
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.05), 0 0 20px rgba(0,0,0,0.02)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full opacity-20">
            <div className="absolute inset-0 animate-clock-rotate" style={{ animationDuration: "30s" }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 h-full w-0.5 bg-light-primary dark:bg-dark-primary origin-bottom"
                  style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg)` }}
                />
              ))}
            </div>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="absolute left-[5%] bottom-1/3 w-36 h-36 md:w-48 md:h-48 rounded-md bg-light-accent/10 dark:bg-dark-accent/10 animate-float-reverse backdrop-blur-sm"
          style={{
            transform: `translate3d(${parallax(0.03, true).x}px, ${parallax(0.03, true).y}px, 0) translateY(${scrollY * -0.03}px)`,
          }}
        >
          <div
            className="absolute inset-2 bg-grid opacity-40"
            style={{ width: "calc(100% - 16px)", height: "calc(100% - 16px)" }}
          />
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 1 }}
          className="absolute left-[15%] bottom-10 w-36 h-36 md:w-56 md:h-56"
          style={{ transform: `translateY(${scrollY * 0.02}px)` }}
        >
          <MotionDiv
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0, -5, 0],
              scale: [1, 1.05, 0.98, 1.02, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
            className="w-full h-full"
            style={{
              clipPath: "polygon(50% 10%, 10% 90%, 90% 90%)",
              backgroundColor: "var(--color-primary)",
              opacity: 0.2,
            }}
          />
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1.2 }}
          className="absolute right-0 top-1/3 w-32 h-32 md:w-48 md:h-48"
          style={{
            transformOrigin: "right center",
            transform: `translate3d(${parallax(0.02).x}px, ${parallax(0.02).y}px, 0) translateY(${scrollY * -0.02}px)`,
          }}
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              backgroundColor: "#555555",
              opacity: 0.1,
            }}
          />
          <MotionDiv
            animate={{
              rotate: [0, 10, -5, 0],
              scale: [1, 1.05, 0.98, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.4, 0.7, 1],
            }}
            className="absolute inset-0"
          />
        </MotionDiv>
      </div>

      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-0 right-0 w-1/2 md:w-1/3 h-1/3 bg-gradient-to-bl from-light-accent/20 dark:from-dark-accent/20 to-transparent z-0"
        style={{
          transform: `translate3d(${parallax(0.01, true).x}px, ${parallax(0.01, true).y}px, 0)`,
          width: "50%",
          height: "33.333%",
        }}
      />

      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute bottom-0 left-0 w-1/2 md:w-1/3 h-1/3 bg-gradient-to-tr from-light-primary/20 dark:from-dark-primary/20 to-transparent z-0"
        style={{
          transform: `translate3d(${parallax(0.01).x}px, ${parallax(0.01).y}px, 0) translateY(${scrollY * 0.04}px)`,
          width: "50%",
          height: "33.333%",
        }}
      />

      <div className="absolute bottom-0 left-0 w-full overflow-hidden z-[1]">
        <div className="dot-pattern" style={{ bottom: "40px", left: "10%", transform: "rotate(10deg)" }} />
        <div className="dot-pattern" style={{ bottom: "20px", right: "5%", transform: "rotate(-5deg)" }} />
      </div>

      <div className="container relative z-10 px-4 md:px-6 pt-28">
        <MotionDiv
          ref={(el: HTMLDivElement | null) => {
            contentRef.current = el;
          }}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-4xl mx-auto perspective preserve-3d"
          style={{ transition: "transform 0.3s ease-out" }}
        >
          <MotionDiv
            variants={slideUpVariants}
            custom={0.1}
            className="mb-4 md:mb-6"
          >
            <span className="badge backdrop-blur-md">
              <MotionSpan
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-2 h-2 md:w-3 md:h-3 bg-light-accent dark:bg-dark-accent rounded-full mr-2"
              ></MotionSpan>
              {t("hero.welcome")}
            </span>
          </MotionDiv>

          <AnimatedTitle
            text={titleText}
            className="text-3xl sm:text-4xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tighter leading-tight perspective preserve-3d"
            specialWords={specialWords}
          />

          <MotionP
            variants={slideUpVariants}
            custom={0.3}
            className="text-lg sm:text-xl md:text-2xl text-light-secondary dark:text-dark-secondary mb-8 md:mb-10 max-w-2xl perspective preserve-3d"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
          >
            {t("hero.subtitle")}
          </MotionP>

          <MotionDiv
            variants={slideUpVariants}
            custom={0.4}
            className="flex flex-col sm:flex-row gap-4 mb-12 md:mb-16 perspective"
          >
            <MotionA
              href="#projects"
              variants={buttonVariants}
              custom={0}
              whileHover="hover"
              whileTap="tap"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                document
                  .querySelector("#projects")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-gradient group w-full sm:w-auto text-center perspective preserve-3d relative overflow-hidden rounded-lg"
              style={{
                transformStyle: "preserve-3d",
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2)",
              }}
            >
              <span className="relative z-10 flex items-center justify-center">
                {t("hero.viewProjects")}
                <MotionSvg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-2"
                  initial={{ x: 0 }}
                  animate={{ x: [0, 5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                    repeatDelay: 1,
                  }}
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </MotionSvg>
              </span>

              <MotionSpan
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%", y: 0 }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />

              <span
                className="absolute inset-0 rounded-lg glow-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  boxShadow: "0 0 15px 2px rgba(255, 255, 255, 0.3)",
                  transform: "translateZ(-1px)",
                }}
              />
            </MotionA>

            <MotionA
              href="#contact"
              variants={buttonVariants}
              custom={1}
              whileHover="hover"
              whileTap="tap"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                document
                  .querySelector("#contact")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-outline group w-full sm:w-auto text-center perspective preserve-3d relative overflow-hidden rounded-lg"
              style={{
                transformStyle: "preserve-3d",
                boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <span className="relative z-10 flex items-center justify-center">
                {t("hero.contact")}
                <MotionSvg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-2"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </MotionSvg>
              </span>

              <MotionSpan
                className="absolute inset-0 bg-light-muted dark:bg-dark-muted"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 0.7 }}
                transition={{ duration: 0.4 }}
                style={{ originX: 0.5, originY: 0.5 }}
              />

              <span
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  boxShadow: "inset 0 0 0 1px rgba(9, 132, 227, 0.5)",
                  transform: "translateZ(-1px)",
                }}
              />
            </MotionA>
          </MotionDiv>

          <MotionDiv
            variants={scrollIndicatorVariants}
            initial="hidden"
            animate={isInView ? ["visible", "bounce"] : "hidden"}
            className="hidden sm:flex absolute bottom-2 left-1/2 transform -translate-x-1/2 flex-col items-center perspective"
          >
            <span className="text-sm text-light-secondary dark:text-dark-secondary mb-2 opacity-70">
              {t("common.scroll")}
            </span>
            <MotionSvg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-light-accent dark:text-dark-accent"
            >
              <path d="M12 5v14"></path>
              <path d="m19 12-7 7-7-7"></path>
            </MotionSvg>
          </MotionDiv>
        </MotionDiv>
      </div>

      <MotionDiv
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex sm:hidden z-30"
      >
        <span className="w-12 h-12 flex items-center justify-center rounded-full bg-light-primary/10 dark:bg-dark-primary/10 backdrop-blur-md animate-bounce shadow-lg">
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
            className="text-light-primary dark:text-dark-primary"
            animate={{ y: [0, 2, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <path d="M12 5v14"></path>
            <path d="m19 12-7 7-7-7"></path>
          </MotionSvg>
        </span>
      </MotionDiv>
    </section>
  );
};

export default Hero;
