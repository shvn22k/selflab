import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { fonts, fontSize, palette } from '@/theme/tokens';

type Variant =
  | 'hero'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyMedium'
  | 'bodySemibold'
  | 'label'
  | 'caption'
  | 'mono';

type Color = keyof typeof palette | string;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: Color;
  align?: TextStyle['textAlign'];
  italic?: boolean;
  /** letter-spacing override */
  tracking?: number;
}

const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: fontSize.hero, lineHeight: fontSize.hero * 1.05, letterSpacing: -1 },
  display: { fontFamily: fonts.display, fontSize: fontSize.display, lineHeight: fontSize.display * 1.1, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.heading, fontSize: fontSize.h1, lineHeight: fontSize.h1 * 1.15, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, fontSize: fontSize.h2, lineHeight: fontSize.h2 * 1.2, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.displayMedium, fontSize: fontSize.h3, lineHeight: fontSize.h3 * 1.25 },
  body: { fontFamily: fonts.body, fontSize: fontSize.body, lineHeight: fontSize.body * 1.45 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: fontSize.body, lineHeight: fontSize.body * 1.45 },
  bodySemibold: { fontFamily: fonts.bodySemibold, fontSize: fontSize.body, lineHeight: fontSize.body * 1.4 },
  label: { fontFamily: fonts.bodySemibold, fontSize: fontSize.small, lineHeight: fontSize.small * 1.3 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: fontSize.caption, lineHeight: fontSize.caption * 1.35, letterSpacing: 0.3 },
  mono: { fontFamily: fonts.mono, fontSize: fontSize.body, letterSpacing: 0.5 },
};

function resolveColor(color?: Color): string {
  if (!color) return palette.text;
  if (color in palette) return palette[color as keyof typeof palette] as string;
  return color;
}

export function Text({ variant = 'body', color, align, italic, tracking, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        VARIANTS[variant],
        { color: resolveColor(color) },
        align ? { textAlign: align } : null,
        italic ? { fontStyle: 'italic' } : null,
        tracking != null ? { letterSpacing: tracking } : null,
        style,
      ]}
    />
  );
}
