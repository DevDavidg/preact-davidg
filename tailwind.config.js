/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        light: {
          bg: "var(--color-bg, #FAFAFA)",
          "bg-secondary": "var(--color-bg-secondary, #F1F3F4)",
          "bg-tertiary": "var(--color-bg-tertiary, #E8EAED)",
          primary: "var(--color-primary, #2D3436)",
          secondary: "var(--color-secondary, #636E72)",
          tertiary: "var(--color-tertiary, #B2BEC3)",
          accent: "var(--color-accent, #0984E3)",
          "accent-secondary": "var(--color-accent-secondary, #00B894)",
          "accent-tertiary": "var(--color-accent-tertiary, #E17055)",
          muted: "var(--color-muted, #F8F9FA)",
          border: "var(--color-border, #DDD)",
          "border-light": "var(--color-border-light, #E9ECEF)",
          success: "var(--color-success, #00B894)",
          warning: "var(--color-warning, #FDCB6E)",
          error: "var(--color-error, #E17055)",
          info: "var(--color-info, #74B9FF)",
          surface: "var(--color-surface)",
          "surface-hover": "var(--color-surface-hover)",
          overlay: "var(--color-overlay)",
        },
        dark: {
          bg: "var(--color-bg, #1D1616)",
          "bg-secondary": "var(--color-bg-secondary, #2A1F1F)",
          "bg-tertiary": "var(--color-bg-tertiary, #3D2828)",
          primary: "var(--color-primary, #EEEEEE)",
          secondary: "var(--color-secondary, #C8C8C8)",
          tertiary: "var(--color-tertiary, #A8A8A8)",
          accent: "var(--color-accent, #D84040)",
          "accent-secondary": "var(--color-accent-secondary, #8E1616)",
          "accent-tertiary": "var(--color-accent-tertiary, #FF6B6B)",
          muted: "var(--color-muted, #332626)",
          border: "var(--color-border, #4A3535)",
          "border-light": "var(--color-border-light, #3D2828)",
          success: "var(--color-success, #51CF66)",
          warning: "var(--color-warning, #FFD43B)",
          error: "var(--color-error, #FF6B6B)",
          info: "var(--color-info, #74C0FC)",
          surface: "var(--color-surface)",
          "surface-hover": "var(--color-surface-hover)",
          overlay: "var(--color-overlay)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-subtle": "pulseSubtle 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  safelist: [
    // Glass effects with new colors
    "bg-light-surface",
    "dark:bg-dark-surface",
    "bg-light-surface-hover",
    "dark:bg-dark-surface-hover",
    "border-light-border",
    "dark:border-dark-border",
    "border-light-border-light",
    "dark:border-dark-border-light",

    // Background variations
    // Kept /50 and /70 variants for bg-secondary based on original plan, removed others
    "bg-light-bg-secondary/50",
    "dark:bg-dark-bg-secondary/50",
    "bg-light-bg-secondary/70",
    "dark:bg-dark-bg-secondary/70",

    // Kept /50 variant for bg-tertiary, removed others
    "bg-light-bg-tertiary/50",
    "dark:bg-dark-bg-tertiary/50",

    // Accent color variations
    // Kept /50 variant for accent colors, removed others
    "bg-light-accent/50",
    "dark:bg-dark-accent/50",

    // Text color variations
    // Removed all opacity variants for secondary and tertiary text colors as they were not found or assumed not needed.

    // Border variations
    // Removed all border opacity variations as they were not found or covered by hover rules.

    // Status colors
    // Removed background opacity variations for status colors, kept solid text colors.
    "text-light-success",
    "dark:text-dark-success",
    "text-light-warning",
    "dark:text-dark-warning",
    "text-light-error",
    "dark:text-dark-error",
    "text-light-info",
    "dark:text-dark-info",

    // Gradient combinations
    "from-light-accent",
    "dark:from-dark-accent",
    "from-light-accent-secondary",
    "dark:from-dark-accent-secondary",
    "from-light-accent-tertiary",
    "dark:from-dark-accent-tertiary",
    "to-light-accent",
    "dark:to-dark-accent",
    "to-light-accent-secondary",
    "dark:to-dark-accent-secondary",
    "to-light-accent-tertiary",
    "dark:to-dark-accent-tertiary",
    "via-light-accent",
    "dark:via-dark-accent",
    "via-light-accent-secondary",
    "dark:via-dark-accent-secondary",
  ],
  plugins: [require("tailwindcss-animate")],
};
