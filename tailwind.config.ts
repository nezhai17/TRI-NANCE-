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
          navy: "#172B4D",
          deep: "#101D35",
          accent: "#4263A5",
          border: "#E4E9F0",
          bg: "#F6F8FB",
          surface: "#FFFFFF",
          text: {
            primary: "#1D2939",
            secondary: "#667085",
            muted: "#98A2B3",
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
            DEFAULT: "#667085",
            light: "#F2F4F7",
            dark: "#344054",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
