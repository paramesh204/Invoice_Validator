/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#131921", light: "#232f3e" },
        amber: { brand: "#febd69", deep: "#f3a847" },
        accent: "#ff9900",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
