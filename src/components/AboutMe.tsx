import { FunctionComponent, JSX } from "preact";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "preact/hooks";
import React, { memo } from "preact/compat";
import {
  MotionDiv,
  MotionH2,
  MotionH3,
  MotionP,
  MotionSpan,
  MotionA,
  MotionSvg,
} from "../utils/motion-components";

type TabType = "experience" | "education" | "skills";
type ExperienceFilterType = "all" | "job" | "freelance";
type SkillFilterType =
  | "all"
  | "frontend"
  | "design"
  | "tools"
  | "languages"
  | "frameworks"
  | "other";

interface Skill {
  name: string;
  level: number;
  category: SkillFilterType;
}

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  technologies: string[];
  type: "job" | "freelance";
}

interface Education {
  institution: string;
  degree: string;
  period: string;
  description?: string;
}

interface Course {
  provider: string;
  name: string;
  topics: string[];
}

interface SoftSkill {
  title: string;
  icon: JSX.Element;
  description: string;
}

interface PersonalInfo {
  name: string;
  age: number;
  location: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
}

interface FilterButtonProps<T extends string> {
  readonly current: T;
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: string;
  readonly count?: number;
}

const animations = {
  section: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08,
        duration: 0.4,
      },
    },
  },
  item: {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 15, stiffness: 70 },
    },
  },
  card: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 15, stiffness: 70, delay },
    }),
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  },
  floatingShape: {
    initial: { opacity: 0, scale: 0.8 },
    animate: (custom: number) => ({
      opacity: [0.1, 0.2, 0.1],
      scale: [1, 1.05, 1],
      rotate: [0, custom > 0 ? custom : 0, 0],
      transition: {
        duration: 8 + Math.abs(custom) * 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }),
  },
};

function getLevelLabel(level: number): string {
  switch (level) {
    case 5:
      return "Experto";
    case 4:
      return "Avanzado";
    case 3:
      return "Intermedio";
    case 2:
      return "Básico";
    default:
      return "Principiante";
  }
}

