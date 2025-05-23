import { FunctionComponent, JSX, Fragment } from "preact";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "preact/hooks";
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

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      duration: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 70,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 70,
      delay,
    },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 100,
    },
  },
};

const floatingShapeVariants = {
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
};

const ExperienceCard = ({ experience }: { experience: Experience }) => (
  <MotionDiv
    variants={cardVariants}
    whileHover="hover"
    className="glass-card overflow-hidden p-6 relative depth-effect card-3d mb-6"
    custom={Math.random() * 0.3}
    data-animate="true"
  >
    <MotionDiv
      className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-r from-light-accent/10 to-transparent dark:from-dark-accent/10 dark:to-transparent blur-xl"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
        y: [0, -5, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />

    <MotionDiv
      className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-light-accent dark:from-dark-accent to-transparent"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />

    <MotionDiv
      className={`absolute top-3 right-3 badge ${
        experience.type === "job"
          ? "bg-light-primary/10 dark:bg-dark-primary/10"
          : "bg-light-accent/10 dark:bg-dark-accent/10"
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {experience.type === "job" ? "Empresa" : "Freelance"}
    </MotionDiv>

    <MotionH3 className="text-xl font-bold mb-2 flex items-center">
      {experience.company}
    </MotionH3>

    <MotionDiv className="flex justify-between flex-wrap mb-3">
      <MotionP className="text-light-accent dark:text-dark-accent font-medium">
        {experience.role}
      </MotionP>
      <MotionSpan className="text-sm text-light-secondary dark:text-dark-secondary">
        {experience.period}
      </MotionSpan>
    </MotionDiv>

    <MotionP className="mb-4 text-light-secondary dark:text-dark-secondary">
      {experience.description}
    </MotionP>

    <MotionDiv className="flex flex-wrap gap-2 mt-3">
      {experience.technologies.map((tech) => (
        <MotionSpan
          key={tech}
          className="px-2.5 py-1 text-xs rounded-full bg-light-muted/40 dark:bg-dark-muted/40 text-light-primary dark:text-dark-primary relative overflow-hidden group"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + Math.random() * 0.3 }}
          whileHover={{
            y: -2,
            scale: 1.05,
          }}
        >
          <span className="relative z-10">{tech}</span>
          <MotionSpan
            className="absolute inset-0 bg-light-accent/20 dark:bg-dark-accent/20"
            initial={{ x: "-100%" }}
            whileHover={{ x: "0" }}
            transition={{ duration: 0.3 }}
          />
        </MotionSpan>
      ))}
    </MotionDiv>
  </MotionDiv>
);

const EducationCard: FunctionComponent<{ item: Education }> = ({ item }) => (
  <MotionDiv
    variants={cardVariants}
    whileHover="hover"
    className="glass-card overflow-hidden p-6 relative depth-effect card-3d mb-6"
    custom={Math.random() * 0.3}
    data-animate="true"
  >
    <MotionDiv
      className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-light-accent dark:from-dark-accent to-light-primary/0 dark:to-dark-primary/0"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />

    <MotionDiv
      className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-r from-light-primary/10 to-transparent dark:from-dark-primary/10 dark:to-transparent blur-xl"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.2, 0.4, 0.2],
        scale: [1, 1.1, 1],
        y: [0, -5, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />

    <MotionH3 className="text-xl font-bold mb-1">{item.institution}</MotionH3>

    <MotionDiv className="flex justify-between flex-wrap mb-3">
      <MotionP className="text-light-accent dark:text-dark-accent font-medium">
        {item.degree}
      </MotionP>
      <MotionSpan className="text-sm text-light-secondary dark:text-dark-secondary">
        {item.period}
      </MotionSpan>
    </MotionDiv>

    {item.description && (
      <MotionP className="text-light-secondary dark:text-dark-secondary">
        {item.description}
      </MotionP>
    )}
  </MotionDiv>
);

const CourseCard: FunctionComponent<{ course: Course }> = ({ course }) => (
  <MotionDiv
    variants={cardVariants}
    whileHover="hover"
    className="glass-card overflow-hidden p-6 relative depth-effect card-3d mb-6"
    custom={Math.random() * 0.3}
    data-animate="true"
  >
    <MotionDiv
      className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-r from-light-accent/10 to-transparent dark:from-dark-accent/10 dark:to-transparent blur-xl"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        y: [0, -5, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />

    <MotionH3 className="text-lg font-bold mb-1">{course.provider}</MotionH3>

    <MotionP className="text-light-accent dark:text-dark-accent font-medium mb-2">
      {course.name}
    </MotionP>

    <MotionDiv className="flex flex-wrap gap-1.5">
      {course.topics.map((topic) => (
        <MotionSpan
          key={topic}
          className="px-2 py-0.5 text-xs rounded-full bg-light-muted/30 dark:bg-dark-muted/30 text-light-primary dark:text-dark-primary relative overflow-hidden group"
          whileHover={{ y: -1 }}
        >
          <span className="relative z-10">{topic}</span>
          <MotionSpan
            className="absolute inset-0 bg-light-accent/10 dark:bg-dark-accent/10"
            initial={{ x: "-100%" }}
            whileHover={{ x: "0" }}
            transition={{ duration: 0.3 }}
          />
        </MotionSpan>
      ))}
    </MotionDiv>
  </MotionDiv>
);

const TabButton = ({
  tab,
  activeTab,
  onClick,
  label,
  icon,
  count,
}: {
  tab: TabType;
  activeTab: TabType;
  onClick: () => void;
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
    onClick={onClick}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center">
      <span className="mr-2">{icon}</span>
      <span className={activeTab === tab ? "font-semibold" : ""}>{label}</span>
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
);

function FilterButton<T extends string>({
  current,
  value,
  onChange,
  label,
  count,
}: {
  current: T;
  value: T;
  onChange: (value: T) => void;
  label: string;
  count?: number;
}): JSX.Element {
  return (
    <div
      className={`px-3 py-1.5 text-sm rounded-full cursor-pointer transition-all duration-300 ${
        current === value
          ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
          : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
      }`}
      onClick={() => onChange(value)}
      role="button"
      aria-pressed={current === value}
      tabIndex={0}
    >
      <span className="flex items-center">
        {label}
        {count !== undefined && (
          <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
            {count}
          </span>
        )}
      </span>
    </div>
  );
}

const ParticleEffect = () => {
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
};

const BackgroundElements = ({
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
          variants={floatingShapeVariants}
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
          variants={floatingShapeVariants}
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
);

const ContactInfo = ({ personalInfo }: { personalInfo: PersonalInfo }) => (
  <MotionDiv
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
    variants={itemVariants}
  >
    <MotionDiv
      className="glass-card p-4 flex items-center shadow-3d-hover hover-float relative overflow-hidden group"
      whileHover={{ y: -5, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }}
    >
      <div className="w-10 h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center mr-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-colors duration-300">
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
          className="text-light-accent dark:text-dark-accent group-hover:scale-110 transition-transform duration-300"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </MotionSvg>
      </div>
      <div>
        <div className="text-xs text-light-secondary dark:text-dark-secondary mb-1">
          Teléfono
        </div>
        <a
          href={`tel:${personalInfo.phone}`}
          className="font-medium text-sm hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          {personalInfo.phone}
        </a>
      </div>
      <MotionDiv
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tr from-light-accent/10 to-transparent dark:from-dark-accent/10 dark:to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </MotionDiv>

    <MotionDiv
      className="glass-card p-4 flex items-center shadow-3d-hover hover-float relative overflow-hidden group"
      whileHover={{ y: -5, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }}
    >
      <div className="w-10 h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center mr-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-colors duration-300">
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
          className="text-light-accent dark:text-dark-accent group-hover:scale-110 transition-transform duration-300"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </MotionSvg>
      </div>
      <div>
        <div className="text-xs text-light-secondary dark:text-dark-secondary mb-1">
          Email
        </div>
        <a
          href={`mailto:${personalInfo.email}`}
          className="font-medium text-sm hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          {personalInfo.email}
        </a>
      </div>
      <MotionDiv
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tr from-light-primary/10 to-transparent dark:from-dark-primary/10 dark:to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </MotionDiv>

    <MotionDiv
      className="glass-card p-4 flex items-center shadow-3d-hover hover-float relative overflow-hidden group"
      whileHover={{ y: -5, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }}
    >
      <div className="w-10 h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center mr-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-colors duration-300">
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
          className="text-light-accent dark:text-dark-accent group-hover:scale-110 transition-transform duration-300"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </MotionSvg>
      </div>
      <div>
        <div className="text-xs text-light-secondary dark:text-dark-secondary mb-1">
          LinkedIn
        </div>
        <a
          href={personalInfo.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm truncate hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          {personalInfo.linkedin.replace("https://linkedin.com/in/", "@")}
        </a>
      </div>
      <MotionDiv
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tr from-light-accent/10 to-transparent dark:from-dark-accent/10 dark:to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </MotionDiv>

    <MotionDiv
      className="glass-card p-4 flex items-center shadow-3d-hover hover-float relative overflow-hidden group"
      whileHover={{ y: -5, boxShadow: "0px 15px 30px rgba(0,0,0,0.1)" }}
    >
      <div className="w-10 h-10 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center mr-3 group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20 transition-colors duration-300">
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
          className="text-light-accent dark:text-dark-accent group-hover:scale-110 transition-transform duration-300"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </MotionSvg>
      </div>
      <div>
        <div className="text-xs text-light-secondary dark:text-dark-secondary mb-1">
          Portfolio
        </div>
        <a
          href={personalInfo.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm truncate hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          {personalInfo.portfolio.replace("https://", "")}
        </a>
      </div>
      <MotionDiv
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tr from-light-primary/10 to-transparent dark:from-dark-primary/10 dark:to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </MotionDiv>
  </MotionDiv>
);

const BioIntro = ({ personalInfo }: { personalInfo: PersonalInfo }) => (
  <MotionDiv className="text-center mb-16 max-w-3xl mx-auto relative">
    <MotionH2
      className="text-3xl md:text-5xl font-bold mb-6 text-gradient relative inline-block"
      variants={itemVariants}
    >
      Acerca de mí
      <MotionDiv
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-light-accent to-light-primary dark:from-dark-accent dark:to-dark-primary"
        initial={{ width: 0, x: "50%", opacity: 0 }}
        animate={{ width: "100%", x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
    </MotionH2>

    <MotionDiv
      className="rounded-xl overflow-hidden md:float-right md:ml-8 mb-6 md:mb-0 w-32 h-32 md:w-40 md:h-40 mx-auto md:mx-0 relative shadow-lg card-3d transform-3d-hover"
      variants={itemVariants}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-light-accent/30 dark:from-dark-accent/30 to-light-primary/30 dark:to-dark-primary/30" />
      <div className="absolute inset-1 bg-light-bg dark:bg-dark-bg rounded-lg flex items-center justify-center text-4xl font-bold text-light-accent dark:text-dark-accent">
        {personalInfo.name
          .split(" ")
          .map((name) => name[0])
          .join("")}
      </div>
      <div className="absolute inset-0 glow-3d" />
    </MotionDiv>

    <MotionP
      className="text-lg md:text-xl mb-6 text-light-secondary dark:text-dark-secondary leading-relaxed text-left"
      variants={itemVariants}
    >
      Mi nombre es{" "}
      <span className="text-light-accent dark:text-dark-accent font-semibold">
        {personalInfo.name}
      </span>{" "}
      , tengo {personalInfo.age} años, soy {personalInfo.title}, actualmente
      vivo en {personalInfo.location}. Cuento con más de 4 años de experiencia
      creando interfaces de usuario modernas, accesibles y de alto rendimiento
      para diversas empresas y proyectos.
    </MotionP>

    <MotionP
      className="text-lg md:text-xl mb-8 text-light-secondary dark:text-dark-secondary leading-relaxed text-left"
      variants={itemVariants}
    >
      Me especializo en el desarrollo frontend con React, TypeScript y
      frameworks modernos. Tengo amplia experiencia en UX/UI, diseño responsivo
      y metodologías ágiles. Mi objetivo es combinar diseño estético con código
      limpio y eficiente para crear experiencias digitales que impresionen y
      funcionen perfectamente.
    </MotionP>

    <MotionDiv
      className="flex justify-center gap-4 flex-wrap mt-8"
      variants={itemVariants}
    >
      <MotionA
        href={`mailto:${personalInfo.email}`}
        className="btn-gradient group flex items-center relative overflow-hidden"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10 flex items-center">
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
            className="mr-2"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </MotionSvg>
          Contactarme
        </span>
        <MotionDiv
          className="absolute inset-0 bg-white/20"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.5 }}
        />
      </MotionA>

      <MotionA
        href="/cv/davidguillen-cv.pdf"
        target="_blank"
        className="btn-outline group flex items-center relative overflow-hidden"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10 flex items-center">
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
            className="mr-2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </MotionSvg>
          Descargar CV
        </span>
        <MotionDiv
          className="absolute inset-0 bg-light-accent/10 dark:bg-dark-accent/10"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ originX: 0.5, originY: 0.5 }}
        />
      </MotionA>
    </MotionDiv>
  </MotionDiv>
);

const SkillsChart = ({
  skills,
  filter,
}: {
  skills: Skill[];
  filter: SkillFilterType;
}) => {
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
      <div className="absolute inset-0 bg-grid opacity-10"></div>

      <h3 className="text-xl font-bold mb-6 text-gradient">
        Nivel de habilidades
      </h3>

      <div className="space-y-8">
        {skillsByLevel.map(
          ({ level, skills: levelSkills }) =>
            levelSkills.length > 0 && (
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
                    {level === 5
                      ? "Experto"
                      : level === 4
                      ? "Avanzado"
                      : level === 3
                      ? "Intermedio"
                      : level === 2
                      ? "Básico"
                      : "Principiante"}
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
            )
        )}
      </div>
    </div>
  );
};

const SoftSkillsSection = ({ softSkills }: { softSkills: SoftSkill[] }) => (
  <MotionDiv className="mt-12" variants={itemVariants}>
    <MotionH3 className="text-xl font-bold mb-6 text-gradient">
      Habilidades blandas
    </MotionH3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {softSkills.map((skill) => (
        <MotionDiv
          key={`soft-skill-${skill.title}`}
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
      ))}
    </div>
  </MotionDiv>
);

const ExperienceTimeline = ({
  experiences,
  filter,
}: {
  experiences: Experience[];
  filter: ExperienceFilterType;
}) => {
  const filteredExperiences = useMemo(
    () => experiences.filter((exp) => filter === "all" || exp.type === filter),
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
};

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
    location: "Almagro CABA, BsAs, Argentina",
    title: "Front-End Dev & Mobile Dev",
    email: "dev.davidg@gmail.com",
    phone: "+54 011 70030947",
    linkedin: "https://linkedin.com/in/david-guillen",
    portfolio: "https://dev-davidg.web.app/",
  };

  const skills: Skill[] = [
    { name: "React", level: 5, category: "frontend" },
    { name: "TypeScript", level: 5, category: "frontend" },
    { name: "JavaScript", level: 5, category: "frontend" },
    { name: "HTML5", level: 5, category: "frontend" },
    { name: "CSS3", level: 5, category: "frontend" },
    { name: "Redux", level: 4, category: "frontend" },
    { name: "NextJS", level: 4, category: "frontend" },
    { name: "Angular", level: 4, category: "frontend" },
    { name: "Vue", level: 3, category: "frontend" },
    { name: "React Native", level: 4, category: "frontend" },
    { name: "Jest", level: 3, category: "frontend" },

    { name: "Figma", level: 4, category: "design" },
    { name: "Adobe XD", level: 3, category: "design" },
    { name: "Adobe Photoshop", level: 3, category: "design" },
    { name: "Adobe Illustrator", level: 3, category: "design" },
    { name: "UX/UI Design", level: 4, category: "design" },

    { name: "SASS/SCSS", level: 5, category: "frameworks" },
    { name: "LESS", level: 4, category: "frameworks" },
    { name: "Styled Components", level: 4, category: "frameworks" },
    { name: "Bootstrap", level: 5, category: "frameworks" },
    { name: "Material UI", level: 4, category: "frameworks" },
    { name: "Tailwind CSS", level: 4, category: "frameworks" },
    { name: "Quasar", level: 3, category: "frameworks" },

    { name: "Git", level: 4, category: "tools" },
    { name: "Jira", level: 4, category: "tools" },
    { name: "Trello", level: 5, category: "tools" },
    { name: "Slack", level: 5, category: "tools" },
    { name: "Storybook", level: 3, category: "tools" },
    { name: "Jenkins", level: 3, category: "tools" },
    { name: "Miro", level: 4, category: "tools" },

    { name: "English B2", level: 4, category: "languages" },
    { name: "Spanish (Native)", level: 5, category: "languages" },

    { name: "SOLID Principles", level: 4, category: "other" },
    { name: "BEM Methodology", level: 4, category: "other" },
    { name: "ITCSS", level: 4, category: "other" },
    { name: "DRY & KISS", level: 4, category: "other" },
    { name: "Agile Methodologies", level: 4, category: "other" },
    { name: "Teamwork", level: 5, category: "other" },
    { name: "Time Management", level: 4, category: "other" },
    { name: "Self-learning", level: 5, category: "other" },
    { name: "Adaptability", level: 5, category: "other" },
  ];

  const experiences: Experience[] = [
    {
      company: "Empresa IT",
      role: "Front End & Mobile Dev",
      period: "Octubre 2024 - Actualidad",
      description:
        "Desarrollo de aplicaciones web y móviles utilizando tecnologías modernas.",
      technologies: ["React", "React Native", "TypeScript", "Bootstrap"],
      type: "job",
    },
    {
      company: "Empleos Marketing Digital",
      role: "Front End Developer",
      period: "Enero de 2024 - Julio de 2024",
      description:
        "Encargado de levantar el proyecto desde 0, integración Back-End.",
      technologies: ["React JS", "CSS", "i18n", "Bootstrap"],
      type: "job",
    },
    {
      company: "Empresa IT",
      role: "Front End",
      period: "Julio 2022 - Octubre 2024",
      description: "Trabajé en proyectos front end para Claro Arg/Py/Uy.",
      technologies: ["React", "StyledComponents", "TypeScript", "Jenkins"],
      type: "job",
    },
    {
      company: "Empresa comercial",
      role: "Front End",
      period: "Abril de 2023 - Septiembre de 2023",
      description:
        "Trabajé directamente con el CTO enfocado en desarrollar todo el frontend de la plataforma.",
      technologies: ["Vue", "Quasar", "TypeScript", "GraphQL"],
      type: "job",
    },
    {
      company: "Campus Virtual",
      role: "Front End y UX",
      period: "Julio 2022 - Abril 2023",
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
      company: "Diseño de hogar",
      role: "Desarrollador móvil y diseñador de UX/UI",
      period: "Abril de 2023 - Mayo de 2023",
      description: "Trabajé para Walmart y en el landing de Goohaus.",
      technologies: ["Flutterflow", "Flutter", "Figma", "Angular"],
      type: "freelance",
    },
    {
      company: "Business Analytics",
      role: "Full Stack & UI Designer",
      period: "Dic 2021 - Julio 2022",
      description:
        "Encargado de la programación de aplicaciones front & back para empresas multinacionales y nacionales.",
      technologies: ["Angular", "Firebase", "Node", "SCSS"],
      type: "job",
    },
    {
      company: "Empresa de IT",
      role: "Front end & QA Manual",
      period: "Oct 2021 - Dic 2021",
      description:
        "A cargo de la programación y pruebas para la detección temprana de errores.",
      technologies: ["React", "React Native", "NextJS", "Jest", "Cucumber"],
      type: "job",
    },
    {
      company: "Empresa crypto",
      role: "Front End y UX",
      period: "Ene 2020 - Oct 2021",
      description: "A cargo de la página principal.",
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
      institution: "Escuela secundaria",
      degree: "Educación secundaria completa",
      period: "2015-2020",
    },
  ];

  const courses: Course[] = [
    {
      provider: "SoyHenry",
      name: "Web Development",
      topics: ["React Developer", "Front End Developer", "JavaScript"],
    },
    {
      provider: "CoderHouse",
      name: "Front End Development",
      topics: ["Front End Dev", "React Dev"],
    },
    {
      provider: "Platzi",
      name: "Web Development & Design",
      topics: [
        "Angular",
        "React",
        "TypeScript",
        "Advanced JavaScript",
        "UX/UI Designer",
        "DOM",
        "Vue",
      ],
    },
    {
      provider: "SoloLearn",
      name: "Web Development Fundamentals",
      topics: ["HTML", "CSS", "JS", "Responsive Design", "React"],
    },
    {
      provider: "Google Creative Campus",
      name: "Web Development",
      topics: ["FE", "JS APIS"],
    },
    {
      provider: "Microsoft",
      name: "Web Development",
      topics: ["Web development"],
    },
    {
      provider: "Udemy",
      name: "Comprehensive Web Development",
      topics: [
        "Front End Developer",
        "CSS",
        "Less",
        "Gridbox",
        "Flexbox",
        "SVG",
        "JQuery",
        "API Rest",
        "Node JS",
        "MongoDB",
        "Angular JS",
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
        console.debug("Mouse tracking disabled");
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
        variants={sectionVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <BioIntro personalInfo={personalInfo} />

        <ContactInfo personalInfo={personalInfo} />

        <MotionDiv
          className="flex justify-center space-x-2 md:space-x-8 mb-8 overflow-x-auto py-2 px-4"
          variants={itemVariants}
          role="tablist"
        >
          <TabButton
            tab="experience"
            activeTab={activeTab}
            onClick={() => handleSetActiveTab("experience")}
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
                role="presentation"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </MotionSvg>
            }
          />

          <TabButton
            tab="education"
            activeTab={activeTab}
            onClick={() => handleSetActiveTab("education")}
            label="Educación"
            count={education.length + courses.length}
            icon={
              <span className="mr-2" aria-hidden="true">
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
              </span>
            }
          />

          <TabButton
            tab="skills"
            activeTab={activeTab}
            onClick={() => handleSetActiveTab("skills")}
            label="Habilidades"
            count={skills.length}
            icon={
              <span className="mr-2" aria-hidden="true">
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
              </span>
            }
          />
        </MotionDiv>

        <MotionDiv
          className="relative mb-12 perspective preserve-3d"
          variants={itemVariants}
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
                  <button
                    type="button"
                    onClick={() => setSkillFilter("all")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "all"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Todas{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skills.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillFilter("frontend")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "frontend"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Frontend{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skillCategoryCounts.frontend}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillFilter("frameworks")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "frameworks"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Frameworks{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skillCategoryCounts.frameworks}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillFilter("design")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "design"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Diseño{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skillCategoryCounts.design}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillFilter("tools")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "tools"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Herramientas{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skillCategoryCounts.tools}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillFilter("languages")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "languages"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Idiomas{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skillCategoryCounts.languages}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillFilter("other")}
                    className={`px-3 py-1.5 text-sm rounded-full ${
                      skillFilter === "other"
                        ? "bg-light-accent/20 dark:bg-dark-accent/20 text-light-primary dark:text-dark-primary shadow-md"
                        : "bg-light-muted/40 dark:bg-dark-muted/40 hover:bg-light-muted/60 dark:hover:bg-dark-muted/60"
                    }`}
                  >
                    Metodologías{" "}
                    <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-light-primary/10 dark:bg-dark-primary/10">
                      {skillCategoryCounts.other}
                    </span>
                  </button>
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
