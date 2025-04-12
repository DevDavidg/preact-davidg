import { FunctionComponent } from "preact";
import { useEffect, useRef, useCallback } from "preact/hooks";
import { ENV } from "../config/env";
import PerformanceMonitor from "../utils/PerformanceMonitor";

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    rtt?: number;
    downlink?: number;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

const HEAVY_SELECTORS = [
  ".animate-float",
  ".animate-float-3d",
  ".animate-float-reverse",
  ".preserve-3d",
  ".perspective",
  "[data-animate='true']",
  ".motion-safe",
  "[class*='parallax']",
  ".backdrop-blur-md",
  ".MotionDiv",
  ".MotionSpan",
  ".MotionA",
];

const ANIMATION_CONFIG = {
  maxSimultaneousAnimations: 20,
  viewportBuffer: 0.5,
  animationThrottle: 100,
  lowEndDeviceThreshold: 30,
};

const SCROLL_THROTTLE = 16;
const RESOURCE_CLEANUP_INTERVAL = 30000;
const MEMORY_THRESHOLD = 80;

interface LagEventData {
  deltaTime: number;
  fps: number;
}

interface CountEventData {
  count: number;
}

export const usePerformanceOptimizer = () => {
  if (!ENV.PERFORMANCE_OPTIMIZER_ENABLED) {
    return;
  }

  const rafRef = useRef<number | null>(null);
  const ticking = useRef(false);
  const observersRef = useRef<Map<Element, IntersectionObserver>>(new Map());
  const debouncedTasksRef = useRef<Map<string, number>>(new Map());
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const cleanupInterval = useRef<number>();
  const lastMemoryCheck = useRef<number>(0);

  const supportsIdleCallback =
    typeof window !== "undefined" && "requestIdleCallback" in window;

  const debounce = useCallback((fn: Function, delay: number, id: string) => {
    if (debouncedTasksRef.current.has(id)) {
      window.clearTimeout(debouncedTasksRef.current.get(id));
    }

    const timeoutId = window.setTimeout(() => {
      fn();
      debouncedTasksRef.current.delete(id);
    }, delay);

    debouncedTasksRef.current.set(id, timeoutId);
  }, []);

  const applyLowPerformanceMode = useCallback(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      [data-perf-mode="low"] * {
        animation-duration: 0.5s !important;
        transition-duration: 0.2s !important;
        backdrop-filter: none !important;
        filter: none !important;
        transform: none !important;
        box-shadow: none !important;
      }
      
      [data-perf-mode="low"] img, [data-perf-mode="low"] video {
        image-rendering: optimizeSpeed !important;
        transform: none !important;
      }
      
      [data-perf-mode="low"] .animate-float,
      [data-perf-mode="low"] .animate-float-3d,
      [data-perf-mode="low"] .animate-float-reverse,
      [data-perf-mode="low"] .preserve-3d,
      [data-perf-mode="low"] .perspective,
      [data-perf-mode="low"] [data-animate='true'],
      [data-perf-mode="low"] .motion-safe,
      [data-perf-mode="low"] [class*='parallax'],
      [data-perf-mode="low"] .backdrop-blur-md,
      [data-perf-mode="low"] .MotionDiv,
      [data-perf-mode="low"] .MotionSpan,
      [data-perf-mode="low"] .MotionA {
        animation: none !important;
        transform: none !important;
        transition: none !important;
      }
    `;

    if (!document.getElementById("low-performance-mode")) {
      styleEl.id = "low-performance-mode";
      document.head.appendChild(styleEl);
    }

    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (img.src && !img.hasAttribute("data-original-src")) {
        img.setAttribute("data-original-src", img.src);

        if (img.src.includes("?") || img.src.includes("&")) {
          img.src = img.src + "&quality=60";
        } else {
          img.src = img.src + "?quality=60";
        }
      }
    });

    const animations = document.getAnimations();
    animations.forEach((animation) => {
      if (animation.playState === "running") {
        animation.pause();
      }
    });

    if (typeof window.gc === "function") {
      try {
        window.gc();
      } catch (e) {
        console.debug("GC no disponible");
      }
    }
  }, []);

  const determineOptimizationLevel = useCallback(() => {
    const nav = navigator as NavigatorWithConnection;

    const cpuCores = navigator?.hardwareConcurrency || 4;
    const memory = (navigator as any)?.deviceMemory || 4;
    const connection = nav.connection;
    const connectionType = connection?.effectiveType ?? "unknown";
    const rtt = connection?.rtt ?? 0;
    const downlink = connection?.downlink ?? 10;
    const saveData = connection?.saveData ?? false;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let deviceCapabilityScore = 100;

    if (cpuCores <= 2) deviceCapabilityScore -= 30;
    else if (cpuCores <= 4) deviceCapabilityScore -= 15;

    if (memory <= 2) deviceCapabilityScore -= 30;
    else if (memory <= 4) deviceCapabilityScore -= 15;

    if (connectionType === "2g" || connectionType === "slow-2g")
      deviceCapabilityScore -= 25;
    else if (connectionType === "3g") deviceCapabilityScore -= 15;

    if (rtt > 500) deviceCapabilityScore -= 20;
    else if (rtt > 200) deviceCapabilityScore -= 10;

    if (downlink < 1) deviceCapabilityScore -= 20;
    else if (downlink < 5) deviceCapabilityScore -= 10;

    if (saveData) deviceCapabilityScore -= 15;
    if (reducedMotion) deviceCapabilityScore -= 20;

    let performanceLevel = "medium";
    if (deviceCapabilityScore >= 70) {
      performanceLevel = "high";
    } else if (deviceCapabilityScore < 40) {
      performanceLevel = "low";
    }

    return {
      level: performanceLevel,
      score: deviceCapabilityScore,
      reducedMotion,
      saveData,
      connectionType,
    };
  }, []);

  const optimizeAnimations = useCallback(() => {
    const viewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY;
    const bufferZone = viewportHeight * ANIMATION_CONFIG.viewportBuffer;

    let activeAnimations = 0;
    const elements = document.querySelectorAll(HEAVY_SELECTORS.join(","));

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + currentScrollY;
      const elementBottom = elementTop + rect.height;

      const isInViewport =
        elementBottom >= currentScrollY - bufferZone &&
        elementTop <= currentScrollY + viewportHeight + bufferZone;

      if (
        isInViewport &&
        activeAnimations < ANIMATION_CONFIG.maxSimultaneousAnimations
      ) {
        element.classList.remove("pause-animation");
        activeAnimations++;
      } else {
        element.classList.add("pause-animation");
      }
    });

    if (typeof window !== "undefined") {
      (window as any).__activeAnimations = activeAnimations;
    }
  }, []);

  const refreshVisibilityOptimizations = useCallback(() => {
    if (!isScrolling.current) {
      const viewportHeight = window.innerHeight;
      const currentScrollY = window.scrollY;
      const documentHeight = document.body.scrollHeight;

      const isNearBottom =
        currentScrollY + viewportHeight >= documentHeight - 100;

      document.documentElement.classList.toggle(
        "optimize-scroll",
        !isNearBottom
      );

      if (isNearBottom) {
        const sections = document.querySelectorAll(
          'section[data-visible="false"]'
        );
        sections.forEach((section) => {
          (section as HTMLElement).dataset.visible = "true";
        });
      }
    }
  }, []);

  const setupElementOptimizations = useCallback(() => {
    if (typeof window === "undefined" || !window.IntersectionObserver) return;

    const optimizationLevel = determineOptimizationLevel();
    const html = document.documentElement;

    html.setAttribute("data-perf-mode", optimizationLevel.level);
    html.classList.toggle("reduced-motion", optimizationLevel.reducedMotion);
    html.classList.toggle("data-saver", optimizationLevel.saveData);
    html.classList.toggle("low-end-device", optimizationLevel.level === "low");

    const createHeavyElementObserver = (element: Element) => {
      if (observersRef.current.has(element)) return;

      const observer = new IntersectionObserver(
        (entries) => handleHeavyElementIntersection(entries, optimizationLevel),
        {
          threshold: [0, 0.1, 0.5],
          rootMargin: "20% 0px 20% 0px",
        }
      );

      observer.observe(element);
      observersRef.current.set(element, observer);
    };

    const handleVisibleElement = (target: Element, optimizationLevel: any) => {
      target.classList.add("in-viewport");
      target.classList.remove("out-viewport", "pause-animation");

      if (optimizationLevel.level !== "low") {
        target.classList.remove("optimized-hidden");
      }

      const animateElements = target.querySelectorAll(
        '[data-animation-paused="true"]'
      );

      const resumeAnimation = (el: Element) => {
        if (
          typeof window !== "undefined" &&
          (window as any).__activeAnimations <
            ANIMATION_CONFIG.maxSimultaneousAnimations
        ) {
          (el as HTMLElement).style.animationPlayState = "running";
          el.removeAttribute("data-animation-paused");
          (window as any).__activeAnimations++;
        }
      };

      animateElements.forEach(resumeAnimation);
    };

    const handleHiddenElement = (target: Element) => {
      target.classList.remove("in-viewport");
      target.classList.add("out-viewport", "pause-animation");

      const animateElements = target.querySelectorAll('[style*="animation"]');

      const pauseAnimation = (el: Element) => {
        if ((el as HTMLElement).style.animationPlayState !== "paused") {
          (el as HTMLElement).style.animationPlayState = "paused";
          el.setAttribute("data-animation-paused", "true");
          if (typeof window !== "undefined") {
            (window as any).__activeAnimations = Math.max(
              0,
              ((window as any).__activeAnimations || 0) - 1
            );
          }
        }
      };

      animateElements.forEach(pauseAnimation);
    };

    const handleHeavyElementIntersection = (
      entries: IntersectionObserverEntry[],
      optimizationLevel: any
    ) => {
      entries.forEach((entry) => {
        const target = entry.target;
        const isIntersecting = entry.isIntersecting;

        if (isIntersecting) {
          handleVisibleElement(target, optimizationLevel);
        } else {
          handleHiddenElement(target);
        }
      });
    };

    const handleVisibleSection = (target: HTMLElement) => {
      target.dataset.visible = "true";

      const canvasElements = target.querySelectorAll("canvas");

      const resumeCanvas = (canvas: Element) => {
        if (canvas.hasAttribute("data-paused")) {
          const originalContext =
            canvas.getAttribute("data-context-type") ?? "2d";
          const canvasElement = canvas as HTMLCanvasElement;
          canvasElement.getContext(
            originalContext as "2d" | "webgl" | "webgl2"
          );
          canvas.removeAttribute("data-paused");
          canvas.dispatchEvent(new CustomEvent("canvas:resume"));
        }
      };

      canvasElements.forEach(resumeCanvas);
    };

    const handleHiddenSection = (target: HTMLElement) => {
      const viewportHeight = window.innerHeight;
      const currentScrollY = window.scrollY;
      const documentHeight = document.body.scrollHeight;
      const isNearBottom =
        currentScrollY + viewportHeight >= documentHeight - 100;

      if (!isNearBottom) {
        target.dataset.visible = "false";

        const canvasElements = target.querySelectorAll("canvas");

        const pauseCanvas = (canvas: Element) => {
          if (!canvas.hasAttribute("data-paused")) {
            const canvasElement = canvas as HTMLCanvasElement;

            let ctx = "2d";
            if (canvasElement.getContext("webgl")) {
              ctx = "webgl";
            } else if (canvasElement.getContext("webgl2")) {
              ctx = "webgl2";
            }

            canvas.setAttribute("data-context-type", ctx);
            canvas.setAttribute("data-paused", "true");
            canvas.dispatchEvent(new CustomEvent("canvas:pause"));
          }
        };

        canvasElements.forEach(pauseCanvas);
      }
    };

    const handleSectionIntersection = (
      entries: IntersectionObserverEntry[]
    ) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          handleVisibleSection(target);
        } else {
          handleHiddenSection(target);
        }
      });
    };

    const handleVideoPlay = (video: HTMLVideoElement) => {
      if (video.hasAttribute("data-autoplay")) {
        video.play().catch(handleVideoError);
      }
    };

    const handleVideoError = () => {
      console.warn("Error al reproducir el video");
    };

    const handleVideoIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          handleVideoPlay(video);
        } else {
          video.pause();
        }
      });
    };

    const processMediaElement = (media: Element) => {
      const mediaEl = media as HTMLElement;
      if (!media.hasAttribute("width") && mediaEl.offsetWidth > 0) {
        media.setAttribute("width", mediaEl.offsetWidth.toString());
      }
      if (!media.hasAttribute("height") && mediaEl.offsetHeight > 0) {
        media.setAttribute("height", mediaEl.offsetHeight.toString());
      }

      if (
        !media.hasAttribute("loading") &&
        !media.hasAttribute("data-no-lazy")
      ) {
        media.setAttribute("loading", "lazy");
        media.setAttribute("decoding", "async");
      }

      if (!media.hasAttribute("data-no-visibility")) {
        mediaEl.style.contentVisibility = "auto";
      }

      if (
        media.tagName === "IMG" &&
        (media as HTMLImageElement).src.toLowerCase().endsWith(".gif") &&
        !media.hasAttribute("data-no-convert")
      ) {
        convertGifToVideo(media as HTMLImageElement);
      }

      if (media.tagName === "VIDEO" && !observersRef.current.has(media)) {
        const observer = new IntersectionObserver(handleVideoIntersection, {
          threshold: 0.1,
        });

        observer.observe(media);
        observersRef.current.set(media, observer);

        if (media.hasAttribute("autoplay")) {
          media.setAttribute("data-autoplay", "true");
          media.removeAttribute("autoplay");
        }
      }
    };

    const applyContainStyles = (container: Element) => {
      if (
        !container.hasAttribute("style") ||
        !container.getAttribute("style")?.includes("contain:")
      ) {
        (container as HTMLElement).style.contain = "layout paint";
      }
    };

    HEAVY_SELECTORS.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;

        elements.forEach(createHeavyElementObserver);
      } catch (error) {
        console.warn(`Error optimizing selector "${selector}":`, error);
      }
    });

    const createSectionObserver = (section: Element) => {
      if (observersRef.current.has(section)) return;

      const observer = new IntersectionObserver(handleSectionIntersection, {
        threshold: 0,
        rootMargin: "10% 0px",
      });

      observer.observe(section);
      observersRef.current.set(section, observer);
    };

    try {
      const sections = document.querySelectorAll("section");
      sections.forEach(createSectionObserver);
    } catch (error) {
      console.warn("Error optimizing sections:", error);
    }

    try {
      const mediaElements = document.querySelectorAll("img, video");
      mediaElements.forEach(processMediaElement);

      document.querySelectorAll(".container").forEach(applyContainStyles);
    } catch (error) {
      console.warn("Error optimizing media elements:", error);
    }
  }, [determineOptimizationLevel]);

  const convertGifToVideo = (img: HTMLImageElement) => {
    if (!img.complete || !img.src || img.hasAttribute("data-converted")) return;

    try {
      const video = document.createElement("video");
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;

      if (img.alt) video.setAttribute("aria-label", img.alt);
      if (img.width) video.width = img.width;
      if (img.height) video.height = img.height;
      if (img.className) video.className = img.className;

      if (img.loading === "lazy") {
        video.setAttribute("loading", "lazy");
      }

      const source = document.createElement("source");

      const videoUrl = img.src.replace(/\.gif$/i, ".mp4");
      source.src = videoUrl;
      source.type = "video/mp4";

      video.appendChild(source);

      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.position = "relative";
      container.style.aspectRatio =
        img.width && img.height ? `${img.width}/${img.height}` : "auto";

      if (img.parentNode) {
        img.parentNode.insertBefore(container, img);
        container.appendChild(video);
        img.setAttribute("data-converted", "true");
        img.style.display = "none";
      }
    } catch (error) {
      console.warn("Error converting GIF to video:", error);
    }
  };

  const handleResizeFrame = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    document.documentElement.style.setProperty(
      "--viewport-width",
      `${viewportWidth}px`
    );
    document.documentElement.style.setProperty(
      "--viewport-height",
      `${viewportHeight}px`
    );

    document.documentElement.classList.toggle("is-mobile", viewportWidth < 768);
    document.documentElement.classList.toggle(
      "is-tablet",
      viewportWidth >= 768 && viewportWidth < 1024
    );
    document.documentElement.classList.toggle(
      "is-desktop",
      viewportWidth >= 1024
    );

    ticking.current = false;

    if (supportsIdleCallback) {
      (window as any).requestIdleCallback(() => setupElementOptimizations());
    } else {
      debounce(setupElementOptimizations, 200, "resize-optimizations");
    }
  }, [debounce, setupElementOptimizations, supportsIdleCallback]);

  const handleResize = useCallback(() => {
    if (!ticking.current) {
      rafRef.current = requestAnimationFrame(handleResizeFrame);
    }

    ticking.current = true;
  }, [handleResizeFrame]);

  const cleanupResources = useCallback(() => {
    if (typeof window !== "undefined" && "gc" in window) {
      try {
        (window as any).gc();
      } catch (e) {
        console.warn("GC no disponible");
      }
    }
  }, []);

  const checkMemoryUsage = useCallback(() => {
    if (
      typeof performance !== "undefined" &&
      (performance as PerformanceWithMemory).memory
    ) {
      const memoryInfo = (performance as PerformanceWithMemory).memory;
      if (memoryInfo) {
        const usedHeapPercentage =
          (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        if (usedHeapPercentage > MEMORY_THRESHOLD) {
          cleanupResources();
        }
      }
    }
  }, [cleanupResources]);

  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = window.setTimeout(() => {
      const now = performance.now();
      if (now - lastMemoryCheck.current > 1000) {
        checkMemoryUsage();
        lastMemoryCheck.current = now;
      }
    }, SCROLL_THROTTLE);
  }, [checkMemoryUsage]);

  const debouncedHandleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = window.setTimeout(() => {
      handleScroll();
    }, SCROLL_THROTTLE);
  }, [handleScroll]);

  const scrollListener = useCallback(
    (_event: Event) => {
      debouncedHandleScroll();
    },
    [debouncedHandleScroll]
  );

  const handleVisibilityOnLoad = () => {
    setTimeout(refreshVisibilityOptimizations, 500);
  };

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      
      .AnimatedTitle {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateZ(0) !important;
      }
      
      .AnimatedTitle span, 
      .AnimatedTitle .text-gradient, 
      .AnimatedTitle .special-word, 
      .AnimatedTitle .animated-word {
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
        color: transparent !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
      }
      
      .optimize-scroll [data-visible="false"] {
        content-visibility: auto;
        contain-intrinsic-size: 0 500px;
      }
      
      [data-visible="false"] {
        visibility: visible;
        min-height: 1px;
      }
      
      .out-viewport {
        will-change: auto !important;
      }
      
      .optimized-hidden {
        will-change: auto !important;
      }
      
      .optimized-hidden img:not([src]), 
      .optimized-hidden img[src=""] {
        opacity: 0;
        min-height: 1px;
      }
      
      [data-animation-paused="true"] {
        animation-play-state: paused !important;
      }
      
      .AnimatedTitle, 
      .perspective, 
      .preserve-3d, 
      h1, h2, h3, 
      .text-gradient, 
      .special-word, 
      .animated-word {
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateZ(0) !important;
        will-change: auto !important;
      }
      
      [data-transform-disabled="true"].AnimatedTitle,
      [data-transform-disabled="true"].preserve-3d,
      [data-transform-disabled="true"].perspective {
        transform: translateZ(0) !important;
      }
      
      [data-transform-disabled="true"] {
        transform: none !important;
        will-change: auto !important;
      }
      
      h1, h2, h3, .text-gradient, [data-no-transform-disable] {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .preserve-3d span, .preserve-3d h1, .preserve-3d h2, .preserve-3d p {
        backface-visibility: hidden;
        transform-style: preserve-3d;
      }
      
      .text-gradient {
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        color: transparent !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
        transform: none !important;
        animation: none !important;
      }
      
      .text-gradient span, .gradient-char {
        color: transparent !important;
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
        transform: none !important;
        animation: none !important;
      }
      
      h1 span.text-gradient, 
      h1 span.text-gradient span,
      .text-gradient .animated-char {
        color: transparent !important;
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
        background-clip: text !important; 
        -webkit-background-clip: text !important;
        transform: none !important;
        animation: none !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      .animated-char {
        min-width: 0.1em !important;
        min-height: 1em !important;
        display: inline-block !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        animation: none !important;
      }
      
      .AnimatedTitle * {
        animation: none !important;
      }
      
      .AnimatedTitle {
        animation: fade-in 0.3s ease-in-out forwards !important;
      }
      
      @keyframes fade-in {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      
      .special-word, .special-word span {
        color: transparent !important;
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        display: inline-block !important;
      }
      
      .animated-word, .animated-word span {
        color: transparent !important;
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        display: inline-block !important;
      }
      
      .AnimatedTitle span, .AnimatedTitle span span {
        animation: none !important;
      }
      
      @keyframes fix-transforms {
        0%, 100% { transform: translateZ(0.01px); }
      }
      
      .AnimatedTitle, .animated-word, .animated-char {
        animation: fix-transforms 0.01s linear forwards;
      }
      
      h1 > span, h2 > span, .text-gradient > span {
        transform: translateZ(0) !important;
        opacity: 1 !important;
        will-change: transform, opacity;
      }
      
      [data-transform-disabled="true"].text-gradient,
      [data-transform-disabled="true"].special-word,
      [data-transform-disabled="true"].animated-word {
        color: transparent !important;
        background-image: linear-gradient(135deg, var(--color-accent), var(--color-primary)) !important;
        background-clip: text !important;
        -webkit-background-clip: text !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
      }
      
      .low-end-device * {
        transition-duration: 0.1s !important;
        animation-duration: 0.2s !important;
      }
      
      .low-end-device .backdrop-blur-sm,
      .low-end-device .backdrop-blur-md,
      .low-end-device .backdrop-blur-lg {
        backdrop-filter: none !important;
      }
      
      .low-end-device .preserve-3d {
        transform-style: flat !important;
      }
      
      .low-end-device .shadow-lg,
      .low-end-device .shadow-xl {
        box-shadow: 0 1px 3px rgba(0,0,0,0.12) !important;
      }
      
      @media (max-width: 768px), (prefers-reduced-motion: reduce) {
        .animate-float, .animate-float-3d, .animate-float-reverse {
          animation: none !important;
        }
        
        .parallax-bg, [class*="layer-"] {
          transform: none !important;
          transition: none !important;
        }
        
        .backdrop-blur-md {
          backdrop-filter: blur(5px) !important;
        }
      }
      
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      [data-perf-mode="low"] * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      html {
        height: 100%;
        overflow: hidden;
      }
      
      body {
        scroll-behavior: smooth;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        overflow-anchor: auto;
      }
      
      footer, [id="contact"] {
        content-visibility: visible !important;
        visibility: visible !important;
      }
      
      .pause-animation {
        animation-play-state: paused !important;
        transform: none !important;
        transition: none !important;
      }
      
      .scrolling * {
        animation-play-state: paused !important;
        transition: none !important;
      }
      
      .scrolling .animate-float,
      .scrolling .animate-float-3d,
      .scrolling .animate-float-reverse {
        transform: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    const initialSetup = () => {
      handleResize();
      setupElementOptimizations();
    };

    if (document.readyState === "complete") {
      initialSetup();
    } else {
      window.addEventListener("load", initialSetup);
    }

    window.addEventListener("resize", handleResize, { passive: true });

    window.addEventListener("scroll", scrollListener, { passive: true });

    const nav = navigator as NavigatorWithConnection;
    if (nav.connection) {
      nav.connection.addEventListener("change", setupElementOptimizations);
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    reducedMotionQuery.addEventListener("change", setupElementOptimizations);

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let lowFPSCounter = 0;

    const checkPerformance = () => {
      const now = performance.now();
      const delta = now - lastFrameTime;
      frameCount++;

      if (delta > 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        handleFpsReport(fps, lowFPSCounter);
        frameCount = 0;
        lastFrameTime = now;
      }

      rafRef.current = requestAnimationFrame(checkPerformance);
    };

    const handleFpsReport = (fps: number, counter: number) => {
      let updatedCounter = counter;

      if (fps < 30) {
        updatedCounter++;

        if (updatedCounter >= 3) {
          document.documentElement.setAttribute("data-perf-mode", "low");
          applyLowPerformanceMode();
          console.debug(
            "Performance: Applied aggressive optimizations due to low FPS"
          );
        }
      } else {
        updatedCounter = Math.max(0, updatedCounter - 1);

        if (
          updatedCounter === 0 &&
          document.documentElement.hasAttribute("data-perf-mode")
        ) {
          document.documentElement.removeAttribute("data-perf-mode");
          console.debug(
            "Performance: Removed aggressive optimizations as FPS improved"
          );
        }
      }

      lowFPSCounter = updatedCounter;
    };

    rafRef.current = requestAnimationFrame(checkPerformance);

    window.addEventListener("load", handleVisibilityOnLoad);

    cleanupInterval.current = window.setInterval(
      cleanupResources,
      RESOURCE_CLEANUP_INTERVAL
    );

    const performanceMonitor = PerformanceMonitor.getInstance();

    performanceMonitor.on("lag", (data: LagEventData) => {
      if (data.fps < 30) {
        document.documentElement.setAttribute("data-perf-mode", "low");
        applyLowPerformanceMode();
        console.debug(
          `Performance: Applied aggressive optimizations due to lag (${data.fps.toFixed(
            1
          )} FPS)`
        );
      }
    });

    performanceMonitor.on("highBlurCount", (data: CountEventData) => {
      if (data.count > 30) {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
          [data-perf-mode="low"] [style*="blur"], 
          [data-perf-mode="low"] [class*="blur"] {
            filter: none !important;
            backdrop-filter: none !important;
          }
        `;

        if (!document.getElementById("blur-optimization")) {
          styleEl.id = "blur-optimization";
          document.head.appendChild(styleEl);
        }

        console.debug(
          `Performance: Applied blur optimizations (${data.count} blur elements)`
        );
      }
    });

    performanceMonitor.on("highAnimationCount", (data: CountEventData) => {
      if (data.count > 80) {
        const animations = document.getAnimations();
        animations.forEach((animation) => {
          const target = animation as unknown as { target?: Element };
          if (
            animation.playState === "running" &&
            target.target &&
            !target.target.hasAttribute("data-essential-animation")
          ) {
            animation.pause();
          }
        });

        console.debug(
          `Performance: Paused non-essential animations (${data.count} animations)`
        );
      }
    });

    performanceMonitor.on("highShadowCount", (data: CountEventData) => {
      if (data.count > 40) {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
          [data-perf-mode="low"] [style*="box-shadow"], 
          [data-perf-mode="low"] [class*="shadow"] {
            box-shadow: none !important;
          }
        `;

        if (!document.getElementById("shadow-optimization")) {
          styleEl.id = "shadow-optimization";
          document.head.appendChild(styleEl);
        }

        console.debug(
          `Performance: Applied shadow optimizations (${data.count} shadow elements)`
        );
      }
    });

    performanceMonitor.on("highTransform3DCount", (data: CountEventData) => {
      if (data.count > 15) {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
          [data-perf-mode="low"] [style*="transform: perspective"], 
          [data-perf-mode="low"] [style*="transform: translate3d"] {
            transform: none !important;
          }
        `;

        if (!document.getElementById("transform3d-optimization")) {
          styleEl.id = "transform3d-optimization";
          document.head.appendChild(styleEl);
        }

        console.debug(
          `Performance: Applied 3D transform optimizations (${data.count} 3D transform elements)`
        );
      }
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (scrollTimeout.current !== null) {
        clearTimeout(scrollTimeout.current);
      }

      observersRef.current.forEach((observer) => {
        observer.disconnect();
      });
      observersRef.current.clear();

      debouncedTasksRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      debouncedTasksRef.current.clear();

      window.removeEventListener("load", initialSetup);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", scrollListener);
      window.removeEventListener("load", handleVisibilityOnLoad);

      if (nav.connection) {
        nav.connection.removeEventListener("change", setupElementOptimizations);
      }

      reducedMotionQuery.removeEventListener(
        "change",
        setupElementOptimizations
      );

      if (document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }

      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [
    handleResize,
    setupElementOptimizations,
    supportsIdleCallback,
    debounce,
    handleScroll,
    debouncedHandleScroll,
    scrollListener,
    refreshVisibilityOptimizations,
    optimizeAnimations,
    cleanupResources,
    checkMemoryUsage,
    applyLowPerformanceMode,
  ]);
};

const PerformanceOptimizer: FunctionComponent = () => {
  usePerformanceOptimizer();

  return null;
};

export default PerformanceOptimizer;
