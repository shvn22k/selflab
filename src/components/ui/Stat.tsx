import { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { spacing, palette } from '@/theme/tokens';

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  color?: string;
  align?: 'flex-start' | 'center';
  style?: ViewStyle;
}

export function Stat({ label, value, unit, icon, color = palette.text, align = 'flex-start', style }: StatProps) {
  return (
    <View style={[{ alignItems: align, gap: 2 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {icon}
        <Text variant="caption" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text variant="h2" color={color} style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" color="textSecondary">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
