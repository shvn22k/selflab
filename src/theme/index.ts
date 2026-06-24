import { theme, type Theme } from './tokens';

/**
 * The app is intentionally dark-first and single-themed. `useTheme` returns the
 * shared token object so components never hard-code values and we keep a single
 * seam for future theming (e.g. a user-chosen accent colour).
 */
export function useTheme(): Theme {
  return theme;
}

export { theme };
export * from './tokens';
