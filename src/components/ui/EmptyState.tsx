import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { spacing, palette, radius } from '@/theme/tokens';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'], paddingHorizontal: spacing.xl, gap: spacing.md }}>
      {icon ? (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius['2xl'],
            backgroundColor: palette.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          {icon}
        </View>
      ) : null}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text variant="h3" align="center">
          {title}
        </Text>
        {description ? (
          <Text variant="body" color="textTertiary" align="center" style={{ maxWidth: 280 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
