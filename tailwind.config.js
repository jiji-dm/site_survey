/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand purple (#512376) を中心としたスケール
        brand: {
          50:  '#f5f1f9',
          100: '#ebe1f3',
          200: '#d4bee5',
          300: '#b596d2',
          400: '#9069bd',
          500: '#7044a4',
          600: '#5d3290',
          700: '#512376', // ← 基調カラー
          800: '#3f1b5c',
          900: '#2e1342',
          950: '#1c0a29',
        },
        ink: {
          DEFAULT: '#1a1424',
          muted:   '#5b5167',
          subtle:  '#8a8295',
        },
        surface: {
          DEFAULT: '#ffffff',
          alt:     '#faf8fc',
          border:  '#ece6f2',
        },
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 14, 30, 0.04), 0 4px 16px rgba(81, 35, 118, 0.06)',
        pop:  '0 10px 30px rgba(81, 35, 118, 0.18)',
      },
    },
  },
  plugins: [],
}
