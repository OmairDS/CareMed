import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#15293F",
          light: "#1E293B",
        },
        teal: {
          DEFAULT: "#2E9E8F",
          dark: "#2A8C82",
        },
        gold: "#C9A227",
      },
      fontFamily: {
        sans: ["Trebuchet MS", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
