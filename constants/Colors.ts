// Design tokens extracted from modelo.html
// These replace the old flat Colors object
export const Colors = {
  // Surfaces
  surface: '#0b1326',
  surfaceContainer: '#171f33',
  surfaceContainerLow: '#131b2e',
  surfaceContainerHigh: '#222a3d',
  surfaceContainerHighest: '#2d3449',
  surfaceContainerLowest: '#060e20',
  surfaceVariant: '#2d3449',
  surfaceDim: '#0b1326',
  surfaceBright: '#31394d',

  // Primary (purple)
  primary: '#d2bbff',           // lilac — text/icon on dark
  primaryContainer: '#7c3aed',  // rich purple — button backgrounds
  primaryFixed: '#eaddff',
  primaryFixedDim: '#d2bbff',
  onPrimary: '#3f008e',
  onPrimaryFixed: '#25005a',
  onPrimaryFixedVariant: '#5a00c6',
  onPrimaryContainer: '#ede0ff',
  inversePrimary: '#732ee4',

  // Secondary (gold)
  secondary: '#ffe083',
  secondaryContainer: '#eec200',
  secondaryFixed: '#ffe083',
  secondaryFixedDim: '#eec200',
  onSecondary: '#3c2f00',
  onSecondaryContainer: '#645000',
  onSecondaryFixed: '#231b00',
  onSecondaryFixedVariant: '#574500',

  // Tertiary (green)
  tertiary: '#4de082',
  tertiaryContainer: '#00773b',
  tertiaryFixed: '#6dfe9c',
  tertiaryFixedDim: '#4de082',
  onTertiary: '#003919',
  onTertiaryContainer: '#84ffa6',
  onTertiaryFixed: '#00210c',
  onTertiaryFixedVariant: '#005227',

  // Text / Surface content
  onSurface: '#dae2fd',
  onSurfaceVariant: '#ccc3d8',
  onBackground: '#dae2fd',
  inverseSurface: '#dae2fd',
  inverseOnSurface: '#283044',

  // Outline
  outline: '#958da1',
  outlineVariant: '#4a4455',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onErrorContainer: '#ffdad6',

  // Background
  background: '#0b1326',

  // Surface tint
  surfaceTint: '#d2bbff',

  // Legacy aliases used in existing components (keep for backwards compat)
  card: '#222a3d',
  textPrimary: '#dae2fd',
  textMuted: '#ccc3d8',
  gold: '#ffe083',
  success: '#4de082',
  danger: '#ffb4ab',
};
