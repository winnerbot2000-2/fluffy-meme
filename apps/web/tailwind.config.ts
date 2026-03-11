import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/graph-engine/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        app: {
          background: "var(--app-background)",
          foreground: "var(--app-foreground)",
          panel: "var(--app-panel)",
          border: "var(--app-border)",
        },
      },
      backgroundImage: {
        "app-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 120px -40px rgba(56,189,248,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
