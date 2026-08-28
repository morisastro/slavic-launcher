/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 900: "#0a0d12", 850: "#0f1419", 800: "#141a22", 700: "#1c2530", 600: "#2a3543" },
        accent: { DEFAULT: "#5b8cff", glow: "#7aa4ff", dim: "#3a63c4" },
        muted: "#8a96a8",
        ok: "#3dd68c",
        warn: "#f5a623",
        err: "#ff5b5b",
      },
      fontFamily: { sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"] },
      boxShadow: { glow: "0 0 24px -4px rgba(91,140,255,0.45)" },
    },
  },
  plugins: [],
};
