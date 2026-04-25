/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Surfaces
        "surface": "#0b1326",
        "surface-container": "#171f33",
        "surface-container-low": "#131b2e",
        "surface-container-high": "#222a3d",
        "surface-container-highest": "#2d3449",
        "surface-container-lowest": "#060e20",
        "surface-variant": "#2d3449",
        "surface-dim": "#0b1326",
        "surface-bright": "#31394d",
        "surface-tint": "#d2bbff",
        // Primary
        "primary": "#d2bbff",
        "primary-container": "#7c3aed",
        "primary-fixed": "#eaddff",
        "primary-fixed-dim": "#d2bbff",
        "on-primary": "#3f008e",
        "on-primary-fixed": "#25005a",
        "on-primary-fixed-variant": "#5a00c6",
        "on-primary-container": "#ede0ff",
        "inverse-primary": "#732ee4",
        // Secondary (gold)
        "secondary": "#ffe083",
        "secondary-container": "#eec200",
        "secondary-fixed": "#ffe083",
        "secondary-fixed-dim": "#eec200",
        "on-secondary": "#3c2f00",
        "on-secondary-container": "#645000",
        "on-secondary-fixed": "#231b00",
        "on-secondary-fixed-variant": "#574500",
        // Tertiary (green)
        "tertiary": "#4de082",
        "tertiary-container": "#00773b",
        "tertiary-fixed": "#6dfe9c",
        "tertiary-fixed-dim": "#4de082",
        "on-tertiary": "#003919",
        "on-tertiary-container": "#84ffa6",
        "on-tertiary-fixed": "#00210c",
        "on-tertiary-fixed-variant": "#005227",
        // Content
        "on-surface": "#dae2fd",
        "on-surface-variant": "#ccc3d8",
        "on-background": "#dae2fd",
        "inverse-surface": "#dae2fd",
        "inverse-on-surface": "#283044",
        // Outline
        "outline": "#958da1",
        "outline-variant": "#4a4455",
        // Error
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        // Background
        "background": "#0b1326",
        // Legacy aliases
        "card": "#222a3d",
        "textPrimary": "#dae2fd",
        "textMuted": "#ccc3d8",
        "gold": "#ffe083",
        "success": "#4de082",
        "danger": "#ffb4ab",
      },
      fontFamily: {
        headline: ['PlusJakartaSans_700Bold', 'PlusJakartaSans_800ExtraBold'],
        body: ['Nunito_400Regular', 'Nunito_500Medium', 'Nunito_700Bold'],
        display: ['FredokaOne_400Regular'],
        inter: ['Nunito_400Regular'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
