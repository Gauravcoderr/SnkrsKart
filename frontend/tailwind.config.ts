import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-bebas)", "sans-serif"],
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-up": "slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-bottom": "slideInBottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        shake: "shake 0.4s ease-in-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "slide-down": "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "modal-in": "modalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "modal-up": "modalUp 0.48s cubic-bezier(0.16, 1, 0.3, 1)",
        "backdrop-in": "backdropIn 0.25s ease-out",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInUp: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInBottom: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Modal-specific — no translate conflict since modal uses margin:auto centering
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        modalUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        backdropIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
