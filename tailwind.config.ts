import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heebo: ["var(--font-heebo)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#e8f4fd",
          100: "#d0e8fb",
          200: "#a8d0f5",
          300: "#72b3ec",
          400: "#4a92df",
          500: "#2c6e9e",
          600: "#245c87",
          700: "#1a4f75",
          800: "#143d5c",
          900: "#1a3a5c",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
