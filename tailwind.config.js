const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    corePlugins: {
      preflight: false
    },
    content: [
      './src/**/*.{html,js}',
      './index.html',
    ],
    theme: {
      extend: {
        screens: {
          'xs': '320px',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
        },
        spacing: {
          'safe-top': 'env(safe-area-inset-top)',
          'safe-bottom': 'env(safe-area-inset-bottom)',
          'safe-left': 'env(safe-area-inset-left)',
          'safe-right': 'env(safe-area-inset-right)',
          'grid-segment': 'var(--grid-segment)',
        }
      },
      colors: {
        primary: '#6750A4',
        onPrimary: colors.white,
        secondary: colors.purple[200],
        onSecondary: colors.white,
        tertiary: colors.purple[100],
        background: colors.white,
        onBackground: colors.black,
        onBackgroundVariant: colors.gray[500],
        onBackgroundVariant2: colors.gray[400],
        success: '#046C4E',
        onSuccess: colors.white,
        successContainer: '#DEF7EC',
        error: '#C81E1E',
        onError: colors.white,
        errorContainer: '#FDE8E8',
        scrim: 'rgba(0,0,0,0.4)',
        onScrim: colors.white,
        outline: '#71717A',
        red: '#DA5B65',
        blue: '#504F9C',
        yellow: '#DFCD5E',
        green: '#5CB94E',
        grey: colors.gray[400],
        error: '#B3261E',
        black: colors.black,
        white: colors.white
      },
    },
    plugins: [],
  }