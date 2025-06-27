import { FunctionComponent } from "preact";
import { Variants } from "framer-motion";
import {
  MotionDiv,
  MotionH2,
  MotionH3,
  MotionP,
  MotionA,
  MotionSpan,
  MotionUl,
  MotionLi,
  MotionForm,
  MotionInput,
  MotionButton,
  MotionSvg,
  MotionPath,
} from "../utils/motion-components";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      when: "beforeChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -5,
    transition: { type: "spring", stiffness: 300, damping: 10 },
  },
};

const linkVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100 },
  },
  hover: {
    scale: 1.05,
    color: "var(--color-accent)",
    textShadow: "0 0 8px rgba(136, 136, 136, 0.3)",
    transition: { duration: 0.2 },
  },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: [0.2, 0.5, 0.2],
    scale: [0.8, 1.1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const buttonVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.15)",
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.95 },
};

const SocialIcon: FunctionComponent<{
  name: "GitHub" | "LinkedIn" | "Twitter" | "Instagram";
}> = ({ name }) => {
  const icons = {
    GitHub: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
    LinkedIn: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    Twitter: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
    Instagram: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  };

  return icons[name] || null;
};

const DecorativeWave: FunctionComponent = () => {
  return (
    <MotionDiv
      className="absolute left-0 bottom-0 w-full h-16 overflow-hidden leading-none -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <MotionSvg
        className="absolute left-0 h-16 w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <MotionPath
          d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
          fill="currentColor"
          className="text-light-primary/5 dark:text-dark-primary/5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </MotionSvg>
    </MotionDiv>
  );
};

