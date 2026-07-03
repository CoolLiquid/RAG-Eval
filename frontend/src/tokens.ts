/** Design tokens — synced from design/tokens.md */

export const colors = {
  surface: '#fcf8ff',
  surfaceDim: '#dcd8e5',
  surfaceBright: '#fcf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f2ff',
  surfaceContainer: '#f0ecf9',
  surfaceContainerHigh: '#eae6f4',
  surfaceContainerHighest: '#e4e1ee',
  onSurface: '#1b1b24',
  onSurfaceVariant: '#464555',
  inverseSurface: '#302f39',
  inverseOnSurface: '#f3effc',
  outline: '#777587',
  outlineVariant: '#c7c4d8',
  surfaceTint: '#4d44e3',
  primary: '#3525cd',
  onPrimary: '#ffffff',
  primaryContainer: '#4f46e5',
  onPrimaryContainer: '#dad7ff',
  inversePrimary: '#c3c0ff',
  secondary: '#505f76',
  onSecondary: '#ffffff',
  secondaryContainer: '#d0e1fb',
  onSecondaryContainer: '#54647a',
  tertiary: '#7e3000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#a44100',
  onTertiaryContainer: '#ffd2be',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#e2dfff',
  primaryFixedDim: '#c3c0ff',
  onPrimaryFixed: '#0f0069',
  onPrimaryFixedVariant: '#3323cc',
  secondaryFixed: '#d3e4fe',
  secondaryFixedDim: '#b7c8e1',
  onSecondaryFixed: '#0b1c30',
  onSecondaryFixedVariant: '#38485d',
  tertiaryFixed: '#ffdbcc',
  tertiaryFixedDim: '#ffb695',
  onTertiaryFixed: '#351000',
  onTertiaryFixedVariant: '#7b2f00',
  background: '#fcf8ff',
  onBackground: '#1b1b24',
  surfaceVariant: '#e4e1ee',
} as const;

/** Semantic colors from design doc (not in token YAML) */
export const semantic = {
  success: '#16A34A',
  warning: '#D97706',
} as const;

export const typography = {
  displayLg: {
    fontFamily: 'Inter',
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 38,
    letterSpacing: '-0.02em',
  },
  headlineMd: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 32,
    letterSpacing: '-0.01em',
  },
  titleSm: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 28,
  },
  bodyBase: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 22,
  },
  bodySemibold: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 22,
  },
  labelSm: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 18,
  },
  monoCode: {
    fontFamily: 'JetBrains Mono',
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 20,
  },
} as const;

export const rounded = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  baseUnit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  containerMargin: 24,
  gutter: 16,
} as const;

export const fontFamily = {
  sans:
    '"Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

export const elevation = {
  card: '0 1px 3px rgba(15, 23, 42, 0.08)',
  overlay: '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
} as const;

export const layout = {
  sidebarWidth: 256,
  contentMaxWidth: 1440,
} as const;
