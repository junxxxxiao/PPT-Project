import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212B",
        mist: "#F5F7FA",
        line: "#D9E0E8",
        coral: "#D55B4A",
        leaf: "#1D8A6F",
        gold: "#C79A31"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(23, 33, 43, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
