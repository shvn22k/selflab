import { type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  color?: string;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, icon, color = palette.primary, style }: ChipProps) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={
        onPress
          ? () => {
              Haptics.selectionAsync();
              onPress();
            }
          : undefined
      }
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: active ? color : palette.surfaceElevated,
          borderWidth: active ? 0 : 1,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      {icon}
      <Text variant="label" color={active ? palette.textInverse : palette.textSecondary}>
        {label}
      </Text>
    </Wrapper>
  );
}
