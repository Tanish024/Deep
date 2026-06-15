/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        safe: "#16a34a",
        threat: "#dc2626",
        suspicious: "#d97706",
      },
    },
  },
  plugins: [],
};
