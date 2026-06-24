import { type ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Text';
import { spacing, palette } from '@/theme/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onActionPress?: () => void;
  actionLabel?: string;
}

export function SectionHeader({ title, subtitle, action, onActionPress, actionLabel }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        marginTop: spacing.xs,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="textTertiary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ??
        (actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Text variant="label" color={palette.primary}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null)}
    </View>
  );
}
