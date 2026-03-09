import { useEffect, useState } from "preact/hooks";

const prefersReducedMotion = (): boolean =>
  typeof globalThis.window !== "undefined" &&
  globalThis.window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface UseSectionRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export const useSectionReveal = <T extends HTMLElement>(
  ref: { current: T | null },
  options: UseSectionRevealOptions = {}
): boolean => {
  const { threshold = 0, rootMargin = "150px 0px 150px 0px", once = true } = options;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    let observer: IntersectionObserver | null = null;
    const id = setTimeout(() => {
      const el = ref.current;
      if (!el || !(el instanceof Element)) return;

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && el) observer?.unobserve(el);
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(el);
    }, 0);

    return () => {
      clearTimeout(id);
      if (observer && ref.current) {
        observer.unobserve(ref.current);
        observer.disconnect();
      }
    };
  }, [ref, threshold, rootMargin, once]);

  return prefersReducedMotion() ? true : isVisible;
};
