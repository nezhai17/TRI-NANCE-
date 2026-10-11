import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: "#111D32",
          navy: "#192C49",
          accent: "#46699D",
          border: "#E2E7EF",
          borderSubtle: "#EEF2F7",
          bg: "#F5F7FA",
          surface: "#FFFFFF",
          text: {
            primary: "#202B3C",
            secondary: "#697586",
            muted: "#9AA4B2",
          },
          positive: {
            DEFAULT: "#12B76A",
            light: "#ECFDF3",
            dark: "#027A48",
          },
          warning: {
            DEFAULT: "#F79009",
            light: "#FFFAEB",
            dark: "#B54708",
          },
          danger: {
            DEFAULT: "#F04438",
            light: "#FEF3F2",
            dark: "#B42318",
          },
          neutral: {
            DEFAULT: "#697586",
            light: "#EEF2F7",
            dark: "#202B3C",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
