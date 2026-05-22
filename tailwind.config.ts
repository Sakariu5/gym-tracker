import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        surfaceAlt: '#1a1a1a',
        border: '#222222',
        borderAlt: '#333333',
        muted: '#8a8a8a',
        accent: '#22D3EE',
      },
      fontFamily: {
        sans: ['-apple-system', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
