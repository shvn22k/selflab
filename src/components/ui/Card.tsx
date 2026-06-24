import { type ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radius, spacing, elevation } from '@/theme/tokens';

interface CardProps extends ViewProps {
  children: ReactNode;
  padded?: boolean;
  /** subtle top-light gradient sheen */
  sheen?: boolean;
  /** accent border glow colour */
  glow?: string;
  radiusKey?: keyof typeof radius;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ children, padded = true, sheen = false, glow, radiusKey = 'xl', style, ...rest }: CardProps) {
  const r = radius[radiusKey];
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { borderRadius: r, padding: padded ? spacing.xl : 0 },
        elevation.card,
        glow ? { borderColor: glow, shadowColor: glow, shadowOpacity: 0.25, shadowRadius: 16 } : null,
        style as ViewStyle,
      ]}
    >
      {sheen && (
        <LinearGradient
          colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    overflow: 'hidden',
  },
});
