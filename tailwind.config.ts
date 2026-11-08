import type { Config } from "tailwindcss";

// The passbook palette (8 Nov redesign): the neutrals lean towards ink navy, "emerald" is a settled teal for confirmed
// money (deliberately not Groww's mint), "blue" is a calm ink blue for steps still in progress.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14213D", soft: "#22325A" },
        paper: "#F1F3F6",
        gray: {
          50: "#F5F7FA",
          100: "#EAEEF3",
          200: "#DAE0E8",
          300: "#BCC5D1",
          400: "#66728A", // R45: 4.8:1 on white (was #8994A6, 3.1:1)
          500: "#5A6679", // R45: 5.2:1 on the paper background
          600: "#4A5569",
          700: "#364052",
          800: "#232C3D",
          900: "#14213D",
        },
        emerald: {
          50: "#EBF6F2",
          100: "#D2ECE3",
          200: "#A8D9C8",
          300: "#73C0A7",
          400: "#43A486",
          500: "#2A8A6E",
          600: "#1F7A63",
          700: "#1A6452",
          800: "#154F41",
          900: "#0F3A30",
        },
        blue: {
          50: "#EEF3FB",
          100: "#DCE6F7",
          200: "#BACDEF",
          300: "#8EAEE2",
          400: "#5F87CF",
          500: "#3F68BF",
          600: "#3157A8",
          700: "#29488C",
          800: "#223B72",
          900: "#1B2F5B",
        },
        groww: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#00D09C",
          600: "#00B386",
          700: "#00966F",
        },
      },
      borderRadius: { "4xl": "2rem" },
    },
  },
  plugins: [],
};
export default config;
