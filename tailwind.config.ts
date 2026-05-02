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
        // Plant status colors — high contrast for sunlight readability
        status: {
          good: "#16a34a",       // Green-600
          medium: "#ca8a04",     // Yellow-600
          replace: "#dc2626",    // Red-600
          nogrowth: "#6b7280",   // Gray-500
          pest: "#ea580c",       // Orange-600
        },
        farm: {
          green: "#15803d",      // Primary brand
          "green-light": "#dcfce7",
          "green-dark": "#14532d",
          earth: "#78350f",
          "earth-light": "#fef3c7",
          cream: "#fefce8",
        },
        sync: {
          synced: "#16a34a",
          pending: "#ca8a04",
          failed: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Kannada", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      // Large touch targets per Apple/Material guidelines
      spacing: {
        "touch": "44px",
        "touch-lg": "56px",
      },
    },
  },
  plugins: [],
};

export default config;
