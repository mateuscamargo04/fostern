import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#081D36",
        "deep-navy": "#122948",
        gold: "#D4AF37",
        ivory: "#FAF7F0",
        mist: "#E5E7EB",
        graphite: "#374151"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Arial", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
