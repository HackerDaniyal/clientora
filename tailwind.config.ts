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
          dark: "#1A3C34",
          mid: "#22543D",
          accent: "#8BC38A",
          light: "#D4EDD4",
          surface: "#EEF8EE",
          active: "#1A3C34",
        },
        status: {
          pending: "#E8C75A",
          overdue: "#E05252",
          draft: "#F0F0EE",
          completed: "#22543D",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#555555",
          tertiary: "#999999",
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
    },
  },
  plugins: [],
};
export default config;