const ParticleEffect: FunctionComponent = () => {
  const particles = [];
  const count = 20;

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() * 10 + 2;
    const delay = Math.random() * 5;
    const duration = Math.random() * 10 + 10;

    particles.push(
      <MotionDiv
        key={i}
        className="absolute rounded-full bg-light-accent/10 dark:bg-dark-accent/10"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.5, 0],
          y: [0, -30],
          scale: [1, 0.5],
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

const Footer: FunctionComponent = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: "GitHub", url: "https://github.com/DevDavidg" },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/david-guillen-5074281b8/",
    },
    { name: "Twitter", url: "https://twitter.com/" },
    { name: "Instagram", url: "https://instagram.com/" },
  ];

  const quickLinks = [
    { name: "Inicio", url: "/" },
    { name: "Proyectos", url: "/proyectos" },
    { name: "Servicios", url: "/servicios" },
    { name: "Sobre mí", url: "/sobre-mi" },
    { name: "Contacto", url: "/contacto" },
  ];

  const handleSubscribe = (e: Event) => {
    e.preventDefault();
    alert("¡Gracias por suscribirte!");
  };

  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-light-bg dark:bg-dark-bg pt-16"
      data-always-visible="true"
    >
      <DecorativeWave />
      <ParticleEffect />

      <MotionDiv
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-light-accent/5 dark:bg-dark-accent/10 blur-3xl"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />

      <MotionDiv
        className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-light-accent/5 dark:bg-dark-accent/10 blur-2xl"
        variants={glowVariants}
        initial="initial"
        animate="animate"
        custom={1}
      />

      <div className="container mx-auto px-4">
        <MotionDiv
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
        >
          <MotionDiv
            variants={itemVariants}
            className="md:col-span-2 space-y-4"
          >
            <MotionH2
              variants={itemVariants}
              className="text-2xl font-bold relative inline-block"
            >
              Portfolio
              <MotionSpan
                className="absolute -bottom-1 left-0 h-0.5 bg-light-accent dark:bg-dark-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </MotionH2>

            <MotionP
              variants={itemVariants}
              className="text-light-secondary dark:text-dark-secondary max-w-md leading-relaxed"
            >
              Creando interfaces elegantes y funcionales con un enfoque en la
              experiencia del usuario. Especializado en soluciones digitales que
              combinan estética y usabilidad.
            </MotionP>

            <MotionDiv variants={itemVariants} className="mt-6">
              <MotionH3 className="text-lg font-semibold mb-4">
                Sígueme en
              </MotionH3>
              <MotionDiv className="flex space-x-4">
                {socialLinks.map((link) => (
                  <MotionA
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={linkVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    className="text-light-primary dark:text-dark-primary transition-all duration-300 flex items-center justify-center w-10 h-10 rounded-full bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur hover:shadow-lg"
                    aria-label={link.name}
                  >
                    <SocialIcon
                      name={
                        link.name as
                          | "GitHub"
                          | "LinkedIn"
                          | "Twitter"
                          | "Instagram"
                      }
                    />
                  </MotionA>
                ))}
              </MotionDiv>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv variants={itemVariants} className="space-y-4">
            <MotionH3
              variants={itemVariants}
              className="text-lg font-semibold relative inline-block"
            >
              Enlaces Rápidos
              <MotionSpan
                className="absolute -bottom-1 left-0 h-0.5 bg-light-accent dark:bg-dark-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.5, delay: 0.7 }}
              />
            </MotionH3>

            <MotionUl variants={itemVariants} className="space-y-2">
              {quickLinks.map((link, index) => (
                <MotionLi
                  key={link.name}
                  custom={index}
                  variants={linkVariants}
                >
                  <MotionA
                    href={link.url}
                    className="text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors duration-300 flex items-center"
                    whileHover="hover"
                  >
                    <MotionSpan
                      className="w-1.5 h-1.5 rounded-full bg-light-accent dark:bg-dark-accent mr-2"
                      initial={{ scale: 0.8 }}
                      whileHover={{ scale: 1.5 }}
                      transition={{ duration: 0.2 }}
                    />
                    {link.name}
                  </MotionA>
                </MotionLi>
              ))}
            </MotionUl>
          </MotionDiv>

          <MotionDiv variants={itemVariants} className="space-y-4">
            <MotionH3
              variants={itemVariants}
              className="text-lg font-semibold relative inline-block"
            >
              Newsletter
              <MotionSpan
                className="absolute -bottom-1 left-0 h-0.5 bg-light-accent dark:bg-dark-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.5, delay: 0.9 }}
              />
            </MotionH3>

            <MotionP
              variants={itemVariants}
              className="text-light-secondary dark:text-dark-secondary"
            >
              Suscríbete para recibir las últimas novedades y actualizaciones.
            </MotionP>

            <MotionForm
              variants={itemVariants}
              className="mt-2"
              onSubmit={handleSubscribe}
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <MotionInput
                  type="email"
                  placeholder="Tu email"
                  required
                  className="px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-accent/20 dark:border-dark-accent/20 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent text-light-primary dark:text-dark-primary transition-all duration-300"
                  whileFocus={{
                    scale: 1.01,
                    boxShadow: "0 0 0 2px rgba(136, 136, 136, 0.2)",
                  }}
                  transition={{ duration: 0.2 }}
                />
                <MotionButton
                  type="submit"
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-light-bg dark:text-dark-bg rounded-lg font-medium overflow-hidden relative group"
                >
                  <MotionSpan className="flex items-center justify-center">
                    ↑
                  </MotionSpan>
                  <MotionSpan
                    className="absolute inset-0 bg-light-accent dark:bg-dark-accent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                </MotionButton>
              </div>
            </MotionForm>
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="h-px bg-gradient-to-r from-transparent via-light-accent/30 dark:via-dark-accent/30 to-transparent my-8"
        />

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left text-light-secondary dark:text-dark-secondary text-sm"
        >
          <MotionP className="mb-2 sm:mb-0">
            © {currentYear} Portfolio. Todos los derechos reservados.
          </MotionP>

          <MotionDiv
            className="flex items-center space-x-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, staggerChildren: 0.1 }}
          >
            <MotionA
              href="/privacidad"
              className="text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Privacidad
            </MotionA>
            <MotionSpan className="text-light-accent/50 dark:text-dark-accent/50">
              •
            </MotionSpan>
            <MotionA
              href="/terminos"
              className="text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Términos
            </MotionA>
            <MotionSpan className="text-light-accent/50 dark:text-dark-accent/50">
              •
            </MotionSpan>
            <MotionA
              href="/sitemap"
              className="text-light-secondary dark:text-dark-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Sitemap
            </MotionA>
          </MotionDiv>
        </MotionDiv>

        <MotionA
          href="#home"
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-light-primary dark:bg-dark-primary text-light-bg dark:text-dark-bg flex items-center justify-center shadow-lg z-50"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <svg
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
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </MotionA>
      </div>
    </footer>
  );
};

export default Footer;
