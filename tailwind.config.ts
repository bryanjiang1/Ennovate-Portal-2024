import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        "ennovate-main": "#003B6F",
        "ennovate-yellow": "#ffbc1c",
        "ennovate-gray": "#9c9c9c",
        "ennovate-dark-blue": "#273f80",
        "ennovate-member": "#213c87",
      },
    },
  },
  plugins: [],
};
export default config;