const GradientBlob = memo(
  ({
    position = "bottom-right",
    color = "accent",
  }: {
    position: string;
    color?: string;
  }) => {
    const positions: Record<string, string> = {
      "bottom-right": "-bottom-12 -right-12 w-40 h-40",
      "top-right": "-top-10 -right-10 w-32 h-32",
      "bottom-left": "-bottom-8 -left-8 w-24 h-24",
    };

    return (
      <MotionDiv
        className={`absolute ${positions[position]} rounded-full bg-gradient-to-r from-light-${color}/10 to-transparent dark:from-dark-${color}/10 dark:to-transparent blur-xl`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
          y: [0, -5, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }
);

const GradientBorder = memo(({ position = "left" }: { position?: string }) => {
  const positionClasses: Record<string, string> = {
    left: "top-0 left-0 w-1 h-full bg-gradient-to-b",
    bottom: "bottom-0 left-0 w-full h-1 bg-gradient-to-r",
  };

  return (
    <MotionDiv
      className={`absolute ${positionClasses[position]} from-light-accent dark:from-dark-accent to-transparent`}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
});

const Badge = memo(({ type, text }: { type: string; text: string }) => (
  <MotionDiv
    className={`absolute top-3 right-3 badge ${
      type === "primary"
        ? "bg-light-primary/10 dark:bg-dark-primary/10"
        : "bg-light-accent/10 dark:bg-dark-accent/10"
    }`}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    {text}
  </MotionDiv>
));

const Tag = memo(({ text }: { text: string }) => (
  <MotionSpan
    key={text}
    className="px-2.5 py-1 text-xs rounded-full bg-light-muted/40 dark:bg-dark-muted/40 text-light-primary dark:text-dark-primary relative overflow-hidden group"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 + Math.random() * 0.3 }}
    whileHover={{ y: -2, scale: 1.05 }}
  >
    <span className="relative z-10">{text}</span>
    <MotionSpan
      className="absolute inset-0 bg-light-accent/20 dark:bg-dark-accent/20"
      initial={{ x: "-100%" }}
      whileHover={{ x: "0" }}
      transition={{ duration: 0.3 }}
    />
  </MotionSpan>
));

const TagsList = memo(({ tags }: { tags: string[] }) => (
  <MotionDiv className="flex flex-wrap gap-2 mt-3">
    {tags.map((tag) => (
      <Tag key={tag} text={tag} />
    ))}
  </MotionDiv>
));

const BaseCard = memo(
  ({
    title,
    subtitle,
    period,
    description,
    tags,
    badge,
    children,
  }: {
    title: string;
    subtitle: string;
    period?: string;
    description?: string;
    tags?: string[];
    badge?: { text: string; type: string };
    children?: JSX.Element | null;
  }) => (
    <MotionDiv
      variants={animations.card}
      whileHover="hover"
      className="glass-card overflow-hidden p-6 relative depth-effect card-3d mb-6"
      custom={Math.random() * 0.3}
      data-animate="true"
    >
      <GradientBlob position="bottom-right" />
      <GradientBorder position="left" />

      {badge && <Badge type={badge.type} text={badge.text} />}

      <MotionH3 className="text-xl font-bold mb-2 flex items-center">
        {title}
      </MotionH3>

      <MotionDiv className="flex justify-between flex-wrap mb-3">
        <MotionP className="text-light-accent dark:text-dark-accent font-medium">
          {subtitle}
        </MotionP>
        {period && (
          <MotionSpan className="text-sm text-light-secondary dark:text-dark-secondary">
            {period}
          </MotionSpan>
        )}
      </MotionDiv>

      {description && (
        <MotionP className="mb-4 text-light-secondary dark:text-dark-secondary">
          {description}
        </MotionP>
      )}

      {tags && tags.length > 0 && <TagsList tags={tags} />}

      {children}
    </MotionDiv>
  )
);

const ExperienceCard = memo(({ experience }: { experience: Experience }) => (
  <BaseCard
    title={experience.company}
    subtitle={experience.role}
    period={experience.period}
    description={experience.description}
    tags={experience.technologies}
    badge={{
      text: experience.type === "job" ? "Empresa" : "Freelance",
      type: experience.type === "job" ? "primary" : "accent",
    }}
  />
));

const EducationCard = memo(({ item }: { item: Education }) => (
  <BaseCard
    title={item.institution}
    subtitle={item.degree}
    period={item.period}
    description={item.description}
  />
));

const CourseCard = memo(({ course }: { course: Course }) => (
  <BaseCard
    title={course.provider}
    subtitle={course.name}
    tags={course.topics}
  />
));

const TabButton = memo(
  ({
    tab,
    activeTab,
    setActiveTab,
    label,
    icon,
    count,
  }: {
    tab: TabType;
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    label: string;
    icon: JSX.Element;
    count?: number;
  }) => (
    <MotionDiv
      className={`relative px-4 py-3 cursor-pointer transition-all duration-300 rounded-lg ${
        activeTab === tab
          ? "bg-light-primary/10 dark:bg-dark-primary/10"
          : "hover:bg-light-muted/30 dark:hover:bg-dark-muted/30"
      }`}
      onClick={() => setActiveTab(tab)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      role="tab"
      aria-selected={activeTab === tab}
      aria-controls={`${tab}-panel`}
    >
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span className={activeTab === tab ? "font-semibold" : ""}>
          {label}
        </span>
        {count !== undefined && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-light-accent/20 dark:bg-dark-accent/20">
            {count}
          </span>
        )}
      </div>
      {activeTab === tab && (
        <MotionDiv
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />
      )}
    </MotionDiv>
  )
);

function FilterButton<T extends string>({
  current,
  value,
  onChange,
  label,
  count,
}: FilterButtonProps<T>): JSX.Element {
  const isActive = current === value;

  return (
    <button
      type="button"
      className={`
        px-3 py-1.5 text-sm rounded-full transition-all duration-300
        ${
          isActive
            ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
            : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
        }
        cursor-pointer
      `}
      onClick={() => onChange(value)}
      aria-pressed={isActive}
    >
      <span className="flex items-center">
        {label}
        {count != null && (
          <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
            {count}
          </span>
        )}
      </span>
    </button>
  );
}

const ParticleEffect = memo(() => {
  const particles = [];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() * 6 + 1;
    const delay = Math.random() * 5;
    const duration = Math.random() * 15 + 5;
    const opacity = Math.random() * 0.5 + 0.1;

    particles.push(
      <MotionDiv
        key={`particle-${i}-${x}-${y}`}
        className="absolute rounded-full bg-light-accent/20 dark:bg-dark-accent/20 backdrop-blur-sm"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, opacity, 0],
          y: [0, -50 - Math.random() * 50],
          x: [0, (Math.random() - 0.5) * 40],
          scale: [1, Math.random() * 0.5 + 0.5],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          delay: delay,
          ease: "easeInOut",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">{particles}</div>
  );
});

const BackgroundElements = memo(
  ({
    isMobile,
    mousePosition,
  }: {
    isMobile: boolean;
    mousePosition: { x: number; y: number };
  }) => (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-animate="true"
    >
      {!isMobile && (
        <>
          <MotionDiv
            className="absolute -top-20 right-0 md:-right-64 md:-top-64 w-96 h-96 rounded-full bg-gradient-to-bl from-light-accent/15 dark:from-dark-accent/20 to-transparent blur-3xl -z-10"
            style={{
              transform: `translate3d(${(mousePosition.x - 500) * 0.02}px, ${
                (mousePosition.y - 300) * 0.02
              }px, 0)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1 }}
          />

          <MotionDiv
            className="absolute -bottom-32 -left-32 md:-left-64 md:-bottom-64 w-96 h-96 rounded-full bg-gradient-to-tr from-light-primary/15 dark:from-dark-primary/20 to-transparent blur-3xl -z-10"
            style={{
              transform: `translate3d(${(mousePosition.x - 500) * -0.01}px, ${
                (mousePosition.y - 300) * -0.01
              }px, 0)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1.2 }}
          />

          <MotionDiv
            className="absolute inset-0 opacity-5 -z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-dots" />
          </MotionDiv>

          <MotionDiv
            className="absolute top-20 md:top-40 right-10 md:right-32 w-32 h-32 opacity-20 dark:opacity-30 -z-10"
            initial="initial"
            animate="animate"
            custom={5}
            variants={animations.floatingShape}
            style={{
              transform: `translate3d(${(mousePosition.x - 500) * 0.01}px, ${
                (mousePosition.y - 300) * 0.01
              }px, 0)`,
            }}
          >
            <div className="w-full h-full rounded-md bg-light-accent/40 dark:bg-dark-accent/40 backdrop-blur-md transform rotate-45" />
          </MotionDiv>

          <MotionDiv
            className="absolute top-1/2 right-1/4 w-40 h-40 opacity-10 dark:opacity-20 -z-10"
            initial="initial"
            animate="animate"
            custom={10}
            variants={animations.floatingShape}
            style={{
              transform: `translate3d(${(mousePosition.x - 500) * 0.02}px, ${
                (mousePosition.y - 300) * 0.02
              }px, 0)`,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                background:
                  "linear-gradient(to right, var(--color-accent), var(--color-primary))",
                opacity: 0.4,
              }}
            />
          </MotionDiv>

          <ParticleEffect />

          <MotionDiv
            className="absolute inset-0 bg-grid opacity-10 dark:opacity-20 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1.5 }}
          />

          <MotionDiv
            className="grain-overlay absolute inset-0 pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ duration: 1 }}
            style={{
              backgroundImage: "url('/assets/grain-texture.png')",
              backgroundRepeat: "repeat",
              opacity: "var(--grain-opacity)",
              mixBlendMode: "overlay",
            }}
          />
        </>
      )}
    </div>
  )
);

const ContactItem = memo(
  ({
    icon,
    label,
    value,
    href,
    gradient = "accent",
  }: {
    icon: JSX.Element;
    label: string;
    value: string;
    href: string;
    gradient?: string;
  }) => (
    <MotionDiv
      className="glass-card p-4 flex items-center shadow-3d-hover hover-float relative overflow-hidden group"
      whileHover={{ y: -5, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }}
    >
      <div className="w-10 h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center mr-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-colors duration-300">
        {React.cloneElement(icon, {
          className:
            "text-light-accent dark:text-dark-accent group-hover:scale-110 transition-transform duration-300",
          width: 18,
          height: 18,
        })}
      </div>
      <div>
        <div className="text-xs text-light-secondary dark:text-dark-secondary mb-1">
          {label}
        </div>
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="font-medium text-sm hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          {value}
        </a>
      </div>
      <MotionDiv
        className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tr from-light-${gradient}/10 to-transparent dark:from-dark-${gradient}/10 dark:to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300`}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, gradient === "accent" ? 10 : -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </MotionDiv>
  )
);

const ContactInfo = memo(({ personalInfo }: { personalInfo: PersonalInfo }) => (
  <MotionDiv
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
    variants={animations.item}
  >
    <ContactItem
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      }
      label="Teléfono"
      value={personalInfo.phone}
      href={`tel:${personalInfo.phone}`}
      gradient="accent"
    />

    <ContactItem
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      }
      label="Email"
      value={personalInfo.email}
      href={`mailto:${personalInfo.email}`}
      gradient="primary"
    />

    <ContactItem
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      }
      label="LinkedIn"
      value={personalInfo.linkedin.replace("https://linkedin.com/in/", "@")}
      href={personalInfo.linkedin}
      gradient="accent"
    />

    <ContactItem
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      }
      label="Portfolio"
      value={personalInfo.portfolio.replace("https://", "")}
      href={personalInfo.portfolio}
      gradient="primary"
    />
  </MotionDiv>
));

const BioIntro = memo(({ personalInfo }: { personalInfo: PersonalInfo }) => (
  <MotionDiv className="text-center mb-16 max-w-3xl mx-auto relative">
    <MotionH2
      className="text-3xl md:text-5xl font-bold mb-6 text-gradient relative inline-block"
      variants={animations.item}
    >
      Acerca de mí
    </MotionH2>

    <MotionDiv
      className="rounded-xl overflow-hidden md:float-right md:ml-8 mb-6 md:mb-0 w-32 h-32 md:w-40 md:h-40 mx-auto md:mx-0 relative shadow-lg card-3d transform-3d-hover"
      variants={animations.item}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-light-accent/30 dark:from-dark-accent/30 to-light-primary/30 dark:to-dark-primary/30" />
      <div className="absolute inset-1 bg-light-bg dark:bg-dark-bg rounded-lg flex items-center justify-center text-4xl font-bold text-light-accent dark:text-dark-accent">
        {personalInfo.name
          .split(" ")
          .map((name) => name[0])
          .join("")}
      </div>
      <div className="absolute inset-0 glow-3d">
        <img
          src="/assets/profileimg.jpg"
          alt="David Guillen"
          className="object-cover w-full h-full opacity-40"
        />
      </div>
    </MotionDiv>

    <MotionDiv
      className="text-left space-y-4 text-light-secondary dark:text-dark-secondary"
      variants={animations.item}
    >
      <p className="text-lg">
        <span className="font-bold text-light-accent dark:text-dark-accent">
          Mi nombre es David Guillen
        </span>
        , tengo 22 años, soy
        <span className="font-bold text-light-accent dark:text-dark-accent">
          {" "}
          Front-End & Mobile Developer
        </span>
        , actualmente vivo en Villa Crespo, CABA, Argentina. Cuento con más de 4
        años de experiencia creando interfaces de usuario modernas, accesibles y
        de alto rendimiento para diversas empresas y proyectos.
      </p>
      <p className="text-lg">
        Me especializo en el desarrollo frontend con{" "}
        <span className="font-bold text-light-accent dark:text-dark-accent">
          React, Preact, Redux, Next.js, Angular, Vue y Nuxt.js
        </span>
        , así como en desarrollo móvil con{" "}
        <span className="font-bold text-light-accent dark:text-dark-accent">
          React Native
        </span>
        . Tengo amplia experiencia en UX/UI, diseño responsivo y metodologías
        ágiles como Scrum. Mi objetivo es combinar diseño estético con código
        limpio y eficiente, siguiendo principios como SOLID, DRY, KISS y BEM
        para crear experiencias digitales que impresionen y funcionen
        perfectamente.
      </p>
    </MotionDiv>
  </MotionDiv>
));

const SkillsChart = memo(
  ({ skills, filter }: { skills: Skill[]; filter: SkillFilterType }) => {
    const filteredSkills = skills.filter(
      (skill) => filter === "all" || skill.category === filter
    );

    const skillsByLevel = [5, 4, 3, 2, 1].map((level) => ({
      level,
      skills: filteredSkills.filter((s) => s.level === level),
    }));

    if (filteredSkills.length === 0) {
      return (
        <MotionP
          className="text-center py-12 text-light-secondary dark:text-dark-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No se encontraron habilidades para esta categoría.
        </MotionP>
      );
    }

    return (
      <div className="glass-card p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />

        <h3 className="text-xl font-bold mb-6 text-gradient">
          Nivel de habilidades
        </h3>

        <div className="space-y-8">
          {skillsByLevel.map(({ level, skills: levelSkills }) => {
            if (levelSkills.length === 0) return null;

            const levelLabel = getLevelLabel(level);

            return (
              <div key={`level-${level}`} className="relative">
                <div className="flex items-center mb-2">
                  <span className="text-lg font-semibold mr-2">{level}</span>
                  <div className="flex-1 h-0.5 bg-light-muted/30 dark:bg-dark-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-light-accent dark:bg-dark-accent"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <span className="ml-2 text-light-secondary dark:text-dark-secondary text-sm">
                    {levelLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 ml-8">
                  {levelSkills.map((skill) => (
                    <div
                      key={`skill-${skill.name}`}
                      className="px-3 py-1 rounded-lg bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary text-sm relative overflow-hidden hover:scale-105 transition-transform"
                      aria-label={`${skill.name}: Nivel ${skill.level} de 5`}
                    >
                      <span className="relative z-10">{skill.name}</span>
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-light-accent dark:bg-dark-accent"
                        style={{ width: `${skill.level * 20}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

const SoftSkillCard = memo(({ skill }: { skill: SoftSkill }) => (
  <MotionDiv
    className="glass-card p-5 hover-float shadow-3d-hover relative overflow-hidden group"
    whileHover={{ y: -5, scale: 1.02 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 },
    }}
  >
    <div className="flex items-center mb-3">
      <div className="w-10 h-10 rounded-full bg-light-primary/10 dark:bg-dark-primary/10 flex items-center justify-center text-light-accent dark:text-dark-accent mr-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-all duration-300">
        {skill.icon}
      </div>
      <h4 className="font-semibold">{skill.title}</h4>
    </div>
    <p className="text-sm text-light-secondary dark:text-dark-secondary">
      {skill.description}
    </p>

    <MotionDiv
      className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full bg-light-accent/5 dark:bg-dark-accent/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </MotionDiv>
));

const SoftSkillsSection = memo(
  ({ softSkills }: { softSkills: SoftSkill[] }) => (
    <MotionDiv className="mt-12" variants={animations.item}>
      <MotionH3 className="text-xl font-bold mb-6 text-gradient">
        Habilidades blandas
      </MotionH3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {softSkills.map((skill) => (
          <SoftSkillCard key={`soft-skill-${skill.title}`} skill={skill} />
        ))}
      </div>
    </MotionDiv>
  )
);

const ExperienceTimeline = memo(
  ({
    experiences,
    filter,
  }: {
    experiences: Experience[];
    filter: ExperienceFilterType;
  }) => {
    const filteredExperiences = useMemo(
      () =>
        experiences.filter((exp) => filter === "all" || exp.type === filter),
      [experiences, filter]
    );

    const experiencesByYear = useMemo(() => {
      const groupedByYear: Record<string, Experience[]> = {};

      filteredExperiences.forEach((exp) => {
        const year = exp.period.split(" ").pop() ?? "Desconocido";
        if (!groupedByYear[year]) {
          groupedByYear[year] = [];
        }
        groupedByYear[year].push(exp);
      });

      return Object.entries(groupedByYear).sort((a, b) => {
        return parseInt(b[0]) - parseInt(a[0]);
      });
    }, [filteredExperiences]);

    return (
      <div className="relative">
        <MotionDiv
          className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-light-accent via-light-primary to-light-muted dark:from-dark-accent dark:via-dark-primary dark:to-dark-muted"
          style={{ transform: "translateX(-50%)" }}
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        <div className="relative z-10">
          {experiencesByYear.map(([year, exps], yearIndex) => (
            <div key={year} className="mb-12">
              <MotionDiv
                className="relative mb-8 md:left-1/2 md:w-auto md:transform md:-translate-x-1/2 bg-light-bg dark:bg-dark-bg px-4 py-2 rounded-full shadow-md inline-block"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: yearIndex * 0.2, duration: 0.5 }}
              >
                <h3 className="text-xl font-bold text-gradient text-center">
                  {year}
                </h3>
              </MotionDiv>

              <div className="space-y-6">
                {exps.map((exp, expIndex) => (
                  <MotionDiv
                    key={`${exp.company}-${exp.role}`}
                    className="relative md:grid md:grid-cols-2 md:gap-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: yearIndex * 0.2 + expIndex * 0.1,
                      duration: 0.5,
                    }}
                  >
                    <MotionDiv
                      className="hidden md:block absolute left-1/2 w-4 h-4 bg-light-accent dark:bg-dark-accent rounded-full"
                      style={{ transform: "translate(-50%, 2rem)" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: yearIndex * 0.2 + expIndex * 0.1 + 0.3,
                        duration: 0.3,
                        type: "spring",
                      }}
                    />

                    <div className="md:col-span-2 md:hidden">
                      <ExperienceCard experience={exp} />
                    </div>

                    <div
                      className={`hidden md:block ${
                        expIndex % 2 === 0 ? "md:col-start-1" : "md:col-start-2"
                      }`}
                    >
                      <ExperienceCard experience={exp} />
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

const AboutMe: FunctionComponent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("experience");
  const [experienceFilter, setExperienceFilter] =
    useState<ExperienceFilterType>("all");
  const [skillFilter, setSkillFilter] = useState<SkillFilterType>("all");
  const sectionRef = useRef<HTMLElement | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const personalInfo: PersonalInfo = {
    name: "David Guillen",
    age: 22,
    location: "Villa Crespo, CABA, Argentina",
    title: "Front-End & Mobile Developer",
    email: "dev.davidg@gmail.com",
    phone: "+54 011 70030947",
    linkedin: "https://www.linkedin.com/in/david-guillen-5074281b8/",
    portfolio: "https://dev-davidg.web.app/",
  };

  const skills: Skill[] = [
    { name: "React", level: 5, category: "frontend" },
    { name: "Preact", level: 5, category: "frontend" },
    { name: "Redux", level: 4, category: "frontend" },
    { name: "Next.js", level: 4, category: "frontend" },
    { name: "Angular", level: 4, category: "frontend" },
    { name: "Vue", level: 4, category: "frontend" },
    { name: "Nuxt.js", level: 3, category: "frontend" },
    { name: "RxJS", level: 3, category: "frontend" },
    { name: "React Native", level: 4, category: "frontend" },
    { name: "TypeScript", level: 5, category: "frontend" },
    { name: "JavaScript", level: 5, category: "frontend" },
    { name: "HTML5", level: 5, category: "frontend" },
    { name: "CSS3", level: 5, category: "frontend" },

    { name: "Figma", level: 4, category: "design" },
    { name: "Adobe XD", level: 3, category: "design" },
    { name: "Adobe Photoshop", level: 3, category: "design" },
    { name: "Adobe Illustrator", level: 3, category: "design" },
    { name: "UX/UI Design", level: 4, category: "design" },

    { name: "SCSS", level: 5, category: "frameworks" },
    { name: "SASS", level: 5, category: "frameworks" },
    { name: "LESS", level: 4, category: "frameworks" },
    { name: "CSS", level: 5, category: "frameworks" },
    { name: "Styled Components", level: 4, category: "frameworks" },
    { name: "Bootstrap", level: 5, category: "frameworks" },
    { name: "Material UI", level: 4, category: "frameworks" },
    { name: "Tailwind CSS", level: 4, category: "frameworks" },

    { name: "Jest", level: 3, category: "tools" },
    { name: "Cucumber", level: 3, category: "tools" },
    { name: "Git", level: 4, category: "tools" },
    { name: "Jira", level: 4, category: "tools" },
    { name: "Trello", level: 5, category: "tools" },
    { name: "Slack", level: 5, category: "tools" },
    { name: "Miro", level: 4, category: "tools" },
    { name: "Jenkins", level: 3, category: "tools" },
    { name: "Storybook", level: 3, category: "tools" },

    { name: "Inglés B2", level: 4, category: "languages" },
    { name: "Español (Nativo)", level: 5, category: "languages" },

    { name: "Agile", level: 4, category: "other" },
    { name: "Scrum", level: 4, category: "other" },
    { name: "BEM", level: 4, category: "other" },
    { name: "DRY", level: 4, category: "other" },
    { name: "KISS", level: 4, category: "other" },
    { name: "SOLID", level: 4, category: "other" },
    { name: "ITCSS", level: 4, category: "other" },
    { name: "Comunicación efectiva", level: 5, category: "other" },
    { name: "Trabajo en equipo", level: 5, category: "other" },
    { name: "Gestión del tiempo", level: 4, category: "other" },
    { name: "Adaptabilidad", level: 5, category: "other" },
    { name: "Autodidacta", level: 5, category: "other" },
  ];

  const experiences: Experience[] = [
    {
      company: "Santander España",
      role: "Desarrollador Front End",
      period: "Mar 2025 - Actualidad",
      description:
        "Desarrollo de sistema interno utilizando tecnologías modernas.",
      technologies: ["Angular", "TypeScript", "Gluon", "Flame UI"],
      type: "job",
    },
    {
      company: "Nonconformist",
      role: "Front End & Mobile Developer",
      period: "Oct 2024 - Actualidad",
      description:
        "Desarrollo de aplicaciones web y móviles con tecnologías modernas.",
      technologies: ["React", "React Native", "TypeScript", "Bootstrap"],
      type: "job",
    },
    {
      company: "Empleos Marketing Digital EMD",
      role: "Front End Developer",
      period: "Ene 2024 - Jul 2024",
      description:
        "Desarrollo completo del proyecto desde cero con integración backend.",
      technologies: ["React.js", "CSS", "i18n", "Bootstrap"],
      type: "job",
    },
    {
      company: "GlobalLogic",
      role: "Front End",
      period: "Jul 2022 - Oct 2024",
      description:
        "Desarrollo de proyectos para Claro (Argentina, Paraguay, Uruguay).",
      technologies: ["React", "StyledComponents", "TypeScript", "Jenkins"],
      type: "job",
    },
    {
      company: "Skyblue Analytics",
      role: "Front End",
      period: "Abr 2023 - Sep 2023",
      description:
        "Desarrollo completo del frontend en colaboración directa con el CTO.",
      technologies: ["Vue", "Quasar", "TypeScript", "GraphQL"],
      type: "job",
    },
    {
      company: "VinciU",
      role: "Front End y UX",
      period: "Jul 2022 - Abr 2023",
      description: "A cargo de la UI del campus virtual.",
      technologies: [
        "Angular",
        "Firebase",
        "SCSS",
        "Bootstrap",
        "Material UI",
        "Storybook",
        "TypeScript",
        "Figma",
      ],
      type: "job",
    },
    {
      company: "Diseño de Hogar (Walmart & Goohaus)",
      role: "Mobile Developer & UX/UI Designer",
      period: "Abr 2023 - May 2023",
      description: "Desarrollo de landing y apps móviles.",
      technologies: ["FlutterFlow", "Flutter", "Figma", "Angular"],
      type: "freelance",
    },
    {
      company: "Ludela Analytics",
      role: "Full Stack & UI Designer",
      period: "Dic 2021 - Jul 2022",
      description:
        "Desarrollo de aplicaciones front y back para empresas nacionales e internacionales.",
      technologies: ["Angular", "Firebase", "Node.js", "SCSS"],
      type: "job",
    },
    {
      company: "Nolock",
      role: "Front End & QA Manual",
      period: "Oct 2021 - Dic 2021",
      description:
        "Programación y pruebas manuales para detección temprana de errores.",
      technologies: ["React", "React Native", "Next.js", "Jest", "Cucumber"],
      type: "job",
    },
    {
      company: "Orion2Pay",
      role: "Front End y UX",
      period: "Ene 2020 - Oct 2021",
      description: "Encargado de la página principal.",
      technologies: ["React", "TypeScript", "Figma"],
      type: "job",
    },
  ];

  const education: Education[] = [
    {
      institution: "UNAJ",
      degree: "Ingeniería Informática",
      period: "2021-2023",
    },
    {
      institution: "Secundaria completa",
      degree: "Educación secundaria completa",
      period: "2015-2020",
    },
  ];

  const courses: Course[] = [
    {
      provider: "SoloLearn",
      name: "Web Development Fundamentals",
      topics: ["HTML", "CSS", "JS", "Responsive Design", "React"],
    },
    {
      provider: "SoyHenry",
      name: "Web Development",
      topics: ["React Dev", "Front End Dev", "JavaScript"],
    },
    {
      provider: "CoderHouse",
      name: "Front End Development",
      topics: ["Front End", "React"],
    },
    {
      provider: "Platzi",
      name: "Web Development & Design",
      topics: [
        "Angular",
        "React",
        "TypeScript",
        "Advanced JS",
        "UX/UI",
        "DOM",
        "Vue",
      ],
    },
    {
      provider: "Google Creative Campus",
      name: "Frontend Development",
      topics: ["Frontend", "JS APIs"],
    },
    {
      provider: "Microsoft",
      name: "Web Development",
      topics: ["Web Development"],
    },
    {
      provider: "Udemy",
      name: "Comprehensive Web Development",
      topics: [
        "Frontend",
        "CSS",
        "Less",
        "Grid",
        "Flexbox",
        "SVG",
        "jQuery",
        "API REST",
        "Node.js",
        "MongoDB",
        "AngularJS",
        "Svelte",
      ],
    },
  ];

  const softSkills: SoftSkill[] = [
    {
      title: "Comunicación",
      icon: (
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
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </MotionSvg>
      ),
      description:
        "Clara y efectiva para transmitir ideas y conceptos técnicos.",
    },
    {
      title: "Trabajo en equipo",
      icon: (
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
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </MotionSvg>
      ),
      description: "Colaboración efectiva en equipos multidisciplinarios.",
    },
    {
      title: "Gestión del tiempo",
      icon: (
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
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </MotionSvg>
      ),
      description: "Cumplimiento de plazos y organización eficaz de tareas.",
    },
    {
      title: "Adaptabilidad",
      icon: (
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
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </MotionSvg>
      ),
      description: "Rápido aprendizaje de nuevas tecnologías y metodologías.",
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;

      try {
        const rect = sectionRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } catch (error) {
        console.error("Mouse tracking error:", error);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  const expJobsCount = useMemo(
    () => experiences.filter((exp) => exp.type === "job").length,
    [experiences]
  );

  const expFreelanceCount = useMemo(
    () => experiences.filter((exp) => exp.type === "freelance").length,
    [experiences]
  );

  const skillCategoryCounts = useMemo(() => {
    const counts: Partial<Record<SkillFilterType, number>> = {};
    skills.forEach((skill) => {
      counts[skill.category] = (counts[skill.category] ?? 0) + 1;
    });
    return counts;
  }, [skills]);

  const handleSetActiveTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleSetExperienceFilter = useCallback(
    (filter: ExperienceFilterType) => {
      setExperienceFilter(filter);
    },
    []
  );

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 container mx-auto relative min-h-screen perspective overflow-hidden"
      aria-label="Acerca de mí"
      data-optimize="true"
    >
      <BackgroundElements isMobile={isMobile} mousePosition={mousePosition} />

      <MotionDiv
        className="w-full h-full"
        variants={animations.section}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <BioIntro personalInfo={personalInfo} />

        <ContactInfo personalInfo={personalInfo} />

        <MotionDiv
          className="flex justify-center space-x-2 md:space-x-8 mb-8 overflow-x-auto py-2 px-4"
          variants={animations.item}
          role="tablist"
        >
          <TabButton
            tab="experience"
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            label="Experiencia"
            count={experiences.length}
            icon={
              <MotionSvg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </MotionSvg>
            }
          />

          <TabButton
            tab="education"
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            label="Educación"
            count={education.length + courses.length}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            }
          />

          <TabButton
            tab="skills"
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            label="Habilidades"
            count={skills.length}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            }
          />
        </MotionDiv>

        <MotionDiv
          className="relative mb-12 perspective preserve-3d"
          variants={animations.item}
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
        >
          {activeTab === "experience" && (
            <>
              <div className="flex justify-center mb-6 space-x-2 overflow-x-auto py-2">
                <FilterButton
                  current={experienceFilter}
                  value="all"
                  onChange={handleSetExperienceFilter}
                  label="Todos"
                  count={experiences.length}
                />
                <FilterButton
                  current={experienceFilter}
                  value="job"
                  onChange={handleSetExperienceFilter}
                  label="Empresas"
                  count={expJobsCount}
                />
                <FilterButton
                  current={experienceFilter}
                  value="freelance"
                  onChange={handleSetExperienceFilter}
                  label="Freelance"
                  count={expFreelanceCount}
                />
              </div>

              <ExperienceTimeline
                experiences={experiences}
                filter={experienceFilter}
              />
            </>
          )}

          {activeTab === "education" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <MotionH3 className="text-xl font-bold mb-4 text-gradient">
                  Educación Formal
                </MotionH3>

                {education.map((edu) => (
                  <EducationCard
                    key={`education-${edu.institution}-${edu.period}`}
                    item={edu}
                  />
                ))}
              </div>

              <div className="lg:col-span-2">
                <MotionH3 className="text-xl font-bold mb-4 text-gradient">
                  Cursos y Formación
                </MotionH3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {courses.map((course) => (
                    <CourseCard
                      key={`course-${course.provider}-${course.name}`}
                      course={course}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <>
              <div className="skills-filter-container mb-6">
                <div className="flex justify-center flex-wrap gap-2 mb-6">
                  <FilterButton
                    current={skillFilter}
                    value="all"
                    onChange={setSkillFilter}
                    label="Todas"
                    count={skills.length}
                  />
                  <FilterButton
                    current={skillFilter}
                    value="frontend"
                    onChange={setSkillFilter}
                    label="Frontend"
                    count={skillCategoryCounts.frontend}
                  />
                  <FilterButton
                    current={skillFilter}
                    value="frameworks"
                    onChange={setSkillFilter}
                    label="Frameworks"
                    count={skillCategoryCounts.frameworks}
                  />
                  <FilterButton
                    current={skillFilter}
                    value="design"
                    onChange={setSkillFilter}
                    label="Diseño"
                    count={skillCategoryCounts.design}
                  />
                  <FilterButton
                    current={skillFilter}
                    value="tools"
                    onChange={setSkillFilter}
                    label="Herramientas"
                    count={skillCategoryCounts.tools}
                  />
                  <FilterButton
                    current={skillFilter}
                    value="languages"
                    onChange={setSkillFilter}
                    label="Idiomas"
                    count={skillCategoryCounts.languages}
                  />
                  <FilterButton
                    current={skillFilter}
                    value="other"
                    onChange={setSkillFilter}
                    label="Metodologías"
                    count={skillCategoryCounts.other}
                  />
                </div>
              </div>

              <div key={skillFilter} className="skills-content">
                <SkillsChart skills={skills} filter={skillFilter} />
                <SoftSkillsSection softSkills={softSkills} />
              </div>
            </>
          )}
        </MotionDiv>
      </MotionDiv>
    </section>
  );
};

export default AboutMe;
