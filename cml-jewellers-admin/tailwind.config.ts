import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14100f",
          900: "#1d1715",
          700: "#413734",
          500: "#6b5d59",
          300: "#a89c97",
          100: "#e9e2de",
        },
        maroon: {
          900: "#3d0f14",
          700: "#5c151d",
          600: "#711a23",
          500: "#8a1f29",
        },
        gold: {
          600: "#a3782f",
          500: "#c0973f",
          400: "#d4ac5c",
          200: "#ecdbb4",
          100: "#f6ede0",
        },
        paper: "#faf8f5",
        line: "#e5ddd4",
        good: "#2f6f4f",
        warn: "#b5761f",
        bad: "#a3312a",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20,16,15,0.06), 0 1px 0 rgba(20,16,15,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
