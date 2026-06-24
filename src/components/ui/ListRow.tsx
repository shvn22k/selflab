import { type ReactNode } from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';

interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

export function ListRow({ title, subtitle, left, right, value, onPress, showChevron, style }: ListRowProps) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.row,
        onPress && pressed ? { backgroundColor: palette.surfaceElevated } : null,
        style,
      ]}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="textTertiary" style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="bodyMedium" color="textSecondary">
          {value}
        </Text>
      ) : null}
      {right}
      {showChevron ? <ChevronRight size={18} color={palette.textTertiary} /> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  left: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
