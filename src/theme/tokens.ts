/**
 * SelfLab design tokens — dark-first, athletic, premium.
 * A single source of truth for colour, type, spacing, radius and elevation.
 * Deliberately bespoke (electric-lime accent on warm charcoal) so the app
 * reads as a crafted product, not a stock template.
 */

export const palette = {
  // Base surfaces (warm near-black → elevated charcoal)
  bg: '#0A0B0E',
  bgElevated: '#101218',
  surface: '#15171F',
  surfaceElevated: '#1B1E28',
  surfaceHigh: '#23262F',

  // Hairlines
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',

  // Text
  text: '#F5F6F8',
  textSecondary: '#A4A8B2',
  textTertiary: '#6A6F7A',
  textInverse: '#0A0B0E',

  // Brand accent — electric lime (energy / move / calories)
  primary: '#BFF53C',
  primaryDim: '#9BCB2F',
  primarySoft: 'rgba(191,245,60,0.14)',

  // Supporting accents
  teal: '#36D6C8',
  cyan: '#3DD6F5',
  blue: '#5B8DEF',
  indigo: '#7C82F6',
  violet: '#9C7CF6',
  pink: '#FF4D8D',
  coral: '#FF6B6B',
  amber: '#FFB23E',
  emerald: '#34D399',

  // Semantic
  success: '#46D88B',
  warning: '#FBBF24',
  danger: '#F87171',

  // Domain colours
  calories: '#BFF53C',
  protein: '#FF6B6B',
  carbs: '#FFB23E',
  fat: '#9C7CF6',
  water: '#3DD6F5',
  sleep: '#7C82F6',
  steps: '#36D6C8',
  heart: '#FF4D8D',
  readiness: '#34D399',

  // Activity rings (Move / Exercise / Stand)
  ringMove: '#BFF53C',
  ringExercise: '#FF4D8D',
  ringStand: '#3DD6C8',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export const gradients = {
  primary: ['#D6FF5C', '#9BE82F'] as const,
  lime: ['#BFF53C', '#36D6C8'] as const,
  sunset: ['#FF6B6B', '#FFB23E'] as const,
  ocean: ['#3DD6F5', '#5B8DEF'] as const,
  twilight: ['#7C82F6', '#9C7CF6'] as const,
  ember: ['#FF4D8D', '#9C7CF6'] as const,
  card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] as const,
  dark: ['#15171F', '#0A0B0E'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 30,
  pill: 999,
} as const;

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_600SemiBold',
  heading: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'SpaceGrotesk_500Medium',
} as const;

export const fontSize = {
  hero: 40,
  display: 32,
  h1: 27,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  caption: 11.5,
} as const;

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  }),
} as const;

export const theme = {
  palette,
  gradients,
  spacing,
  radius,
  fonts,
  fontSize,
  elevation,
} as const;

export type Theme = typeof theme;
export type Palette = typeof palette;
