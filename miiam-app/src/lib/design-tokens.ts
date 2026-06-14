export const colors = {
  brand: {
    primary: '#ba001c',
    primaryHover: '#a40017',
    primaryLight: '#ff7670',
    primaryLighter: '#ff5a57',
    primaryDark: '#8c1500',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#4e0006',
    secondary: '#0b50d5',
    secondaryHover: '#0044bf',
    secondaryLight: '#c4d0ff',
    secondaryLighter: '#b1c2ff',
    onSecondary: '#ffffff',
    tertiary: '#6c5a00',
    tertiaryLight: '#ffd709',
    onTertiary: '#453900',
  },
  surface: {
    neutral: '#ffffff',
    neutralHover: '#fafafa',
    neutralActive: '#f5f5f5',
    subtle: '#fff4f4',
    subtleHover: '#ffecee',
    variant: '#ffe1e4',
    container: '#ffecee',
    containerHover: '#ffe1e4',
  },
  dark: {
    surface: '#1a0f12',
    surfaceHover: '#24020a',
    surfaceActive: '#2d1018',
    neutral: '#24020a',
    neutralHover: '#3d1520',
    subtle: '#1a0f12',
    variant: '#3d1520',
    container: '#2d1018',
  },
  text: {
    primary: '#1a1a2e',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    onBrand: '#ffffff',
    onSurface: '#4d212a',
    onSurfaceVariant: '#814c55',
    onSurfaceVariantDark: '#dd9ca6',
  },
  border: {
    subtle: '#e5e7eb',
    default: '#dd9ca6',
    strong: '#a06770',
    focus: '#ba001c',
    error: '#ef4444',
    success: '#10b981',
  },
  status: {
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  overlay: {
    scrim: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(255, 255, 255, 0.8)',
    backdropDark: 'rgba(26, 15, 18, 0.8)',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const borderRadius = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.375rem',  // 6px
  DEFAULT: '0.5rem',   // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px',
} as const;

export const typography = {
  fontFamilies: {
    primary: '"Plus Jakarta Sans", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeights: {
    tight: '1.1',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  editorial: '0px 20px 40px rgba(77, 33, 42, 0.06)',
  editorialSm: '0px 10px 30px rgba(77, 33, 42, 0.04)',
  glow: '0 0 20px rgba(186, 0, 28, 0.3)',
  glowStrong: '0 0 30px rgba(186, 0, 28, 0.5)',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  slower: '500ms ease',
  spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

export const tokens = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  breakpoints,
  zIndex,
} as const;

export type Tokens = typeof tokens;
export type ColorTokens = typeof colors;
export type SpacingTokens = typeof spacing;
export type BorderRadiusTokens = typeof borderRadius;
export type TypographyTokens = typeof typography;
export type ShadowTokens = typeof shadows;
export type TransitionTokens = typeof transitions;
export type BreakpointTokens = typeof breakpoints;
export type ZIndexTokens = typeof zIndex;

function toCssVarName(path: string): string {
  return `--${path.replace(/\./g, '-')}`;
}

function flattenTokens(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newPrefix = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTokens(value, newPrefix));
    } else {
      result[toCssVarName(newPrefix)] = String(value);
    }
  }
  return result;
}

export const cssVariables = flattenTokens(tokens as Record<string, any>);

export function generateCssVariables(selector = ':root'): string {
  const vars = cssVariables;
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

export const lightThemeCss = generateCssVariables(':root');
export const darkThemeCss = generateCssVariables('.dark');

export default tokens;