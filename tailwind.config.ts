import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        /** Matches globals.css --page-bg; use for full-page shells (cards stay bg-white). */
        page: "var(--page-bg)"
      }
    }
  },
  plugins: []
};

export default config;

