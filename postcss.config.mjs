// CORRECTED postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // Use this for Tailwind CSS v4
    'autoprefixer': {},         // For adding vendor prefixes
  },
};

export default config;