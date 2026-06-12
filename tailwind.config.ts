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
          dark: "#1A3D2B",
          mid: "#1A6B45",
          green: "#2F9B65",
          accent: "#3ACF84",
          light: "#A8E8C6",
          tint: "#D4F0E2",
          surface: "#EEF8F2",
          bg: "#F5FBF7",
        },
        status: {
          pending: "#F59E0B",
          overdue: "#D83C2E",
          draft: "#F0F0F0",
          completed: "#1A9960",
          success: "#1A9960",
          danger: "#D83C2E",
          warning: "#F59E0B",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#5A5A5A",
          tertiary: "#9A9A9A",
        },
      },
      borderRadius: {
        badge: "4px",
        small: "6px",
        medium: "8px",
        large: "12px",
        pill: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        base: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
