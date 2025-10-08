// client/tailwind.config.js (Content is the same)
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Ensure it looks for tsx files now!
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        'pi-bg': '#4B0082', 
        'pi-accent': '#6f30a0', 
        'pi-green-alt': '#418a2f', 
      },
    },
  },
  plugins: [],
}