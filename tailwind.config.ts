import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        groww: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#00D09C",
          600: "#00B386",
          700: "#00966F",
        },
      },
    },
  },
  plugins: [],
};
export default config;
