import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // DHRUV night-operations palette: restrained neutrals with status lights.
        dhruv: {
          bg: "#050505",
          secondary: "#0A0A0A",
          surface: "#101010",
          elevated: "#151515",
          border: "#242424",
          borderStrong: "#303030",
          text: "#F5F3EE",
          textSecondary: "#A5A29C",
          muted: "#6F6D68",
          white: "#FFFFFF",
          silver: "#C8C8C5",
          signal: "#E8E4DC",
          ivory: "#F5F3EE",
          green: "#54F58A",
          amber: "#FFB84D",
          red: "#FF5C70",
        },
        // Compatibility names for existing application components.
        polar: {
          navy: "#050505",
          deep: "#0A0A0A",
          midnight: "#070707",
          surface: "#101010",
          surfaceHover: "#151515",
          card: "#101010",
          border: "#242424",
          borderLight: "#303030",
          ice: "#C8C8C5",
          cyan: "#E8E4DC",
          teal: "#A8D5B5",
          snow: "#F5F3EE",
          muted: "#A5A29C",
          gold: "#E8E4DC",
          success: "#54F58A",
          warning: "#FFB84D",
          danger: "#FF5C70",
        },
        brand: {
          primary: "#F5F3EE",
          secondary: "#C8C8C5",
          accent: "#E8E4DC",
          teal: "#A8D5B5",
          dark: "#050505",
          panel: "#0A0A0A",
          card: "#101010",
          subtle: "#151515",
          text: "#F5F3EE",
          muted: "#A5A29C",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "Monaco", "Courier New", "monospace"],
      },
      boxShadow: {
        operational: "0 4px 20px -2px rgba(0, 0, 0, 0.9)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.8)",
        goldSubtle: "0 0 15px -3px rgba(232, 228, 220, 0.14)",
      },
      backgroundImage: {
        "editorial-gradient": "linear-gradient(180deg, #050505 0%, #080808 60%, #0C0C0C 100%)",
        "gold-subtle": "linear-gradient(135deg, #E8E4DC 0%, #A8D5B5 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
