import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        "neon-gradient": "linear-gradient(to right, #00f260, #0575e6)",
        "sky-gradient": "linear-gradient(to right, #00c9ff, #92fe9d)",
      },
      colors: {
        'neon-blue': '#08f7fe',
        'neon-pink': '#fe53bb',
        'dark-purple': '#1a103c',
        'dark-blue': '#12122d',
      },
      boxShadow: {
        'neon-blue': '0 0 5px #08f7fe, 0 0 20px #08f7fe',
        'neon-pink': '0 0 5px #fe53bb, 0 0 20px #fe53bb',
      }
    },
  },
  plugins: [],
};
export default config; 