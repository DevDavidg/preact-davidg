import { useState, useEffect } from "preact/hooks";

type Theme = "light" | "dark";

// Safari-specific detection and fixes
const isSafari = () => {
  if (typeof window === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const detectSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";

  // Safari-specific media query handling
  if (isSafari()) {
    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      return mediaQuery.matches ? "dark" : "light";
    } catch (error) {
      console.warn("Safari theme detection failed, using fallback:", error);
      return "light"; // Default to light mode for Safari fallback
    }
  }

  // Standard detection for other browsers
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) return savedTheme;

    // For Safari, default to light mode if no preference is saved
    if (isSafari()) {
      return detectSystemTheme();
    }

    return "dark";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("theme", theme);

    // Safari-specific DOM manipulation
    if (isSafari()) {
      // Force reflow for Safari
      document.documentElement.style.display = "none";
      document.documentElement.offsetHeight; // Trigger reflow
      document.documentElement.style.display = "";
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }

    // Safari-specific CSS variable enforcement
    if (isSafari()) {
      setTimeout(() => {
        const event = new CustomEvent("theme-changed", {
          detail: { theme },
        });
        window.dispatchEvent(event);
      }, 100);
    }
  }, [theme]);

  // Listen for system theme changes (especially important for Safari)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    // Safari-specific event handling
    if (isSafari()) {
      try {
        mediaQuery.addEventListener("change", handleChange);
      } catch (error) {
        console.warn("Safari media query listener failed:", error);
        // Fallback for older Safari versions
        mediaQuery.addListener(handleChange);
      }
    } else {
      mediaQuery.addEventListener("change", handleChange);
    }

    return () => {
      if (isSafari()) {
        try {
          mediaQuery.removeEventListener("change", handleChange);
        } catch (error) {
          mediaQuery.removeListener(handleChange);
        }
      } else {
        mediaQuery.removeEventListener("change", handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
};

export default useTheme;
