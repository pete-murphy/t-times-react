/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "in-out": "in-out 3s ease-in-out infinite",
      },
      keyframes: {
        "in-out": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.8)" },
        },
      },
    },
    fontFamily: { sans: ["Public Sans"] },
  },
  plugins: [require("tailwindcss-animate")],
};
