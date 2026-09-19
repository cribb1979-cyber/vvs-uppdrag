// Modern, robust "verkstad"-känsla: stål/marinblått som bas, orange som
// signalfärg för handling/varning -- inte barnslig, hög kontrast för
// verkstadsmiljö/dagsljus.
const palette = {
  steel900: "#0F1B24",
  steel800: "#16242F",
  steel700: "#1F323F",
  steel600: "#2C4A5E",
  steel500: "#3D6579",
  steel100: "#EAF1F4",
  white: "#FFFFFF",
  orange500: "#E67E22",
  orange600: "#C96A16",
  green600: "#2E9E5B",
  yellow600: "#D4A017",
  red600: "#D64545",
  gray400: "#8A97A0",
  gray200: "#D6DEE2",
};

export default {
  light: {
    text: palette.steel900,
    background: palette.steel100,
    card: palette.white,
    border: palette.gray200,
    tint: palette.steel600,
    accent: palette.orange500,
    muted: palette.gray400,
    success: palette.green600,
    warning: palette.yellow600,
    danger: palette.red600,
    tabIconDefault: palette.gray400,
    tabIconSelected: palette.steel600,
  },
  dark: {
    text: palette.steel100,
    background: palette.steel900,
    card: palette.steel800,
    border: palette.steel700,
    tint: palette.orange500,
    accent: palette.orange500,
    muted: palette.gray400,
    success: palette.green600,
    warning: palette.yellow600,
    danger: palette.red600,
    tabIconDefault: palette.gray400,
    tabIconSelected: palette.orange500,
  },
};
