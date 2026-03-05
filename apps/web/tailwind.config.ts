import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        sand: "rgb(var(--color-sand) / <alpha-value>)",
        pulse: "rgb(var(--color-pulse) / <alpha-value>)",
        cyan: "rgb(var(--color-cyan) / <alpha-value>)",
        ember: "rgb(var(--color-ember) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"]
      },
      boxShadow: {
        panel: "0 18px 48px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
