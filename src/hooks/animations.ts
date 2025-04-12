import { AnimationProps } from "framer-motion";

export const fadeIn: AnimationProps["animate"] = {
  opacity: 1,
  transition: {
    duration: 0.5,
    ease: "easeInOut",
  },
};

export const initialFadeIn: AnimationProps["initial"] = {
  opacity: 0,
};

export const slideUp: AnimationProps["animate"] = {
  opacity: 1,
  y: 0,
  transition: {
    duration: 0.5,
    ease: "easeOut",
  },
};

export const initialSlideUp: AnimationProps["initial"] = {
  opacity: 0,
  y: 20,
};

export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: "easeInOut",
  },
};

export const mobileMenuAnimation = {
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

export const staggerContainer = {
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
