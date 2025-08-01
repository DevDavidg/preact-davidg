import { useState, useEffect } from "preact/hooks";
import { updateNoiseOpacity } from "../utils/noiseTexture";

type Theme = "light" | "dark";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";

    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) return savedTheme;

    return "dark";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      updateNoiseOpacity(true);
    } else {
      document.documentElement.classList.remove("dark");
      updateNoiseOpacity(false);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
};

export default useTheme;
