import { View } from 'react-native';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';

interface BadgeProps {
  label: string;
  color?: string;
  tone?: 'solid' | 'soft';
}

export function Badge({ label, color = palette.primary, tone = 'soft' }: BadgeProps) {
  const solid = tone === 'solid';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.sm,
        backgroundColor: solid ? color : `${color}22`,
      }}
    >
      <Text variant="caption" color={solid ? palette.textInverse : color} style={{ fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Text>
    </View>
  );
}
