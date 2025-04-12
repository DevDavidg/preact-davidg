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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 30, rotateX: 20 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 120,
      when: "beforeChildren",
      staggerChildren: 0.015,
      delayChildren: 0.1,
    },
  },
};

const characterVariants = {
  hidden: { opacity: 0, y: 10, rotateY: 45 },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: {
      type: "spring",
      damping: 8,
      stiffness: 300,
      duration: 0.2,
    },
  },
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 30, rotateX: 10 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 80,
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

const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
    }[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const createParticles = () => {
      const particleCount = Math.min(window.innerWidth / 10, 100);

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          color: "#888888",
          alpha: Math.random() * 0.6 + 0.2,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(136, 136, 136, ${p.alpha})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      });

      requestAnimationFrame(drawParticles);
    };

    createParticles();
    drawParticles();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 opacity-40"
      style={{ mixBlendMode: "soft-light" }}
    />
  );
};

const AnimatedTitle: FunctionComponent<{
  text: string;
  className: string;
  specialWords: string[];
}> = ({ text, className, specialWords }) => {
  const words = text.split(" ");

  return (
    <MotionH1 variants={titleVariants} className={className}>
      {words.map((word, wordIndex) => (
        <MotionSpan
          key={`word-${word}-${wordIndex}`}
          className={`inline-block mr-2 md:mr-3 mb-1 md:mb-2 ${
            specialWords.includes(word) ? "text-gradient" : ""
          }`}
        >
          {word.split("").map((char, charIndex) => (
            <MotionSpan
              key={`char-${char}-${wordIndex}-${charIndex}`}
              variants={characterVariants}
              style={{ display: "inline-block", transformOrigin: "bottom" }}
              custom={(wordIndex + 1) * 0.02 + charIndex * 0.005}
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const refElementsAssigned = useRef(false);

  useEffect(() => {
    cardRefs.current = Array(5).fill(null);

    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", checkDarkMode);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", checkDarkMode);
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
      const newPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setMousePosition(newPosition);

      if (refElementsAssigned.current) {
        applyTiltEffectToElements(newPosition, rect);
      }
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

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (refElementsAssigned.current) {
        applyScrollParallax();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const applyTiltEffectToElements = (
    mousePos: { x: number; y: number },
    containerRect: DOMRect
  ) => {
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    const normalizedX = (mousePos.x - centerX) / centerX;
    const normalizedY = (mousePos.y - centerY) / centerY;

    for (let index = 0; index < cardRefs.current.length; index++) {
      const ref = cardRefs.current[index];
      if (!ref?.style) continue;

      try {
        const sensitivityX = 5 - index * 0.5;
        const sensitivityY = 5 - index * 0.5;
        const rotateY = -normalizedX * sensitivityX;
        const rotateX = normalizedY * sensitivityY;

        ref.style.transform = `
          perspective(1200px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          scale3d(1, 1, 1)
        `;
      } catch (e) {}
    }

    if (contentRef.current?.style) {
      try {
        contentRef.current.style.transform = `
          perspective(1500px) 
          rotateX(${normalizedY * 1}deg) 
          rotateY(${-normalizedX * 1}deg)
          translateZ(10px)        `;
      } catch (e) {}
    }
  };

  const resetTiltEffect = () => {
    for (const ref of cardRefs.current) {
      if (!ref?.style) continue;

      try {
        ref.style.transform = `
          perspective(1200px)
          rotateX(0deg)
          rotateY(0deg)
          scale3d(1, 1, 1)
        `;
      } catch (e) {}
    }

    if (contentRef.current?.style) {
      try {
        contentRef.current.style.transform = `
          perspective(1500px) 
          rotateX(0deg) 
          rotateY(0deg)
          translateZ(0)
        `;
      } catch (e) {}
    }
  };

  const applyScrollParallax = () => {
    const scrollFactor = window.scrollY * 0.003;

    for (let index = 0; index < cardRefs.current.length; index++) {
      const ref = cardRefs.current[index];
      if (!ref?.style) continue;

      try {
        const speed = 0.1 * (index + 1);
        const yOffset = window.scrollY * speed;
        const rotate = Math.sin(scrollFactor) * (index + 1) * 2;

        ref.style.transform = `translateY(${-yOffset}px) rotate(${rotate}deg)`;
      } catch (e) {}
    }
  };

  const calculateMouseParallax = (strength = 0.02, inverted = false) => {
    if (!heroRef.current || isMobile) return { x: 0, y: 0, z: 0 };

    const rect = heroRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (mousePosition.x - centerX) * strength;
    const deltaY = (mousePosition.y - centerY) * strength;
    const deltaZ =
      Math.abs((mousePosition.x - centerX) * (mousePosition.y - centerY)) *
      0.0001;

    return {
      x: inverted ? -deltaX : deltaX,
      y: inverted ? -deltaY : deltaY,
      z: deltaZ,
    };
  };

  const titleText = "Diseñando experiencias digitales con impacto";
  const specialWords = ["experiencias", "digitales", "impacto"];

  const shapes3D = [
    {
      id: 3,
      type: "cube",
      className: "absolute w-32 h-32 md:w-40 md:h-40 perspective preserve-3d",
      style: { right: "15%", top: "20%", opacity: 0.15 },
      faces: [
        {
          transform: "translateZ(20px)",
          className: "bg-light-primary/20 dark:bg-dark-primary/20",
        },
        {
          transform: "rotateY(180deg) translateZ(20px)",
          className: "bg-light-primary/20 dark:bg-dark-primary/20",
        },
        {
          transform: "rotateY(90deg) translateZ(20px)",
          className: "bg-light-accent/20 dark:bg-dark-accent/20",
        },
        {
          transform: "rotateY(-90deg) translateZ(20px)",
          className: "bg-light-accent/20 dark:bg-dark-accent/20",
        },
        {
          transform: "rotateX(90deg) translateZ(20px)",
          className: "bg-light-secondary/20 dark:bg-dark-secondary/20",
        },
        {
          transform: "rotateX(-90deg) translateZ(20px)",
          className: "bg-light-secondary/20 dark:bg-dark-secondary/20",
        },
      ],
    },
    {
      type: "pyramid",
      className: "absolute w-24 h-24 md:w-32 md:h-32 perspective preserve-3d",
      style: { left: "10%", bottom: "25%", opacity: 0.15 },
      faces: [
        {
          transform: "translateZ(16px)",
          className: "bg-light-accent/20 dark:bg-dark-accent/20",
        },
        {
          transform: "rotateY(120deg) translateZ(16px)",
          className: "bg-light-primary/20 dark:bg-dark-primary/20",
        },
        {
          transform: "rotateY(240deg) translateZ(16px)",
          className: "bg-light-secondary/20 dark:bg-dark-secondary/20",
        },
        {
          transform: "rotateX(90deg) translateZ(-16px)",
          className: "bg-light-muted/20 dark:bg-dark-muted/20",
        },
      ],
    },
  ];

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden perspective"
      ref={heroRef}
      onMouseLeave={resetTiltEffect}
    >
      <ParticleCanvas />

      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-10">
        <div
          className="absolute inset-0 bg-dots"
          style={{
            color: "var(--color-primary)",
          }}
        ></div>
      </div>

      <MotionDiv
        className="grain-overlay absolute inset-0 pointer-events-none z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          backgroundImage: "url('/assets/grain-texture.png')",
          backgroundRepeat: "repeat",
          opacity: "var(--grain-opacity)",
          mixBlendMode: "overlay",
          width: "100%",
          height: "100%",
        }}
      ></MotionDiv>

      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-0 bg-gradient-radial from-light-accent/10 to-transparent dark:from-dark-accent/15 dark:to-transparent"
        style={{
          transform: `translate3d(${calculateMouseParallax(0.005).x}px, ${
            calculateMouseParallax(0.005).y
          }px, 0)`,
          width: "100%",
          height: "100%",
        }}
      ></MotionDiv>

      <div className="absolute inset-0 z-0 overflow-hidden">
        {shapes3D.map((shape, shapeIndex) => (
          <MotionDiv
            key={shape.id}
            initial={{ opacity: 0, scale: 0.8, rotateX: 45, rotateY: 45 }}
            animate={{
              opacity: shape.style.opacity || 0.15,
              scale: 1,
              rotateX: 0,
              rotateY: 0,
            }}
            transition={{
              delay: 0.2 + shapeIndex * 0.1,
              duration: 0.6,
              type: "spring",
              damping: 15,
            }}
            className={shape.className}
            style={{
              ...shape.style,
              transform: `translate3d(
                ${
                  calculateMouseParallax(0.03).x *
                  (shapeIndex % 2 === 0 ? 1 : -1)
                }px, 
                ${
                  calculateMouseParallax(0.02).y *
                  (shapeIndex % 2 === 0 ? 1 : -1)
                }px,
                ${calculateMouseParallax(0.01).z}px
              ) translateY(${scrollY * (shapeIndex % 2 === 0 ? 0.05 : -0.05)}px)
              rotate(${scrollY * 0.02}deg)`,
              transformStyle: "preserve-3d",
              animation: `spin-slow ${10 + shapeIndex * 5}s linear infinite${
                shapeIndex % 2 === 0 ? "" : " reverse"
              }`,
            }}
            ref={(el: HTMLDivElement | null) => {
              if (el && shapeIndex < cardRefs.current.length) {
                cardRefs.current[shapeIndex] = el;
                if (!refElementsAssigned.current) {
                  const allAssigned = cardRefs.current.every(
                    (ref, i) => i >= 2 || ref !== null
                  );
                  if (allAssigned && contentRef.current) {
                    refElementsAssigned.current = true;
                  }
                }
              }
            }}
          >
            {shape.faces.map((face, faceIndex) => (
              <div
                key={`face-${shapeIndex}-${faceIndex}`}
                className={`absolute inset-0 ${face.className}`}
                style={{
                  transform: face.transform,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              />
            ))}
          </MotionDiv>
        ))}

        <MotionDiv
          initial={{ opacity: 0, scale: 0.8, rotateZ: -10 }}
          animate={{ opacity: 0.15, scale: 1, rotateZ: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="absolute right-[10%] top-1/4 w-64 h-64 md:w-72 md:h-72 rounded-full bg-light-primary/10 dark:bg-dark-primary/10 animate-float"
          style={{
            transform: `translate3d(
              ${calculateMouseParallax(0.05).x}px, 
              ${calculateMouseParallax(0.05).y}px, 
              ${calculateMouseParallax(0.01).z * 2}px
            ) translateY(${scrollY * 0.05}px)`,
            boxShadow: isDarkMode
              ? "inset 0 0 40px rgba(255,255,255,0.1), 0 0 20px rgba(255,255,255,0.05)"
              : "inset 0 0 40px rgba(0,0,0,0.05), 0 0 20px rgba(0,0,0,0.02)",
            contain: "paint layout",
          }}
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              cardRefs.current[3] = el;
              if (!refElementsAssigned.current) {
                const allAssigned = cardRefs.current.every(
                  (ref, i) => i >= 4 || ref !== null
                );
                if (allAssigned && contentRef.current) {
                  refElementsAssigned.current = true;
                }
              }
            }
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full opacity-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`line-${i}`}
                className="absolute top-1/2 left-1/2 h-full w-0.5 bg-light-primary dark:bg-dark-primary origin-bottom"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 0.2, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="absolute left-[5%] bottom-1/3 w-36 h-36 md:w-48 md:h-48 rounded-md bg-light-accent/10 dark:bg-dark-accent/10 animate-float-reverse backdrop-blur-sm"
          style={{
            transform: `translate3d(
              ${calculateMouseParallax(0.03, true).x}px, 
              ${calculateMouseParallax(0.03, true).y}px, 
              ${calculateMouseParallax(0.01).z}px
            ) translateY(${scrollY * -0.03}px) rotate(-5deg)`,
            boxShadow: isDarkMode
              ? "0 0 30px rgba(255,255,255,0.05)"
              : "0 0 30px rgba(0,0,0,0.03)",
            contain: "paint layout",
          }}
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              cardRefs.current[4] = el;
              if (!refElementsAssigned.current) {
                const allAssigned = cardRefs.current.every(
                  (ref) => ref !== null
                );
                if (allAssigned && contentRef.current) {
                  refElementsAssigned.current = true;
                }
              }
            }
          }}
        >
          <div
            className="absolute inset-2 bg-grid opacity-40"
            style={{ width: "calc(100% - 16px)", height: "calc(100% - 16px)" }}
          />
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 100, scale: 0.5 }}
          animate={{
            opacity: 0.25,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
          className="absolute left-[15%] bottom-10 w-36 h-36 md:w-56 md:h-56"
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
              times: [0, 0.2, 0.5, 0.8, 1],
            }}
            className="w-full h-full"
          >
            <div
              className="w-full h-full"
              style={{
                clipPath: "polygon(50% 10%, 10% 90%, 90% 90%)",
                backgroundColor: "var(--color-primary)",
                opacity: 0.2,
              }}
            />
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, x: 100, rotateZ: -30 }}
          animate={{
            opacity: 0.15,
            x: 0,
            rotateZ: 0,
            transition: {
              duration: 1.2,
              ease: "easeOut",
            },
          }}
          className="absolute right-0 top-1/3 w-32 h-32 md:w-48 md:h-48"
          style={{
            transformOrigin: "center right",
          }}
        >
          <div
            className="absolute inset-0"
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
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.4, 0.7, 1],
            }}
            className="w-full h-full"
          />
        </MotionDiv>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <MotionDiv
          ref={(el: HTMLDivElement | null) => {
            contentRef.current = el;
            if (el && !refElementsAssigned.current) {
              const allAssigned = cardRefs.current.every(
                (ref, i) => i >= 3 || ref !== null
              );
              if (allAssigned) {
                refElementsAssigned.current = true;
              }
            }
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
              Bienvenidos a mi portfolio
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
            Desarrollador frontend especializado en crear{" "}
            <MotionSpan
              initial={{ opacity: 0, y: 10, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
              className="highlight-text backdrop-blur-sm"
            >
              interfaces modernas
            </MotionSpan>
            ,{" "}
            <MotionSpan
              initial={{ opacity: 0, y: 10, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.6, duration: 0.3, type: "spring" }}
              className="highlight-text backdrop-blur-sm"
            >
              accesibles
            </MotionSpan>{" "}
            y de{" "}
            <MotionSpan
              initial={{ opacity: 0, y: 10, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.7, duration: 0.3, type: "spring" }}
              className="highlight-text backdrop-blur-sm"
            >
              alto rendimiento
            </MotionSpan>
            .
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
                Ver proyectos
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
                Contactar
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
                  boxShadow:
                    "inset 0 0 0 1px rgba(var(--color-accent-rgb), 0.5)",
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
              Scroll
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-0 right-0 w-1/2 md:w-1/3 h-1/3 bg-gradient-to-bl from-light-accent/20 dark:from-dark-accent/20 to-transparent -z-10"
        style={{
          transform: `translate3d(
            ${calculateMouseParallax(0.01, true).x}px, 
            ${calculateMouseParallax(0.01, true).y}px, 
            0
          ) translateY(${scrollY * -0.02}px) skewY(${scrollY * 0.005}deg)`,
          filter: `blur(${scrollY * 0.01}px)`,
          contain: "paint layout",
          width: "50%",
          height: "33.333%",
        }}
      />

      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute bottom-0 left-0 w-1/2 md:w-1/3 h-1/3 bg-gradient-to-tr from-light-primary/20 dark:from-dark-primary/20 to-transparent -z-10"
        style={{
          transform: `translate3d(
            ${calculateMouseParallax(0.01).x}px, 
            ${calculateMouseParallax(0.01).y}px, 
            0
          ) translateY(${scrollY * 0.04}px) skewY(${-scrollY * 0.003}deg)`,
          filter: `blur(${scrollY * 0.005}px)`,
          contain: "paint layout",
          width: "50%",
          height: "33.333%",
        }}
      />

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

      <div
        className="absolute bottom-0 left-0 w-full overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <div
          className="dot-pattern"
          style={{ bottom: "40px", left: "10%", transform: "rotate(10deg)" }}
        ></div>
        <div
          className="dot-pattern"
          style={{ bottom: "20px", right: "5%", transform: "rotate(-5deg)" }}
        ></div>
      </div>
    </section>
  );
};

export default Hero;
