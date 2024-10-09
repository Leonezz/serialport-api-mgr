import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

const useColors = [
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
  "default",
];
const useSizes = ["small", "medium", "large"];
const config: Config = {
  safelist: [
    ...useColors.flatMap((v) => `before:bg-${v}`),
    ...useSizes.flatMap((v) => `text-${v}`),
  ],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
export default config;
