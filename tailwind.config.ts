import type { Config } from "tailwindcss";

// Design tokens live in src/app/globals.css as space-separated RGB channels,
// so opacity utilities (bg-brand-500/20) keep working.
const scale = (name: string) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [
      n,
      `rgb(var(--${name}-${n}) / <alpha-value>)`,
    ])
  );

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
      // Small text is bumped globally: helper text and labels were too small for long reading.
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.5rem" }],
        base: ["1rem", { lineHeight: "1.7rem" }],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Warm neutrals (50-200) → cool ink (400-900). 400+ meets 4.5:1 on white.
        slate: scale("slate"),
        // Primary: petrol blue (kept from the original brand blue)
        brand: scale("brand"),
        // Secondary: blue-green, used for supporting accents
        teal: scale("teal"),
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(21 29 38 / 0.04), 0 1px 3px rgb(21 29 38 / 0.05)",
        lift: "0 2px 4px rgb(21 29 38 / 0.04), 0 8px 20px rgb(21 29 38 / 0.07)",
      },
    },
  },
  plugins: [],
};
export default config;
