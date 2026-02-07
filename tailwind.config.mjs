/** @type {import('tailwindcss').Config} */
const config = {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",     // Scan files in src/pages
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}", // Scan files in src/components (if you have this folder)
      "./src/styles/**/*.{css,js,ts,jsx,tsx,mdx}", // Important if you use @apply or define classes here that need to be seen
      // Or a more general catch-all for everything in src if you prefer:
      // "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          orbitron: ['Orbitron', 'monospace'],
          rajdhani: ['Rajdhani', 'sans-serif'],
        },
        colors: {
          'neon-cyan': '#00ffff',
          'neon-blue': '#0080ff',
          'neon-orange': '#ff6600',
          'neon-pink': '#ff0080',
        },
        // boxShadow: {
        //   'neon': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff, 0 0 20px #00ffff',
        //   'neon-selected': '0 0 20px #00ffff, inset 0 0 20px #00ffff, 0 0 40px #00ffff',
        // }
      },
    },
    plugins: [],
  };
  
  export default config;