import { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { palette, radius, spacing } from '@/theme/tokens';

interface GlassCardProps {
  children: ReactNode;
  intensity?: number;
  padded?: boolean;
  radiusKey?: keyof typeof radius;
  style?: ViewStyle;
}

export function GlassCard({ children, intensity = 30, padded = true, radiusKey = 'xl', style }: GlassCardProps) {
  const r = radius[radiusKey];
  return (
    <View style={[{ borderRadius: r, overflow: 'hidden', borderWidth: 1, borderColor: palette.borderStrong }, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[{ backgroundColor: 'rgba(255,255,255,0.04)' }, padded && { padding: spacing.xl }]}>{children}</View>
    </View>
  );
}
