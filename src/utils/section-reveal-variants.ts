import { Variants } from "framer-motion";

const springSmooth = { type: "spring" as const, damping: 18, stiffness: 80 };
const springBouncy = { type: "spring" as const, damping: 14, stiffness: 100 };

export const sectionReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 48,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...springSmooth,
      when: "beforeChildren",
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

export const sectionRevealItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
};

export const sectionRevealSlideRight: Variants = {
  hidden: { opacity: 0, x: 56 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springSmooth,
  },
};

export const sectionRevealHeader: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springBouncy, delay: 0.02 },
  },
};

export const sectionRevealSubheader: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springSmooth, delay: 0.08 },
  },
};

export const sectionRevealCard: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springBouncy,
      delay: Math.min(0.04 + i * 0.04, 0.4),
    },
  }),
};
