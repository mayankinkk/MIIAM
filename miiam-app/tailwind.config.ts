import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {},
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.375rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        label: ["Plus Jakarta Sans", "sans-serif"],
        "display-hero": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-xl": ["Plus Jakarta Sans", "sans-serif"],
        "label-caps": ["Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        "label-caps": ["10px", { lineHeight: "1.0", letterSpacing: "0.3em", fontWeight: "900" }],
        "body-md": ["1rem", { lineHeight: "1.5", fontWeight: "500" }],
        "body-lg": ["1.25rem", { lineHeight: "1.6", fontWeight: "600" }],
        "headline-md": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "900" }],
        "headline-xl": ["3rem", { lineHeight: "1.0", letterSpacing: "-0.02em", fontWeight: "800" }],
      },
      boxShadow: {
        editorial: "0px 20px 40px rgba(77, 33, 42, 0.06)",
        "editorial-sm": "0px 10px 30px rgba(77, 33, 42, 0.04)",
      },
      keyframes: {
        moveRider: {
          "0%": { offsetDistance: "0%" },
          "100%": { offsetDistance: "100%" },
        },
        slideIn: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        fadeOutDelayed: {
          "0%, 80%": { opacity: "1" },
          "100%": { opacity: "0", visibility: "hidden" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        moveRider: "moveRider 10s linear infinite",
        slideIn: "slideIn 0.5s ease-out",
        slideUp: "slideUp 0.5s ease-out",
        scaleIn: "scaleIn 0.5s ease-out",
        "fade-out-delayed": "fadeOutDelayed 2s forwards",
        "bounce-in": "bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
